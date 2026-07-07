import {
	IndicatorCCDescriptionGet,
	IndicatorCCDescriptionReport,
	IndicatorCCGet,
	IndicatorCCReport,
	IndicatorCCSet,
	IndicatorCCSupportedGet,
	IndicatorCCSupportedReport,
	type IndicatorObject,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import type {
	IndicatorCCCapabilities,
	MockNodeBehavior,
} from "@zwave-js/testing";

const defaultCapabilities: IndicatorCCCapabilities = {
	indicators: {},
};

const STATE_KEY_PREFIX = "Indicator_";
const StateKeys = {
	value: (indicatorId: number, propertyId: number) =>
		`${STATE_KEY_PREFIX}value_${indicatorId}_${propertyId}`,
} as const;

const respondToIndicatorGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof IndicatorCCGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses.Indicator,
					receivedCC.endpointIndex,
				),
			};

			let cc: IndicatorCCReport;
			if (receivedCC.indicatorId) {
				// V2+

				const indicatorId = receivedCC.indicatorId ?? 0;
				const supportedProperties =
					capabilities.indicators[indicatorId]?.properties ?? [];

				const indicatorObjects: IndicatorObject[] = supportedProperties
					.map((propertyId) => {
						const value = self.state.get(
							StateKeys.value(indicatorId, propertyId),
						) as number
							?? capabilities.getValue?.(indicatorId, propertyId)
							?? 0;
						return {
							indicatorId,
							propertyId,
							value,
						};
					});

				cc = new IndicatorCCReport({
					nodeId: controller.ownNodeId,
					values: indicatorObjects,
				});
			} else {
				// V1
				const value = self.state.get(StateKeys.value(0, 0)) as number
					?? capabilities.getValue?.(0, 0)
					?? 0;
				cc = new IndicatorCCReport({
					nodeId: controller.ownNodeId,
					value,
				});
			}

			return { action: "sendCC", cc };
		}
	},
};

const respondToIndicatorSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof IndicatorCCSet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses.Indicator,
					receivedCC.endpointIndex,
				),
			};

			if (receivedCC.values) {
				// V2+
				const affectedIndicatorIds = new Set(
					receivedCC.values
						.map((v) => v.indicatorId)
						.filter((id) => id in capabilities.indicators),
				);

				// Properties not included in the command are assumed to be 0
				for (const indicatorId of affectedIndicatorIds) {
					const supportedProperties =
						capabilities.indicators[indicatorId]?.properties ?? [];
					for (const propertyId of supportedProperties) {
						self.state.set(
							StateKeys.value(indicatorId, propertyId),
							0,
						);
					}
				}

				// Then apply the received values, ignoring unsupported objects
				for (const value of receivedCC.values) {
					const supportedProperties = capabilities
						.indicators[value.indicatorId]?.properties;
					if (!supportedProperties?.includes(value.propertyId)) {
						continue;
					}
					self.state.set(
						StateKeys.value(value.indicatorId, value.propertyId),
						value.value === true
							? 0xff
							: value.value === false
							? 0x00
							: value.value,
					);
				}
			} else if (receivedCC.indicator0Value != undefined) {
				// V1
				self.state.set(
					StateKeys.value(0, 0),
					receivedCC.indicator0Value,
				);
			}

			return { action: "ok" };
		}
	},
};

const respondToIndicatorSupportedGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof IndicatorCCSupportedGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses.Indicator,
					receivedCC.endpointIndex,
				),
			};

			function createReport(
				indicatorId: number,
			): IndicatorCCSupportedReport {
				const supportedProperties = capabilities
					.indicators[indicatorId]
					?.properties ?? [];

				const allSupportedIndicators = Object
					.keys(capabilities.indicators)
					.map((id) => parseInt(id, 10))
					.filter((id) => !isNaN(id));

				const indicatorIndex = allSupportedIndicators.indexOf(
					indicatorId,
				);
				const nextIndicatorId =
					allSupportedIndicators[indicatorIndex + 1];

				return new IndicatorCCSupportedReport({
					nodeId: controller.ownNodeId,
					indicatorId,
					nextIndicatorId: nextIndicatorId ?? 0,
					supportedProperties,
				});
			}

			let cc: IndicatorCCSupportedReport;
			if (receivedCC.indicatorId === 0) {
				// Return first supported indicator
				const firstIndicatorId = Object
					.keys(capabilities.indicators)
					.map((id) => parseInt(id, 10))
					.find((id) => !isNaN(id))
					?? 0;

				cc = createReport(firstIndicatorId);
			} else {
				cc = createReport(receivedCC.indicatorId);
			}

			return { action: "sendCC", cc };
		}
	},
};

const respondToIndicatorDescriptionGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof IndicatorCCDescriptionGet) {
			const capabilities = {
				...defaultCapabilities,
				...self.getCCCapabilities(
					CommandClasses.Indicator,
					receivedCC.endpointIndex,
				),
			};

			const indicatorInfo =
				capabilities.indicators[receivedCC.indicatorId];
			let cc: IndicatorCCDescriptionReport;
			if (
				!indicatorInfo
				|| receivedCC.indicatorId < 0x80
				|| receivedCC.indicatorId > 0x9f
			) {
				// Unsupported indicator, or not a manufacturer-specific indicator
				cc = new IndicatorCCDescriptionReport({
					nodeId: controller.ownNodeId,
					indicatorId: receivedCC.indicatorId,
					description: "",
				});
			} else {
				cc = new IndicatorCCDescriptionReport({
					nodeId: controller.ownNodeId,
					indicatorId: receivedCC.indicatorId,
					description: indicatorInfo.manufacturerSpecificDescription
						?? "",
				});
			}

			return { action: "sendCC", cc };
		}
	},
};

export const IndicatorCCBehaviors = [
	respondToIndicatorGet,
	respondToIndicatorSet,
	respondToIndicatorSupportedGet,
	respondToIndicatorDescriptionGet,
];
