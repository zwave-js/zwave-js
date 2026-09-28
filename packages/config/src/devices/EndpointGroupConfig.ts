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

		if (
			definition.isMainDevice !== undefined
			&& typeof definition.isMainDevice !== "boolean"
		) {
			throwInvalidConfig(
				"device",
				`packages/config/config/devices/${filename}:
Endpoint group ${id}: isMainDevice must be a boolean`,
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

export interface EndpointGroupConflict {
	keptGroup: number;
	droppedGroup: number;
	/** The endpoint both groups contain, or `undefined` if both groups are marked as the main device */
	endpoint?: number;
}

/**
 * Keeps groups in ID order and drops each group that conflicts with a group kept before it.
 * Two groups conflict when they share an endpoint or are both marked as the main device.
 */
export function dropConflictingEndpointGroups(
	groups: ReadonlyMap<number, EndpointGroupConfig>,
): {
	groups: Map<number, EndpointGroupConfig>;
	conflicts: EndpointGroupConflict[];
} {
	const kept = new Map<number, EndpointGroupConfig>();
	const conflicts: EndpointGroupConflict[] = [];
	const membership = new Map<number, number>();
	let mainDeviceGroup: number | undefined;
	for (const [id, group] of [...groups].toSorted(([a], [b]) => a - b)) {
		const endpoint = group.endpoints.find((ep) => membership.has(ep));
		if (endpoint !== undefined) {
			conflicts.push({
				endpoint,
				keptGroup: membership.get(endpoint)!,
				droppedGroup: id,
			});
			continue;
		}
		if (group.isMainDevice && mainDeviceGroup !== undefined) {
			conflicts.push({ keptGroup: mainDeviceGroup, droppedGroup: id });
			continue;
		}
		if (group.isMainDevice) mainDeviceGroup = id;
		for (const ep of group.endpoints) membership.set(ep, id);
		kept.set(id, group);
	}
	return { groups: kept, conflicts };
}
