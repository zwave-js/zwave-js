import { CommandClasses, InterviewStage, SecurityClass } from "@zwave-js/core";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { InclusionStrategy } from "../../controller/Inclusion.js";
import type { ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuite.js";
import { integrationTest as integrationTestMulti } from "../integrationTestSuiteMulti.js";

integrationTestMulti.only(
	"When S2 bootstrapping fails due to wrong PIN, the interview should not start",
	{
		debug: true,

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			// Set up a promise to wait for the "node added" event
			let includedNode: ZWaveNode | undefined;
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (node) => {
					includedNode = node;
					resolve();
				});
			});

			// Set up the node that will be included with S2 Authenticated
			// (which requires PIN entry)
			let correctPIN: string | undefined;
			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					basicDeviceClass: 0x04,
					genericDeviceClass: 0x10,
					specificDeviceClass: 0x01,
					commandClasses: [
						CommandClasses["Z-Wave Plus Info"],
						CommandClasses["Manufacturer Specific"],
						CommandClasses["Device Reset Locally"],
						CommandClasses["Security 2"],
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
					],
					securityClasses: new Set([
						SecurityClass.S2_Authenticated,
					]),
				},
				setup(node) {
					// Store the correct PIN for reference
					correctPIN = node.s2Pin;
				},
			};

			// Start the inclusion process with S2
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Security_S2,
				userCallbacks: {
					async grantSecurityClasses(requested) {
						// Grant the S2 Authenticated class
						return requested;
					},
					async validateDSKAndEnterPIN(_dsk) {
						// Enter a wrong PIN intentionally
						// The correct PIN is 5 digits, so we return a different one
						return correctPIN === "00000" ? "11111" : "00000";
					},
					abort() {},
				},
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Verify the node was added and failedS2Bootstrapping is true
			t.expect(includedNode).toBeDefined();
			t.expect(includedNode!.id).toBe(3);
			t.expect(includedNode!.failedS2Bootstrapping).toBe(true);

			// Clear any recorded frames from the inclusion process
			const mockNode3 = mockController.nodes.get(3)!;
			mockNode3.clearReceivedControllerFrames();

			// Wait a bit to ensure no interview commands are sent
			await wait(1500);

			// Check that no further commands were sent to the node
			mockNode3.assertReceivedControllerFrame(
				() => true, // Match any frame
				{ noMatch: true },
			);

			t.expect(includedNode!.interviewStage).toBe(InterviewStage.None);
			t.expect(includedNode!.ready).toBe(false);
		},
	},
);

integrationTest(
	"When restoring a node with failedS2Bootstrapping=true from cache, the interview should not start",
	{
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/failedS2BootstrappingNoInterview",
		),

		nodeCapabilities: {
			commandClasses: [
				CommandClasses["Z-Wave Plus Info"],
				CommandClasses["Manufacturer Specific"],
				CommandClasses["Security 2"],
				CommandClasses.Version,
			],
			securityClasses: new Set([SecurityClass.S2_Authenticated]),
		},

		// We manually trigger the interview during the test,
		// because otherwise the test body never starts.
		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Verify the node was restored with the correct flags
			t.expect(node.failedS2Bootstrapping).toBe(true);

			// Clear any frames from startup
			mockNode.clearReceivedControllerFrames();

			// Now manually execute the interview to verify it gets skipped
			await driver.interviewNodeInternal(node);

			// Check that no interview commands were sent
			mockNode.assertReceivedControllerFrame(
				() => true, // Match any frame
				{ noMatch: true },
			);

			t.expect(node.interviewStage).toBe(InterviewStage.None);
			t.expect(node.ready).toBe(false);
		},
	},
);
