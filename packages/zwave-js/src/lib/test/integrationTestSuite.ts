import { fs } from "@zwave-js/core/bindings/fs/node";
import type { ZWaveSerialStream } from "@zwave-js/serial";
import type { MockPort } from "@zwave-js/serial/mock";
import { copyFilesRecursive, noop } from "@zwave-js/shared";
import type {
	MockController,
	MockControllerOptions,
	MockNode,
	MockNodeOptions,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import crypto from "node:crypto";
import fsp from "node:fs/promises";
import type net from "node:net";
import os from "node:os";
import path from "node:path";
import { type TestContext, test } from "vitest";
import type { Driver } from "../driver/Driver.js";
import type { PartialZWaveOptions } from "../driver/ZWaveOptions.js";
import type { ZWaveNode } from "../node/Node.js";
import { prepareDriver, prepareMocks } from "./integrationTestSuiteShared.js";

interface IntegrationTestOptions {
	/** Enable debugging for this integration tests. When enabled, a driver logfile will be written and the test directory will not be deleted after each test. Default: false */
	debug?: boolean;
	/** If given, the files from this directory will be copied into the test cache directory prior to starting the driver. */
	provisioningDirectory?: string;
	/** Whether the recorded messages and frames should be cleared before executing the test body. Default: true. */
	clearMessageStatsBeforeTest?: boolean;
	/** Whether the driver should connect to the mock controller through an actual TCP connection. This allows testing reconnection scenarios with real network errors. Default: false */
	connectViaTCP?: boolean;
	controllerCapabilities?: MockControllerOptions["capabilities"];
	nodeCapabilities?: MockNodeOptions["capabilities"];
	customSetup?: (
		driver: Driver,
		mockController: MockController,
		mockNode: MockNode,
	) => Promise<void>;
	testBody: (
		t: TestContext,
		driver: Driver,
		node: ZWaveNode,
		mockController: MockController,
		mockNode: MockNode,
		context: IntegrationTestContext,
	) => Promise<void>;
	additionalDriverOptions?: PartialZWaveOptions;
}

export interface IntegrationTestContext {
	/** The TCP server the driver is connected to. Only present when the `connectViaTCP` option is enabled. */
	tcpServer?: net.Server;
}

export interface IntegrationTestFn {
	(name: string, options: IntegrationTestOptions): void;
}
export interface IntegrationTestModifiers {
	/** Only runs the tests inside this `integrationTest` suite for the current file */
	only: IntegrationTestFn;
	/** Skips running the tests inside this `integrationTest` suite for the current file */
	skip: IntegrationTestFn;
}
export interface IntegrationTest
	extends IntegrationTestFn, IntegrationTestModifiers
{
	/**
	 * Runs this test sequentially instead of concurrently with the other tests in the file.
	 * Use for tests that assert on timing or ordering, which CPU contention would perturb.
	 */
	sequential: IntegrationTestFn & IntegrationTestModifiers;
}

function suite(
	name: string,
	options: IntegrationTestOptions,
	modifier?: "only" | "skip",
	concurrency: "concurrent" | "sequential" = "concurrent",
) {
	const {
		controllerCapabilities,
		nodeCapabilities,
		customSetup,
		testBody,
		debug = false,
		provisioningDirectory,
		clearMessageStatsBeforeTest = true,
		connectViaTCP = false,
		additionalDriverOptions,
	} = options;

	let driver: Driver;
	let node: ZWaveNode;
	let mockPort: MockPort;
	let serial: ZWaveSerialStream;
	let tcpServer: net.Server | undefined;
	let continueStartup: () => void;
	let mockController: MockController;
	let mockNode: MockNode;

	const cacheDir = path.join(
		os.tmpdir(),
		`zjs_test_cache_${crypto.randomBytes(4).toString("hex")}`,
	);

	async function prepareTest() {
		if (debug) {
			console.log(`Running integration test in directory ${cacheDir}`);
		}

		// Make sure every test is starting fresh
		await fsp.rm(cacheDir, { recursive: true, force: true }).catch(noop);
		await fsp.mkdir(cacheDir, { recursive: true });

		// And potentially provision the cache
		if (provisioningDirectory) {
			await copyFilesRecursive(fs, provisioningDirectory, cacheDir);
		}

		({ driver, continueStartup, mockPort, serial, tcpServer } =
			await prepareDriver(
				cacheDir,
				debug,
				additionalDriverOptions,
				connectViaTCP,
			));

		({
			mockController,
			mockNodes: [mockNode],
		} = await prepareMocks(
			mockPort,
			serial,
			{
				capabilities: controllerCapabilities,
				securityKeys: driver.options.securityKeys,
			},
			[
				{
					id: 2,
					capabilities: nodeCapabilities,
				},
			],
		));

		if (customSetup) {
			await customSetup(driver, mockController, mockNode);
		}

		return new Promise<void>((resolve) => {
			driver.once("driver ready", () => {
				// Test code goes here

				const onReady = () => {
					if (clearMessageStatsBeforeTest) {
						mockNode.clearReceivedControllerFrames();
						mockNode.clearSentControllerFrames();
						mockController.clearReceivedHostMessages();
					}

					process.nextTick(resolve);
				};

				node = driver.controller.nodes.getOrThrow(mockNode.id);

				if (
					options.additionalDriverOptions?.testingHooks
						?.skipNodeInterview
				) {
					onReady();
				} else {
					node.once("ready", onReady);
				}
			});

			if (
				options.additionalDriverOptions?.bootloaderMode === "stay"
				|| options.additionalDriverOptions?.bootloaderMode === "allow"
			) {
				driver.once("bootloader ready", () => {
					process.nextTick(resolve);
				});
			}

			continueStartup();
		});
	}

	const base = concurrency === "sequential"
		? test.sequential
		: test.concurrent;
	const fn = modifier === "only"
		? base.only
		: modifier === "skip"
		? base.skip
		: base;
	fn(name, async (t) => {
		t.onTestFinished(async () => {
			// Give everything a chance to settle before destroying the driver.
			await wait(100);

			await driver.destroy();
			// Stop the mock too, so late frames or pending host-ACK waits don't
			// throw after the driver is gone.
			mockController?.destroy();
			tcpServer?.close(noop);
			if (!debug) {
				await fsp.rm(cacheDir, { recursive: true, force: true })
					.catch(noop);
			}
		});

		await prepareTest();
		await testBody(t, driver, node, mockController, mockNode, {
			tcpServer,
		});
	}, 30000);
}

/** Performs an integration test with a real driver using a mock controller and one mock node */
export const integrationTest = ((
	name: string,
	options: IntegrationTestOptions,
): void => {
	suite(name, options);
}) as IntegrationTest;

integrationTest.only = (name: string, options: IntegrationTestOptions) => {
	suite(name, options, "only");
};

integrationTest.skip = (name: string, options: IntegrationTestOptions) => {
	suite(name, options, "skip");
};

integrationTest.sequential = ((
	name: string,
	options: IntegrationTestOptions,
): void => {
	suite(name, options, undefined, "sequential");
}) as IntegrationTest["sequential"];

integrationTest.sequential.only = (
	name: string,
	options: IntegrationTestOptions,
) => {
	suite(name, options, "only", "sequential");
};

integrationTest.sequential.skip = (
	name: string,
	options: IntegrationTestOptions,
) => {
	suite(name, options, "skip", "sequential");
};
