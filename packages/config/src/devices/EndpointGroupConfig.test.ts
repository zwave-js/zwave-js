import { ZWaveErrorCodes } from "@zwave-js/core";
import { expect, expectTypeOf, test } from "vitest";

import type { DeviceConfig, EndpointGroupConfig } from "../index.js";

import {
	ConditionalDeviceConfig,
	type DeviceConfigHashVersion,
} from "./DeviceConfig.js";
import { ConditionalEndpointGroupConfig } from "./EndpointGroupConfig.js";

const definition = {
	manufacturer: "Test Manufacturer",
	manufacturerId: "0xffff",
	label: "Test Device",
	description: "Endpoint group test device",
	devices: [{ productType: "0x0001", productId: "0x0001" }],
	firmwareVersion: { min: "0.0", max: "255.255" },
};

const deviceId = {
	manufacturerId: 0xffff,
	productType: 0x0001,
	productId: 0x0001,
	firmwareVersion: "1.0",
};

function parse(endpointGroups?: unknown): ConditionalDeviceConfig {
	return new ConditionalDeviceConfig("test.json", true, {
		...definition,
		endpointGroups,
	});
}

test("exposes endpoint groups as readonly metadata", () => {
	expectTypeOf<DeviceConfig["endpointGroups"]>().toEqualTypeOf<
		ReadonlyMap<number, EndpointGroupConfig> | undefined
	>();
	expectTypeOf<EndpointGroupConfig["endpoints"]>().toEqualTypeOf<
		readonly number[]
	>();

	const config = parse({
		1: { label: "Living Room", endpoints: [3, 1] },
		2: { label: "Kitchen", endpoints: [2, 127] },
	});
	expect(config.endpointGroups?.get(1)).toBeInstanceOf(
		ConditionalEndpointGroupConfig,
	);
	expect(config.evaluate(deviceId).endpointGroups).toEqual(
		new Map([
			[1, { id: 1, label: "Living Room", endpoints: [3, 1] }],
			[2, { id: 2, label: "Kitchen", endpoints: [2, 127] }],
		]),
	);
	expect(config.evaluate(deviceId).endpoints).toBeUndefined();
});

test("allows root membership alongside root associations", () => {
	const config = new ConditionalDeviceConfig("test.json", true, {
		...definition,
		endpointGroups: {
			1: { label: "Main Output", endpoints: [0, 1] },
		},
		associations: {
			1: { label: "Lifeline", maxNodes: 1, isLifeline: true },
		},
	}).evaluate(deviceId);

	expect(config.endpointGroups?.get(1)?.endpoints).toEqual([0, 1]);
	expect(config.getAssociationConfigForEndpoint(0, 1)?.isLifeline).toBe(true);
	expect(config.endpoints).toBeUndefined();
});

test("endpoint groups are optional", () => {
	expect(parse().endpointGroups).toBeUndefined();
	expect(parse().evaluate(deviceId).endpointGroups).toBeUndefined();
	expect(parse({}).evaluate(deviceId).endpointGroups).toBeUndefined();
});

test.each([null, false, 1, "groups", []].map((value) => ({ value })))(
	"rejects a non-object group map: %j",
	({ value: endpointGroups }) => {
		expect(() => parse(endpointGroups)).toThrow(
			"endpointGroups is not an object",
		);
	},
);

test.each([
	"0",
	"-1",
	"01",
	"1.0",
	"1.5",
	"+1",
	" 1",
	"1 ",
	"1e0",
	"0x1",
	"Infinity",
	"NaN",
	"abc",
	"9007199254740992",
	"999999999999999999999999",
])("rejects invalid group ID %s", (id) => {
	expect(() =>
		parse({ [id]: { label: "Output", endpoints: [1, 2] } }),
	).toThrow(`invalid endpoint group id "${id}"`);
});

test.each([[2], [1, 3], [1, 9007199254740991]])(
	"rejects nonsequential group IDs %j",
	(...ids) => {
		expect(() =>
			parse(
				Object.fromEntries(
					ids.map((id) => [
						id,
						{ label: "Output", endpoints: [1, 2] },
					]),
				),
			),
		).toThrow("endpointGroups IDs must start at 1 without gaps");
	},
);

test.each([null, false, 1, "group", []].map((value) => ({ value })))(
	"rejects a non-object group definition: %j",
	({ value: group }) => {
		expect(() => parse({ 1: group })).toThrow(
			"Endpoint group 1 is not an object",
		);
	},
);

test.each(
	[undefined, null, false, 1, "", " \t\n", [], {}].map((value) => ({
		value,
	})),
)("rejects an invalid or missing label: %j", ({ value: label }) => {
	expect(() => parse({ 1: { label, endpoints: [1, 2] } })).toThrow(
		"label must be a nonblank string",
	);
});

test.each(
	[undefined, null, false, 1, "1,2", {}, []].map((value) => ({ value })),
)(
	"rejects an invalid or missing endpoints array: %j",
	({ value: endpoints }) => {
		expect(() => parse({ 1: { label: "Output", endpoints } })).toThrow(
			"endpoints must be a nonempty array",
		);
	},
);

test.each(
	[
		-1,
		128,
		1.5,
		NaN,
		Infinity,
		Number.MAX_SAFE_INTEGER + 1,
		"1",
		true,
		null,
		{},
		[],
	].map((value) => ({ value })),
)("rejects invalid endpoint index %j", ({ value: index }) => {
	expect(() =>
		parse({ 1: { label: "Output", endpoints: [0, index] } }),
	).toThrow("integer endpoint indices between 0 and 127");
});

test.each([
	[0, 0],
	[1, 2, 1],
])("rejects duplicate member indices %j", (...endpoints) => {
	expect(() => parse({ 1: { label: "Output", endpoints } })).toThrow(
		"endpoints must not contain duplicate indices",
	);
});

test("allows authored single-member groups", () => {
	expect(
		parse({ 1: { label: "Output", endpoints: [0] } })
			.evaluate(deviceId)
			.endpointGroups?.get(1),
	).toEqual({ id: 1, label: "Output", endpoints: [0] });
});

test.each([false, 1, [], {}].map((value) => ({ value })))(
	"rejects invalid $if %j",
	({ value: $if }) => {
		expect(() =>
			parse({ 1: { $if, label: "Output", endpoints: [1, 2] } }),
		).toThrow("Endpoint group 1 contains an invalid $if condition");
	},
);

test("rejects invalid condition syntax when evaluating", () => {
	const config = parse({
		1: {
			$if: "firmwareVersion >",
			label: "Output",
			endpoints: [1, 2],
		},
	});
	expect(() => config.evaluate(deviceId)).toThrow("Invalid condition");
});

test("preserves authored IDs after excluding inactive groups", () => {
	const config = parse({
		1: {
			$if: "firmwareVersion >= 2.0",
			label: "New Output",
			endpoints: [3, 4],
		},
		2: { label: "Output", endpoints: [1, 2] },
	});
	expect(config.evaluate(deviceId).endpointGroups).toEqual(
		new Map([[2, { id: 2, label: "Output", endpoints: [1, 2] }]]),
	);
});

test("omits endpoint groups when no condition applies", () => {
	const config = parse({
		1: {
			$if: "firmwareVersion >= 2.0",
			label: "Output",
			endpoints: [1, 2],
		},
	});
	expect(config.evaluate(deviceId).endpointGroups).toBeUndefined();
});

test("allows mutually exclusive groups to share members", () => {
	const config = parse({
		1: {
			$if: "firmwareVersion < 2.0",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion >= 2.0",
			label: "New Output",
			endpoints: [0, 1, 2],
		},
	});

	expect([...config.evaluate(deviceId).endpointGroups!.keys()]).toEqual([1]);
	expect([
		...config
			.evaluate({ ...deviceId, firmwareVersion: "2.0" })
			.endpointGroups!.keys(),
	]).toEqual([2]);
	expect([...config.evaluate().endpointGroups!.keys()]).toEqual([1, 2]);
});

test.each([undefined, "firmwareVersion >= 1.0"])(
	"rejects active overlapping membership with condition %j",
	($if) => {
		const config = parse({
			1: { label: "Output", endpoints: [0, 1] },
			2: { $if, label: "Other Output", endpoints: [0, 2] },
		});
		expect(() => config.evaluate(deviceId)).toThrow(
			"Endpoint 0 belongs to multiple active endpoint groups: 1 and 2",
		);
		expect(() => config.evaluate(deviceId)).toThrow(
			expect.objectContaining({ code: ZWaveErrorCodes.Config_Invalid }),
		);
	},
);

const hashVersions = [0, 1, 2, 3, 4] satisfies DeviceConfigHashVersion[];

test.each(hashVersions)(
	"endpoint groups do not affect hash version %i",
	async (version) => {
		const withoutGroups = parse().evaluate(deviceId);
		const withGroups = parse({
			1: { label: "Output", endpoints: [0, 1] },
		}).evaluate(deviceId);
		const changedGroups = parse({
			1: {
				$if: "firmwareVersion >= 2.0",
				label: "Output",
				endpoints: [0, 1],
			},
			2: {
				$if: "firmwareVersion < 2.0",
				label: "Other Output",
				endpoints: [0, 2, 127],
			},
		}).evaluate(deviceId);

		const expected = await withoutGroups.getHash(version);
		expect(await withGroups.getHash(version)).toEqual(expected);
		expect(await changedGroups.getHash(version)).toEqual(expected);
	},
);
