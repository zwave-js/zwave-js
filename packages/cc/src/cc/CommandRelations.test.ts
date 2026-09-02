import { Duration, UNKNOWN_STATE } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { CommandRelation, getCommandRelation } from "../lib/CommandClass.js";
import { ThermostatSetpointType } from "../lib/_Types.js";
import { BasicCCGet, BasicCCReport, BasicCCSet } from "./BasicCC.js";
import {
	BinarySwitchCCGet,
	BinarySwitchCCReport,
	BinarySwitchCCSet,
} from "./BinarySwitchCC.js";
import {
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCStartLevelChange,
} from "./MultilevelSwitchCC.js";
import {
	ThermostatSetpointCCGet,
	ThermostatSetpointCCReport,
	ThermostatSetpointCCSet,
} from "./ThermostatSetpointCC.js";

const nodeId = 2;

describe("Basic CC command relations", () => {
	test("repeated Gets are redundant", () => {
		expect(
			getCommandRelation(
				new BasicCCGet({ nodeId }),
				new BasicCCGet({ nodeId }),
			),
		).toBe(CommandRelation.Redundant);
	});

	test("Sets are redundant for the same target and supersede for a different target", () => {
		expect(
			getCommandRelation(
				new BasicCCSet({ nodeId, targetValue: 40 }),
				new BasicCCSet({ nodeId, targetValue: 40 }),
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new BasicCCSet({ nodeId, targetValue: 99 }),
				new BasicCCSet({ nodeId, targetValue: 40 }),
			),
		).toBe(CommandRelation.Supersedes);
	});

	test("Reports compare current value, target value, and duration", () => {
		const older = new BasicCCReport({
			nodeId,
			currentValue: 40,
			targetValue: 99,
			duration: new Duration(2, "seconds"),
		});
		const identical = new BasicCCReport({
			nodeId,
			currentValue: 40,
			targetValue: 99,
			duration: new Duration(2, "seconds"),
		});
		expect(getCommandRelation(identical, older)).toBe(
			CommandRelation.Redundant,
		);

		for (
			const newer of [
				new BasicCCReport({
					nodeId,
					currentValue: 41,
					targetValue: 99,
					duration: new Duration(2, "seconds"),
				}),
				new BasicCCReport({
					nodeId,
					currentValue: 40,
					targetValue: 98,
					duration: new Duration(2, "seconds"),
				}),
				new BasicCCReport({
					nodeId,
					currentValue: 40,
					targetValue: 99,
					duration: new Duration(3, "seconds"),
				}),
			]
		) {
			expect(getCommandRelation(newer, older)).toBe(
				CommandRelation.Supersedes,
			);
		}
	});

	test("Reports distinguish unknown and omitted values", () => {
		const unknown = new BasicCCReport({
			nodeId,
			currentValue: UNKNOWN_STATE,
			targetValue: UNKNOWN_STATE,
			duration: Duration.unknown(),
		});
		expect(
			getCommandRelation(
				new BasicCCReport({
					nodeId,
					currentValue: UNKNOWN_STATE,
					targetValue: UNKNOWN_STATE,
					duration: Duration.unknown(),
				}),
				unknown,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new BasicCCReport({ nodeId }),
				unknown,
			),
		).toBe(CommandRelation.Supersedes);
	});
});

describe("Binary Switch CC command relations", () => {
	test("repeated Gets are redundant", () => {
		expect(
			getCommandRelation(
				new BinarySwitchCCGet({ nodeId }),
				new BinarySwitchCCGet({ nodeId }),
			),
		).toBe(CommandRelation.Redundant);
	});

	test("Sets compare target value and duration", () => {
		const older = new BinarySwitchCCSet({
			nodeId,
			targetValue: false,
			duration: new Duration(2, "seconds"),
		});
		expect(
			getCommandRelation(
				new BinarySwitchCCSet({
					nodeId,
					targetValue: false,
					duration: new Duration(2, "seconds"),
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new BinarySwitchCCSet({
					nodeId,
					targetValue: true,
					duration: new Duration(2, "seconds"),
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
		expect(
			getCommandRelation(
				new BinarySwitchCCSet({
					nodeId,
					targetValue: false,
					duration: new Duration(3, "seconds"),
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
	});

	test("an omitted Set duration equals the default duration", () => {
		expect(
			getCommandRelation(
				new BinarySwitchCCSet({
					nodeId,
					targetValue: true,
					duration: Duration.default(),
				}),
				new BinarySwitchCCSet({
					nodeId,
					targetValue: true,
				}),
			),
		).toBe(CommandRelation.Redundant);
	});

	test("Reports compare current value, target value, and duration", () => {
		const older = new BinarySwitchCCReport({
			nodeId,
			currentValue: false,
			targetValue: true,
			duration: new Duration(2, "seconds"),
		});
		expect(
			getCommandRelation(
				new BinarySwitchCCReport({
					nodeId,
					currentValue: false,
					targetValue: true,
					duration: new Duration(2, "seconds"),
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);

		for (
			const newer of [
				new BinarySwitchCCReport({
					nodeId,
					currentValue: true,
					targetValue: true,
					duration: new Duration(2, "seconds"),
				}),
				new BinarySwitchCCReport({
					nodeId,
					currentValue: false,
					targetValue: false,
					duration: new Duration(2, "seconds"),
				}),
				new BinarySwitchCCReport({
					nodeId,
					currentValue: false,
					targetValue: true,
					duration: new Duration(3, "seconds"),
				}),
			]
		) {
			expect(getCommandRelation(newer, older)).toBe(
				CommandRelation.Supersedes,
			);
		}
	});

	test("Reports preserve unknown and optional values", () => {
		const older = new BinarySwitchCCReport({
			nodeId,
			currentValue: UNKNOWN_STATE,
		});
		expect(
			getCommandRelation(
				new BinarySwitchCCReport({
					nodeId,
					currentValue: UNKNOWN_STATE,
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new BinarySwitchCCReport({
					nodeId,
					currentValue: UNKNOWN_STATE,
					targetValue: UNKNOWN_STATE,
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
	});
});

describe("Multilevel Switch CC command relations", () => {
	test("repeated Gets are redundant", () => {
		expect(
			getCommandRelation(
				new MultilevelSwitchCCGet({ nodeId }),
				new MultilevelSwitchCCGet({ nodeId }),
			),
		).toBe(CommandRelation.Redundant);
	});

	test("Sets compare target value and duration", () => {
		const zero = new MultilevelSwitchCCSet({
			nodeId,
			targetValue: 0,
		});
		const fifty = new MultilevelSwitchCCSet({
			nodeId,
			targetValue: 50,
		});
		const ninetyNine = new MultilevelSwitchCCSet({
			nodeId,
			targetValue: 99,
		});
		expect(getCommandRelation(fifty, zero)).toBe(
			CommandRelation.Supersedes,
		);
		expect(getCommandRelation(ninetyNine, fifty)).toBe(
			CommandRelation.Supersedes,
		);
		expect(
			getCommandRelation(
				new MultilevelSwitchCCSet({
					nodeId,
					targetValue: 40,
				}),
				new MultilevelSwitchCCSet({
					nodeId,
					targetValue: 40,
					duration: Duration.default(),
				}),
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new MultilevelSwitchCCSet({
					nodeId,
					targetValue: 40,
					duration: new Duration(2, "seconds"),
				}),
				new MultilevelSwitchCCSet({
					nodeId,
					targetValue: 40,
					duration: new Duration(1, "seconds"),
				}),
			),
		).toBe(CommandRelation.Supersedes);
	});

	test("Start Level Change commands compare their full payload", () => {
		const older = new MultilevelSwitchCCStartLevelChange({
			nodeId,
			direction: "up",
			ignoreStartLevel: false,
			startLevel: 50,
			duration: new Duration(2, "seconds"),
		});
		expect(
			getCommandRelation(
				new MultilevelSwitchCCStartLevelChange({
					nodeId,
					direction: "up",
					ignoreStartLevel: false,
					startLevel: 50,
					duration: new Duration(2, "seconds"),
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);

		for (
			const newer of [
				new MultilevelSwitchCCStartLevelChange({
					nodeId,
					direction: "down",
					ignoreStartLevel: false,
					startLevel: 50,
					duration: new Duration(2, "seconds"),
				}),
				new MultilevelSwitchCCStartLevelChange({
					nodeId,
					direction: "up",
					ignoreStartLevel: true,
					startLevel: 50,
					duration: new Duration(2, "seconds"),
				}),
				new MultilevelSwitchCCStartLevelChange({
					nodeId,
					direction: "up",
					ignoreStartLevel: false,
					startLevel: 40,
					duration: new Duration(2, "seconds"),
				}),
				new MultilevelSwitchCCStartLevelChange({
					nodeId,
					direction: "up",
					ignoreStartLevel: false,
					startLevel: 50,
					duration: new Duration(3, "seconds"),
				}),
			]
		) {
			expect(getCommandRelation(newer, older)).toBe(
				CommandRelation.Supersedes,
			);
		}
	});

	test("Set and Start Level Change supersede each other", () => {
		const set = new MultilevelSwitchCCSet({
			nodeId,
			targetValue: 50,
		});
		const start = new MultilevelSwitchCCStartLevelChange({
			nodeId,
			direction: "up",
			ignoreStartLevel: true,
		});
		expect(getCommandRelation(start, set)).toBe(
			CommandRelation.Supersedes,
		);
		expect(getCommandRelation(set, start)).toBe(
			CommandRelation.Supersedes,
		);
	});

	test("Reports compare current value, target value, and duration", () => {
		const older = new MultilevelSwitchCCReport({
			nodeId,
			currentValue: 40,
			targetValue: 99,
			duration: new Duration(2, "minutes"),
		});
		expect(
			getCommandRelation(
				new MultilevelSwitchCCReport({
					nodeId,
					currentValue: 40,
					targetValue: 99,
					duration: new Duration(2, "minutes"),
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);

		for (
			const newer of [
				new MultilevelSwitchCCReport({
					nodeId,
					currentValue: 41,
					targetValue: 99,
					duration: new Duration(2, "minutes"),
				}),
				new MultilevelSwitchCCReport({
					nodeId,
					currentValue: 40,
					targetValue: 98,
					duration: new Duration(2, "minutes"),
				}),
				new MultilevelSwitchCCReport({
					nodeId,
					currentValue: 40,
					targetValue: 99,
					duration: new Duration(2, "seconds"),
				}),
			]
		) {
			expect(getCommandRelation(newer, older)).toBe(
				CommandRelation.Supersedes,
			);
		}
	});

	test("Reports preserve unknown and optional values", () => {
		const older = new MultilevelSwitchCCReport({
			nodeId,
			currentValue: UNKNOWN_STATE,
			targetValue: UNKNOWN_STATE,
			duration: Duration.unknown(),
		});
		expect(
			getCommandRelation(
				new MultilevelSwitchCCReport({
					nodeId,
					currentValue: UNKNOWN_STATE,
					targetValue: UNKNOWN_STATE,
					duration: Duration.unknown(),
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new MultilevelSwitchCCReport({ nodeId }),
				older,
			),
		).toBe(CommandRelation.Supersedes);
	});
});

describe("Thermostat Setpoint CC command relations", () => {
	test("Gets are related only for the same setpoint type", () => {
		const heating = new ThermostatSetpointCCGet({
			nodeId,
			setpointType: ThermostatSetpointType.Heating,
		});
		const cooling = new ThermostatSetpointCCGet({
			nodeId,
			setpointType: ThermostatSetpointType.Cooling,
		});
		expect(getCommandRelation(cooling, heating)).toBe(
			CommandRelation.Unrelated,
		);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCGet({
					nodeId,
					setpointType: ThermostatSetpointType.Cooling,
				}),
				cooling,
			),
		).toBe(CommandRelation.Redundant);
	});

	test("Sets compare value and scale within one setpoint type", () => {
		const older = new ThermostatSetpointCCSet({
			nodeId,
			setpointType: ThermostatSetpointType.Heating,
			value: 20,
			scale: 0,
		});
		expect(
			getCommandRelation(
				new ThermostatSetpointCCSet({
					nodeId,
					setpointType: ThermostatSetpointType.Heating,
					value: 20,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCSet({
					nodeId,
					setpointType: ThermostatSetpointType.Heating,
					value: 21,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCSet({
					nodeId,
					setpointType: ThermostatSetpointType.Heating,
					value: 20,
					scale: 1,
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCSet({
					nodeId,
					setpointType: ThermostatSetpointType.Cooling,
					value: 20,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Unrelated);
	});

	test("Reports compare value and scale within one setpoint type", () => {
		const older = new ThermostatSetpointCCReport({
			nodeId,
			type: ThermostatSetpointType.Heating,
			value: 20,
			scale: 0,
		});
		expect(
			getCommandRelation(
				new ThermostatSetpointCCReport({
					nodeId,
					type: ThermostatSetpointType.Heating,
					value: 20,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Redundant);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCReport({
					nodeId,
					type: ThermostatSetpointType.Heating,
					value: 21,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCReport({
					nodeId,
					type: ThermostatSetpointType.Heating,
					value: 20,
					scale: 1,
				}),
				older,
			),
		).toBe(CommandRelation.Supersedes);
		expect(
			getCommandRelation(
				new ThermostatSetpointCCReport({
					nodeId,
					type: ThermostatSetpointType.Cooling,
					value: 20,
					scale: 0,
				}),
				older,
			),
		).toBe(CommandRelation.Unrelated);
	});
});
