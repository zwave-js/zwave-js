import {
	CommandClasses,
	type EndpointId,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	MessagePriority,
	type MessageRecord,
	type SupervisionResult,
	ValueMetadata,
	type WithAddress,
	encodeBitMask,
	enumValuesToMetadataStates,
	parseBitMask,
	validatePayload,
} from "@zwave-js/core";
import {
	Bytes,
	getEnumMemberName,
	pick,
	stringToUint8ArrayUTF16BE,
	uint8ArrayToStringUTF16BE,
} from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import {
	CCAPI,
	POLL_VALUE,
	PhysicalCCAPI,
	type PollValueImplementation,
	SET_VALUE,
	type SetValueImplementation,
	throwUnsupportedProperty,
	throwWrongValueType,
} from "../lib/API.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
	type PersistValuesContext,
	type RefreshValuesContext,
} from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	ccValueProperty,
	ccValues,
	commandClass,
	expectedCCResponse,
	implementedVersion,
	useSupervision,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import {
	UserCredentialActiveState,
	UserCredentialAdminCodeOperationResult,
	UserCredentialCommand,
	UserCredentialCredentialReportType,
	UserCredentialKeyLockerEntryType,
	UserCredentialModifierType,
	UserCredentialNameEncoding,
	UserCredentialOperationType,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserReportType,
	UserCredentialUserType,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

function credentialToLogString(credential: string | Bytes): string {
	if (credential.length === 0) return "(empty)";
	return "*".repeat(credential.length);
}

export const UserCredentialCCValues = V.defineCCValues(
	CommandClasses["User Credential"],
	{
		// Internal capability values
		...V.staticProperty("supportedUsers", undefined, {
			internal: true,
		}),
		...V.staticProperty("supportedCredentialRules", undefined, {
			internal: true,
		}),
		...V.staticProperty("maxUserNameLength", undefined, {
			internal: true,
		}),
		...V.staticProperty("userScheduleSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("allUsersChecksumSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("userChecksumSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("supportedUserNameEncodings", undefined, {
			internal: true,
		}),
		...V.staticProperty("supportedUserTypes", undefined, {
			internal: true,
		}),
		...V.staticProperty("credentialChecksumSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("adminCodeSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("adminCodeDeactivationSupport", undefined, {
			internal: true,
		}),
		...V.staticProperty("supportedCredentialTypes", undefined, {
			internal: true,
		}),
		...V.staticProperty("allUsersChecksum", undefined, {
			internal: true,
		}),
		...V.staticProperty("keyLockerCapabilities", undefined, {
			internal: true,
			minVersion: 2,
		}),

		// Per-user values
		...V.dynamicPropertyAndKeyWithName(
			"userType",
			"userType",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userType" && typeof propertyKey === "number",
			(userId: number) =>
				({
					...ValueMetadata.ReadOnlyUInt8,
					label: `User type (${userId})`,
					states: enumValuesToMetadataStates(
						UserCredentialUserType,
					),
				}) as const,
		),
		...V.dynamicPropertyAndKeyWithName(
			"userActiveState",
			"userActiveState",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userActiveState"
				&& typeof propertyKey === "number",
			(userId: number) =>
				({
					...ValueMetadata.ReadOnlyUInt8,
					label: `Active state (${userId})`,
					states: enumValuesToMetadataStates(
						UserCredentialActiveState,
					),
				}) as const,
		),
		...V.dynamicPropertyAndKeyWithName(
			"credentialRule",
			"credentialRule",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "credentialRule"
				&& typeof propertyKey === "number",
			(userId: number) =>
				({
					...ValueMetadata.ReadOnlyUInt8,
					label: `Credential rule (${userId})`,
					states: enumValuesToMetadataStates(UserCredentialRule),
				}) as const,
		),
		...V.dynamicPropertyAndKeyWithName(
			"expiringTimeoutMinutes",
			"expiringTimeoutMinutes",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "expiringTimeoutMinutes"
				&& typeof propertyKey === "number",
			(userId: number) =>
				({
					...ValueMetadata.ReadOnlyUInt16,
					label: `Expiring timeout minutes (${userId})`,
				}) as const,
		),
		...V.dynamicPropertyAndKeyWithName(
			"userName",
			"userName",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userName"
				&& typeof propertyKey === "number",
			(userId: number) =>
				({
					...ValueMetadata.ReadOnlyString,
					label: `User name (${userId})`,
				}) as const,
		),
		...V.dynamicPropertyAndKeyWithName(
			"userNameEncoding",
			"userNameEncoding",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userNameEncoding"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"userModifierType",
			"userModifierType",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userModifierType"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"userModifierNodeId",
			"userModifierNodeId",
			(userId: number) => userId,
			({ property, propertyKey }) =>
				property === "userModifierNodeId"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),

		// Per-credential values (keyed by type << 16 | slot)
		...V.dynamicPropertyAndKeyWithName(
			"credential",
			"credential",
			(type: UserCredentialType, slot: number) => (type << 16) | slot,
			({ property, propertyKey }) =>
				property === "credential"
				&& typeof propertyKey === "number",
			(type: UserCredentialType, slot: number) =>
				({
					...ValueMetadata.ReadOnlyBuffer,
					label: `Credential (${
						getEnumMemberName(
							UserCredentialType,
							type,
						)
					}, slot ${slot})`,
				}) as const,
			{ secret: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"credentialUserUniqueIdentifier",
			"credentialUserUniqueIdentifier",
			(type: UserCredentialType, slot: number) => (type << 16) | slot,
			({ property, propertyKey }) =>
				property === "credentialUserUniqueIdentifier"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),

		// Admin PIN Code
		...V.staticProperty(
			"adminPinCode",
			{
				...ValueMetadata.String,
				label: "Admin PIN Code",
			} as const,
			{
				secret: true,
			} as const,
		),

		// V2 Key Locker entries
		...V.dynamicPropertyAndKeyWithName(
			"keyLockerEntry",
			"keyLockerEntry",
			(type: UserCredentialKeyLockerEntryType, slot: number) =>
				(type << 16) | slot,
			({ property, propertyKey }) =>
				property === "keyLockerEntry"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true, minVersion: 2 },
		),
	},
);

// API class
@API(CommandClasses["User Credential"])
export class UserCredentialCCAPI extends PhysicalCCAPI {
	public supportsCommand(
		cmd: UserCredentialCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			// Mandatory v1 commands
			case UserCredentialCommand.UserCapabilitiesGet:
			case UserCredentialCommand.UserCapabilitiesReport:
			case UserCredentialCommand.CredentialCapabilitiesGet:
			case UserCredentialCommand.CredentialCapabilitiesReport:
			case UserCredentialCommand.UserSet:
			case UserCredentialCommand.UserGet:
			case UserCredentialCommand.UserReport:
			case UserCredentialCommand.CredentialSet:
			case UserCredentialCommand.CredentialGet:
			case UserCredentialCommand.CredentialReport:
			case UserCredentialCommand.CredentialLearnStart:
			case UserCredentialCommand.CredentialLearnCancel:
			case UserCredentialCommand.CredentialLearnReport:
			case UserCredentialCommand.UserCredentialAssociationSet:
			case UserCredentialCommand.UserCredentialAssociationReport:
				return true;

			case UserCredentialCommand.AllUsersChecksumGet:
			case UserCredentialCommand.AllUsersChecksumReport: {
				return this.tryGetValueDB()?.getValue<boolean>(
					UserCredentialCCValues.allUsersChecksumSupport.endpoint(
						this.endpoint.index,
					),
				);
			}
			case UserCredentialCommand.UserChecksumGet:
			case UserCredentialCommand.UserChecksumReport: {
				return this.tryGetValueDB()?.getValue<boolean>(
					UserCredentialCCValues.userChecksumSupport.endpoint(
						this.endpoint.index,
					),
				);
			}
			case UserCredentialCommand.CredentialChecksumGet:
			case UserCredentialCommand.CredentialChecksumReport: {
				return this.tryGetValueDB()?.getValue<boolean>(
					UserCredentialCCValues.credentialChecksumSupport
						.endpoint(
							this.endpoint.index,
						),
				);
			}
			case UserCredentialCommand.AdminPinCodeSet:
			case UserCredentialCommand.AdminPinCodeGet:
			case UserCredentialCommand.AdminPinCodeReport: {
				return this.tryGetValueDB()?.getValue<boolean>(
					UserCredentialCCValues.adminCodeSupport.endpoint(
						this.endpoint.index,
					),
				);
			}

			// V2 commands
			case UserCredentialCommand.KeyLockerCapabilitiesGet:
			case UserCredentialCommand.KeyLockerCapabilitiesReport:
			case UserCredentialCommand.KeyLockerEntrySet:
			case UserCredentialCommand.KeyLockerEntryGet:
			case UserCredentialCommand.KeyLockerEntryReport:
				return this.version >= 2;
		}
		return super.supportsCommand(cmd);
	}

	// Capabilities
	public async getUserCapabilities(): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCUserCapabilitiesReport,
				| "numberOfSupportedUsers"
				| "supportedCredentialRules"
				| "maxUserNameLength"
				| "userScheduleSupport"
				| "allUsersChecksumSupport"
				| "userChecksumSupport"
				| "supportedUserNameEncodings"
				| "supportedUserTypes"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserCapabilitiesGet,
		);

		const cc = new UserCredentialCCUserCapabilitiesGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCUserCapabilitiesReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, [
				"numberOfSupportedUsers",
				"supportedCredentialRules",
				"maxUserNameLength",
				"userScheduleSupport",
				"allUsersChecksumSupport",
				"userChecksumSupport",
				"supportedUserNameEncodings",
				"supportedUserTypes",
			]);
		}
	}

	public async getCredentialCapabilities(): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCCredentialCapabilitiesReport,
				| "credentialChecksumSupport"
				| "adminCodeSupport"
				| "adminCodeDeactivationSupport"
				| "supportedCredentialTypes"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialCapabilitiesGet,
		);

		const cc = new UserCredentialCCCredentialCapabilitiesGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCCredentialCapabilitiesReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, [
				"credentialChecksumSupport",
				"adminCodeSupport",
				"adminCodeDeactivationSupport",
				"supportedCredentialTypes",
			]);
		}
	}

	public async getKeyLockerCapabilities(): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCKeyLockerCapabilitiesReport,
				"supportedKeyLockerEntryTypes"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.KeyLockerCapabilitiesGet,
		);

		const cc = new UserCredentialCCKeyLockerCapabilitiesGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCKeyLockerCapabilitiesReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, ["supportedKeyLockerEntryTypes"]);
		}
	}

	// User Management
	@validateArgs()
	public async setUser(
		options: UserCredentialCCUserSetOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserSet,
		);

		const cc = new UserCredentialCCUserSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async getUser(
		userUniqueIdentifier: number,
	): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCUserReport,
				| "userReportType"
				| "nextUserUniqueIdentifier"
				| "userModifierType"
				| "userModifierNodeId"
				| "userUniqueIdentifier"
				| "userType"
				| "activeState"
				| "credentialRule"
				| "expiringTimeoutMinutes"
				| "nameEncoding"
				| "userName"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserGet,
		);

		const cc = new UserCredentialCCUserGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			userUniqueIdentifier,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCUserReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, [
				"userReportType",
				"nextUserUniqueIdentifier",
				"userModifierType",
				"userModifierNodeId",
				"userUniqueIdentifier",
				"userType",
				"activeState",
				"credentialRule",
				"expiringTimeoutMinutes",
				"nameEncoding",
				"userName",
			]);
		}
	}

	// Credential Management
	@validateArgs()
	public async setCredential(
		options: UserCredentialCCCredentialSetOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialSet,
		);

		const cc = new UserCredentialCCCredentialSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async getCredential(
		userUniqueIdentifier: number,
		credentialType: UserCredentialType,
		credentialSlot: number,
	): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCCredentialReport,
				| "credentialReportType"
				| "userUniqueIdentifier"
				| "credentialType"
				| "credentialSlot"
				| "credentialReadBack"
				| "credentialLength"
				| "credentialData"
				| "credentialModifierType"
				| "credentialModifierNodeId"
				| "nextCredentialType"
				| "nextCredentialSlot"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialGet,
		);

		const cc = new UserCredentialCCCredentialGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCCredentialReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, [
				"credentialReportType",
				// UserId, credential type and slot can be zero in the
				// request to return the first credential, so we cannot
				// simply omit them here
				"userUniqueIdentifier",
				"credentialType",
				"credentialSlot",
				"credentialReadBack",
				"credentialLength",
				"credentialData",
				"credentialModifierType",
				"credentialModifierNodeId",
				"nextCredentialType",
				"nextCredentialSlot",
			]);
		}
	}

	// Credential Learn
	@validateArgs()
	public async startCredentialLearn(
		options: UserCredentialCCCredentialLearnStartOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialLearnStart,
		);

		const cc = new UserCredentialCCCredentialLearnStart({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	public async cancelCredentialLearn(): Promise<
		SupervisionResult | undefined
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialLearnCancel,
		);

		const cc = new UserCredentialCCCredentialLearnCancel({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	// Association
	@validateArgs()
	public async setUserCredentialAssociation(
		options: UserCredentialCCUserCredentialAssociationSetOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserCredentialAssociationSet,
		);

		const cc = new UserCredentialCCUserCredentialAssociationSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	// Checksums
	public async getAllUsersChecksum(): Promise<MaybeNotKnown<number>> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.AllUsersChecksumGet,
		);

		const cc = new UserCredentialCCAllUsersChecksumGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCAllUsersChecksumReport
		>(cc, this.commandOptions);
		return response?.checksum;
	}

	@validateArgs()
	public async getUserChecksum(
		userUniqueIdentifier: number,
	): Promise<MaybeNotKnown<number>> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserChecksumGet,
		);

		const cc = new UserCredentialCCUserChecksumGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			userUniqueIdentifier,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCUserChecksumReport
		>(cc, this.commandOptions);
		return response?.checksum;
	}

	@validateArgs()
	public async getCredentialChecksum(
		credentialType: UserCredentialType,
	): Promise<MaybeNotKnown<number>> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialChecksumGet,
		);

		const cc = new UserCredentialCCCredentialChecksumGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			credentialType,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCCredentialChecksumReport
		>(cc, this.commandOptions);
		return response?.checksum;
	}

	// Admin PIN Code
	@validateArgs()
	public async setAdminPinCode(
		options: UserCredentialCCAdminPinCodeSetOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.AdminPinCodeSet,
		);

		const cc = new UserCredentialCCAdminPinCodeSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	public async getAdminPinCode(): Promise<MaybeNotKnown<string>> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.AdminPinCodeGet,
		);

		const cc = new UserCredentialCCAdminPinCodeGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCAdminPinCodeReport
		>(cc, this.commandOptions);
		return response?.pinCode;
	}

	// Key Locker (V2)
	@validateArgs()
	public async setKeyLockerEntry(
		options: UserCredentialCCKeyLockerEntrySetOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.KeyLockerEntrySet,
		);

		const cc = new UserCredentialCCKeyLockerEntrySet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async getKeyLockerEntry(
		entryType: UserCredentialKeyLockerEntryType,
		entrySlot: number,
	): Promise<
		MaybeNotKnown<
			Pick<
				UserCredentialCCKeyLockerEntryReport,
				"occupied" | "entryType" | "entrySlot"
			>
		>
	> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.KeyLockerEntryGet,
		);

		const cc = new UserCredentialCCKeyLockerEntryGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			entryType,
			entrySlot,
		});
		const response = await this.host.sendCommand<
			UserCredentialCCKeyLockerEntryReport
		>(cc, this.commandOptions);
		if (response) {
			return pick(response, [
				"occupied",
				"entryType",
				"entrySlot",
			]);
		}
	}

	// Send Report methods
	@validateArgs()
	public async sendUserCapabilitiesReport(
		options: UserCredentialCCUserCapabilitiesReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserCapabilitiesReport,
		);

		const cc = new UserCredentialCCUserCapabilitiesReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendCredentialCapabilitiesReport(
		options: UserCredentialCCCredentialCapabilitiesReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialCapabilitiesReport,
		);

		const cc = new UserCredentialCCCredentialCapabilitiesReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendKeyLockerCapabilitiesReport(
		options: UserCredentialCCKeyLockerCapabilitiesReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.KeyLockerCapabilitiesReport,
		);

		const cc = new UserCredentialCCKeyLockerCapabilitiesReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendUserReport(
		options: UserCredentialCCUserReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserReport,
		);

		const cc = new UserCredentialCCUserReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendCredentialReport(
		options: UserCredentialCCCredentialReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialReport,
		);

		const cc = new UserCredentialCCCredentialReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendCredentialLearnReport(
		options: UserCredentialCCCredentialLearnReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialLearnReport,
		);

		const cc = new UserCredentialCCCredentialLearnReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendUserCredentialAssociationReport(
		options: UserCredentialCCUserCredentialAssociationReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserCredentialAssociationReport,
		);

		const cc = new UserCredentialCCUserCredentialAssociationReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendAllUsersChecksumReport(
		options: UserCredentialCCAllUsersChecksumReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.AllUsersChecksumReport,
		);

		const cc = new UserCredentialCCAllUsersChecksumReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendUserChecksumReport(
		options: UserCredentialCCUserChecksumReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.UserChecksumReport,
		);

		const cc = new UserCredentialCCUserChecksumReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendCredentialChecksumReport(
		options: UserCredentialCCCredentialChecksumReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.CredentialChecksumReport,
		);

		const cc = new UserCredentialCCCredentialChecksumReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendAdminPinCodeReport(
		options: UserCredentialCCAdminPinCodeReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.AdminPinCodeReport,
		);

		const cc = new UserCredentialCCAdminPinCodeReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs()
	public async sendKeyLockerEntryReport(
		options: UserCredentialCCKeyLockerEntryReportOptions,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			UserCredentialCommand,
			UserCredentialCommand.KeyLockerEntryReport,
		);

		const cc = new UserCredentialCCKeyLockerEntryReport({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...options,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}

	protected override get [SET_VALUE](): SetValueImplementation {
		return async function(
			this: UserCredentialCCAPI,
			{ property },
			value,
		) {
			if (property === "adminPinCode") {
				if (typeof value !== "string") {
					throwWrongValueType(
						this.ccId,
						property,
						"string",
						typeof value,
					);
				}
				return this.setAdminPinCode({ pinCode: value });
			}
			throwUnsupportedProperty(this.ccId, property);
		};
	}

	protected override get [POLL_VALUE](): PollValueImplementation {
		return async function(
			this: UserCredentialCCAPI,
			{ property },
		) {
			if (property === "adminPinCode") {
				return this.getAdminPinCode();
			}
			throwUnsupportedProperty(this.ccId, property);
		};
	}
}

// Base CC class
@commandClass(CommandClasses["User Credential"])
@implementedVersion(2)
@ccValues(UserCredentialCCValues)
export class UserCredentialCC extends CommandClass {
	declare ccCommand: UserCredentialCommand;

	public async interview(
		ctx: InterviewContext,
	): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["User Credential"],
			ctx,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying user capabilities...",
			direction: "outbound",
		});
		const userCaps = await api.getUserCapabilities();
		if (!userCaps) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message:
					"User capabilities query timed out - skipping interview",
				level: "warn",
			});
			return;
		}

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying credential capabilities...",
			direction: "outbound",
		});
		const credCaps = await api.getCredentialCapabilities();
		if (!credCaps) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message:
					"Credential capabilities query timed out - skipping interview",
				level: "warn",
			});
			return;
		}

		if (api.version >= 2) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: "querying key locker capabilities...",
				direction: "outbound",
			});
			await api.getKeyLockerCapabilities();
		}

		await this.refreshValues(ctx);

		this.setInterviewComplete(ctx, true);
	}

	public async refreshValues(
		ctx: RefreshValuesContext,
	): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["User Credential"],
			ctx,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		const allUsersChecksumSupport = this.getValue<boolean>(
			ctx,
			UserCredentialCCValues.allUsersChecksumSupport,
		);
		const adminCodeSupport = this.getValue<boolean>(
			ctx,
			UserCredentialCCValues.adminCodeSupport,
		);
		const keyLockerCapabilities = this.getValue<
			UserCredentialKeyLockerCapability[]
		>(
			ctx,
			UserCredentialCCValues.keyLockerCapabilities,
		);

		// Check if all-users checksum has changed
		let skipFullSync = false;
		if (allUsersChecksumSupport) {
			const currentChecksum = await api.getAllUsersChecksum();
			const storedChecksum = this.getValue<number>(
				ctx,
				UserCredentialCCValues.allUsersChecksum,
			);
			if (
				currentChecksum != undefined
				&& storedChecksum != undefined
				&& currentChecksum === storedChecksum
			) {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: "all-users checksum unchanged, skipping full sync",
					direction: "none",
				});
				skipFullSync = true;
			}
			if (currentChecksum != undefined) {
				this.setValue(
					ctx,
					UserCredentialCCValues.allUsersChecksum,
					currentChecksum,
				);
			}
		}

		if (!skipFullSync) {
			// Iterate all users starting from UUID 0
			let nextUserId = 0;
			do {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: `querying user with UUID ${nextUserId}...`,
					direction: "outbound",
				});
				const user = await api.getUser(nextUserId);
				if (!user) break;
				nextUserId = user.nextUserUniqueIdentifier;

				// For each user, iterate all credentials
				if (
					user.userUniqueIdentifier > 0
					&& (user.userReportType
							=== UserCredentialUserReportType.ResponseToGet
						|| user.userReportType
							=== UserCredentialUserReportType.UserAdded
						|| user.userReportType
							=== UserCredentialUserReportType.UserModified)
				) {
					await this.queryCredentialsForUser(
						ctx,
						api,
						node.id,
						user.userUniqueIdentifier,
					);
				}
			} while (nextUserId > 0);
		}

		// Query admin PIN code if supported
		if (adminCodeSupport) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: "querying admin PIN code...",
				direction: "outbound",
			});
			await api.getAdminPinCode();
		}

		// Query key locker entries (V2)
		if (api.version >= 2 && keyLockerCapabilities?.length) {
			for (const entry of keyLockerCapabilities) {
				for (
					let slot = 1;
					slot <= entry.numberOfEntrySlots;
					slot++
				) {
					ctx.logNode(node.id, {
						endpoint: this.endpointIndex,
						message:
							`querying key locker entry type ${entry.entryType}, slot ${slot}...`,
						direction: "outbound",
					});
					await api.getKeyLockerEntry(entry.entryType, slot);
				}
			}
		}
	}

	private async queryCredentialsForUser(
		ctx: RefreshValuesContext,
		api: UserCredentialCCAPI,
		nodeId: number,
		userUniqueIdentifier: number,
	): Promise<void> {
		// Start with credential type 0, slot 0 to get the first credential for this user
		let nextCredType: UserCredentialType = UserCredentialType.None;
		let nextCredSlot = 0;
		do {
			ctx.logNode(nodeId, {
				endpoint: this.endpointIndex,
				message:
					`querying credential for user ${userUniqueIdentifier}, type ${nextCredType}, slot ${nextCredSlot}...`,
				direction: "outbound",
			});
			const cred = await api.getCredential(
				userUniqueIdentifier,
				nextCredType,
				nextCredSlot,
			);
			if (!cred) break;
			nextCredType = cred.nextCredentialType;
			nextCredSlot = cred.nextCredentialSlot;
		} while (
			nextCredType !== UserCredentialType.None || nextCredSlot !== 0
		);
	}

	public static getSupportedUsersCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
	): MaybeNotKnown<number> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				UserCredentialCCValues.supportedUsers.endpoint(
					endpoint.index,
				),
			);
	}

	public static getSupportedCredentialTypesCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
	): MaybeNotKnown<UserCredentialCredentialCapability[]> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				UserCredentialCCValues.supportedCredentialTypes.endpoint(
					endpoint.index,
				),
			);
	}

	public static supportsAdminCodeCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
	): boolean {
		return (
			ctx
				.getValueDB(endpoint.nodeId)
				.getValue<boolean>(
					UserCredentialCCValues.adminCodeSupport.endpoint(
						endpoint.index,
					),
				) ?? false
		);
	}
}

// ============================================================
// Group 1: Capabilities
// ============================================================

// @publicAPI
export interface UserCredentialCCUserCapabilitiesReportOptions {
	numberOfSupportedUsers: number;
	supportedCredentialRules: UserCredentialRule[];
	maxUserNameLength: number;
	userScheduleSupport: boolean;
	allUsersChecksumSupport: boolean;
	userChecksumSupport: boolean;
	supportedUserNameEncodings: UserCredentialNameEncoding[];
	supportedUserTypes: UserCredentialUserType[];
}

@CCCommand(UserCredentialCommand.UserCapabilitiesReport)
@ccValueProperty(
	"numberOfSupportedUsers",
	UserCredentialCCValues.supportedUsers,
)
@ccValueProperty(
	"supportedCredentialRules",
	UserCredentialCCValues.supportedCredentialRules,
)
@ccValueProperty("maxUserNameLength", UserCredentialCCValues.maxUserNameLength)
@ccValueProperty(
	"userScheduleSupport",
	UserCredentialCCValues.userScheduleSupport,
)
@ccValueProperty(
	"allUsersChecksumSupport",
	UserCredentialCCValues.allUsersChecksumSupport,
)
@ccValueProperty(
	"userChecksumSupport",
	UserCredentialCCValues.userChecksumSupport,
)
@ccValueProperty(
	"supportedUserNameEncodings",
	UserCredentialCCValues.supportedUserNameEncodings,
)
@ccValueProperty(
	"supportedUserTypes",
	UserCredentialCCValues.supportedUserTypes,
)
export class UserCredentialCCUserCapabilitiesReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCUserCapabilitiesReportOptions
		>,
	) {
		super(options);
		this.numberOfSupportedUsers = options.numberOfSupportedUsers;
		this.supportedCredentialRules = options.supportedCredentialRules;
		this.maxUserNameLength = options.maxUserNameLength;
		this.userScheduleSupport = options.userScheduleSupport;
		this.allUsersChecksumSupport = options.allUsersChecksumSupport;
		this.userChecksumSupport = options.userChecksumSupport;
		this.supportedUserNameEncodings = options.supportedUserNameEncodings;
		this.supportedUserTypes = options.supportedUserTypes;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserCapabilitiesReport {
		validatePayload(raw.payload.length >= 4);

		const numberOfSupportedUsers = raw.payload.readUInt16BE(0);
		const credentialRulesBitmask = raw.payload[2];
		const supportedCredentialRules: UserCredentialRule[] = parseBitMask(
			Bytes.from([credentialRulesBitmask]),
			0,
		).filter((v) => v in UserCredentialRule);
		const maxUserNameLength = raw.payload[3];

		validatePayload(raw.payload.length >= 5);
		const flagsByte = raw.payload[4];
		const userScheduleSupport = !!(flagsByte & 0b1000_0000);
		const allUsersChecksumSupport = !!(flagsByte & 0b0100_0000);
		const userChecksumSupport = !!(flagsByte & 0b0010_0000);

		// Name encoding bitmask in bits 4:2
		const nameEncodingBitmask = (flagsByte >> 2) & 0b111;
		let supportedUserNameEncodings: UserCredentialNameEncoding[];
		if (nameEncodingBitmask === 0) {
			// All encodings assumed supported per spec
			supportedUserNameEncodings = [
				UserCredentialNameEncoding.ASCII,
				UserCredentialNameEncoding.ExtendedASCII,
				UserCredentialNameEncoding.UTF16BE,
			];
		} else {
			supportedUserNameEncodings = parseBitMask(
				Bytes.from([nameEncodingBitmask]),
				0,
			).filter((v) => v in UserCredentialNameEncoding);
		}

		validatePayload(raw.payload.length >= 6);
		const userTypesBitmaskLength = raw.payload[5];
		validatePayload(
			raw.payload.length >= 6 + userTypesBitmaskLength,
		);
		const supportedUserTypes: UserCredentialUserType[] = parseBitMask(
			raw.payload.subarray(6, 6 + userTypesBitmaskLength),
			0,
		).filter((v) => v in UserCredentialUserType);

		return new this({
			nodeId: ctx.sourceNodeId,
			numberOfSupportedUsers,
			supportedCredentialRules,
			maxUserNameLength,
			userScheduleSupport,
			allUsersChecksumSupport,
			userChecksumSupport,
			supportedUserNameEncodings,
			supportedUserTypes,
		});
	}

	public readonly numberOfSupportedUsers: number;
	public readonly supportedCredentialRules: UserCredentialRule[];
	public readonly maxUserNameLength: number;
	public readonly userScheduleSupport: boolean;
	public readonly allUsersChecksumSupport: boolean;
	public readonly userChecksumSupport: boolean;
	public readonly supportedUserNameEncodings: UserCredentialNameEncoding[];
	public readonly supportedUserTypes: UserCredentialUserType[];

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const credentialRulesBitmask = encodeBitMask(
			this.supportedCredentialRules,
			UserCredentialRule.Triple,
			0, // Bit 0 in Bit Mask MUST be set to 0
		);
		const nameEncodingBitmask = encodeBitMask(
			this.supportedUserNameEncodings,
			UserCredentialNameEncoding.UTF16BE,
			UserCredentialNameEncoding.ASCII,
		);
		const flagsByte = (this.userScheduleSupport ? 0b1000_0000 : 0)
			| (this.allUsersChecksumSupport ? 0b0100_0000 : 0)
			| (this.userChecksumSupport ? 0b0010_0000 : 0)
			| ((nameEncodingBitmask[0] & 0b111) << 2);
		const userTypesBitmask = encodeBitMask(
			this.supportedUserTypes,
			UserCredentialUserType.RemoteOnly,
			UserCredentialUserType.General,
		);
		this.payload = Bytes.alloc(6 + userTypesBitmask.length);
		this.payload.writeUInt16BE(this.numberOfSupportedUsers, 0);
		this.payload[2] = credentialRulesBitmask[0];
		this.payload[3] = this.maxUserNameLength;
		this.payload[4] = flagsByte;
		this.payload[5] = userTypesBitmask.length;
		this.payload.set(userTypesBitmask, 6);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"supported users": this.numberOfSupportedUsers,
				"supported credential rules": this.supportedCredentialRules
					.map((r) => getEnumMemberName(UserCredentialRule, r))
					.join(", "),
				"max user name length": this.maxUserNameLength,
				"user schedule support": this.userScheduleSupport,
				"all users checksum support": this.allUsersChecksumSupport,
				"user checksum support": this.userChecksumSupport,
				"supported name encodings": this.supportedUserNameEncodings
					.map((e) =>
						getEnumMemberName(
							UserCredentialNameEncoding,
							e,
						)
					)
					.join(", "),
				"supported user types": this.supportedUserTypes
					.map((t) => getEnumMemberName(UserCredentialUserType, t))
					.join(", "),
			},
		};
	}
}

@CCCommand(UserCredentialCommand.UserCapabilitiesGet)
@expectedCCResponse(UserCredentialCCUserCapabilitiesReport)
export class UserCredentialCCUserCapabilitiesGet extends UserCredentialCC {}

// @publicAPI
export interface UserCredentialCredentialCapability {
	credentialType: UserCredentialType;
	credentialLearnSupport: boolean;
	numberOfCredentialSlots: number;
	minCredentialLength: number;
	maxCredentialLength: number;
	credentialLearnRecommendedTimeout: number;
	credentialLearnNumberOfSteps: number;
	maxCredentialHashLength: number;
}

// @publicAPI
export interface UserCredentialCCCredentialCapabilitiesReportOptions {
	credentialChecksumSupport: boolean;
	adminCodeSupport: boolean;
	adminCodeDeactivationSupport: boolean;
	supportedCredentialTypes: UserCredentialCredentialCapability[];
}

@CCCommand(UserCredentialCommand.CredentialCapabilitiesReport)
@ccValueProperty(
	"credentialChecksumSupport",
	UserCredentialCCValues.credentialChecksumSupport,
)
@ccValueProperty("adminCodeSupport", UserCredentialCCValues.adminCodeSupport)
@ccValueProperty(
	"adminCodeDeactivationSupport",
	UserCredentialCCValues.adminCodeDeactivationSupport,
)
@ccValueProperty(
	"supportedCredentialTypes",
	UserCredentialCCValues.supportedCredentialTypes,
)
export class UserCredentialCCCredentialCapabilitiesReport
	extends UserCredentialCC
{
	public constructor(
		options: WithAddress<
			UserCredentialCCCredentialCapabilitiesReportOptions
		>,
	) {
		super(options);
		this.credentialChecksumSupport = options.credentialChecksumSupport;
		this.adminCodeSupport = options.adminCodeSupport;
		this.adminCodeDeactivationSupport =
			options.adminCodeDeactivationSupport;
		this.supportedCredentialTypes = options.supportedCredentialTypes;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialCapabilitiesReport {
		validatePayload(raw.payload.length >= 2);
		const flagsByte = raw.payload[0];
		const credentialChecksumSupport = !!(flagsByte & 0b1000_0000);
		const adminCodeSupport = !!(flagsByte & 0b0100_0000);
		const adminCodeDeactivationSupport = !!(flagsByte & 0b0010_0000);

		const numberOfCredentialTypes = raw.payload[1];
		const n = numberOfCredentialTypes;
		validatePayload(raw.payload.length >= 2 + n * 9);

		const supportedCredentialTypes: UserCredentialCredentialCapability[] =
			[];
		// Grouped block offsets
		const credTypeOff = 2;
		const clSupportOff = credTypeOff + n;
		const numSlotsOff = clSupportOff + n;
		const minLenOff = numSlotsOff + n * 2;
		const maxLenOff = minLenOff + n;
		const clTimeoutOff = maxLenOff + n;
		const clStepsOff = clTimeoutOff + n;
		const maxHashLenOff = clStepsOff + n;

		for (let i = 0; i < n; i++) {
			const credentialType: UserCredentialType =
				raw.payload[credTypeOff + i];
			const clByte = raw.payload[clSupportOff + i];
			const credentialLearnSupport = !!(clByte & 0b1000_0000);
			const numberOfCredentialSlots = raw.payload.readUInt16BE(
				numSlotsOff + i * 2,
			);
			const minCredentialLength = raw.payload[minLenOff + i];
			const maxCredentialLength = raw.payload[maxLenOff + i];
			const credentialLearnRecommendedTimeout =
				raw.payload[clTimeoutOff + i];
			const credentialLearnNumberOfSteps = raw.payload[clStepsOff + i];
			const maxCredentialHashLength = raw.payload[maxHashLenOff + i];
			supportedCredentialTypes.push({
				credentialType,
				credentialLearnSupport,
				numberOfCredentialSlots,
				minCredentialLength,
				maxCredentialLength,
				credentialLearnRecommendedTimeout,
				credentialLearnNumberOfSteps,
				maxCredentialHashLength,
			});
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialChecksumSupport,
			adminCodeSupport,
			adminCodeDeactivationSupport,
			supportedCredentialTypes,
		});
	}

	public readonly credentialChecksumSupport: boolean;
	public readonly adminCodeSupport: boolean;
	public readonly adminCodeDeactivationSupport: boolean;
	public readonly supportedCredentialTypes:
		UserCredentialCredentialCapability[];

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const n = this.supportedCredentialTypes.length;
		this.payload = Bytes.alloc(2 + n * 9);
		this.payload[0] = (this.credentialChecksumSupport ? 0b1000_0000 : 0)
			| (this.adminCodeSupport ? 0b0100_0000 : 0)
			| (this.adminCodeDeactivationSupport ? 0b0010_0000 : 0);
		this.payload[1] = n;

		const credTypeOff = 2;
		const clSupportOff = credTypeOff + n;
		const numSlotsOff = clSupportOff + n;
		const minLenOff = numSlotsOff + n * 2;
		const maxLenOff = minLenOff + n;
		const clTimeoutOff = maxLenOff + n;
		const clStepsOff = clTimeoutOff + n;
		const maxHashLenOff = clStepsOff + n;

		for (let i = 0; i < n; i++) {
			const ct = this.supportedCredentialTypes[i];
			this.payload[credTypeOff + i] = ct.credentialType;
			this.payload[clSupportOff + i] = ct.credentialLearnSupport
				? 0b1000_0000
				: 0;
			this.payload.writeUInt16BE(
				ct.numberOfCredentialSlots,
				numSlotsOff + i * 2,
			);
			this.payload[minLenOff + i] = ct.minCredentialLength;
			this.payload[maxLenOff + i] = ct.maxCredentialLength;
			this.payload[clTimeoutOff + i] =
				ct.credentialLearnRecommendedTimeout;
			this.payload[clStepsOff + i] = ct.credentialLearnNumberOfSteps;
			this.payload[maxHashLenOff + i] = ct.maxCredentialHashLength;
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		const message: MessageRecord = {
			"credential checksum support": this.credentialChecksumSupport,
			"admin code support": this.adminCodeSupport,
			"admin code deactivation support":
				this.adminCodeDeactivationSupport,
		};
		for (const ct of this.supportedCredentialTypes) {
			message[
				`credential type ${
					getEnumMemberName(
						UserCredentialType,
						ct.credentialType,
					)
				}`
			] = `slots: ${ct.numberOfCredentialSlots}, length: ${ct.minCredentialLength}-${ct.maxCredentialLength}`;
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

@CCCommand(UserCredentialCommand.CredentialCapabilitiesGet)
@expectedCCResponse(UserCredentialCCCredentialCapabilitiesReport)
export class UserCredentialCCCredentialCapabilitiesGet
	extends UserCredentialCC
{}

// @publicAPI
export interface UserCredentialKeyLockerCapability {
	entryType: UserCredentialKeyLockerEntryType;
	numberOfEntrySlots: number;
	minEntryDataLength: number;
	maxEntryDataLength: number;
}

// @publicAPI
export interface UserCredentialCCKeyLockerCapabilitiesReportOptions {
	supportedKeyLockerEntryTypes: UserCredentialKeyLockerCapability[];
}

@CCCommand(UserCredentialCommand.KeyLockerCapabilitiesReport)
@ccValueProperty(
	"supportedKeyLockerEntryTypes",
	UserCredentialCCValues.keyLockerCapabilities,
)
export class UserCredentialCCKeyLockerCapabilitiesReport
	extends UserCredentialCC
{
	public constructor(
		options: WithAddress<
			UserCredentialCCKeyLockerCapabilitiesReportOptions
		>,
	) {
		super(options);
		this.supportedKeyLockerEntryTypes =
			options.supportedKeyLockerEntryTypes;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCKeyLockerCapabilitiesReport {
		validatePayload(raw.payload.length >= 1);
		const numberOfEntryTypes = raw.payload[0];
		const n = numberOfEntryTypes;
		validatePayload(raw.payload.length >= 1 + n * 7);

		const supportedKeyLockerEntryTypes:
			UserCredentialKeyLockerCapability[] = [];
		// Grouped block offsets
		const entryTypeOff = 1;
		const numSlotsOff = entryTypeOff + n;
		const minLenOff = numSlotsOff + n * 2;
		const maxLenOff = minLenOff + n * 2;

		for (let i = 0; i < n; i++) {
			const entryType: UserCredentialKeyLockerEntryType =
				raw.payload[entryTypeOff + i];
			const numberOfEntrySlots = raw.payload.readUInt16BE(
				numSlotsOff + i * 2,
			);
			const minEntryDataLength = raw.payload.readUInt16BE(
				minLenOff + i * 2,
			);
			const maxEntryDataLength = raw.payload.readUInt16BE(
				maxLenOff + i * 2,
			);
			supportedKeyLockerEntryTypes.push({
				entryType,
				numberOfEntrySlots,
				minEntryDataLength,
				maxEntryDataLength,
			});
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			supportedKeyLockerEntryTypes,
		});
	}

	public readonly supportedKeyLockerEntryTypes:
		UserCredentialKeyLockerCapability[];

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const n = this.supportedKeyLockerEntryTypes.length;
		this.payload = Bytes.alloc(1 + n * 7);
		this.payload[0] = n;

		const entryTypeOff = 1;
		const numSlotsOff = entryTypeOff + n;
		const minLenOff = numSlotsOff + n * 2;
		const maxLenOff = minLenOff + n * 2;

		for (let i = 0; i < n; i++) {
			const et = this.supportedKeyLockerEntryTypes[i];
			this.payload[entryTypeOff + i] = et.entryType;
			this.payload.writeUInt16BE(
				et.numberOfEntrySlots,
				numSlotsOff + i * 2,
			);
			this.payload.writeUInt16BE(
				et.minEntryDataLength,
				minLenOff + i * 2,
			);
			this.payload.writeUInt16BE(
				et.maxEntryDataLength,
				maxLenOff + i * 2,
			);
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		const message: MessageRecord = {};
		for (const et of this.supportedKeyLockerEntryTypes) {
			message[
				`entry type ${
					getEnumMemberName(
						UserCredentialKeyLockerEntryType,
						et.entryType,
					)
				}`
			] = `slots: ${et.numberOfEntrySlots}, length: ${et.minEntryDataLength}-${et.maxEntryDataLength}`;
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

@CCCommand(UserCredentialCommand.KeyLockerCapabilitiesGet)
@expectedCCResponse(UserCredentialCCKeyLockerCapabilitiesReport)
export class UserCredentialCCKeyLockerCapabilitiesGet
	extends UserCredentialCC
{}

// ============================================================
// Group 2: User Management
// ============================================================

// @publicAPI
export interface UserCredentialCCUserSetOptions {
	operationType: UserCredentialOperationType;
	userUniqueIdentifier: number;
	userType?: UserCredentialUserType;
	activeState?: UserCredentialActiveState;
	credentialRule?: UserCredentialRule;
	expiringTimeoutMinutes?: number;
	nameEncoding?: UserCredentialNameEncoding;
	userName?: string;
}

@CCCommand(UserCredentialCommand.UserSet)
@useSupervision()
export class UserCredentialCCUserSet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCUserSetOptions>,
	) {
		super(options);
		this.operationType = options.operationType;
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.userType = options.userType ?? UserCredentialUserType.General;
		this.activeState = options.activeState
			?? UserCredentialActiveState.OccupiedEnabled;
		this.credentialRule = options.credentialRule
			?? UserCredentialRule.Single;
		this.expiringTimeoutMinutes = options.expiringTimeoutMinutes ?? 0;
		this.nameEncoding = options.nameEncoding
			?? UserCredentialNameEncoding.ASCII;
		this.userName = options.userName ?? "";
	}

	public operationType: UserCredentialOperationType;
	public userUniqueIdentifier: number;
	public userType: UserCredentialUserType;
	public activeState: UserCredentialActiveState;
	public credentialRule: UserCredentialRule;
	public expiringTimeoutMinutes: number;
	public nameEncoding: UserCredentialNameEncoding;
	public userName: string;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserSet {
		validatePayload(raw.payload.length >= 3);
		const operationType: UserCredentialOperationType = raw.payload[0]
			& 0x03;
		const userUniqueIdentifier = raw.payload.readUInt16BE(1);

		// For Delete, remaining fields MAY be omitted
		if (
			operationType === UserCredentialOperationType.Delete
			|| raw.payload.length < 10
		) {
			return new this({
				nodeId: ctx.sourceNodeId,
				operationType,
				userUniqueIdentifier,
			});
		}

		const userType: UserCredentialUserType = raw.payload[3];
		const activeState: UserCredentialActiveState = raw.payload[4] & 0x0f;
		const credentialRule: UserCredentialRule = raw.payload[5];
		const expiringTimeoutMinutes = raw.payload.readUInt16BE(6);
		const nameEncoding: UserCredentialNameEncoding = raw.payload[8] & 0x07;
		const nameLength = raw.payload[9];
		validatePayload(raw.payload.length >= 10 + nameLength);
		let userName: string;
		if (nameEncoding === UserCredentialNameEncoding.UTF16BE) {
			userName = uint8ArrayToStringUTF16BE(
				raw.payload.subarray(10, 10 + nameLength),
			);
		} else {
			userName = raw.payload
				.subarray(10, 10 + nameLength)
				.toString("ascii");
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			operationType,
			userUniqueIdentifier,
			userType,
			activeState,
			credentialRule,
			expiringTimeoutMinutes,
			nameEncoding,
			userName,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		if (this.operationType === UserCredentialOperationType.Delete) {
			this.payload = Bytes.alloc(3);
			this.payload[0] = this.operationType & 0x03;
			this.payload.writeUInt16BE(this.userUniqueIdentifier, 1);
			return super.serialize(ctx);
		}

		let nameBuffer: Uint8Array;
		if (this.nameEncoding === UserCredentialNameEncoding.UTF16BE) {
			nameBuffer = stringToUint8ArrayUTF16BE(this.userName);
		} else {
			nameBuffer = Bytes.from(this.userName, "ascii");
		}
		this.payload = Bytes.alloc(10 + nameBuffer.length);
		this.payload[0] = this.operationType & 0x03;
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 1);
		this.payload[3] = this.userType;
		this.payload[4] = this.activeState & 0x0f;
		this.payload[5] = this.credentialRule;
		this.payload.writeUInt16BE(this.expiringTimeoutMinutes, 6);
		this.payload[8] = this.nameEncoding & 0x07;
		this.payload[9] = nameBuffer.length;
		if (nameBuffer.length > 0) {
			this.payload.set(nameBuffer, 10);
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"operation type": getEnumMemberName(
					UserCredentialOperationType,
					this.operationType,
				),
				"user unique identifier": this.userUniqueIdentifier,
				"user type": getEnumMemberName(
					UserCredentialUserType,
					this.userType,
				),
				"active state": getEnumMemberName(
					UserCredentialActiveState,
					this.activeState,
				),
				"credential rule": getEnumMemberName(
					UserCredentialRule,
					this.credentialRule,
				),
				"expiring timeout (minutes)": this.expiringTimeoutMinutes,
				"name encoding": getEnumMemberName(
					UserCredentialNameEncoding,
					this.nameEncoding,
				),
				"user name": this.userName,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCUserReportOptions {
	userReportType: UserCredentialUserReportType;
	nextUserUniqueIdentifier: number;
	userModifierType: UserCredentialModifierType;
	userModifierNodeId: number;
	userUniqueIdentifier: number;
	userType: UserCredentialUserType;
	activeState: UserCredentialActiveState;
	credentialRule: UserCredentialRule;
	expiringTimeoutMinutes: number;
	nameEncoding: UserCredentialNameEncoding;
	userName: string;
}

@CCCommand(UserCredentialCommand.UserReport)
export class UserCredentialCCUserReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCUserReportOptions>,
	) {
		super(options);
		this.userReportType = options.userReportType;
		this.nextUserUniqueIdentifier = options.nextUserUniqueIdentifier;
		this.userModifierType = options.userModifierType;
		this.userModifierNodeId = options.userModifierNodeId;
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.userType = options.userType;
		this.activeState = options.activeState;
		this.credentialRule = options.credentialRule;
		this.expiringTimeoutMinutes = options.expiringTimeoutMinutes;
		this.nameEncoding = options.nameEncoding;
		this.userName = options.userName;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserReport {
		validatePayload(raw.payload.length >= 13);
		const userReportType: UserCredentialUserReportType = raw.payload[0];
		const nextUserUniqueIdentifier = raw.payload.readUInt16BE(1);
		const userModifierType: UserCredentialModifierType = raw.payload[3];
		const userModifierNodeId = raw.payload.readUInt16BE(4);
		const userUniqueIdentifier = raw.payload.readUInt16BE(6);
		const userType: UserCredentialUserType = raw.payload[8];
		const activeState: UserCredentialActiveState = raw.payload[9] & 0x0f;
		const credentialRule: UserCredentialRule = raw.payload[10];
		const expiringTimeoutMinutes = raw.payload.readUInt16BE(11);

		validatePayload(raw.payload.length >= 15);
		const nameEncoding: UserCredentialNameEncoding = raw.payload[13] & 0x07;
		const nameLength = raw.payload[14];
		validatePayload(raw.payload.length >= 15 + nameLength);
		let userName: string;
		if (nameEncoding === UserCredentialNameEncoding.UTF16BE) {
			userName = uint8ArrayToStringUTF16BE(
				raw.payload.subarray(15, 15 + nameLength),
			);
		} else {
			userName = raw.payload
				.subarray(15, 15 + nameLength)
				.toString("ascii");
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			userReportType,
			nextUserUniqueIdentifier,
			userModifierType,
			userModifierNodeId,
			userUniqueIdentifier,
			userType,
			activeState,
			credentialRule,
			expiringTimeoutMinutes,
			nameEncoding,
			userName,
		});
	}

	public readonly userReportType: UserCredentialUserReportType;
	public readonly nextUserUniqueIdentifier: number;
	public readonly userModifierType: UserCredentialModifierType;
	public readonly userModifierNodeId: number;
	public readonly userUniqueIdentifier: number;
	public readonly userType: UserCredentialUserType;
	public readonly activeState: UserCredentialActiveState;
	public readonly credentialRule: UserCredentialRule;
	public readonly expiringTimeoutMinutes: number;
	public readonly nameEncoding: UserCredentialNameEncoding;
	public readonly userName: string;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		let nameBuffer: Uint8Array;
		if (this.nameEncoding === UserCredentialNameEncoding.UTF16BE) {
			nameBuffer = stringToUint8ArrayUTF16BE(this.userName);
		} else {
			nameBuffer = Bytes.from(this.userName, "ascii");
		}
		this.payload = Bytes.alloc(15 + nameBuffer.length);
		this.payload[0] = this.userReportType;
		this.payload.writeUInt16BE(this.nextUserUniqueIdentifier, 1);
		this.payload[3] = this.userModifierType;
		this.payload.writeUInt16BE(this.userModifierNodeId, 4);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 6);
		this.payload[8] = this.userType;
		this.payload[9] = this.activeState & 0x0f;
		this.payload[10] = this.credentialRule;
		this.payload.writeUInt16BE(this.expiringTimeoutMinutes, 11);
		this.payload[13] = this.nameEncoding & 0x07;
		this.payload[14] = nameBuffer.length;
		if (nameBuffer.length > 0) {
			this.payload.set(nameBuffer, 15);
		}
		return super.serialize(ctx);
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		if (this.userUniqueIdentifier === 0) return true;

		// Only persist data for successful responses
		if (
			this.userReportType
				=== UserCredentialUserReportType.UserDeleted
		) {
			// Remove all values for this user
			const userId = this.userUniqueIdentifier;
			this.removeValue(
				ctx,
				UserCredentialCCValues.userType(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.userActiveState(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.credentialRule(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.expiringTimeoutMinutes(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.userName(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.userNameEncoding(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.userModifierType(userId),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.userModifierNodeId(userId),
			);
			return true;
		}

		if (
			this.userReportType
				!== UserCredentialUserReportType.ResponseToGet
			&& this.userReportType
				!== UserCredentialUserReportType.UserAdded
			&& this.userReportType
				!== UserCredentialUserReportType.UserModified
		) {
			return true;
		}

		const userId = this.userUniqueIdentifier;
		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.userType(userId),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userType(userId),
			this.userType,
		);
		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.userActiveState(userId),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userActiveState(userId),
			this.activeState,
		);
		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.credentialRule(userId),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.credentialRule(userId),
			this.credentialRule,
		);
		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.expiringTimeoutMinutes(userId),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.expiringTimeoutMinutes(userId),
			this.expiringTimeoutMinutes,
		);
		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.userName(userId),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userName(userId),
			this.userName,
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userNameEncoding(userId),
			this.nameEncoding,
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userModifierType(userId),
			this.userModifierType,
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.userModifierNodeId(userId),
			this.userModifierNodeId,
		);

		return true;
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user report type": getEnumMemberName(
					UserCredentialUserReportType,
					this.userReportType,
				),
				"next user unique identifier": this.nextUserUniqueIdentifier,
				"user modifier type": getEnumMemberName(
					UserCredentialModifierType,
					this.userModifierType,
				),
				"user modifier node id": this.userModifierNodeId,
				"user unique identifier": this.userUniqueIdentifier,
				"user type": getEnumMemberName(
					UserCredentialUserType,
					this.userType,
				),
				"active state": getEnumMemberName(
					UserCredentialActiveState,
					this.activeState,
				),
				"credential rule": getEnumMemberName(
					UserCredentialRule,
					this.credentialRule,
				),
				"expiring timeout (minutes)": this.expiringTimeoutMinutes,
				"name encoding": getEnumMemberName(
					UserCredentialNameEncoding,
					this.nameEncoding,
				),
				"user name": this.userName,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCUserGetOptions {
	userUniqueIdentifier: number;
}

@CCCommand(UserCredentialCommand.UserGet)
@expectedCCResponse(UserCredentialCCUserReport)
export class UserCredentialCCUserGet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCUserGetOptions>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
	}

	public userUniqueIdentifier: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserGet {
		validatePayload(raw.payload.length >= 2);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);
		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(2);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
			},
		};
	}
}

// ============================================================
// Group 3: Credential Management
// ============================================================

// @publicAPI
export interface UserCredentialCCCredentialSetOptions {
	userUniqueIdentifier: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	operationType: UserCredentialOperationType;
	credentialData?: Bytes;
}

@CCCommand(UserCredentialCommand.CredentialSet)
@useSupervision()
export class UserCredentialCCCredentialSet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCCredentialSetOptions>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.operationType = options.operationType;
		this.credentialData = options.credentialData ?? new Bytes();
	}

	public userUniqueIdentifier: number;
	public credentialType: UserCredentialType;
	public credentialSlot: number;
	public operationType: UserCredentialOperationType;
	public credentialData: Bytes;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialSet {
		validatePayload(raw.payload.length >= 6);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);
		const credentialType: UserCredentialType = raw.payload[2];
		const credentialSlot = raw.payload.readUInt16BE(3);
		const operationType: UserCredentialOperationType = raw.payload[5]
			& 0x03;

		// For Delete, credential data MAY be omitted
		let credentialData: Bytes | undefined;
		if (raw.payload.length >= 7) {
			const credentialLength = raw.payload[6];
			validatePayload(raw.payload.length >= 7 + credentialLength);
			credentialData = Bytes.from(
				raw.payload.subarray(7, 7 + credentialLength),
			);
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
			operationType,
			credentialData,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		if (this.operationType === UserCredentialOperationType.Delete) {
			this.payload = Bytes.alloc(6);
			this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
			this.payload[2] = this.credentialType;
			this.payload.writeUInt16BE(this.credentialSlot, 3);
			this.payload[5] = this.operationType & 0x03;
			return super.serialize(ctx);
		}

		this.payload = Bytes.alloc(7 + this.credentialData.length);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		this.payload[2] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 3);
		this.payload[5] = this.operationType & 0x03;
		this.payload[6] = this.credentialData.length;
		if (this.credentialData.length > 0) {
			this.payload.set(this.credentialData, 7);
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"operation type": getEnumMemberName(
					UserCredentialOperationType,
					this.operationType,
				),
				"credential data": credentialToLogString(
					this.credentialData,
				),
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCCredentialReportOptions {
	credentialReportType: UserCredentialCredentialReportType;
	userUniqueIdentifier: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	credentialReadBack: boolean;
	credentialLength: number;
	credentialData: Bytes;
	credentialModifierType: UserCredentialModifierType;
	credentialModifierNodeId: number;
	nextCredentialType: UserCredentialType;
	nextCredentialSlot: number;
}

@CCCommand(UserCredentialCommand.CredentialReport)
export class UserCredentialCCCredentialReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCCredentialReportOptions>,
	) {
		super(options);
		this.credentialReportType = options.credentialReportType;
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.credentialReadBack = options.credentialReadBack;
		this.credentialLength = options.credentialLength;
		this.credentialData = options.credentialData;
		this.credentialModifierType = options.credentialModifierType;
		this.credentialModifierNodeId = options.credentialModifierNodeId;
		this.nextCredentialType = options.nextCredentialType;
		this.nextCredentialSlot = options.nextCredentialSlot;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialReport {
		validatePayload(raw.payload.length >= 8);
		const credentialReportType: UserCredentialCredentialReportType =
			raw.payload[0];
		const userUniqueIdentifier = raw.payload.readUInt16BE(1);
		const credentialType: UserCredentialType = raw.payload[3];
		const credentialSlot = raw.payload.readUInt16BE(4);
		const credentialReadBack = !!(raw.payload[6] & 0x80);
		const credentialLength = raw.payload[7];
		validatePayload(raw.payload.length >= 8 + credentialLength + 6);
		const credentialData = Bytes.from(
			raw.payload.subarray(8, 8 + credentialLength),
		);

		let offset = 8 + credentialLength;
		const credentialModifierType: UserCredentialModifierType =
			raw.payload[offset];
		const credentialModifierNodeId = raw.payload.readUInt16BE(
			offset + 1,
		);
		const nextCredentialType: UserCredentialType = raw.payload[offset + 3];
		const nextCredentialSlot = raw.payload.readUInt16BE(offset + 4);

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialReportType,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
			credentialReadBack,
			credentialLength,
			credentialData,
			credentialModifierType,
			credentialModifierNodeId,
			nextCredentialType,
			nextCredentialSlot,
		});
	}

	public readonly credentialReportType: UserCredentialCredentialReportType;
	public readonly userUniqueIdentifier: number;
	public readonly credentialType: UserCredentialType;
	public readonly credentialSlot: number;
	public readonly credentialReadBack: boolean;
	public readonly credentialLength: number;
	public readonly credentialData: Bytes;
	public readonly credentialModifierType: UserCredentialModifierType;
	public readonly credentialModifierNodeId: number;
	public readonly nextCredentialType: UserCredentialType;
	public readonly nextCredentialSlot: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(14 + this.credentialData.length);
		this.payload[0] = this.credentialReportType;
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 1);
		this.payload[3] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 4);
		this.payload[6] = this.credentialReadBack ? 0x80 : 0x00;
		this.payload[7] = this.credentialData.length;
		if (this.credentialData.length > 0) {
			this.payload.set(this.credentialData, 8);
		}
		let offset = 8 + this.credentialData.length;
		this.payload[offset] = this.credentialModifierType;
		this.payload.writeUInt16BE(this.credentialModifierNodeId, offset + 1);
		this.payload[offset + 3] = this.nextCredentialType;
		this.payload.writeUInt16BE(this.nextCredentialSlot, offset + 4);
		return super.serialize(ctx);
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		if (
			this.credentialType === UserCredentialType.None
			|| this.credentialSlot === 0
		) {
			return true;
		}

		if (
			this.credentialReportType
				=== UserCredentialCredentialReportType.CredentialDeleted
		) {
			this.removeValue(
				ctx,
				UserCredentialCCValues.credential(
					this.credentialType,
					this.credentialSlot,
				),
			);
			this.removeValue(
				ctx,
				UserCredentialCCValues.credentialUserUniqueIdentifier(
					this.credentialType,
					this.credentialSlot,
				),
			);
			return true;
		}

		if (
			this.credentialReportType
				!== UserCredentialCredentialReportType.ResponseToGet
			&& this.credentialReportType
				!== UserCredentialCredentialReportType.CredentialAdded
			&& this.credentialReportType
				!== UserCredentialCredentialReportType.CredentialModified
		) {
			return true;
		}

		this.ensureMetadata(
			ctx,
			UserCredentialCCValues.credential(
				this.credentialType,
				this.credentialSlot,
			),
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.credential(
				this.credentialType,
				this.credentialSlot,
			),
			this.credentialData,
		);
		this.setValue(
			ctx,
			UserCredentialCCValues.credentialUserUniqueIdentifier(
				this.credentialType,
				this.credentialSlot,
			),
			this.userUniqueIdentifier,
		);

		return true;
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"credential report type": getEnumMemberName(
					UserCredentialCredentialReportType,
					this.credentialReportType,
				),
				"user unique identifier": this.userUniqueIdentifier,
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"credential read-back": this.credentialReadBack,
				"credential data": credentialToLogString(
					this.credentialData,
				),
				"credential modifier type": getEnumMemberName(
					UserCredentialModifierType,
					this.credentialModifierType,
				),
				"credential modifier node id": this.credentialModifierNodeId,
				"next credential type": getEnumMemberName(
					UserCredentialType,
					this.nextCredentialType,
				),
				"next credential slot": this.nextCredentialSlot,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCCredentialGetOptions {
	userUniqueIdentifier: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
}

@CCCommand(UserCredentialCommand.CredentialGet)
@expectedCCResponse(UserCredentialCCCredentialReport)
export class UserCredentialCCCredentialGet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCCredentialGetOptions>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
	}

	public userUniqueIdentifier: number;
	public credentialType: UserCredentialType;
	public credentialSlot: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialGet {
		validatePayload(raw.payload.length >= 5);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);
		const credentialType: UserCredentialType = raw.payload[2];
		const credentialSlot = raw.payload.readUInt16BE(3);

		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(5);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		this.payload[2] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 3);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
			},
		};
	}
}

// ============================================================
// Group 4: Credential Learn
// ============================================================

// @publicAPI
export interface UserCredentialCCCredentialLearnStartOptions {
	userUniqueIdentifier: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	operationType: UserCredentialOperationType;
	learnTimeout: number;
}

@CCCommand(UserCredentialCommand.CredentialLearnStart)
@useSupervision()
export class UserCredentialCCCredentialLearnStart extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCCredentialLearnStartOptions
		>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.operationType = options.operationType;
		this.learnTimeout = options.learnTimeout;
	}

	public userUniqueIdentifier: number;
	public credentialType: UserCredentialType;
	public credentialSlot: number;
	public operationType: UserCredentialOperationType;
	public learnTimeout: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialLearnStart {
		validatePayload(raw.payload.length >= 7);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);
		const credentialType: UserCredentialType = raw.payload[2];
		const credentialSlot = raw.payload.readUInt16BE(3);
		const operationType: UserCredentialOperationType = raw.payload[5]
			& 0x03;
		const learnTimeout = raw.payload[6];

		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
			operationType,
			learnTimeout,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(7);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		this.payload[2] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 3);
		this.payload[5] = this.operationType & 0x03;
		this.payload[6] = this.learnTimeout;
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"operation type": getEnumMemberName(
					UserCredentialOperationType,
					this.operationType,
				),
				"learn timeout": this.learnTimeout,
			},
		};
	}
}

@CCCommand(UserCredentialCommand.CredentialLearnCancel)
@useSupervision()
export class UserCredentialCCCredentialLearnCancel extends UserCredentialCC {}

// @publicAPI
export interface UserCredentialCCCredentialLearnReportOptions {
	learnStatus: number;
	userUniqueIdentifier: number;
	credentialType: UserCredentialType;
	credentialSlot: number;
	credentialLearnStepsRemaining: number;
}

@CCCommand(UserCredentialCommand.CredentialLearnReport)
export class UserCredentialCCCredentialLearnReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCCredentialLearnReportOptions
		>,
	) {
		super(options);
		this.learnStatus = options.learnStatus;
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.credentialLearnStepsRemaining =
			options.credentialLearnStepsRemaining;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialLearnReport {
		validatePayload(raw.payload.length >= 7);
		const learnStatus = raw.payload[0];
		const userUniqueIdentifier = raw.payload.readUInt16BE(1);
		const credentialType: UserCredentialType = raw.payload[3];
		const credentialSlot = raw.payload.readUInt16BE(4);
		const credentialLearnStepsRemaining = raw.payload[6];

		return new this({
			nodeId: ctx.sourceNodeId,
			learnStatus,
			userUniqueIdentifier,
			credentialType,
			credentialSlot,
			credentialLearnStepsRemaining,
		});
	}

	public readonly learnStatus: number;
	public readonly userUniqueIdentifier: number;
	public readonly credentialType: UserCredentialType;
	public readonly credentialSlot: number;
	public readonly credentialLearnStepsRemaining: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(7);
		this.payload[0] = this.learnStatus;
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 1);
		this.payload[3] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 4);
		this.payload[6] = this.credentialLearnStepsRemaining;
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"learn status": this.learnStatus,
				"user unique identifier": this.userUniqueIdentifier,
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"credential learn steps remaining":
					this.credentialLearnStepsRemaining,
			},
		};
	}
}

// ============================================================
// Group 5: Association
// ============================================================

// @publicAPI
export interface UserCredentialCCUserCredentialAssociationSetOptions {
	credentialType: UserCredentialType;
	credentialSlot: number;
	destinationUserUniqueIdentifier: number;
}

@CCCommand(UserCredentialCommand.UserCredentialAssociationSet)
@useSupervision()
export class UserCredentialCCUserCredentialAssociationSet
	extends UserCredentialCC
{
	public constructor(
		options: WithAddress<
			UserCredentialCCUserCredentialAssociationSetOptions
		>,
	) {
		super(options);
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.destinationUserUniqueIdentifier =
			options.destinationUserUniqueIdentifier;
	}

	public credentialType: UserCredentialType;
	public credentialSlot: number;
	public destinationUserUniqueIdentifier: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserCredentialAssociationSet {
		validatePayload(raw.payload.length >= 5);
		const credentialType: UserCredentialType = raw.payload[0];
		const credentialSlot = raw.payload.readUInt16BE(1);
		const destinationUserUniqueIdentifier = raw.payload.readUInt16BE(
			3,
		);

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialType,
			credentialSlot,
			destinationUserUniqueIdentifier,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(5);
		this.payload[0] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 1);
		this.payload.writeUInt16BE(
			this.destinationUserUniqueIdentifier,
			3,
		);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"destination user unique identifier":
					this.destinationUserUniqueIdentifier,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCUserCredentialAssociationReportOptions {
	credentialType: UserCredentialType;
	credentialSlot: number;
	destinationUserUniqueIdentifier: number;
	status: number;
}

@CCCommand(UserCredentialCommand.UserCredentialAssociationReport)
export class UserCredentialCCUserCredentialAssociationReport
	extends UserCredentialCC
{
	public constructor(
		options: WithAddress<
			UserCredentialCCUserCredentialAssociationReportOptions
		>,
	) {
		super(options);
		this.credentialType = options.credentialType;
		this.credentialSlot = options.credentialSlot;
		this.destinationUserUniqueIdentifier =
			options.destinationUserUniqueIdentifier;
		this.status = options.status;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserCredentialAssociationReport {
		validatePayload(raw.payload.length >= 6);
		const credentialType: UserCredentialType = raw.payload[0];
		const credentialSlot = raw.payload.readUInt16BE(1);
		const destinationUserUniqueIdentifier = raw.payload.readUInt16BE(
			3,
		);
		const status = raw.payload[5];

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialType,
			credentialSlot,
			destinationUserUniqueIdentifier,
			status,
		});
	}

	public readonly credentialType: UserCredentialType;
	public readonly credentialSlot: number;
	public readonly destinationUserUniqueIdentifier: number;
	public readonly status: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(6);
		this.payload[0] = this.credentialType;
		this.payload.writeUInt16BE(this.credentialSlot, 1);
		this.payload.writeUInt16BE(
			this.destinationUserUniqueIdentifier,
			3,
		);
		this.payload[5] = this.status;
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				"credential slot": this.credentialSlot,
				"destination user unique identifier":
					this.destinationUserUniqueIdentifier,
				status: this.status,
			},
		};
	}
}

// ============================================================
// Group 6: Checksums
// ============================================================

// @publicAPI
export interface UserCredentialCCAllUsersChecksumReportOptions {
	checksum: number;
}

@CCCommand(UserCredentialCommand.AllUsersChecksumReport)
export class UserCredentialCCAllUsersChecksumReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCAllUsersChecksumReportOptions
		>,
	) {
		super(options);
		this.checksum = options.checksum;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCAllUsersChecksumReport {
		validatePayload(raw.payload.length >= 2);
		const checksum = raw.payload.readUInt16BE(0);

		return new this({
			nodeId: ctx.sourceNodeId,
			checksum,
		});
	}

	public readonly checksum: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(2);
		this.payload.writeUInt16BE(this.checksum, 0);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: { checksum: this.checksum },
		};
	}
}

@CCCommand(UserCredentialCommand.AllUsersChecksumGet)
@expectedCCResponse(UserCredentialCCAllUsersChecksumReport)
export class UserCredentialCCAllUsersChecksumGet extends UserCredentialCC {}

// @publicAPI
export interface UserCredentialCCUserChecksumGetOptions {
	userUniqueIdentifier: number;
}

// @publicAPI
export interface UserCredentialCCUserChecksumReportOptions {
	userUniqueIdentifier: number;
	checksum: number;
}

@CCCommand(UserCredentialCommand.UserChecksumReport)
export class UserCredentialCCUserChecksumReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCUserChecksumReportOptions>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
		this.checksum = options.checksum;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserChecksumReport {
		validatePayload(raw.payload.length >= 4);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);
		const checksum = raw.payload.readUInt16BE(2);

		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
			checksum,
		});
	}

	public readonly userUniqueIdentifier: number;
	public readonly checksum: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(4);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		this.payload.writeUInt16BE(this.checksum, 2);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
				checksum: this.checksum,
			},
		};
	}
}

@CCCommand(UserCredentialCommand.UserChecksumGet)
@expectedCCResponse(UserCredentialCCUserChecksumReport)
export class UserCredentialCCUserChecksumGet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCUserChecksumGetOptions>,
	) {
		super(options);
		this.userUniqueIdentifier = options.userUniqueIdentifier;
	}

	public userUniqueIdentifier: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCUserChecksumGet {
		validatePayload(raw.payload.length >= 2);
		const userUniqueIdentifier = raw.payload.readUInt16BE(0);

		return new this({
			nodeId: ctx.sourceNodeId,
			userUniqueIdentifier,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(2);
		this.payload.writeUInt16BE(this.userUniqueIdentifier, 0);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"user unique identifier": this.userUniqueIdentifier,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCCredentialChecksumGetOptions {
	credentialType: UserCredentialType;
}

// @publicAPI
export interface UserCredentialCCCredentialChecksumReportOptions {
	credentialType: UserCredentialType;
	checksum: number;
}

@CCCommand(UserCredentialCommand.CredentialChecksumReport)
export class UserCredentialCCCredentialChecksumReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCCredentialChecksumReportOptions
		>,
	) {
		super(options);
		this.credentialType = options.credentialType;
		this.checksum = options.checksum;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialChecksumReport {
		validatePayload(raw.payload.length >= 3);
		const credentialType: UserCredentialType = raw.payload[0];
		const checksum = raw.payload.readUInt16BE(1);

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialType,
			checksum,
		});
	}

	public readonly credentialType: UserCredentialType;
	public readonly checksum: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(3);
		this.payload[0] = this.credentialType;
		this.payload.writeUInt16BE(this.checksum, 1);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
				checksum: this.checksum,
			},
		};
	}
}

@CCCommand(UserCredentialCommand.CredentialChecksumGet)
@expectedCCResponse(UserCredentialCCCredentialChecksumReport)
export class UserCredentialCCCredentialChecksumGet extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCCredentialChecksumGetOptions
		>,
	) {
		super(options);
		this.credentialType = options.credentialType;
	}

	public credentialType: UserCredentialType;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCCredentialChecksumGet {
		validatePayload(raw.payload.length >= 1);
		const credentialType: UserCredentialType = raw.payload[0];

		return new this({
			nodeId: ctx.sourceNodeId,
			credentialType,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(1);
		this.payload[0] = this.credentialType;
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"credential type": getEnumMemberName(
					UserCredentialType,
					this.credentialType,
				),
			},
		};
	}
}

// ============================================================
// Group 7: Admin PIN Code
// ============================================================

// @publicAPI
export interface UserCredentialCCAdminPinCodeSetOptions {
	pinCode: string;
}

@CCCommand(UserCredentialCommand.AdminPinCodeSet)
@useSupervision()
export class UserCredentialCCAdminPinCodeSet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCAdminPinCodeSetOptions>,
	) {
		super(options);
		this.pinCode = options.pinCode;
	}

	public pinCode: string;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCAdminPinCodeSet {
		validatePayload(raw.payload.length >= 1);
		const pinLength = raw.payload[0] & 0x0f;
		validatePayload(raw.payload.length >= 1 + pinLength);
		const pinCode = raw.payload
			.subarray(1, 1 + pinLength)
			.toString("ascii");

		return new this({
			nodeId: ctx.sourceNodeId,
			pinCode,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		validatePayload(this.pinCode.length <= 0x0f);
		this.payload = Bytes.concat([
			[this.pinCode.length & 0x0f],
			Bytes.from(this.pinCode, "ascii"),
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"PIN code": credentialToLogString(this.pinCode),
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCAdminPinCodeReportOptions {
	operationResult: UserCredentialAdminCodeOperationResult;
	pinCode: string;
}

@CCCommand(UserCredentialCommand.AdminPinCodeReport)
export class UserCredentialCCAdminPinCodeReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCAdminPinCodeReportOptions>,
	) {
		super(options);
		this.operationResult = options.operationResult;
		this.pinCode = options.pinCode;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCAdminPinCodeReport {
		validatePayload(raw.payload.length >= 1);
		const operationResult: UserCredentialAdminCodeOperationResult =
			(raw.payload[0] >> 4) & 0x0f;
		const pinLength = raw.payload[0] & 0x0f;
		validatePayload(raw.payload.length >= 1 + pinLength);
		const pinCode = raw.payload
			.subarray(1, 1 + pinLength)
			.toString("ascii");

		return new this({
			nodeId: ctx.sourceNodeId,
			operationResult,
			pinCode,
		});
	}

	public readonly operationResult: UserCredentialAdminCodeOperationResult;
	public readonly pinCode: string;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const pinBuffer = Bytes.from(this.pinCode, "ascii");
		this.payload = Bytes.alloc(1 + pinBuffer.length);
		this.payload[0] = ((this.operationResult & 0x0f) << 4)
			| (pinBuffer.length & 0x0f);
		if (pinBuffer.length > 0) {
			this.payload.set(pinBuffer, 1);
		}
		return super.serialize(ctx);
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		if (
			this.operationResult
				=== UserCredentialAdminCodeOperationResult.Modified
			|| this.operationResult
				=== UserCredentialAdminCodeOperationResult.ResponseToGet
		) {
			this.setValue(
				ctx,
				UserCredentialCCValues.adminPinCode,
				this.pinCode,
			);
		}

		return true;
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"operation result": getEnumMemberName(
					UserCredentialAdminCodeOperationResult,
					this.operationResult,
				),
				"PIN code": credentialToLogString(this.pinCode),
			},
		};
	}
}

@CCCommand(UserCredentialCommand.AdminPinCodeGet)
@expectedCCResponse(UserCredentialCCAdminPinCodeReport)
export class UserCredentialCCAdminPinCodeGet extends UserCredentialCC {}

// ============================================================
// Group 8: Key Locker V2
// ============================================================

// @publicAPI
export interface UserCredentialCCKeyLockerEntrySetOptions {
	entryType: UserCredentialKeyLockerEntryType;
	entrySlot: number;
	operationType: UserCredentialOperationType;
	entryData?: Bytes;
}

@CCCommand(UserCredentialCommand.KeyLockerEntrySet)
@useSupervision()
export class UserCredentialCCKeyLockerEntrySet extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCKeyLockerEntrySetOptions
		>,
	) {
		super(options);
		this.entryType = options.entryType;
		this.entrySlot = options.entrySlot;
		this.operationType = options.operationType;
		this.entryData = options.entryData ?? new Bytes();
	}

	public entryType: UserCredentialKeyLockerEntryType;
	public entrySlot: number;
	public operationType: UserCredentialOperationType;
	public entryData: Bytes;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCKeyLockerEntrySet {
		validatePayload(raw.payload.length >= 4);
		const entryType: UserCredentialKeyLockerEntryType = raw.payload[0];
		const entrySlot = raw.payload.readUInt16BE(1);
		const operationType: UserCredentialOperationType = raw.payload[3]
			& 0x03;

		// For Delete, entry data MAY be omitted
		let entryData: Bytes | undefined;
		if (raw.payload.length >= 6) {
			const entryDataLength = raw.payload.readUInt16BE(4);
			validatePayload(raw.payload.length >= 6 + entryDataLength);
			entryData = Bytes.from(
				raw.payload.subarray(6, 6 + entryDataLength),
			);
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			entryType,
			entrySlot,
			operationType,
			entryData,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		if (this.operationType === UserCredentialOperationType.Delete) {
			this.payload = Bytes.alloc(4);
			this.payload[0] = this.entryType;
			this.payload.writeUInt16BE(this.entrySlot, 1);
			this.payload[3] = this.operationType & 0x03;
			return super.serialize(ctx);
		}

		this.payload = Bytes.alloc(6 + this.entryData.length);
		this.payload[0] = this.entryType;
		this.payload.writeUInt16BE(this.entrySlot, 1);
		this.payload[3] = this.operationType & 0x03;
		this.payload.writeUInt16BE(this.entryData.length, 4);
		if (this.entryData.length > 0) {
			this.payload.set(this.entryData, 6);
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"entry type": getEnumMemberName(
					UserCredentialKeyLockerEntryType,
					this.entryType,
				),
				"entry slot": this.entrySlot,
				"operation type": getEnumMemberName(
					UserCredentialOperationType,
					this.operationType,
				),
				"entry data length": this.entryData.length,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCKeyLockerEntryReportOptions {
	occupied: boolean;
	entryType: UserCredentialKeyLockerEntryType;
	entrySlot: number;
}

@CCCommand(UserCredentialCommand.KeyLockerEntryReport)
export class UserCredentialCCKeyLockerEntryReport extends UserCredentialCC {
	public constructor(
		options: WithAddress<
			UserCredentialCCKeyLockerEntryReportOptions
		>,
	) {
		super(options);
		this.occupied = options.occupied;
		this.entryType = options.entryType;
		this.entrySlot = options.entrySlot;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCKeyLockerEntryReport {
		validatePayload(raw.payload.length >= 4);
		const occupied = !!(raw.payload[0] & 0x01);
		const entryType: UserCredentialKeyLockerEntryType = raw.payload[1];
		const entrySlot = raw.payload.readUInt16BE(2);

		return new this({
			nodeId: ctx.sourceNodeId,
			occupied,
			entryType,
			entrySlot,
		});
	}

	public readonly occupied: boolean;
	public readonly entryType: UserCredentialKeyLockerEntryType;
	public readonly entrySlot: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(4);
		this.payload[0] = this.occupied ? 0x01 : 0x00;
		this.payload[1] = this.entryType;
		this.payload.writeUInt16BE(this.entrySlot, 2);
		return super.serialize(ctx);
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		this.setValue(
			ctx,
			UserCredentialCCValues.keyLockerEntry(
				this.entryType,
				this.entrySlot,
			),
			this.occupied,
		);

		return true;
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				occupied: this.occupied,
				"entry type": getEnumMemberName(
					UserCredentialKeyLockerEntryType,
					this.entryType,
				),
				"entry slot": this.entrySlot,
			},
		};
	}
}

// @publicAPI
export interface UserCredentialCCKeyLockerEntryGetOptions {
	entryType: UserCredentialKeyLockerEntryType;
	entrySlot: number;
}

@CCCommand(UserCredentialCommand.KeyLockerEntryGet)
@expectedCCResponse(UserCredentialCCKeyLockerEntryReport)
export class UserCredentialCCKeyLockerEntryGet extends UserCredentialCC {
	public constructor(
		options: WithAddress<UserCredentialCCKeyLockerEntryGetOptions>,
	) {
		super(options);
		this.entryType = options.entryType;
		this.entrySlot = options.entrySlot;
	}

	public entryType: UserCredentialKeyLockerEntryType;
	public entrySlot: number;

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): UserCredentialCCKeyLockerEntryGet {
		validatePayload(raw.payload.length >= 3);
		const entryType: UserCredentialKeyLockerEntryType = raw.payload[0];
		const entrySlot = raw.payload.readUInt16BE(1);

		return new this({
			nodeId: ctx.sourceNodeId,
			entryType,
			entrySlot,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.alloc(3);
		this.payload[0] = this.entryType;
		this.payload.writeUInt16BE(this.entrySlot, 1);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"entry type": getEnumMemberName(
					UserCredentialKeyLockerEntryType,
					this.entryType,
				),
				"entry slot": this.entrySlot,
			},
		};
	}
}
