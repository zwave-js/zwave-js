import { CommandClasses } from "@zwave-js/core";
import { AccessControlAPI } from "../feature-apis/AccessControl.js";
import { CoversAPI, supportsCoversAPI } from "../feature-apis/Covers.js";
import { EndpointBase } from "./00_Base.js";

export class FeatureAPIsMixin extends EndpointBase {
	private _accessControl?: AccessControlAPI;
	private _covers?: CoversAPI;

	/**
	 * High-level API for managing users and credentials on access control
	 * devices. Returns `undefined` if the endpoint supports neither the
	 * **User Credential CC** nor the **User Code CC**.
	 */
	public get accessControl(): AccessControlAPI | undefined {
		if (
			!this.supportsCC(CommandClasses["User Credential"])
			&& !this.supportsCC(CommandClasses["User Code"])
		) {
			return undefined;
		}
		this._accessControl ??= new AccessControlAPI(this);
		return this._accessControl;
	}

	/**
	 * High-level API for controlling covers (blinds, shades, curtains, ...).
	 * Returns `undefined` if the endpoint does not support any cover-related
	 * CC, or if its Multilevel Switch CC is not identified as a cover by the
	 * device class.
	 */
	public get covers(): CoversAPI | undefined {
		if (!supportsCoversAPI(this)) return undefined;
		this._covers ??= new CoversAPI(this);
		return this._covers;
	}

	/**
	 * @internal
	 * Releases resources held by instantiated feature APIs
	 */
	public destroyFeatureAPIs(): void {
		this._accessControl?.destroy();
		this._accessControl = undefined;
		this._covers?.destroy();
		this._covers = undefined;
	}
}

export class EndpointMixins extends FeatureAPIsMixin {}
