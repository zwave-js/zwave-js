import { type CommandClass } from "@zwave-js/cc";
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
	type MockController,
	type MockNode,
	type MockNodeBehavior,
	type WindowCoveringCCCapabilities,
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
	self: MockNode,
	param: number,
): { wasSupervised: boolean } | undefined {
	const existing = self.state.get(
		transitionKey(param),
	) as MockTransition | undefined;
	if (existing) {
		const value = stopTransition(existing);
		self.state.set(currentValueKey(param), value);
		self.state.delete(transitionKey(param));
		return { wasSupervised: existing.supervised };
	}
}

/**
 * Stops any existing transition for a parameter, then starts a new one.
 * Manages all state reads/writes.
 */
function beginTransition(
	controller: MockController,
	self: MockNode,
	receivedCC: CommandClass,
	param: number,
	targetValue: number,
	travelTime: number,
	supervised: boolean,
	onCompleteSupervised?: () => Promise<void>,
	onAbortSupervised?: () => Promise<void>,
): number {
	stopParameterTransition(self, param);

	const currentValue =
		(self.state.get(currentValueKey(param)) as number | undefined) ?? 0;

	const transition = startTransition({
		currentValue,
		targetValue,
		duration: travelTime,
		supervised,
		onComplete: async () => {
			self.state.set(currentValueKey(param), targetValue);
			self.state.delete(transitionKey(param));

			if (supervised) {
				await onCompleteSupervised?.();
				return;
			}

			const cc = new WindowCoveringCCReport({
				nodeId: controller.ownNodeId,
				parameter: param,
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
			await onAbortSupervised?.();
		},
	});

	if (transition) {
		self.state.set(transitionKey(param), transition);
		return transition.durationMs;
	} else {
		self.state.set(currentValueKey(param), targetValue);
		return 0;
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
			const supervised = receivedCC.isEncapsulatedWith(
				CommandClasses.Supervision,
			);
			const supervisedState = supervised
				? {
					activeParams: new Set<number>(),
					finished: false,
				}
				: undefined;
			let durationMs = 0;
			for (const { parameter, value } of receivedCC.targetValues) {
				const completeSupervised = async (): Promise<void> => {
					if (!supervisedState || supervisedState.finished) return;
					supervisedState.finished = true;
					await self.sendResponse(receivedCC, {
						action: "ok",
					});
				};
				const abortSupervised = async (): Promise<void> => {
					if (!supervisedState || supervisedState.finished) return;
					supervisedState.finished = true;
					supervisedState.activeParams.delete(parameter);
					for (const otherParam of supervisedState.activeParams) {
						stopParameterTransition(self, otherParam);
					}
					supervisedState.activeParams.clear();
					await self.sendResponse(receivedCC, {
						action: "fail",
					});
				};
				const transitionDurationMs = beginTransition(
					controller,
					self,
					receivedCC,
					parameter,
					value,
					capabilities.travelTime,
					supervised,
					completeSupervised,
					abortSupervised,
				);
				durationMs = Math.max(
					durationMs,
					transitionDurationMs,
				);
				if (transitionDurationMs > 0 && supervisedState) {
					supervisedState.activeParams.add(parameter);
				}
			}
			return {
				action: "ok",
				durationMs,
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
			const supervised = receivedCC.isEncapsulatedWith(
				CommandClasses.Supervision,
			);
			const durationMs = beginTransition(
				controller,
				self,
				receivedCC,
				receivedCC.parameter,
				targetValue,
				capabilities.travelTime,
				supervised,
				async () =>
					self.sendResponse(receivedCC, {
						action: "ok",
					}),
				async () =>
					self.sendResponse(receivedCC, {
						action: "fail",
					}),
			);
			return {
				action: "ok",
				durationMs,
			};
		}
	},
};

const respondToWindowCoveringStopLevelChange: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof WindowCoveringCCStopLevelChange) {
			const param = receivedCC.parameter;
			const stoppedTransition = stopParameterTransition(self, param);

			const currentValue = (
				self.state.get(currentValueKey(param)) ?? 0
			) as number;

			if (!stoppedTransition?.wasSupervised) {
				// Send a delayed report with the final state
				setTimer(async () => {
					const cc = new WindowCoveringCCReport({
						nodeId: controller.ownNodeId,
						parameter: param,
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

export const WindowCoveringCCBehaviors = [
	respondToWindowCoveringSupportedGet,
	respondToWindowCoveringGet,
	respondToWindowCoveringSet,
	respondToWindowCoveringStartLevelChange,
	respondToWindowCoveringStopLevelChange,
];
