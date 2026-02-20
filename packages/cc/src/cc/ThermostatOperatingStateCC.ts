import {
	CommandClasses,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	MessagePriority,
	type MessageRecord,
	ValueMetadata,
	type WithAddress,
	encodeBitMask,
	enumValuesToMetadataStates,
	parseBitMask,
	validatePayload,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import {
	CCAPI,
	POLL_VALUE,
	PhysicalCCAPI,
	type PollValueImplementation,
	throwUnsupportedProperty,
} from "../lib/API.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
	type RefreshValuesContext,
} from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	ccValueProperty,
	ccValues,
	commandClass,
	expectedCCResponse,
	implementedVersion,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import {
	ThermostatOperatingState,
	ThermostatOperatingStateCommand,
	type ThermostatOperatingStateLoggingData,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

export const ThermostatOperatingStateCCValues = V.defineCCValues(
	CommandClasses["Thermostat Operating State"],
	{
		...V.staticPropertyWithName(
			"operatingState",
			"state",
			{
				...ValueMetadata.ReadOnlyUInt8,
				label: "Operating state",
				states: enumValuesToMetadataStates(ThermostatOperatingState),
			} as const,
		),
	},
);

// @noSetValueAPI This CC is read-only

@API(CommandClasses["Thermostat Operating State"])
export class ThermostatOperatingStateCCAPI extends PhysicalCCAPI {
	public supportsCommand(
		cmd: ThermostatOperatingStateCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case ThermostatOperatingStateCommand.Get:
				return true; // This is mandatory
			case ThermostatOperatingStateCommand.LoggingSupportedGet:
			case ThermostatOperatingStateCommand.LoggingGet:
				return this.version >= 2;
		}
		return super.supportsCommand(cmd);
	}

	protected get [POLL_VALUE](): PollValueImplementation {
		return async function(
			this: ThermostatOperatingStateCCAPI,
			{ property },
		) {
			switch (property) {
				case "state":
					return this.get();
				default:
					throwUnsupportedProperty(this.ccId, property);
			}
		};
	}

	public async get(): Promise<MaybeNotKnown<ThermostatOperatingState>> {
		this.assertSupportsCommand(
			ThermostatOperatingStateCommand,
			ThermostatOperatingStateCommand.Get,
		);

		const cc = new ThermostatOperatingStateCCGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			ThermostatOperatingStateCCReport
		>(
			cc,
			this.commandOptions,
		);
		return response?.state;
	}

	public async getSupportedLoggingTypes(): Promise<
		MaybeNotKnown<readonly ThermostatOperatingState[]>
	> {
		this.assertSupportsCommand(
			ThermostatOperatingStateCommand,
			ThermostatOperatingStateCommand.LoggingSupportedGet,
		);

		const cc = new ThermostatOperatingStateCCLoggingSupportedGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response = await this.host.sendCommand<
			ThermostatOperatingStateCCLoggingSupportedReport
		>(
			cc,
			this.commandOptions,
		);
		return response?.supportedLoggingTypes;
	}

	@validateArgs()
	public async getLogging(
		states: ThermostatOperatingState[],
	): Promise<
		MaybeNotKnown<
			ReadonlyMap<
				ThermostatOperatingState,
				ThermostatOperatingStateLoggingData
			>
		>
	> {
		this.assertSupportsCommand(
			ThermostatOperatingStateCommand,
			ThermostatOperatingStateCommand.LoggingGet,
		);

		const cc = new ThermostatOperatingStateCCLoggingGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			requestedStates: states,
		});
		const response = await this.host.sendCommand<
			ThermostatOperatingStateCCLoggingReport
		>(
			cc,
			this.commandOptions,
		);
		return response?.loggingData;
	}
}

@commandClass(CommandClasses["Thermostat Operating State"])
@implementedVersion(2)
@ccValues(ThermostatOperatingStateCCValues)
export class ThermostatOperatingStateCC extends CommandClass {
	declare ccCommand: ThermostatOperatingStateCommand;

	public async interview(
		ctx: InterviewContext,
	): Promise<void> {
		const node = this.getNode(ctx)!;

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `Interviewing ${this.ccName}...`,
			direction: "none",
		});

		await this.refreshValues(ctx);

		this.setInterviewComplete(ctx, true);
	}

	public async refreshValues(
		ctx: RefreshValuesContext,
	): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["Thermostat Operating State"],
			ctx,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying thermostat operating state...",
			direction: "outbound",
		});

		const state = await api.get();
		if (state != undefined) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: `received current thermostat operating state: ${
					getEnumMemberName(
						ThermostatOperatingState,
						state,
					)
				}`,
				direction: "inbound",
			});
		}
	}
}

// @publicAPI
export interface ThermostatOperatingStateCCReportOptions {
	state: ThermostatOperatingState;
}

@CCCommand(ThermostatOperatingStateCommand.Report)
@ccValueProperty("state", ThermostatOperatingStateCCValues.operatingState)
export class ThermostatOperatingStateCCReport
	extends ThermostatOperatingStateCC
{
	public constructor(
		options: WithAddress<ThermostatOperatingStateCCReportOptions>,
	) {
		super(options);
		this.state = options.state;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ThermostatOperatingStateCCReport {
		validatePayload(raw.payload.length >= 1);
		const state: ThermostatOperatingState = raw.payload[0];

		validatePayload(
			state <= ThermostatOperatingState["3rd Stage Aux Heat"],
		);

		return new this({
			nodeId: ctx.sourceNodeId,
			state,
		});
	}

	public readonly state: ThermostatOperatingState;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.state]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				state: getEnumMemberName(ThermostatOperatingState, this.state),
			},
		};
	}
}

@CCCommand(ThermostatOperatingStateCommand.Get)
@expectedCCResponse(ThermostatOperatingStateCCReport)
export class ThermostatOperatingStateCCGet extends ThermostatOperatingStateCC {}

// @publicAPI
export interface ThermostatOperatingStateCCLoggingSupportedReportOptions {
	supportedLoggingTypes: ThermostatOperatingState[];
}

@CCCommand(ThermostatOperatingStateCommand.LoggingSupportedReport)
export class ThermostatOperatingStateCCLoggingSupportedReport
	extends ThermostatOperatingStateCC
{
	public constructor(
		options: WithAddress<
			ThermostatOperatingStateCCLoggingSupportedReportOptions
		>,
	) {
		super(options);
		this.supportedLoggingTypes = options.supportedLoggingTypes;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ThermostatOperatingStateCCLoggingSupportedReport {
		// Bit 0 is not allocated, bit 1 = Operating State 1, etc.
		const supportedLoggingTypes: ThermostatOperatingState[] = parseBitMask(
			raw.payload,
			ThermostatOperatingState["Idle"],
		);

		return new this({
			nodeId: ctx.sourceNodeId,
			supportedLoggingTypes,
		});
	}

	public readonly supportedLoggingTypes: ThermostatOperatingState[];

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeBitMask(
			this.supportedLoggingTypes,
			undefined,
			ThermostatOperatingState["Idle"],
		);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"supported logging types": this.supportedLoggingTypes
					.map((t) => getEnumMemberName(ThermostatOperatingState, t))
					.join(", "),
			},
		};
	}
}

@CCCommand(ThermostatOperatingStateCommand.LoggingSupportedGet)
@expectedCCResponse(ThermostatOperatingStateCCLoggingSupportedReport)
export class ThermostatOperatingStateCCLoggingSupportedGet
	extends ThermostatOperatingStateCC
{}

// @publicAPI
export interface ThermostatOperatingStateCCLoggingReportOptions {
	reportsToFollow: number;
	loggingData: Map<
		ThermostatOperatingState,
		ThermostatOperatingStateLoggingData
	>;
}

@CCCommand(ThermostatOperatingStateCommand.LoggingReport)
export class ThermostatOperatingStateCCLoggingReport
	extends ThermostatOperatingStateCC
{
	public constructor(
		options: WithAddress<ThermostatOperatingStateCCLoggingReportOptions>,
	) {
		super(options);
		this.reportsToFollow = options.reportsToFollow;
		this.loggingData = options.loggingData;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ThermostatOperatingStateCCLoggingReport {
		validatePayload(raw.payload.length >= 1);
		const reportsToFollow = raw.payload[0];

		// Each log entry is 5 bytes:
		// Reserved[7:4]+StateType[3:0], TodayH, TodayM, YesterdayH, YesterdayM
		const loggingData = new Map<
			ThermostatOperatingState,
			ThermostatOperatingStateLoggingData
		>();
		let offset = 1;
		while (offset + 5 <= raw.payload.length) {
			const state: ThermostatOperatingState = raw.payload[offset++]
				& 0b1111;
			loggingData.set(state, {
				usageTodayHours: raw.payload[offset++],
				usageTodayMinutes: raw.payload[offset++],
				usageYesterdayHours: raw.payload[offset++],
				usageYesterdayMinutes: raw.payload[offset++],
			});
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			reportsToFollow,
			loggingData,
		});
	}

	public reportsToFollow: number;
	public loggingData: Map<
		ThermostatOperatingState,
		ThermostatOperatingStateLoggingData
	>;

	public getPartialCCSessionId(): Record<string, any> | undefined {
		return {};
	}

	public expectMoreMessages(): boolean {
		return this.reportsToFollow > 0;
	}

	public mergePartialCCs(
		partials: ThermostatOperatingStateCCLoggingReport[],
		_ctx: CCParsingContext,
	): Promise<void> {
		// Merge all logging data maps from partial reports
		const merged = new Map<
			ThermostatOperatingState,
			ThermostatOperatingStateLoggingData
		>();
		for (const partial of partials) {
			for (const [state, data] of partial.loggingData) {
				merged.set(state, data);
			}
		}
		for (const [state, data] of this.loggingData) {
			merged.set(state, data);
		}
		this.loggingData = merged;
		return Promise.resolve();
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(1 + this.loggingData.size * 5);
		this.payload[0] = this.reportsToFollow;
		let offset = 1;
		for (const [state, entry] of this.loggingData) {
			this.payload[offset++] = state & 0b1111;
			this.payload[offset++] = entry.usageTodayHours;
			this.payload[offset++] = entry.usageTodayMinutes;
			this.payload[offset++] = entry.usageYesterdayHours;
			this.payload[offset++] = entry.usageYesterdayMinutes;
		}
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		const message: MessageRecord = {
			"reports to follow": this.reportsToFollow,
		};
		for (const [state, entry] of this.loggingData) {
			const stateName = getEnumMemberName(
				ThermostatOperatingState,
				state,
			);
			message[`${stateName} today`] =
				`${entry.usageTodayHours}h ${entry.usageTodayMinutes}m`;
			message[`${stateName} yesterday`] =
				`${entry.usageYesterdayHours}h ${entry.usageYesterdayMinutes}m`;
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export interface ThermostatOperatingStateCCLoggingGetOptions {
	requestedStates: ThermostatOperatingState[];
}

@CCCommand(ThermostatOperatingStateCommand.LoggingGet)
@expectedCCResponse(ThermostatOperatingStateCCLoggingReport)
export class ThermostatOperatingStateCCLoggingGet
	extends ThermostatOperatingStateCC
{
	public constructor(
		options: WithAddress<ThermostatOperatingStateCCLoggingGetOptions>,
	) {
		super(options);
		this.requestedStates = options.requestedStates;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ThermostatOperatingStateCCLoggingGet {
		const requestedStates: ThermostatOperatingState[] = parseBitMask(
			raw.payload,
			ThermostatOperatingState["Idle"],
		);

		return new this({
			nodeId: ctx.sourceNodeId,
			requestedStates,
		});
	}

	public requestedStates: ThermostatOperatingState[];

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeBitMask(
			this.requestedStates,
			undefined,
			ThermostatOperatingState["Idle"],
		);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"requested states": this.requestedStates
					.map((t) => getEnumMemberName(ThermostatOperatingState, t))
					.join(", "),
			},
		};
	}
}
