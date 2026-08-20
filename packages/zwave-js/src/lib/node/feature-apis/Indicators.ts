import { type IndicatorState } from "@zwave-js/cc";
import {
	type IndicatorCCAPI,
	IndicatorCCValues,
	indicatorObjectsToPropertyMap,
	indicatorPropertyMapToState,
	indicatorStateToObjects,
} from "@zwave-js/cc/IndicatorCC";
import {
	Indicator,
	type SupervisionResult,
	ZWaveError,
	ZWaveErrorCodes,
	supervisedCommandSucceeded,
} from "@zwave-js/core";
import { getEnumMemberName } from "@zwave-js/shared";
import { clamp } from "alcalzone-shared/math";
import { isArray } from "alcalzone-shared/typeguards";
import { FeatureAPI } from "./FeatureAPI.js";

export interface IndicatorCapabilities {
	/** The ID of the indicator. 0 is the unspecified indicator of a V1 node. */
	indicatorId: number;
	/** A user-friendly label describing the indicator */
	label: string;
	/** Whether the indicator can be turned on and off */
	supportsOnOff: boolean;
	/** Whether the indicator can be set to a level between 0 and 99 */
	supportsLevel: boolean;
	/** Whether the indicator can blink */
	supportsBlinking: boolean;
	/** Whether the indicator can be turned off automatically after a timeout */
	supportsTimeout: boolean;
	/** Whether the volume of the indicator can be changed */
	supportsSoundLevel: boolean;
}

export class IndicatorsAPI extends FeatureAPI {
	/**
	 * Returns the capabilities of all indicators the endpoint supports.
	 * This method uses cached information from the interview.
	 */
	public getSupportedCached(): IndicatorCapabilities[] {
		if (!this.#supportsV2Indicators()) {
			return [{
				indicatorId: 0,
				label: "Default",
				supportsOnOff: true,
				supportsLevel: false,
				supportsBlinking: false,
				supportsTimeout: false,
				supportsSoundLevel: false,
			}];
		}

		return this.#supportedIndicatorIds()
			.filter((id) => id !== Indicator["Node Identify"])
			.map((id) => this.#getCapabilities(id));
	}

	/**
	 * Returns the capabilities of the given indicator, or `undefined` if it is
	 * not supported. This method uses cached information from the interview.
	 */
	public getCapabilitiesCached(
		indicatorId: number,
	): IndicatorCapabilities | undefined {
		return this.getSupportedCached().find(
			(caps) => caps.indicatorId === indicatorId,
		);
	}

	/**
	 * Queries the current state of the given indicator.
	 * This communicates with the node.
	 */
	public async get(
		indicatorId: number,
	): Promise<IndicatorState | undefined> {
		if (!this.#supportsV2Indicators()) {
			this.#assertDefaultIndicator(indicatorId);
			const value = await this.#api().get();
			if (typeof value !== "number") return undefined;
			return { on: value > 0 };
		}

		this.#assertSupportedIndicator(indicatorId);
		const values = await this.#api().get(indicatorId);
		if (values == undefined) return undefined;
		if (!isArray(values)) return { on: values > 0 };

		const supportedPropertyIDs = this.#supportedPropertyIDs(indicatorId);
		const map = indicatorObjectsToPropertyMap(
			values,
			supportedPropertyIDs,
		);
		return indicatorPropertyMapToState(map, supportedPropertyIDs);
	}

	/**
	 * Returns the last known state of the given indicator, or `undefined` if
	 * it is not known. This method uses cached information.
	 */
	public getCached(indicatorId: number): IndicatorState | undefined {
		if (!this.#supportsV2Indicators()) {
			if (indicatorId !== 0) return undefined;
			const value = this.getValue<number>(
				IndicatorCCValues.valueV1.endpoint(this.endpoint.index),
			);
			if (value == undefined) return undefined;
			return { on: value > 0 };
		}

		const map = this.getValue<Record<number, number>>(
			IndicatorCCValues.indicatorState(indicatorId).endpoint(
				this.endpoint.index,
			),
		);
		if (!map) return undefined;
		return indicatorPropertyMapToState(
			map,
			this.#supportedPropertyIDs(indicatorId),
		);
	}

	/**
	 * Changes the state of the given indicator. The state is applied as a
	 * whole: all aspects not included in the state are turned off, matching
	 * the required behavior of supporting devices.
	 * This communicates with the node.
	 */
	public async set(
		indicatorId: number,
		state: IndicatorState,
	): Promise<SupervisionResult | undefined> {
		if (!this.#supportsV2Indicators()) {
			this.#assertDefaultIndicator(indicatorId);
			return this.#setV1(state);
		}

		this.#assertSupportedIndicator(indicatorId);
		const supportedPropertyIDs = this.#supportedPropertyIDs(indicatorId);
		const objects = indicatorStateToObjects(
			indicatorId,
			state,
			supportedPropertyIDs,
		);

		const result = await this.#api().set(objects);
		if (result == undefined || supervisedCommandSucceeded(result)) {
			// No report will follow, so persist the new state ourselves
			this.endpoint.tryGetNode()?.valueDB.setValue(
				IndicatorCCValues.indicatorState(indicatorId).endpoint(
					this.endpoint.index,
				),
				indicatorObjectsToPropertyMap(objects, supportedPropertyIDs),
			);
		}
		return result;
	}

	/**
	 * Instructs the node to identify itself, e.g. by blinking an LED.
	 * Supported by nodes implementing version 3 or higher of the Indicator CC.
	 * This communicates with the node.
	 */
	public async identify(): Promise<SupervisionResult | undefined> {
		return this.#api().identify();
	}

	async #setV1(
		state: IndicatorState,
	): Promise<SupervisionResult | undefined> {
		if (
			state.blink
			|| state.timeout != undefined
			|| state.soundLevel != undefined
		) {
			throw new ZWaveError(
				`This node only supports turning the indicator on or off`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		let value: number;
		if (state.on === false) {
			value = 0x00;
		} else if (state.level != undefined) {
			value = clamp(state.level, 0, 99);
		} else if (state.on) {
			value = 0xff;
		} else {
			throw new ZWaveError(
				`The given indicator state is empty`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		const result = await this.#api().set(value);
		if (result == undefined || supervisedCommandSucceeded(result)) {
			// No report will follow, so persist the new state ourselves
			this.endpoint.tryGetNode()?.valueDB.setValue(
				IndicatorCCValues.valueV1.endpoint(this.endpoint.index),
				value,
			);
		}
		return result;
	}

	#api(): IndicatorCCAPI {
		return this.endpoint.commandClasses
			.Indicator as unknown as IndicatorCCAPI;
	}

	#supportedIndicatorIds(): number[] {
		return this.getValue<number[]>(
			IndicatorCCValues.supportedIndicatorIds.endpoint(
				this.endpoint.index,
			),
		) ?? [];
	}

	#supportedPropertyIDs(indicatorId: number): number[] {
		return this.getValue<number[]>(
			IndicatorCCValues.supportedPropertyIDs(indicatorId).endpoint(
				this.endpoint.index,
			),
		) ?? [];
	}

	#supportsV2Indicators(): boolean {
		return this.#supportedIndicatorIds().some(
			(indicatorId) => this.#supportedPropertyIDs(indicatorId).length > 0,
		);
	}

	#getCapabilities(indicatorId: number): IndicatorCapabilities {
		const propertyIDs = this.#supportedPropertyIDs(indicatorId);
		// Manufacturer-defined indicators may have a custom description
		const label = this.getValue<string>(
			IndicatorCCValues.indicatorDescription(indicatorId).endpoint(
				this.endpoint.index,
			),
		) || getEnumMemberName(Indicator, indicatorId);

		return {
			indicatorId,
			label,
			supportsOnOff: propertyIDs.includes(0x02)
				|| propertyIDs.includes(0x01),
			supportsLevel: propertyIDs.includes(0x01),
			supportsBlinking: propertyIDs.includes(0x03)
				&& propertyIDs.includes(0x04),
			supportsTimeout: [0x0a, 0x06, 0x07, 0x08].some((id) =>
				propertyIDs.includes(id)
			),
			supportsSoundLevel: propertyIDs.includes(0x09),
		};
	}

	#assertDefaultIndicator(indicatorId: number): void {
		if (indicatorId !== 0) {
			throw new ZWaveError(
				`This node only supports the default indicator with ID 0`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}

	#assertSupportedIndicator(indicatorId: number): void {
		if (
			indicatorId === Indicator["Node Identify"]
			|| !this.#supportedIndicatorIds().includes(indicatorId)
		) {
			throw new ZWaveError(
				`Indicator ${indicatorId} cannot be controlled through this API`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
	}
}
