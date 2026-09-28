import type { EndpointGroupConfig } from "@zwave-js/config";
import type { GetEndpoint } from "@zwave-js/core";

import type { Endpoint } from "./Endpoint.js";

/** An endpoint group identifies endpoints belonging to the same physical part of a node */
export class EndpointGroup {
	public constructor(
		node: GetEndpoint<Endpoint>,
		config: EndpointGroupConfig,
	) {
		this.#node = node;
		this.id = config.id;
		this.label = config.label;
		this.endpointIndices = config.endpoints;
		this.isMainDevice = config.isMainDevice;
	}

	// The node must stay in a true private field so JSON serialization skips it
	readonly #node: GetEndpoint<Endpoint>;

	public readonly id: number;
	public readonly label: string;
	/** The indices of the endpoints in this group, including those the node does not have */
	public readonly endpointIndices: readonly number[];
	/** Whether this group represents the device as a whole */
	public readonly isMainDevice: boolean;

	/** Returns the endpoints of this group that exist on the node */
	public getEndpoints(): Endpoint[] {
		return this.endpointIndices
			.map((index) => this.#node.getEndpoint(index))
			.filter((endpoint) => endpoint != undefined);
	}
}
