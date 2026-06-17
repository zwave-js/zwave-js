import {
	ConfigurationCCNameGet,
	ConfigurationCCNameReport,
} from "@zwave-js/cc/ConfigurationCC";
import { CommandClasses } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

const nodeCapabilities = {
	commandClasses: [
		CommandClasses.Version,
		{
			ccId: CommandClasses.Configuration,
			isSupported: true,
			version: 1,
		},
	],
};

integrationTest("Duplicated partial reports are only used once", {
	// debug: true,

	nodeCapabilities,

	async customSetup(driver, mockController, mockNode) {
		const respondToConfigurationNameGet: MockNodeBehavior = {
			async handleCC(controller, self, receivedCC) {
				if (receivedCC instanceof ConfigurationCCNameGet) {
					const reports = [
						["Test para", 1],
						// The node re-transmits the first report
						["Test para", 1],
						["meter", 0],
					] as const;
					for (const [name, reportsToFollow] of reports) {
						const cc = new ConfigurationCCNameReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							name,
							reportsToFollow,
						});
						await self.sendToController(
							createMockZWaveRequestFrame(cc, {
								ackRequested: false,
							}),
						);
						await wait(100);
					}
					return { action: "stop" };
				}
			},
		};
		mockNode.defineBehavior(respondToConfigurationNameGet);
	},

	async testBody(t, driver, node, mockController, mockNode) {
		const name = await node.commandClasses.Configuration.getName(1);
		t.expect(name).toBe("Test parameter");
	},
});

let queryCountMissingMiddle = 0;
integrationTest(
	"A response with a missing middle report is re-requested and patched together",
	{
		// debug: true,

		nodeCapabilities,

		async customSetup(driver, mockController, mockNode) {
			const respondToConfigurationNameGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof ConfigurationCCNameGet) {
						const queryCount = ++queryCountMissingMiddle;
						const reports: (readonly [string, number])[] =
							queryCount === 1
								// The middle report goes missing on the first attempt
								? [["Test ", 2], ["ter", 0]]
								: [["Test ", 2], ["parame", 1], ["ter", 0]];
						for (const [name, reportsToFollow] of reports) {
							const cc = new ConfigurationCCNameReport({
								nodeId: controller.ownNodeId,
								parameter: receivedCC.parameter,
								name,
								reportsToFollow,
							});
							await self.sendToController(
								createMockZWaveRequestFrame(cc, {
									ackRequested: false,
								}),
							);
							await wait(100);
						}
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(respondToConfigurationNameGet);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const name = await node.commandClasses.Configuration.getName(1);
			t.expect(name).toBe("Test parameter");

			// The driver should have re-requested the response exactly once
			t.expect(queryCountMissingMiddle).toBe(2);
		},
	},
);

let queryCountMissingFinal = 0;
integrationTest(
	"A response with a missing final report is re-requested after a timeout",
	{
		// debug: true,

		nodeCapabilities,

		async customSetup(driver, mockController, mockNode) {
			const respondToConfigurationNameGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof ConfigurationCCNameGet) {
						const queryCount = ++queryCountMissingFinal;
						const reports: (readonly [string, number])[] =
							queryCount === 1
								// The final report goes missing on the first attempt
								? [["Test para", 1]]
								: [["Test para", 1], ["meter", 0]];
						for (const [name, reportsToFollow] of reports) {
							const cc = new ConfigurationCCNameReport({
								nodeId: controller.ownNodeId,
								parameter: receivedCC.parameter,
								name,
								reportsToFollow,
							});
							await self.sendToController(
								createMockZWaveRequestFrame(cc, {
									ackRequested: false,
								}),
							);
							await wait(100);
						}
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(respondToConfigurationNameGet);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const name = await node.commandClasses.Configuration.getName(1);
			t.expect(name).toBe("Test parameter");

			t.expect(queryCountMissingFinal).toBe(2);
		},
	},
);

let queryCountNoRerequest = 0;
integrationTest(
	"Responses with missing reports are dropped when re-requesting is disabled",
	{
		// debug: true,

		nodeCapabilities,

		additionalDriverOptions: {
			attempts: {
				partialReports: 0,
			},
		},

		async customSetup(driver, mockController, mockNode) {
			const respondToConfigurationNameGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof ConfigurationCCNameGet) {
						const queryCount = ++queryCountNoRerequest;
						const reports: (readonly [string, number])[] =
							queryCount === 1
								// The middle report goes missing on the first attempt
								? [["Test ", 2], ["ter", 0]]
								: [["Test ", 2], ["parame", 1], ["ter", 0]];
						for (const [name, reportsToFollow] of reports) {
							const cc = new ConfigurationCCNameReport({
								nodeId: controller.ownNodeId,
								parameter: receivedCC.parameter,
								name,
								reportsToFollow,
							});
							await self.sendToController(
								createMockZWaveRequestFrame(cc, {
									ackRequested: false,
								}),
							);
							await wait(100);
						}
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(respondToConfigurationNameGet);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// The incomplete response is dropped and the request fails
			const name = await node.commandClasses.Configuration.getName(1);
			t.expect(name).toBeUndefined();

			// No stale segments must remain. A subsequent request receives
			// a complete response and succeeds.
			const name2 = await node.commandClasses.Configuration.getName(1);
			t.expect(name2).toBe("Test parameter");
		},
	},
);

integrationTest(
	"Incomplete sessions from unsolicited reports are dropped after a timeout",
	{
		// debug: true,

		nodeCapabilities,

		async customSetup(driver, mockController, mockNode) {
			const respondToConfigurationNameGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof ConfigurationCCNameGet) {
						const cc = new ConfigurationCCNameReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							name: "fresh",
							reportsToFollow: 0,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToConfigurationNameGet);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// The node sends an unsolicited partial report whose
			// remaining segments never arrive
			const staleReport = new ConfigurationCCNameReport({
				nodeId: 2,
				parameter: 1,
				name: "stale",
				reportsToFollow: 1,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(staleReport, {
					ackRequested: false,
				}),
			);

			// Wait until the incomplete session is dropped
			await wait(1500);

			// The complete response to a subsequent request must not be
			// merged with the stale segment
			const name = await node.commandClasses.Configuration.getName(1);
			t.expect(name).toBe("fresh");
		},
	},
);
