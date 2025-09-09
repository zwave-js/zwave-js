import { TransmitStatus } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { SendDataBridgeRequestTransmitReport } from "./SendDataBridgeMessages.js";

describe("SendDataBridgeRequestTransmitReport", () => {
	test("should not show TX report fields when transmitStatus is Fail", () => {
		const rawMessage = new Uint8Array([
			80,
			TransmitStatus.Fail,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
		]);
		const report = SendDataBridgeRequestTransmitReport.from(
			{ payload: rawMessage } as any,
			{} as any,
		);

		expect(report.transmitStatus).toBe(TransmitStatus.Fail);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "Fail",
		});
	});

	test("should show TX report fields when transmitStatus is OK", () => {
		const rawMessage = new Uint8Array([
			80,
			TransmitStatus.OK,
			10,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
		]);
		const report = SendDataBridgeRequestTransmitReport.from(
			{ payload: rawMessage } as any,
			{} as any,
		);

		expect(report.transmitStatus).toBe(TransmitStatus.OK);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toMatchObject({
			"callback id": 80,
			"transmit status": "OK, took 25600 ms",
		});
		// Should have TX report fields
		expect(logEntry.message).toHaveProperty("routing attempts");
		expect(logEntry.message).toHaveProperty("protocol & route speed");
	});

	test("should show TX report fields when transmitStatus is NoAck", () => {
		const rawMessage = new Uint8Array([
			80,
			TransmitStatus.NoAck,
			10,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
		]);
		const report = SendDataBridgeRequestTransmitReport.from(
			{ payload: rawMessage } as any,
			{} as any,
		);

		expect(report.transmitStatus).toBe(TransmitStatus.NoAck);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toMatchObject({
			"callback id": 80,
			"transmit status": "NoAck, took 25600 ms",
		});
		// Should have TX report fields (NoAck still provides useful routing info)
		expect(logEntry.message).toHaveProperty("routing attempts");
		expect(logEntry.message).toHaveProperty("protocol & route speed");
	});

	test("should not show TX report fields when transmitStatus is NotIdle", () => {
		const rawMessage = new Uint8Array([
			80,
			TransmitStatus.NotIdle,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
		]);
		const report = SendDataBridgeRequestTransmitReport.from(
			{ payload: rawMessage } as any,
			{} as any,
		);

		expect(report.transmitStatus).toBe(TransmitStatus.NotIdle);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "NotIdle",
		});
	});

	test("should not show TX report fields when transmitStatus is NoRoute", () => {
		const rawMessage = new Uint8Array([
			80,
			TransmitStatus.NoRoute,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
		]);
		const report = SendDataBridgeRequestTransmitReport.from(
			{ payload: rawMessage } as any,
			{} as any,
		);

		expect(report.transmitStatus).toBe(TransmitStatus.NoRoute);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "NoRoute",
		});
	});
});
