import { type MaybeNotKnown, type ValueID } from "@zwave-js/core";
import type { EndpointBase } from "../endpoint-mixins/00_Base.js";

/**
 * Base class for high-level feature APIs exposed on endpoints via namespace getters.
 * Each subclass represents a group of related functionality (e.g. access control, covers).
 */
export abstract class FeatureAPI {
	public constructor(public readonly endpoint: EndpointBase) {}

	protected getValue<T = unknown>(valueId: ValueID): MaybeNotKnown<T> {
		return this.endpoint.tryGetNode()?.getValue(valueId);
	}
}
