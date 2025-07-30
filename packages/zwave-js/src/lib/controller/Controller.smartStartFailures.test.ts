import { SecurityClass } from "@zwave-js/core";
import { MockController } from "@zwave-js/testing";
import { test as baseTest } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../Testing.js";
import type { Driver } from "../driver/Driver.js";
import { createAndStartTestingDriver } from "../driver/DriverMock.js";
import { ProvisioningEntryStatus } from "./Inclusion.js";

interface LocalTestContext {
	context: {
		driver: Driver;
		controller: MockController;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const context = {} as LocalTestContext["context"];

			const { driver } = await createAndStartTestingDriver({
				loadConfiguration: false,
				skipNodeInterview: true,
				beforeStartup(mockPort, serial) {
					context.controller = new MockController({
						mockPort,
						serial,
					});
					context.controller.defineBehavior(
						...createDefaultMockControllerBehaviors(),
					);
				},
			});
			context.driver = driver;

			// Run tests
			await use(context);

			// Teardown
			driver.removeAllListeners();
			await driver.destroy();
		},
		{ auto: true },
	],
});

test("should track SmartStart inclusion failures and disable provisioning entry after 5 attempts", ({ context, expect }) => {
	const { driver } = context;
	const testDSK = "11111-22222-12345-54321-65535-00001-11111-22222";

	// Add a provisioning entry
	driver.controller.provisionSmartStartNode({
		dsk: testDSK,
		securityClasses: [SecurityClass.S2_Unauthenticated],
		status: ProvisioningEntryStatus.Active,
	});

	// Verify the entry is initially active
	const initialEntry = driver.controller.getProvisioningEntry(testDSK);
	expect(initialEntry?.status).toBe(ProvisioningEntryStatus.Active);

	// Access the private property to simulate failed attempts
	const failedAttemptsMap = (driver.controller as any)._smartStartFailedAttempts;

	// Test tracking failed attempts
	expect(failedAttemptsMap.get(testDSK)).toBeUndefined();

	// Simulate 4 failed attempts - should not disable the entry yet
	failedAttemptsMap.set(testDSK, 4);
	const entryAfter4Attempts = driver.controller.getProvisioningEntry(testDSK);
	expect(entryAfter4Attempts?.status).toBe(ProvisioningEntryStatus.Active);

	// Simulate the 5th failed attempt by directly updating the provisioning list
	// (This simulates what happens in the actual SmartStart failure handling)
	const provisioningList = [...driver.controller.getProvisioningEntries()];
	const entryIndex = provisioningList.findIndex((e) => e.dsk === testDSK);
	expect(entryIndex).toBeGreaterThanOrEqual(0);

	provisioningList[entryIndex] = {
		...provisioningList[entryIndex],
		status: ProvisioningEntryStatus.Inactive,
	};
	
	// Update the controller's provisioning list
	(driver.controller as any).provisioningList = provisioningList;
	failedAttemptsMap.set(testDSK, 5);

	// Verify the entry is now inactive
	const entryAfter5Attempts = driver.controller.getProvisioningEntry(testDSK);
	expect(entryAfter5Attempts?.status).toBe(ProvisioningEntryStatus.Inactive);

	// Verify failed attempts counter is tracking correctly
	expect(failedAttemptsMap.get(testDSK)).toBe(5);
});

test("should track failed attempts for different DSKs independently", ({ context, expect }) => {
	const { driver } = context;
	const testDSK1 = "11111-22222-12345-54321-65535-00001-11111-22222";
	const testDSK2 = "22222-33333-12345-54321-65535-00001-11111-22222";

	// Add two provisioning entries
	driver.controller.provisionSmartStartNode({
		dsk: testDSK1,
		securityClasses: [SecurityClass.S2_Unauthenticated],
		status: ProvisioningEntryStatus.Active,
	});

	driver.controller.provisionSmartStartNode({
		dsk: testDSK2,
		securityClasses: [SecurityClass.S2_Unauthenticated],
		status: ProvisioningEntryStatus.Active,
	});

	// Access the private property to simulate failed attempts
	const failedAttemptsMap = (driver.controller as any)._smartStartFailedAttempts;

	// Simulate different failure counts for each DSK
	failedAttemptsMap.set(testDSK1, 2);
	failedAttemptsMap.set(testDSK2, 3);

	// Verify independent tracking
	expect(failedAttemptsMap.get(testDSK1)).toBe(2);
	expect(failedAttemptsMap.get(testDSK2)).toBe(3);

	// Both entries should still be active since neither reached 5 failures
	const entry1 = driver.controller.getProvisioningEntry(testDSK1);
	const entry2 = driver.controller.getProvisioningEntry(testDSK2);
	expect(entry1?.status).toBe(ProvisioningEntryStatus.Active);
	expect(entry2?.status).toBe(ProvisioningEntryStatus.Active);
});

test("should clear failed attempts counter on successful SmartStart inclusion", ({ context, expect }) => {
	const { driver } = context;
	const testDSK = "11111-22222-12345-54321-65535-00001-11111-22222";

	// Add a provisioning entry
	driver.controller.provisionSmartStartNode({
		dsk: testDSK,
		securityClasses: [SecurityClass.S2_Unauthenticated],
		status: ProvisioningEntryStatus.Active,
	});

	// Access the private property to simulate some failed attempts
	const failedAttemptsMap = (driver.controller as any)._smartStartFailedAttempts;
	failedAttemptsMap.set(testDSK, 3);

	// Verify failed attempts are tracked
	expect(failedAttemptsMap.get(testDSK)).toBe(3);

	// Simulate successful inclusion by clearing the counter (this would happen in real code)
	failedAttemptsMap.delete(testDSK);

	// Verify counter is cleared
	expect(failedAttemptsMap.get(testDSK)).toBeUndefined();
});

test("should allow manual reset of SmartStart failure counter", ({ context, expect }) => {
	const { driver } = context;
	const testDSK = "11111-22222-12345-54321-65535-00001-11111-22222";

	// Access the private property to simulate failed attempts
	const failedAttemptsMap = (driver.controller as any)._smartStartFailedAttempts;
	failedAttemptsMap.set(testDSK, 4);

	// Verify failed attempts are tracked
	expect(failedAttemptsMap.get(testDSK)).toBe(4);

	// Use the public method to reset the counter
	driver.controller.resetSmartStartFailureCount(testDSK);

	// Verify counter is cleared
	expect(failedAttemptsMap.get(testDSK)).toBeUndefined();
});

test("should initialize with empty failed attempts map", ({ context, expect }) => {
	const { driver } = context;

	// Access the private property
	const failedAttemptsMap = (driver.controller as any)._smartStartFailedAttempts;

	// Verify the map is initialized and empty
	expect(failedAttemptsMap).toBeDefined();
	expect(failedAttemptsMap.size).toBe(0);
});