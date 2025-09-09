import { TransmitStatus } from "@zwave-js/core";
import { test } from "vitest";
import { SendDataBridgeRequestTransmitReport } from "./SendDataBridgeMessages.js";

test("SendDataBridgeRequestTransmitReport should parse TX report but not show it in logs when transmitStatus is Fail", (t) => {
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

	t.expect(report.txReport).toBeDefined();
	t.expect(report.txReport?.txTicks).toBe(0);
	t.expect(report.transmitStatus).toBe(TransmitStatus.Fail);
	t.expect(report.callbackId).toBe(80);

	const logEntry = report.toLogEntry();
	t.expect(logEntry.message).toStrictEqual({
		"callback id": 80,
		"transmit status": "Fail",
	});
});

test("SendDataBridgeRequestTransmitReport should show TX report fields when transmitStatus is OK", (t) => {
	const report = new SendDataBridgeRequestTransmitReport({
		callbackId: 80,
		transmitStatus: TransmitStatus.OK,
		txReport: {
			txTicks: 5,
			txChannelNo: 1,
			routeSchemeState: 0,
			repeaterNodeIds: [],
			beam1000ms: false,
			beam250ms: false,
			routeSpeed: 0 as any,
			routingAttempts: 1,
			ackRSSI: -50,
			ackChannelNo: 1,
		},
	});

	const logEntry = report.toLogEntry();
	t.expect(logEntry.message).toMatchObject({
		"callback id": 80,
		"transmit status": "OK, took 50 ms",
		"routing attempts": 1,
		"protocol & route speed": "Unknown (0x00)",
		"routing scheme": "Idle",
		"ACK RSSI": "-50 dBm",
		"ACK channel no.": 1,
		"TX channel no.": 1,
	});
});

test("SendDataBridgeRequestTransmitReport should parse TX report but not show it in logs when transmitStatus is NoAck", (t) => {
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

	t.expect(report.txReport).toBeDefined();
	t.expect(report.txReport?.txTicks).toBe(2560);
	t.expect(report.transmitStatus).toBe(TransmitStatus.NoAck);
	t.expect(report.callbackId).toBe(80);

	const logEntry = report.toLogEntry();
	t.expect(logEntry.message).toStrictEqual({
		"callback id": 80,
		"transmit status": "NoAck",
	});
});

test("SendDataBridgeRequestTransmitReport should parse TX report but not show it in logs when transmitStatus is NoRoute", (t) => {
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

	t.expect(report.txReport).toBeDefined();
	t.expect(report.txReport?.txTicks).toBe(0);
	t.expect(report.transmitStatus).toBe(TransmitStatus.NoRoute);
	t.expect(report.callbackId).toBe(80);

	const logEntry = report.toLogEntry();
	t.expect(logEntry.message).toStrictEqual({
		"callback id": 80,
		"transmit status": "NoRoute",
	});
});

test("SendDataBridgeRequestTransmitReport should parse TX report but not show it in logs when transmitStatus is NotIdle", (t) => {
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

	t.expect(report.txReport).toBeDefined();
	t.expect(report.txReport?.txTicks).toBe(0);
	t.expect(report.transmitStatus).toBe(TransmitStatus.NotIdle);
	t.expect(report.callbackId).toBe(80);

	const logEntry = report.toLogEntry();
	t.expect(logEntry.message).toStrictEqual({
		"callback id": 80,
		"transmit status": "NotIdle",
	});
});
