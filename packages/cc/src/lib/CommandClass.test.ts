import { EncapsulationFlags } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { BasicCCGet, BasicCCSet } from "../cc/BasicCC.js";
import { BinarySwitchCCSet } from "../cc/BinarySwitchCC.js";
import { CRC16CC } from "../cc/CRC16CC.js";
import {
	MultiChannelCC,
	MultiChannelCCCommandEncapsulation,
	MultiChannelCCV1CommandEncapsulation,
} from "../cc/MultiChannelCC.js";
import { MultiCommandCC } from "../cc/MultiCommandCC.js";
import { Security2CC } from "../cc/Security2CC.js";
import { SecurityCC } from "../cc/SecurityCC.js";
import { SupervisionCC } from "../cc/SupervisionCC.js";
import { CommandRelation, getCommandRelation } from "./CommandClass.js";

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

	test("recurses through transparent nested wrappers", () => {
		const newer = CRC16CC.encapsulate(
			SecurityCC.encapsulate(
				1,
				{} as Parameters<typeof SecurityCC.encapsulate>[1],
				SupervisionCC.encapsulate(createSet(1), 2),
			),
		);
		const older = CRC16CC.encapsulate(
			SecurityCC.encapsulate(
				1,
				{} as Parameters<typeof SecurityCC.encapsulate>[1],
				SupervisionCC.encapsulate(createSet(1), 1),
			),
		);

		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Redundant,
		);
	});

	test("preserves Multi Channel destinations while unwrapping", () => {
		const newer = MultiChannelCC.encapsulate(
			createSet(1, { endpointIndex: 2 }),
		);
		const older = MultiChannelCC.encapsulate(
			createSet(1, { endpointIndex: 1 }),
		);

		expect(newer.endpointIndex).toBe(0);
		expect(older.endpointIndex).toBe(0);
		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Unrelated,
		);
	});

	test("compares Multi Channel destination bit masks as sets", () => {
		const newer = new MultiChannelCCCommandEncapsulation({
			nodeId: 2,
			destination: [1, 2],
			encapsulated: createSet(1),
		});
		const older = new MultiChannelCCCommandEncapsulation({
			nodeId: 2,
			destination: [2, 1],
			encapsulated: createSet(1),
		});

		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Redundant,
		);
	});

	test("recurses through Multi Channel V1 encapsulation", () => {
		const newer = new MultiChannelCCV1CommandEncapsulation({
			nodeId: 2,
			endpointIndex: 1,
			encapsulated: createSet(1),
		});
		const older = new MultiChannelCCV1CommandEncapsulation({
			nodeId: 2,
			endpointIndex: 1,
			encapsulated: createSet(1),
		});

		expect(getCommandRelation(newer, older)).toBe(
			CommandRelation.Redundant,
		);
	});

	test("preserves S2 multicast targets and groups while unwrapping", () => {
		const securityManagers = {} as Parameters<
			typeof Security2CC.encapsulate
		>[2];
		const differentTargets = [
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 4] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
		];
		const differentGroups = [
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{ multicastGroupId: 2 },
			),
		];
		const sameGroupAndTargets = [
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
			Security2CC.encapsulate(
				createSet(1, { nodeId: [3, 2] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
		];
		const differentMulticastExtensions = [
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{ multicastGroupId: 1 },
			),
			Security2CC.encapsulate(
				createSet(1, { nodeId: [2, 3] }),
				1,
				securityManagers,
				{
					multicastGroupId: 1,
					multicastOutOfSync: true,
				},
			),
		];

		expect(differentTargets[0].nodeId).toBe(
			differentTargets[1].nodeId,
		);
		expect(
			getCommandRelation(differentTargets[0], differentTargets[1]),
		).toBe(CommandRelation.Unrelated);
		expect(
			getCommandRelation(differentGroups[0], differentGroups[1]),
		).toBe(CommandRelation.Unrelated);
		expect(
			getCommandRelation(
				sameGroupAndTargets[0],
				sameGroupAndTargets[1],
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				differentMulticastExtensions[0],
				differentMulticastExtensions[1],
			),
		).toBe(CommandRelation.Unrelated);
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
