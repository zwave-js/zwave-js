import { FunctionType } from "@zwave-js/serial";
import {
	EnterBootloaderRequest,
	FIRMWARE_UPDATE_MAX_CHUNK_SIZE,
	FirmwareUpdateCallback,
	FirmwareUpdateCommandStatus,
	FirmwareUpdateRequest,
	FirmwareUpdateResponse,
	FirmwareUpdateSubCommand,
	FirmwareUpdate_PerformRequest,
	FirmwareUpdate_WriteChunkRequest,
	OTWFirmwareUpdateTarget,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import {
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import {
	type OTWFirmwareUpdateProgress,
	OTWFirmwareUpdateStatus,
} from "../../driver/_Types.js";
import { integrationTest } from "../integrationTestSuite.js";

const capabilitiesWithFirmwareUpdate: MockControllerCapabilities = {
	...getDefaultMockControllerCapabilities(),
	supportedFunctionTypes: [
		...getDefaultSupportedFunctionTypes(),
		FunctionType.FirmwareUpdate,
	],
};

// 5 full chunks and a partial one
const firmware = new Bytes(5 * FIRMWARE_UPDATE_MAX_CHUNK_SIZE + 100);
for (let i = 0; i < firmware.length; i++) firmware[i] = (i * 7) & 0xff;

interface MockFirmwareUpdateOptions {
	/** Reject this sub command with the given status in the response */
	rejectInResponse?: [FirmwareUpdateSubCommand, FirmwareUpdateCommandStatus];
	/** Report this status for the sub command in the callback */
	failInCallback?: [FirmwareUpdateSubCommand, FirmwareUpdateCommandStatus];
	/** Send no callback for this sub command */
	omitCallback?: FirmwareUpdateSubCommand;
	/** Send no Serial API Started notification after Perform */
	omitSerialAPIStarted?: boolean;
}

interface MockFirmwareUpdateState {
	image: Bytes;
	target?: OTWFirmwareUpdateTarget;
	restarted: boolean;
}

function createFirmwareUpdateBehavior(
	options: MockFirmwareUpdateOptions,
	state: MockFirmwareUpdateState,
): MockControllerBehavior {
	return {
		async onHostMessage(controller, msg) {
			if (!(msg instanceof FirmwareUpdateRequest)) return;

			const [rejectSubCommand, rejectStatus] =
				options.rejectInResponse ?? [];
			if (rejectSubCommand === msg.subCommand) {
				await controller.sendMessageToHost(
					new FirmwareUpdateResponse({
						subCommand: msg.subCommand,
						status: rejectStatus!,
					}),
				);
				return true;
			}

			await controller.sendMessageToHost(
				new FirmwareUpdateResponse({
					subCommand: msg.subCommand,
					status: FirmwareUpdateCommandStatus.OK,
				}),
			);

			if (msg instanceof FirmwareUpdate_WriteChunkRequest) {
				state.image.set(msg.data, msg.offset);
			} else if (msg instanceof FirmwareUpdate_PerformRequest) {
				state.target = msg.target;
			}

			if (options.omitCallback === msg.subCommand) return true;

			const [failSubCommand, failStatus] = options.failInCallback ?? [];
			const status =
				failSubCommand === msg.subCommand
					? failStatus!
					: FirmwareUpdateCommandStatus.OK;
			await controller.sendMessageToHost(
				new FirmwareUpdateCallback({
					callbackId: msg.callbackId,
					status,
				}),
			);

			if (
				msg instanceof FirmwareUpdate_PerformRequest
				&& status === FirmwareUpdateCommandStatus.OK
			) {
				state.restarted = true;
				if (!options.omitSerialAPIStarted) {
					setTimeout(async () => {
						await controller.sendMessageToHost(
							new SerialAPIStartedRequest({
								wakeUpReason: SerialAPIWakeUpReason.Reset,
								watchdogEnabled:
									controller.capabilities.watchdogEnabled,
								isListening: true,
								...determineNIF(),
								supportsLongRange:
									controller.capabilities.supportsLongRange,
							}),
						);
					}, 200);
				}
			}

			return true;
		},
	};
}

function createState(): MockFirmwareUpdateState {
	return { image: new Bytes(firmware.length), restarted: false };
}

function receivedSubCommands(mockController: {
	receivedHostMessages: readonly unknown[];
}): FirmwareUpdateSubCommand[] {
	return mockController.receivedHostMessages
		.filter((m) => m instanceof FirmwareUpdateRequest)
		.map((m) => m.subCommand);
}

{
	const state = createState();
	integrationTest(
		"OTW update with the Firmware Update command uploads the file in chunks and re-initializes the controller",
		{
			controllerCapabilities: capabilitiesWithFirmwareUpdate,
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createFirmwareUpdateBehavior({}, state),
				);
			},
			testBody: async (t, driver, node, mockController) => {
				const progress: OTWFirmwareUpdateProgress[] = [];
				driver.on("firmware update progress", (p) => progress.push(p));

				const result = await driver.firmwareUpdateOTW(firmware);

				t.expect(result).toStrictEqual({
					success: true,
					status: OTWFirmwareUpdateStatus.OK,
				});
				t.expect(state.image).toStrictEqual(firmware);
				t.expect(state.target).toBe(OTWFirmwareUpdateTarget.Firmware);
				t.expect(receivedSubCommands(mockController)).toStrictEqual([
					FirmwareUpdateSubCommand.Prepare,
					...Array.from(
						{ length: 6 },
						() => FirmwareUpdateSubCommand.WriteChunk,
					),
					FirmwareUpdateSubCommand.Perform,
				]);
				t.expect(progress.map((p) => p.sentFragments)).toStrictEqual([
					1, 2, 3, 4, 5, 6,
				]);
				t.expect(progress.at(-1)?.progress).toBe(100);

				// The controller was interviewed again after the restart
				t.expect(driver.controller.sdkVersion).toBeDefined();
				mockController.assertReceivedHostMessage(
					(msg) =>
						msg.functionType === FunctionType.GetControllerVersion,
				);
			},
		},
	);
}

{
	const state = createState();
	integrationTest(
		"OTW update with the Firmware Update command passes the bootloader target to Perform",
		{
			controllerCapabilities: capabilitiesWithFirmwareUpdate,
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createFirmwareUpdateBehavior({}, state),
				);
			},
			testBody: async (t, driver) => {
				const result = await driver.firmwareUpdateOTW(firmware, {
					target: OTWFirmwareUpdateTarget.Bootloader,
				});

				t.expect(result.success).toBe(true);
				t.expect(state.target).toBe(OTWFirmwareUpdateTarget.Bootloader);
			},
		},
	);
}

const failureCases: {
	name: string;
	options: MockFirmwareUpdateOptions;
	expectedStatus: OTWFirmwareUpdateStatus;
	expectedErrorCode?: FirmwareUpdateCommandStatus;
	expectedSubCommands: number;
}[] = [
	{
		name: "Prepare is rejected in the response",
		options: {
			rejectInResponse: [
				FirmwareUpdateSubCommand.Prepare,
				FirmwareUpdateCommandStatus.Error_PrepareFailed,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Aborted,
		expectedErrorCode: FirmwareUpdateCommandStatus.Error_PrepareFailed,
		expectedSubCommands: 1,
	},
	{
		name: "Prepare fails in the callback",
		options: {
			failInCallback: [
				FirmwareUpdateSubCommand.Prepare,
				FirmwareUpdateCommandStatus.Error_PrepareFailed,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Aborted,
		expectedErrorCode: FirmwareUpdateCommandStatus.Error_PrepareFailed,
		expectedSubCommands: 1,
	},
	{
		name: "Write Chunk is rejected in the response",
		options: {
			rejectInResponse: [
				FirmwareUpdateSubCommand.WriteChunk,
				FirmwareUpdateCommandStatus.Error_TooBig,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Aborted,
		expectedErrorCode: FirmwareUpdateCommandStatus.Error_TooBig,
		expectedSubCommands: 2,
	},
	{
		name: "Write Chunk fails in the callback",
		options: {
			failInCallback: [
				FirmwareUpdateSubCommand.WriteChunk,
				FirmwareUpdateCommandStatus.Error_TooBig,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Aborted,
		expectedErrorCode: FirmwareUpdateCommandStatus.Error_TooBig,
		expectedSubCommands: 2,
	},
	{
		name: "Perform is rejected in the response",
		options: {
			rejectInResponse: [
				FirmwareUpdateSubCommand.Perform,
				FirmwareUpdateCommandStatus.Error_UnsupportedTarget,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_NotSupported,
		expectedErrorCode: FirmwareUpdateCommandStatus.Error_UnsupportedTarget,
		expectedSubCommands: 8,
	},
	{
		name: "Perform fails in the callback",
		options: {
			failInCallback: [
				FirmwareUpdateSubCommand.Perform,
				FirmwareUpdateCommandStatus.Error_InvalidSignatureOrKey,
			],
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Aborted,
		expectedErrorCode:
			FirmwareUpdateCommandStatus.Error_InvalidSignatureOrKey,
		expectedSubCommands: 8,
	},
	{
		name: "the Write Chunk callback is missing",
		options: {
			omitCallback: FirmwareUpdateSubCommand.WriteChunk,
		},
		expectedStatus: OTWFirmwareUpdateStatus.Error_Timeout,
		expectedSubCommands: 2,
	},
];

for (const c of failureCases) {
	const state = createState();
	integrationTest(
		`OTW update with the Firmware Update command fails when ${c.name}`,
		{
			controllerCapabilities: capabilitiesWithFirmwareUpdate,
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createFirmwareUpdateBehavior(c.options, state),
				);
			},
			testBody: async (t, driver, node, mockController) => {
				let finished: unknown;
				driver.on("firmware update finished", (r) => (finished = r));

				const result = await driver.firmwareUpdateOTW(firmware);

				t.expect(result).toStrictEqual({
					success: false,
					status: c.expectedStatus,
					...(c.expectedErrorCode != undefined
						? { errorCode: c.expectedErrorCode }
						: {}),
				});
				t.expect(finished).toStrictEqual(result);
				t.expect(receivedSubCommands(mockController)).toHaveLength(
					c.expectedSubCommands,
				);
				t.expect(state.restarted).toBe(false);
				// The controller stays usable
				t.expect(driver.controller).toBeDefined();
				t.expect(
					mockController.receivedHostMessages.some(
						(msg) => msg instanceof EnterBootloaderRequest,
					),
				).toBe(false);
			},
		},
	);
}

{
	const state = createState();
	integrationTest.sequential(
		"OTW update with the Firmware Update command re-initializes the controller when Serial API Started is missing",
		{
			controllerCapabilities: capabilitiesWithFirmwareUpdate,
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
				timeouts: { firmwareUpdateInstall: 1000 },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createFirmwareUpdateBehavior(
						{ omitSerialAPIStarted: true },
						state,
					),
				);
			},
			testBody: async (t, driver, node, mockController) => {
				mockController.clearReceivedHostMessages();
				const result = await driver.firmwareUpdateOTW(firmware);

				t.expect(result.success).toBe(true);
				t.expect(state.restarted).toBe(true);
				mockController.assertReceivedHostMessage(
					(msg) =>
						msg.functionType === FunctionType.GetControllerVersion,
				);
			},
		},
	);
}

{
	const state = createState();
	integrationTest(
		"OTW update falls back to the bootloader when the controller cannot stage updates",
		{
			controllerCapabilities: capabilitiesWithFirmwareUpdate,
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
				// The mock has no bootloader. Don't wait long for it.
				timeouts: { firmwareUpdateInstall: 1000 },
			},
			customSetup: async (driver, mockController) => {
				mockController.defineBehavior(
					createFirmwareUpdateBehavior(
						{
							rejectInResponse: [
								FirmwareUpdateSubCommand.Prepare,
								FirmwareUpdateCommandStatus.Error_FirmwareUpdateNotSupported,
							],
						},
						state,
					),
				);
			},
			testBody: async (t, driver, node, mockController) => {
				// The mock has no bootloader, so the XMODEM update fails
				await driver.firmwareUpdateOTW(firmware).catch(() => {});

				t.expect(receivedSubCommands(mockController)).toStrictEqual([
					FirmwareUpdateSubCommand.Prepare,
				]);
				mockController.assertReceivedHostMessage(
					(msg) => msg instanceof EnterBootloaderRequest,
				);
			},
		},
	);
}

integrationTest(
	"OTW update uses the bootloader when the controller does not support the Firmware Update command",
	{
		additionalDriverOptions: {
			testingHooks: { skipNodeInterview: true },
			// The mock has no bootloader. Don't wait long for it.
			timeouts: { firmwareUpdateInstall: 1000 },
		},
		testBody: async (t, driver, node, mockController) => {
			// The mock has no bootloader, so the XMODEM update fails
			await driver.firmwareUpdateOTW(firmware).catch(() => {});

			t.expect(receivedSubCommands(mockController)).toHaveLength(0);
			mockController.assertReceivedHostMessage(
				(msg) => msg instanceof EnterBootloaderRequest,
			);
		},
	},
);
