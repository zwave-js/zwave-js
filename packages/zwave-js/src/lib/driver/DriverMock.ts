import {
	SerialAPIParser,
	type ZWaveSerialBindingFactory,
	ZWaveSerialFrameType,
	type ZWaveSerialStream,
} from "@zwave-js/serial";
import { MockPort } from "@zwave-js/serial/mock";
import { noop } from "@zwave-js/shared";
import type { FileSystem } from "@zwave-js/shared/bindings";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "pathe";
import { Driver } from "./Driver.js";
import type { PartialZWaveOptions, ZWaveOptions } from "./ZWaveOptions.js";

export interface CreateAndStartDriverWithMockPortResult {
	driver: Driver;
	continueStartup: () => void;
	mockPort: MockPort;
	serial: ZWaveSerialStream;
	/** The TCP server the driver is connected to. Only present when the `connectViaTCP` option is enabled. */
	tcpServer?: net.Server;
}

export interface CreateAndStartDriverWithMockPortOptions {
	/**
	 * Whether the driver should connect to the mock port through an actual TCP connection
	 * instead of using its binding directly. This allows testing reconnection scenarios
	 * with real network errors. Default: false.
	 */
	connectViaTCP?: boolean;
}

/** Exposes a {@link MockPort} via a local TCP server, so the driver can connect to it using a `tcp://` connection string */
async function serveMockPortViaTCP(mockPort: MockPort): Promise<net.Server> {
	// Take the role the driver would normally have in direct mode and
	// bridge between the mock port binding and the TCP socket
	const binding = await mockPort.factory()();

	let socket: net.Socket | undefined;

	// Forward data from the mock controller to the connected socket
	void new ReadableStream(binding.source).pipeTo(
		new WritableStream({
			write(chunk) {
				socket?.write(chunk);
			},
		}),
	).catch(noop);

	const sinkWriter = new WritableStream(binding.sink).getWriter();

	const server = net.createServer((sock) => {
		socket = sock;

		// The mock controller expects one complete message per chunk, but TCP
		// does not preserve write boundaries. Re-chunk the byte stream into
		// Serial API frames before passing them on.
		const parser = new SerialAPIParser();
		const parserWriter = parser.writable.getWriter();
		void parser.readable.pipeTo(
			new WritableStream({
				write(frame) {
					if (frame.type !== ZWaveSerialFrameType.SerialAPI) return;
					const data = typeof frame.data === "number"
						? Uint8Array.from([frame.data])
						: frame.data;
					void sinkWriter.write(data).catch(noop);
				},
			}),
		).catch(noop);

		sock.on("data", (chunk) => {
			void parserWriter.write(chunk).catch(noop);
		});
		sock.on("error", noop);
		sock.on("close", () => {
			if (socket === sock) socket = undefined;
			void parserWriter.abort().catch(noop);
		});
	});

	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", resolve);
	});

	return server;
}

/** Creates a real driver instance with a mocked serial port to enable end to end tests */
export async function createAndStartDriverWithMockPort(
	options:
		& Partial<CreateAndStartDriverWithMockPortOptions>
		& PartialZWaveOptions = {},
): Promise<CreateAndStartDriverWithMockPortResult> {
	const { connectViaTCP = false, ...driverOptions } = options;

	const mockPort = new MockPort();
	let port: string | ZWaveSerialBindingFactory;
	let tcpServer: net.Server | undefined;
	if (connectViaTCP) {
		tcpServer = await serveMockPortViaTCP(mockPort);
		const address = tcpServer.address() as net.AddressInfo;
		port = `tcp://${address.address}:${address.port}`;
	} else {
		port = mockPort.factory();
	}

	return new Promise((resolve, reject) => {
		let driver: Driver;

		// This will be called when the driver has opened the serial port
		const onSerialPortOpen = (
			serial: ZWaveSerialStream,
		): Promise<void> => {
			// Return the info to the calling code, giving it control over
			// continuing the driver startup.
			const continuePromise = createDeferredPromise();
			resolve({
				driver,
				mockPort,
				serial,
				tcpServer,
				continueStartup: () => continuePromise.resolve(),
			});

			return continuePromise;
		};

		// Usually we don't want logs in these tests
		if (!driverOptions.logConfig) {
			driverOptions.logConfig = {
				enabled: false,
			};
		}

		const testingHooks: ZWaveOptions["testingHooks"] = {
			...driverOptions.testingHooks,
			onSerialPortOpen,
		};

		driver = new Driver(port, {
			...driverOptions,
			testingHooks,
		});
		driver.start().catch(reject);
	});
}

export type CreateAndStartTestingDriverResult = Omit<
	CreateAndStartDriverWithMockPortResult,
	"continueStartup"
>;

export interface CreateAndStartTestingDriverOptions {
	beforeStartup: (
		mockPort: MockPort,
		serial: ZWaveSerialStream,
	) => void | Promise<void>;
	/**
	 * Whether the controller identification should be skipped (default: false).
	 * If not, a Mock controller must be available on the serial port.
	 */
	skipControllerIdentification?: boolean;
	/**
	 * Whether the node interview should be skipped (default: false).
	 * If not, a Mock controller and/or mock nodes must be available on the serial port.
	 */
	skipNodeInterview?: boolean;

	/**
	 * Set this to true to skip checking if the controller is in bootloader, serial API, or CLI mode (default: true)
	 */
	skipFirmwareIdentification?: boolean;

	/**
	 * Whether configuration files should be loaded (default: true)
	 */
	loadConfiguration?: boolean;

	portAddress: string;
	fs?: FileSystem;
}

export async function createAndStartTestingDriver(
	options:
		& Partial<CreateAndStartTestingDriverOptions>
		& PartialZWaveOptions = {},
): Promise<CreateAndStartTestingDriverResult> {
	const {
		beforeStartup,
		skipControllerIdentification = false,
		skipFirmwareIdentification = true,
		skipNodeInterview = false,
		loadConfiguration = true,
		fs = (await import("#default_bindings/fs")).fs,
		...internalOptions
	} = options;

	// Use a new fake serial port for each test
	const testId = Math.round(Math.random() * 0xffffffff)
		.toString(16)
		.padStart(8, "0");
	// internalOptions.portAddress ??= `/tty/FAKE${testId}`;

	if (skipControllerIdentification) {
		internalOptions.testingHooks ??= {};
		internalOptions.testingHooks.skipControllerIdentification = true;
	}
	if (skipNodeInterview) {
		internalOptions.testingHooks ??= {};
		internalOptions.testingHooks.skipNodeInterview = true;
	}
	if (!loadConfiguration) {
		internalOptions.testingHooks ??= {};
		internalOptions.testingHooks.loadConfiguration = false;
	}
	if (skipFirmwareIdentification) {
		internalOptions.testingHooks ??= {};
		internalOptions.testingHooks.skipFirmwareIdentification = true;
	}

	// TODO: Make sure we delete this from time to time
	const cacheDir = path.join(tmpdir(), "zwave-js-test-cache", testId);

	internalOptions.storage ??= {};
	internalOptions.storage.cacheDir = cacheDir;

	const { driver, continueStartup, mockPort, serial } =
		await createAndStartDriverWithMockPort(internalOptions);

	if (typeof beforeStartup === "function") {
		await beforeStartup(mockPort, serial);
	}

	// Make sure the mock FS gets restored when the driver is destroyed
	const originalDestroy = driver.destroy.bind(driver);
	driver.destroy = async () => {
		await originalDestroy();
		await fs.deleteDir(cacheDir);
	};

	return new Promise((resolve) => {
		driver.once("driver ready", () => {
			resolve({ driver, mockPort, serial });
		});
		continueStartup();
	});
}
