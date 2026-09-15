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
Endpoint group ${id}: label must be a nonblank string`,
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
					&& endpoint >= 0
					&& endpoint <= 127,
			)
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: endpoints must be a nonempty array of integer endpoint indices between 0 and 127`,
			);
		}
		if (
			new Set(definition.endpoints).size !== definition.endpoints.length
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: endpoints must not contain duplicate indices`,
			);
		}
		this.endpoints = [...definition.endpoints];
	}

	public readonly id: number;
	public readonly label: string;
	public readonly endpoints: readonly number[];
	public readonly condition?: string;

	public evaluateCondition(
		deviceId?: DeviceID,
	): EndpointGroupConfig | undefined {
		if (!conditionApplies(this, deviceId)) return;
		return {
			id: this.id,
			label: this.label,
			endpoints: this.endpoints,
		};
	}
}

export type EndpointGroupConfig = Omit<
	ConditionalEndpointGroupConfig,
	"condition" | "evaluateCondition"
>;
