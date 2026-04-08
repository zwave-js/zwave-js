import {
	UserCredentialCredentialReportType,
	UserCredentialLearnStatus,
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
	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;

	// Trust the reportType from the device
	switch (report.reportType) {
		case UserCredentialUserReportType.UserAdded:
			node.emit("user added", endpoint, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserModified:
			node.emit("user modified", endpoint, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserDeleted:
			node.emit("user deleted", endpoint, {
				userId: report.userId,
			});
			break;
	}
}

export function handleUserCredentialCredentialReport(
	node: ZWaveNode,
	report: UserCredentialCCCredentialReport,
): void {
	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;

	// Trust the reportType from the device
	switch (report.reportType) {
		case UserCredentialCredentialReportType.CredentialAdded:
			node.emit("credential added", endpoint, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: report.credentialData ?? undefined,
			});
			break;
		case UserCredentialCredentialReportType.CredentialModified:
			node.emit("credential modified", endpoint, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: report.credentialData ?? undefined,
			});
			break;
		case UserCredentialCredentialReportType.CredentialDeleted:
			node.emit("credential deleted", endpoint, {
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
	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;

	if (report.stepsRemaining > 0) {
		node.emit("credential learn progress", endpoint, {
			userId: report.userId,
			credentialType: report.credentialType,
			credentialSlot: report.credentialSlot,
			stepsRemaining: report.stepsRemaining,
			status: report.learnStatus,
		});
	} else {
		node.emit("credential learn completed", endpoint, {
			userId: report.userId,
			credentialType: report.credentialType,
			credentialSlot: report.credentialSlot,
			status: report.learnStatus,
			success: report.learnStatus === UserCredentialLearnStatus.Success,
		});
	}
}
