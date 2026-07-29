/* oxlint-disable typescript/no-unused-vars */
import type {
	BinarySocket,
	Serial,
	SocketConnectOptions,
} from "../serialport/Bindings.js";

// Stub bindings that do nothing
export const serial: Serial = {
	connect: function(
		options: SocketConnectOptions,
	): Promise<BinarySocket> {
		throw new Error(
			"The default serial bindings are not available on this platform",
		);
	},
};
