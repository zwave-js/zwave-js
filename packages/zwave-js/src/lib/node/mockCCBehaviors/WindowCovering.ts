import {
	WindowCoveringCCSupportedGet,
	WindowCoveringCCSupportedReport,
} from "@zwave-js/cc/WindowCoveringCC";
import { CommandClasses } from "@zwave-js/core";
import type {
	MockNodeBehavior,
	WindowCoveringCCCapabilities,
} from "@zwave-js/testing";

const defaultCapabilities: WindowCoveringCCCapabilities = {
	supportedParameters: [],
};

const respondToWindowCoveringSupportedGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCSupportedGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Window Covering"],
					receivedCC.endpointIndex,
				),
			};
			const cc = new WindowCoveringCCSupportedReport({
				nodeId: controller.ownNodeId,
				supportedParameters: capabilities.supportedParameters,
			});
			return { action: "sendCC", cc };
		}
	},
};

export const WindowCoveringCCBehaviors = [respondToWindowCoveringSupportedGet];
