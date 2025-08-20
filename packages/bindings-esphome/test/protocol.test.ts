/**
 * Basic tests for ESPHome protocol encoding/decoding
 */

import { describe, expect, it } from "vitest";
import {
	ESPHomeMessageType,
	decodeFrameData,
	decodeHelloResponse,
	encodeExecuteServiceRequest,
	encodeHelloRequest,
	encodeSendFrameRequest,
} from "../src/serial/ESPHomeMessages.js";
import {
	decodeESPHomeFrame,
	decodeVarInt,
	encodeESPHomeFrame,
	encodeVarInt,
} from "../src/serial/ESPHomeProtocol.js";

describe("ESPHome Protocol", () => {
	describe("VarInt encoding/decoding", () => {
		it("should encode and decode small values", () => {
			const value = 42;
			const encoded = encodeVarInt(value);
			const decoded = decodeVarInt(encoded, 0);
			expect(decoded.value).toBe(value);
			expect(decoded.bytesRead).toBe(1);
		});

		it("should encode and decode large values", () => {
			const value = 300;
			const encoded = encodeVarInt(value);
			const decoded = decodeVarInt(encoded, 0);
			expect(decoded.value).toBe(value);
			expect(decoded.bytesRead).toBe(2);
		});
	});

	describe("Frame encoding/decoding", () => {
		it("should encode and decode a simple frame", () => {
			const messageType = ESPHomeMessageType.HelloRequest;
			const payload = new Uint8Array([1, 2, 3, 4]);

			const encoded = encodeESPHomeFrame(messageType, payload);
			const decoded = decodeESPHomeFrame(encoded);

			expect(decoded.messageType).toBe(messageType);
			expect(decoded.payload).toEqual(payload);
		});
	});

	describe("ESPHome API Messages", () => {
		it("should encode HelloRequest", () => {
			const request = {
				clientInfo: "zwave-js",
				apiVersionMajor: 1,
				apiVersionMinor: 0,
			};
			const encoded = encodeHelloRequest(request);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("should decode HelloResponse", () => {
			// Create a minimal HelloResponse message manually
			const helloResponse = new Uint8Array([
				0x08,
				0x01, // api_version_major = 1
				0x10,
				0x00, // api_version_minor = 0
				0x1a,
				0x07,
				0x45,
				0x53,
				0x50,
				0x48,
				0x6f,
				0x6d,
				0x65, // server_info = "ESPHome"
				0x22,
				0x06,
				0x44,
				0x65,
				0x76,
				0x69,
				0x63,
				0x65, // name = "Device"
			]);

			const decoded = decodeHelloResponse(helloResponse);
			expect(decoded.apiVersionMajor).toBe(1);
			expect(decoded.apiVersionMinor).toBe(0);
			expect(decoded.serverInfo).toBe("ESPHome");
			expect(decoded.name).toBe("Device");
		});

		it("should encode ExecuteServiceRequest", () => {
			const request = {
				key: 123,
				args: [{
					intArray: [1, 2, 3, 255],
				}],
			};
			const encoded = encodeExecuteServiceRequest(request);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("Legacy Protobuf messages", () => {
		it("should encode SendFrameRequest", () => {
			const request = { frame: [1, 2, 3, 255] };
			const encoded = encodeSendFrameRequest(request);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("should decode FrameData", () => {
			// Create a simple FrameData message manually
			const frameData = new Uint8Array([
				0x08,
				0x01, // field 1 (frame), value 1
				0x08,
				0x02, // field 1 (frame), value 2
				0x08,
				0x03, // field 1 (frame), value 3
			]);

			const decoded = decodeFrameData(frameData);
			expect(decoded.frame).toEqual([1, 2, 3]);
		});
	});
});
