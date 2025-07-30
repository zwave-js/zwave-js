import {
	CentralSceneCC,
	CentralSceneCCConfigurationGet,
	CentralSceneCCConfigurationReport,
	CentralSceneCCConfigurationSet,
	CentralSceneCCNotification,
	CentralSceneCCSupportedGet,
	CentralSceneCCSupportedReport,
	CentralSceneCommand,
	CentralSceneKeys,
	CommandClass,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test, vi } from "vitest";

function buildCCBuffer(payload: Uint8Array): Uint8Array {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Central Scene"], // CC
		]),
		payload,
	]);
}

test("the ConfigurationGet command should serialize correctly", async (t) => {
	const cc = new CentralSceneCCConfigurationGet({
		nodeId: 1,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.ConfigurationGet, // CC Command
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationSet command should serialize correctly (flags set)", async (t) => {
	const cc = new CentralSceneCCConfigurationSet({
		nodeId: 2,
		slowRefresh: true,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.ConfigurationSet, // CC Command
			0b1000_0000,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationSet command should serialize correctly (flags not set)", async (t) => {
	const cc = new CentralSceneCCConfigurationSet({
		nodeId: 2,
		slowRefresh: false,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.ConfigurationSet, // CC Command
			0,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationReport command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.ConfigurationReport, // CC Command
			0b1000_0000,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as CentralSceneCCConfigurationReport;
	t.expect(cc.constructor).toBe(CentralSceneCCConfigurationReport);

	t.expect(cc.slowRefresh).toBe(true);
});

test("the SupportedGet command should serialize correctly", async (t) => {
	const cc = new CentralSceneCCSupportedGet({
		nodeId: 1,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.SupportedGet, // CC Command
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the SupportedReport command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.SupportedReport, // CC Command
			2, // # of scenes
			0b1_0000_10_0, // slow refresh, 2 bytes per scene, not identical
			0b1, // scene 1, key 1
			0b11, // scene 1, keys 9, 10
			0b10101, // scene 2, keys 1,3,5
			0,
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as CentralSceneCCSupportedReport;
	t.expect(cc.constructor).toBe(CentralSceneCCSupportedReport);

	t.expect(cc.sceneCount).toBe(2);
	t.expect(cc.supportsSlowRefresh).toBe(true);
	t.expect(cc.supportedKeyAttributes.size).toBe(2);
	// Key attributes start counting at 0
	t.expect(cc.supportedKeyAttributes.get(1)).toStrictEqual([0, 8, 9]);
	t.expect(cc.supportedKeyAttributes.get(2)).toStrictEqual([0, 2, 4]);
});

test("the Notification command should be deserialized correctly", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.Notification, // CC Command
			7, // sequence number
			0b1000_0000 | CentralSceneKeys.KeyPressed4x, // slow refresh
			8, // scene number
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as CentralSceneCCNotification;
	t.expect(cc.constructor).toBe(CentralSceneCCNotification);

	t.expect(cc.sequenceNumber).toBe(7);
	// slow refresh is only evaluated if the attribute is KeyHeldDown
	t.expect(cc.slowRefresh).toBeFalsy();
	t.expect(cc.keyAttribute).toBe(CentralSceneKeys.KeyPressed4x);
	t.expect(cc.sceneNumber).toBe(8);
});

test("the Notification command should be deserialized correctly (KeyHeldDown)", async (t) => {
	const ccData = buildCCBuffer(
		Uint8Array.from([
			CentralSceneCommand.Notification, // CC Command
			7, // sequence number
			0b1000_0000 | CentralSceneKeys.KeyHeldDown, // slow refresh
			8, // scene number
		]),
	);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as CentralSceneCCNotification;
	t.expect(cc.constructor).toBe(CentralSceneCCNotification);

	t.expect(cc.sequenceNumber).toBe(7);
	t.expect(cc.slowRefresh).toBe(true);
	t.expect(cc.keyAttribute).toBe(CentralSceneKeys.KeyHeldDown);
	t.expect(cc.sceneNumber).toBe(8);
});

test("deserializing an unsupported command should return an unspecified version of CentralSceneCC", async (t) => {
	const serializedCC = buildCCBuffer(
		Uint8Array.from([255]), // not a valid command
	);
	const cc = await CommandClass.parse(
		serializedCC,
		{ sourceNodeId: 1 } as any,
	) as CentralSceneCC;
	t.expect(cc.constructor).toBe(CentralSceneCC);
});

// test("the CC values should have the correct metadata", (t) => {
// 	// Readonly, 0-99
// 	const currentValueMeta = getCCValueMetadata(
// 		CommandClasses.CentralScene,
// 		"currentValue",
// 	);
// 	t.like(currentValueMeta, {
// 		readable: true,
// 		writeable: false,
// 		min: 0,
// 		max: 99,
// 	});

// 	// Writeable, 0-99
// 	const targetValueMeta = getCCValueMetadata(
// 		CommandClasses.CentralScene,
// 		"targetValue",
// 	);
// 	t.like(targetValueMeta, {
// 		readable: true,
// 		writeable: true,
// 		min: 0,
// 		max: 99,
// 	});
// });

test("CentralSceneCCSupportedReport should use custom scene labels from device config when available", async (t) => {
	// Mock device config with custom scenes
	const scenes = new Map([
		[1, { sceneId: 1, label: "Single Press", description: "Single button press" }],
		[2, { sceneId: 2, label: "Double Press", description: "Double button press" }],
		[3, { sceneId: 3, label: "Hold" }],
	]);
	
	const mockDeviceConfig = { scenes };
	
	// Mock context for persistValues
	const mockValueDB = {
		setMetadata: vi.fn(),
		hasMetadata: vi.fn().mockReturnValue(false),
		setValue: vi.fn(),
	};
	
	const mockContext = {
		nodeId: 123,
		getDeviceConfig: (nodeId: number) => mockDeviceConfig,
		getValueDB: () => mockValueDB,
		getSupportedCCVersion: vi.fn().mockReturnValue(1),
	};

	// Create a CentralSceneCCSupportedReport
	const cc = new CentralSceneCCSupportedReport({
		nodeId: 123,
		sceneCount: 3,
		supportsSlowRefresh: false,
		supportedKeyAttributes: {
			1: [CentralSceneKeys.KeyPressed],
			2: [CentralSceneKeys.KeyPressed, CentralSceneKeys.KeyPressed2x],
			3: [CentralSceneKeys.KeyHeldDown],
		},
	});

	// Call persistValues
	cc.persistValues(mockContext as any);

	// Verify that setMetadata was called with custom labels
	t.expect(mockValueDB.setMetadata).toHaveBeenCalledTimes(3);
	
	// Check the calls to setMetadata for custom labels
	const calls = mockValueDB.setMetadata.mock.calls;
	
	// Find the call for scene 1 and verify it has the custom label
	const scene1Call = calls.find(call => 
		call[1]?.label === "Single Press"
	);
	t.expect(scene1Call).toBeDefined();
	
	// Find the call for scene 2 and verify it has the custom label
	const scene2Call = calls.find(call => 
		call[1]?.label === "Double Press"
	);
	t.expect(scene2Call).toBeDefined();
	
	// Find the call for scene 3 and verify it has the custom label
	const scene3Call = calls.find(call => 
		call[1]?.label === "Hold"
	);
	t.expect(scene3Call).toBeDefined();
});

test("CentralSceneCCSupportedReport should fallback to default labels when no device config", async (t) => {
	// Mock context without device config
	const mockValueDB2 = {
		setMetadata: vi.fn(),
		hasMetadata: vi.fn().mockReturnValue(false),
		setValue: vi.fn(),
	};
	
	const mockContext = {
		nodeId: 123,
		getDeviceConfig: (nodeId: number) => undefined,
		getValueDB: () => mockValueDB2,
		getSupportedCCVersion: vi.fn().mockReturnValue(1),
	};

	// Create a CentralSceneCCSupportedReport
	const cc = new CentralSceneCCSupportedReport({
		nodeId: 123,
		sceneCount: 2,
		supportsSlowRefresh: false,
		supportedKeyAttributes: {
			1: [CentralSceneKeys.KeyPressed],
			2: [CentralSceneKeys.KeyPressed2x],
		},
	});

	// Call persistValues
	cc.persistValues(mockContext as any);

	// Verify that setMetadata was called with default labels
	t.expect(mockValueDB2.setMetadata).toHaveBeenCalledTimes(2);
	
	// Check the calls to setMetadata for default labels
	const calls = mockValueDB2.setMetadata.mock.calls;
	
	// Find the call for scene 1 and verify it has the default label
	const scene1Call = calls.find(call => 
		call[1]?.label === "Scene 001"
	);
	t.expect(scene1Call).toBeDefined();
	
	// Find the call for scene 2 and verify it has the default label
	const scene2Call = calls.find(call => 
		call[1]?.label === "Scene 002"
	);
	t.expect(scene2Call).toBeDefined();
});

test("CentralSceneCCNotification should use custom scene labels from device config when available", async (t) => {
	// Mock device config with custom scenes
	const scenes = new Map([
		[5, { sceneId: 5, label: "Release", description: "Button release action" }],
	]);
	
	const mockDeviceConfig = { scenes };
	
	// Mock context for persistValues
	const mockValueDB3 = {
		setMetadata: vi.fn(),
		hasMetadata: vi.fn().mockReturnValue(false),
		setValue: vi.fn(),
	};
	
	const mockContext = {
		nodeId: 123,
		getDeviceConfig: (nodeId: number) => mockDeviceConfig,
		getValueDB: () => mockValueDB3,
		getSupportedCCVersion: vi.fn().mockReturnValue(1),
	};

	// Create a CentralSceneCCNotification
	const cc = new CentralSceneCCNotification({
		nodeId: 123,
		sequenceNumber: 1,
		keyAttribute: CentralSceneKeys.KeyReleased,
		sceneNumber: 5,
	});

	// Call persistValues
	cc.persistValues(mockContext as any);

	// Verify that ensureMetadata was called with custom label
	t.expect(mockValueDB3.setMetadata).toHaveBeenCalledTimes(1);
	
	// Check the call to ensureMetadata
	const call = mockValueDB3.setMetadata.mock.calls[0];
	t.expect(call[1]?.label).toBe("Release");
});
