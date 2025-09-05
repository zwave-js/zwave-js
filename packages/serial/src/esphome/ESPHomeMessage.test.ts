import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";
import {
	DeviceInfoRequest,
	DeviceInfoResponse,
	ESPHomeMessage,
	ESPHomeMessageType,
	HelloRequest,
	HelloResponse,
	PingRequest,
	PingResponse,
	ZWaveProxyWriteRequest,
	ZWaveProxyWriteResponse,
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

test("DeviceInfoRequest serialization and parsing", () => {
	const original = new DeviceInfoRequest();
	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as DeviceInfoRequest;

	expect(parsed).toBeInstanceOf(DeviceInfoRequest);
	expect(parsed.messageType).toBe(ESPHomeMessageType.DeviceInfoRequest);
});

test("DeviceInfoResponse serialization and parsing", () => {
	const original = new DeviceInfoResponse({
		name: "zwave-gateway",
		esphomeVersion: "2024.12.0",
		model: "ESP32",
		macAddress: "AA:BB:CC:DD:EE:FF",
		zwaveProxyFeatureFlags: 0x01,
		manufacturer: "Espressif",
		friendlyName: "Z-Wave Gateway",
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as DeviceInfoResponse;

	expect(parsed).toBeInstanceOf(DeviceInfoResponse);
	expect(parsed.messageType).toBe(ESPHomeMessageType.DeviceInfoResponse);
	expect(parsed.name).toBe("zwave-gateway");
	expect(parsed.esphomeVersion).toBe("2024.12.0");
	expect(parsed.model).toBe("ESP32");
	expect(parsed.macAddress).toBe("AA:BB:CC:DD:EE:FF");
	expect(parsed.zwaveProxyFeatureFlags).toBe(0x01);
	expect(parsed.manufacturer).toBe("Espressif");
	expect(parsed.friendlyName).toBe("Z-Wave Gateway");
	expect(parsed.hasZWaveProxySupport).toBe(true);
});

test("DeviceInfoResponse without Z-Wave support", () => {
	const original = new DeviceInfoResponse({
		name: "regular-device",
		esphomeVersion: "2024.12.0",
		model: "ESP32",
		zwaveProxyFeatureFlags: 0, // No Z-Wave support
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as DeviceInfoResponse;

	expect(parsed.hasZWaveProxySupport).toBe(false);
	expect(parsed.zwaveProxyFeatureFlags).toBe(0);
});

test("ZWaveProxyWriteRequest serialization and parsing", () => {
	const testData = new Bytes(new TextEncoder().encode("Hello World"));
	const original = new ZWaveProxyWriteRequest({
		data: testData,
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as ZWaveProxyWriteRequest;

	expect(parsed).toBeInstanceOf(ZWaveProxyWriteRequest);
	expect(parsed.messageType).toBe(ESPHomeMessageType.ZWaveProxyWriteRequest);
	expect(parsed.data).toEqual(testData);
});

test("ZWaveProxyWriteResponse serialization and parsing", () => {
	const original = new ZWaveProxyWriteResponse();
	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as ZWaveProxyWriteResponse;

	expect(parsed).toBeInstanceOf(ZWaveProxyWriteResponse);
	expect(parsed.messageType).toBe(ESPHomeMessageType.ZWaveProxyWriteResponse);
});

test("DeviceInfoResponse with minimal fields", () => {
	const original = new DeviceInfoResponse({});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as DeviceInfoResponse;

	expect(parsed).toBeInstanceOf(DeviceInfoResponse);
	expect(parsed.name).toBe("");
	expect(parsed.esphomeVersion).toBe("");
	expect(parsed.zwaveProxyFeatureFlags).toBe(0);
	expect(parsed.hasZWaveProxySupport).toBe(false);
	expect(parsed.usesPassword).toBe(false);
	expect(parsed.hasDeepSleep).toBe(false);
	expect(parsed.apiEncryptionSupported).toBe(false);
});

test("DeviceInfoResponse with all boolean flags", () => {
	const original = new DeviceInfoResponse({
		usesPassword: true,
		hasDeepSleep: true,
		apiEncryptionSupported: true,
		zwaveProxyFeatureFlags: 0x0F,
	});

	const serialized = original.serialize();
	const parsed = ESPHomeMessage.parse(serialized) as DeviceInfoResponse;

	expect(parsed.usesPassword).toBe(true);
	expect(parsed.hasDeepSleep).toBe(true);
	expect(parsed.apiEncryptionSupported).toBe(true);
	expect(parsed.hasZWaveProxySupport).toBe(true);
});
