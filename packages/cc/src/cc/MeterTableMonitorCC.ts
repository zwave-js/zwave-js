import {
	CommandClasses,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	MessagePriority,
	ValueMetadata,
	type WithAddress,
	ZWaveError,
	ZWaveErrorCodes,
	getPrecision,
	logDict,
	logList,
	logText,
	validatePayload,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";

import {
	CCAPI,
	POLL_VALUE,
	type PollValueImplementation,
	throwUnsupportedProperty,
} from "../lib/API.js";
import { meterTablePropertyKey } from "../lib/CCValueUtils.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
	type PersistValuesContext,
	type RefreshValuesContext,
	type RefreshValuesOptions,
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
	MeterTableMeterType,
	MeterTableMonitorCommand,
	MeterTablePayMeter,
	MeterTableRateType,
	type MeterTableReading,
	getMeterTableScale,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

/** The bit numbers that are set in a 24-bit dataset mask, lowest first */
export function meterTableDatasets(mask: number): number[] {
	const ret: number[] = [];
	for (let bit = 0; bit < 24; bit++) {
		if (mask & (1 << bit)) ret.push(bit);
	}
	return ret;
}

function splitPropertyKey(key: number): {
	meterType: number;
	rateType: MeterTableRateType;
	dataset: number;
} {
	return {
		meterType: (key >>> 16) & 0xff,
		rateType: (key >>> 8) & 0xff,
		dataset: key & 0xff,
	};
}

/**
 * The rate type that a value is stored under. It comes from the meter's
 * capability, so the same dataset always ends up under the same value ID.
 * Only a meter that measures both directions says in each report which of
 * the two it contains. If such a report does not say it, the reading can't
 * be assigned and undefined is returned.
 */
function getEffectiveRateType(
	reported: MeterTableRateType,
	capability: MeterTableRateType | undefined,
): MeterTableRateType | undefined {
	const isDirection = (rateType: MeterTableRateType | undefined) =>
		rateType === MeterTableRateType.Import
		|| rateType === MeterTableRateType.Export;
	if (isDirection(capability)) return capability;
	if (capability === MeterTableRateType["Import and export"]) {
		return isDirection(reported) ? reported : undefined;
	}
	return MeterTableRateType.Unspecified;
}

/**
 * Gives the readings of a report the scale of the meter type and the rate
 * type they are stored under. Leaves out readings without a rate type.
 */
function resolveReadings(
	readings: readonly MeterTableReading[],
	meterType: number | undefined,
	capability: MeterTableRateType | undefined,
): MeterTableReading[] {
	const ret: MeterTableReading[] = [];
	for (const reading of readings) {
		const rateType = getEffectiveRateType(reading.rateType, capability);
		if (rateType == undefined) continue;
		ret.push({
			...reading,
			rateType,
			scale:
				meterType != undefined
					? getMeterTableScale(meterType, reading.scale.key)
					: reading.scale,
		});
	}
	return ret;
}

/** Whether the meter's clock fields form a real date and time */
function isValidMeterTime(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
): boolean {
	// A meter without a set clock reports a date around 1970
	if (year < 2000 || month < 1 || month > 12) return false;
	if (hour > 23 || minute > 59 || second > 59) return false;
	// Day 0 or the 31st of a short month would roll over into another date
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return day >= 1 && day <= daysInMonth;
}

function getMeterTableValueLabel(
	meterType: number,
	rateType: MeterTableRateType,
	scaleLabel: string,
): string {
	const parts = [getEnumMemberName(MeterTableMeterType, meterType)];
	if (rateType === MeterTableRateType.Import) parts.push("import");
	else if (rateType === MeterTableRateType.Export) parts.push("export");
	return `${parts.join(" ")}: ${scaleLabel}`;
}

function readASCII(raw: CCRaw): string {
	validatePayload(raw.payload.length >= 1);
	const length = raw.payload[0] & 0b0001_1111;
	validatePayload(raw.payload.length >= 1 + length);
	// Unused characters are sent as NUL
	return Bytes.view(raw.payload.subarray(1, 1 + length))
		.toString("ascii")
		.replace(/\0+$/, "");
}

function encodeASCII(text: string): Bytes {
	if (!/^[\x00-\x7f]{0,31}$/.test(text)) {
		throw new ZWaveError(
			`The text must be at most 31 ASCII characters`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	const chars = Bytes.from(text, "ascii");
	return Bytes.concat([[chars.length], chars]);
}

function encodeDataset(mask: number): Bytes {
	if (!Number.isInteger(mask) || mask < 0 || mask > 0xff_ffff) {
		throw new ZWaveError(
			`A dataset mask must fit in 24 bits`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	const ret = new Bytes(3);
	ret.writeUIntBE(mask, 0, 3);
	return ret;
}

export const MeterTableMonitorCCValues = V.defineCCValues(
	CommandClasses["Meter Table Monitor"],
	{
		...V.staticProperty("meterType", undefined, { internal: true }),
		...V.staticProperty("rateType", undefined, { internal: true }),
		...V.staticProperty("payMeter", undefined, { internal: true }),
		...V.staticProperty("supportedDatasets", undefined, {
			internal: true,
		}),
		...V.staticProperty("meterId", {
			...ValueMetadata.ReadOnlyString,
			label: "Meter ID",
		}),
		...V.staticProperty("pointAdmNumber", {
			...ValueMetadata.ReadOnlyString,
			label: "Meter point administration number",
		}),
		...V.dynamicPropertyAndKeyWithName(
			"value",
			"value",
			meterTablePropertyKey,
			({ property, propertyKey }) =>
				property === "value" && typeof propertyKey === "number",
			(
				meterType: number,
				rateType: MeterTableRateType,
				dataset: number,
			) => ({
				...ValueMetadata.ReadOnlyNumber,
				label: `Dataset ${dataset}`,
				// label, unit and the rest of ccSpecific are set when a value
				// is received
				ccSpecific: { meterType, rateType, dataset },
			}),
		),
	},
);

// @noSetValueAPI This CC is read-only

@API(CommandClasses["Meter Table Monitor"])
export class MeterTableMonitorCCAPI extends CCAPI {
	public supportsCommand(
		cmd: MeterTableMonitorCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case MeterTableMonitorCommand.TablePointAdmNoGet:
			case MeterTableMonitorCommand.TableIdGet:
			case MeterTableMonitorCommand.TableCapabilityGet:
			case MeterTableMonitorCommand.CurrentDataGet:
				return true; // These are mandatory
		}
		return super.supportsCommand(cmd);
	}

	protected get [POLL_VALUE](): PollValueImplementation {
		return async function (
			this: MeterTableMonitorCCAPI,
			{ property, propertyKey },
		) {
			if (
				MeterTableMonitorCCValues.value.is({
					commandClass: this.ccId,
					property,
					propertyKey,
				})
			) {
				const { rateType, dataset } = splitPropertyKey(
					propertyKey as number,
				);
				const readings = await this.getCurrentData(1 << dataset);
				return readings?.find(
					(r) => r.dataset === dataset && r.rateType === rateType,
				)?.value;
			} else if (property === "meterId") {
				return this.getTableId();
			} else if (property === "pointAdmNumber") {
				return this.getTablePointAdmNumber();
			} else {
				throwUnsupportedProperty(this.ccId, property);
			}
		};
	}

	public async getTablePointAdmNumber(): Promise<MaybeNotKnown<string>> {
		this.assertSupportsCommand(
			MeterTableMonitorCommand,
			MeterTableMonitorCommand.TablePointAdmNoGet,
		);

		const cc = new MeterTableMonitorCCTablePointAdmNoGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response =
			await this.host.sendCommand<MeterTableMonitorCCTablePointAdmNoReport>(
				cc,
				this.commandOptions,
			);
		return response?.pointAdmNumber;
	}

	public async getTableId(): Promise<MaybeNotKnown<string>> {
		this.assertSupportsCommand(
			MeterTableMonitorCommand,
			MeterTableMonitorCommand.TableIdGet,
		);

		const cc = new MeterTableMonitorCCTableIdGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response =
			await this.host.sendCommand<MeterTableMonitorCCTableIdReport>(
				cc,
				this.commandOptions,
			);
		return response?.meterId;
	}

	public async getCapabilities(): Promise<
		MaybeNotKnown<
			Pick<
				MeterTableMonitorCCTableCapabilityReport,
				| "meterType"
				| "rateType"
				| "payMeter"
				| "supportedDatasets"
				| "supportedHistoryDatasets"
				| "supportedHistoryData"
			>
		>
	> {
		this.assertSupportsCommand(
			MeterTableMonitorCommand,
			MeterTableMonitorCommand.TableCapabilityGet,
		);

		const cc = new MeterTableMonitorCCTableCapabilityGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response =
			await this.host.sendCommand<MeterTableMonitorCCTableCapabilityReport>(
				cc,
				this.commandOptions,
			);
		if (response) {
			return pick(response, [
				"meterType",
				"rateType",
				"payMeter",
				"supportedDatasets",
				"supportedHistoryDatasets",
				"supportedHistoryData",
			]);
		}
	}

	/**
	 * Requests the current values of the given datasets (a bit mask). Each
	 * reading has the scale of the meter type and the rate type it is
	 * stored under. Readings that can't be assigned a rate type are left out.
	 */
	@validateArgs()
	public async getCurrentData(
		datasets: number,
	): Promise<MaybeNotKnown<readonly MeterTableReading[]>> {
		this.assertSupportsCommand(
			MeterTableMonitorCommand,
			MeterTableMonitorCommand.CurrentDataGet,
		);
		if (datasets === 0) {
			throw new ZWaveError(
				`At least one dataset must be requested`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		const cc = new MeterTableMonitorCCCurrentDataGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			datasets,
		});
		const response =
			await this.host.sendCommand<MeterTableMonitorCCCurrentDataReport>(
				cc,
				this.commandOptions,
			);
		if (!response) return;

		const valueDB = this.tryGetValueDB();
		const meterType: number | undefined = valueDB?.getValue(
			MeterTableMonitorCCValues.meterType.endpoint(this.endpoint.index),
		);
		const capability: MeterTableRateType | undefined = valueDB?.getValue(
			MeterTableMonitorCCValues.rateType.endpoint(this.endpoint.index),
		);
		return resolveReadings(response.readings, meterType, capability);
	}
}

@commandClass(CommandClasses["Meter Table Monitor"])
@implementedVersion(3)
@ccValues(MeterTableMonitorCCValues)
export class MeterTableMonitorCC extends CommandClass {
	declare ccCommand: MeterTableMonitorCommand;

	public translatePropertyKey(
		ctx: GetValueDB,
		property: string | number,
		propertyKey: string | number,
	): string | undefined {
		if (property === "value" && typeof propertyKey === "number") {
			const { meterType, rateType, dataset } =
				splitPropertyKey(propertyKey);
			const parts = [getEnumMemberName(MeterTableMeterType, meterType)];
			if (rateType !== MeterTableRateType.Unspecified) {
				parts.push(getEnumMemberName(MeterTableRateType, rateType));
			}
			parts.push(`dataset_${dataset}`);
			return parts.join("_");
		}
		return super.translatePropertyKey(ctx, property, propertyKey);
	}

	public async interview(ctx: InterviewContext): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["Meter Table Monitor"],
			ctx,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
			tag: "interview",
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `Interviewing ${this.ccName}...`,
			direction: "none",
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying meter table capabilities...",
			direction: "outbound",
		});
		const capabilities = await api.getCapabilities();
		if (!capabilities) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message:
					"Querying meter table capabilities timed out, skipping interview...",
				level: "warn",
			});
			return;
		}
		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: logText("received meter table capabilities:", {
				nested: logDict({
					"meter type": getEnumMemberName(
						MeterTableMeterType,
						capabilities.meterType,
					),
					"rate type": getEnumMemberName(
						MeterTableRateType,
						capabilities.rateType,
					),
					"supported datasets": logList(
						meterTableDatasets(capabilities.supportedDatasets),
					),
				}),
			}),
			direction: "inbound",
		});

		const meterId = await api.getTableId();
		if (meterId != undefined) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: `meter ID: ${meterId}`,
				direction: "inbound",
			});
		}
		await api.getTablePointAdmNumber();

		await this.refreshValues(ctx, { tag: "interview" });

		// Remember that the interview is complete
		this.setInterviewComplete(ctx, true);
	}

	public async refreshValues(
		ctx: RefreshValuesContext,
		options?: RefreshValuesOptions,
	): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["Meter Table Monitor"],
			ctx,
			endpoint,
		).withOptions({
			priority: options?.priority ?? MessagePriority.NodeQuery,
			tag: options?.tag,
		});

		const datasets: number =
			this.getValue(ctx, MeterTableMonitorCCValues.supportedDatasets)
			?? 0;
		if (!datasets) return;

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `querying current meter table data...`,
			direction: "outbound",
		});
		await api.getCurrentData(datasets);
	}
}

// @publicAPI
export interface MeterTableMonitorCCTablePointAdmNoReportOptions {
	pointAdmNumber: string;
}

@CCCommand(MeterTableMonitorCommand.TablePointAdmNoReport)
@ccValueProperty("pointAdmNumber", MeterTableMonitorCCValues.pointAdmNumber)
export class MeterTableMonitorCCTablePointAdmNoReport extends MeterTableMonitorCC {
	public constructor(
		options: WithAddress<MeterTableMonitorCCTablePointAdmNoReportOptions>,
	) {
		super(options);
		this.pointAdmNumber = options.pointAdmNumber;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTableMonitorCCTablePointAdmNoReport {
		return new this({
			nodeId: ctx.sourceNodeId,
			pointAdmNumber: readASCII(raw),
		});
	}

	public readonly pointAdmNumber: string;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeASCII(this.pointAdmNumber);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: { "point administration number": this.pointAdmNumber },
		};
	}
}

@CCCommand(MeterTableMonitorCommand.TablePointAdmNoGet)
@expectedCCResponse(MeterTableMonitorCCTablePointAdmNoReport)
export class MeterTableMonitorCCTablePointAdmNoGet extends MeterTableMonitorCC {}

// @publicAPI
export interface MeterTableMonitorCCTableIdReportOptions {
	meterId: string;
}

@CCCommand(MeterTableMonitorCommand.TableIdReport)
@ccValueProperty("meterId", MeterTableMonitorCCValues.meterId)
export class MeterTableMonitorCCTableIdReport extends MeterTableMonitorCC {
	public constructor(
		options: WithAddress<MeterTableMonitorCCTableIdReportOptions>,
	) {
		super(options);
		this.meterId = options.meterId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTableMonitorCCTableIdReport {
		return new this({
			nodeId: ctx.sourceNodeId,
			meterId: readASCII(raw),
		});
	}

	public readonly meterId: string;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeASCII(this.meterId);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: { "meter ID": this.meterId },
		};
	}
}

@CCCommand(MeterTableMonitorCommand.TableIdGet)
@expectedCCResponse(MeterTableMonitorCCTableIdReport)
export class MeterTableMonitorCCTableIdGet extends MeterTableMonitorCC {}

// @publicAPI
export interface MeterTableMonitorCCTableCapabilityReportOptions {
	meterType: number;
	rateType: MeterTableRateType;
	payMeter: MeterTablePayMeter;
	supportedDatasets: number;
	supportedHistoryDatasets: number;
	supportedHistoryData: number;
}

@CCCommand(MeterTableMonitorCommand.TableCapabilityReport)
@ccValueProperty("meterType", MeterTableMonitorCCValues.meterType)
@ccValueProperty("rateType", MeterTableMonitorCCValues.rateType)
@ccValueProperty("payMeter", MeterTableMonitorCCValues.payMeter)
@ccValueProperty(
	"supportedDatasets",
	MeterTableMonitorCCValues.supportedDatasets,
)
export class MeterTableMonitorCCTableCapabilityReport extends MeterTableMonitorCC {
	public constructor(
		options: WithAddress<MeterTableMonitorCCTableCapabilityReportOptions>,
	) {
		super(options);
		this.meterType = options.meterType;
		this.rateType = options.rateType;
		this.payMeter = options.payMeter;
		this.supportedDatasets = options.supportedDatasets;
		this.supportedHistoryDatasets = options.supportedHistoryDatasets;
		this.supportedHistoryData = options.supportedHistoryData;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTableMonitorCCTableCapabilityReport {
		validatePayload(raw.payload.length >= 11);
		const payload = Bytes.view(raw.payload);
		return new this({
			nodeId: ctx.sourceNodeId,
			meterType: payload[0] & 0b0011_1111,
			rateType: (payload[0] & 0b1100_0000) >>> 6,
			payMeter: payload[1] & 0b0000_1111,
			supportedDatasets: payload.readUIntBE(2, 3),
			supportedHistoryDatasets: payload.readUIntBE(5, 3),
			supportedHistoryData: payload.readUIntBE(8, 3),
		});
	}

	public readonly meterType: number;
	public readonly rateType: MeterTableRateType;
	public readonly payMeter: MeterTablePayMeter;
	/** Bit mask of the datasets with current values */
	public readonly supportedDatasets: number;
	/** Bit mask of the datasets with historical values */
	public readonly supportedHistoryDatasets: number;
	public readonly supportedHistoryData: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			[
				((this.rateType & 0b11) << 6) | (this.meterType & 0b0011_1111),
				this.payMeter & 0b0000_1111,
			],
			encodeDataset(this.supportedDatasets),
			encodeDataset(this.supportedHistoryDatasets),
			encodeDataset(this.supportedHistoryData),
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"meter type": getEnumMemberName(
					MeterTableMeterType,
					this.meterType,
				),
				"rate type": getEnumMemberName(
					MeterTableRateType,
					this.rateType,
				),
				"pay meter": getEnumMemberName(
					MeterTablePayMeter,
					this.payMeter,
				),
				"supported datasets":
					meterTableDatasets(this.supportedDatasets).join(", ")
					|| "none",
				"supported history datasets":
					meterTableDatasets(this.supportedHistoryDatasets).join(", ")
					|| "none",
			},
		};
	}
}

@CCCommand(MeterTableMonitorCommand.TableCapabilityGet)
@expectedCCResponse(MeterTableMonitorCCTableCapabilityReport)
export class MeterTableMonitorCCTableCapabilityGet extends MeterTableMonitorCC {}

// @publicAPI
export interface MeterTableMonitorCCCurrentDataReportOptions {
	reportsToFollow: number;
	rateType: MeterTableRateType;
	operatingStatusIndication: boolean;
	datasets: number;
	/**
	 * The time on the meter's clock, undefined if it is not set. The meter
	 * does not send a time zone, so the clock fields are stored as UTC: read
	 * them with the getUTC* methods. This is not the real UTC time unless
	 * the meter's clock runs in UTC.
	 */
	timestamp?: Date;
	/** The rate type of a reading defaults to that of the report */
	readings: (Omit<MeterTableReading, "rateType">
		& Partial<Pick<MeterTableReading, "rateType">>)[];
}

@CCCommand(MeterTableMonitorCommand.CurrentDataReport)
export class MeterTableMonitorCCCurrentDataReport extends MeterTableMonitorCC {
	public constructor(
		options: WithAddress<MeterTableMonitorCCCurrentDataReportOptions>,
	) {
		super(options);
		this.reportsToFollow = options.reportsToFollow;
		this.rateType = options.rateType;
		this.operatingStatusIndication = options.operatingStatusIndication;
		this.datasets = options.datasets;
		this.timestamp = options.timestamp;
		this.readings = options.readings.map((r) => ({
			...r,
			rateType: r.rateType ?? options.rateType,
		}));
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTableMonitorCCCurrentDataReport {
		validatePayload(raw.payload.length >= 12);
		const payload = Bytes.view(raw.payload);
		const reportsToFollow = payload[0];
		const rateType: MeterTableRateType = payload[1] & 0b11;
		const operatingStatusIndication = !!(payload[1] & 0b1000_0000);
		const datasets = payload.readUIntBE(2, 3);
		const year = payload.readUInt16BE(5);
		const [month, day, hour, minute, second] = payload.subarray(7, 12);
		const timestamp = isValidMeterTime(
			year,
			month,
			day,
			hour,
			minute,
			second,
		)
			? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
			: undefined;

		const readings: MeterTableReading[] = [];
		let offset = 12;
		for (const dataset of meterTableDatasets(datasets)) {
			validatePayload(payload.length >= offset + 5);
			const precision = (payload[offset] & 0b1110_0000) >>> 5;
			const scaleKey = payload[offset] & 0b0001_1111;
			const rawValue = payload.readUInt32BE(offset + 1);
			readings.push({
				dataset,
				rateType,
				// The meter type is not part of the report. The scale is
				// resolved with the stored meter type when persisting.
				scale: { key: scaleKey, label: `Scale ${scaleKey}` },
				value: rawValue / Math.pow(10, precision),
			});
			offset += 5;
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			reportsToFollow,
			rateType,
			operatingStatusIndication,
			datasets,
			timestamp,
			readings,
		});
	}

	public readonly reportsToFollow: number;
	public readonly rateType: MeterTableRateType;
	/** Whether the meter has an operating status event to report */
	public operatingStatusIndication: boolean;
	public datasets: number;
	/** The time on the meter's clock, as UTC fields (see the options) */
	public readonly timestamp: Date | undefined;
	public readings: readonly MeterTableReading[];

	public getPartialCCSessionId(): Record<string, any> | undefined {
		// The session key does not contain the endpoint
		return { endpoint: this.endpointIndex };
	}

	public getRemainingSegments(): number | undefined {
		return this.reportsToFollow;
	}

	public mergePartialCCs(
		partials: MeterTableMonitorCCCurrentDataReport[],
		_ctx: CCParsingContext,
	): Promise<void> {
		const all = [...partials, this];
		this.readings = all.flatMap((report) => report.readings);
		this.datasets = all.reduce((mask, report) => mask | report.datasets, 0);
		this.operatingStatusIndication = all.some(
			(report) => report.operatingStatusIndication,
		);
		return Promise.resolve();
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		const meterType: number | undefined = this.getValue(
			ctx,
			MeterTableMonitorCCValues.meterType,
		);
		// Without the meter type, the unit of the values is unknown
		if (meterType == undefined) {
			// Pushes keep coming while the interview has not reached this
			// endpoint yet
			const interviewed = this.isInterviewComplete(ctx);
			ctx.logNode(this.nodeId as number, {
				endpoint: this.endpointIndex,
				message: interviewed
					? "received meter table data before the meter type is known, ignoring it. Re-interview the node to query the meter type."
					: "ignoring meter table data until the interview has queried the meter type",
				level: interviewed ? "warn" : "verbose",
			});
			return true;
		}

		const capability: MeterTableRateType | undefined = this.getValue(
			ctx,
			MeterTableMonitorCCValues.rateType,
		);

		const readings = resolveReadings(this.readings, meterType, capability);
		if (readings.length < this.readings.length) {
			ctx.logNode(this.nodeId as number, {
				endpoint: this.endpointIndex,
				message:
					"ignoring readings without import or export from a meter that measures both",
				level: "warn",
			});
		}
		for (const reading of readings) {
			const { rateType, scale } = reading;
			const valueValue = MeterTableMonitorCCValues.value(
				meterType,
				rateType,
				reading.dataset,
			);
			this.setMetadata(ctx, valueValue, {
				...valueValue.meta,
				label: getMeterTableValueLabel(
					meterType,
					rateType,
					scale.label,
				),
				unit: scale.unit,
				ccSpecific: {
					meterType,
					rateType,
					dataset: reading.dataset,
					scale: reading.scale.key,
				},
			});
			this.setValue(ctx, valueValue, reading.value);
		}

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		if (this.readings.some((r) => r.rateType !== this.rateType)) {
			throw new ZWaveError(
				`All readings of a ${this.constructor.name} must have the rate type of the report`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (
			this.readings.some(
				(r) =>
					!Number.isInteger(r.dataset)
					|| r.dataset < 0
					|| r.dataset > 23,
			)
		) {
			throw new ZWaveError(
				`The datasets of a ${this.constructor.name} are numbered 0 to 23`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		if (
			new Set(this.readings.map((r) => r.dataset)).size
			!== this.readings.length
		) {
			throw new ZWaveError(
				`A ${this.constructor.name} can only contain one reading per dataset`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}
		const readings = this.readings.toSorted(
			(a, b) => a.dataset - b.dataset,
		);
		const datasets = readings.reduce(
			(mask, r) => mask | (1 << r.dataset),
			0,
		);

		const header = new Bytes(12);
		header[0] = this.reportsToFollow;
		header[1] =
			(this.operatingStatusIndication ? 0b1000_0000 : 0)
			| (this.rateType & 0b11);
		header.set(encodeDataset(datasets), 2);
		const t = this.timestamp ?? new Date(0);
		header.writeUInt16BE(t.getUTCFullYear(), 5);
		header[7] = t.getUTCMonth() + 1;
		header[8] = t.getUTCDate();
		header[9] = t.getUTCHours();
		header[10] = t.getUTCMinutes();
		header[11] = t.getUTCSeconds();

		const values = readings.map((r) => {
			const ret = new Bytes(5);
			if (!(r.value >= 0 && Math.round(r.value) <= 0xffff_ffff)) {
				throw new ZWaveError(
					"Meter table values must be between 0 and 4294967295",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			// Drop decimals that don't fit in 32 bits
			let precision = getPrecision(r.value);
			while (
				precision > 0
				&& Math.round(Math.abs(r.value) * 10 ** precision) > 0xffff_ffff
			) {
				precision--;
			}
			const raw = Math.round(r.value * 10 ** precision);
			ret[0] = (precision << 5) | (r.scale.key & 0b0001_1111);
			ret.writeUInt32BE(raw, 1);
			return ret;
		});
		this.payload = Bytes.concat([header, ...values]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		const message: Record<string, string | number | boolean> = {
			"meter time": this.timestamp
				? this.timestamp.toISOString().slice(0, 19).replace("T", " ")
				: "not set",
		};
		if (this.reportsToFollow) {
			message["reports to follow"] = this.reportsToFollow;
		}
		if (this.operatingStatusIndication) {
			message["operating status event"] = true;
		}
		for (const r of this.readings) {
			const rate =
				r.rateType === MeterTableRateType.Unspecified
					? ""
					: `${getEnumMemberName(MeterTableRateType, r.rateType)} `;
			message[`${rate}dataset ${r.dataset}`] =
				`${r.value} (scale ${r.scale.key})`;
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export interface MeterTableMonitorCCCurrentDataGetOptions {
	/** Bit mask of the requested datasets */
	datasets: number;
}

// A pushed report may arrive while waiting for the answer to a Get.
// Only a report with one of the requested datasets is the answer.
function testResponseForMeterTableCurrentDataGet(
	sent: MeterTableMonitorCCCurrentDataGet,
	received: MeterTableMonitorCCCurrentDataReport,
): boolean {
	return (sent.datasets & received.datasets) !== 0;
}

@CCCommand(MeterTableMonitorCommand.CurrentDataGet)
@expectedCCResponse(
	MeterTableMonitorCCCurrentDataReport,
	testResponseForMeterTableCurrentDataGet,
)
export class MeterTableMonitorCCCurrentDataGet extends MeterTableMonitorCC {
	public constructor(
		options: WithAddress<MeterTableMonitorCCCurrentDataGetOptions>,
	) {
		super(options);
		this.datasets = options.datasets;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTableMonitorCCCurrentDataGet {
		validatePayload(raw.payload.length >= 3);
		return new this({
			nodeId: ctx.sourceNodeId,
			datasets: Bytes.view(raw.payload).readUIntBE(0, 3),
		});
	}

	public datasets: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeDataset(this.datasets);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				datasets:
					meterTableDatasets(this.datasets).join(", ") || "none",
			},
		};
	}
}
