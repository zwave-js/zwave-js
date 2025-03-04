/// This file is auto-generated. All manual changes will be lost!

import {
	CommandClasses,
	type ValueID,
	enumValuesToMetadataStates,
} from "@zwave-js/core";
import { getEnumMemberName } from "@zwave-js/shared";
import { BarrierState, SubsystemState, SubsystemType } from "../lib/_Types.js";

const BarrierOperatorCCValues = Object.freeze({
	supportedSubsystemTypes: {
		id: {
			commandClass: CommandClasses["Barrier Operator"],
			property: "supportedSubsystemTypes",
		} as const,
		endpoint: (endpoint: number = 0) => ({
			commandClass: CommandClasses["Barrier Operator"],
			endpoint,
			property: "supportedSubsystemTypes",
		} as const),
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === CommandClasses["Barrier Operator"]
				&& valueId.property === "supportedSubsystemTypes"
				&& valueId.propertyKey == undefined;
		},
		meta: {
			type: "any",
			readable: true,
			writeable: true,
		} as const,
		options: {
			internal: true,
			minVersion: 1,
			secret: false,
			stateful: true,
			supportsEndpoints: true,
			autoCreate: true,
		} as const,
	},
	position: {
		id: {
			commandClass: CommandClasses["Barrier Operator"],
			property: "position",
		} as const,
		endpoint: (endpoint: number = 0) => ({
			commandClass: CommandClasses["Barrier Operator"],
			endpoint,
			property: "position",
		} as const),
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === CommandClasses["Barrier Operator"]
				&& valueId.property === "position"
				&& valueId.propertyKey == undefined;
		},
		meta: {
			label: "Barrier Position",
			unit: "%",
			max: 100,
			writeable: false,
			min: 0,
			type: "number",
			readable: true,
		} as const,
		options: {
			internal: false,
			minVersion: 1,
			secret: false,
			stateful: true,
			supportsEndpoints: true,
			autoCreate: true,
		} as const,
	},
	targetState: {
		id: {
			commandClass: CommandClasses["Barrier Operator"],
			property: "targetState",
		} as const,
		endpoint: (endpoint: number = 0) => ({
			commandClass: CommandClasses["Barrier Operator"],
			endpoint,
			property: "targetState",
		} as const),
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === CommandClasses["Barrier Operator"]
				&& valueId.property === "targetState"
				&& valueId.propertyKey == undefined;
		},
		meta: {
			label: "Target Barrier State",
			states: enumValuesToMetadataStates(BarrierState, [
				BarrierState.Open,
				BarrierState.Closed,
			]),
			min: 0,
			max: 255,
			type: "number",
			readable: true,
			writeable: true,
		} as const,
		options: {
			internal: false,
			minVersion: 1,
			secret: false,
			stateful: true,
			supportsEndpoints: true,
			autoCreate: true,
		} as const,
	},
	currentState: {
		id: {
			commandClass: CommandClasses["Barrier Operator"],
			property: "currentState",
		} as const,
		endpoint: (endpoint: number = 0) => ({
			commandClass: CommandClasses["Barrier Operator"],
			endpoint,
			property: "currentState",
		} as const),
		is: (valueId: ValueID): boolean => {
			return valueId.commandClass === CommandClasses["Barrier Operator"]
				&& valueId.property === "currentState"
				&& valueId.propertyKey == undefined;
		},
		meta: {
			label: "Current Barrier State",
			states: enumValuesToMetadataStates(BarrierState),
			writeable: false,
			min: 0,
			max: 255,
			type: "number",
			readable: true,
		} as const,
		options: {
			internal: false,
			minVersion: 1,
			secret: false,
			stateful: true,
			supportsEndpoints: true,
			autoCreate: true,
		} as const,
	},
	signalingState: Object.assign(
		(subsystemType: SubsystemType) => {
			const property = "signalingState";
			const propertyKey = subsystemType;

			return {
				get id() {
					return {
						commandClass: CommandClasses["Barrier Operator"],
						property,
						propertyKey,
					} as const;
				},
				endpoint: (endpoint: number = 0) => ({
					commandClass: CommandClasses["Barrier Operator"],
					endpoint,
					property: property,
					propertyKey: propertyKey,
				} as const),
				get meta() {
					return {
						label: `Signaling State (${
							getEnumMemberName(
								SubsystemType,
								subsystemType,
							)
						})`,
						states: enumValuesToMetadataStates(SubsystemState),
						min: 0,
						max: 255,
						type: "number",
						readable: true,
						writeable: true,
					} as const;
				},
			};
		},
		{
			is: (valueId: ValueID): boolean => {
				return valueId.commandClass
						=== CommandClasses["Barrier Operator"]
					&& (({ property, propertyKey }) =>
						property === "signalingState"
						&& typeof propertyKey === "number")(valueId);
			},
			options: {
				internal: false,
				minVersion: 1,
				secret: false,
				stateful: true,
				supportsEndpoints: true,
				autoCreate: true,
			} as const,
		},
	),
});

export const values = {
	[CommandClasses["Barrier Operator"]]: BarrierOperatorCCValues,
};
