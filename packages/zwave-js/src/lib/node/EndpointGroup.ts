import type { Endpoint } from "./Endpoint.js";

/** An endpoint group identifies endpoints belonging to the same physical part of a node */
export interface EndpointGroup {
	readonly id: number;
	readonly label: string;
	readonly endpoints: readonly Endpoint[];
}
