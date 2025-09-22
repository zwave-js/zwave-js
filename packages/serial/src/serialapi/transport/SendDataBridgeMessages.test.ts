import { ProtocolDataRate, TransmitStatus } from "@zwave-js/core";
import { describe, expect, test } from "vitest";
import { SendDataBridgeRequestTransmitReport } from "./SendDataBridgeMessages.js";

describe("SendDataBridgeRequestTransmitReport", () => {
	test("should not show TX report fields when transmitStatus is Fail", () => {
		const report = new SendDataBridgeRequestTransmitReport({
			callbackId: 80,
			transmitStatus: TransmitStatus.Fail,
			txReport: {
				txTicks: 1,
				routingAttempts: 0,
				routeSpeed: ProtocolDataRate.ZWave_9k6,
				routeSchemeState: 0,
				ackRSSI: 0,
				ackChannelNo: 0,
				txChannelNo: 0,
				repeaterNodeIds: [0, 0, 0, 0],
				beam1000ms: false,
				beam250ms: false,
			},
		});

		expect(report.transmitStatus).toBe(TransmitStatus.Fail);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "Fail, took 10 ms",
		});
	});

	test("should show TX report fields when transmitStatus is OK", () => {
		const report = new SendDataBridgeRequestTransmitReport({
			callbackId: 80,
			transmitStatus: TransmitStatus.OK,
			txReport: {
				txTicks: 2560,
				routingAttempts: 0,
				routeSpeed: ProtocolDataRate.ZWave_9k6,
				routeSchemeState: 0,
				ackRSSI: 0,
				ackChannelNo: 0,
				txChannelNo: 0,
				repeaterNodeIds: [0, 0, 0, 0],
				beam1000ms: false,
				beam250ms: false,
			},
		});

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
		const report = new SendDataBridgeRequestTransmitReport({
			callbackId: 80,
			transmitStatus: TransmitStatus.NoAck,
			txReport: {
				txTicks: 2560,
				routingAttempts: 0,
				routeSpeed: ProtocolDataRate.ZWave_9k6,
				routeSchemeState: 0,
				ackRSSI: 0,
				ackChannelNo: 0,
				txChannelNo: 0,
				repeaterNodeIds: [0, 0, 0, 0],
				beam1000ms: false,
				beam250ms: false,
			},
		});

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
		const report = new SendDataBridgeRequestTransmitReport({
			callbackId: 80,
			transmitStatus: TransmitStatus.NotIdle,
		});

		expect(report.transmitStatus).toBe(TransmitStatus.NotIdle);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "NotIdle",
		});
	});

	test("should not show TX report fields when transmitStatus is NoRoute", () => {
		const report = new SendDataBridgeRequestTransmitReport({
			callbackId: 80,
			transmitStatus: TransmitStatus.NoRoute,
		});

		expect(report.transmitStatus).toBe(TransmitStatus.NoRoute);
		expect(report.callbackId).toBe(80);

		const logEntry = report.toLogEntry();
		expect(logEntry.message).toStrictEqual({
			"callback id": 80,
			"transmit status": "NoRoute",
		});
	});
});
