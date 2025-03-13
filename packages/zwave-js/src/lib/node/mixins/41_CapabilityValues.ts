import {
	ManufacturerSpecificCCValues,
	VersionCCValues,
	WakeUpCCValues,
	ZWavePlusCCValues,
	type ZWavePlusNodeType,
	type ZWavePlusRoleType,
} from "@zwave-js/cc";
import { type MaybeNotKnown } from "@zwave-js/core";
import { NodeValuesMixin } from "./40_Values.js";

export interface NodeCapabilityValues {
	get manufacturerId(): MaybeNotKnown<number>;
	get productId(): MaybeNotKnown<number>;
	get productType(): MaybeNotKnown<number>;
	get firmwareVersion(): MaybeNotKnown<string>;
	get hardwareVersion(): MaybeNotKnown<number>;
	get sdkVersion(): MaybeNotKnown<string>;
	get zwavePlusVersion(): MaybeNotKnown<number>;
	get zwavePlusNodeType(): MaybeNotKnown<ZWavePlusNodeType>;
	get zwavePlusRoleType(): MaybeNotKnown<ZWavePlusRoleType>;
	get supportsWakeUpOnDemand(): MaybeNotKnown<boolean>;
}

export abstract class NodeCapabilityValuesMixin extends NodeValuesMixin
	implements NodeCapabilityValues
{
	public get manufacturerId(): MaybeNotKnown<number> {
		return this.getValue(ManufacturerSpecificCCValues.manufacturerId.id);
	}

	public get productId(): MaybeNotKnown<number> {
		return this.getValue(ManufacturerSpecificCCValues.productId.id);
	}

	public get productType(): MaybeNotKnown<number> {
		return this.getValue(ManufacturerSpecificCCValues.productType.id);
	}

	public get firmwareVersion(): MaybeNotKnown<string> {
		// On supporting nodes, use the applicationVersion, which MUST be
		// same as the first (main) firmware, plus the patch version.
		const firmware0Version = this.getValue<string[]>(
			VersionCCValues.firmwareVersions.id,
		)?.[0];
		const applicationVersion = this.getValue<string>(
			VersionCCValues.applicationVersion.id,
		);

		let ret = firmware0Version;
		if (applicationVersion) {
			// If the application version is set, we cannot blindly trust that it is the firmware version.
			// Some nodes incorrectly set this field to the Z-Wave Application Framework API Version
			if (!ret || applicationVersion.startsWith(`${ret}.`)) {
				ret = applicationVersion;
			}
		}

		// Special case for the official 700 series firmwares which are aligned with the SDK version
		// We want to work with the full x.y.z firmware version here.
		if (ret && this.isControllerNode) {
			const sdkVersion = this.sdkVersion;
			if (sdkVersion && sdkVersion.startsWith(`${ret}.`)) {
				return sdkVersion;
			}
		}
		// For all others, just return the simple x.y firmware version
		return ret;
	}

	public get hardwareVersion(): MaybeNotKnown<number> {
		return this.getValue(VersionCCValues.hardwareVersion.id);
	}

	public get sdkVersion(): MaybeNotKnown<string> {
		return this.getValue(VersionCCValues.sdkVersion.id);
	}

	public get zwavePlusVersion(): MaybeNotKnown<number> {
		return this.getValue(ZWavePlusCCValues.zwavePlusVersion.id);
	}

	public get zwavePlusNodeType(): MaybeNotKnown<ZWavePlusNodeType> {
		return this.getValue(ZWavePlusCCValues.nodeType.id);
	}

	public get zwavePlusRoleType(): MaybeNotKnown<ZWavePlusRoleType> {
		return this.getValue(ZWavePlusCCValues.roleType.id);
	}

	public get supportsWakeUpOnDemand(): MaybeNotKnown<boolean> {
		return this.getValue(WakeUpCCValues.wakeUpOnDemandSupported.id);
	}
}
