import { NodeIDType } from "@zwave-js/core";
import { FunctionType, MessageHeaders } from "@zwave-js/serial";
import {
	SerialAPISetup_SetNodeIDTypeResponse,
	SerialAPISetupCommand,
} from "@zwave-js/serial/serialapi";
import type { MockControllerBehavior } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

let injectCANOnSetNodeIDType = false;
let didInjectCAN = false;
let setNodeIDTypeCallCount = 0;

integrationTest(
"After soft reset, retry switching back to 16-bit node IDs when the first attempt gets a CAN",
{
// debug: true,

controllerCapabilities: {
libraryVersion: "Z-Wave 7.19.1",
},

async customSetup(_driver, mockController, _mockNode) {
const respondWithCANOnce: MockControllerBehavior = {
async onHostMessage(controller, msg) {
if (msg.functionType === FunctionType.SerialAPISetup) {
setNodeIDTypeCallCount++;

if (injectCANOnSetNodeIDType && !didInjectCAN) {
didInjectCAN = true;
mockController.mockPort.emitData(
	Uint8Array.from([MessageHeaders.CAN]),
);
return true;
}

await mockController.sendMessageToHost(
new SerialAPISetup_SetNodeIDTypeResponse({
	success: true,
}),
);
return true;
}

return false;
},
};
mockController.defineBehavior(respondWithCANOnce);
},

async testBody(t, driver, _node, mockController, _mockNode) {
driver.controller["_supportedFunctionTypes"] = [
...driver.controller["_supportedFunctionTypes"],
FunctionType.SerialAPISetup,
];
driver.controller["_supportedSerialAPISetupCommands"] = [
SerialAPISetupCommand.SetNodeIDType,
];

didInjectCAN = false;
setNodeIDTypeCallCount = 0;
injectCANOnSetNodeIDType = true;
mockController.clearReceivedHostMessages();

await driver.softReset();
injectCANOnSetNodeIDType = false;

t.expect(didInjectCAN).toBe(true);
t.expect(setNodeIDTypeCallCount).toBe(2);
t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
},
},
);
