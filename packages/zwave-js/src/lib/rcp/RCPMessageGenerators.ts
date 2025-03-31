// import type { RCPMessage } from "@zwave-js/serial";
// import {
// 	type DeferredPromise,
// 	createDeferredPromise,
// } from "alcalzone-shared/deferred-promise";
// import { type RCPMessageGenerator } from "./RCPTransaction.js";

// export type RCPMessageGeneratorImplementation<T extends RCPMessage> = (
// 	/** The "primary" message */
// 	message: T,
// 	/**
// 	 * A hook to get notified about each sent message and the result of the Serial API call
// 	 * without waiting for the message generator to finish completely.
// 	 */
// 	onMessageSent: (msg: RCPMessage, result: RCPMessage | undefined) => void,
// ) => AsyncGenerator<RCPMessage, RCPMessage, RCPMessage>;

// /** A simple message generator that simply sends a message, waits for the ACK (and the response if one is expected) */
// export const simpleRCPMessageGenerator: RCPMessageGeneratorImplementation<
// 	RCPMessage
// > // eslint-disable-next-line @typescript-eslint/require-await
//  = async function*(
// 	msg,
// 	onMessageSent,
// ) {
// 	// Pass this message to the send thread and wait for it to be sent
// 	let result: RCPMessage;

// 	try {
// 		// The yield can throw and must be handled here
// 		result = yield msg;

// 		// Figure out how long the message took to be handled
// 		msg.markAsCompleted();

// 		onMessageSent(msg, result);
// 	} catch (e) {
// 		msg.markAsCompleted();
// 		throw e;
// 	}

// 	return result;
// };

// export function createRCPMessageGenerator<
// 	TResponse extends RCPMessage = RCPMessage,
// >(
// 	msg: RCPMessage,
// 	onMessageSent: (msg: RCPMessage, result: RCPMessage | undefined) => void,
// ): {
// 	generator: RCPMessageGenerator;
// 	resultPromise: DeferredPromise<TResponse>;
// } {
// 	const resultPromise = createDeferredPromise<TResponse>();

// 	const generator: RCPMessageGenerator = {
// 		parent: undefined as any, // The transaction will set this field on creation
// 		current: undefined,
// 		self: undefined,
// 		reset: () => {
// 			generator.current = undefined;
// 			generator.self = undefined;
// 		},
// 		start: () => {
// 			async function* gen() {
// 				// Determine which message generator implementation should be used
// 				const implementation: RCPMessageGeneratorImplementation<
// 					RCPMessage
// 				> = simpleRCPMessageGenerator;

// 				// Step through the generator so we can easily cancel it and don't
// 				// accidentally forget to unset this.current at the end
// 				const gen = implementation(msg, onMessageSent);
// 				let sendResult: RCPMessage | undefined;
// 				let result: RCPMessage | undefined;
// 				while (true) {
// 					// This call passes the previous send result (if it exists already) to the generator and saves the
// 					// generated or returned message in `value`. When `done` is true, `value` contains the returned result of the message generator
// 					try {
// 						const { value, done } = await gen.next(sendResult!);
// 						if (done) {
// 							result = value;
// 							break;
// 						}

// 						// Pass the generated message to the driver and remember the result for the next iteration
// 						generator.current = value;
// 						sendResult = yield generator.current;
// 					} catch (e) {
// 						if (e instanceof Error) {
// 							// There was an actual error, reject the transaction
// 							resultPromise.reject(e);
// 						} else {
// 							// The generator was prematurely ended by throwing a RCPMessage
// 							resultPromise.resolve(e as TResponse);
// 						}
// 						break;
// 					}
// 				}

// 				resultPromise.resolve(result as TResponse);
// 				generator.reset();
// 				return;
// 			}

// 			generator.self = gen();
// 			return generator.self;
// 		},
// 	};
// 	return { resultPromise, generator };
// }
