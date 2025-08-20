import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";
import {
	ESPHomeMessage,
	ESPHomeMessageType,
	ExecuteServiceRequest,
	HelloRequest,
	HelloResponse,
	ListEntitiesDoneResponse,
	ListEntitiesRequest,
	PingRequest,
	PingResponse,
} from "./index.js";

test("HelloRequest serialization and parsing", () => {
	const original = new HelloRequest({
		clientInfo: "Z-Wave JS",
		apiVersionMajor: 1,
		apiVersionMinor: 3,
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as HelloRequest;

	expect(parsed).toBeInstanceOf(HelloRequest);
	expect(parsed.clientInfo).toBe("Z-Wave JS");
	expect(parsed.apiVersionMajor).toBe(1);
	expect(parsed.apiVersionMinor).toBe(3);
});

test("HelloResponse serialization and parsing", () => {
	const original = new HelloResponse({
		apiVersionMajor: 1,
		apiVersionMinor: 3,
		serverInfo: "ESPHome v2024.12.0",
		name: "zwave-gateway",
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as HelloResponse;

	expect(parsed).toBeInstanceOf(HelloResponse);
	expect(parsed.apiVersionMajor).toBe(1);
	expect(parsed.apiVersionMinor).toBe(3);
	expect(parsed.serverInfo).toBe("ESPHome v2024.12.0");
	expect(parsed.name).toBe("zwave-gateway");
});

test("Empty messages serialization and parsing", () => {
	// Test PingRequest
	const pingRequest = new PingRequest();
	const pingRequestSerialized = pingRequest.serialize();
	const pingRequestParsed = ESPHomeMessage.parse(pingRequestSerialized);
	expect(pingRequestParsed).toBeInstanceOf(PingRequest);

	// Test PingResponse
	const pingResponse = new PingResponse();
	const pingResponseSerialized = pingResponse.serialize();
	const pingResponseParsed = ESPHomeMessage.parse(pingResponseSerialized);
	expect(pingResponseParsed).toBeInstanceOf(PingResponse);

	// Test ListEntitiesRequest
	const listRequest = new ListEntitiesRequest();
	const listRequestSerialized = listRequest.serialize();
	const listRequestParsed = ESPHomeMessage.parse(listRequestSerialized);
	expect(listRequestParsed).toBeInstanceOf(ListEntitiesRequest);

	// Test ListEntitiesDoneResponse
	const listDone = new ListEntitiesDoneResponse();
	const listDoneSerialized = listDone.serialize();
	const listDoneParsed = ESPHomeMessage.parse(listDoneSerialized);
	expect(listDoneParsed).toBeInstanceOf(ListEntitiesDoneResponse);
});

test("ExecuteServiceRequest serialization and parsing", () => {
	const original = new ExecuteServiceRequest({
		key: 0x12345678,
		args: [
			{ intArray: [1, 2, 3] },
			{ intArray: [-1, -2, -3] },
		],
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as ExecuteServiceRequest;

	expect(parsed).toBeInstanceOf(ExecuteServiceRequest);
	expect(parsed.key).toBe(0x12345678);
	expect(parsed.args).toHaveLength(2);
	expect(parsed.args[0].intArray).toEqual([1, 2, 3]);
	expect(parsed.args[1].intArray).toEqual([-1, -2, -3]);
});

test("Message type detection", () => {
	const helloRequest = new HelloRequest({
		clientInfo: "test",
		apiVersionMajor: 1,
		apiVersionMinor: 0,
	});
	expect(helloRequest.messageType).toBe(ESPHomeMessageType.HelloRequest);

	const pingRequest = new PingRequest();
	expect(pingRequest.messageType).toBe(ESPHomeMessageType.PingRequest);
});

test("Unknown message type parsing", () => {
	// Create a frame with an unknown message type (999)
	const unknownMessageType = 999;
	const payload = new Uint8Array([0x01, 0x02, 0x03]); // Some test payload

	// Create a proper ESPHome message with unknown type by creating a base message and serializing it
	const unknownMessage = new ESPHomeMessage({
		messageType: unknownMessageType as any,
		payload: Bytes.from(payload),
	});

	const frame = unknownMessage.serialize();
	const parsed = ESPHomeMessage.parse(frame);

	// Should be base ESPHomeMessage class
	expect(parsed).toBeInstanceOf(ESPHomeMessage);
	expect(parsed.constructor).toBe(ESPHomeMessage);

	// Should have the correct unknown message type
	expect(parsed.messageType).toBe(unknownMessageType);

	// Should have the correct payload
	expect(parsed.payload).toEqual(Bytes.from(payload));
});
