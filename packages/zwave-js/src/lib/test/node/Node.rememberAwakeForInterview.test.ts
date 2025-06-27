import { CommandClasses } from "@zwave-js/core";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"If a node is considered awake when the interview starts, this should be remembered (waitForWakeup = true)",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/sleepingNode"),

		nodeCapabilities: {
			manufacturerId: 0x0000,
			productType: 0xdead,
			productId: 0xbeef,

			isListening: false,
			isFrequentListening: false,

			commandClasses: [
				CommandClasses["Manufacturer Specific"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Mark the node as awake shortly before the interview starts
			node.markAsAwake();
			void node.refreshInfo();

			const interviewDone = createDeferredPromise<void>();
			node.once("interview completed", () => {
				interviewDone.resolve();
			});

			// The interview should complete quickly
			const testResult = await Promise.race([
				interviewDone.then(() => true),
				wait(2000).then(() => false),
			]);
			t.expect(testResult, "The interview did not complete").toBe(true);
		},
	},
);

integrationTest(
	"If the interview waits for a node to wake up, it should be remembered as being awake (waitForWakeup = true)",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/sleepingNode"),

		nodeCapabilities: {
			manufacturerId: 0x0000,
			productType: 0xdead,
			productId: 0xbeef,

			isListening: false,
			isFrequentListening: false,

			commandClasses: [
				CommandClasses["Manufacturer Specific"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Mark the node as awake shortly after the interview starts
			node.markAsAsleep();
			void node.refreshInfo();
			setTimeout(() => {
				node.markAsAwake();
			}, 100);

			const interviewDone = createDeferredPromise<void>();
			node.once("interview completed", () => {
				interviewDone.resolve();
			});

			// The interview should complete quickly
			const testResult = await Promise.race([
				interviewDone.then(() => true),
				wait(2000).then(() => false),
			]);
			t.expect(testResult, "The interview did not complete").toBe(true);
		},
	},
);

integrationTest(
	"If a node is considered awake when the interview starts, this should be remembered (waitForWakeup = false)",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/sleepingNode"),

		nodeCapabilities: {
			manufacturerId: 0x0000,
			productType: 0xdead,
			productId: 0xbeef,

			isListening: false,
			isFrequentListening: false,

			commandClasses: [
				CommandClasses["Manufacturer Specific"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Mark the node as awake shortly before the interview starts
			node.markAsAwake();
			void node.refreshInfo({ waitForWakeup: false });

			const interviewDone = createDeferredPromise<void>();
			node.once("interview completed", () => {
				interviewDone.resolve();
			});

			// The interview should complete quickly
			const testResult = await Promise.race([
				interviewDone.then(() => true),
				wait(2000).then(() => false),
			]);
			t.expect(testResult, "The interview did not complete").toBe(true);
		},
	},
);

integrationTest(
	"If the interview waits for a node to wake up, it should be remembered as being awake (waitForWakeup = false)",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/sleepingNode"),

		nodeCapabilities: {
			manufacturerId: 0x0000,
			productType: 0xdead,
			productId: 0xbeef,

			isListening: false,
			isFrequentListening: false,

			commandClasses: [
				CommandClasses["Manufacturer Specific"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Mark the node as awake shortly after the interview starts
			node.markAsAsleep();
			void node.refreshInfo({ waitForWakeup: false });
			setTimeout(() => {
				node.markAsAwake();
			}, 100);

			const interviewDone = createDeferredPromise<void>();
			node.once("interview completed", () => {
				interviewDone.resolve();
			});

			// The interview should complete quickly
			const testResult = await Promise.race([
				interviewDone.then(() => true),
				wait(2000).then(() => false),
			]);
			t.expect(testResult, "The interview did not complete").toBe(true);
		},
	},
);
