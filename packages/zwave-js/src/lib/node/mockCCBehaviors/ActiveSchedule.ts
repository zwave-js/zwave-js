import {
	type ActiveScheduleDailyRepeatingSchedule,
	ActiveScheduleReportReason,
	ActiveScheduleScheduleKind,
	ActiveScheduleSetAction,
	type ActiveScheduleYearDaySchedule,
} from "@zwave-js/cc";
import {
	ActiveScheduleCCCapabilitiesGet,
	ActiveScheduleCCCapabilitiesReport,
	ActiveScheduleCCDailyRepeatingScheduleGet,
	ActiveScheduleCCDailyRepeatingScheduleReport,
	ActiveScheduleCCDailyRepeatingScheduleSet,
	ActiveScheduleCCEnableGet,
	ActiveScheduleCCEnableReport,
	ActiveScheduleCCEnableSet,
	ActiveScheduleCCYearDayScheduleGet,
	ActiveScheduleCCYearDayScheduleReport,
	ActiveScheduleCCYearDayScheduleSet,
} from "@zwave-js/cc/ActiveScheduleCC";
import { CommandClasses } from "@zwave-js/core";
import type { AllOrNone } from "@zwave-js/shared";
import type {
	ActiveScheduleCCCapabilities,
	MockNode,
	MockNodeBehavior,
} from "@zwave-js/testing";

export const defaultCapabilities: ActiveScheduleCCCapabilities = {
	targets: new Map([
		[CommandClasses["Binary Switch"], {
			numSupportedTargets: 1,
			numYearDaySlotsPerTarget: 1,
			numDailyRepeatingSlotsPerTarget: 1,
		}],
	]),
};

const STATE_KEY_PREFIX = "ActiveSchedule_";
export const StateKeys = {
	enabled: (targetCC: number, targetId: number) =>
		`${STATE_KEY_PREFIX}enabled_${targetCC}_${targetId}`,
	schedule: (
		kind: ActiveScheduleScheduleKind,
		targetCC: number,
		targetId: number,
		slotId: number,
	) => `${STATE_KEY_PREFIX}schedule_${kind}_${targetCC}_${targetId}_${slotId}`,
} as const;

function getCapabilities(
	self: MockNode,
	endpointIndex: number,
): ActiveScheduleCCCapabilities {
	return {
		...defaultCapabilities,
		...self.getCCCapabilities(
			CommandClasses["Active Schedule"],
			endpointIndex,
		),
	};
}

function numSlotsPerTarget(
	capabilities: ActiveScheduleCCCapabilities,
	kind: ActiveScheduleScheduleKind,
	targetCC: number,
): number {
	const targetCaps = capabilities.targets.get(targetCC);
	if (!targetCaps) return 0;
	return kind === ActiveScheduleScheduleKind.YearDay
		? targetCaps.numYearDaySlotsPerTarget
		: targetCaps.numDailyRepeatingSlotsPerTarget;
}

function isValidTarget(
	capabilities: ActiveScheduleCCCapabilities,
	targetCC: number,
	targetId: number,
): boolean {
	const targetCaps = capabilities.targets.get(targetCC);
	if (!targetCaps) return false;
	return targetId >= 1 && targetId <= targetCaps.numSupportedTargets;
}

function getOccupiedSlots(
	self: MockNode,
	capabilities: ActiveScheduleCCCapabilities,
	kind: ActiveScheduleScheduleKind,
	targetCC: number,
	targetId: number,
): number[] {
	const numSlots = numSlotsPerTarget(capabilities, kind, targetCC);
	const ret: number[] = [];
	for (let slotId = 1; slotId <= numSlots; slotId++) {
		if (
			self.state.get(StateKeys.schedule(kind, targetCC, targetId, slotId))
				!= undefined
		) {
			ret.push(slotId);
		}
	}
	return ret;
}

function eraseSchedules(
	self: MockNode,
	capabilities: ActiveScheduleCCCapabilities,
	kind: ActiveScheduleScheduleKind,
	targetCC: number,
	targetId: number,
): void {
	// CC:00A4.01.06.11.007: A Schedule Slot ID value of zero during an Erase
	// Set Action signifies a batch erase operation.
	const affectedTargetCCs = targetCC === 0
		? [...capabilities.targets.keys()]
		: [targetCC];
	for (const cc of affectedTargetCCs) {
		const targetCaps = capabilities.targets.get(cc);
		if (!targetCaps) continue;
		const affectedTargetIds = targetId === 0
			? Array.from(
				{ length: targetCaps.numSupportedTargets },
				(_, i) => i + 1,
			)
			: [targetId];
		for (const id of affectedTargetIds) {
			const numSlots = numSlotsPerTarget(capabilities, kind, cc);
			for (let slotId = 1; slotId <= numSlots; slotId++) {
				self.state.delete(StateKeys.schedule(kind, cc, id, slotId));
			}
		}
	}
}

const respondToActiveScheduleCapabilitiesGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCCapabilitiesGet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			const cc = new ActiveScheduleCCCapabilitiesReport({
				nodeId: controller.ownNodeId,
				targetCapabilities: capabilities.targets,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToActiveScheduleEnableSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCEnableSet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			// CC:00A4.01.00.11.006: If a supporting node receives **any**
			// command from a controlling node with an invalid provided
			// **Target**, the command MUST be ignored unless otherwise
			// specified.
			if (
				!isValidTarget(
					capabilities,
					receivedCC.targetCC,
					receivedCC.targetId,
				)
			) {
				return { action: "fail" };
			}
			self.state.set(
				StateKeys.enabled(receivedCC.targetCC, receivedCC.targetId),
				receivedCC.enabled,
			);
			return { action: "ok" };
		}
	},
};

const respondToActiveScheduleEnableGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCEnableGet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			if (
				!isValidTarget(
					capabilities,
					receivedCC.targetCC,
					receivedCC.targetId,
				)
			) {
				return { action: "fail" };
			}
			const enabled = !!self.state.get(
				StateKeys.enabled(receivedCC.targetCC, receivedCC.targetId),
			);
			const cc = new ActiveScheduleCCEnableReport({
				nodeId: controller.ownNodeId,
				targetCC: receivedCC.targetCC,
				targetId: receivedCC.targetId,
				reportReason: ActiveScheduleReportReason.ResponseToGet,
				enabled,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToActiveScheduleYearDayScheduleSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCYearDayScheduleSet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			const kind = ActiveScheduleScheduleKind.YearDay;
			const { targetCC, targetId, slotId } = receivedCC;

			if (receivedCC.action === ActiveScheduleSetAction.Erase) {
				if (slotId === 0) {
					// Batch erase, target wildcards allowed
					if (
						targetCC !== 0
						&& targetId !== 0
						&& !isValidTarget(capabilities, targetCC, targetId)
					) {
						return { action: "fail" };
					}
					eraseSchedules(
						self,
						capabilities,
						kind,
						targetCC,
						targetId,
					);
					return { action: "ok" };
				}

				if (!isValidTarget(capabilities, targetCC, targetId)) {
					return { action: "fail" };
				}
				self.state.delete(
					StateKeys.schedule(kind, targetCC, targetId, slotId),
				);
				return { action: "ok" };
			}

			// Modify
			if (!isValidTarget(capabilities, targetCC, targetId)) {
				return { action: "fail" };
			}
			if (
				slotId < 1
				|| slotId > numSlotsPerTarget(capabilities, kind, targetCC)
			) {
				return { action: "fail" };
			}
			self.state.set(
				StateKeys.schedule(kind, targetCC, targetId, slotId),
				{
					startDate: receivedCC.startDate!,
					stopDate: receivedCC.stopDate!,
					metadata: receivedCC.metadata,
				} satisfies ActiveScheduleYearDaySchedule,
			);
			// CC:00A4.01.06.11.001: When set successfully, scheduling as
			// reported in the Active Schedule Enable Report Command MUST be
			// automatically enabled for the identified Target.
			self.state.set(StateKeys.enabled(targetCC, targetId), true);
			return { action: "ok" };
		}
	},
};

const respondToActiveScheduleYearDayScheduleGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCYearDayScheduleGet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			const kind = ActiveScheduleScheduleKind.YearDay;
			const { targetCC, targetId } = receivedCC;

			if (!isValidTarget(capabilities, targetCC, targetId)) {
				return { action: "fail" };
			}
			if (
				receivedCC.slotId
					> numSlotsPerTarget(capabilities, kind, targetCC)
			) {
				return { action: "fail" };
			}

			const occupiedSlots = getOccupiedSlots(
				self,
				capabilities,
				kind,
				targetCC,
				targetId,
			);
			// CC:00A4.01.07.11.004: A Schedule Slot ID of zero MUST signify to
			// the receiving node that the first occupied Schedule Slot for the
			// given Target is to be returned the report.
			const slotId = receivedCC.slotId === 0
				? (occupiedSlots[0] ?? 0)
				: receivedCC.slotId;
			const nextSlotId = occupiedSlots.find((s) => s > slotId) ?? 0;

			const schedule = (slotId === 0
				? {}
				: self.state.get(
					StateKeys.schedule(kind, targetCC, targetId, slotId),
				) ?? {}) as AllOrNone<ActiveScheduleYearDaySchedule>;

			const cc = new ActiveScheduleCCYearDayScheduleReport({
				nodeId: controller.ownNodeId,
				targetCC,
				targetId,
				slotId,
				nextSlotId,
				reportReason: ActiveScheduleReportReason.ResponseToGet,
				...schedule,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToActiveScheduleDailyRepeatingScheduleSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCDailyRepeatingScheduleSet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			const kind = ActiveScheduleScheduleKind.DailyRepeating;
			const { targetCC, targetId, slotId } = receivedCC;

			if (receivedCC.action === ActiveScheduleSetAction.Erase) {
				if (slotId === 0) {
					// Batch erase, target wildcards allowed
					if (
						targetCC !== 0
						&& targetId !== 0
						&& !isValidTarget(capabilities, targetCC, targetId)
					) {
						return { action: "fail" };
					}
					eraseSchedules(
						self,
						capabilities,
						kind,
						targetCC,
						targetId,
					);
					return { action: "ok" };
				}

				if (!isValidTarget(capabilities, targetCC, targetId)) {
					return { action: "fail" };
				}
				self.state.delete(
					StateKeys.schedule(kind, targetCC, targetId, slotId),
				);
				return { action: "ok" };
			}

			// Modify
			if (!isValidTarget(capabilities, targetCC, targetId)) {
				return { action: "fail" };
			}
			if (
				slotId < 1
				|| slotId > numSlotsPerTarget(capabilities, kind, targetCC)
			) {
				return { action: "fail" };
			}
			self.state.set(
				StateKeys.schedule(kind, targetCC, targetId, slotId),
				{
					weekdays: receivedCC.weekdays!,
					timespan: receivedCC.timespan!,
					metadata: receivedCC.metadata,
				} satisfies ActiveScheduleDailyRepeatingSchedule,
			);
			// CC:00A4.01.09.11.001: When set successfully, scheduling as
			// reported in the Active Schedule Enable Report Command MUST be
			// automatically enabled for the identified Target.
			self.state.set(StateKeys.enabled(targetCC, targetId), true);
			return { action: "ok" };
		}
	},
};

const respondToActiveScheduleDailyRepeatingScheduleGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ActiveScheduleCCDailyRepeatingScheduleGet) {
			const capabilities = getCapabilities(
				self,
				receivedCC.endpointIndex,
			);
			const kind = ActiveScheduleScheduleKind.DailyRepeating;
			const { targetCC, targetId } = receivedCC;

			if (!isValidTarget(capabilities, targetCC, targetId)) {
				return { action: "fail" };
			}
			if (
				receivedCC.slotId
					> numSlotsPerTarget(capabilities, kind, targetCC)
			) {
				return { action: "fail" };
			}

			const occupiedSlots = getOccupiedSlots(
				self,
				capabilities,
				kind,
				targetCC,
				targetId,
			);
			// CC:00A4.01.0A.11.004: A Schedule Slot ID of zero MUST signify to
			// the receiving node that the first occupied Schedule Slot for the
			// given Target is to be returned the report.
			const slotId = receivedCC.slotId === 0
				? (occupiedSlots[0] ?? 0)
				: receivedCC.slotId;
			const nextSlotId = occupiedSlots.find((s) => s > slotId) ?? 0;

			const schedule = (slotId === 0
				? {}
				: self.state.get(
					StateKeys.schedule(kind, targetCC, targetId, slotId),
				) ?? {}) as AllOrNone<ActiveScheduleDailyRepeatingSchedule>;

			const cc = new ActiveScheduleCCDailyRepeatingScheduleReport({
				nodeId: controller.ownNodeId,
				targetCC,
				targetId,
				slotId,
				nextSlotId,
				reportReason: ActiveScheduleReportReason.ResponseToGet,
				...schedule,
			});
			return { action: "sendCC", cc };
		}
	},
};

export const ActiveScheduleCCBehaviors = [
	respondToActiveScheduleCapabilitiesGet,
	respondToActiveScheduleEnableSet,
	respondToActiveScheduleEnableGet,
	respondToActiveScheduleYearDayScheduleSet,
	respondToActiveScheduleYearDayScheduleGet,
	respondToActiveScheduleDailyRepeatingScheduleSet,
	respondToActiveScheduleDailyRepeatingScheduleGet,
];
