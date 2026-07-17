import { type WindowCoveringParameter } from "@zwave-js/cc";
import type { BasicWindowCoveringCCAPI } from "@zwave-js/cc/BasicWindowCoveringCC";
import {
	type MultilevelSwitchCCAPI,
	MultilevelSwitchCCValues,
} from "@zwave-js/cc/MultilevelSwitchCC";
import {
	type WindowCoveringCCAPI,
	WindowCoveringCCValues,
} from "@zwave-js/cc/WindowCoveringCC";
import {
	FibaroCCIDs,
	getFibaroVenetianBlindPositionValueId,
	getFibaroVenetianBlindTiltValueId,
} from "@zwave-js/cc/manufacturerProprietary/FibaroCC";
import type { FibaroCCAPI } from "@zwave-js/cc/manufacturerProprietary/FibaroCC";
import {
	CommandClasses,
	Duration,
	type SupervisionResult,
	type ValueID,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { isArray } from "alcalzone-shared/typeguards";
import type { EndpointBase } from "../endpoint-mixins/00_Base.js";
import {
	type TransitionCommand,
	type TransitionState,
	TransitionTracker,
} from "../transitions/TransitionTracker.js";
import { FeatureAPI } from "./FeatureAPI.js";

/**
 * Identifies an independently movable dimension of a cover. The `Primary` and
 * `Tilt` aliases resolve to whatever the endpoint's main position and tilt
 * aspects are, so applications only need the concrete values for exotic
 * devices with multiple position aspects.
 */
export enum CoverAspect {
	Primary = "primary",
	Tilt = "tilt",
	OutboundLeft = "outboundLeft",
	OutboundRight = "outboundRight",
	InboundLeft = "inboundLeft",
	InboundRight = "inboundRight",
	InboundLeftRight = "inboundLeftRight",
	VerticalSlats = "verticalSlats",
	OutboundBottom = "outboundBottom",
	OutboundTop = "outboundTop",
	InboundBottom = "inboundBottom",
	InboundTop = "inboundTop",
	InboundTopBottom = "inboundTopBottom",
	HorizontalSlats = "horizontalSlats",
}

export type CoverAspectType = "position" | "tilt";

/** How a cover aspect is currently moving. "unknown" indicates an ongoing transition with unknown direction */
export type CoverMovement = "idle" | "opening" | "closing" | "unknown";

/** How trustworthy the advertised current value is */
export type CoverValueReliability = "reported" | "estimated" | "stale";

export interface CoverAspectCapabilities {
	aspect: CoverAspect;
	type: CoverAspectType;
	label: string;
	/** Whether the aspect can be commanded to a specific value */
	supportsGoToValue: boolean;
	/** Whether the current value can be read at all */
	reportsValue: boolean;
	/** Whether the device reliably reports the target value and duration of transitions */
	reportsTarget: boolean;
	/** Whether open-ended movement (start/stop) is supported */
	supportsStartStop: boolean;
	/** Whether a transition duration can be passed with commands */
	supportsDuration: boolean;
}

export interface CoverCapabilities {
	aspects: CoverAspectCapabilities[];
	/** The concrete aspect {@link CoverAspect.Primary} resolves to, if any */
	primaryAspect?: CoverAspect;
	/** The concrete aspect {@link CoverAspect.Tilt} resolves to, if any */
	primaryTiltAspect?: CoverAspect;
}

export interface CoverControlOptions {
	/** Which aspect to control. Defaults to {@link CoverAspect.Primary}, or {@link CoverAspect.Tilt} for tilt methods */
	aspect?: CoverAspect;
	/** The desired transition duration. Ignored when the aspect does not support it */
	duration?: Duration | string;
}

/**
 * Consolidated state of one cover aspect.
 *
 * Positions use the raw Z-Wave scale: 0 = fully closed, 99 = fully open.
 * Tilt always uses the standard Z-Wave slat convention: 0 = closed,
 * 50 = open, 99 = closed the other way.
 */
export interface CoverAspectState {
	aspect: CoverAspect;
	type: CoverAspectType;
	/** Last known value. `undefined` while the value is unknown, e.g. mid-travel on devices without position feedback */
	currentValue?: number;
	/** The value being moved towards, if known */
	targetValue?: number;
	movement: CoverMovement;
	/** Estimated duration of the ongoing transition, if known */
	remainingDuration?: Duration;
	currentValueReliability: CoverValueReliability;
}

/** How a cover aspect is backed by an actual Command Class */
type AspectBinding =
	| {
		backend: "windowCovering";
		type: CoverAspectType;
		parameter: WindowCoveringParameter;
		positioned: boolean;
	}
	| { backend: "multilevelSwitch"; type: "position" }
	| { backend: "basicWindowCovering"; type: "position" }
	| {
		backend: "fibaro";
		type: CoverAspectType;
		property: "position" | "tilt";
	};

// Window Covering parameters come in pairs of a positioned (odd) and a
// movement-only (even) variant of the same property
const pairToAspect: Record<number, CoverAspect> = {
	0: CoverAspect.OutboundLeft,
	1: CoverAspect.OutboundRight,
	2: CoverAspect.InboundLeft,
	3: CoverAspect.InboundRight,
	4: CoverAspect.InboundLeftRight,
	5: CoverAspect.VerticalSlats,
	6: CoverAspect.OutboundBottom,
	7: CoverAspect.OutboundTop,
	8: CoverAspect.InboundBottom,
	9: CoverAspect.InboundTop,
	10: CoverAspect.InboundTopBottom,
	11: CoverAspect.HorizontalSlats,
};

const aspectLabels: Record<CoverAspect, string> = {
	[CoverAspect.Primary]: "Position",
	[CoverAspect.Tilt]: "Tilt",
	[CoverAspect.OutboundLeft]: "Outbound Left",
	[CoverAspect.OutboundRight]: "Outbound Right",
	[CoverAspect.InboundLeft]: "Inbound Left",
	[CoverAspect.InboundRight]: "Inbound Right",
	[CoverAspect.InboundLeftRight]: "Inbound Left/Right",
	[CoverAspect.VerticalSlats]: "Vertical Slats Angle",
	[CoverAspect.OutboundBottom]: "Outbound Bottom",
	[CoverAspect.OutboundTop]: "Outbound Top",
	[CoverAspect.InboundBottom]: "Inbound Bottom",
	[CoverAspect.InboundTop]: "Inbound Top",
	[CoverAspect.InboundTopBottom]: "Inbound Top/Bottom",
	[CoverAspect.HorizontalSlats]: "Horizontal Slats Angle",
};

function isSlatPair(pair: number): boolean {
	return pairToAspect[pair] === CoverAspect.VerticalSlats
		|| pairToAspect[pair] === CoverAspect.HorizontalSlats;
}

/** The value at which a tilt aspect is fully open */
const TILT_OPEN = 50;

// The Fibaro venetian blind tilt spans its physical range linearly from 0..99,
// which corresponds to the closed..open half of the standard slat convention
function fibaroTiltToUnified(raw: number): number {
	return Math.round((raw * TILT_OPEN) / 99);
}
function unifiedTiltToFibaro(unified: number): number {
	return Math.round((Math.min(unified, TILT_OPEN) * 99) / TILT_OPEN);
}

function movementFromTransition(
	binding: AspectBinding,
	state: TransitionState,
): CoverMovement {
	if (state.movement === "idle") return "idle";
	if (state.movement === "unknown") return "unknown";
	const increasing = state.movement === "increasing";
	if (binding.type === "position") {
		return increasing ? "opening" : "closing";
	}
	// Slats open towards the midpoint and close towards both extremes
	const current = state.currentLevel;
	if (current == undefined) return "unknown";
	if (increasing) {
		return current < TILT_OPEN ? "opening" : "closing";
	}
	return current > TILT_OPEN ? "opening" : "closing";
}

function reliabilityFromTransition(
	state: TransitionState,
): CoverValueReliability {
	switch (state.source) {
		case "timeout":
			return "stale";
		case "command":
		case "supervision":
			return "estimated";
		default:
			return "reported";
	}
}

function deviceClassIndicatesCover(
	deviceClass: {
		generic: { key: number };
		specific: { key: number };
	} | undefined,
): boolean {
	if (!deviceClass) return false;
	// Generic Window Covering
	if (deviceClass.generic.key === 0x09) return true;
	// Generic Multilevel Switch with a motor-related specific class:
	// Multiposition Motor, Motor Control Class A/B/C
	return deviceClass.generic.key === 0x11
		&& [0x03, 0x05, 0x06, 0x07].includes(deviceClass.specific.key);
}

function compatForcesCover(endpoint: EndpointBase): boolean {
	const treatAsCover = endpoint.tryGetNode()?.deviceConfig?.compat
		?.treatAsCover;
	if (treatAsCover == undefined) return false;
	return treatAsCover === "*" || treatAsCover.includes(endpoint.index);
}

function supportsFibaroVenetianBlind(endpoint: EndpointBase): boolean {
	if (!endpoint.supportsCC(CommandClasses["Manufacturer Proprietary"])) {
		return false;
	}
	const fibaroCCs = endpoint.tryGetNode()?.deviceConfig?.proprietary
		?.fibaroCCs;
	return isArray(fibaroCCs)
		&& fibaroCCs.includes(FibaroCCIDs.VenetianBlind);
}

/** Determines whether the covers feature API applies to an endpoint */
export function supportsCoversAPI(endpoint: EndpointBase): boolean {
	if (
		endpoint.supportsCC(CommandClasses["Window Covering"])
		|| endpoint.supportsCC(CommandClasses["Basic Window Covering"])
		|| supportsFibaroVenetianBlind(endpoint)
	) {
		return true;
	}
	// The Multilevel Switch CC alone could just as well be a dimmer, so require
	// a device class that identifies the endpoint as a cover
	return endpoint.supportsCC(CommandClasses["Multilevel Switch"])
		&& (deviceClassIndicatesCover(endpoint.deviceClass)
			|| compatForcesCover(endpoint));
}

/**
 * High-level API for controlling covers (blinds, shades, curtains, ...),
 * unifying the Window Covering CC, Multilevel Switch CC, Basic Window
 * Covering CC and the proprietary Fibaro Venetian Blind CC.
 */
export class CoversAPI extends FeatureAPI {
	public constructor(endpoint: EndpointBase) {
		super(endpoint);
		// Movement tracking and the resulting "cover state changed" events
		// require the trackers to subscribe to value updates, so instantiate
		// them for all known aspects right away
		if (endpoint.tryGetNode()) {
			for (const [aspect, binding] of this.#resolveBindings()) {
				this.#tracker(aspect, binding);
			}
		}
	}

	#trackers = new Map<CoverAspect, TransitionTracker>();

	/**
	 * Returns the capabilities of all cover aspects of this endpoint,
	 * based on cached data.
	 */
	public getCapabilitiesCached(): CoverCapabilities {
		const bindings = this.#resolveBindings();
		const aspects: CoverAspectCapabilities[] = [];
		for (const [aspect, binding] of bindings) {
			aspects.push(this.#capabilitiesFor(aspect, binding));
		}
		return {
			aspects,
			primaryAspect: this.#resolvePrimary(bindings, "position"),
			primaryTiltAspect: this.#resolvePrimary(bindings, "tilt"),
		};
	}

	#capabilitiesFor(
		aspect: CoverAspect,
		binding: AspectBinding,
	): CoverAspectCapabilities {
		const base = {
			aspect,
			type: binding.type,
			label: aspectLabels[aspect],
		};
		switch (binding.backend) {
			case "windowCovering":
				return {
					...base,
					supportsGoToValue: binding.positioned,
					reportsValue: binding.positioned,
					reportsTarget: binding.positioned,
					supportsStartStop: true,
					supportsDuration: true,
				};
			case "multilevelSwitch": {
				const version = this.endpoint.getCCVersion(
					CommandClasses["Multilevel Switch"],
				);
				return {
					...base,
					supportsGoToValue: true,
					reportsValue: true,
					// The target value and duration are only part of the report in V4+
					reportsTarget: version >= 4,
					supportsStartStop: true,
					supportsDuration: version >= 2,
				};
			}
			case "basicWindowCovering":
				return {
					...base,
					supportsGoToValue: false,
					reportsValue: false,
					reportsTarget: false,
					supportsStartStop: true,
					supportsDuration: false,
				};
			case "fibaro":
				return {
					...base,
					supportsGoToValue: true,
					reportsValue: true,
					reportsTarget: false,
					// Movement without a target requires the Multilevel Switch CC
					supportsStartStop: binding.type === "position"
						&& this.endpoint.supportsCC(
							CommandClasses["Multilevel Switch"],
						),
					supportsDuration: false,
				};
		}
	}

	#resolveBindings(): Map<CoverAspect, AspectBinding> {
		const bindings = new Map<CoverAspect, AspectBinding>();

		if (this.endpoint.supportsCC(CommandClasses["Window Covering"])) {
			// CL:006A.01.51.01.2: "A controlling node MUST NOT interview and
			// provide controlling functionalities for the Multilevel Switch
			// Command Class for a node (or endpoint) supporting this Command
			// Class, as it is a fully redundant and less precise application
			// functionality." The same reasoning applies to the other backends.
			const supported = this.getValue<readonly WindowCoveringParameter[]>(
				WindowCoveringCCValues.supportedParameters.endpoint(
					this.endpoint.index,
				),
			) ?? [];

			// Prefer the positioned member when a device violates the spec and
			// advertises both members of a parameter pair
			const byPair = new Map<number, WindowCoveringParameter>();
			for (const param of supported) {
				const pair = param >> 1;
				const existing = byPair.get(pair);
				if (existing == undefined || param % 2 === 1) {
					byPair.set(pair, param);
				}
			}
			for (const [pair, parameter] of byPair) {
				const aspect = pairToAspect[pair];
				if (aspect == undefined) continue;
				bindings.set(aspect, {
					backend: "windowCovering",
					type: isSlatPair(pair) ? "tilt" : "position",
					parameter,
					positioned: parameter % 2 === 1,
				});
			}
			return bindings;
		}

		const supportsMLS = this.endpoint.supportsCC(
			CommandClasses["Multilevel Switch"],
		);

		if (supportsFibaroVenetianBlind(this.endpoint)) {
			// Fibaro devices map the Multilevel Switch CC to the blind position,
			// so use it for position control where possible and the proprietary
			// CC only for the tilt
			bindings.set(
				CoverAspect.Primary,
				supportsMLS
					? { backend: "multilevelSwitch", type: "position" }
					: {
						backend: "fibaro",
						type: "position",
						property: "position",
					},
			);
			bindings.set(CoverAspect.Tilt, {
				backend: "fibaro",
				type: "tilt",
				property: "tilt",
			});
			return bindings;
		}

		if (supportsMLS) {
			bindings.set(CoverAspect.Primary, {
				backend: "multilevelSwitch",
				type: "position",
			});
			return bindings;
		}

		if (
			this.endpoint.supportsCC(CommandClasses["Basic Window Covering"])
		) {
			bindings.set(CoverAspect.Primary, {
				backend: "basicWindowCovering",
				type: "position",
			});
		}
		return bindings;
	}

	#resolvePrimary(
		bindings: Map<CoverAspect, AspectBinding>,
		type: CoverAspectType,
	): CoverAspect | undefined {
		const alias = type === "position"
			? CoverAspect.Primary
			: CoverAspect.Tilt;
		if (bindings.has(alias)) return alias;

		// For Window Covering devices, prefer the aspect of the lowest
		// supported parameter, which matches how Multilevel Switch reports
		// are mapped to Window Covering values
		let best: { aspect: CoverAspect; parameter: number } | undefined;
		for (const [aspect, binding] of bindings) {
			if (binding.type !== type) continue;
			if (binding.backend !== "windowCovering") continue;
			if (!best || binding.parameter < best.parameter) {
				best = { aspect, parameter: binding.parameter };
			}
		}
		return best?.aspect;
	}

	#resolveAspect(
		requested: CoverAspect | undefined,
		defaultType: CoverAspectType,
	): { aspect: CoverAspect; binding: AspectBinding } {
		const bindings = this.#resolveBindings();
		let aspect = requested
			?? (defaultType === "position"
				? CoverAspect.Primary
				: CoverAspect.Tilt);
		if (aspect === CoverAspect.Primary || aspect === CoverAspect.Tilt) {
			const resolved = this.#resolvePrimary(
				bindings,
				aspect === CoverAspect.Primary ? "position" : "tilt",
			);
			if (!resolved) {
				throw new ZWaveError(
					`This endpoint has no ${
						aspect === CoverAspect.Primary ? "position" : "tilt"
					} aspect`,
					ZWaveErrorCodes.CC_NotSupported,
				);
			}
			aspect = resolved;
		}
		const binding = bindings.get(aspect);
		if (!binding) {
			throw new ZWaveError(
				`This endpoint has no cover aspect ${aspect}`,
				ZWaveErrorCodes.CC_NotSupported,
			);
		}
		return { aspect, binding };
	}

	// CC API accessors. The covers API never controls the Multilevel Switch CC
	// when the Window Covering CC is supported, see #resolveBindings
	#wcAPI(): WindowCoveringCCAPI {
		return this.endpoint.commandClasses[
			"Window Covering"
		] as unknown as WindowCoveringCCAPI;
	}

	#mlsAPI(): MultilevelSwitchCCAPI {
		return this.endpoint.commandClasses[
			"Multilevel Switch"
		] as unknown as MultilevelSwitchCCAPI;
	}

	#bwcAPI(): BasicWindowCoveringCCAPI {
		return this.endpoint.commandClasses[
			"Basic Window Covering"
		] as unknown as BasicWindowCoveringCCAPI;
	}

	#fibaroAPI(): FibaroCCAPI {
		return this.endpoint.commandClasses[
			"Manufacturer Proprietary"
		] as unknown as FibaroCCAPI;
	}

	#tracker(aspect: CoverAspect, binding: AspectBinding): TransitionTracker {
		const existing = this.#trackers.get(aspect);
		if (existing) return existing;

		const node = this.endpoint.tryGetNode()!;
		const endpointIndex = this.endpoint.index;

		let currentValueId: ValueID | undefined;
		let targetValueId: ValueID | undefined;
		let durationValueId: ValueID | undefined;
		let verify: (() => Promise<void>) | null | undefined;

		switch (binding.backend) {
			case "windowCovering":
				durationValueId = WindowCoveringCCValues.duration(
					binding.parameter,
				).endpoint(endpointIndex);
				if (binding.positioned) {
					currentValueId = WindowCoveringCCValues.currentValue(
						binding.parameter,
					).endpoint(endpointIndex);
					targetValueId = WindowCoveringCCValues.targetValue(
						binding.parameter,
					).endpoint(endpointIndex);
				} else {
					// Movement-only parameters advertise no meaningful levels,
					// but their remaining duration can be queried
					verify = () => {
						node.schedulePoll(durationValueId!, { timeoutMs: 0 });
						return Promise.resolve();
					};
				}
				break;
			case "multilevelSwitch":
				currentValueId = MultilevelSwitchCCValues.currentValue
					.endpoint(endpointIndex);
				targetValueId = MultilevelSwitchCCValues.targetValue
					.endpoint(endpointIndex);
				durationValueId = MultilevelSwitchCCValues.duration
					.endpoint(endpointIndex);
				break;
			case "basicWindowCovering":
				// This CC has no state at all
				verify = null;
				break;
			case "fibaro":
				currentValueId = binding.property === "position"
					? getFibaroVenetianBlindPositionValueId(endpointIndex)
					: getFibaroVenetianBlindTiltValueId(endpointIndex);
				break;
		}

		const tracker = new TransitionTracker(node, {
			currentValueId,
			targetValueId,
			durationValueId,
			verify,
		});
		tracker.on("transition update", (state) => {
			node.emit(
				"cover state changed",
				this.endpoint as any,
				this.#translateState(aspect, binding, state),
			);
		});
		this.#trackers.set(aspect, tracker);
		return tracker;
	}

	#translateState(
		aspect: CoverAspect,
		binding: AspectBinding,
		state: TransitionState,
	): CoverAspectState {
		const translateLevel = (level: number | undefined) => {
			if (level == undefined) return undefined;
			if (binding.backend === "fibaro" && binding.type === "tilt") {
				return fibaroTiltToUnified(level);
			}
			return level;
		};
		return {
			aspect,
			type: binding.type,
			currentValue: translateLevel(state.currentLevel),
			targetValue: translateLevel(state.targetLevel),
			movement: movementFromTransition(binding, state),
			remainingDuration: state.estimatedDuration,
			currentValueReliability: reliabilityFromTransition(state),
		};
	}

	/** Returns the consolidated state of a cover aspect, based on cached data */
	public getStateCached(
		aspect?: CoverAspect,
	): CoverAspectState | undefined {
		try {
			const resolved = this.#resolveAspect(aspect, "position");
			const tracker = this.#tracker(resolved.aspect, resolved.binding);
			return this.#translateState(
				resolved.aspect,
				resolved.binding,
				tracker.state,
			);
		} catch {
			return undefined;
		}
	}

	/** Returns the consolidated state of all cover aspects, based on cached data */
	public getAllStatesCached(): CoverAspectState[] {
		const ret: CoverAspectState[] = [];
		for (const [aspect, binding] of this.#resolveBindings()) {
			const tracker = this.#tracker(aspect, binding);
			ret.push(this.#translateState(aspect, binding, tracker.state));
		}
		return ret;
	}

	/** Opens the cover, or tilts the slats to the open position when targeting a tilt aspect */
	public async open(
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		return this.#moveToExtreme("open", options);
	}

	/** Closes the cover, or tilts the slats to the closed position when targeting a tilt aspect */
	public async close(
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		return this.#moveToExtreme("close", options);
	}

	async #moveToExtreme(
		direction: "open" | "close",
		options: CoverControlOptions,
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect,
			"position",
		);
		const caps = this.#capabilitiesFor(aspect, binding);
		if (caps.supportsGoToValue) {
			const target = direction === "open"
				? (binding.type === "tilt" ? TILT_OPEN : 99)
				: 0;
			return this.#setValueInternal(aspect, binding, target, options);
		}
		return this.#startTransitionInternal(
			aspect,
			binding,
			direction,
			options,
		);
	}

	/**
	 * Moves a cover aspect to a specific value. Positions use 0 (closed) to
	 * 99 (open), tilt values use the slat convention 0/50/99.
	 */
	public async setValue(
		value: number,
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect,
			"position",
		);
		return this.#setValueInternal(aspect, binding, value, options);
	}

	/** Moves the primary position aspect to a specific position, 0 (closed) to 99 (open) */
	public async setPosition(
		position: number,
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect ?? CoverAspect.Primary,
			"position",
		);
		return this.#setValueInternal(aspect, binding, position, options);
	}

	/** Tilts the slats to a specific value: 0 = closed, 50 = open, 99 = closed the other way */
	public async setTilt(
		tilt: number,
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect ?? CoverAspect.Tilt,
			"tilt",
		);
		return this.#setValueInternal(aspect, binding, tilt, options);
	}

	async #setValueInternal(
		aspect: CoverAspect,
		binding: AspectBinding,
		value: number,
		options: CoverControlOptions,
	): Promise<SupervisionResult | undefined> {
		if (value < 0 || value > 99 || !Number.isInteger(value)) {
			throw new ZWaveError(
				`The target value must be an integer between 0 and 99, received ${value}`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		const duration = Duration.from(options.duration);
		const tracker = this.#tracker(aspect, binding);

		switch (binding.backend) {
			case "windowCovering": {
				if (!binding.positioned) break;
				return tracker.trackCommand(
					{ type: "set", targetLevel: value, duration },
					(onUpdate) =>
						(this.#wcAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).set(
							[{ parameter: binding.parameter, value }],
							duration,
						),
				);
			}
			case "multilevelSwitch":
				return tracker.trackCommand(
					{ type: "set", targetLevel: value, duration },
					(onUpdate) =>
						(this.#mlsAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).set(value, duration),
				);
			case "fibaro": {
				const raw = binding.property === "tilt"
					? unifiedTiltToFibaro(value)
					: value;
				return tracker.trackCommand(
					{ type: "set", targetLevel: raw },
					async () => {
						const api = this.#fibaroAPI();
						if (binding.property === "position") {
							await api.fibaroVenetianBlindsSetPosition(raw);
						} else {
							await api.fibaroVenetianBlindsSetTilt(raw);
						}
						return undefined;
					},
				);
			}
			case "basicWindowCovering":
				break;
		}
		throw new ZWaveError(
			`The cover aspect ${aspect} cannot be moved to a specific value`,
			ZWaveErrorCodes.CC_NotSupported,
		);
	}

	/** Starts an open-ended movement in the given direction. Use {@link stop} to end it */
	public async startTransition(
		direction: "open" | "close",
		options: CoverControlOptions = {},
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect,
			"position",
		);
		return this.#startTransitionInternal(
			aspect,
			binding,
			direction,
			options,
		);
	}

	async #startTransitionInternal(
		aspect: CoverAspect,
		binding: AspectBinding,
		direction: "open" | "close",
		options: CoverControlOptions,
	): Promise<SupervisionResult | undefined> {
		const duration = Duration.from(options.duration);
		const tracker = this.#tracker(aspect, binding);
		const levelDirection = this.#levelDirectionFor(
			binding,
			direction,
			tracker.state.currentLevel,
		);
		const command: TransitionCommand = {
			type: "startLevelChange",
			direction: levelDirection,
			duration,
		};

		switch (binding.backend) {
			case "windowCovering":
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#wcAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).startLevelChange(
							binding.parameter,
							levelDirection,
							duration,
						),
				);
			case "multilevelSwitch":
			case "fibaro": {
				// Fibaro venetian blinds support open-ended movement only
				// through the Multilevel Switch CC
				if (
					binding.backend === "fibaro"
					&& (binding.type === "tilt"
						|| !this.endpoint.supportsCC(
							CommandClasses["Multilevel Switch"],
						))
				) {
					break;
				}
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#mlsAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).startLevelChange({
							direction: levelDirection,
							ignoreStartLevel: true,
							duration,
						}),
				);
			}
			case "basicWindowCovering":
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#bwcAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).startLevelChange(
							levelDirection,
						),
				);
		}
		throw new ZWaveError(
			`The cover aspect ${aspect} does not support open-ended movement`,
			ZWaveErrorCodes.CC_NotSupported,
		);
	}

	#levelDirectionFor(
		binding: AspectBinding,
		direction: "open" | "close",
		currentLevel: number | undefined,
	): "up" | "down" {
		if (binding.type === "position") {
			return direction === "open" ? "up" : "down";
		}
		// Open slats by moving towards the midpoint, close them by moving
		// towards the nearest extreme
		const current = currentLevel ?? 0;
		if (direction === "open") {
			return current < TILT_OPEN ? "up" : "down";
		}
		return current < TILT_OPEN ? "down" : "up";
	}

	/** Stops an ongoing movement of a cover aspect */
	public async stop(
		options: { aspect?: CoverAspect } = {},
	): Promise<SupervisionResult | undefined> {
		const { aspect, binding } = this.#resolveAspect(
			options.aspect,
			"position",
		);
		return this.#stopInternal(aspect, binding);
	}

	async #stopInternal(
		aspect: CoverAspect,
		binding: AspectBinding,
	): Promise<SupervisionResult | undefined> {
		const tracker = this.#tracker(aspect, binding);
		const command: TransitionCommand = { type: "stop" };

		switch (binding.backend) {
			case "windowCovering":
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#wcAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).stopLevelChange(
							binding.parameter,
						),
				);
			case "multilevelSwitch":
			case "fibaro":
				if (
					binding.backend === "fibaro"
					&& !this.endpoint.supportsCC(
						CommandClasses["Multilevel Switch"],
					)
				) {
					break;
				}
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#mlsAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).stopLevelChange(),
				);
			case "basicWindowCovering":
				return tracker.trackCommand(
					command,
					(onUpdate) =>
						(this.#bwcAPI().withOptions({
							requestStatusUpdates: true,
							onUpdate,
						})).stopLevelChange(),
				);
		}
		throw new ZWaveError(
			`The cover aspect ${aspect} does not support stopping`,
			ZWaveErrorCodes.CC_NotSupported,
		);
	}

	/**
	 * @internal
	 * Feeds a device-initiated Multilevel Switch Start/Stop Level Change to
	 * the movement tracking
	 */
	public handleUnsolicitedLevelChange(
		direction: "up" | "down" | "stop",
	): void {
		for (const [aspect, binding] of this.#resolveBindings()) {
			if (binding.backend !== "multilevelSwitch") continue;
			this.#tracker(aspect, binding).handleUnsolicitedLevelChange(
				direction,
			);
		}
	}

	/** Stops all ongoing movements of this cover */
	public async stopAll(): Promise<void> {
		const stopped = new Set<string>();
		for (const [aspect, binding] of this.#resolveBindings()) {
			// The Multilevel Switch and Basic Window Covering CCs stop all
			// movement at once
			const key = binding.backend === "windowCovering"
				? `wc-${binding.parameter}`
				: binding.backend;
			if (stopped.has(key)) continue;
			stopped.add(key);
			try {
				await this.#stopInternal(aspect, binding);
			} catch (e) {
				if (
					e instanceof ZWaveError
					&& e.code === ZWaveErrorCodes.CC_NotSupported
				) {
					continue;
				}
				throw e;
			}
		}
	}

	/**
	 * Sets multiple cover aspects at once, e.g. position and tilt. Aspects
	 * backed by the same CC are combined into a single command.
	 */
	public async setValues(
		values: { aspect: CoverAspect; value: number }[],
		duration?: Duration | string,
	): Promise<void> {
		const resolvedDuration = Duration.from(duration);

		const wcTargets: {
			aspect: CoverAspect;
			binding: AspectBinding & { backend: "windowCovering" };
			value: number;
		}[] = [];
		const fibaroTargets: {
			aspect: CoverAspect;
			binding: AspectBinding & { backend: "fibaro" };
			value: number;
		}[] = [];
		const rest: { aspect: CoverAspect; value: number }[] = [];

		for (const { aspect: requested, value } of values) {
			const { aspect, binding } = this.#resolveAspect(
				requested,
				"position",
			);
			if (binding.backend === "windowCovering" && binding.positioned) {
				wcTargets.push({ aspect, binding, value });
			} else if (binding.backend === "fibaro") {
				fibaroTargets.push({ aspect, binding, value });
			} else {
				rest.push({ aspect: requested, value });
			}
		}

		if (wcTargets.length > 0) {
			const result = await this.#wcAPI().set(
				wcTargets.map(({ binding, value }) => ({
					parameter: binding.parameter,
					value,
				})),
				resolvedDuration,
			);
			for (const { aspect, binding, value } of wcTargets) {
				this.#tracker(aspect, binding).notifyCommand(
					{
						type: "set",
						targetLevel: value,
						duration: resolvedDuration,
					},
					result,
				);
			}
		}

		if (fibaroTargets.length > 0) {
			const position = fibaroTargets.find(({ binding }) =>
				binding.property === "position"
			);
			const tilt = fibaroTargets.find(({ binding }) =>
				binding.property === "tilt"
			);
			const rawTilt = tilt && unifiedTiltToFibaro(tilt.value);
			const api = this.#fibaroAPI();
			if (position && rawTilt != undefined) {
				await api.fibaroVenetianBlindsSet({
					position: position.value,
					tilt: rawTilt,
				});
			} else if (position) {
				await api.fibaroVenetianBlindsSetPosition(position.value);
			} else if (rawTilt != undefined) {
				await api.fibaroVenetianBlindsSetTilt(rawTilt);
			}
			for (const { aspect, binding, value } of fibaroTargets) {
				this.#tracker(aspect, binding).notifyCommand(
					{
						type: "set",
						targetLevel: binding.property === "tilt"
							? unifiedTiltToFibaro(value)
							: value,
					},
					undefined,
				);
			}
		}

		for (const { aspect, value } of rest) {
			await this.setValue(value, { aspect, duration });
		}
	}

	/** Queries the device for the current state of a cover aspect */
	public async refreshState(
		aspect?: CoverAspect,
	): Promise<CoverAspectState | undefined> {
		const resolved = this.#resolveAspect(aspect, "position");
		const { binding } = resolved;

		switch (binding.backend) {
			case "windowCovering":
				if (binding.positioned) {
					await this.#wcAPI().get(binding.parameter);
				}
				break;
			case "multilevelSwitch":
				await this.#mlsAPI().get();
				break;
			case "fibaro":
				await this.#fibaroAPI().fibaroVenetianBlindsGet();
				break;
			case "basicWindowCovering":
				break;
		}

		return this.getStateCached(aspect);
	}

	public override destroy(): void {
		for (const tracker of this.#trackers.values()) {
			tracker.destroy();
		}
		this.#trackers.clear();
	}
}
