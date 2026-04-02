import {
	type UserCredentialCapability,
	UserCredentialOperationType,
	UserCredentialRule,
	UserCredentialType,
	UserCredentialUserType,
	UserIDStatus,
} from "@zwave-js/cc";
import { type UserCodeCCAPI, UserCodeCCValues } from "@zwave-js/cc/UserCodeCC";
import {
	type UserCredentialCCAPI,
	UserCredentialCCValues,
} from "@zwave-js/cc/UserCredentialCC";
import {
	CommandClasses,
	type SupervisionResult,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { DeviceConfigMixin } from "./80_DeviceConfig.js";

export interface UserCapabilities {
	maxUsers: number;
	supportedUserTypes: readonly UserCredentialUserType[];
	maxUserNameLength: number | undefined;
	supportedCredentialRules: readonly UserCredentialRule[];
}

export interface CredentialCapabilities {
	supportedCredentialTypes: ReadonlyMap<
		UserCredentialType,
		UserCredentialCapability
	>;
	supportsAdminCode: boolean;
	supportsAdminCodeDeactivation: boolean;
}

export interface UserData {
	userId: number;
	active: boolean;
	userType: UserCredentialUserType;
	userName?: string;
	credentialRule?: UserCredentialRule;
	expiringTimeoutMinutes?: number;
}

export interface CredentialData {
	userId: number;
	type: UserCredentialType;
	slot: number;
	data?: string | Uint8Array;
}

export interface SetUserOptions {
	active?: boolean;
	userType?: UserCredentialUserType;
	userName?: string;
	credentialRule?: UserCredentialRule;
	expiringTimeoutMinutes?: number;
}

export abstract class AccessControlMixin extends DeviceConfigMixin {
	// ── Backend selection ─────────────────────────────────────────

	// FIXME: This is technically not correct. A node could support both CCs,
	// and we may have to decide which one to use, or switch between them on
	// the fly using Version CC / migration.
	// This is not implemented yet, so checking for U3C first is fine for now.
	private get _usesUserCredentialCC(): boolean {
		return this.supportsCC(CommandClasses["User Credential"]);
	}

	private get _usesUserCodeCC(): boolean {
		return !this._usesUserCredentialCC
			&& this.supportsCC(CommandClasses["User Code"]);
	}

	// ── Capabilities ─────────────────────────────────────────────

	public getUserCapabilities():
		| UserCapabilities
		| undefined
	{
		if (this._usesUserCredentialCC) {
			return this._getUserCapabilities_U3C();
		} else if (this._usesUserCodeCC) {
			return this._getUserCapabilities_UC();
		}
		return undefined;
	}

	public getCredentialCapabilities():
		| CredentialCapabilities
		| undefined
	{
		if (this._usesUserCredentialCC) {
			return this._getCredentialCapabilities_U3C();
		} else if (this._usesUserCodeCC) {
			return this._getCredentialCapabilities_UC();
		}
		return undefined;
	}

	// ── User management ──────────────────────────────────────────

	public getUser(userId: number): UserData | undefined {
		if (this._usesUserCredentialCC) {
			return this._getUser_U3C(userId);
		} else if (this._usesUserCodeCC) {
			return this._getUser_UC(userId);
		}
		return undefined;
	}

	public getUsers(): UserData[] {
		if (this._usesUserCredentialCC) {
			return this._getUsers_U3C();
		} else if (this._usesUserCodeCC) {
			return this._getUsers_UC();
		}
		return [];
	}

	public async setUser(
		userId: number,
		options: SetUserOptions,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			return this._setUser_U3C(userId, options);
		} else if (this._usesUserCodeCC) {
			return this._setUser_UC(userId, options);
		}
		this._throwNoAccessControl();
	}

	public async deleteUser(
		userId: number,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.setUser({
				operationType: UserCredentialOperationType.Delete,
				userId,
			});
		} else if (this._usesUserCodeCC) {
			const existed = this._getUser_UC(userId) != undefined;
			const api = this._ucAPI();
			const result = await api.clear(userId);
			if (existed) {
				this._emit("user deleted", this as any, { userId });
				this._emit("credential deleted", this as any, {
					userId,
					credentialType: UserCredentialType.PINCode,
					credentialSlot: 1,
				});
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async deleteAllUsers(): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.setUser({
				operationType: UserCredentialOperationType.Delete,
				userId: 0,
			});
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			return api.clear(0);
		}
		this._throwNoAccessControl();
	}

	// ── Credential management ────────────────────────────────────

	public getCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		if (this._usesUserCredentialCC) {
			return this._getCredential_U3C(userId, type, slot);
		} else if (this._usesUserCodeCC) {
			return this._getCredential_UC(userId, type, slot);
		}
		return undefined;
	}

	public getCredentials(userId: number): CredentialData[] {
		if (this._usesUserCredentialCC) {
			return this._getCredentials_U3C(userId);
		} else if (this._usesUserCodeCC) {
			return this._getCredentials_UC(userId);
		}
		return [];
	}

	public async setCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
		data: string | Uint8Array,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			return this._setCredential_U3C(userId, type, slot, data);
		} else if (this._usesUserCodeCC) {
			return this._setCredential_UC(userId, type, slot, data);
		}
		this._throwNoAccessControl();
	}

	public async deleteCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.setCredential({
				operationType: UserCredentialOperationType.Delete,
				userId,
				credentialType: type,
				credentialSlot: slot,
			});
		} else if (this._usesUserCodeCC) {
			if (type !== UserCredentialType.PINCode || slot !== 1) {
				throw new ZWaveError(
					"This node only supports PINCode credentials in slot 1",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			const existed = this._getCredential_UC(userId, type, slot)
				!= undefined;
			const api = this._ucAPI();
			const result = await api.clear(userId);
			if (existed) {
				this._emit("credential deleted", this as any, {
					userId,
					credentialType: type,
					credentialSlot: slot,
				});
				this._emit("user deleted", this as any, { userId });
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async startCredentialLearn(
		userId: number,
		type: UserCredentialType,
		slot: number,
		timeout: number,
	): Promise<SupervisionResult | undefined> {
		if (!this._usesUserCredentialCC) {
			throw new ZWaveError(
				"This node does not support learning credentials",
				ZWaveErrorCodes.CC_NotSupported,
			);
		}
		const api = this._u3cAPI();
		return api.startCredentialLearn({
			userId,
			credentialType: type,
			credentialSlot: slot,
			operationType: UserCredentialOperationType.Add,
			learnTimeout: timeout,
		});
	}

	public async cancelCredentialLearn(): Promise<
		SupervisionResult | undefined
	> {
		if (!this._usesUserCredentialCC) {
			throw new ZWaveError(
				"This node does not support learning credentials",
				ZWaveErrorCodes.CC_NotSupported,
			);
		}
		const api = this._u3cAPI();
		return api.cancelCredentialLearn();
	}

	// ── Admin code ───────────────────────────────────────────────

	public async getAdminCode(): Promise<string | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.getAdminPinCode();
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			return api.getAdminCode();
		}
		return undefined;
	}

	public async setAdminCode(
		code: string,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.setAdminPinCode({ pinCode: code });
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			return api.setAdminCode(code);
		}
		this._throwNoAccessControl();
	}

	// ── Internal: API helpers ────────────────────────────────────

	private _ucAPI(): UserCodeCCAPI {
		return this.commandClasses["User Code"] as unknown as UserCodeCCAPI;
	}

	private _u3cAPI(): UserCredentialCCAPI {
		return this.commandClasses[
			"User Credential"
		] as unknown as UserCredentialCCAPI;
	}

	private _throwNoAccessControl(): never {
		throw new ZWaveError(
			"This node does not support managing users or credentials",
			ZWaveErrorCodes.CC_NotSupported,
		);
	}

	// ── Internal: User Credential CC (U3C) backend ───────────────

	private _getUserCapabilities_U3C(): UserCapabilities {
		return {
			maxUsers: this.getValue<number>(
				UserCredentialCCValues.supportedUsers.id,
			) ?? 0,
			supportedUserTypes: this.getValue<UserCredentialUserType[]>(
				UserCredentialCCValues.supportedUserTypes.id,
			) ?? [],
			maxUserNameLength: this.getValue<number>(
				UserCredentialCCValues.maxUserNameLength.id,
			) ?? undefined,
			supportedCredentialRules: this.getValue<UserCredentialRule[]>(
				UserCredentialCCValues.supportedCredentialRules.id,
			) ?? [],
		};
	}

	private _getCredentialCapabilities_U3C(): CredentialCapabilities {
		const supportedTypes = this.getValue<UserCredentialType[]>(
			UserCredentialCCValues.supportedCredentialTypes.id,
		) ?? [];

		const credentialTypes = new Map<
			UserCredentialType,
			UserCredentialCapability
		>();
		for (const type of supportedTypes) {
			const cap = this.getValue<UserCredentialCapability>(
				UserCredentialCCValues.credentialCapabilities(type).id,
			);
			if (cap) credentialTypes.set(type, cap);
		}

		return {
			supportedCredentialTypes: credentialTypes,
			supportsAdminCode: this.getValue<boolean>(
				UserCredentialCCValues.supportsAdminCode.id,
			) ?? false,
			supportsAdminCodeDeactivation: this.getValue<boolean>(
				UserCredentialCCValues.supportsAdminCodeDeactivation.id,
			) ?? false,
		};
	}

	private _getUser_U3C(userId: number): UserData | undefined {
		const userType = this.getValue<UserCredentialUserType>(
			UserCredentialCCValues.userType(userId).id,
		);
		if (userType == undefined) return undefined;

		return {
			userId,
			active: this.getValue<boolean>(
				UserCredentialCCValues.userActive(userId).id,
			) ?? false,
			userType,
			userName: this.getValue<string>(
				UserCredentialCCValues.userName(userId).id,
			) ?? undefined,
			credentialRule: this.getValue<UserCredentialRule>(
				UserCredentialCCValues.credentialRule(userId).id,
			) ?? undefined,
			expiringTimeoutMinutes: this.getValue<number>(
				UserCredentialCCValues.expiringTimeoutMinutes(userId).id,
			) || undefined,
		};
	}

	private _getUsers_U3C(): UserData[] {
		const maxUsers = this.getValue<number>(
			UserCredentialCCValues.supportedUsers.id,
		) ?? 0;
		const users: UserData[] = [];
		for (let userId = 1; userId <= maxUsers; userId++) {
			const user = this._getUser_U3C(userId);
			if (user) users.push(user);
		}
		return users;
	}

	private async _setUser_U3C(
		userId: number,
		options: SetUserOptions,
	): Promise<SupervisionResult | undefined> {
		const api = this._u3cAPI();
		const existing = this._getUser_U3C(userId);
		const operationType = existing
			? UserCredentialOperationType.Modify
			: UserCredentialOperationType.Add;

		const userType = options.userType
			?? existing?.userType
			?? UserCredentialUserType.General;

		if (userType === UserCredentialUserType.Expiring) {
			return api.setUser({
				operationType,
				userId,
				active: options.active ?? existing?.active ?? true,
				userType,
				expiringTimeoutMinutes: options.expiringTimeoutMinutes
					?? existing?.expiringTimeoutMinutes
					?? 0,
				credentialRule: options.credentialRule
					?? existing?.credentialRule,
				userName: options.userName ?? existing?.userName,
			});
		}

		return api.setUser({
			operationType,
			userId,
			active: options.active ?? existing?.active ?? true,
			userType,
			credentialRule: options.credentialRule ?? existing?.credentialRule,
			userName: options.userName ?? existing?.userName,
		});
	}

	private _getCredential_U3C(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		const data = this.getValue<Uint8Array>(
			UserCredentialCCValues.credential(userId, type, slot).id,
		);
		if (data == undefined) return undefined;
		return { userId, type, slot, data };
	}

	private _getCredentials_U3C(userId: number): CredentialData[] {
		const credentials: CredentialData[] = [];
		const supportedTypes = this.getValue<UserCredentialType[]>(
			UserCredentialCCValues.supportedCredentialTypes.id,
		) ?? [];

		for (const type of supportedTypes) {
			const cap = this.getValue<UserCredentialCapability>(
				UserCredentialCCValues.credentialCapabilities(type).id,
			);
			if (!cap) continue;
			for (let slot = 1; slot <= cap.numberOfCredentialSlots; slot++) {
				const cred = this._getCredential_U3C(userId, type, slot);
				if (cred) credentials.push(cred);
			}
		}
		return credentials;
	}

	private async _setCredential_U3C(
		userId: number,
		type: UserCredentialType,
		slot: number,
		data: string | Uint8Array,
	): Promise<SupervisionResult | undefined> {
		const api = this._u3cAPI();
		const existing = this._getCredential_U3C(userId, type, slot);
		const credentialData = typeof data === "string"
			? Bytes.from(data, "utf-8")
			: Bytes.from(data);
		return api.setCredential({
			operationType: existing
				? UserCredentialOperationType.Modify
				: UserCredentialOperationType.Add,
			userId,
			credentialType: type,
			credentialSlot: slot,
			credentialData,
		});
	}

	// ── Internal: User Code CC backend ───────────────────────────

	private _getUserCapabilities_UC(): UserCapabilities {
		const supportedStatuses = this.getValue<UserIDStatus[]>(
			UserCodeCCValues.supportedUserIDStatuses.id,
		) ?? [];
		const supportedUserTypes: UserCredentialUserType[] = [
			UserCredentialUserType.General,
		];
		if (supportedStatuses.includes(UserIDStatus.Messaging)) {
			supportedUserTypes.push(UserCredentialUserType.NonAccess);
		}

		return {
			maxUsers: this.getValue<number>(
				UserCodeCCValues.supportedUsers.id,
			) ?? 0,
			supportedUserTypes,
			maxUserNameLength: undefined,
			supportedCredentialRules: [UserCredentialRule.Single],
		};
	}

	private _getCredentialCapabilities_UC(): CredentialCapabilities {
		const credentialTypes = new Map<
			UserCredentialType,
			UserCredentialCapability
		>();
		credentialTypes.set(UserCredentialType.PINCode, {
			numberOfCredentialSlots: 1,
			minCredentialLength: 4,
			maxCredentialLength: 10,
			maxCredentialHashLength: 0,
			supportsCredentialLearn: false,
		});

		return {
			supportedCredentialTypes: credentialTypes,
			supportsAdminCode: this.getValue<boolean>(
				UserCodeCCValues.supportsAdminCode.id,
			) ?? false,
			supportsAdminCodeDeactivation: this.getValue<boolean>(
				UserCodeCCValues.supportsAdminCodeDeactivation.id,
			) ?? false,
		};
	}

	private _getUser_UC(userId: number): UserData | undefined {
		const status = this.getValue<UserIDStatus>(
			UserCodeCCValues.userIdStatus(userId).id,
		);
		if (
			status == undefined
			|| status === UserIDStatus.Available
			|| status === UserIDStatus.StatusNotAvailable
			|| status === UserIDStatus.PassageMode
		) {
			return undefined;
		}

		let active: boolean;
		let userType: UserCredentialUserType;
		switch (status) {
			case UserIDStatus.Enabled:
				active = true;
				userType = UserCredentialUserType.General;
				break;
			case UserIDStatus.Disabled:
				active = false;
				userType = UserCredentialUserType.General;
				break;
			case UserIDStatus.Messaging:
				active = true;
				userType = UserCredentialUserType.NonAccess;
				break;
			default:
				active = true;
				userType = UserCredentialUserType.General;
				break;
		}

		return { userId, active, userType };
	}

	private _getUsers_UC(): UserData[] {
		const maxUsers = this.getValue<number>(
			UserCodeCCValues.supportedUsers.id,
		) ?? 0;
		const users: UserData[] = [];
		for (let userId = 1; userId <= maxUsers; userId++) {
			const user = this._getUser_UC(userId);
			if (user) users.push(user);
		}
		return users;
	}

	private async _setUser_UC(
		userId: number,
		options: SetUserOptions,
	): Promise<SupervisionResult | undefined> {
		const api = this._ucAPI();
		const existing = this._getUser_UC(userId);

		const active = options.active ?? existing?.active ?? true;
		const userType = options.userType
			?? existing?.userType
			?? UserCredentialUserType.General;

		// Map back to UserIDStatus
		let status: UserIDStatus;
		if (!active) {
			status = UserIDStatus.Disabled;
		} else if (userType === UserCredentialUserType.NonAccess) {
			status = UserIDStatus.Messaging;
		} else {
			status = UserIDStatus.Enabled;
		}

		// We need the existing code to set the status
		const existingCode = this.getValue<string>(
			UserCodeCCValues.userCode(userId).id,
		) ?? "";

		const result = await api.set(userId, status as number, existingCode);
		const userData: UserData = { userId, active, userType };
		this._emit(
			existing ? "user modified" : "user added",
			this as any,
			userData,
		);
		return result;
	}

	private _getCredential_UC(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		if (type !== UserCredentialType.PINCode || slot !== 1) return undefined;
		const status = this.getValue<UserIDStatus>(
			UserCodeCCValues.userIdStatus(userId).id,
		);
		if (
			status == undefined
			|| status === UserIDStatus.Available
			|| status === UserIDStatus.StatusNotAvailable
		) {
			return undefined;
		}
		const data = this.getValue<string>(
			UserCodeCCValues.userCode(userId).id,
		);
		if (data == undefined) return undefined;
		return { userId, type, slot, data };
	}

	private _getCredentials_UC(userId: number): CredentialData[] {
		const cred = this._getCredential_UC(
			userId,
			UserCredentialType.PINCode,
			1,
		);
		return cred ? [cred] : [];
	}

	private async _setCredential_UC(
		userId: number,
		type: UserCredentialType,
		slot: number,
		data: string | Uint8Array,
	): Promise<SupervisionResult | undefined> {
		if (type !== UserCredentialType.PINCode || slot !== 1) {
			throw new ZWaveError(
				"This node only supports PINCode credentials in slot 1",
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		const api = this._ucAPI();

		// Determine the current status; default to Enabled for new users
		let status = this.getValue<UserIDStatus>(
			UserCodeCCValues.userIdStatus(userId).id,
		);
		if (
			status == undefined
			|| status === UserIDStatus.Available
		) {
			status = UserIDStatus.Enabled;
		}

		const existingCred = this._getCredential_UC(userId, type, slot);

		const codeData = typeof data === "string"
			? data
			: Bytes.from(data);
		const result = await api.set(userId, status as number, codeData);
		this._emit(
			existingCred ? "credential modified" : "credential added",
			this as any,
			{
				userId,
				credentialType: type,
				credentialSlot: slot,
				data,
			},
		);
		return result;
	}
}
