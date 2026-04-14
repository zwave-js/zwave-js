import { type CommandClass } from "@zwave-js/cc";
import { LockCCGet, LockCCReport, LockCCSet } from "@zwave-js/cc/LockCC";
import { CommandClasses } from "@zwave-js/core";
import { type Timer, setTimer } from "@zwave-js/shared";
import type {
	LockCCCapabilities,
	MockController,
	MockNode,
	MockNodeBehavior,
} from "@zwave-js/testing";

const defaultCapabilities: Required<LockCCCapabilities> = {
	travelTime: 0,
};

const STATE_KEY_PREFIX = "Lock_";
const StateKeys = {
	locked: `${STATE_KEY_PREFIX}locked`,
	transition: `${STATE_KEY_PREFIX}transition`,
} as const;

interface LockTransition {
	targetLocked: boolean;
	timer: Timer;
	supervised: boolean;
}

/** Stops any running transition and snaps state to the target. */
function stopCurrentTransition(
	self: MockNode,
): { wasSupervised: boolean } | undefined {
	const existing = self.state.get(
		StateKeys.transition,
	) as LockTransition | undefined;
	if (existing) {
		existing.timer.clear();
		self.state.set(StateKeys.locked, existing.targetLocked);
		self.state.delete(StateKeys.transition);
		return { wasSupervised: existing.supervised };
	}
}

/**
 * Stops any existing transition, then starts a new one.
 * Returns the transition duration in milliseconds (0 = instant).
 */
function beginTransition(
	controller: MockController,
	self: MockNode,
	receivedCC: CommandClass,
	targetLocked: boolean,
	travelTime: number,
	supervised: boolean,
	onCompleteSupervised?: () => Promise<void>,
): number {
	stopCurrentTransition(self);

	const currentLocked = (
		self.state.get(StateKeys.locked) ?? false
	) as boolean;

	if (currentLocked === targetLocked || travelTime === 0) {
		self.state.set(StateKeys.locked, targetLocked);
		return 0;
	}

	const timer = setTimer(async () => {
		self.state.set(StateKeys.locked, targetLocked);
		self.state.delete(StateKeys.transition);

		if (supervised) {
			await onCompleteSupervised?.();
			return;
		}

		const cc = new LockCCReport({
			nodeId: controller.ownNodeId,
			locked: targetLocked,
		});
		await self.sendResponse(receivedCC, {
			action: "sendCC",
			cc,
		});
	}, travelTime).unref();

	const transition: LockTransition = {
		targetLocked,
		timer,
		supervised,
	};
	self.state.set(StateKeys.transition, transition);
	return travelTime;
}

const respondToLockGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof LockCCGet) {
			const locked = (
				self.state.get(StateKeys.locked) ?? false
			) as boolean;

			const cc = new LockCCReport({
				nodeId: controller.ownNodeId,
				locked,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToLockSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof LockCCSet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses.Lock,
					receivedCC.endpointIndex,
				),
			};
			const supervised = receivedCC.isEncapsulatedWith(
				CommandClasses.Supervision,
			);
			const durationMs = beginTransition(
				controller,
				self,
				receivedCC,
				receivedCC.locked,
				capabilities.travelTime,
				supervised,
				async () =>
					self.sendResponse(receivedCC, {
						action: "ok",
					}),
			);
			return {
				action: "ok",
				durationMs,
			};
		}
	},
};

export const LockCCBehaviors = [
	respondToLockGet,
	respondToLockSet,
];
