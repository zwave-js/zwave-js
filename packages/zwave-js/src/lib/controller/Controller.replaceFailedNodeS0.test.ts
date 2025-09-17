import { CommandClasses, SecurityManager } from "@zwave-js/core";
import { test as baseTest } from "vitest";
import type { Driver } from "../driver/Driver.js";
import { ZWaveNode } from "../node/Node.js";
import { createEmptyMockDriver } from "../test/mocks.js";
import { ZWaveController } from "./Controller.js";
import { SecurityBootstrapFailure } from "./Inclusion.js";

interface LocalTestContext {
	context: {
		fakeDriver: Driver;
		controller: ZWaveController;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const context = {} as LocalTestContext["context"];

			// Create a proper mock driver with security manager
			const fakeDriver = createEmptyMockDriver() as unknown as Driver;
			fakeDriver.registerRequestHandler = () => {};
			await fakeDriver.configManager.loadAll();

			// Set up security manager (this is what was missing!)
			(fakeDriver as any).securityManager = new SecurityManager({
				ownNodeId: 1,
				networkKey: new Uint8Array(16).fill(0x01),
				nonceTimeout: 100000,
			});

			// Create controller
			const controller = new ZWaveController(fakeDriver);
			(fakeDriver as any).controller = controller;

			context.fakeDriver = fakeDriver;
			context.controller = controller;

			// Run tests
			await use(context);

			// Teardown
		},
		{ auto: true },
	],
});

test("secureBootstrapS0 should add Security CC when assumeSupported is true", async ({ context, expect }) => {
	// This test verifies that secureBootstrapS0 correctly adds Security CC when assumeSupported=true
	// This is the core behavior that was missing in the replaceFailedNodeTask method
	// as described in:
	// https://github.com/zwave-js/zwave-js/issues/8037
	// https://github.com/zwave-js/zwave-js/discussions/8036

	const { fakeDriver, controller } = context;

	// Create a fresh node instance
	const newNode = new ZWaveNode(3, fakeDriver);

	// Verify the node doesn't support Security CC initially
	expect(newNode.supportsCC(CommandClasses.Security)).toBe(false);

	// Call the actual secureBootstrapS0 method with assumeSupported=true
	const result = await (controller as any).secureBootstrapS0(
		newNode,
		true,
		true,
	);

	// The Security CC should have been added to the node
	// This is the key behavior we're testing - that the Security CC gets added
	expect(newNode.supportsCC(CommandClasses.Security)).toBe(true);

	// The method should return undefined if it succeeds, or a failure value if it fails
	// The important thing is that it doesn't fail due to missing Security CC
	// (result can be undefined for success or a SecurityBootstrapFailure enum value for failure)
	expect(result).toBeUndefined();
});

test("secureBootstrapS0 should not add Security CC when assumeSupported is false", async ({ context, expect }) => {
	// This test verifies that secureBootstrapS0 does NOT add Security CC when assumeSupported=false
	// This ensures the fix doesn't break existing behavior for normal inclusion

	const { fakeDriver, controller } = context;

	// Create a fresh node instance
	const newNode = new ZWaveNode(3, fakeDriver);

	// Verify the node doesn't support Security CC initially
	expect(newNode.supportsCC(CommandClasses.Security)).toBe(false);

	// Call the  secureBootstrapS0 method with assumeSupported=false - This is the default behavior for normal inclusion
	const result = await (controller as any).secureBootstrapS0(
		newNode,
		true,
		false,
	);

	// The method should return a failure (due to missing Security CC)
	expect(result).toBe(SecurityBootstrapFailure.Timeout);

	// The Security CC should NOT have been added to the node
	expect(newNode.supportsCC(CommandClasses.Security)).toBe(false);
});
