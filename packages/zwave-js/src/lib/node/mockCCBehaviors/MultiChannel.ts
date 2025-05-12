import {
	CommandClass,
	MultiChannelCCCapabilityGet,
	MultiChannelCCCapabilityReport,
	MultiChannelCCCommandEncapsulation,
	MultiChannelCCEndPointFind,
	MultiChannelCCEndPointFindReport,
	MultiChannelCCEndPointGet,
	MultiChannelCCEndPointReport,
	MultiChannelCCV1CommandEncapsulation,
	MultiChannelCCV1Get,
	MultiChannelCCV1Report,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import type { MockNodeBehavior } from "@zwave-js/testing";

const encapsulateMultiChannelCC: MockNodeBehavior = {
	transformIncomingCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultiChannelCCCommandEncapsulation) {
			// The existing machinery interprets endpointIndex from the view
			// of the controller, but we are the end node here, so re-interpret
			// the destination as the endpoint index
			const inner = receivedCC.encapsulated;
			inner.endpointIndex = receivedCC.destination as number;
			return inner;
		} else if (receivedCC instanceof MultiChannelCCV1CommandEncapsulation) {
			const inner = receivedCC.encapsulated;
			inner.endpointIndex = receivedCC.endpointIndex;
			return inner;
		}
		return receivedCC;
	},

	transformResponse(controller, self, receivedCC, response) {
		if (
			response.action === "sendCC"
			&& receivedCC instanceof CommandClass
			&& receivedCC.isEncapsulatedWith(
				CommandClasses["Multi Channel"],
			)
			&& !response.cc.isEncapsulatedWith(CommandClasses["Multi Channel"])
		) {
			const multiChannelEncap = receivedCC.getEncapsulatingCC(
				CommandClasses["Multi Channel"],
			);
			if (!multiChannelEncap) return response;

			if (
				multiChannelEncap
					instanceof MultiChannelCCV1CommandEncapsulation
			) {
				response.cc = new MultiChannelCCV1CommandEncapsulation({
					nodeId: response.cc.nodeId,
					endpointIndex: multiChannelEncap.endpointIndex,
					encapsulated: response.cc,
				});
			} else if (
				multiChannelEncap instanceof MultiChannelCCCommandEncapsulation
			) {
				const destination = multiChannelEncap.endpointIndex;
				const source = multiChannelEncap.destination as number;

				response.cc = new MultiChannelCCCommandEncapsulation({
					nodeId: response.cc.nodeId,
					endpointIndex: source,
					encapsulated: response.cc,
					destination,
				});
			}
		}

		return response;
	},
};

const respondToMultiChannelCCEndPointGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultiChannelCCEndPointGet) {
			const cc = new MultiChannelCCEndPointReport({
				nodeId: controller.ownNodeId,
				countIsDynamic: false,
				identicalCapabilities: false,
				individualCount: self.endpoints.size,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToMultiChannelCCEndPointFind: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultiChannelCCEndPointFind) {
			const request = receivedCC;
			const cc = new MultiChannelCCEndPointFindReport({
				nodeId: controller.ownNodeId,
				genericClass: request.genericClass,
				specificClass: request.specificClass,
				foundEndpoints: [...self.endpoints.keys()],
				reportsToFollow: 0,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToMultiChannelCCCapabilityGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultiChannelCCCapabilityGet) {
			const endpoint = self.endpoints.get(
				receivedCC.requestedEndpoint,
			)!;
			const cc = new MultiChannelCCCapabilityReport({
				nodeId: controller.ownNodeId,
				endpointIndex: endpoint.index,
				genericDeviceClass: endpoint?.capabilities.genericDeviceClass
					?? self.capabilities.genericDeviceClass,
				specificDeviceClass: endpoint?.capabilities.specificDeviceClass
					?? self.capabilities.specificDeviceClass,
				isDynamic: false,
				wasRemoved: false,
				supportedCCs: [...endpoint.implementedCCs.keys()]
					// Basic CC must not be included in the NIF
					.filter((ccId) => ccId !== CommandClasses.Basic),
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToMultiChannelCCV1Get: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultiChannelCCV1Get) {
			// On V1, CCs must exist on sequential endpoints. Therefore
			// we can look for the last endpoint to support a given CC
			const requestedCC = receivedCC.requestedCC;
			const supportedEndpointIndizes = [...self.endpoints.values()]
				.filter((ep) => {
					const info = ep.implementedCCs.get(requestedCC);
					return info && info.version > 0 && info.isSupported;
				}).map((ep) => ep.index);
			const endpointCount = Math.max(0, ...supportedEndpointIndizes);

			const cc = new MultiChannelCCV1Report({
				nodeId: self.id,
				requestedCC,
				endpointCount,
			});
			return { action: "sendCC", cc };
		}
	},
};

export const MultiChannelCCHooks = [
	encapsulateMultiChannelCC,
];

export const MultiChannelCCBehaviors = [
	respondToMultiChannelCCEndPointGet,
	respondToMultiChannelCCEndPointFind,
	respondToMultiChannelCCCapabilityGet,
	respondToMultiChannelCCV1Get,
];
