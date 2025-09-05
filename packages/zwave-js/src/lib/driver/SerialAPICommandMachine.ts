import {
	type InferStateMachineTransitions,
	StateMachine,
	type StateMachineTransition,
} from "@zwave-js/core";
import {
	isMultiStageCallback,
	isSendData,
	isSuccessIndicator,
} from "@zwave-js/serial";

export interface SerialAPICommand {
	expectsAck(): boolean;
	expectsResponse(): boolean;
	expectsCallback(): boolean;
}

export type SerialAPICommandState<T extends SerialAPICommand> =
	| { value: "initial" }
	| { value: "sending" }
	| { value: "waitingForACK" }
	| { value: "waitingForResponse" }
	| {
		value: "waitingForCallback";
		responseTimedOut?: boolean;
	}
	| {
		value: "success";
		result?: T;
		done: true;
	}
	| ({
		value: "failure";
	} & SerialAPICommandMachineFailure<T>);

export type SerialAPICommandMachineFailure<T extends SerialAPICommand> =
	| { reason: "ACK timeout"; result?: undefined }
	| { reason: "CAN"; result?: undefined }
	| { reason: "NAK"; result?: undefined }
	| { reason: "response timeout"; result?: undefined }
	| { reason: "callback timeout"; result?: undefined }
	| { reason: "response NOK"; result: T }
	| { reason: "callback NOK"; result: T };

export type SerialAPICommandMachineInput<T extends SerialAPICommand> =
	| { value: "start" }
	| { value: "message sent" }
	| { value: "ACK" }
	| { value: "CAN" }
	| { value: "NAK" }
	| { value: "timeout" }
	| { value: "response" | "response NOK"; response: T }
	| { value: "callback" | "callback NOK"; callback: T };

export type SerialAPICommandMachine<T extends SerialAPICommand> = StateMachine<
	SerialAPICommandState<T>,
	SerialAPICommandMachineInput<T>
>;

function to<T extends SerialAPICommand>(
	state: SerialAPICommandState<T>,
): StateMachineTransition<SerialAPICommandState<T>> {
	return { newState: state };
}

function callbackIsFinal(callback: unknown): boolean {
	return (
		// assume callbacks without success indication to be OK
		(!isSuccessIndicator(callback) || callback.isOK())
		// assume callbacks without isFinal method to be final
		&& (!isMultiStageCallback(callback) || callback.isFinal())
	);
}

export function createSerialAPICommandMachine<T extends SerialAPICommand>(
	message: T,
): SerialAPICommandMachine<T> {
	const initialState: SerialAPICommandState<T> = {
		value: "initial",
	};

	const transitions: InferStateMachineTransitions<
		SerialAPICommandMachine<T>
	> =
		// @ts-expect-error TODO: Fix the type declaration
		(state) => (input) => {
			switch (state.value) {
				case "initial":
					if (input.value === "start") {
						return to({ value: "sending" });
					}
					break;
				case "sending":
					if (input.value === "message sent") {
						if (message.expectsAck()) {
							return to({ value: "waitingForACK" });
						} else {
							return to({
								value: "success",
								result: undefined,
								done: true,
							});
						}
					}
					break;
				case "waitingForACK":
					switch (input.value) {
						case "ACK":
							if (message.expectsResponse()) {
								return to({ value: "waitingForResponse" });
							} else if (message.expectsCallback()) {
								return to({ value: "waitingForCallback" });
							} else {
								return to({
									value: "success",
									result: undefined,
									done: true,
								});
							}
						case "CAN":
							return to({ value: "failure", reason: "CAN" });
						case "NAK":
							return to({ value: "failure", reason: "NAK" });
						case "timeout":
							return to({
								value: "failure",
								reason: "ACK timeout",
							});
					}
					break;
				case "waitingForResponse":
					switch (input.value) {
						case "response":
							if (message.expectsCallback()) {
								return to({ value: "waitingForCallback" });
							} else {
								return to({
									value: "success",
									result: input.response,
									done: true,
								});
							}
						case "response NOK":
							return to({
								value: "failure",
								reason: "response NOK",
								result: input.response,
							});
						case "timeout":
							if (isSendData(message)) {
								return {
									newState: {
										value: "waitingForCallback",
										responseTimedOut: true,
									},
								};
							} else {
								return to({
									value: "failure",
									reason: "response timeout",
								});
							}
					}
					break;
				case "waitingForCallback":
					switch (input.value) {
						case "callback":
							if (callbackIsFinal(input.callback)) {
								return to({
									value: "success",
									result: input.callback,
									done: true,
								});
							} else {
								return to({ value: "waitingForCallback" });
							}
						case "callback NOK":
							// Preserve "response timeout" errors
							// A NOK callback afterwards is expected, but we're not interested in it
							if (state.responseTimedOut) {
								return to({
									value: "failure",
									reason: "response timeout",
								});
							} else {
								return to({
									value: "failure",
									reason: "callback NOK",
									result: input.callback,
								});
							}
						case "timeout":
							return to({
								value: "failure",
								reason: "callback timeout",
							});
					}
					break;
			}
		};

	return new StateMachine(initialState, transitions);
}
