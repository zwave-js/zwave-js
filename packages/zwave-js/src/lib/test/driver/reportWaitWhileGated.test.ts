import { BasicCCGet, BasicCCReport } from "@zwave-js/cc/BasicCC";
import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { abortable } from "@zwave-js/shared";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";

import { integrationTest } from "../integrationTestSuite.js";

integrationTest.sequential(
	"A report that arrives after another operation had exclusive access to the controller still answers the Get",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The node answers only after the exclusive access, like a node that first waits for a nonce from the driver
			const receivedGet = createDeferredPromise<void>();
			const delayReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						receivedGet.resolve();
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(delayReport);

			// Send the Get and wait until the node received it
			const getPromise = node.commandClasses.Basic.get();
			await receivedGet;
			// Let the transmission finish, so the driver waits for the report
			await wait(100);

			// The report timeout of 1 second runs out while another operation has exclusive access to the controller
			const release = createDeferredPromise<void>();
			const access = driver.withExclusiveControllerAccess(() => release);
			// Keep the exclusive access past the report timeout, then end it
			await wait(1200);
			release.resolve();
			await access;

			// Let the node send its report after the exclusive access ended
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					new BasicCCReport({
						nodeId: mockController.ownNodeId,
						currentValue: 42,
					}),
					{ ackRequested: false },
				),
			);

			// The report must still answer the Get
			t.expect((await getPromise)?.currentValue).toBe(42);
		},
	},
);

integrationTest.sequential(
	"A report that arrives while another operation still has exclusive access to the controller answers the Get",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Let the node answer only when the test sends its report
			const receivedGet = createDeferredPromise<void>();
			const delayReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						receivedGet.resolve();
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(delayReport);

			// Send the Get and let its transmission finish
			const getPromise = node.commandClasses.Basic.get();
			await receivedGet;
			await wait(100);

			// Take exclusive access until the test ends it
			const release = createDeferredPromise<void>();
			const access = driver.withExclusiveControllerAccess(() => release);
			// The report timeout of 1 second runs out, then the report arrives during the exclusive access
			await wait(1200);
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					new BasicCCReport({
						nodeId: mockController.ownNodeId,
						currentValue: 42,
					}),
					{ ackRequested: false },
				),
			);
			// End the exclusive access after the report arrived
			await wait(100);
			release.resolve();
			await access;

			// The report must answer the Get
			t.expect((await getPromise)?.currentValue).toBe(42);
		},
	},
);

integrationTest.sequential(
	"Destroying the driver while a Get waits for another operation's exclusive access to end rejects it with Driver_Destroyed",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Let the node never answer the Get
			const receivedGet = createDeferredPromise<void>();
			const noReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						receivedGet.resolve();
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(noReport);

			// Send the Get and let its transmission finish
			const getPromise = node.commandClasses.Basic.get();
			// The Get is rejected during destroy(), before the assertion runs
			getPromise.catch(() => {});
			await receivedGet;
			await wait(100);

			// Take exclusive access until the driver is destroyed
			const release = createDeferredPromise<void>();
			void driver
				.withExclusiveControllerAccess((send, signal) =>
					abortable(release, signal),
				)
				.catch(() => {});
			// The report timeout runs out, so the Get waits for the exclusive access to end
			await wait(1200);

			// Destroy the driver while the Get waits for the exclusive access to end
			await driver.destroy();
			// The Get fails with Driver_Destroyed
			await t.expect(getPromise).rejects.toMatchObject({
				code: ZWaveErrorCodes.Driver_Destroyed,
			});
		},
	},
);

integrationTest.sequential(
	"Destroying the driver while a Get waits for its report rejects it with Driver_Destroyed right away",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Basic],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation, so the deadline is far away
			driver.options.timeouts.report = 5000;
			// Let the node never answer the Get
			const receivedGet = createDeferredPromise<void>();
			const noReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						receivedGet.resolve();
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(noReport);

			// Send the Get and let its transmission finish
			const getPromise = node.commandClasses.Basic.get();
			// The Get is rejected during destroy(), before the assertion runs
			getPromise.catch(() => {});
			await receivedGet;
			await wait(100);

			// Destroy the driver while the Get waits for its report
			await driver.destroy();
			// The Get must fail with Driver_Destroyed before the report timeout
			const result = await Promise.race([
				getPromise.then(
					() => "resolved",
					(e: { code?: number }) => e.code,
				),
				wait(1000).then(() => "still pending"),
			]);
			t.expect(result).toBe(ZWaveErrorCodes.Driver_Destroyed);
		},
	},
);
