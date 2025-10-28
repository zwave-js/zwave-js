import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";
import {
	FunctionType,
	LearnModeIntent,
	LearnModeStatus,
	MessageOrigin,
	MessageType,
	SetLearnModeCallback,
	SetLearnModeRequest,
	SetLearnModeResponse,
} from "@zwave-js/serial";

test("SetLearnModeRequest should serialize and deserialize correctly", async (t) => {
	const request = new SetLearnModeRequest({
		intent: LearnModeIntent.Inclusion,
		callbackId: 1,
	});

	const serialized = await request.serialize({
		homeId: 0x7e571000,
		ownNodeId: 1,
		nodeIdType: 0,
	});

	t.expect(serialized).toBeDefined();

	// Deserialize
	const deserialized = SetLearnModeRequest.from(
		{
			type: MessageType.Request,
			functionType: FunctionType.SetLearnMode,
			payload: serialized.subarray(4), // Skip header
		},
		{
			homeId: 0x7e571000,
			ownNodeId: 1,
			nodeIdType: 0,
		},
	);

	t.expect(deserialized.intent).toBe(LearnModeIntent.Inclusion);
	t.expect(deserialized.callbackId).toBe(1);
});

test("SetLearnModeResponse should serialize and deserialize correctly", async (t) => {
	const response = new SetLearnModeResponse({
		success: true,
	});

	const serialized = await response.serialize({
		homeId: 0x7e571000,
		ownNodeId: 1,
		nodeIdType: 0,
	});

	t.expect(serialized).toBeDefined();

	// Deserialize
	const deserialized = SetLearnModeResponse.from(
		{
			type: MessageType.Response,
			functionType: FunctionType.SetLearnMode,
			payload: serialized.subarray(4), // Skip header
		},
		{
			homeId: 0x7e571000,
			ownNodeId: 1,
			nodeIdType: 0,
		},
	);

	t.expect(deserialized.success).toBe(true);
	t.expect(deserialized.isOK()).toBe(true);
});

test("SetLearnModeCallback should serialize and deserialize correctly", async (t) => {
	const callback = new SetLearnModeCallback({
		callbackId: 1,
		status: LearnModeStatus.Completed,
		assignedNodeId: 2,
	});

	const serialized = await callback.serialize({
		homeId: 0x7e571000,
		ownNodeId: 1,
		nodeIdType: 0,
	});

	t.expect(serialized).toBeDefined();

	// Deserialize
	const deserialized = SetLearnModeCallback.from(
		{
			type: MessageType.Request,
			functionType: FunctionType.SetLearnMode,
			payload: serialized.subarray(4), // Skip header
		},
		{
			homeId: 0x7e571000,
			ownNodeId: 1,
			nodeIdType: 0,
			origin: MessageOrigin.Controller,
		},
	);

	t.expect(deserialized.status).toBe(LearnModeStatus.Completed);
	t.expect(deserialized.assignedNodeId).toBe(2);
	t.expect(deserialized.callbackId).toBe(1);
	t.expect(deserialized.isOK()).toBe(true);
});

test("SetLearnModeCallback with status message should serialize and deserialize correctly", async (t) => {
	const statusMessage = Bytes.from([0x01, 0x02, 0x03, 0x04]);
	const callback = new SetLearnModeCallback({
		callbackId: 1,
		status: LearnModeStatus.Started,
		assignedNodeId: 0xef,
		statusMessage,
	});

	const serialized = await callback.serialize({
		homeId: 0x7e571000,
		ownNodeId: 1,
		nodeIdType: 0,
	});

	t.expect(serialized).toBeDefined();

	// Deserialize
	const deserialized = SetLearnModeCallback.from(
		{
			type: MessageType.Request,
			functionType: FunctionType.SetLearnMode,
			payload: serialized.subarray(4), // Skip header
		},
		{
			homeId: 0x7e571000,
			ownNodeId: 1,
			nodeIdType: 0,
			origin: MessageOrigin.Controller,
		},
	);

	t.expect(deserialized.status).toBe(LearnModeStatus.Started);
	t.expect(deserialized.assignedNodeId).toBe(0xef);
	t.expect(deserialized.statusMessage).toEqual(statusMessage);
	t.expect(deserialized.isOK()).toBe(true);
});
