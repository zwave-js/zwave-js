import {
	BasicCCGet,
	BasicCCReport,
	BasicCCSet,
	type CommandClass,
	CommandRelation,
	SupervisionCC,
	SupervisionCommand,
} from "@zwave-js/cc";
import {
	CommandClasses,
	EncapsulationFlags,
	MessagePriority,
	TransactionState,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import type { MockNodeBehavior } from "@zwave-js/testing";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { integrationTest } from "../integrationTestSuite.js";

class RelatedBasicCCGet extends BasicCCGet {
	public constructor(
		options: ConstructorParameters<typeof BasicCCGet>[0] & {
			relationKey: number;
		},
	) {
		super(options);
		this.relationKey = options.relationKey;
	}

	public readonly relationKey: number;

	protected override determineRelation(other: CommandClass): CommandRelation {
		if (!(other instanceof RelatedBasicCCGet)) {
			return CommandRelation.Unrelated;
		}
		return this.relationKey === other.relationKey
			? CommandRelation.Redundant
			: CommandRelation.Supersedes;
	}
}

class RelatedBasicCCSet extends BasicCCSet {
	protected override determineRelation(other: CommandClass): CommandRelation {
		if (!(other instanceof RelatedBasicCCSet)) {
			return CommandRelation.Unrelated;
		}
		return this.targetValue === other.targetValue
			? CommandRelation.Redundant
			: CommandRelation.Supersedes;
	}
}

interface CommandControl {
	blockNextGet: boolean;
	getCount: number;
	setValues: number[];
	supervisedSetCount: number;
	started: ReturnType<typeof createDeferredPromise<void>>;
	release: ReturnType<typeof createDeferredPromise<void>>;
}

function createCommandControl(): CommandControl {
	return {
		blockNextGet: false,
		getCount: 0,
		setValues: [],
		supervisedSetCount: 0,
		started: createDeferredPromise<void>(),
		release: createDeferredPromise<void>(),
	};
}

let control = createCommandControl();

function blockNextGet(): void {
	control.blockNextGet = true;
	control.started = createDeferredPromise<void>();
	control.release = createDeferredPromise<void>();
}

const commandOptions = {
	autoEncapsulate: false,
	maxSendAttempts: 1,
	supportCheck: false,
	useSupervision: false,
} as const;

integrationTest.sequential(
	"Command relations deduplicate physical transmissions through the Driver",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Basic,
				CommandClasses.Supervision,
			],
		},
		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},
		customSetup: async (_driver, _mockController, mockNode) => {
			control = createCommandControl();
			const handleRelatedCommands: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						control.getCount++;
						if (control.blockNextGet) {
							control.blockNextGet = false;
							control.started.resolve();
							await control.release;
						}
						return {
							action: "sendCC",
							cc: new BasicCCReport({
								nodeId: controller.ownNodeId,
								currentValue: control.getCount,
							}),
						};
					} else if (receivedCC instanceof BasicCCSet) {
						control.setValues.push(receivedCC.targetValue);
						if (
							receivedCC.isEncapsulatedWith(
								CommandClasses.Supervision,
								SupervisionCommand.Get,
							)
						) {
							control.supervisedSetCount++;
						}
						return { action: "ok" };
					}
				},
			};
			mockNode.defineBehavior(handleRelatedCommands);
		},
		testBody: async (t, driver) => {
			const createGet = (relationKey: number) =>
				new RelatedBasicCCGet({
					nodeId: 2,
					relationKey,
				});
			const createSet = (
				targetValue: number,
				endpointIndex: number = 0,
			) => new RelatedBasicCCSet({
				nodeId: 2,
				endpointIndex,
				targetValue,
			});

			// Exercise in-flight attachment replay and independent expiry
			blockNextGet();
			const firstProgress: TransactionState[] = [];
			const lateProgress: TransactionState[] = [];
			const first = driver.sendCommand(createGet(1), {
				...commandOptions,
				priority: MessagePriority.Poll,
				onProgress: ({ state }) => firstProgress.push(state),
			});
			await control.started;
			const late = driver.sendCommand(createGet(1), {
				...commandOptions,
				expire: 20,
				priority: MessagePriority.Controller,
				onProgress: ({ state }) => lateProgress.push(state),
			});

			await t.expect(late, "redundant caller expiry").rejects
				.toMatchObject({
					code: ZWaveErrorCodes.Controller_MessageExpired,
				});
			t.expect(driver["queue"].currentTransaction?.priority).toBe(
				MessagePriority.Poll,
			);
			control.release.resolve();
			const firstResult = await first;
			t.expect(firstResult).toBeInstanceOf(BasicCCReport);
			t.expect(control.getCount).toBe(1);
			t.expect(firstProgress).toEqual([
				TransactionState.Queued,
				TransactionState.Active,
				TransactionState.Completed,
			]);
			t.expect(lateProgress).toEqual([
				TransactionState.Queued,
				TransactionState.Active,
				TransactionState.Failed,
			]);

			// Fan out one successful physical result
			blockNextGet();
			const successfulCount = control.getCount;
			const successfulFirst = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const successfulSecond = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			control.release.resolve();
			const [successfulFirstResult, successfulSecondResult] =
				await Promise
					.all([successfulFirst, successfulSecond]);
			t.expect(successfulFirstResult).toBe(successfulSecondResult);
			t.expect(control.getCount).toBe(successfulCount + 1);

			// Fan out one queued physical rejection
			blockNextGet();
			const rejectedCount = control.getCount;
			const rejectionBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const rejectedFirst = driver.sendCommand(createGet(2), {
				...commandOptions,
				priority: MessagePriority.Poll,
			});
			const rejectedSecond = driver.sendCommand(
				createGet(2),
				{
					...commandOptions,
					priority: MessagePriority.Poll,
				},
			);
			await driver.rejectTransactions(
				(transaction) => transaction.priority === MessagePriority.Poll,
				"rejected for testing",
			);
			await t.expect(
				rejectedFirst,
				"first attached physical failure",
			).rejects.toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageDropped,
			});
			await t.expect(
				rejectedSecond,
				"second attached physical failure",
			).rejects.toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageDropped,
			});
			control.release.resolve();
			await rejectionBlocker;
			t.expect(control.getCount).toBe(rejectedCount + 1);

			// Promote a queued redundant command without changing queue order
			control.setValues = [];
			blockNextGet();
			const blocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const unrelated = driver.sendCommand(
				new BasicCCSet({ nodeId: 2, targetValue: 10 }),
				{
					...commandOptions,
					priority: MessagePriority.Normal,
				},
			);
			const queuedFirst = driver.sendCommand(createSet(1), {
				...commandOptions,
				priority: MessagePriority.Poll,
			});
			const queuedSecond = driver.sendCommand(createSet(1), {
				...commandOptions,
				priority: MessagePriority.Controller,
			});
			control.release.resolve();
			await Promise.all([
				blocker,
				unrelated,
				queuedFirst,
				queuedSecond,
			]);
			t.expect(control.setValues).toEqual([1, 10]);

			// Supersede a queued command before transmission
			control.setValues = [];
			blockNextGet();
			const supersedingBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const superseded = driver.sendCommand(
				createSet(1),
				commandOptions,
			);
			const supersededResult = superseded.catch((error) => error);
			const superseding = driver.sendCommand(
				createSet(2),
				commandOptions,
			);
			t.expect(await supersededResult).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageSuperseded,
			});
			control.release.resolve();
			await Promise.all([supersedingBlocker, superseding]);
			t.expect(control.setValues).toEqual([2]);

			// Preserve an in-flight command when a newer command supersedes it
			blockNextGet();
			const supersedingCount = control.getCount;
			const inFlightSuperseded = driver.sendCommand(
				createGet(3),
				commandOptions,
			);
			await control.started;
			const inFlightSuperseding = driver.sendCommand(
				createGet(4),
				commandOptions,
			);
			control.release.resolve();
			await Promise.all([inFlightSuperseded, inFlightSuperseding]);
			t.expect(control.getCount).toBe(supersedingCount + 2);

			// Keep execution-affecting options on separate transmissions
			blockNextGet();
			const incompatibleCount = control.getCount;
			const incompatibleFirst = driver.sendCommand(createGet(5), {
				...commandOptions,
				maxSendAttempts: 1,
			});
			await control.started;
			const incompatibleSecond = driver.sendCommand(createGet(5), {
				...commandOptions,
				maxSendAttempts: 2,
			});
			control.release.resolve();
			await Promise.all([incompatibleFirst, incompatibleSecond]);
			t.expect(control.getCount).toBe(incompatibleCount + 2);

			// Let protected queued and active commands absorb enabled callers
			control.setValues = [];
			blockNextGet();
			const protectedBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const protectedOlder = driver.sendCommand(createSet(3), {
				...commandOptions,
				preventDeduplication: true,
			});
			const enabledNewer = driver.sendCommand(
				createSet(3),
				commandOptions,
			);
			control.release.resolve();
			await Promise.all([
				protectedBlocker,
				protectedOlder,
				enabledNewer,
			]);
			t.expect(control.setValues).toEqual([3]);

			blockNextGet();
			const protectedActiveCount = control.getCount;
			const protectedActive = driver.sendCommand(createGet(8), {
				...commandOptions,
				preventDeduplication: true,
			});
			await control.started;
			const enabledAttached = driver.sendCommand(
				createGet(8),
				commandOptions,
			);
			control.release.resolve();
			await Promise.all([protectedActive, enabledAttached]);
			t.expect(control.getCount).toBe(protectedActiveCount + 1);

			// Replace an enabled queued command with a protected command
			control.setValues = [];
			blockNextGet();
			const replacementBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const enabledOlder = driver.sendCommand(
				createSet(4),
				commandOptions,
			);
			const protectedNewer = driver.sendCommand(createSet(4), {
				...commandOptions,
				preventDeduplication: true,
			});
			control.release.resolve();
			await Promise.all([
				replacementBlocker,
				enabledOlder,
				protectedNewer,
			]);
			t.expect(control.setValues).toEqual([4]);

			// Preserve the higher priority during protected replacement
			control.setValues = [];
			blockNextGet();
			const priorityReplacementBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const highPriorityOlder = driver.sendCommand(createSet(13), {
				...commandOptions,
				priority: MessagePriority.Controller,
			});
			const unrelatedAfterReplacement = driver.sendCommand(
				new BasicCCSet({ nodeId: 2, targetValue: 14 }),
				{
					...commandOptions,
					priority: MessagePriority.Normal,
				},
			);
			const lowPriorityProtected = driver.sendCommand(createSet(13), {
				...commandOptions,
				preventDeduplication: true,
				priority: MessagePriority.Poll,
			});
			t.expect(
				driver["queue"].transactions.find(
					(transaction) => transaction.preventDeduplication,
				)?.priority,
			).toBe(MessagePriority.Controller);
			control.release.resolve();
			await Promise.all([
				priorityReplacementBlocker,
				highPriorityOlder,
				unrelatedAfterReplacement,
				lowPriorityProtected,
			]);
			t.expect(control.setValues).toEqual([13, 14]);

			// Transmit protected commands that match active or protected commands
			blockNextGet();
			const protectedInFlightCount = control.getCount;
			const enabledInFlight = driver.sendCommand(
				createGet(6),
				commandOptions,
			);
			await control.started;
			const protectedQueued = driver.sendCommand(createGet(6), {
				...commandOptions,
				preventDeduplication: true,
			});
			control.release.resolve();
			await Promise.all([enabledInFlight, protectedQueued]);
			t.expect(control.getCount).toBe(protectedInFlightCount + 2);

			blockNextGet();
			const protectedPairCount = control.getCount;
			const firstProtected = driver.sendCommand(createGet(7), {
				...commandOptions,
				preventDeduplication: true,
			});
			await control.started;
			const secondProtected = driver.sendCommand(createGet(7), {
				...commandOptions,
				preventDeduplication: true,
			});
			control.release.resolve();
			await Promise.all([firstProtected, secondProtected]);
			t.expect(control.getCount).toBe(protectedPairCount + 2);

			// Keep supervised status streams on separate physical sessions
			blockNextGet();
			const supervisedCount = control.supervisedSetCount;
			const supervisedBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const supervisedOptions = {
				autoEncapsulate: false,
				maxSendAttempts: 1,
				requestStatusUpdates: true,
				supportCheck: false,
				useSupervision: false,
			} as const;
			const supervisedFirst = driver.sendCommand(
				SupervisionCC.encapsulate(createSet(15), 1, true),
				supervisedOptions,
			);
			const supervisedSecond = driver.sendCommand(
				SupervisionCC.encapsulate(createSet(15), 2, true),
				supervisedOptions,
			);
			control.release.resolve();
			await Promise.all([
				supervisedBlocker,
				supervisedFirst,
				supervisedSecond,
			]);
			t.expect(control.supervisedSetCount).toBe(supervisedCount + 2);

			// Apply superseding relations around protected commands
			control.setValues = [];
			blockNextGet();
			const protectedSupersedingBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const enabledSuperseded = driver.sendCommand(
				createSet(5),
				commandOptions,
			);
			const enabledSupersededResult = enabledSuperseded.catch(
				(error) => error,
			);
			const protectedSuperseding = driver.sendCommand(createSet(6), {
				...commandOptions,
				preventDeduplication: true,
			});
			t.expect(await enabledSupersededResult).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageSuperseded,
			});
			control.release.resolve();
			await Promise.all([
				protectedSupersedingBlocker,
				protectedSuperseding,
			]);
			t.expect(control.setValues).toEqual([6]);

			control.setValues = [];
			blockNextGet();
			const protectedOlderBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const protectedSuperseded = driver.sendCommand(createSet(7), {
				...commandOptions,
				preventDeduplication: true,
			});
			const enabledSuperseding = driver.sendCommand(
				createSet(8),
				commandOptions,
			);
			control.release.resolve();
			await Promise.all([
				protectedOlderBlocker,
				protectedSuperseded,
				enabledSuperseding,
			]);
			t.expect(control.setValues).toEqual([7, 8]);

			// Keep different relation contexts and default commands independent
			control.setValues = [];
			blockNextGet();
			const distinctBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const differentEndpoint = Promise.all([
				driver.sendCommand(createSet(9), commandOptions),
				driver.sendCommand(createSet(9, 1), commandOptions),
			]);
			control.release.resolve();
			await Promise.all([distinctBlocker, differentEndpoint]);
			t.expect(control.setValues).toEqual([9, 9]);
			await driver.waitForIdle(1000);

			blockNextGet();
			const flagsBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const differentFlagsFirst = createSet(11);
			const differentFlagsSecond = createSet(11);
			differentFlagsSecond.encapsulationFlags =
				EncapsulationFlags.Security;
			const differentFlags = Promise.all([
				driver.sendCommand(differentFlagsFirst, commandOptions),
				driver.sendCommand(differentFlagsSecond, commandOptions),
			]);
			control.release.resolve();
			await Promise.all([flagsBlocker, differentFlags]);
			t.expect(control.setValues).toEqual([9, 9, 11, 11]);
			await driver.waitForIdle(1000);

			blockNextGet();
			const concreteBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const concrete = Promise.all([
				driver.sendCommand(
					new BasicCCSet({ nodeId: 2, targetValue: 12 }),
					commandOptions,
				),
				driver.sendCommand(
					new BasicCCSet({ nodeId: 2, targetValue: 12 }),
					commandOptions,
				),
			]);
			control.release.resolve();
			await Promise.all([
				concreteBlocker,
				concrete,
			]);
			t.expect(control.setValues).toEqual([9, 9, 11, 11, 12]);

			// Exclude completed transactions from synchronous deduplication
			blockNextGet();
			const settledCount = control.getCount;
			let afterCompletion: Promise<unknown> | undefined;
			const completed = driver.sendCommand(createGet(20), {
				...commandOptions,
				onProgress: ({ state }) => {
					if (state === TransactionState.Completed) {
						afterCompletion = driver.sendCommand(
							createGet(20),
							commandOptions,
						);
					}
				},
			});
			await control.started;
			control.release.resolve();
			await completed;
			await afterCompletion;
			t.expect(control.getCount).toBe(settledCount + 2);

			// Exclude failed transactions before progress listeners retry
			control.setValues = [];
			blockNextGet();
			const failedRetryBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			let failedRetry: Promise<unknown> | undefined;
			const failedOriginal = driver.sendCommand(createSet(16), {
				...commandOptions,
				priority: MessagePriority.Poll,
				onProgress: ({ state }) => {
					if (state === TransactionState.Failed) {
						failedRetry = driver.sendCommand(createSet(16), {
							...commandOptions,
							priority: MessagePriority.Normal,
						});
					}
				},
			});
			const failedOriginalResult = failedOriginal.catch(
				(error) => error,
			);
			await driver.rejectTransactions(
				(transaction) => transaction.priority === MessagePriority.Poll,
				"rejected for retry test",
			);
			t.expect(await failedOriginalResult).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageDropped,
			});
			control.release.resolve();
			await Promise.all([failedRetryBlocker, failedRetry]);
			t.expect(control.setValues).toEqual([16]);

			// Preserve progress across delayed clone requeue
			control.setValues = [];
			blockNextGet();
			const delayedBlocker = driver.sendCommand(
				new BasicCCGet({ nodeId: 2 }),
				commandOptions,
			);
			await control.started;
			const delayedProgress: TransactionState[] = [];
			const delayed = driver.sendCommand(createSet(17), {
				...commandOptions,
				onProgress: ({ state }) => delayedProgress.push(state),
			});
			await driver.delayTransactionsForNode(2, 0.02);
			control.release.resolve();
			await Promise.all([delayedBlocker, delayed]);
			t.expect(control.setValues).toEqual([17]);
			t.expect(delayedProgress).toEqual([
				TransactionState.Queued,
				TransactionState.Active,
				TransactionState.Completed,
			]);
		},
	},
);
