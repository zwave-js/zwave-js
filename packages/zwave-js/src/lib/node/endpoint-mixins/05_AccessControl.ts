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
	type MaybeNotKnown,
	type SupervisionResult,
	type ValueID,
	ZWaveError,
	ZWaveErrorCodes,
	isUnsupervisedOrSucceeded,
	supervisedCommandSucceeded,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { EndpointBase } from "./00_Base.js";

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

/** Defines functionality of Z-Wave endpoints related to managing users and credentials for access control */
export interface EndpointAccessControl {
	/**
	 * Returns the user-related capabilities of this endpoint.
	 * This method uses cached information from the most recent interview.
	 */
	getUserCapabilitiesCached(): UserCapabilities | undefined;

	/**
	 * Returns the credential-related capabilities of this endpoint.
	 * This method uses cached information from the most recent interview.
	 */
	getCredentialCapabilitiesCached(): CredentialCapabilities | undefined;

	/**
	 * Returns the data for the user with the given ID.
	 * This communicates with the node to retrieve fresh information.
	 */
	getUser(userId: number): Promise<UserData | undefined>;

	/**
	 * Returns the data for the user with the given ID.
	 * This method uses cached information from the most recent interview.
	 */
	getUserCached(userId: number): UserData | undefined;

	/**
	 * Returns the data for all configured users.
	 * This communicates with the node to retrieve fresh information.
	 */
	getUsers(): Promise<UserData[]>;

	/**
	 * Returns the data for all configured users.
	 * This method uses cached information from the most recent interview.
	 */
	getUsersCached(): UserData[];

	/**
	 * Creates or updates the user with the given ID.
	 * This communicates with the node.
	 */
	setUser(
		userId: number,
		options: SetUserOptions,
	): Promise<SupervisionResult | undefined>;

	/**
	 * Deletes the user with the given ID and all of their credentials.
	 * This communicates with the node.
	 */
	deleteUser(userId: number): Promise<SupervisionResult | undefined>;

	/**
	 * Deletes all users and their credentials.
	 * This communicates with the node.
	 */
	deleteAllUsers(): Promise<SupervisionResult | undefined>;

	/**
	 * Returns the data for a specific credential.
	 * This communicates with the node to retrieve fresh information.
	 */
	getCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): Promise<CredentialData | undefined>;

	/**
	 * Returns the data for a specific credential.
	 * This method uses cached information from the most recent interview.
	 */
	getCredentialCached(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined;

	/**
	 * Returns all credentials for the given user.
	 * This communicates with the node to retrieve fresh information.
	 */
	getCredentials(userId: number): Promise<CredentialData[]>;

	/**
	 * Returns all credentials for the given user.
	 * This method uses cached information from the most recent interview.
	 */
	getCredentialsCached(userId: number): CredentialData[];

	/**
	 * Creates or updates a credential for the given user.
	 * This communicates with the node.
	 */
	setCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
		data: string | Uint8Array,
	): Promise<SupervisionResult | undefined>;

	/**
	 * Deletes the given credential.
	 * This communicates with the node.
	 */
	deleteCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): Promise<SupervisionResult | undefined>;

	/**
	 * Starts a learn process for the given credential slot, allowing a user
	 * to input a credential directly on the device.
	 * Only supported on nodes using the User Credential CC.
	 * This communicates with the node.
	 */
	startCredentialLearn(
		userId: number,
		type: UserCredentialType,
		slot: number,
		timeout?: number,
	): Promise<SupervisionResult | undefined>;

	/**
	 * Cancels an ongoing credential learn process.
	 * Only supported on nodes using the User Credential CC.
	 * This communicates with the node.
	 */
	cancelCredentialLearn(): Promise<SupervisionResult | undefined>;

	/**
	 * Retrieves the admin code from the node.
	 * This communicates with the node to retrieve fresh information.
	 */
	getAdminCode(): Promise<string | undefined>;

	/**
	 * Sets the admin code on the node.
	 * This communicates with the node.
	 */
	setAdminCode(code: string): Promise<SupervisionResult | undefined>;
}

const NON_PIN_CHARS = /[^0-9]/;

/**
 * Whether the supported ASCII characters indicate a non-PIN device.
 * When unknown (V1 nodes), defaults to PIN-only per the spec.
 */
function supportsNonPINChars(supportedASCIIChars: string | undefined): boolean {
	return supportedASCIIChars != undefined
		&& NON_PIN_CHARS.test(supportedASCIIChars);
}

export class AccessControlMixin extends EndpointBase
	implements EndpointAccessControl
{
	/** Read a cached value from the node's value DB */
	private _getValue<T = unknown>(valueId: ValueID): MaybeNotKnown<T> {
		return this.tryGetNode()?.getValue(valueId);
	}

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

	public getUserCapabilitiesCached():
		| UserCapabilities
		| undefined
	{
		if (this._usesUserCredentialCC) {
			return {
				maxUsers: this._getValue<number>(
					UserCredentialCCValues.supportedUsers.endpoint(this.index),
				) ?? 0,
				supportedUserTypes: this._getValue<UserCredentialUserType[]>(
					UserCredentialCCValues.supportedUserTypes.endpoint(
						this.index,
					),
				) ?? [],
				maxUserNameLength: this._getValue<number>(
					UserCredentialCCValues.maxUserNameLength.endpoint(
						this.index,
					),
				) ?? undefined,
				supportedCredentialRules: this._getValue<UserCredentialRule[]>(
					UserCredentialCCValues.supportedCredentialRules.endpoint(
						this.index,
					),
				) ?? [],
			};
		} else if (this._usesUserCodeCC) {
			const supportedStatuses = this._getValue<UserIDStatus[]>(
				UserCodeCCValues.supportedUserIDStatuses.endpoint(this.index),
			) ?? [];
			const supportedUserTypes: UserCredentialUserType[] = [
				UserCredentialUserType.General,
			];
			// User Code CC has no concept of user types, but the Messaging
			// status is the closest equivalent to a NonAccess user
			if (supportedStatuses.includes(UserIDStatus.Messaging)) {
				supportedUserTypes.push(UserCredentialUserType.NonAccess);
			}

			return {
				maxUsers: this._getValue<number>(
					UserCodeCCValues.supportedUsers.endpoint(this.index),
				) ?? 0,
				supportedUserTypes,
				// User Code CC does not support user names or credential rules
				maxUserNameLength: undefined,
				supportedCredentialRules: [UserCredentialRule.Single],
			};
		}
		return undefined;
	}

	public getCredentialCapabilitiesCached():
		| CredentialCapabilities
		| undefined
	{
		if (this._usesUserCredentialCC) {
			const supportedTypes = this._getValue<UserCredentialType[]>(
				UserCredentialCCValues.supportedCredentialTypes.endpoint(
					this.index,
				),
			) ?? [];

			const credentialTypes = new Map<
				UserCredentialType,
				UserCredentialCapability
			>();
			for (const type of supportedTypes) {
				const cap = this._getValue<UserCredentialCapability>(
					UserCredentialCCValues.credentialCapabilities(type)
						.endpoint(
							this.index,
						),
				);
				if (cap) credentialTypes.set(type, cap);
			}

			return {
				supportedCredentialTypes: credentialTypes,
				supportsAdminCode: this._getValue<boolean>(
					UserCredentialCCValues.supportsAdminCode.endpoint(
						this.index,
					),
				) ?? false,
				supportsAdminCodeDeactivation: this._getValue<boolean>(
					UserCredentialCCValues.supportsAdminCodeDeactivation
						.endpoint(this.index),
				) ?? false,
			};
		} else if (this._usesUserCodeCC) {
			// User Code CC only supports a single credential per user
			// with a length of 4-10 characters (CC:0063.01.01.11.006).
			// Despite the spec calling them "PIN codes", v1 devices often
			// accept arbitrary characters. Use the widest matching type.
			const credentialTypes = new Map<
				UserCredentialType,
				UserCredentialCapability
			>();
			credentialTypes.set(this._ucCredentialType, {
				numberOfCredentialSlots: 1,
				minCredentialLength: 4,
				maxCredentialLength: 10,
				maxCredentialHashLength: 0,
				supportsCredentialLearn: false,
			});

			return {
				supportedCredentialTypes: credentialTypes,
				supportsAdminCode: this._getValue<boolean>(
					UserCodeCCValues.supportsAdminCode.endpoint(this.index),
				) ?? false,
				supportsAdminCodeDeactivation: this._getValue<boolean>(
					UserCodeCCValues.supportsAdminCodeDeactivation.endpoint(
						this.index,
					),
				) ?? false,
			};
		}
		return undefined;
	}

	public async getUser(userId: number): Promise<UserData | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const result = await api.getUser(userId);
			if (!result?.userId) return undefined;
			return {
				userId: result.userId,
				active: result.active ?? false,
				userType: result.userType ?? UserCredentialUserType.General,
				userName: result.userName ?? undefined,
				credentialRule: result.credentialRule ?? undefined,
				expiringTimeoutMinutes: result.expiringTimeoutMinutes
					|| undefined,
			};
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			const result = await api.get(userId);
			if (!result) return undefined;
			return this._mapUserCodeStatusToUserData(
				userId,
				result.userIdStatus,
			);
		}
		return undefined;
	}

	public getUserCached(userId: number): UserData | undefined {
		if (this._usesUserCredentialCC) {
			return this._getUserCached_U3C(userId);
		} else if (this._usesUserCodeCC) {
			return this._getUserCached_UC(userId);
		}
		return undefined;
	}

	public async getUsers(): Promise<UserData[]> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const users: UserData[] = [];
			// Requesting userId 0 gives us the first user
			let nextUserId = 0;
			do {
				const result = await api.getUser(nextUserId);
				if (!result?.userId) break;
				users.push({
					userId: result.userId,
					active: result.active ?? false,
					userType: result.userType
						?? UserCredentialUserType.General,
					userName: result.userName ?? undefined,
					credentialRule: result.credentialRule ?? undefined,
					expiringTimeoutMinutes: result.expiringTimeoutMinutes
						|| undefined,
				});
				nextUserId = result.nextUserId;
			} while (nextUserId > 0);
			return users;
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			const maxUsers = await api.getUsersCount();
			if (!maxUsers) return [];

			const users: UserData[] = [];
			const supportsBulk = !!this._getValue<boolean>(
				UserCodeCCValues.supportsMultipleUserCodeReport.endpoint(
					this.index,
				),
			);

			if (supportsBulk) {
				let nextUserId = 1;
				while (nextUserId > 0 && nextUserId <= maxUsers) {
					const response = await api.get(nextUserId, true);
					if (!response) break;
					users.push(
						...response.userCodes
							.map((entry) =>
								this._mapUserCodeStatusToUserData(
									entry.userId,
									entry.userIdStatus,
								)
							)
							.filter((u) => u != undefined),
					);
					nextUserId = response.nextUserId;
				}
			} else {
				for (let userId = 1; userId <= maxUsers; userId++) {
					const result = await api.get(userId);
					if (!result) continue;
					const user = this._mapUserCodeStatusToUserData(
						userId,
						result.userIdStatus,
					);
					if (user) users.push(user);
				}
			}
			return users;
		}
		return [];
	}

	public getUsersCached(): UserData[] {
		if (this._usesUserCredentialCC) {
			const maxUsers = this._getValue<number>(
				UserCredentialCCValues.supportedUsers.endpoint(this.index),
			) ?? 0;
			const users: UserData[] = [];
			for (let userId = 1; userId <= maxUsers; userId++) {
				const user = this._getUserCached_U3C(userId);
				if (user) users.push(user);
			}
			return users;
		} else if (this._usesUserCodeCC) {
			const maxUsers = this._getValue<number>(
				UserCodeCCValues.supportedUsers.endpoint(this.index),
			) ?? 0;
			const users: UserData[] = [];
			for (let userId = 1; userId <= maxUsers; userId++) {
				const user = this._getUserCached_UC(userId);
				if (user) users.push(user);
			}
			return users;
		}
		return [];
	}

	public async setUser(
		userId: number,
		options: SetUserOptions,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const existing = this._getUserCached_U3C(userId);
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
				credentialRule: options.credentialRule
					?? existing?.credentialRule,
				userName: options.userName ?? existing?.userName,
			});
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			const existing = this._getUserCached_UC(userId);
			const existingStatus = this._getValue<UserIDStatus>(
				UserCodeCCValues.userIdStatus(userId).endpoint(this.index),
			);

			const active = options.active ?? existing?.active ?? true;
			const userType = options.userType
				?? existing?.userType
				?? UserCredentialUserType.General;

			// Reverse the unified active/userType model back to UserIDStatus
			let status: UserIDStatus;
			if (!active) {
				status = UserIDStatus.Disabled;
			} else if (userType === UserCredentialUserType.NonAccess) {
				status = UserIDStatus.Messaging;
			} else {
				status = UserIDStatus.Enabled;
			}

			// User Code CC requires sending the code along with every status
			// change, so we re-send the existing code to preserve it
			const existingCode = this._getValue<string>(
				UserCodeCCValues.userCode(userId).endpoint(this.index),
			);
			if (!existingCode) {
				throw new ZWaveError(
					"User Code CC requires a credential to be set before modifying the user. Use setCredential() first.",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			const result = await api.set(
				userId,
				status as number,
				existingCode,
			);
			let succeeded: boolean;
			if (result == undefined) {
				// Unsupervised - verify the change
				const verified = await api.get(userId);
				const verifiedStatus = verified?.userIdStatus;
				succeeded = verifiedStatus != undefined
					&& verifiedStatus !== existingStatus
					&& verifiedStatus !== UserIDStatus.Available;
			} else {
				succeeded = supervisedCommandSucceeded(result);
			}
			if (succeeded) {
				const node = this.tryGetNode();
				if (node) {
					const userData: UserData = { userId, active, userType };
					node.emit(
						existing ? "user modified" : "user added",
						this,
						userData,
					);
				}
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async deleteUser(
		userId: number,
	): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const result = await api.setUser({
				operationType: UserCredentialOperationType.Delete,
				userId,
			});
			if (isUnsupervisedOrSucceeded(result)) {
				this._purgeCachedCredentials(userId);
			}
			return result;
		} else if (this._usesUserCodeCC) {
			// User Code CC ties each user to their code, so clearing
			// the code implicitly deletes the user and vice versa
			const existed = this._getUserCached_UC(userId) != undefined;
			const api = this._ucAPI();
			const result = await api.clear(userId);
			let succeeded: boolean;
			if (result == undefined) {
				// Unsupervised - verify the change
				const verified = await api.get(userId);
				succeeded = existed
					&& verified?.userIdStatus === UserIDStatus.Available;
			} else {
				succeeded = supervisedCommandSucceeded(result) && existed;
			}
			if (succeeded) {
				const node = this.tryGetNode();
				if (node) {
					node.emit("user deleted", this, { userId });
					node.emit("credential deleted", this, {
						userId,
						credentialType: this._ucCredentialType,
						credentialSlot: 1,
					});
				}
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async deleteAllUsers(): Promise<SupervisionResult | undefined> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const result = await api.setUser({
				operationType: UserCredentialOperationType.Delete,
				userId: 0,
			});
			if (isUnsupervisedOrSucceeded(result)) {
				this._purgeAllCachedUsersAndCredentials();
			}
			return result;
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			const result = await api.clear(0);
			// Verifying all users being deleted is unrealistic
			// since there can be up to 65535 users. So we just
			// assume it worked when the command was not supervised.
			if (isUnsupervisedOrSucceeded(result)) {
				this._purgeAllCachedUserCodes();
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async getCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): Promise<CredentialData | undefined> {
		this._assertValidSlot(type, slot);

		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const result = await api.getCredential(userId, type, slot);
			if (!result?.credentialSlot) return undefined;
			return {
				userId: result.userId,
				type: result.credentialType,
				slot: result.credentialSlot,
				data: result.credentialData,
			};
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();
			const result = await api.get(userId);
			if (!result) return undefined;
			if (
				result.userIdStatus === UserIDStatus.Available
				|| result.userIdStatus === UserIDStatus.StatusNotAvailable
			) {
				return undefined;
			}
			return { userId, type, slot, data: result.userCode };
		}
		return undefined;
	}

	public getCredentialCached(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		this._assertValidSlot(type, slot);

		if (this._usesUserCredentialCC) {
			return this._getCredentialCached_U3C(userId, type, slot);
		} else if (this._usesUserCodeCC) {
			return this._getCredentialCached_UC(userId, type, slot);
		}
		return undefined;
	}

	public async getCredentials(userId: number): Promise<CredentialData[]> {
		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const credentials: CredentialData[] = [];
			// Starting from type 0 / slot 0 gives us the first credential for the user
			let nextCredType: UserCredentialType = UserCredentialType.None;
			let nextCredSlot = 0;
			do {
				const result = await api.getCredential(
					userId,
					nextCredType,
					nextCredSlot,
				);
				if (!result?.credentialSlot) break;
				credentials.push({
					userId: result.userId,
					type: result.credentialType,
					slot: result.credentialSlot,
					data: result.credentialData,
				});
				nextCredType = result.nextCredentialType;
				nextCredSlot = result.nextCredentialSlot;
			} while (
				nextCredType !== UserCredentialType.None
				|| nextCredSlot !== 0
			);
			return credentials;
		} else if (this._usesUserCodeCC) {
			const cred = await this.getCredential(
				userId,
				this._ucCredentialType,
				1,
			);
			return cred ? [cred] : [];
		}
		return [];
	}

	public getCredentialsCached(userId: number): CredentialData[] {
		if (this._usesUserCredentialCC) {
			const credentials: CredentialData[] = [];
			const supportedTypes = this._getValue<UserCredentialType[]>(
				UserCredentialCCValues.supportedCredentialTypes.endpoint(
					this.index,
				),
			) ?? [];

			for (const type of supportedTypes) {
				const cap = this._getValue<UserCredentialCapability>(
					UserCredentialCCValues.credentialCapabilities(type)
						.endpoint(
							this.index,
						),
				);
				if (!cap) continue;
				for (
					let slot = 1;
					slot <= cap.numberOfCredentialSlots;
					slot++
				) {
					const cred = this._getCredentialCached_U3C(
						userId,
						type,
						slot,
					);
					if (cred) credentials.push(cred);
				}
			}
			return credentials;
		} else if (this._usesUserCodeCC) {
			const cred = this._getCredentialCached_UC(
				userId,
				this._ucCredentialType,
				1,
			);
			return cred ? [cred] : [];
		}
		return [];
	}

	public async setCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
		data: string | Uint8Array,
	): Promise<SupervisionResult | undefined> {
		this._assertValidSlot(type, slot);

		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			const existing = this._getCredentialCached_U3C(userId, type, slot);
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
		} else if (this._usesUserCodeCC) {
			const api = this._ucAPI();

			// Determine the current status; default to Enabled for new users
			const existingStatus = this._getValue<UserIDStatus>(
				UserCodeCCValues.userIdStatus(userId).endpoint(this.index),
			);
			const status = (
					existingStatus == undefined
					|| existingStatus === UserIDStatus.Available
				)
				? UserIDStatus.Enabled
				: existingStatus;

			const existingCred = this._getCredentialCached_UC(
				userId,
				type,
				slot,
			);

			const codeData = typeof data === "string"
				? data
				: Bytes.from(data);
			const result = await api.set(
				userId,
				status as number,
				codeData,
			);
			let succeeded: boolean;
			if (result == undefined) {
				const verified = await api.get(userId);
				succeeded = verified?.userCode === codeData;
			} else {
				succeeded = supervisedCommandSucceeded(result);
			}
			if (succeeded) {
				const node = this.tryGetNode();
				if (node) {
					node.emit(
						existingCred
							? "credential modified"
							: "credential added",
						this,
						{
							userId,
							credentialType: type,
							credentialSlot: slot,
							data,
						},
					);
				}
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async deleteCredential(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): Promise<SupervisionResult | undefined> {
		this._assertValidSlot(type, slot);

		if (this._usesUserCredentialCC) {
			const api = this._u3cAPI();
			return api.setCredential({
				operationType: UserCredentialOperationType.Delete,
				userId,
				credentialType: type,
				credentialSlot: slot,
			});
		} else if (this._usesUserCodeCC) {
			// User Code CC ties each user to their code, so clearing
			// the credential also deletes the user
			const existed = this._getCredentialCached_UC(userId, type, slot)
				!= undefined;
			const api = this._ucAPI();
			const result = await api.clear(userId);
			let succeeded: boolean;
			if (result == undefined) {
				const verified = await api.get(userId);
				succeeded = existed
					&& verified?.userIdStatus === UserIDStatus.Available;
			} else {
				succeeded = supervisedCommandSucceeded(result) && existed;
			}
			if (succeeded) {
				const node = this.tryGetNode();
				if (node) {
					node.emit("credential deleted", this, {
						userId,
						credentialType: type,
						credentialSlot: slot,
					});
					node.emit("user deleted", this, { userId });
				}
			}
			return result;
		}
		this._throwNoAccessControl();
	}

	public async startCredentialLearn(
		userId: number,
		type: UserCredentialType,
		slot: number,
		timeout?: number,
	): Promise<SupervisionResult | undefined> {
		if (!this._usesUserCredentialCC) {
			throw new ZWaveError(
				"This node does not support learning credentials",
				ZWaveErrorCodes.CC_NotSupported,
			);
		}

		this._assertValidSlot(type, slot);

		const existing = this._getCredentialCached_U3C(userId, type, slot);
		const operationType = existing
			? UserCredentialOperationType.Modify
			: UserCredentialOperationType.Add;

		timeout ??= this.getCredentialCapabilitiesCached()
			?.supportedCredentialTypes
			.get(type)?.credentialLearnRecommendedTimeout;

		if (timeout == undefined) {
			throw new ZWaveError(
				`Credential learning is not supported for credential type ${
					getEnumMemberName(UserCredentialType, type)
				}`,
				ZWaveErrorCodes.CC_NotSupported,
			);
		}

		const api = this._u3cAPI();
		return api.startCredentialLearn({
			userId,
			credentialType: type,
			credentialSlot: slot,
			operationType,
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

	private _ucAPI(): UserCodeCCAPI {
		return this.commandClasses["User Code"] as unknown as UserCodeCCAPI;
	}

	private _u3cAPI(): UserCredentialCCAPI {
		return this.commandClasses[
			"User Credential"
		] as unknown as UserCredentialCCAPI;
	}

	/** Returns the credential type to use for User Code CC based on supported characters */
	private get _ucCredentialType(): UserCredentialType {
		const supportedASCIIChars = this._getValue<string>(
			UserCodeCCValues.supportedASCIIChars.endpoint(this.index),
		);
		return supportsNonPINChars(supportedASCIIChars)
			? UserCredentialType.Password
			: UserCredentialType.PINCode;
	}

	/** Maps User Code CC's UserIDStatus to the unified active/userType model */
	private _mapUserCodeStatusToUserData(
		userId: number,
		status: UserIDStatus,
	): UserData | undefined {
		// These statuses indicate no user is configured for this slot
		if (
			status === UserIDStatus.Available
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
			// Messaging is the closest User Code CC equivalent to NonAccess
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

	/** Removes cached credential values for a given user from the value DB */
	private _purgeCachedCredentials(userId: number): void {
		const valueDB = this.tryGetNode()?.valueDB;
		if (!valueDB) return;
		const credentialValues = valueDB.findValues(
			(vid) =>
				(UserCredentialCCValues.credential.is(vid)
					|| UserCredentialCCValues.credentialModifierType.is(vid)
					|| UserCredentialCCValues.credentialModifierNodeId.is(vid))
				&& (vid.propertyKey as number >> 24) === userId,
		);
		for (const vid of credentialValues) {
			valueDB.removeValue(vid);
		}
	}

	/** Removes all cached user and credential values from the value DB */
	private _purgeAllCachedUsersAndCredentials(): void {
		const valueDB = this.tryGetNode()?.valueDB;
		if (!valueDB) return;

		const maxUsers = this._getValue<number>(
			UserCredentialCCValues.supportedUsers.endpoint(this.index),
		) ?? 0;
		for (let userId = 1; userId <= maxUsers; userId++) {
			for (
				const value of [
					UserCredentialCCValues.userType(userId),
					UserCredentialCCValues.userActive(userId),
					UserCredentialCCValues.credentialRule(userId),
					UserCredentialCCValues.expiringTimeoutMinutes(userId),
					UserCredentialCCValues.userName(userId),
					UserCredentialCCValues.userModifierType(userId),
					UserCredentialCCValues.userModifierNodeId(userId),
					UserCredentialCCValues.userChecksum(userId),
				]
			) {
				valueDB.removeValue(value.endpoint(this.index));
			}
		}

		// Remove all credential values
		const credentialValues = valueDB.findValues(
			(vid) =>
				UserCredentialCCValues.credential.is(vid)
				|| UserCredentialCCValues.credentialModifierType.is(vid)
				|| UserCredentialCCValues.credentialModifierNodeId.is(vid),
		);
		for (const vid of credentialValues) {
			valueDB.removeValue(vid);
		}
	}

	/** Removes all cached user code status and code values from the value DB */
	private _purgeAllCachedUserCodes(): void {
		const valueDB = this.tryGetNode()?.valueDB;
		if (!valueDB) return;

		const values = valueDB.findValues(
			(vid) =>
				UserCodeCCValues.userIdStatus.is(vid)
				|| UserCodeCCValues.userCode.is(vid),
		);
		for (const vid of values) {
			valueDB.removeValue(vid);
		}
	}

	private _assertValidSlot(type: UserCredentialType, slot: number): void {
		const caps = this.getCredentialCapabilitiesCached()
			?.supportedCredentialTypes.get(type);
		if (!caps || slot < 1 || slot > caps.numberOfCredentialSlots) {
			throw new ZWaveError(
				`Credential slot ${slot} is out of range for credential type ${
					getEnumMemberName(UserCredentialType, type)
				}`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	private _throwNoAccessControl(): never {
		throw new ZWaveError(
			"This node does not support managing users or credentials",
			ZWaveErrorCodes.CC_NotSupported,
		);
	}

	private _getUserCached_U3C(userId: number): UserData | undefined {
		const userType = this._getValue<UserCredentialUserType>(
			UserCredentialCCValues.userType(userId).endpoint(this.index),
		);
		if (userType == undefined) return undefined;

		return {
			userId,
			active: this._getValue<boolean>(
				UserCredentialCCValues.userActive(userId).endpoint(this.index),
			) ?? false,
			userType,
			userName: this._getValue<string>(
				UserCredentialCCValues.userName(userId).endpoint(this.index),
			) ?? undefined,
			credentialRule: this._getValue<UserCredentialRule>(
				UserCredentialCCValues.credentialRule(userId).endpoint(
					this.index,
				),
			) ?? undefined,
			expiringTimeoutMinutes: this._getValue<number>(
				UserCredentialCCValues.expiringTimeoutMinutes(userId).endpoint(
					this.index,
				),
			) || undefined,
		};
	}

	private _getCredentialCached_U3C(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		const data = this._getValue<Uint8Array>(
			UserCredentialCCValues.credential(userId, type, slot).endpoint(
				this.index,
			),
		);
		if (data == undefined) return undefined;
		return { userId, type, slot, data };
	}

	private _getUserCached_UC(userId: number): UserData | undefined {
		const status = this._getValue<UserIDStatus>(
			UserCodeCCValues.userIdStatus(userId).endpoint(this.index),
		);
		if (status == undefined) return undefined;
		return this._mapUserCodeStatusToUserData(userId, status);
	}

	private _getCredentialCached_UC(
		userId: number,
		type: UserCredentialType,
		slot: number,
	): CredentialData | undefined {
		if (slot !== 1) return undefined;
		const status = this._getValue<UserIDStatus>(
			UserCodeCCValues.userIdStatus(userId).endpoint(this.index),
		);
		if (
			status == undefined
			|| status === UserIDStatus.Available
			|| status === UserIDStatus.StatusNotAvailable
		) {
			return undefined;
		}
		const data = this._getValue<string>(
			UserCodeCCValues.userCode(userId).endpoint(this.index),
		);
		if (data == undefined) return undefined;
		return { userId, type, slot, data };
	}
}
