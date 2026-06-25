import { CommandClasses } from "@zwave-js/core";
import { AccessControlAPI } from "../feature-apis/AccessControl.js";
import { EndpointBase } from "./00_Base.js";

export class FeatureAPIsMixin extends EndpointBase {
	private _accessControl?: AccessControlAPI;

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
}

export class EndpointMixins extends FeatureAPIsMixin {}
