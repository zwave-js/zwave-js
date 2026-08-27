import { EncapsulationFlags } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { BasicCCSet } from "../cc/BasicCC.js";
import { MultiCommandCC } from "../cc/MultiCommandCC.js";
import { SupervisionCC } from "../cc/SupervisionCC.js";
import { CommandRelation, getCommandRelation } from "./CommandClass.js";

class RelatedBasicCCSet extends BasicCCSet {
	public override getRelationTo(other: BasicCCSet): CommandRelation {
		if (!(other instanceof BasicCCSet)) {
			return CommandRelation.Unrelated;
		}
		return this.targetValue === other.targetValue
			? CommandRelation.Redundant
			: CommandRelation.Supersedes;
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
				new BasicCCSet({ nodeId: 2, targetValue: 1 }),
				createSet(1),
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
			createSet(1, { nodeId: 3 }),
			createSet(1),
			"different node targets",
		],
		[
			createSet(1, { endpointIndex: 1 }),
			createSet(1),
			"different endpoints",
		],
		[
			createSet(1, {
				encapsulationFlags: EncapsulationFlags.Security,
			}),
			createSet(1),
			"different encapsulation flags",
		],
	])("returns unrelated for %s", (newer, older) => {
		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Unrelated,
		);
	});

	test("ignores generated fields on single-command wrappers", () => {
		const newer = SupervisionCC.encapsulate(createSet(1), 2);
		const older = SupervisionCC.encapsulate(createSet(1), 1);
		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Redundant,
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
