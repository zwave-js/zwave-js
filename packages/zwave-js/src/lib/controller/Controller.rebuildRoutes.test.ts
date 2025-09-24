import type { ThrowingMap } from "@zwave-js/shared";
import { MockController } from "@zwave-js/testing";
import { test as baseTest } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../Testing.js";
import type { Driver } from "../driver/Driver.js";
import { createAndStartTestingDriver } from "../driver/DriverMock.js";
import { ZWaveNode } from "../node/Node.js";

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

test("should filter out invalid node IDs from route rebuild", async ({ context, expect }) => {
	const { driver } = context;
	
	// Add valid nodes to the controller
	const node2 = new ZWaveNode(2, driver);
	const node3 = new ZWaveNode(3, driver);
	const node10 = new ZWaveNode(10, driver);
	(driver.controller.nodes as ThrowingMap<number, ZWaveNode>).set(2, node2);
	(driver.controller.nodes as ThrowingMap<number, ZWaveNode>).set(3, node3);
	(driver.controller.nodes as ThrowingMap<number, ZWaveNode>).set(10, node10);

	// Mock getAssociations to return some invalid node IDs
	const originalGetAssociations = driver.controller.getAssociations;
	driver.controller.getAssociations = ({ nodeId }) => {
		const mockAssociations = new Map();
		// Include valid node IDs, invalid node IDs (0, 233, 999), and non-existing node IDs (5)
		mockAssociations.set(1, [
			{ nodeId: 3 }, // valid, exists (should be kept)
			{ nodeId: 10 }, // valid, exists (should be kept)
			{ nodeId: 0 }, // invalid node ID (below range) - should be filtered
			{ nodeId: 5 }, // valid range, but doesn't exist - should be filtered
			{ nodeId: 233 }, // invalid node ID (above range) - should be filtered
			{ nodeId: 999 }, // invalid node ID (way above range) - should be filtered
		]);
		return mockAssociations;
	};

	// Mock assignReturnRoutes to track what nodes were actually processed
	const assignedRoutes: Array<{ nodeId: number; destinationNodeId: number }> = [];
	const originalAssignReturnRoutes = driver.controller.assignReturnRoutes;
	driver.controller.assignReturnRoutes = async (nodeId: number, destinationNodeId: number) => {
		assignedRoutes.push({ nodeId, destinationNodeId });
		return true; // Simulate success
	};

	// Mock other methods that might be called during route rebuild
	const originalAssignSUCReturnRoutes = driver.controller.assignSUCReturnRoutes;
	driver.controller.assignSUCReturnRoutes = async (nodeId: number) => {
		return true; // Simulate success
	};
	
	const originalDeleteReturnRoutes = driver.controller.deleteReturnRoutes;
	driver.controller.deleteReturnRoutes = async (nodeId: number) => {
		return true; // Simulate success
	};
	
	const originalDiscoverNodeNeighbors = driver.controller.discoverNodeNeighbors;
	driver.controller.discoverNodeNeighbors = async (nodeId: number) => {
		return true; // Simulate success
	};

	try {
		// Get the rebuild task for node 2 and execute it
		const task = (driver.controller as any).getRebuildNodeRoutesTask(node2);
		
		// The task should be a TaskBuilder, not a Promise
		expect(task).toHaveProperty('task');
		
		// Execute the task to see the filtering in action
		const result = await driver.scheduler.queueTask(task);
		expect(result).toBe(true);
		
		// Verify that only valid, existing nodes were processed for route assignment
		// Node 2 itself should be filtered out, leaving only nodes 3 and 10
		expect(assignedRoutes).toHaveLength(2);
		expect(assignedRoutes.every(r => r.nodeId === 2)).toBe(true);
		const destinationIds = assignedRoutes.map(r => r.destinationNodeId).sort((a, b) => a - b);
		expect(destinationIds).toEqual([3, 10]);
		
	} finally {
		// Restore original methods
		driver.controller.getAssociations = originalGetAssociations;
		driver.controller.assignReturnRoutes = originalAssignReturnRoutes;
		driver.controller.assignSUCReturnRoutes = originalAssignSUCReturnRoutes;
		driver.controller.deleteReturnRoutes = originalDeleteReturnRoutes;
		driver.controller.discoverNodeNeighbors = originalDiscoverNodeNeighbors;
	}
});