import { type UserIDStatus } from "@zwave-js/cc";
import {
	UserCodeCC,
	type UserCodeCCAdminCodeReport,
	type UserCodeCCExtendedUserCodeReport,
	type UserCodeCCReport,
	persistAdminCodeReport,
	persistExtendedUserCodeReport,
	persistUserCodeReport,
} from "@zwave-js/cc/UserCodeCC";
import type {
	EndpointId,
	GetSupportedCCVersion,
	GetValueDB,
} from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";
import type { ZWaveNode } from "../Node.js";
import {
	getUserCodeCredentialType,
	mapUserCodeStatusToUserData,
} from "../feature-apis/AccessControl.js";

function codeEquals(
	a: string | BytesView | undefined,
	b: string | BytesView | undefined,
): boolean {
	if (a == undefined || b == undefined) return a === b;
	if (typeof a === "string" && typeof b === "string") return a === b;
	const toBytes = (v: string | BytesView) =>
		typeof v === "string" ? Bytes.from(v, "ascii") : Bytes.view(v);
	return toBytes(a).equals(toBytes(b));
}

function nodeEndpointId(node: ZWaveNode, endpointIndex: number): EndpointId {
	return {
		nodeId: node.id,
		index: endpointIndex,
		virtual: false,
	};
}

// User Code CC reports are snapshots of a slot's state, so the kind of
// change is determined by diffing against the previously cached state
function emitUserCodeChangeEvents(
	ctx: GetValueDB,
	node: ZWaveNode,
	endpointIndex: number,
	userId: number,
	prevStatus: UserIDStatus | undefined,
	prevCode: string | BytesView | undefined,
	userIdStatus: UserIDStatus,
	userCode: string | BytesView,
): void {
	const prevUser = mapUserCodeStatusToUserData(userId, prevStatus);
	const newUser = mapUserCodeStatusToUserData(userId, userIdStatus);
	if (!prevUser && !newUser) return;

	const endpoint = node.getEndpoint(endpointIndex) ?? node;
	const credentialType = getUserCodeCredentialType(
		UserCodeCC.getSupportedASCIICharsCached(
			ctx,
			nodeEndpointId(node, endpointIndex),
		),
	);

	if (!prevUser && newUser) {
		node.emit("user added", endpoint, newUser);
		node.emit("credential added", endpoint, {
			userId,
			credentialType,
			// For User Code CC, credential slots and users are identical
			credentialSlot: userId,
			data: userCode,
		});
	} else if (prevUser && !newUser) {
		node.emit("user deleted", endpoint, { userId });
		node.emit("credential deleted", endpoint, {
			userId,
			credentialType,
			credentialSlot: userId,
		});
	} else if (prevUser && newUser) {
		if (
			prevUser.active !== newUser.active
			|| prevUser.userType !== newUser.userType
		) {
			node.emit("user modified", endpoint, newUser);
		}
		if (!codeEquals(prevCode, userCode)) {
			node.emit("credential modified", endpoint, {
				userId,
				credentialType,
				credentialSlot: userId,
				data: userCode,
			});
		}
	}
}

export function handleUserCodeReport(
	ctx: GetValueDB & GetSupportedCCVersion,
	node: ZWaveNode,
	report: UserCodeCCReport,
): void {
	const endpointId = nodeEndpointId(node, report.endpointIndex);
	const prevStatus = UserCodeCC.getUserIdStatusCached(
		ctx,
		endpointId,
		report.userId,
	);
	const prevCode = UserCodeCC.getUserCodeCached(
		ctx,
		endpointId,
		report.userId,
	);

	persistUserCodeReport(report, ctx);

	emitUserCodeChangeEvents(
		ctx,
		node,
		report.endpointIndex,
		report.userId,
		prevStatus,
		prevCode,
		report.userIdStatus,
		report.userCode,
	);
}

export function handleExtendedUserCodeReport(
	ctx: GetValueDB & GetSupportedCCVersion,
	node: ZWaveNode,
	report: UserCodeCCExtendedUserCodeReport,
): void {
	const endpointId = nodeEndpointId(node, report.endpointIndex);
	const prevStates = report.userCodes.map(({ userId }) => ({
		status: UserCodeCC.getUserIdStatusCached(ctx, endpointId, userId),
		code: UserCodeCC.getUserCodeCached(ctx, endpointId, userId),
	}));

	persistExtendedUserCodeReport(report, ctx);

	for (let i = 0; i < report.userCodes.length; i++) {
		const { userId, userIdStatus, userCode } = report.userCodes[i];
		emitUserCodeChangeEvents(
			ctx,
			node,
			report.endpointIndex,
			userId,
			prevStates[i].status,
			prevStates[i].code,
			userIdStatus,
			userCode,
		);
	}
}

export function handleAdminCodeReport(
	ctx: GetValueDB,
	report: UserCodeCCAdminCodeReport,
): void {
	// There is no unified event for admin code changes, so only the cache
	// needs to be updated
	persistAdminCodeReport(report, ctx);
}
