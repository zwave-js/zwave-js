import {
	type CommandClass,
	Security2CC,
	Security2CCMessageEncapsulation,
	VersionCCCapabilitiesGet,
	VersionCCCapabilitiesReport,
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
	VersionCCGet,
	VersionCCReport,
	ZWavePlusNodeType,
	ZWavePlusRoleType,
} from "@zwave-js/cc";
import { ZWavePlusCCGet, ZWavePlusCCReport } from "@zwave-js/cc/ZWavePlusCC";
import {
	ZWaveProtocolCCNodeInformationFrame,
	ZWaveProtocolCCRequestNodeInformationFrame,
} from "@zwave-js/cc/ZWaveProtocolCC";
import { CommandClasses, ZWaveLibraryTypes } from "@zwave-js/core";
import type { MockNodeBehavior } from "@zwave-js/testing";

import { BasicCCBehaviors } from "./mockCCBehaviors/Basic.js";
import { BinarySensorCCBehaviors } from "./mockCCBehaviors/BinarySensor.js";
import { BinarySwitchCCBehaviors } from "./mockCCBehaviors/BinarySwitch.js";
import { ColorSwitchCCBehaviors } from "./mockCCBehaviors/ColorSwitch.js";
import { ConfigurationCCBehaviors } from "./mockCCBehaviors/Configuration.js";
import { EnergyProductionCCBehaviors } from "./mockCCBehaviors/EnergyProduction.js";
import { IndicatorCCBehaviors } from "./mockCCBehaviors/Indicator.js";
import { ManufacturerSpecificCCBehaviors } from "./mockCCBehaviors/ManufacturerSpecific.js";
import { MeterCCBehaviors } from "./mockCCBehaviors/Meter.js";
import {
	MultiChannelCCBehaviors,
	MultiChannelCCHooks,
} from "./mockCCBehaviors/MultiChannel.js";
import { MultilevelSensorCCBehaviors } from "./mockCCBehaviors/MultilevelSensor.js";
import { MultilevelSwitchCCBehaviors } from "./mockCCBehaviors/MultilevelSwitch.js";
import { NodeNamingAndLocationCCBehaviors } from "./mockCCBehaviors/NodeNamingAndLocation.js";
import { NotificationCCBehaviors } from "./mockCCBehaviors/Notification.js";
import { ScheduleEntryLockCCBehaviors } from "./mockCCBehaviors/ScheduleEntryLock.js";
import {
	SecurityCCBehaviors,
	SecurityCCHooks,
} from "./mockCCBehaviors/Security.js";
import {
	Security2CCBehaviors,
	Security2CCHooks,
} from "./mockCCBehaviors/Security2.js";
import { SoundSwitchCCBehaviors } from "./mockCCBehaviors/SoundSwitch.js";
import { SupervisionCCHooks } from "./mockCCBehaviors/Supervision.js";
import { ThermostatModeCCBehaviors } from "./mockCCBehaviors/ThermostatMode.js";
import { ThermostatSetbackCCBehaviors } from "./mockCCBehaviors/ThermostatSetback.js";
import { ThermostatSetpointCCBehaviors } from "./mockCCBehaviors/ThermostatSetpoint.js";
import { UserCodeCCBehaviors } from "./mockCCBehaviors/UserCode.js";
import { WindowCoveringCCBehaviors } from "./mockCCBehaviors/WindowCovering.js";

const respondToRequestNodeInfo: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (
			receivedCC
				instanceof ZWaveProtocolCCRequestNodeInformationFrame
		) {
			const cc = new ZWaveProtocolCCNodeInformationFrame({
				nodeId: self.id,
				...self.capabilities,
				supportedCCs: [...self.implementedCCs]
					// Basic CC must not be included in the NIF
					.filter(([ccId]) => ccId !== CommandClasses.Basic)
					// Only include supported CCs
					.filter(([, info]) => info.isSupported)
					// FIXME: Filter out secure CCs if the node isn't secure
					.map(([ccId]) => ccId),
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToVersionCCGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof VersionCCGet) {
			const cc = new VersionCCReport({
				nodeId: controller.ownNodeId,
				libraryType: ZWaveLibraryTypes["Enhanced Slave"],
				protocolVersion: "7.0",
				firmwareVersions: [self.capabilities.firmwareVersion],
				hardwareVersion: 1,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToVersionCCCommandClassGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof VersionCCCommandClassGet) {
			const endpoint = receivedCC.endpointIndex === 0
				? self
				: self.endpoints.get(receivedCC.endpointIndex);
			if (!endpoint) return;

			let version = 0;
			for (const ep of [self, ...self.endpoints.values()]) {
				const info = ep.implementedCCs.get(receivedCC.requestedCC);
				if (info?.version) {
					version = info.version;
					break;
				}
			}

			// Basic CC is always supported implicitly
			if (
				version === 0 && receivedCC.requestedCC === CommandClasses.Basic
			) {
				version = 1;
			}

			const cc = new VersionCCCommandClassReport({
				nodeId: controller.ownNodeId,
				endpointIndex: "index" in endpoint ? endpoint.index : undefined,
				requestedCC: receivedCC.requestedCC,
				ccVersion: version,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToVersionCCCapabilitiesGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof VersionCCCapabilitiesGet) {
			const cc = new VersionCCCapabilitiesReport({
				nodeId: controller.ownNodeId,
				endpointIndex: receivedCC.endpointIndex,
				supportsZWaveSoftwareGet: false,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToZWavePlusCCGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof ZWavePlusCCGet) {
			const cc = new ZWavePlusCCReport({
				nodeId: controller.ownNodeId,
				zwavePlusVersion: 2,
				nodeType: ZWavePlusNodeType.Node,
				roleType: self.capabilities.isListening
					? ZWavePlusRoleType.AlwaysOnSlave
					: self.capabilities.isFrequentListening
					? ZWavePlusRoleType.SleepingListeningSlave
					: ZWavePlusRoleType.SleepingReportingSlave,
				installerIcon: 0x0000,
				userIcon: 0x0000,
			});
			return { action: "sendCC", cc, ackRequested: true };
		}
	},
};

const respondToS2ZWavePlusCCGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (
			receivedCC instanceof Security2CCMessageEncapsulation
			&& receivedCC.encapsulated instanceof ZWavePlusCCGet
		) {
			let cc: CommandClass = new ZWavePlusCCReport({
				nodeId: controller.ownNodeId,
				zwavePlusVersion: 2,
				nodeType: ZWavePlusNodeType.Node,
				roleType: self.capabilities.isListening
					? ZWavePlusRoleType.AlwaysOnSlave
					: self.capabilities.isFrequentListening
					? ZWavePlusRoleType.SleepingListeningSlave
					: ZWavePlusRoleType.SleepingReportingSlave,
				installerIcon: 0x0000,
				userIcon: 0x0000,
			});
			cc = Security2CC.encapsulate(
				cc,
				self.id,
				self.securityManagers,
			);
			return { action: "sendCC", cc };
		}
	},
};

/** Predefined default behaviors that are required for interacting with the Mock Controller correctly */
export function createDefaultBehaviors(): MockNodeBehavior[] {
	return [
		respondToRequestNodeInfo,

		...SecurityCCHooks,
		...SecurityCCBehaviors,
		...Security2CCHooks,
		...Security2CCBehaviors,

		...MultiChannelCCHooks,
		...MultiChannelCCBehaviors,

		...SupervisionCCHooks,

		respondToVersionCCGet,
		respondToVersionCCCommandClassGet,
		respondToVersionCCCapabilitiesGet,

		respondToZWavePlusCCGet,
		respondToS2ZWavePlusCCGet,

		...BasicCCBehaviors,
		...BinarySensorCCBehaviors,
		...BinarySwitchCCBehaviors,
		...ColorSwitchCCBehaviors,
		...ConfigurationCCBehaviors,
		...EnergyProductionCCBehaviors,
		...IndicatorCCBehaviors,
		...ManufacturerSpecificCCBehaviors,
		...MeterCCBehaviors,
		...MultilevelSensorCCBehaviors,
		...MultilevelSwitchCCBehaviors,
		...NodeNamingAndLocationCCBehaviors,
		...NotificationCCBehaviors,
		...ScheduleEntryLockCCBehaviors,
		...SoundSwitchCCBehaviors,
		...ThermostatModeCCBehaviors,
		...ThermostatSetpointCCBehaviors,
		...ThermostatSetbackCCBehaviors,
		...UserCodeCCBehaviors,
		...WindowCoveringCCBehaviors,
	];
}
