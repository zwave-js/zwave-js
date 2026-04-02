import {
	UserCredentialCredentialReportType,
	UserCredentialUserReportType,
} from "@zwave-js/cc";
import {
	type UserCredentialCCCredentialLearnReport,
	type UserCredentialCCCredentialReport,
	type UserCredentialCCUserReport,
} from "@zwave-js/cc/UserCredentialCC";
import type { ZWaveNode } from "../Node.js";

function buildUserArgs(report: UserCredentialCCUserReport) {
	return {
		userId: report.userId,
		active: report.active,
		userType: report.userType,
		userName: report.userName || undefined,
		credentialRule: report.credentialRule,
		expiringTimeoutMinutes: report.expiringTimeoutMinutes || undefined,
	};
}

export function handleUserCredentialUserReport(
	node: ZWaveNode,
	report: UserCredentialCCUserReport,
): void {
	// Trust the reportType from the device
	switch (report.reportType) {
		case UserCredentialUserReportType.UserAdded:
			node.emit("user added", node, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserModified:
			node.emit("user modified", node, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserDeleted:
			node.emit("user deleted", node, {
				userId: report.userId,
			});
			break;
	}
}

export function handleUserCredentialCredentialReport(
	node: ZWaveNode,
	report: UserCredentialCCCredentialReport,
): void {
	// Trust the reportType from the device
	switch (report.reportType) {
		case UserCredentialCredentialReportType.CredentialAdded:
			node.emit("credential added", node, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: report.credentialData ?? undefined,
			});
			break;
		case UserCredentialCredentialReportType.CredentialModified:
			node.emit("credential modified", node, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: report.credentialData ?? undefined,
			});
			break;
		case UserCredentialCredentialReportType.CredentialDeleted:
			node.emit("credential deleted", node, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
			});
			break;
	}
}

export function handleUserCredentialCredentialLearnReport(
	node: ZWaveNode,
	report: UserCredentialCCCredentialLearnReport,
): void {
	if (report.stepsRemaining > 0) {
		node.emit("credential learn progress", node, {
			userId: report.userId,
			credentialType: report.credentialType,
			credentialSlot: report.credentialSlot,
			stepsRemaining: report.stepsRemaining,
			// learnStatus encodes the total step count for in-progress reports
			stepCount: report.learnStatus,
		});
	} else {
		node.emit("credential learn completed", node, {
			userId: report.userId,
			credentialType: report.credentialType,
			credentialSlot: report.credentialSlot,
			// learnStatus 0 = success
			success: report.learnStatus === 0,
		});
	}
}
