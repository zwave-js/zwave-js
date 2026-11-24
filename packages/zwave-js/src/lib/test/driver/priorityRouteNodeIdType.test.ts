import { NodeIDType, ZWaveDataRate, encodeNodeID } from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import {
	SerialAPISetupCommand,
	SetPriorityRouteRequest,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import {
	type MockControllerBehavior,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuite.js";

// Like 7.xx firmwares, the response is missing the result byte with 16-bit node IDs.
// The controller rejects every priority route.
const rejectPriorityRoute: MockControllerBehavior = {
	async onHostMessage(controller, msg) {
		if (!(msg instanceof SetPriorityRouteRequest)) return;
		const nodeIdType = controller.parsingContext.nodeIdType;
		const nodeId = encodeNodeID(msg.destinationNodeId, nodeIdType);
		await controller.sendMessageToHost(
			new Message({
				type: MessageType.Response,
				functionType: FunctionType.SetPriorityRoute,
				payload:
					nodeIdType === NodeIDType.Long
						? nodeId
						: Bytes.concat([nodeId, [0x00]]),
			}),
		);
		return true;
	},
};

for (const action of ["set", "remove"] as const) {
	integrationTest(
		`Failing to ${action} a priority route is reported with 16-bit node IDs`,
		{
			// debug: true,

			controllerCapabilities: {
				libraryVersion: "Z-Wave 7.19.3",
				supportedFunctionTypes: [
					...getDefaultSupportedFunctionTypes(),
					FunctionType.SerialAPISetup,
					FunctionType.SetPriorityRoute,
				],
				supportedSerialAPISetupCommands: [
					SerialAPISetupCommand.SetNodeIDType,
				],
			},

			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(rejectPriorityRoute);
			},

			testBody: async (t, driver, node, mockController, mockNode) => {
				// Start with 16-bit node IDs on a controller that rejects every priority route
				t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);

				// Set or remove a priority route
				const result =
					action === "set"
						? await driver.controller.setPriorityRoute(
								node.id,
								[],
								ZWaveDataRate["100k"],
							)
						: await driver.controller.removePriorityRoute(node.id);

				// The failure must be reported, and the driver uses 16-bit node IDs again afterwards
				t.expect(result).toBe(false);
				t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			},
		},
	);
}
