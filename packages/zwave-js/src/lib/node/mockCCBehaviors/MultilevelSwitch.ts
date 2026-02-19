import { SwitchType } from "@zwave-js/cc";
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
	createMockZWaveRequestFrame,
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
	self: Parameters<NonNullable<MockNodeBehavior["handleCC"]>>[1],
): void {
	const existing = self.state.get(
		StateKeys.transition,
	) as MockTransition | undefined;
	if (existing) {
		const value = stopTransition(existing);
		self.state.set(StateKeys.currentValue, value);
		self.state.delete(StateKeys.transition);
	}
}

/**
 * Stops any existing transition, then starts a new one.
 * Manages all state reads/writes.
 */
function beginTransition(
	controller: MockController,
	self: MockNode,
	targetValue: number,
	travelTime: number,
	defaultValue: MaybeUnknown<number> | undefined,
): void {
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
		onComplete: async () => {
			self.state.set(StateKeys.currentValue, targetValue);
			self.state.delete(StateKeys.transition);

			const cc = new MultilevelSwitchCCReport({
				nodeId: controller.ownNodeId,
				currentValue: targetValue,
				targetValue,
				duration: new Duration(0, "seconds"),
			});
			await self.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
		},
	});

	if (transition) {
		self.state.set(StateKeys.transition, transition);
	} else {
		self.state.set(StateKeys.currentValue, targetValue);
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
			beginTransition(
				controller,
				self,
				receivedCC.targetValue,
				capabilities.travelTime,
				capabilities.defaultValue,
			);
			return { action: "ok" };
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
			beginTransition(
				controller,
				self,
				targetValue,
				capabilities.travelTime,
				capabilities.defaultValue,
			);
			return { action: "ok" };
		}
	},
};

const respondToMultilevelSwitchStopLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof MultilevelSwitchCCStopLevelChange) {
			stopCurrentTransition(self);

			const currentValue = (
				self.state.get(StateKeys.currentValue) ?? 0
			) as number;

			// Send a delayed report with the final state
			setTimer(async () => {
				const cc = new MultilevelSwitchCCReport({
					nodeId: controller.ownNodeId,
					currentValue,
					targetValue: currentValue,
					duration: new Duration(0, "seconds"),
				});
				await self.sendToController(
					createMockZWaveRequestFrame(cc, {
						ackRequested: false,
					}),
				);
			}, 100).unref();

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
