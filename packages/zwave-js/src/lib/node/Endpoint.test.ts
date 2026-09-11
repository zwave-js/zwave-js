import "@zwave-js/cc";

import { BatteryCCAPI } from "@zwave-js/cc/BatteryCC";
import { VersionCCAPI } from "@zwave-js/cc/VersionCC";
import { ConditionalDeviceConfig } from "@zwave-js/config";
import {
	CommandClasses,
	InterviewStage,
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
	endpointGroups: Record<string, { label: string; endpoints: number[] }> = {
		"1": { label: "Clamp 1", endpoints: [1, 2] },
		"2": { label: "Clamp 2", endpoints: [0, 3] },
	},
) {
	return new ConditionalDeviceConfig("test.json", true, {
		manufacturer: "Test",
		manufacturerId: "0x0001",
		label: "Test",
		description: "Test",
		devices: [{ productType: "0x0001", productId: "0x0001" }],
		firmwareVersion: { min: "0.0", max: "255.255" },
		endpoints: { "1": { label: "Consumption" } },
		endpointGroups,
	}).evaluate({
		manufacturerId: 1,
		productType: 1,
		productId: 1,
		firmwareVersion: "1.0",
	});
}

function nodeWithGroups(context: LocalTestContext["context"]): ZWaveNode {
	const node = new ZWaveNode(2, context.driver, undefined, [
		CommandClasses["Multi Channel"],
	]);
	context.node = node;
	context.driver.controller["_nodes"].set(node.id, node);
	node["deviceConfig"] = groupConfig();
	setEndpointIndizes(context.driver, node.id, [1, 2, 3, 4]);
	return node;
}

test.sequential("endpoint groups are unavailable before endpoint discovery", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	const log = vi.spyOn(context.driver.controllerLog, "logNode");
	expect(node.endpointGroups).toBeUndefined();
	expect(node.group).toBeUndefined();
	expect(log).not.toHaveBeenCalled();
});

test.sequential("endpoint groups share existing endpoint instances, including the root", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	setMultiChannelInterviewComplete(context.driver, node.id, true);
	const groups = node.endpointGroups!;
	expect([...groups.keys()]).toEqual([1, 2]);
	expect(groups.get(1)).toEqual({
		id: 1,
		label: "Clamp 1",
		endpoints: [node.getEndpoint(1), node.getEndpoint(2)],
	});
	expect(groups.get(2)?.endpoints).toEqual([node, node.getEndpoint(3)]);
	expect(node.getEndpoint(1)?.group).toBe(groups.get(1));
	expect(node.getEndpoint(2)?.group).toBe(groups.get(1));
	expect(node.group).toBe(groups.get(2));
	expect(node.getEndpoint(4)?.group).toBeUndefined();
	expect(node.endpointGroups).toBe(groups);
	expect(node.getAllEndpoints().map((endpoint) => endpoint.index)).toEqual([
		0, 1, 2, 3, 4,
	]);
});

test.sequential("missing group members are logged once and empty groups are omitted", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	node["deviceConfig"] = groupConfig({
		"1": { label: "Clamp 1", endpoints: [1, 9] },
		"2": { label: "Clamp 2", endpoints: [8] },
	});
	const log = vi
		.spyOn(context.driver.controllerLog, "logNode")
		.mockImplementation(() => {});
	expect(node.endpointGroups).toBeUndefined();
	expect(log).not.toHaveBeenCalled();

	setMultiChannelInterviewComplete(context.driver, node.id, true);
	log.mockClear();
	const groups = node.endpointGroups!;
	expect([...groups.keys()]).toEqual([1]);
	expect(groups.get(1)?.endpoints).toEqual([node.getEndpoint(1)]);
	expect(node.endpointGroups).toBe(groups);
	expect(node.getEndpoint(1)?.group).toBe(groups.get(1));
	expect(log.mock.calls).toEqual([
		[node.id, "Endpoint group 1 references missing endpoint 9", "warn"],
		[node.id, "Endpoint group 2 references missing endpoint 8", "warn"],
	]);
});

test.sequential("endpoint groups refresh when device config is replaced or removed", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	setMultiChannelInterviewComplete(context.driver, node.id, true);
	const original = node.endpointGroups!;
	const endpoint = node.getEndpoint(1)!;

	node["deviceConfig"] = groupConfig({
		"1": { label: "First Clamp", endpoints: [1, 3] },
		"2": { label: "Second Clamp", endpoints: [0, 2] },
	});
	const updated = node.endpointGroups!;
	expect(updated).not.toBe(original);
	expect(updated.get(1)?.label).toBe("First Clamp");
	expect(updated.get(1)?.endpoints).toEqual([endpoint, node.getEndpoint(3)]);
	expect(endpoint.group).toBe(updated.get(1));
	expect(node.getEndpoint(2)?.group).toBe(updated.get(2));

	node["deviceConfig"] = undefined;
	expect(node.endpointGroups?.size).toBe(0);
	expect(endpoint.group).toBeUndefined();
});

test.sequential("endpoint groups refresh when endpoint instances or discovery change", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	setMultiChannelInterviewComplete(context.driver, node.id, true);
	const original = node.endpointGroups!;
	const endpoint = node.getEndpoint(1)!;

	node["_endpointInstances"].clear();
	expect(node.endpointGroups).not.toBe(original);
	expect(node.getEndpoint(1)).not.toBe(endpoint);
	expect(endpoint.group).toBeUndefined();
	expect(node.getEndpoint(1)?.group).toBe(node.endpointGroups?.get(1));

	setEndpointIndizes(context.driver, node.id, [1]);
	expect(node.endpointGroups?.get(1)?.endpoints).toEqual([
		node.getEndpoint(1),
	]);
	expect(node.endpointGroups?.get(2)?.endpoints).toEqual([node]);
	setMultiChannelInterviewComplete(context.driver, node.id, false);
	expect(node.endpointGroups).toBeUndefined();
	expect(node.group).toBeUndefined();
});

test.sequential("endpoint dumps serialize labels and group membership without cycles", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	setMultiChannelInterviewComplete(context.driver, node.id, true);
	const dump = node.getEndpoint(1)!.createEndpointDump();
	expect(dump.endpointLabel).toBe("Consumption");
	expect(dump.group).toEqual({
		id: 1,
		label: "Clamp 1",
		endpoints: [1, 2],
	});
	expect(JSON.parse(JSON.stringify(dump))).toEqual(dump);
	const rootDump = node.createDump();
	expect(rootDump.group).toEqual({
		id: 2,
		label: "Clamp 2",
		endpoints: [0, 3],
	});
	expect(() => JSON.stringify(rootDump)).not.toThrow();
});

test.sequential("nodes without Multi Channel expose groups after their command-class interview", ({
	context,
	expect,
}) => {
	const node = nodeWithGroups(context);
	node.removeCC(CommandClasses["Multi Channel"]);
	setEndpointIndizes(context.driver, node.id, []);
	node["deviceConfig"] = undefined;
	expect(node.endpointGroups).toBeUndefined();
	node["setInterviewStage"](InterviewStage.CommandClasses);
	expect(node.endpointGroups?.size).toBe(0);
	node["deviceConfig"] = groupConfig({
		"1": { label: "Relay", endpoints: [0] },
	});
	expect(node.endpointGroups?.get(1)?.endpoints).toEqual([node]);
	expect(node.group).toBe(node.endpointGroups?.get(1));
});
