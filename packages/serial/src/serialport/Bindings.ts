import type { BytesView } from "@zwave-js/shared";
import type { ReadableWritablePair } from "node:stream/web";
import type { ZWaveSerialBindingFactory } from "./ZWaveSerialStream.js";

export type EnumeratedPort = {
	type: "link";
	path: string;
} | {
	type: "tty";
	path: string;
} | {
	type: "socket";
	path: string;
} | {
	type: "custom";
	factory: ZWaveSerialBindingFactory;
};

/** Options for connecting to a remote host */
export interface SocketConnectOptions {
	/** The hostname or IP address of the remote host */
	host: string;
	/** The port number of the remote host */
	port: number;
	/** Give up on the connection attempt after this many milliseconds */
	timeout?: number;
	/** Send keep-alive probes with this interval in milliseconds */
	keepAliveInterval?: number;
	/** Whether Nagle's algorithm should be disabled */
	noDelay?: boolean;
}

/** A bidirectional byte stream to a remote host */
export interface ByteStreamSocket extends
	ReadableWritablePair<
		BytesView,
		BytesView
	>
{
	/** Closes the connection and releases the resources associated with it */
	close(): Promise<void>;
}

/**
 * Connects to a remote host. Failures after the returned promise resolves, including
 * losing the connection, are surfaced as an error on the `readable` side of the socket.
 */
export type SocketConnect = (
	options: SocketConnectOptions,
) => Promise<ByteStreamSocket>;

/** Abstractions to interact with serial ports on different platforms */
export interface Serial {
	/** Create a binding factory from the given path, if supported by the platform */
	createFactoryByPath?: (path: string) => Promise<ZWaveSerialBindingFactory>;

	/** List the available serial ports, if supported by the platform */
	list?: () => Promise<EnumeratedPort[]>;

	/** Connect to a remote host, if supported by the platform */
	connect?: SocketConnect;
}
