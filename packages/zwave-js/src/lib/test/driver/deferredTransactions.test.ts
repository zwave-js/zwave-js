import {
	BasicCCGet,
	BasicCCSet,
	type CommandClass,
	CommandRelation,
} from "@zwave-js/cc";
import { TransactionState, ZWaveErrorCodes } from "@zwave-js/core";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { RemoveNodeReason } from "../../controller/Inclusion.js";
import { integrationTest } from "../integrationTestSuite.js";

class RelatedBasicCCGet extends BasicCCGet {
	protected override determineRelation(other: CommandClass): CommandRelation {
		return other instanceof RelatedBasicCCGet
			? CommandRelation.Redundant
			: CommandRelation.Unrelated;
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

function createGet(): RelatedBasicCCGet {
	return new RelatedBasicCCGet({ nodeId: 2 });
}

const commandOptions = {
	autoEncapsulate: false,
	maxSendAttempts: 1,
	supportCheck: false,
	useSupervision: false,
} as const;

const testOptions = {
	nodeCapabilities: {
		commandClasses: [],
	},
	additionalDriverOptions: {
		testingHooks: {
			skipNodeInterview: true,
		},
	},
};

integrationTest.sequential(
	"Driver destruction rejects deferred transaction attachments",
	{
		...testOptions,
		testBody: async (t, driver) => {
			driver["pauseSendQueue"]();
			const bothQueued = createDeferredPromise<void>();
			const firstProgress: TransactionState[] = [];
			const secondProgress: TransactionState[] = [];
			const trackQueued =
				(progress: TransactionState[]) =>
				({ state }: { state: TransactionState }) => {
					progress.push(state);
					if (
						state === TransactionState.Queued
						&& firstProgress.length > 0
						&& secondProgress.length > 0
					) {
						bothQueued.resolve();
					}
				};
			const first = driver.sendCommand(createGet(), {
				...commandOptions,
				onProgress: trackQueued(firstProgress),
			});
			const second = driver.sendCommand(createGet(), {
				...commandOptions,
				onProgress: trackQueued(secondProgress),
			});
			const firstResult = first.catch((error) => error);
			const secondResult = second.catch((error) => error);
			await bothQueued;
			await driver.delayTransactionsForNode(2, 3600);

			await driver.destroy();

			t.expect(await firstResult).toMatchObject({
				code: ZWaveErrorCodes.Driver_Destroyed,
			});
			t.expect(await secondResult).toMatchObject({
				code: ZWaveErrorCodes.Driver_Destroyed,
			});
			t.expect(firstProgress).toEqual([
				TransactionState.Queued,
				TransactionState.Failed,
			]);
			t.expect(secondProgress).toEqual([
				TransactionState.Queued,
				TransactionState.Failed,
			]);
		},
	},
);

integrationTest.sequential(
	"Node removal rejects deferred transactions",
	{
		...testOptions,
		testBody: async (t, driver, node) => {
			driver["pauseSendQueue"]();
			const queued = createDeferredPromise<void>();
			const command = driver.sendCommand(createGet(), {
				...commandOptions,
				onProgress: ({ state }) => {
					if (state === TransactionState.Queued) queued.resolve();
				},
			});
			const result = command.catch((error) => error);
			await queued;
			await driver.delayTransactionsForNode(2, 3600);

			driver["onNodeRemoved"](node, RemoveNodeReason.Excluded);

			t.expect(await result).toMatchObject({
				code: ZWaveErrorCodes.Controller_NodeRemoved,
			});
		},
	},
);

integrationTest.sequential(
	"Superseding commands reject deferred transactions",
	{
		...testOptions,
		testBody: async (t, driver) => {
			driver["pauseSendQueue"]();
			const queued = createDeferredPromise<void>();
			const older = driver.sendCommand(
				new RelatedBasicCCSet({ nodeId: 2, targetValue: 1 }),
				{
					...commandOptions,
					onProgress: ({ state }) => {
						if (state === TransactionState.Queued) queued.resolve();
					},
				},
			);
			const olderResult = older.catch((error) => error);
			await queued;
			await driver.delayTransactionsForNode(2, 3600);

			const newer = driver.sendCommand(
				new RelatedBasicCCSet({ nodeId: 2, targetValue: 2 }),
				commandOptions,
			);
			// The newer command stays queued until teardown
			newer.catch(() => {});

			t.expect(await olderResult).toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageSuperseded,
			});
			// The emptied batch must free its requeue timer
			t.expect(driver["requeueTimers"].size).toBe(0);
		},
	},
);
