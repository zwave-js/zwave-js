import {
	FirmwareUpdateMetaDataCCGet,
	FirmwareUpdateMetaDataCCMetaDataGet,
	FirmwareUpdateMetaDataCCMetaDataReport,
	FirmwareUpdateMetaDataCCReport,
	FirmwareUpdateMetaDataCCRequestGet,
	FirmwareUpdateMetaDataCCRequestReport,
	FirmwareUpdateMetaDataCCStatusReport,
	FirmwareUpdateRequestStatus,
	FirmwareUpdateStatus,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

import type { ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuiteMulti.js";

// With a max. fragment size of 20, this firmware is transferred in 5 fragments
const firmware = [{ data: new Uint8Array(100), firmwareTarget: 0 }];

/**
 * Creates a mock firmware update behavior, which logs what each node receives, e.g. `2:meta`, `2:request`, `2:1`.
 * A node in `paused` stops requesting fragments.
 */
function createFirmwareUpdateMock() {
	const log: string[] = [];
	const paused = new Set<number>();

	const behavior: MockNodeBehavior = {
		handleCC(controller, self, receivedCC) {
			const requestFragment = (reportNumber: number) =>
				setTimeout(() => {
					if (paused.has(self.id)) return;
					void self.sendToController(
						createMockZWaveRequestFrame(
							new FirmwareUpdateMetaDataCCGet({
								nodeId: controller.ownNodeId,
								numReports: 1,
								reportNumber,
							}),
							{ ackRequested: false },
						),
					);
				}, 50);

			if (receivedCC instanceof FirmwareUpdateMetaDataCCMetaDataGet) {
				log.push(`${self.id}:meta`);
				const cc = new FirmwareUpdateMetaDataCCMetaDataReport({
					nodeId: controller.ownNodeId,
					manufacturerId: 0x1234,
					firmwareId: 1,
					checksum: 0,
					firmwareUpgradable: true,
					maxFragmentSize: 20,
				});
				return { action: "sendCC", cc };
			} else if (
				receivedCC instanceof FirmwareUpdateMetaDataCCRequestGet
			) {
				log.push(`${self.id}:request`);
				requestFragment(1);
				const cc = new FirmwareUpdateMetaDataCCRequestReport({
					nodeId: controller.ownNodeId,
					status: FirmwareUpdateRequestStatus.OK,
				});
				return { action: "sendCC", cc };
			} else if (receivedCC instanceof FirmwareUpdateMetaDataCCReport) {
				log.push(`${self.id}:${receivedCC.reportNumber}`);
				if (receivedCC.isLast) {
					const cc = new FirmwareUpdateMetaDataCCStatusReport({
						nodeId: controller.ownNodeId,
						status: FirmwareUpdateStatus.OK_NoRestart,
					});
					return { action: "sendCC", cc };
				}
				requestFragment(receivedCC.reportNumber + 1);
				return { action: "stop" };
			}
		},
	};

	return { log, paused, behavior };
}

const fragmentsOf = (nodeId: number) =>
	[1, 2, 3, 4, 5].map((num) => `${nodeId}:${num}`);

function nodeCapabilities(id: number, isListening: boolean) {
	return {
		id,
		capabilities: {
			commandClasses: [
				CommandClasses["Firmware Update Meta Data"],
				...(isListening ? [] : [CommandClasses["Wake Up"]]),
			],
			isListening,
			isFrequentListening: false,
		},
	};
}

// Set up what the skipped interview would normally discover
function setupNode(node: ZWaveNode, isListening: boolean) {
	node.addCC(CommandClasses["Firmware Update Meta Data"], {
		isSupported: true,
		version: 5,
	});
	if (isListening) return;

	node.addCC(CommandClasses["Wake Up"], {
		isSupported: true,
		version: 2,
	});
	(node as any).isListening = false;
	(node as any).isFrequentListening = false;
	node.markAsAsleep();
}

async function waitForLogEntry(log: string[], entry: string, count = 1) {
	while (log.filter((e) => e === entry).length < count) {
		await wait(10);
	}
}

{
	const mock = createFirmwareUpdateMock();
	integrationTest.sequential(
		"Only one node at a time receives firmware fragments",
		{
			nodeCapabilities: [
				nodeCapabilities(2, true),
				nodeCapabilities(3, true),
			],
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController, mockNodes) => {
				for (const mockNode of mockNodes) {
					mockNode.defineBehavior(mock.behavior);
				}
			},

			testBody: async (t, driver, nodes) => {
				for (const node of nodes) setupNode(node, true);

				const results = await Promise.all(
					nodes.map((node) => node.updateFirmware(firmware)),
				);
				for (const result of results) {
					t.expect(result.success).toBe(true);
				}

				const fragments = mock.log.filter(
					(e) => !e.endsWith(":meta") && !e.endsWith(":request"),
				);
				// Either node may go first, but it must receive all of its fragments before the other node gets any
				const firstNode = fragments[0] === "2:1" ? 2 : 3;
				const secondNode = firstNode === 2 ? 3 : 2;
				t.expect(fragments).toEqual([
					...fragmentsOf(firstNode),
					...fragmentsOf(secondNode),
				]);
			},
		},
	);
}

{
	const mock = createFirmwareUpdateMock();
	integrationTest.sequential(
		"A node that falls asleep while waiting for the firmware transfer lets an awake node go first",
		{
			nodeCapabilities: [
				nodeCapabilities(2, false),
				nodeCapabilities(3, false),
			],
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController, mockNodes) => {
				for (const mockNode of mockNodes) {
					mockNode.defineBehavior(mock.behavior);
				}
			},

			testBody: async (t, driver, nodes) => {
				const [node2, node3] = nodes;
				for (const node of nodes) setupNode(node, false);

				const update2 = node2.updateFirmware(firmware);
				const update3 = node3.updateFirmware(firmware);
				await wait(100);
				t.expect(mock.log).toEqual([]);

				// Node 3 wakes up first and gets the first transfer
				node3.markAsAwake();
				await waitForLogEntry(mock.log, "3:1");

				// Node 2 wakes up during node 3's transfer and falls asleep again before its turn
				node2.markAsAwake();
				await waitForLogEntry(mock.log, "2:meta");
				// Let the Meta Data Get finish first
				await wait(150);
				node2.markAsAsleep();

				t.expect((await update3).success).toBe(true);
				await wait(300);
				t.expect(mock.log).not.toContain("2:request");

				// Node 2 wakes up again and gets its transfer
				node2.markAsAwake();
				t.expect((await update2).success).toBe(true);
				t.expect(mock.log).toEqual([
					"3:meta",
					"3:request",
					"3:1",
					"2:meta",
					...fragmentsOf(3).slice(1),
					"2:request",
					...fragmentsOf(2),
				]);
			},
		},
	);
}

{
	const mock = createFirmwareUpdateMock();
	integrationTest.sequential(
		"A node that falls asleep during the firmware transfer lets the next node go and transfers the file again after waking up",
		{
			nodeCapabilities: [
				nodeCapabilities(2, false),
				nodeCapabilities(3, false),
			],
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController, mockNodes) => {
				for (const mockNode of mockNodes) {
					mockNode.defineBehavior(mock.behavior);
				}
			},

			testBody: async (t, driver, nodes) => {
				const [node2, node3] = nodes;
				for (const node of nodes) setupNode(node, false);

				const update2 = node2.updateFirmware(firmware);
				const update3 = node3.updateFirmware(firmware);

				node3.markAsAwake();
				await waitForLogEntry(mock.log, "3:2");
				// Node 3 stops requesting fragments and falls asleep
				mock.paused.add(3);
				node3.markAsAsleep();

				node2.markAsAwake();
				t.expect((await update2).success).toBe(true);

				mock.paused.delete(3);
				node3.markAsAwake();
				t.expect((await update3).success).toBe(true);

				// Node 3 cannot resume and starts over
				t.expect(mock.log).toEqual([
					"3:meta",
					"3:request",
					"3:1",
					"3:2",
					"2:meta",
					"2:request",
					...fragmentsOf(2),
					"3:request",
					...fragmentsOf(3),
				]);
			},
		},
	);
}

{
	const mock = createFirmwareUpdateMock();
	integrationTest.sequential(
		"A firmware update fails after the node fell asleep during 3 transfers that started over",
		{
			nodeCapabilities: [nodeCapabilities(2, false)],
			additionalDriverOptions: {
				testingHooks: { skipNodeInterview: true },
			},
			customSetup: async (driver, mockController, mockNodes) => {
				for (const mockNode of mockNodes) {
					mockNode.defineBehavior(mock.behavior);
				}
			},

			testBody: async (t, driver, nodes) => {
				const [node2] = nodes;
				setupNode(node2, false);

				let finished = false;
				const update = node2.updateFirmware(firmware).finally(() => {
					finished = true;
				});

				for (let attempt = 1; attempt <= 3; attempt++) {
					mock.paused.delete(2);
					node2.markAsAwake();
					await waitForLogEntry(mock.log, "2:2", attempt);
					// Node 2 stops requesting fragments and falls asleep
					mock.paused.add(2);
					node2.markAsAsleep();
					await wait(150);
					t.expect(finished).toBe(attempt === 3);
				}

				const result = await update;
				t.expect(result.success).toBe(false);
				t.expect(result.status).toBe(
					FirmwareUpdateStatus.Error_TransmissionFailed,
				);
				t.expect(
					mock.log.filter((e) => e === "2:request"),
				).toHaveLength(3);
			},
		},
	);
}
