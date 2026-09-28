import type { EndpointGroupConfig } from "@zwave-js/config";

import type { Driver } from "../driver/Driver.js";

import type { Endpoint } from "./Endpoint.js";

/** An endpoint group identifies endpoints belonging to the same physical part of a node */
export class EndpointGroup {
	public constructor(
		/** The ID of the node this endpoint group belongs to */
		public readonly nodeId: number,
		/** The driver instance this endpoint group belongs to */
		protected readonly driver: Driver,
		config: EndpointGroupConfig,
	) {
		this.id = config.id;
		this.label = config.label;
		this.endpointIndices = config.endpoints;
		this.isMainDevice = config.isMainDevice;
	}

	public readonly id: number;
	public readonly label: string;
	/** The indices of the endpoints in this group, including those the node does not have */
	public readonly endpointIndices: readonly number[];
	/** Whether this group represents the device as a whole */
	public readonly isMainDevice: boolean;

	/** Returns the endpoints of this group that exist on the node */
	public getEndpoints(): Endpoint[] {
		const node = this.driver.controller.nodes.get(this.nodeId);
		if (!node) return [];
		return this.endpointIndices
			.map((index) => node.getEndpoint(index))
			.filter((endpoint) => endpoint != undefined);
	}
}
