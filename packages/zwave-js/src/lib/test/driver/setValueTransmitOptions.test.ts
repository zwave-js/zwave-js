import { BinarySwitchCCValues } from "@zwave-js/cc";
import { CommandClasses, TransmitOptions } from "@zwave-js/core";
import { FunctionType, SendDataRequest } from "@zwave-js/serial";
import {
	type MockControllerCapabilities,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuite.js";

const controllerCapabilitiesNoBridge: MockControllerCapabilities = {
	...getDefaultMockControllerCapabilities(),
	supportedFunctionTypes: getDefaultSupportedFunctionTypes().filter(
		(ft) =>
			ft !== FunctionType.SendDataBridge
			&& ft !== FunctionType.SendDataMulticastBridge,
	),
};

integrationTest("singlecast setValue forwards custom transmit options", {
	controllerCapabilities: controllerCapabilitiesNoBridge,

	nodeCapabilities: {
		commandClasses: [CommandClasses["Binary Switch"]],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const transmitOptions = TransmitOptions.ACK | TransmitOptions.NoRoute;
		await node.setValue(BinarySwitchCCValues.targetValue.id, true, {
			transmitOptions,
		});

		t.expect(
			mockController.receivedHostMessages.some(
				(m) =>
					m instanceof SendDataRequest
					&& m.transmitOptions === transmitOptions,
			),
		).toBe(true);
	},
});
