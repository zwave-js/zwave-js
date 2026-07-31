import type {
	BinarySocket,
	Serial,
	SocketConnectOptions,
} from "@zwave-js/serial";
import {
	type ZWaveSerialBindingFactory,
	createESPHomeFactory,
	createSocketFactory,
} from "@zwave-js/serial";
import type { BytesView } from "@zwave-js/shared";

async function connect(
	options: SocketConnectOptions,
): Promise<BinarySocket> {
	const { host, port, timeout = 5000, keepAliveInterval, noDelay } = options;

	const socket = await tjs.connect("tcp", host, port, {
		noDelay,
		// keepAliveDelay is in seconds, while the binding contract is milliseconds
		keepAliveDelay: keepAliveInterval != undefined
			? Math.max(1, Math.round(keepAliveInterval / 1000))
			: undefined,
		// txiki applies the signal to the connect phase only, which is what the
		// timeout means here. @txikijs/types does not declare it, but it is honored.
		signal: AbortSignal.timeout(timeout),
	} as tjs.ConnectOptions);
	const { readable, writable } = await socket.opened;

	return {
		// txiki types its chunks against ArrayBufferLike, BytesView requires ArrayBuffer
		readable: readable as ReadableStream<BytesView>,
		writable,
		close() {
			socket.close();
			return socket.closed.catch(() => {
				// A connection that dropped is closed for our purposes
			});
		},
	};
}

/** An implementation of the Serial bindings for txiki.js */
export const serial: Serial = {
	async createFactoryByPath(
		path: string,
	): Promise<ZWaveSerialBindingFactory> {
		if (path.startsWith("tcp://")) {
			const url = new URL(path);
			return createSocketFactory(
				connect,
				url.hostname,
				parseInt(url.port),
			);
		} else if (path.startsWith("esphome://")) {
			const url = new URL(path);
			return createESPHomeFactory(connect, {
				host: url.hostname,
				port: url.port ? parseInt(url.port) : undefined,
				encryptionKey: url.searchParams.get("key") ?? undefined,
			});
		}

		throw new Error(
			`Only tcp:// and esphome:// connection strings are supported on txiki.js, got: ${path}`,
		);
	},

	connect,
};
