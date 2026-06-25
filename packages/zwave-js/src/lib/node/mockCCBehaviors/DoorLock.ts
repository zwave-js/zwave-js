import {
	type CommandClass,
	DoorLockMode,
	DoorLockOperationType,
} from "@zwave-js/cc";
import {
	DoorLockCCCapabilitiesGet,
	DoorLockCCCapabilitiesReport,
	DoorLockCCConfigurationGet,
	DoorLockCCConfigurationReport,
	DoorLockCCConfigurationSet,
	DoorLockCCOperationGet,
	DoorLockCCOperationReport,
	DoorLockCCOperationSet,
} from "@zwave-js/cc/DoorLockCC";
import { CommandClasses, Duration } from "@zwave-js/core";
import { type Timer, setTimer } from "@zwave-js/shared";
import type {
	DoorLockCCCapabilities,
	MockController,
	MockNode,
	MockNodeBehavior,
} from "@zwave-js/testing";

const defaultCapabilities: Required<DoorLockCCCapabilities> = {
	supportedOperationTypes: [DoorLockOperationType.Constant],
	supportedDoorLockModes: [DoorLockMode.Unsecured, DoorLockMode.Secured],
	supportedOutsideHandles: [true, true, true, true],
	supportedInsideHandles: [true, true, true, true],
	doorSupported: true,
	boltSupported: true,
	latchSupported: true,
	blockToBlockSupported: false,
	twistAssistSupported: false,
	holdAndReleaseSupported: false,
	autoRelockSupported: false,
	travelTime: 0,
};

const STATE_KEY_PREFIX = "DoorLock_";
const StateKeys = {
	currentMode: `${STATE_KEY_PREFIX}currentMode`,
	transition: `${STATE_KEY_PREFIX}transition`,
	operationType: `${STATE_KEY_PREFIX}operationType`,
	outsideHandlesCanOpenDoorConfiguration:
		`${STATE_KEY_PREFIX}outsideHandlesCanOpenDoorConfiguration`,
	insideHandlesCanOpenDoorConfiguration:
		`${STATE_KEY_PREFIX}insideHandlesCanOpenDoorConfiguration`,
	lockTimeoutConfiguration: `${STATE_KEY_PREFIX}lockTimeoutConfiguration`,
	autoRelockTime: `${STATE_KEY_PREFIX}autoRelockTime`,
	holdAndReleaseTime: `${STATE_KEY_PREFIX}holdAndReleaseTime`,
	twistAssist: `${STATE_KEY_PREFIX}twistAssist`,
	blockToBlock: `${STATE_KEY_PREFIX}blockToBlock`,
} as const;

interface DoorLockTransition {
	targetMode: DoorLockMode;
	startTime: number;
	durationMs: number;
	timer: Timer;
	supervised: boolean;
}

function getTransitionRemainingDuration(
	transition: DoorLockTransition,
): Duration {
	const remaining = Math.max(
		0,
		transition.durationMs - (Date.now() - transition.startTime),
	);
	return new Duration(Math.ceil(remaining / 1000), "seconds");
}

/** Stops any running transition and snaps state to the target. */
function stopCurrentTransition(
	self: MockNode,
): { wasSupervised: boolean } | undefined {
	const existing = self.state.get(
		StateKeys.transition,
	) as DoorLockTransition | undefined;
	if (existing) {
		existing.timer.clear();
		self.state.set(StateKeys.currentMode, existing.targetMode);
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
	targetMode: DoorLockMode,
	travelTime: number,
	supervised: boolean,
	onCompleteSupervised?: () => Promise<void>,
): number {
	stopCurrentTransition(self);

	const currentMode = (
		self.state.get(StateKeys.currentMode) ?? DoorLockMode.Unsecured
	) as DoorLockMode;

	if (currentMode === targetMode || travelTime === 0) {
		self.state.set(StateKeys.currentMode, targetMode);
		return 0;
	}

	const timer = setTimer(async () => {
		self.state.set(StateKeys.currentMode, targetMode);
		self.state.delete(StateKeys.transition);

		if (supervised) {
			await onCompleteSupervised?.();
			return;
		}

		const cc = new DoorLockCCOperationReport({
			nodeId: controller.ownNodeId,
			currentMode: targetMode,
			outsideHandlesCanOpenDoor: [true, true, true, true],
			insideHandlesCanOpenDoor: [true, true, true, true],
			targetMode,
			duration: new Duration(0, "seconds"),
		});
		await self.sendResponse(receivedCC, {
			action: "sendCC",
			cc,
		});
	}, travelTime).unref();

	const transition: DoorLockTransition = {
		targetMode,
		startTime: Date.now(),
		durationMs: travelTime,
		timer,
		supervised,
	};
	self.state.set(StateKeys.transition, transition);
	return travelTime;
}

const respondToDoorLockCapabilitiesGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof DoorLockCCCapabilitiesGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Door Lock"],
					receivedCC.endpointIndex,
				),
			};
			const cc = new DoorLockCCCapabilitiesReport({
				nodeId: controller.ownNodeId,
				supportedOperationTypes: capabilities.supportedOperationTypes,
				supportedDoorLockModes: capabilities.supportedDoorLockModes,
				supportedOutsideHandles: capabilities.supportedOutsideHandles,
				supportedInsideHandles: capabilities.supportedInsideHandles,
				doorSupported: capabilities.doorSupported,
				boltSupported: capabilities.boltSupported,
				latchSupported: capabilities.latchSupported,
				blockToBlockSupported: capabilities.blockToBlockSupported,
				twistAssistSupported: capabilities.twistAssistSupported,
				holdAndReleaseSupported: capabilities.holdAndReleaseSupported,
				autoRelockSupported: capabilities.autoRelockSupported,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToDoorLockOperationGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof DoorLockCCOperationGet) {
			const transition = self.state.get(
				StateKeys.transition,
			) as DoorLockTransition | undefined;

			let currentMode: DoorLockMode;
			let targetMode: DoorLockMode | undefined;
			let duration: Duration | undefined;

			if (transition) {
				// Lock is still moving - report the mode before the transition
				currentMode = (
					self.state.get(StateKeys.currentMode)
						?? DoorLockMode.Unsecured
				) as DoorLockMode;
				targetMode = transition.targetMode;
				duration = getTransitionRemainingDuration(transition);
			} else {
				currentMode = (
					self.state.get(StateKeys.currentMode)
						?? DoorLockMode.Unsecured
				) as DoorLockMode;
				targetMode = currentMode;
				duration = new Duration(0, "seconds");
			}

			const cc = new DoorLockCCOperationReport({
				nodeId: controller.ownNodeId,
				currentMode,
				outsideHandlesCanOpenDoor: [true, true, true, true],
				insideHandlesCanOpenDoor: [true, true, true, true],
				targetMode,
				duration,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToDoorLockOperationSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof DoorLockCCOperationSet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses["Door Lock"],
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
				receivedCC.mode,
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

const respondToDoorLockConfigurationGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof DoorLockCCConfigurationGet) {
			const operationType = (
				self.state.get(StateKeys.operationType)
					?? DoorLockOperationType.Constant
			) as DoorLockOperationType;
			const outsideHandlesCanOpenDoorConfiguration = (self.state.get(
				StateKeys.outsideHandlesCanOpenDoorConfiguration,
			) ?? [true, true, true, true]) as [
				boolean,
				boolean,
				boolean,
				boolean,
			];
			const insideHandlesCanOpenDoorConfiguration = (self.state.get(
				StateKeys.insideHandlesCanOpenDoorConfiguration,
			) ?? [true, true, true, true]) as [
				boolean,
				boolean,
				boolean,
				boolean,
			];
			const lockTimeoutConfiguration = self.state.get(
				StateKeys.lockTimeoutConfiguration,
			) as number | undefined;
			const autoRelockTime = self.state.get(
				StateKeys.autoRelockTime,
			) as number | undefined;
			const holdAndReleaseTime = self.state.get(
				StateKeys.holdAndReleaseTime,
			) as number | undefined;
			const twistAssist = self.state.get(
				StateKeys.twistAssist,
			) as boolean | undefined;
			const blockToBlock = self.state.get(
				StateKeys.blockToBlock,
			) as boolean | undefined;

			const cc = new DoorLockCCConfigurationReport({
				nodeId: controller.ownNodeId,
				operationType,
				outsideHandlesCanOpenDoorConfiguration,
				insideHandlesCanOpenDoorConfiguration,
				lockTimeoutConfiguration,
				autoRelockTime,
				holdAndReleaseTime,
				twistAssist,
				blockToBlock,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToDoorLockConfigurationSet: MockNodeBehavior = {
	handleCC(_controller, self, receivedCC) {
		if (receivedCC instanceof DoorLockCCConfigurationSet) {
			self.state.set(StateKeys.operationType, receivedCC.operationType);
			self.state.set(
				StateKeys.outsideHandlesCanOpenDoorConfiguration,
				receivedCC.outsideHandlesCanOpenDoorConfiguration,
			);
			self.state.set(
				StateKeys.insideHandlesCanOpenDoorConfiguration,
				receivedCC.insideHandlesCanOpenDoorConfiguration,
			);
			self.state.set(
				StateKeys.lockTimeoutConfiguration,
				receivedCC.lockTimeoutConfiguration,
			);
			self.state.set(
				StateKeys.autoRelockTime,
				receivedCC.autoRelockTime,
			);
			self.state.set(
				StateKeys.holdAndReleaseTime,
				receivedCC.holdAndReleaseTime,
			);
			self.state.set(StateKeys.twistAssist, receivedCC.twistAssist);
			self.state.set(StateKeys.blockToBlock, receivedCC.blockToBlock);
			return { action: "ok" };
		}
	},
};

export const DoorLockCCBehaviors = [
	respondToDoorLockCapabilitiesGet,
	respondToDoorLockOperationGet,
	respondToDoorLockOperationSet,
	respondToDoorLockConfigurationGet,
	respondToDoorLockConfigurationSet,
];
