import { CommandClasses } from "@zwave-js/core";
import {
	FunctionType,
	SetSUCNodeIdResponse,
} from "@zwave-js/serial";
import { getDefaultSupportedFunctionTypes } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Primary controllers promote themselves to SUC/SIS when the configured SUC node is missing from the network",
	{
		clearMessageStatsBeforeTest: false,
		controllerCapabilities: {
			isSecondary: false,
			isSISPresent: true,
			isStaticUpdateController: false,
			sucNodeId: 3,
			supportedFunctionTypes: [
				...getDefaultSupportedFunctionTypes(),
				FunctionType.SetSUCNodeId,
			],
		},
		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},
		async customSetup(_driver, mockController, _mockNode) {
			mockController.defineBehavior({
				async onHostData(controller, data) {
					if (data[3] === FunctionType.SetSUCNodeId) {
						controller.state.set("configureSUC", {
							sucNodeId: data[4],
							enableSUC: data[5] === 0x01,
							enableSIS: data[7] === 0x01,
						});
						controller.ackHostMessage();
						setImmediate(() => {
							void controller.sendMessageToHost(
								new SetSUCNodeIdResponse({
									wasExecuted: true,
								}),
							);
						});
						return true;
					}
				},
			});
		},
		testBody: async (t, driver, _node, mockController, _mockNode) => {
			t.expect(mockController.state.get("configureSUC")).toStrictEqual({
				sucNodeId: driver.controller.ownNodeId,
				enableSUC: true,
				enableSIS: true,
			});

			t.expect(driver.controller.sucNodeId).toBe(driver.controller.ownNodeId);
			t.expect(driver.controller.isSUC).toBe(true);
			t.expect(driver.controller.isSISPresent).toBe(true);
		},
	},
);

integrationTest(
	"Primary controllers do not promote themselves to SUC/SIS while the configured SUC node is still part of the network",
	{
		clearMessageStatsBeforeTest: false,
		controllerCapabilities: {
			isSecondary: false,
			isSISPresent: true,
			isStaticUpdateController: false,
			sucNodeId: 2,
			supportedFunctionTypes: [
				...getDefaultSupportedFunctionTypes(),
				FunctionType.SetSUCNodeId,
			],
		},
		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},
		testBody: async (t, _driver, _node, mockController, _mockNode) => {
			t.expect(mockController.state.has("configureSUC")).toBe(false);
		},
	},
);
