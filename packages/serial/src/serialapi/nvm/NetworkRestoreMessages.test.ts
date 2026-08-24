import {
	NodeIDType,
	ZWaveDataRate,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import {
	FunctionType,
	Message,
	type MessageEncodingContext,
	MessageOrigin,
	type MessageParsingContext,
} from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import {
	NetworkRestoreCallback,
	NetworkRestoreCommand,
	NetworkRestoreDeviceRequest,
	NetworkRestoreFinalizeRequest,
	NetworkRestoreHomeIDRequest,
	NetworkRestoreNeighborsRequest,
	NetworkRestorePrepareRequest,
	NetworkRestoreResponse,
	NetworkRestoreRouteType,
	NetworkRestoreRoutesRequest,
	NetworkRestoreStatus,
} from "./NetworkRestoreMessages.js";

function encodingContext(nodeIdType: NodeIDType): MessageEncodingContext {
	return { nodeIdType } as MessageEncodingContext;
}

function parsingContext(
	nodeIdType: NodeIDType,
	origin: MessageOrigin,
): MessageParsingContext {
	return { nodeIdType, origin } as MessageParsingContext;
}

async function serializeRequest(
	request:
		| NetworkRestorePrepareRequest
		| NetworkRestoreHomeIDRequest
		| NetworkRestoreDeviceRequest
		| NetworkRestoreNeighborsRequest
		| NetworkRestoreRoutesRequest
		| NetworkRestoreFinalizeRequest,
	nodeIdType: NodeIDType,
): Promise<Bytes> {
	await request.serialize(encodingContext(nodeIdType));
	return request.payload;
}

describe("Network Restore requests", () => {
	test("use function ID 0x2f and expect an immediate response and callback", () => {
		const request = new NetworkRestorePrepareRequest({ callbackId: 0x42 });
		const response = new NetworkRestoreResponse({
			command: NetworkRestoreCommand.Prepare,
			wasAccepted: true,
		});
		const callback = new NetworkRestoreCallback({
			callbackId: 0x42,
			status: NetworkRestoreStatus.OK,
		});

		expect(FunctionType.NetworkRestore).toBe(0x2f);
		expect(request.functionType).toBe(0x2f);
		expect(request.expectsResponse()).toBe(true);
		expect(request.expectsCallback()).toBe(true);
		expect(request.isExpectedResponse(response)).toBe(true);
		expect(request.isExpectedCallback(callback)).toBe(true);
	});

	test("serialize all subcommands", async () => {
		const neighbors = Bytes.alloc(29, 0xaa);
		const requests = [
			{
				request: new NetworkRestorePrepareRequest({
					callbackId: 0x11,
				}),
				payload: [0x00, 0x11],
			},
			{
				request: new NetworkRestoreHomeIDRequest({
					homeId: 0x1234_5678,
					controllerNodeId: 1,
					callbackId: 0x12,
				}),
				payload: [0x01, 0x12, 0x34, 0x56, 0x78, 0x01, 0x12],
			},
			{
				request: new NetworkRestoreDeviceRequest({
					nodeId: 5,
					protocolData: Bytes.from([1, 2, 3, 4, 5]),
					callbackId: 0x13,
				}),
				payload: [0x02, 0x05, 1, 2, 3, 4, 5, 0x13],
			},
			{
				request: new NetworkRestoreNeighborsRequest({
					nodeId: 6,
					neighbors,
					callbackId: 0x14,
				}),
				payload: [0x03, 0x06, ...neighbors, 0x14],
			},
			{
				request: new NetworkRestoreRoutesRequest({
					nodeId: 7,
					routes: [
						{
							type: NetworkRestoreRouteType.APR,
							beam: "250ms",
							speed: ZWaveDataRate["100k"],
							hops: [2, 3],
						},
						{
							type: NetworkRestoreRouteType.LWR,
							beam: "1000ms",
							speed: ZWaveDataRate["40k"],
							hops: [4, 5, 6, 7],
						},
					],
					callbackId: 0x15,
				}),
				payload: [
					0x04,
					0x07,
					0x02,
					0x00,
					0x42,
					0x02,
					0x03,
					0x00,
					0x00,
					0x01,
					0x81,
					0x04,
					0x05,
					0x06,
					0x07,
					0x15,
				],
			},
			{
				request: new NetworkRestoreFinalizeRequest({
					callbackId: 0x16,
				}),
				payload: [0xff, 0x16],
			},
		] as const;

		for (const { request, payload } of requests) {
			expect(
				await serializeRequest(request, NodeIDType.Short),
			).toStrictEqual(Bytes.from(payload));
		}
	});

	test("serialize and parse long node IDs", async () => {
		const request = new NetworkRestoreDeviceRequest({
			nodeId: 0x0123,
			protocolData: Bytes.from([0x81, 0x12, 0x03, 0x10, 0x01]),
			callbackId: 0x44,
		});
		const serialized = await request.serialize(
			encodingContext(NodeIDType.Long),
		);

		expect(request.payload).toStrictEqual(
			Bytes.from([
				0x02,
				0x01,
				0x23,
				0x81,
				0x12,
				0x03,
				0x10,
				0x01,
				0x44,
			]),
		);

		const parsed = Message.parse(
			serialized,
			parsingContext(NodeIDType.Long, MessageOrigin.Host),
		);
		expect(parsed).toBeInstanceOf(NetworkRestoreDeviceRequest);
		expect(parsed).toMatchObject({
			nodeId: 0x0123,
			protocolData: Bytes.from([0x81, 0x12, 0x03, 0x10, 0x01]),
			callbackId: 0x44,
		});
	});

	test("parse short node IDs and route data", async () => {
		const request = new NetworkRestoreRoutesRequest({
			nodeId: 8,
			routes: [{
				type: NetworkRestoreRouteType.NLWR,
				beam: false,
				speed: ZWaveDataRate["9k6"],
				hops: [],
			}],
			callbackId: 0x45,
		});
		const serialized = await request.serialize(
			encodingContext(NodeIDType.Short),
		);
		const parsed = Message.parse(
			serialized,
			parsingContext(NodeIDType.Short, MessageOrigin.Host),
		);

		expect(parsed).toBeInstanceOf(NetworkRestoreRoutesRequest);
		expect(parsed).toMatchObject({
			nodeId: 8,
			routes: [{
				type: NetworkRestoreRouteType.NLWR,
				beam: false,
				speed: ZWaveDataRate["9k6"],
				hops: [],
			}],
			callbackId: 0x45,
		});
	});
});

describe("Network Restore responses", () => {
	test("parse immediate acceptance responses", async () => {
		const accepted = new NetworkRestoreResponse({
			command: NetworkRestoreCommand.RestoreDevice,
			wasAccepted: true,
		});
		const rejected = new NetworkRestoreResponse({
			command: NetworkRestoreCommand.RestoreDevice,
			wasAccepted: false,
		});

		const acceptedMessage = Message.parse(
			await accepted.serialize(encodingContext(NodeIDType.Short)),
			parsingContext(NodeIDType.Short, MessageOrigin.Controller),
		);
		const rejectedMessage = Message.parse(
			await rejected.serialize(encodingContext(NodeIDType.Short)),
			parsingContext(NodeIDType.Short, MessageOrigin.Controller),
		);

		expect(acceptedMessage).toBeInstanceOf(NetworkRestoreResponse);
		expect((acceptedMessage as NetworkRestoreResponse).isOK()).toBe(true);
		expect((rejectedMessage as NetworkRestoreResponse).isOK()).toBe(false);
	});

	test("parse completion callbacks under function ID 0x2f", async () => {
		const callback = new NetworkRestoreCallback({
			callbackId: 0x46,
			status: NetworkRestoreStatus.Error_LongRangeNotSupported,
		});
		const serialized = await callback.serialize(
			encodingContext(NodeIDType.Short),
		);

		expect(serialized[3]).toBe(0x2f);
		const parsed = Message.parse(
			serialized,
			parsingContext(NodeIDType.Short, MessageOrigin.Controller),
		);
		expect(parsed).toBeInstanceOf(NetworkRestoreCallback);
		expect(parsed).toMatchObject({
			callbackId: 0x46,
			status: NetworkRestoreStatus.Error_LongRangeNotSupported,
		});
		expect((parsed as NetworkRestoreCallback).isOK()).toBe(false);
	});
});

describe("Network Restore validation", () => {
	test("rejects invalid fixed-size fields", () => {
		assertZWaveError(
			expect,
			() =>
				new NetworkRestoreDeviceRequest({
					nodeId: 2,
					protocolData: Bytes.alloc(4),
					callbackId: 1,
				}),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
		assertZWaveError(
			expect,
			() =>
				new NetworkRestoreNeighborsRequest({
					nodeId: 2,
					neighbors: Bytes.alloc(28),
					callbackId: 1,
				}),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
		assertZWaveError(
			expect,
			() =>
				new NetworkRestoreHomeIDRequest({
					homeId: 0x1_0000_0000,
					controllerNodeId: 1,
					callbackId: 1,
				}),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
	});

	test("rejects invalid routes", () => {
		const create = (
			route: ConstructorParameters<typeof NetworkRestoreRoutesRequest>[0][
				"routes"
			][number],
		) => new NetworkRestoreRoutesRequest({
			nodeId: 2,
			routes: [route],
			callbackId: 1,
		});
		const validRoute = {
			type: NetworkRestoreRouteType.APR,
			beam: false as const,
			speed: ZWaveDataRate["9k6"],
			hops: [],
		};

		for (
			const route of [
				{ ...validRoute, type: 3 },
				{ ...validRoute, beam: "invalid" },
				{ ...validRoute, speed: 4 },
				{ ...validRoute, hops: [1, 2, 3, 4, 5] },
				{ ...validRoute, hops: [0] },
			]
		) {
			assertZWaveError(
				expect,
				() => create(route as typeof validRoute),
				{ errorCode: ZWaveErrorCodes.Argument_Invalid },
			);
		}
	});

	test("rejects node IDs that do not fit the configured encoding", async () => {
		const request = new NetworkRestoreDeviceRequest({
			nodeId: 0x0123,
			protocolData: Bytes.alloc(5),
			callbackId: 1,
		});
		await assertZWaveError(
			expect,
			() => request.serialize(encodingContext(NodeIDType.Short)),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
	});
});
