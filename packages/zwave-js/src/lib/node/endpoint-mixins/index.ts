import { CommandClasses } from "@zwave-js/core";
import { AccessControlAPI } from "../feature-apis/AccessControl.js";
import { DeviceFeatures } from "../feature-apis/DeviceFeatures.js";
import { EndpointBase } from "./00_Base.js";

export class FeatureAPIsMixin extends EndpointBase {
	private _accessControl?: AccessControlAPI;

	public get accessControl(): AccessControlAPI {
		return this._accessControl ??= new AccessControlAPI(this);
	}

	/** Tests whether this endpoint supports the given high-level device feature */
	public supportsFeature(feature: DeviceFeatures): boolean {
		switch (feature) {
			case DeviceFeatures.AccessControl:
				return this.supportsCC(CommandClasses["User Credential"])
					|| this.supportsCC(CommandClasses["User Code"]);
		}
	}
}

export class EndpointMixins extends FeatureAPIsMixin {}
