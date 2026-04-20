import {
	UserCredentialCredentialReportType,
	UserCredentialLearnStatus,
	UserCredentialUserReportType,
} from "@zwave-js/cc";
import {
	type UserCredentialCCAssociationReport,
	type UserCredentialCCCredentialLearnReport,
	type UserCredentialCCCredentialReport,
	type UserCredentialCCUserReport,
	normalizeCredentialData,
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
		// The device rejected an Add because the slot was already occupied,
		// but reported the actual user data. Notify applications about the
		// previously-unknown user.
		case UserCredentialUserReportType.UserAddRejectedLocationOccupied:
			node.emit("user added", endpoint, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserModified:
			node.emit("user modified", endpoint, buildUserArgs(report));
			break;
		case UserCredentialUserReportType.UserDeleted:
		// The device rejected a Modify because the slot was empty, meaning
		// our cache was stale. Notify applications that the user is gone.
		case UserCredentialUserReportType.UserModifyRejectedLocationEmpty:
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

	const normalizedData = report.credentialData
		? normalizeCredentialData(report.credentialType, report.credentialData)
		: undefined;

	// Trust the reportType from the device
	switch (report.reportType) {
		case UserCredentialCredentialReportType.CredentialAdded:
			node.emit("credential added", endpoint, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: normalizedData,
			});
			break;
		case UserCredentialCredentialReportType.CredentialModified:
			node.emit("credential modified", endpoint, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
				data: normalizedData,
			});
			break;
		case UserCredentialCredentialReportType.CredentialDeleted:
		// The device rejected a Modify because the slot was empty, meaning
		// our cache was stale. Notify applications that the credential is gone.
		case UserCredentialCredentialReportType
			.CredentialModifyRejectedLocationEmpty:
			node.emit("credential deleted", endpoint, {
				userId: report.userId,
				credentialType: report.credentialType,
				credentialSlot: report.credentialSlot,
			});
			break;
		case UserCredentialCredentialReportType
			.CredentialAddRejectedLocationOccupied:
			// The device rejected an Add because the slot was already occupied.
			// When read-back is set, the report contains the actual credential
			// data — notify applications about the previously-unknown credential.
			if (report.credentialReadBack) {
				node.emit("credential added", endpoint, {
					userId: report.userId,
					credentialType: report.credentialType,
					credentialSlot: report.credentialSlot,
					data: normalizedData,
				});
			}
			break;
	}
}

export function handleUserCredentialAssociationReport(
	node: ZWaveNode,
	report: UserCredentialCCAssociationReport,
): void {
	// A successful association is semantically a modification of the credential's
	// owner. Applications can observe it via the existing "credential modified"
	// event. Failure statuses are delivered to the initiating node via the
	// command response and do not fan out to listeners.
	if (report.status !== 0) return;
	const endpoint = node.getEndpoint(report.endpointIndex) ?? node;
	node.emit("credential modified", endpoint, {
		userId: report.destinationUserId,
		credentialType: report.credentialType,
		credentialSlot: report.credentialSlot,
	});
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
