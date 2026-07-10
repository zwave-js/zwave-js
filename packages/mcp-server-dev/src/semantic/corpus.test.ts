import { describe, expect, it } from "vitest";
import {
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
