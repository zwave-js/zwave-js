import {
	BasicCCGet,
	BasicCCReport,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
} from "@zwave-js/cc";
import { CommandClasses, SecurityClass } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuiteMulti.js";

integrationTest(
	"Security S0 Nonce Get is answered while waiting for a reply from another node",
	{
		// debug: true,

		nodeCapabilities: [
			{
				id: 2,
				capabilities: {
					commandClasses: [
						CommandClasses.Version,
						CommandClasses.Security,
						{
							ccId: CommandClasses.Basic,
							secure: true,
						},
					],
					securityClasses: new Set([SecurityClass.S0_Legacy]),
				},
			},
			{
				id: 3,
				capabilities: {
					commandClasses: [
						CommandClasses.Version,
						CommandClasses.Security,
						{
							ccId: CommandClasses.Basic,
							secure: true,
						},
					],
					securityClasses: new Set([SecurityClass.S0_Legacy]),
				},
			},
		],

		customSetup: async (driver, controller, mockNodes) => {
			for (const mockNode of mockNodes) {
				// Respond to Basic Get with a level that increases with each request
				let queryCount = 0;
				const respondToBasicGet: MockNodeBehavior = {
					async handleCC(controller, self, receivedCC) {
						if (receivedCC instanceof BasicCCGet) {
							// Introduce a delay in the response for the second query (after interview)
							// so we can simulate the other node interfering
							queryCount++;
							if (queryCount === 2) {
								await wait(750);
							}

							const response = new BasicCCReport({
								nodeId: controller.ownNodeId,
								currentValue: queryCount,
							});

							return { action: "sendCC", cc: response };
						}
					},
				};
				mockNode.defineBehavior(respondToBasicGet);
			}
		},

		testBody: async (
			t,
			driver,
			[node2, node3],
			mockController,
			[mockNode2, mockNode3],
		) => {
			const basicGet = node2.commandClasses.Basic.get();

			await wait(150);

			// Now send a Nonce Get from node 3, which must be answered immediately
			const nonceGet = new SecurityCCNonceGet({
				nodeId: mockController.ownNodeId,
			});
			await mockNode3.sendToController(
				createMockZWaveRequestFrame(nonceGet, {
					ackRequested: false,
				}),
			);

			await mockNode3
				.expectControllerFrame(
					(
						resp,
					): resp is MockZWaveFrame & {
						type: MockZWaveFrameType.Request;
						payload: SecurityCCNonceReport;
					} => resp.type === MockZWaveFrameType.Request
						&& resp.payload instanceof SecurityCCNonceReport,
					{ timeout: 250 },
				)
				.catch(() => {
					throw new Error(
						"The controller did not reply to the Nonce Get ASAP",
					);
				});

			t.expect((await basicGet)?.currentValue).toBe(2);
		},
	},
);
