import type {
	MessageOrCCLogEntry,
	SupervisionResult,
} from "@zwave-js/core/safe";
import {
	CommandClasses,
	type MaybeNotKnown,
	MessagePriority,
	validatePayload,
} from "@zwave-js/core/safe";
import type {
	ZWaveApplicationHost,
	ZWaveHost,
	ZWaveValueHost,
} from "@zwave-js/host/safe";
import { getEnumMemberName, pick } from "@zwave-js/shared/safe";
import { validateArgs } from "@zwave-js/transformers";
import {
	CCAPI,
	POLL_VALUE,
	type PollValueImplementation,
	throwUnsupportedProperty,
} from "../lib/API";
import {
	type CCCommandOptions,
	CommandClass,
	type CommandClassDeserializationOptions,
	gotDeserializationOptions,
} from "../lib/CommandClass";
import {
	API,
	CCCommand,
	commandClass,
	expectedCCResponse,
	implementedVersion,
	useSupervision,
} from "../lib/CommandClassDecorators";
import {
	type SetbackState,
	SetbackType,
	ThermostatSetbackCommand,
} from "../lib/_Types";
import { decodeSetbackState, encodeSetbackState } from "../lib/serializers";

// @noSetValueAPI
// The setback state consist of two values that must be set together

@API(CommandClasses["Thermostat Setback"])
export class ThermostatSetbackCCAPI extends CCAPI {
	public supportsCommand(
		cmd: ThermostatSetbackCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case ThermostatSetbackCommand.Get:
				return this.isSinglecast();
			case ThermostatSetbackCommand.Set:
				return true; // This is mandatory
		}
		return super.supportsCommand(cmd);
	}

	protected get [POLL_VALUE](): PollValueImplementation {
		return async function(this: ThermostatSetbackCCAPI, { property }) {
			switch (property) {
				case "setbackType":
				case "setbackState":
					return (await this.get())?.[property];

				default:
					throwUnsupportedProperty(this.ccId, property);
			}
		};
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public async get() {
		this.assertSupportsCommand(
			ThermostatSetbackCommand,
			ThermostatSetbackCommand.Get,
		);

		const cc = new ThermostatSetbackCCGet(this.applHost, {
			nodeId: this.endpoint.nodeId,
			endpoint: this.endpoint.index,
		});
		const response = await this.applHost.sendCommand<
			ThermostatSetbackCCReport
		>(
			cc,
			this.commandOptions,
		);
		if (response) {
			return pick(response, ["setbackType", "setbackState"]);
		}
	}

	@validateArgs()
	public async set(
		setbackType: SetbackType,
		setbackState: SetbackState,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ThermostatSetbackCommand,
			ThermostatSetbackCommand.Get,
		);

		const cc = new ThermostatSetbackCCSet(this.applHost, {
			nodeId: this.endpoint.nodeId,
			endpoint: this.endpoint.index,
			setbackType,
			setbackState,
		});
		return this.applHost.sendCommand(cc, this.commandOptions);
	}
}

@commandClass(CommandClasses["Thermostat Setback"])
@implementedVersion(1)
export class ThermostatSetbackCC extends CommandClass {
	declare ccCommand: ThermostatSetbackCommand;

	public async interview(applHost: ZWaveApplicationHost): Promise<void> {
		const node = this.getNode(applHost)!;

		applHost.controllerLog.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `Interviewing ${this.ccName}...`,
			direction: "none",
		});

		await this.refreshValues(applHost);

		// Remember that the interview is complete
		this.setInterviewComplete(applHost, true);
	}

	public async refreshValues(applHost: ZWaveApplicationHost): Promise<void> {
		const node = this.getNode(applHost)!;
		const endpoint = this.getEndpoint(applHost)!;
		const api = CCAPI.create(
			CommandClasses["Thermostat Setback"],
			applHost,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		// Query the thermostat state
		applHost.controllerLog.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying the current thermostat state...",
			direction: "outbound",
		});
		const setbackResp = await api.get();
		if (setbackResp) {
			const logMessage = `received current state:
setback type:  ${getEnumMemberName(SetbackType, setbackResp.setbackType)}
setback state: ${setbackResp.setbackState}`;
			applHost.controllerLog.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: logMessage,
				direction: "inbound",
			});
		}
	}
}

// @publicAPI
export interface ThermostatSetbackCCSetOptions extends CCCommandOptions {
	setbackType: SetbackType;
	setbackState: SetbackState;
}

@CCCommand(ThermostatSetbackCommand.Set)
@useSupervision()
export class ThermostatSetbackCCSet extends ThermostatSetbackCC {
	public constructor(
		host: ZWaveHost,
		options:
			| CommandClassDeserializationOptions
			| ThermostatSetbackCCSetOptions,
	) {
		super(host, options);
		if (gotDeserializationOptions(options)) {
			validatePayload(this.payload.length >= 2);
			this.setbackType = this.payload[0] & 0b11;
			// If we receive an unknown setback state, return the raw value
			const rawSetbackState = this.payload.readInt8(1);
			this.setbackState = decodeSetbackState(rawSetbackState)
				|| rawSetbackState;
		} else {
			this.setbackType = options.setbackType;
			this.setbackState = options.setbackState;
		}
	}

	public setbackType: SetbackType;
	/** The offset from the setpoint in 0.1 Kelvin or a special mode */
	public setbackState: SetbackState;

	public serialize(): Buffer {
		this.payload = Buffer.from([
			this.setbackType & 0b11,
			encodeSetbackState(this.setbackState),
		]);
		return super.serialize();
	}

	public toLogEntry(host?: ZWaveValueHost): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(host),
			message: {
				"setback type": getEnumMemberName(
					SetbackType,
					this.setbackType,
				),
				"setback state": typeof this.setbackState === "number"
					? `${this.setbackState} K`
					: this.setbackState,
			},
		};
	}
}

// @publicAPI
export interface ThermostatSetbackCCReportOptions {
	setbackType: SetbackType;
	setbackState: SetbackState;
}

@CCCommand(ThermostatSetbackCommand.Report)
export class ThermostatSetbackCCReport extends ThermostatSetbackCC {
	public constructor(
		host: ZWaveHost,
		options:
			| CommandClassDeserializationOptions
			| (CCCommandOptions & ThermostatSetbackCCReportOptions),
	) {
		super(host, options);

		if (gotDeserializationOptions(options)) {
			validatePayload(this.payload.length >= 2);
			this.setbackType = this.payload[0] & 0b11;
			// If we receive an unknown setback state, return the raw value
			const rawSetbackState = this.payload.readInt8(1);
			this.setbackState = decodeSetbackState(rawSetbackState)
				|| rawSetbackState;
		} else {
			this.setbackType = options.setbackType;
			this.setbackState = options.setbackState;
		}
	}

	public readonly setbackType: SetbackType;
	/** The offset from the setpoint in 0.1 Kelvin or a special mode */
	public readonly setbackState: SetbackState;

	public serialize(): Buffer {
		this.payload = Buffer.from([
			this.setbackType & 0b11,
			encodeSetbackState(this.setbackState),
		]);
		return super.serialize();
	}

	public toLogEntry(host?: ZWaveValueHost): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(host),
			message: {
				"setback type": getEnumMemberName(
					SetbackType,
					this.setbackType,
				),
				"setback state": typeof this.setbackState === "number"
					? `${this.setbackState} K`
					: this.setbackState,
			},
		};
	}
}

@CCCommand(ThermostatSetbackCommand.Get)
@expectedCCResponse(ThermostatSetbackCCReport)
export class ThermostatSetbackCCGet extends ThermostatSetbackCC {}
