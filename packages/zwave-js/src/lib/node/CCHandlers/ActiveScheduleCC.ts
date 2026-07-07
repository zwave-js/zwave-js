import { ActiveScheduleReportReason } from "@zwave-js/cc";
import type {
	ActiveScheduleCCDailyRepeatingScheduleReport,
	ActiveScheduleCCEnableReport,
	ActiveScheduleCCYearDayScheduleReport,
} from "@zwave-js/cc/ActiveScheduleCC";
import { CommandClasses } from "@zwave-js/core";
import type { ZWaveNode } from "../Node.js";
import {
	ScheduleKind,
	type ScheduleTarget,
	ScheduleTargetType,
} from "../feature-apis/Scheduling.js";

// Reports with reason "Modified (Z-Wave)" are triggered by our own writes,
// for which the scheduling feature API emits the events with full context.
// Only external modifications need to be fanned out from here.

function reportTargetToScheduleTarget(
	targetCC: CommandClasses,
	targetId: number,
): ScheduleTarget | undefined {
	if (targetCC === CommandClasses["User Credential"]) {
		return { type: ScheduleTargetType.User, userId: targetId };
	}
}

export function handleActiveScheduleEnableReport(
	node: ZWaveNode,
	report: ActiveScheduleCCEnableReport,
): void {
	if (report.reportReason !== ActiveScheduleReportReason.ModifiedExternal) {
		return;
	}
	const target = reportTargetToScheduleTarget(
		report.targetCC,
		report.targetId,
	);
	if (!target) return;

	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;
	node.emit("schedule enabled changed", endpoint, {
		target,
		enabled: report.enabled,
	});
}

export function handleActiveScheduleYearDayScheduleReport(
	node: ZWaveNode,
	report: ActiveScheduleCCYearDayScheduleReport,
): void {
	if (report.reportReason !== ActiveScheduleReportReason.ModifiedExternal) {
		return;
	}
	const target = reportTargetToScheduleTarget(
		report.targetCC,
		report.targetId,
	);
	if (!target) return;

	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;
	if (report.startDate != undefined) {
		// The report does not indicate whether the slot was empty before
		node.emit("schedule modified", endpoint, {
			target,
			slot: report.slotId,
			kind: ScheduleKind.YearDay,
			startDate: report.startDate,
			stopDate: report.stopDate!,
		});
	} else {
		node.emit("schedule deleted", endpoint, {
			target,
			kind: ScheduleKind.YearDay,
			slot: report.slotId,
		});
	}
}

export function handleActiveScheduleDailyRepeatingScheduleReport(
	node: ZWaveNode,
	report: ActiveScheduleCCDailyRepeatingScheduleReport,
): void {
	if (report.reportReason !== ActiveScheduleReportReason.ModifiedExternal) {
		return;
	}
	const target = reportTargetToScheduleTarget(
		report.targetCC,
		report.targetId,
	);
	if (!target) return;

	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;
	if (report.weekdays != undefined && report.weekdays.length > 0) {
		// The report does not indicate whether the slot was empty before
		node.emit("schedule modified", endpoint, {
			target,
			slot: report.slotId,
			kind: ScheduleKind.DailyRepeating,
			weekdays: report.weekdays,
			timespan: report.timespan!,
		});
	} else {
		node.emit("schedule deleted", endpoint, {
			target,
			kind: ScheduleKind.DailyRepeating,
			slot: report.slotId,
		});
	}
}
