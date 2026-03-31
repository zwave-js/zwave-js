import {
	NodeNamingAndLocationCCLocationGet,
	NodeNamingAndLocationCCLocationReport,
	NodeNamingAndLocationCCLocationSet,
	NodeNamingAndLocationCCNameGet,
	NodeNamingAndLocationCCNameReport,
	NodeNamingAndLocationCCNameSet,
} from "@zwave-js/cc/NodeNamingCC";
import { CommandClasses } from "@zwave-js/core";
import type {
	MockNodeBehavior,
	NodeNamingAndLocationCCCapabilities,
} from "@zwave-js/testing";

const defaultCapabilities: NodeNamingAndLocationCCCapabilities = {};

const STATE_KEY_PREFIX = "NodeNamingAndLocation_";
const StateKeys = {
	name: `${STATE_KEY_PREFIX}name`,
	location: `${STATE_KEY_PREFIX}location`,
} as const;

const respondToNodeNameGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof NodeNamingAndLocationCCNameGet) {
			const capabilities = self.getCCCapabilities(
				CommandClasses["Node Naming and Location"],
				0,
			) ?? defaultCapabilities;

			const cc = new NodeNamingAndLocationCCNameReport({
				nodeId: controller.ownNodeId,
				name: self.state.get(StateKeys.name) as string | undefined
					?? capabilities.name
					?? "",
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToNodeNameSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof NodeNamingAndLocationCCNameSet) {
			self.state.set(StateKeys.name, receivedCC.name);
			return { action: "ok" };
		}
	},
};

const respondToNodeLocationGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof NodeNamingAndLocationCCLocationGet) {
			const capabilities = self.getCCCapabilities(
				CommandClasses["Node Naming and Location"],
				0,
			) ?? defaultCapabilities;

			const cc = new NodeNamingAndLocationCCLocationReport({
				nodeId: controller.ownNodeId,
				location:
					(self.state.get(StateKeys.location) as string | undefined)
						?? capabilities.location
						?? "",
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToNodeLocationSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof NodeNamingAndLocationCCLocationSet) {
			self.state.set(StateKeys.location, receivedCC.location);
			return { action: "ok" };
		}
	},
};

export const NodeNamingAndLocationCCBehaviors = [
	respondToNodeNameGet,
	respondToNodeNameSet,
	respondToNodeLocationGet,
	respondToNodeLocationSet,
];
