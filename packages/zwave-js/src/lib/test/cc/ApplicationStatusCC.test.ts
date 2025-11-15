import {
	ApplicationStatusCCBusy,
	ApplicationStatusCCRejectedRequest,
	ApplicationStatusCommand,
	ApplicationStatusStatus,
	CommandClass,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { test } from "vitest";

test("ApplicationStatusCCBusy with TryAgainLater status should deserialize correctly", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses["Application Status"], // CC
		ApplicationStatusCommand.Busy, // CC Command
		ApplicationStatusStatus.TryAgainLater, // Status
		0, // Wait time (ignored when status is TryAgainLater)
	]);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ApplicationStatusCCBusy;
	
	t.expect(cc.constructor).toBe(ApplicationStatusCCBusy);
	t.expect(cc.status).toBe(ApplicationStatusStatus.TryAgainLater);
	t.expect(cc.waitTime).toBe(0);
});

test("ApplicationStatusCCBusy with TryAgainInWaitTimeSeconds status should deserialize correctly", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses["Application Status"], // CC
		ApplicationStatusCommand.Busy, // CC Command
		ApplicationStatusStatus.TryAgainInWaitTimeSeconds, // Status
		10, // Wait time (10 seconds)
	]);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ApplicationStatusCCBusy;
	
	t.expect(cc.constructor).toBe(ApplicationStatusCCBusy);
	t.expect(cc.status).toBe(ApplicationStatusStatus.TryAgainInWaitTimeSeconds);
	t.expect(cc.waitTime).toBe(10);
});

test("ApplicationStatusCCBusy with RequestQueued status should deserialize correctly", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses["Application Status"], // CC
		ApplicationStatusCommand.Busy, // CC Command
		ApplicationStatusStatus.RequestQueued, // Status
		0, // Wait time (ignored when status is RequestQueued)
	]);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ApplicationStatusCCBusy;
	
	t.expect(cc.constructor).toBe(ApplicationStatusCCBusy);
	t.expect(cc.status).toBe(ApplicationStatusStatus.RequestQueued);
	t.expect(cc.waitTime).toBe(0);
});

test("ApplicationStatusCCRejectedRequest should deserialize correctly", async (t) => {
	const ccData = Uint8Array.from([
		CommandClasses["Application Status"], // CC
		ApplicationStatusCommand.RejectedRequest, // CC Command (0x02)
		0, // Status (must be 0 according to spec)
	]);
	const cc = await CommandClass.parse(
		ccData,
		{ sourceNodeId: 1 } as any,
	) as ApplicationStatusCCRejectedRequest;
	
	t.expect(cc.constructor).toBe(ApplicationStatusCCRejectedRequest);
	t.expect(cc.status).toBe(0);
	
	// Verify the log entry looks correct
	const logEntry = cc.toLogEntry();
	t.expect(logEntry).toBeDefined();
	t.expect(logEntry.message).toBeDefined();
	t.expect((logEntry.message as any).status).toBe(0);
});
