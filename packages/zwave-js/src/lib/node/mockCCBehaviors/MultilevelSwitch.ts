import { type CommandClass, SwitchType } from "@zwave-js/cc";
import {
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCStartLevelChange,
	MultilevelSwitchCCStopLevelChange,
	MultilevelSwitchCCSupportedGet,
	MultilevelSwitchCCSupportedReport,
} from "@zwave-js/cc/MultilevelSwitchCC";
import {
	CommandClasses,
	Duration,
	type MaybeUnknown,
	UNKNOWN_STATE,
} from "@zwave-js/core";
import { setTimer } from "@zwave-js/shared";
import {
	type MockController,
	type MockNode,
	type MockNodeBehavior,
	type MultilevelSwitchCCCapabilities,
} from "@zwave-js/testing";
import {
	type MockTransition,
	getTransitionCurrentValue,
	getTransitionRemainingDuration,
	startTransition,
	stopTransition,
} from "./MockTransition.js";

const defaultCapabilities: Required<MultilevelSwitchCCCapabilities> = {
	defaultValue: 0,
	primarySwitchType: SwitchType["Down/Up"],
	travelTime: 0,
};

const STATE_KEY_PREFIX = "MultilevelSwitch_";
const StateKeys = {
	currentValue: `${STATE_KEY_PREFIX}currentValue`,
	transition: `${STATE_KEY_PREFIX}transition`,
} as const;

/** Stops any running transition and snaps state. */
function stopCurrentTransition(
	self: MockNode,
): { wasSupervised: boolean } | undefined {
	const existing = self.state.get(
		StateKeys.transition,
	) as MockTransition | undefined;
	if (existing) {
		const value = stopTransition(existing);
		self.state.set(StateKeys.currentValue, value);
		self.state.delete(StateKeys.transition);
		return { wasSupervised: existing.supervised };
	}
}

/**
 * Stops any existing transition, then starts a new one.
 * Manages all state reads/writes.
 */
function beginTransition(
	controller: MockController,
	self: MockNode,
	receivedCC: CommandClass,
	targetValue: number,
	travelTime: number,
	defaultValue: MaybeUnknown<number> | undefined,
	supervised: boolean,
): number {
	stopCurrentTransition(self);

	const currentValue = (
		self.state.get(StateKeys.currentValue)
			?? defaultValue
			?? 0
	) as number;

	const transition = startTransition({
		currentValue,
		targetValue,
		duration: travelTime,
		supervised,
		onComplete: async () => {
			self.state.set(StateKeys.currentValue, targetValue);
			self.state.delete(StateKeys.transition);

			if (supervised) {
				await self.sendResponse(receivedCC, {
					action: "ok",
				});
				return;
			}

			const cc = new MultilevelSwitchCCReport({
				nodeId: controller.ownNodeId,
				currentValue: targetValue,
				targetValue,
				duration: new Duration(0, "seconds"),
			});
			await self.sendResponse(receivedCC, {
				action: "sendCC",
				cc,
			});
		},
		onAbort: async () => {
			if (!supervised) return;
			await self.sendResponse(receivedCC, {
				action: "fail",
			});
		},
	});

	if (transition) {
		self.state.set(StateKeys.transition, transition);
		return transition.durationMs;
	} else {
		self.state.set(StateKeys.currentValue, targetValue);
		return 0;
	}
}

const respondToMultilevelSwitchGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Multilevel Switch"],
					receivedCC.endpointIndex,
				),
			};
			const transition = self.state.get(
				StateKeys.transition,
			) as MockTransition | undefined;

			let currentValue: MaybeUnknown<number>;
			let targetValue: MaybeUnknown<number>;
			let duration: Duration | undefined;

			if (transition) {
				currentValue = getTransitionCurrentValue(transition);
				targetValue = transition.targetValue;
				duration = getTransitionRemainingDuration(transition);
			} else {
				currentValue = (
					self.state.get(StateKeys.currentValue)
						?? capabilities.defaultValue
						?? UNKNOWN_STATE
				) as MaybeUnknown<number>;
				targetValue = currentValue;
				duration = new Duration(0, "seconds");
			}

			const cc = new MultilevelSwitchCCReport({
				nodeId: controller.ownNodeId,
				currentValue,
				targetValue,
				duration,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToMultilevelSwitchSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCSet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Multilevel Switch"],
					receivedCC.endpointIndex,
				),
			};
			const durationMs = beginTransition(
				controller,
				self,
				receivedCC,
				receivedCC.targetValue,
				capabilities.travelTime,
				capabilities.defaultValue,
				receivedCC.isEncapsulatedWith(CommandClasses.Supervision),
			);
			return {
				action: "ok",
				durationMs,
			};
		}
	},
};

const respondToMultilevelSwitchSupportedGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCSupportedGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Multilevel Switch"],
					receivedCC.endpointIndex,
				),
			};
			const cc = new MultilevelSwitchCCSupportedReport({
				nodeId: controller.ownNodeId,
				switchType: capabilities.primarySwitchType,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToMultilevelSwitchStartLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCStartLevelChange) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Multilevel Switch"],
					receivedCC.endpointIndex,
				),
			};
			const targetValue = receivedCC.direction === "up" ? 99 : 0;
			const durationMs = beginTransition(
				controller,
				self,
				receivedCC,
				targetValue,
				capabilities.travelTime,
				capabilities.defaultValue,
				receivedCC.isEncapsulatedWith(CommandClasses.Supervision),
			);
			return {
				action: "ok",
				durationMs,
			};
		}
	},
};

const respondToMultilevelSwitchStopLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCStopLevelChange) {
			const stoppedTransition = stopCurrentTransition(self);
			const currentValue = (
				self.state.get(StateKeys.currentValue) ?? 0
			) as number;

			if (!stoppedTransition?.wasSupervised) {
				// Send a delayed report with the final state
				setTimer(async () => {
					const cc = new MultilevelSwitchCCReport({
						nodeId: controller.ownNodeId,
						currentValue,
						targetValue: currentValue,
						duration: new Duration(0, "seconds"),
					});
					await self.sendResponse(receivedCC, {
						action: "sendCC",
						cc,
					});
				}, 100).unref();
			}

			return { action: "ok" };
		}
	},
};

export const MultilevelSwitchCCBehaviors = [
	respondToMultilevelSwitchGet,
	respondToMultilevelSwitchSet,
	respondToMultilevelSwitchSupportedGet,
	respondToMultilevelSwitchStartLevelChange,
	respondToMultilevelSwitchStopLevelChange,
];
