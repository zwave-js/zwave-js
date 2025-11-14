import {
	BinarySwitchCCValues,
	CommandClass,
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNetworkKeySet,
	SecurityCCNetworkKeyVerify,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
	SecurityCCSchemeGet,
	SecurityCCSchemeReport,
} from "@zwave-js/cc";
import {
	BasicDeviceClass,
	CommandClasses,
	SecurityClass,
	SecurityManager,
	isEncapsulationCC,
} from "@zwave-js/core";

import {
	type MockNode,
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { InclusionStrategy } from "../../controller/Inclusion.js";
import type { ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuite.js";
import { integrationTest as integrationTestMulti } from "../integrationTestSuiteMulti.js";

integrationTest(
	"Device inclusion process should emit 'node added' event and interview the device",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set up a promise to wait for the "node added" event
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (addedNode, result) => {
					t.expect(addedNode.id).toBe(3);
					t.expect(result).toBeDefined();
					resolve();
				});
			});

			// Set up the node that will be included
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
						CommandClasses.Security,
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
					],
				},
			};

			// Start the inclusion process
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Default,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Verify that the node was added to the controller's nodes map
			const addedNode = driver.controller.nodes.get(3);
			t.expect(addedNode).toBeDefined();
			t.expect(addedNode?.id).toBe(3);

			// Now wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				addedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;
		},
	},
);

integrationTestMulti(
	"Inclusion with S2 should work",
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

			// Set up the node that will be included
			let inclusionPIN: string | undefined;
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
						ccCaps({
							ccId: CommandClasses["Binary Switch"],
							secure: true,
							defaultValue: false,
						}),
					],
					securityClasses: new Set([
						SecurityClass.S2_Unauthenticated,
					]),
				},
				setup(node) {
					inclusionPIN = node.s2Pin;
				},
			};

			// Start the inclusion process with S2
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Security_S2,
				userCallbacks: {
					async grantSecurityClasses(requested) {
						// Simply grant all requested classes for this test
						return requested;
					},
					async validateDSKAndEnterPIN(dsk) {
						return inclusionPIN!;
					},
					abort() {
					},
				},
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				includedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;

			// Verify that the node was added to the controller's nodes map
			t.expect(includedNode).toBeDefined();
			t.expect(includedNode!.id).toBe(3);
			t.expect(includedNode!.isSecure).toBe(true);
			t.expect(includedNode!.supportsCC(CommandClasses["Security 2"]))
				.toBe(
					true,
				);

			// That Binary Switch CC is only supported securely
			t.expect(includedNode?.isCCSecure(CommandClasses["Binary Switch"]))
				.toBe(true);

			// And that we received a response when querying its value during the interview
			t.expect(
				includedNode?.getValue(BinarySwitchCCValues.currentValue.id),
			).toBe(false);
		},
	},
);

integrationTestMulti(
	"Inclusion with S0 should work",
	{
		// debug: true,

		async customSetup(driver, mockController, mockNodes) {
			// Create a security manager for the controller with the real network key
			const sm0Ctrlr = new SecurityManager({
				ownNodeId: mockController.ownNodeId,
				networkKey: driver.options.securityKeys!.S0_Legacy!,
				nonceTimeout: 100000,
			});
			mockController.securityManagers.securityManager = sm0Ctrlr;
		},

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			// Set up a promise to wait for the "node added" event
			let includedNode: ZWaveNode | undefined;
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (node) => {
					includedNode = node;
					resolve();
				});
			});

			// Set up the node that will be included
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
						CommandClasses.Security,
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
						ccCaps({
							ccId: CommandClasses["Binary Switch"],
							secure: true,
							defaultValue: false,
						}),
					],
				},
			};

			// Start the inclusion process with S0
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Security_S0,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				includedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;

			// Verify that the node was added to the controller's nodes map
			t.expect(includedNode).toBeDefined();
			t.expect(includedNode!.id).toBe(3);
			t.expect(includedNode!.isSecure).toBe(true);
			t.expect(includedNode!.supportsCC(CommandClasses.Security)).toBe(
				true,
			);

			// That Binary Switch CC is only supported securely
			t.expect(includedNode?.isCCSecure(CommandClasses["Binary Switch"]))
				.toBe(true);

			// And that we received a response when querying its value during the interview
			t.expect(
				includedNode?.getValue(BinarySwitchCCValues.currentValue.id),
			).toBe(false);
		},
	},
);

integrationTestMulti(
	"The default inclusion strategy includes legacy secure devices with S0",
	{
		// Repro for #8346
		// debug: true,

		async customSetup(driver, mockController, mockNodes) {
			// Create a security manager for the controller with the real network key
			const sm0Ctrlr = new SecurityManager({
				ownNodeId: mockController.ownNodeId,
				networkKey: driver.options.securityKeys!.S0_Legacy!,
				nonceTimeout: 100000,
			});
			mockController.securityManagers.securityManager = sm0Ctrlr;
		},

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			// Set up a promise to wait for the "node added" event
			let includedNode: ZWaveNode | undefined;
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (node) => {
					includedNode = node;
					resolve();
				});
			});

			// Set up the node that will be included
			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					basicDeviceClass: BasicDeviceClass["Routing End Node"],
					genericDeviceClass: 0x40, // Entry Control
					specificDeviceClass: 0x03, // Secure Keypad Door Lock
					commandClasses: [
						CommandClasses["Manufacturer Specific"],
						CommandClasses.Security,
						CommandClasses.Version,
					],
				},
			};

			// Start the inclusion process
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Default,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				includedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;

			// Verify that the node was added to the controller's nodes map
			t.expect(includedNode).toBeDefined();
			t.expect(includedNode!.id).toBe(3);
			t.expect(includedNode!.isSecure).toBe(true);
			t.expect(includedNode!.supportsCC(CommandClasses.Security)).toBe(
				true,
			);
		},
	},
);
