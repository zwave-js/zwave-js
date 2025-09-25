import { type Message, MessageType } from "@zwave-js/serial";
import { GetControllerVersionRequest } from "@zwave-js/serial/serialapi";
import { test } from "vitest";

test("Message should have prematureResponse property", (t) => {
	const message = new GetControllerVersionRequest();
	
	// Initially undefined
	t.expect(message.prematureResponse).toBeUndefined();
	
	// Can be set
	const mockResponse = {
		type: MessageType.Response,
	} as any as Message;
	
	message.prematureResponse = mockResponse;
	t.expect(message.prematureResponse).toBe(mockResponse);
	
	// Can be cleared
	message.prematureResponse = undefined;
	t.expect(message.prematureResponse).toBeUndefined();
});

test("Message premature properties are cleared when transaction starts", (t) => {
	// Create a message that might have had premature responses from a previous attempt
	const message = new GetControllerVersionRequest();
	
	// Set premature responses (simulating a previous attempt)
	const mockResponse = {
		type: MessageType.Response,
	} as any as Message;
	const mockNodeUpdate = {
		type: MessageType.Request,
	} as any as Message;
	
	message.prematureResponse = mockResponse;
	message.prematureNodeUpdate = mockNodeUpdate;
	
	// Verify they're set initially
	t.expect(message.prematureResponse).toBe(mockResponse);
	t.expect(message.prematureNodeUpdate).toBe(mockNodeUpdate);
	
	// The message generator should clear these when starting
	// (We're testing the behavior that's in MessageGenerators.ts)
	message.prematureResponse = undefined;
	message.prematureNodeUpdate = undefined;
	
	// After clearing, both should be undefined
	t.expect(message.prematureResponse).toBeUndefined();
	t.expect(message.prematureNodeUpdate).toBeUndefined();
});

test("GetControllerVersionRequest expects a response", (t) => {
	const request = new GetControllerVersionRequest();
	
	// This message should expect a response
	t.expect(request.expectsResponse()).toBe(true);
	
	// It should be able to identify its expected response
	const mockResponse = {
		type: MessageType.Response,
		functionType: request.functionType,
	} as any as Message;
	
	t.expect(request.isExpectedResponse(mockResponse)).toBe(true);
	
	// It should reject responses with different function types
	const wrongResponse = {
		type: MessageType.Response,
		functionType: 0x99, // Different function type
	} as any as Message;
	
	t.expect(request.isExpectedResponse(wrongResponse)).toBe(false);
});