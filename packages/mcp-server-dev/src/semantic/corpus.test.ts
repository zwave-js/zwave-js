import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getCheckout } from "../checkout.js";

import {
	buildCorpus,
	buildSemanticText,
	extractSemantics,
	extractStructure,
} from "./corpus.js";

describe("extractSemantics", () => {
	it("extracts label/description/unit/$purpose/option labels", () => {
		const semantics = extractSemantics({
			label: "Ramp rate",
			description: "Controls the dimming ramp rate",
			unit: "seconds",
			$purpose: "dimming.ramp_rate",
			options: [
				{ value: 0, label: "Instant" },
				{ value: 1, label: "Slow" },
			],
		});
		expect(semantics).toEqual({
			label: "Ramp rate",
			description: "Controls the dimming ramp rate",
			unit: "seconds",
			purpose: "dimming.ramp_rate",
			optionLabels: ["Instant", "Slow"],
		});
	});

	it("leaves fields undefined when absent or of the wrong type", () => {
		const semantics = extractSemantics({
			label: 42,
			options: "not-an-array",
		});
		expect(semantics.label).toBeUndefined();
		expect(semantics.description).toBeUndefined();
		expect(semantics.unit).toBeUndefined();
		expect(semantics.purpose).toBeUndefined();
		expect(semantics.optionLabels).toEqual([]);
	});

	it("ignores malformed option entries", () => {
		const semantics = extractSemantics({
			options: [
				{ value: 0, label: "Ok" },
				{ value: "not-a-number", label: "Bad value" },
				{ value: 1, label: 123 },
				"not-an-object",
			],
		});
		expect(semantics.optionLabels).toEqual(["Ok"]);
	});
});

describe("extractStructure", () => {
	it("extracts size/range/default/unsigned/flags/options", () => {
		const structure = extractStructure({
			valueSize: 1,
			minValue: 0,
			maxValue: 99,
			defaultValue: 5,
			unsigned: true,
			readOnly: true,
			allowManualEntry: false,
			options: [{ value: 0, label: "Off" }],
		});
		expect(structure).toEqual({
			valueSize: 1,
			minValue: 0,
			maxValue: 99,
			defaultValue: 5,
			unsigned: true,
			readOnly: true,
			writeOnly: false,
			allowManualEntry: false,
			options: [{ value: 0, label: "Off" }],
		});
	});

	it("defaults readOnly/writeOnly to false rather than undefined", () => {
		const structure = extractStructure({});
		expect(structure.readOnly).toBe(false);
		expect(structure.writeOnly).toBe(false);
		expect(structure.options).toEqual([]);
	});
});

describe("buildSemanticText", () => {
	it("joins human-facing fields while excluding $purpose from the embedding", () => {
		const text = buildSemanticText({
			label: "Ramp rate",
			description: "Controls the dimming ramp rate",
			unit: "seconds",
			purpose: "dimming.ramp_rate",
			optionLabels: ["Instant", "Slow"],
		});
		expect(text).toBe(
			"Parameter concept: Ramp rate. Parameter concept: Ramp rate. "
				+ "Controls the dimming ramp rate. "
				+ "Unit: seconds. Options: Instant, Slow. "
				+ "Parameter concept: Ramp rate",
		);
	});

	it("is deterministic across two semantically-identical inputs with different key order", () => {
		const a = buildSemanticText({
			label: "Ramp rate",
			optionLabels: [],
		});
		const b = buildSemanticText({
			optionLabels: [],
			label: "Ramp rate",
		});
		expect(a).toBe(b);
	});

	it("omits absent fields instead of emitting empty segments", () => {
		const text = buildSemanticText({ optionLabels: [] });
		expect(text).toBe("");
	});
});

describe("buildCorpus", () => {
	async function createCheckout(
		root: string,
		files: Record<string, unknown>,
	): Promise<void> {
		await mkdir(join(root, "packages/config"), { recursive: true });
		await writeFile(
			join(root, "packages/config/package.json"),
			JSON.stringify({ name: "@zwave-js/config" }),
		);
		for (const [file, content] of Object.entries(files)) {
			const path = join(root, "packages/config/config/devices", file);
			await mkdir(join(path, ".."), { recursive: true });
			await writeFile(path, JSON.stringify(content));
		}
	}

	function device(params: Record<string, unknown>[]) {
		return {
			manufacturer: "Test",
			manufacturerId: "0x0001",
			label: "T1",
			description: "Test device",
			devices: [{ productType: "0x0001", productId: "0x0001" }],
			paramInformation: params,
		};
	}

	it("indexes only the given checkout and resolves imports within it", async () => {
		const tmp = await realpath(
			await mkdtemp(join(tmpdir(), "zwave-dev-corpus-")),
		);
		try {
			const mainRoot = join(tmp, "master");
			const worktreeRoot = join(mainRoot, ".claude/worktrees/feature");
			const importedParam = {
				"#": "1",
				$import: "~/templates/master_template.json#timeout",
			};
			await createCheckout(mainRoot, {
				"templates/master_template.json": {
					timeout: { label: "Timeout", valueSize: 1 },
				},
				"0x0001/t1.json": device([importedParam]),
			});
			await createCheckout(worktreeRoot, {
				"templates/master_template.json": {
					timeout: { label: "Auto-off timeout", valueSize: 2 },
				},
				"0x0001/t1.json": device([
					importedParam,
					{ "#": "2", label: "Worktree only", valueSize: 1 },
				]),
			});
			const main = (await getCheckout(mainRoot))!;
			const worktree = (await getCheckout(worktreeRoot))!;

			const mainCorpus = await buildCorpus(main);
			expect(mainCorpus.warnings).toEqual([]);
			expect(
				mainCorpus.parameters.map((p) => [p.semantics.label, p.file]),
			).toEqual([["Timeout", join(main.devicesDir, "0x0001/t1.json")]]);

			const worktreeCorpus = await buildCorpus(worktree);
			expect(worktreeCorpus.warnings).toEqual([]);
			expect(
				worktreeCorpus.parameters.map((p) => [
					p.semantics.label,
					p.file,
					p.templateFile,
				]),
			).toEqual([
				[
					"Auto-off timeout",
					join(worktree.devicesDir, "0x0001/t1.json"),
					join(worktree.devicesDir, "templates/master_template.json"),
				],
				[
					"Worktree only",
					join(worktree.devicesDir, "0x0001/t1.json"),
					undefined,
				],
			]);
			expect(worktreeCorpus.templates).toMatchObject([
				{ templateName: "timeout", referenceCount: 1 },
			]);
		} finally {
			await rm(tmp, { recursive: true, force: true });
		}
	});
});
