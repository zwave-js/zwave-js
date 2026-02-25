import { SupervisionCCGet, SupervisionCCReport } from "@zwave-js/cc";
import { CommandClasses, Duration, SupervisionStatus } from "@zwave-js/core";
import type { MockNodeBehavior } from "@zwave-js/testing";

const encapsulateSupervisionCC: MockNodeBehavior = {
	transformIncomingCC(controller, self, receivedCC) {
		if (receivedCC instanceof SupervisionCCGet) {
			return receivedCC.encapsulated;
		}
		return receivedCC;
	},

	transformResponse(controller, self, receivedCC, response) {
		// We can only transform simple ok/fail responses here
		if (response.action !== "ok" && response.action !== "fail") {
			return response;
		}

		// And only transform if the original command was supervised
		const supervisionGet = receivedCC.getEncapsulatingCC(
			CommandClasses.Supervision,
		) as SupervisionCCGet | undefined;
		if (!supervisionGet) return response;

		if (response.action === "fail") {
			const cc = new SupervisionCCReport({
				// We are not wrapping a CC here
				// eslint-disable-next-line @zwave-js/consistent-mock-node-behaviors
				nodeId: controller.ownNodeId,
				sessionId: supervisionGet.sessionId,
				moreUpdatesFollow: false,
				status: SupervisionStatus.Fail,
			});
			return { action: "sendCC", cc };
		}

		// If the action takes a non-zero amount of time, return a Working status instead.
		if (response.durationMs) {
			const cc = new SupervisionCCReport({
				// We are not wrapping a CC here
				// eslint-disable-next-line @zwave-js/consistent-mock-node-behaviors
				nodeId: controller.ownNodeId,
				sessionId: supervisionGet.sessionId,
				moreUpdatesFollow: true,
				status: SupervisionStatus.Working,
				duration: new Duration(
					Math.ceil(response.durationMs / 1000),
					"seconds",
				),
			});
			return { action: "sendCC", cc };

			// FIXME: We also need to send a final report, but this should handle the case where a transition is aborted
		}

		const cc = new SupervisionCCReport({
			// We are not wrapping a CC here
			// eslint-disable-next-line @zwave-js/consistent-mock-node-behaviors
			nodeId: controller.ownNodeId,
			sessionId: supervisionGet.sessionId,
			moreUpdatesFollow: false,
			status: SupervisionStatus.Success,
		});
		return { action: "sendCC", cc };
	},
};

export const SupervisionCCHooks = [
	encapsulateSupervisionCC,
];
