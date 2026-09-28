import "@zwave-js/cc";

import { BatteryCCAPI } from "@zwave-js/cc/BatteryCC";
import { ManufacturerSpecificCCValues } from "@zwave-js/cc/ManufacturerSpecificCC";
import { VersionCCAPI } from "@zwave-js/cc/VersionCC";
import { ConditionalDeviceConfig, type DeviceConfig } from "@zwave-js/config";
import {
	CommandClasses,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { MockController } from "@zwave-js/testing";
import { afterEach, test as baseTest, vi } from "vitest";

import { createDefaultMockControllerBehaviors } from "../../Testing.js";
import type { Driver } from "../driver/Driver.js";
import { createAndStartTestingDriver } from "../driver/DriverMock.js";

import { Endpoint } from "./Endpoint.js";
import { ZWaveNode } from "./Node.js";
import {
	setEndpointIndizes,
	setMultiChannelInterviewComplete,
} from "./utils.js";

interface LocalTestContext {
	context: {
		driver: Driver;
		controller: MockController;
		node?: ZWaveNode;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const context = {} as LocalTestContext["context"];

			const { driver } = await createAndStartTestingDriver({
				skipNodeInterview: true,
				loadConfiguration: false,
				async beforeStartup(mockPort, serial) {
					const controller = await MockController.create({
						mockPort,
						serial,
					});
					controller.defineBehavior(
						...createDefaultMockControllerBehaviors(),
					);
					context.controller = controller;
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

afterEach<LocalTestContext>(({ context, expect }) => {
	const { driver } = context;
	if (context.node) {
		context.node.destroy();
		driver.controller["_nodes"].delete(context.node.id);
	}
	vi.restoreAllMocks();
	driver.networkCache.clear();
	driver.valueDB?.clear();
});

test.sequential("createAPI() throws if a non-implemented API should be created", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);

	assertZWaveError(expect, () => endpoint.createAPI(0xbada55), {
		errorCode: ZWaveErrorCodes.CC_NoAPI,
		messageMatches: "no associated API",
	});
});

test.sequential("The API returned from createAPI() throws when trying to access a non-supported CC", async ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	// We must not use Basic CC here, because that is assumed to be always supported
	const api = endpoint.createAPI(CommandClasses["Binary Sensor"]);

	// this does not throw
	api.isSupported();
	// this does
	await assertZWaveError(expect, () => api.get(), {
		errorCode: ZWaveErrorCodes.CC_NotSupported,
		messageMatches: /Node 1 \(endpoint 1\) does not support/,
	});

	// It only includes the endpoint number for non-root endpoints
	(endpoint as any).index = 0;
	await assertZWaveError(expect, () => api.get(), {
		errorCode: ZWaveErrorCodes.CC_NotSupported,
		messageMatches: "Node 1 does not support",
	});
});

test.sequential("The commandClasses dictionary throws when trying to access a non-implemented CC", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	assertZWaveError(expect, () => (endpoint.commandClasses as any).FOOBAR, {
		errorCode: ZWaveErrorCodes.CC_NotImplemented,
		messageMatches: "FOOBAR is not implemented",
	});
});

test.sequential("The commandClasses dictionary throws when trying to use a command of an unsupported CC", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	assertZWaveError(expect, () => endpoint.commandClasses.Battery.get(), {
		errorCode: ZWaveErrorCodes.CC_NotSupported,
		messageMatches: "does not support the Command Class Battery",
	});
});

test.sequential("The commandClasses dictionary does not throw when checking support of a CC", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	expect(endpoint.commandClasses.Battery.isSupported()).toBe(false);
});

test.sequential("The commandClasses dictionary does not throw when accessing the ID of a CC", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	expect(endpoint.commandClasses.Battery.ccId).toBe(CommandClasses.Battery);
});

test.sequential("The commandClasses dictionary does not throw when scoping the API options", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	expect(() => endpoint.commandClasses.Battery.withOptions({})).not.toThrow();
});

test.sequential("The commandClasses dictionary returns all supported CCs when being enumerated", ({
	context,
	expect,
}) => {
	const { driver } = context;
	// No supported CCs, empty array
	let node = new ZWaveNode(2, driver, undefined, []);
	let actual = [...node.commandClasses];
	expect(actual).toStrictEqual([]);

	// Supported and controlled CCs
	node = new ZWaveNode(
		2,
		driver,
		undefined,
		[CommandClasses.Battery, CommandClasses.Version],
		[CommandClasses["Wake Up"]],
	);
	actual = [...node.commandClasses];
	expect(actual.length).toBe(2);
	expect(actual.map((api) => api.constructor)).toStrictEqual([
		BatteryCCAPI,
		VersionCCAPI,
		// WakeUpCCAPI is not supported (only controlled), so no API!
	]);
	node.destroy();
});

test.sequential("The commandClasses dictionary returns [object Object] when turned into a string", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const node = new ZWaveNode(2, driver, undefined, []);
	expect((node.commandClasses as any)[Symbol.toStringTag]).toBe(
		"[object Object]",
	);
	node.destroy();
});

test.sequential("The commandClasses dictionary returns undefined for other symbol properties", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const node = new ZWaveNode(2, driver, undefined, []);
	expect((node.commandClasses as any)[Symbol.unscopables]).toBeUndefined();
	node.destroy();
});

test.sequential("createCCInstance() returns undefined if the node supports the CC but it is not yet implemented", ({
	context,
	expect,
}) => {
	const { driver } = context;
	const endpoint = new Endpoint(1, driver, 1);
	const cc = 0xbada55;
	endpoint.addCC(cc, { isSupported: true });
	const instance = endpoint.createCCInstance(cc);
	expect(instance).toBeUndefined();
});

function groupConfig(
	endpointGroups: Record<
		string,
		{ label: string; endpoints: number[]; isMainDevice?: boolean }
	> = {
		"1": { label: "Clamp 1", endpoints: [1, 2] },
		"2": { label: "Mains", endpoints: [3, 4], isMainDevice: true },
	},
) {
	return new ConditionalDeviceConfig("test.json", true, {
		manufacturer: "Test",
		manufacturerId: "0x0001",
		label: "Test",
		description: "Test",
		devices: [{ productType: "0x0001", productId: "0x0001" }],
		firmwareVersion: { min: "0.0", max: "255.255" },
		endpoints: {
			"0": { label: "Meter" },
			"1": { label: "Consumption" },
		},
		endpointGroups,
	}).evaluate({
		manufacturerId: 1,
		productType: 1,
		productId: 1,
		firmwareVersion: "1.0",
	});
}

async function loadDeviceConfig(
	context: LocalTestContext["context"],
	node: ZWaveNode,
	config: DeviceConfig | undefined,
): Promise<void> {
	vi.spyOn(context.driver.configManager, "lookupDevice").mockResolvedValue(
		config,
	);
	await node["loadDeviceConfig"]();
}

async function nodeWithGroups(
	context: LocalTestContext["context"],
): Promise<ZWaveNode> {
	const node = new ZWaveNode(2, context.driver, undefined, [
		CommandClasses["Multi Channel"],
	]);
	context.node = node;
	context.driver.controller["_nodes"].set(node.id, node);
	node.valueDB.setValue(ManufacturerSpecificCCValues.manufacturerId.id, 1);
	node.valueDB.setValue(ManufacturerSpecificCCValues.productType.id, 1);
	node.valueDB.setValue(ManufacturerSpecificCCValues.productId.id, 1);
	setEndpointIndizes(context.driver, node.id, [1, 2, 3, 4, 5]);
	setMultiChannelInterviewComplete(context.driver, node.id, true);
	await loadDeviceConfig(context, node, groupConfig());
	return node;
}

test.sequential("endpoint groups resolve their existing endpoints", async ({
	context,
	expect,
}) => {
	const node = await nodeWithGroups(context);
	await loadDeviceConfig(
		context,
		node,
		groupConfig({
			"1": { label: "Clamp 1", endpoints: [1, 2, 9] },
			"2": { label: "Mains", endpoints: [3, 4], isMainDevice: true },
		}),
	);
	const groups = node.endpointGroups!;
	expect([...groups.keys()]).toEqual([1, 2]);
	expect(groups.get(1)?.label).toBe("Clamp 1");
	expect(groups.get(1)?.isMainDevice).toBe(false);
	expect(groups.get(2)?.isMainDevice).toBe(true);
	expect(groups.get(1)?.endpointIndices).toEqual([1, 2, 9]);
	expect(groups.get(1)?.getEndpoints()).toEqual([
		node.getEndpoint(1),
		node.getEndpoint(2),
	]);
	expect(groups.get(2)?.getEndpoints()).toEqual([
		node.getEndpoint(3),
		node.getEndpoint(4),
	]);
});

test.sequential("getGroup() returns the group containing the endpoint", async ({
	context,
	expect,
}) => {
	const node = await nodeWithGroups(context);
	const groups = node.endpointGroups!;
	expect(node.getEndpoint(1)?.getGroup()).toBe(groups.get(1));
	expect(node.getEndpoint(2)?.getGroup()).toBe(groups.get(1));
	expect(node.getEndpoint(3)?.getGroup()).toBe(groups.get(2));
	expect(node.getGroup()).toBeUndefined();
	expect(node.getEndpoint(5)?.getGroup()).toBeUndefined();
});

test.sequential("endpoint groups follow device config changes", async ({
	context,
	expect,
}) => {
	const node = await nodeWithGroups(context);
	const endpoint = node.getEndpoint(1)!;

	await loadDeviceConfig(
		context,
		node,
		groupConfig({
			"1": { label: "First Clamp", endpoints: [1, 3] },
		}),
	);
	expect(node.endpointGroups?.get(1)?.label).toBe("First Clamp");
	expect(endpoint.getGroup()).toBe(node.endpointGroups?.get(1));
	expect(node.getEndpoint(2)?.getGroup()).toBeUndefined();

	await loadDeviceConfig(context, node, undefined);
	expect(node.endpointGroups).toBeUndefined();
	expect(endpoint.getGroup()).toBeUndefined();
});

test.sequential("node dumps contain endpoint groups and endpoint labels", async ({
	context,
	expect,
}) => {
	const node = await nodeWithGroups(context);

	const dump = node.getEndpoint(1)!.createEndpointDump();
	expect(dump.endpointLabel).toBe("Consumption");
	expect(dump).not.toHaveProperty("group");

	const nodeDump = node.createDump();
	expect(nodeDump.endpointLabel).toBe("Meter");
	expect(nodeDump.endpointGroups).toEqual([
		{
			id: 1,
			label: "Clamp 1",
			isMainDevice: false,
			endpointIndices: [1, 2],
		},
		{ id: 2, label: "Mains", isMainDevice: true, endpointIndices: [3, 4] },
	]);
	expect(Object.keys(nodeDump.endpoints!)).toEqual(["1", "2", "3", "4", "5"]);
	expect(() => JSON.stringify(nodeDump)).not.toThrow();
});
