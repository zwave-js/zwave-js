import {
	WindowCoveringCCGet,
	WindowCoveringCCReport,
	WindowCoveringCCSet,
	WindowCoveringCCStartLevelChange,
	WindowCoveringCCStopLevelChange,
	WindowCoveringCCSupportedGet,
	WindowCoveringCCSupportedReport,
} from "@zwave-js/cc/WindowCoveringCC";
import { CommandClasses, Duration } from "@zwave-js/core";
import { setTimer } from "@zwave-js/shared";
import {
	type MockNodeBehavior,
	type WindowCoveringCCCapabilities,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import {
	type MockTransition,
	getTransitionCurrentValue,
	getTransitionRemainingDuration,
	startTransition,
	stopTransition,
} from "./MockTransition.js";

const defaultCapabilities: Required<WindowCoveringCCCapabilities> = {
	supportedParameters: [],
	travelTime: 5000,
};

const STATE_KEY_PREFIX = "WindowCovering_";
function currentValueKey(param: number): string {
	return `${STATE_KEY_PREFIX}currentValue_${param}`;
}
function transitionKey(param: number): string {
	return `${STATE_KEY_PREFIX}transition_${param}`;
}

/** Stops any running transition for the given parameter and snaps state. */
function stopParameterTransition(
	self: Parameters<NonNullable<MockNodeBehavior["handleCC"]>>[1],
	param: number,
): void {
	const existing = self.state.get(
		transitionKey(param),
	) as MockTransition | undefined;
	if (existing) {
		const value = stopTransition(existing);
		self.state.set(currentValueKey(param), value);
		self.state.delete(transitionKey(param));
	}
}

/**
 * Stops any existing transition for a parameter, then starts a new one.
 * Manages all state reads/writes.
 */
function beginTransition(
	controller: Parameters<NonNullable<MockNodeBehavior["handleCC"]>>[0],
	self: Parameters<NonNullable<MockNodeBehavior["handleCC"]>>[1],
	param: number,
	targetValue: number,
	travelTime: number,
): void {
	stopParameterTransition(self, param);

	const currentValue =
		(self.state.get(currentValueKey(param)) as number | undefined) ?? 0;

	const transition = startTransition({
		currentValue,
		targetValue,
		duration: travelTime,
		onComplete: async () => {
			self.state.set(currentValueKey(param), targetValue);
			self.state.delete(transitionKey(param));

			const cc = new WindowCoveringCCReport({
				nodeId: controller.ownNodeId,
				parameter: param,
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
		self.state.set(transitionKey(param), transition);
	} else {
		self.state.set(currentValueKey(param), targetValue);
	}
}

const respondToWindowCoveringSupportedGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCSupportedGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Window Covering"],
					receivedCC.endpointIndex,
				),
			};
			const cc = new WindowCoveringCCSupportedReport({
				nodeId: controller.ownNodeId,
				supportedParameters: capabilities.supportedParameters,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToWindowCoveringGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCGet) {
			const param = receivedCC.parameter;
			const transition = self.state.get(
				transitionKey(param),
			) as MockTransition | undefined;

			let currentValue: number;
			let targetValue: number;
			let duration: Duration;

			if (transition) {
				currentValue = getTransitionCurrentValue(transition);
				targetValue = transition.targetValue;
				duration = getTransitionRemainingDuration(transition);
			} else {
				currentValue = (self.state.get(currentValueKey(param)) as
					| number
					| undefined) ?? 0;
				targetValue = currentValue;
				duration = new Duration(0, "seconds");
			}

			const cc = new WindowCoveringCCReport({
				nodeId: controller.ownNodeId,
				parameter: param,
				currentValue,
				targetValue,
				duration,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToWindowCoveringSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCSet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Window Covering"],
					receivedCC.endpointIndex,
				),
			};
			for (const { parameter, value } of receivedCC.targetValues) {
				beginTransition(
					controller,
					self,
					parameter,
					value,
					capabilities.travelTime,
				);
			}
			return {
				action: "ok",
				durationMs: capabilities.travelTime,
			};
		}
	},
};

const respondToWindowCoveringStartLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCStartLevelChange) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Window Covering"],
					receivedCC.endpointIndex,
				),
			};
			const targetValue = receivedCC.direction === "up" ? 99 : 0;
			beginTransition(
				controller,
				self,
				receivedCC.parameter,
				targetValue,
				capabilities.travelTime,
			);
			return { action: "ok" };
		}
	},
};

const respondToWindowCoveringStopLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCStopLevelChange) {
			const param = receivedCC.parameter;
			stopParameterTransition(self, param);

			const currentValue = (self.state.get(currentValueKey(param)) as
				| number
				| undefined) ?? 0;

			// Send a delayed report with the final state
			setTimer(async () => {
				const cc = new WindowCoveringCCReport({
					nodeId: controller.ownNodeId,
					parameter: param,
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

export const WindowCoveringCCBehaviors = [
	respondToWindowCoveringSupportedGet,
	respondToWindowCoveringGet,
	respondToWindowCoveringSet,
	respondToWindowCoveringStartLevelChange,
	respondToWindowCoveringStopLevelChange,
];
