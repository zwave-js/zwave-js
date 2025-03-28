import {
	type DeviceResetLocallyCCNotification,
	type PersistValuesContext,
} from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { getErrorMessage } from "@zwave-js/shared";
import { type ZWaveController } from "../../controller/Controller.js";
import { RemoveNodeReason } from "../../controller/Inclusion.js";
import { type ZWaveNode } from "../Node.js";

export function handleDeviceResetLocallyNotification(
	ctx: PersistValuesContext & LogNode,
	controller: ZWaveController,
	node: ZWaveNode,
	cmd: DeviceResetLocallyCCNotification,
): void {
	if (cmd.endpointIndex !== 0) {
		// The notification MUST be issued by the root device, otherwise it is likely a corrupted message
		ctx.logNode(node.id, {
			message:
				`Received reset locally notification from non-root endpoint - ignoring it...`,
			direction: "inbound",
		});
		return;
	}

	// Handling this command can take a few seconds and require communication with the node.
	// If it was received with Supervision, we need to acknowledge it immediately. Therefore
	// defer the handling half a second.

	setTimeout(async () => {
		ctx.logNode(node.id, {
			message: `The node was reset locally, removing it`,
			direction: "inbound",
		});

		try {
			await controller.removeFailedNodeInternal(
				node.id,
				RemoveNodeReason.Reset,
			);
		} catch (e) {
			ctx.logNode(node.id, {
				message: `removing the node failed: ${
					getErrorMessage(
						e,
					)
				}`,
				level: "error",
			});
		}
	}, 500);
}
