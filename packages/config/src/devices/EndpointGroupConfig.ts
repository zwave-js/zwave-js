import { isObject } from "alcalzone-shared/typeguards";

import { throwInvalidConfig } from "../utils_safe.js";

import {
	type ConditionalItem,
	conditionApplies,
	validateCondition,
} from "./ConditionalItem.js";
import type { DeviceID } from "./shared.js";

export class ConditionalEndpointGroupConfig implements ConditionalItem<EndpointGroupConfig> {
	public constructor(filename: string, id: number, definition: unknown) {
		this.id = id;

		if (!isObject(definition)) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id} is not an object`,
			);
		}

		validateCondition(
			filename,
			definition,
			`Endpoint group ${id} contains an`,
		);
		if (typeof definition.$if === "string") {
			this.condition = definition.$if;
		}

		if (typeof definition.label !== "string" || !definition.label.trim()) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: label is not a string`,
			);
		}
		this.label = definition.label;

		if (
			!Array.isArray(definition.endpoints)
			|| definition.endpoints.length === 0
			|| !definition.endpoints.every(
				(endpoint: unknown): endpoint is number =>
					typeof endpoint === "number"
					&& Number.isInteger(endpoint)
					&& endpoint >= 1
					&& endpoint <= 127,
			)
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: endpoints must be a non-empty array of endpoint indices from 1 to 127`,
			);
		}
		if (
			new Set(definition.endpoints).size !== definition.endpoints.length
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: endpoints contains duplicates`,
			);
		}
		this.endpoints = [...definition.endpoints];

		if (
			definition.isMainDevice !== undefined
			&& typeof definition.isMainDevice !== "boolean"
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: isMainDevice is not a boolean`,
			);
		}
		this.isMainDevice = !!definition.isMainDevice;
	}

	public readonly id: number;
	public readonly label: string;
	public readonly endpoints: readonly number[];
	/** Whether this group represents the device as a whole */
	public readonly isMainDevice: boolean;
	public readonly condition?: string;

	public evaluateCondition(
		deviceId?: DeviceID,
	): EndpointGroupConfig | undefined {
		if (!conditionApplies(this, deviceId)) return;
		return {
			id: this.id,
			label: this.label,
			endpoints: this.endpoints,
			isMainDevice: this.isMainDevice,
		};
	}
}

export type EndpointGroupConfig = Omit<
	ConditionalEndpointGroupConfig,
	"condition" | "evaluateCondition"
>;
