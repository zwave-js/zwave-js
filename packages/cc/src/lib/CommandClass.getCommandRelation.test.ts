import { EncapsulationFlags } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { BasicCCGet, BasicCCSet } from "../cc/BasicCC.js";
import { BinarySwitchCCSet } from "../cc/BinarySwitchCC.js";
import { MultiCommandCC } from "../cc/MultiCommandCC.js";
import { CommandRelation, getCommandRelation } from "./CommandClass.js";

// Basic Set supplies the smallest command payload needed for relation semantics
class RelatedBasicCCSet extends BasicCCSet {
	protected override determineRelation(other: BasicCCSet): CommandRelation {
		if (!(other instanceof BasicCCSet)) {
			return CommandRelation.Unrelated;
		}
		return this.targetValue === other.targetValue
			? CommandRelation.Redundant
			: CommandRelation.Supersedes;
	}
}

// This helper verifies that relations between different commands are supported
class CrossCommandBasicCCSet extends BasicCCSet {
	protected override determineRelation(other: BasicCCGet): CommandRelation {
		return other instanceof BasicCCGet
			? CommandRelation.Supersedes
			: CommandRelation.Unrelated;
	}
}

function createSet(
	targetValue: number,
	options: {
		nodeId?: number | [number, number, ...number[]];
		endpointIndex?: number;
		encapsulationFlags?: EncapsulationFlags;
	} = {},
): RelatedBasicCCSet {
	const command = new RelatedBasicCCSet({
		nodeId: options.nodeId ?? 2,
		endpointIndex: options.endpointIndex,
		targetValue,
	});
	command.encapsulationFlags = options.encapsulationFlags
		?? EncapsulationFlags.None;
	return command;
}

describe("getCommandRelation", () => {
	test("uses the newer command's relation override", () => {
		expect(getCommandRelation(createSet(1), createSet(1))).toBe(
			CommandRelation.Redundant,
		);
		expect(getCommandRelation(createSet(2), createSet(1))).toBe(
			CommandRelation.Supersedes,
		);
		expect(
			getCommandRelation(
				createSet(1),
				new BasicCCSet({ nodeId: 2, targetValue: 1 }),
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new BasicCCSet({ nodeId: 2, targetValue: 1 }),
				createSet(1),
			),
		).toBe(CommandRelation.Unrelated);
	});

	test("allows same-CC cross-command opt-in", () => {
		const newer = new CrossCommandBasicCCSet({
			nodeId: 2,
			targetValue: 1,
		});
		const older = new BasicCCGet({ nodeId: 2 });

		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Supersedes,
		);
	});

	test("rejects relations between different CCs", () => {
		expect(
			getCommandRelation(
				createSet(1),
				new BinarySwitchCCSet({
					nodeId: 2,
					targetValue: true,
				}),
			),
		).toBe(CommandRelation.Unrelated);
	});

	test("compares multicast targets as sets", () => {
		expect(
			getCommandRelation(
				createSet(1, { nodeId: [2, 3] }),
				createSet(1, { nodeId: [3, 2] }),
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				createSet(1, { nodeId: [2, 3] }),
				createSet(1, { nodeId: [2, 4] }),
			),
		).toBe(CommandRelation.Unrelated);
	});

	test.each([
		[
			"different node targets",
			createSet(1, { nodeId: 3 }),
			createSet(1),
		],
		[
			"different endpoints",
			createSet(1, { endpointIndex: 1 }),
			createSet(1),
		],
		[
			"different encapsulation flags",
			createSet(1, {
				encapsulationFlags: EncapsulationFlags.Security,
			}),
			createSet(1),
		],
	])("returns unrelated for %s", (_label, newer, older) => {
		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Unrelated,
		);
	});

	test("returns unrelated for multi-command encapsulation", () => {
		const newer = MultiCommandCC.encapsulate([
			createSet(1),
			createSet(2),
		]);
		const older = MultiCommandCC.encapsulate([
			createSet(1),
			createSet(2),
		]);
		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Unrelated,
		);
	});
});
