import { BasicCCGet, BasicCCReport } from "@zwave-js/cc/BasicCC";
import { CommandClasses } from "@zwave-js/core";
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
