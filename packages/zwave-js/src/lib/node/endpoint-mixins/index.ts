import { CommandClasses } from "@zwave-js/core";
import { AccessControlAPI } from "../feature-apis/AccessControl.js";
import { SchedulingAPI } from "../feature-apis/Scheduling.js";
import { EndpointBase } from "./00_Base.js";

export class FeatureAPIsMixin extends EndpointBase {
	private _accessControl?: AccessControlAPI;
	private _scheduling?: SchedulingAPI;

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
	 * High-level API for managing schedules on supporting devices, e.g. door
	 * locks. Returns `undefined` if the endpoint supports neither the
	 * **Active Schedule CC** nor the **Schedule Entry Lock CC**.
	 */
	public get scheduling(): SchedulingAPI | undefined {
		if (
			!this.supportsCC(CommandClasses["Active Schedule"])
			&& !this.supportsCC(CommandClasses["Schedule Entry Lock"])
		) {
			return undefined;
		}
		this._scheduling ??= new SchedulingAPI(this);
		return this._scheduling;
	}
}

export class EndpointMixins extends FeatureAPIsMixin {}
