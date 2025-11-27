import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import {
	CommandClasses,
	type EndpointId,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	MessagePriority,
	type MessageRecord,
	type SupervisionResult,
	type WithAddress,
	encodeBitMask,
	encodeCCId,
	isUnsupervisedOrSucceeded,
	parseBitMask,
	parseCCId,
	validatePayload,
} from "@zwave-js/core";
import {
	type AllOrNone,
	Bytes,
	type BytesView,
	formatDate,
	formatTime,
	getEnumMemberName,
	pick,
} from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
	type PersistValuesContext,
} from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	ccValueProperty,
	ccValues,
	commandClass,
	expectedCCResponse,
	implementedVersion,
	useSupervision,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import {
	ActiveScheduleCommand,
	type ActiveScheduleDailyRepeatingSchedule,
	type ScheduleDate,
	ActiveScheduleReportReason,
	ActiveScheduleSetAction,
	type ActiveScheduleSlotId,
	type ActiveScheduleTarget,
	type ActiveScheduleTargetCapabilities,
	type ScheduleTimespan,
	ScheduleWeekday,
	type ActiveScheduleYearDaySchedule,
} from "../lib/_Types.js";

/**
 * Parses a date from the given buffer at the given location.
 * The date format is: year (2 bytes, BE), month, day, hour, minute (1 byte each).
 * @returns The date components and the number of bytes read (always 6).
 */
function parseDate(
	payload: BytesView,
	offset: number = 0,
): { date: ScheduleDate; bytesRead: number } {
	validatePayload(payload.length >= offset + 6);
	const view = Bytes.view(payload);
	return {
		date: {
			year: view.readUInt16BE(offset),
			month: view.readUInt8(offset + 2),
			day: view.readUInt8(offset + 3),
			hour: view.readUInt8(offset + 4),
			minute: view.readUInt8(offset + 5),
		},
		bytesRead: 6,
	};
}

/**
 * Writes a date into the given buffer at the given location.
 * The date format is: year (2 bytes, BE), month, day, hour, minute (1 byte each).
 * @returns The number of bytes written (always 6).
 */
function encodeDate(
	date: ScheduleDate,
	payload: Bytes,
	offset: number = 0,
): number {
	payload.writeUInt16BE(date.year, offset);
	payload.writeUInt8(date.month, offset + 2);
	payload.writeUInt8(date.day, offset + 3);
	payload.writeUInt8(date.hour, offset + 4);
	payload.writeUInt8(date.minute, offset + 5);
	return 6;
}

/**
 * Parses a timespan from the given buffer at the given location.
 * The timespan format is: startHour, startMinute, durationHour, durationMinute (1 byte each).
 * @returns The timespan components and the number of bytes read (always 4).
 */
function parseTimespan(
	payload: BytesView,
	offset: number = 0,
): { timespan: ScheduleTimespan; bytesRead: number } {
	validatePayload(payload.length >= offset + 4);
	return {
		timespan: {
			startHour: payload[offset],
			startMinute: payload[offset + 1],
			durationHour: payload[offset + 2],
			durationMinute: payload[offset + 3],
		},
		bytesRead: 4,
	};
}

/**
 * Writes a timespan into the given buffer at the given location.
 * The timespan format is: startHour, startMinute, durationHour, durationMinute (1 byte each).
 * @returns The number of bytes written (always 4).
 */
function encodeTimespan(
	timespan: ScheduleTimespan,
	payload: Bytes,
	offset: number = 0,
): number {
	payload.writeUInt8(timespan.startHour, offset);
	payload.writeUInt8(timespan.startMinute, offset + 1);
	payload.writeUInt8(timespan.durationHour, offset + 2);
	payload.writeUInt8(timespan.durationMinute, offset + 3);
	return 4;
}

export const ActiveScheduleCCValues = V.defineCCValues(
	CommandClasses["Active Schedule"],
	{
		...V.staticProperty("supportedTargetCCs", undefined, {
			internal: true,
		}),
		...V.dynamicPropertyAndKeyWithName(
			"targetCapabilities",
			"targetCapabilities",
			(targetCC: CommandClasses) => targetCC,
			({ property, propertyKey }) =>
				property === "targetCapabilities"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"enabled",
			"enabled",
			(targetCC: CommandClasses, targetId: number) =>
				(targetCC << 16) | targetId,
			({ property, propertyKey }) =>
				property === "enabled" && typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"yearDaySchedule",
			"yearDaySchedule",
			(targetCC: CommandClasses, targetId: number, slotId: number) =>
				(targetCC << 24) | (targetId << 8) | slotId,
			({ property, propertyKey }) =>
				property === "yearDaySchedule"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"dailyRepeatingSchedule",
			"dailyRepeatingSchedule",
			(targetCC: CommandClasses, targetId: number, slotId: number) =>
				(targetCC << 24) | (targetId << 8) | slotId,
			({ property, propertyKey }) =>
				property === "dailyRepeatingSchedule"
				&& typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
	},
);

@API(CommandClasses["Active Schedule"])
export class ActiveScheduleCCAPI extends CCAPI {
	public supportsCommand(
		cmd: ActiveScheduleCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case ActiveScheduleCommand.CapabilitiesGet:
			case ActiveScheduleCommand.EnableSet:
			case ActiveScheduleCommand.EnableGet:
			case ActiveScheduleCommand.YearDayScheduleSet:
			case ActiveScheduleCommand.YearDayScheduleGet:
			case ActiveScheduleCommand.DailyRepeatingScheduleSet:
			case ActiveScheduleCommand.DailyRepeatingScheduleGet:
				return true; // V1
		}
		return super.supportsCommand(cmd);
	}

	public async getCapabilities(): Promise<
		MaybeNotKnown<
			Pick<ActiveScheduleCCCapabilitiesReport, "targetCapabilities">
		>
	> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.CapabilitiesGet,
		);

		const cc = new ActiveScheduleCCCapabilitiesGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});

		const result = await this.host.sendCommand<
			ActiveScheduleCCCapabilitiesReport
		>(
			cc,
			this.commandOptions,
		);

		if (result) {
			return pick(result, ["targetCapabilities"]);
		}
	}

	@validateArgs()
	public async setEnabled(
		target: ActiveScheduleTarget,
		enabled: boolean,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.EnableSet,
		);

		const cc = new ActiveScheduleCCEnableSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...target,
			enabled,
		});

		const result = await this.host.sendCommand(cc, this.commandOptions);

		if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
			// Cache the enabled state
			const enabledValue = ActiveScheduleCCValues.enabled(
				target.targetCC,
				target.targetId,
			);
			this.host
				.getValueDB(this.endpoint.nodeId)
				.setValue(
					enabledValue.endpoint(this.endpoint.index),
					enabled,
				);
		}

		return result;
	}

	@validateArgs()
	public async getEnabled(
		target: ActiveScheduleTarget,
	): Promise<MaybeNotKnown<boolean>> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.EnableGet,
		);

		const cc = new ActiveScheduleCCEnableGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...target,
		});

		const result = await this.host.sendCommand<
			ActiveScheduleCCEnableReport
		>(
			cc,
			this.commandOptions,
		);

		return result?.enabled;
	}

	@validateArgs()
	public async setYearDaySchedule(
		slot: ActiveScheduleSlotId,
		schedule?: ActiveScheduleYearDaySchedule,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.YearDayScheduleSet,
		);

		if (schedule) {
			const start = schedule.startDate;
			const stop = schedule.stopDate;
			const startDate = new Date(
				start.year,
				start.month - 1,
				start.day,
				start.hour,
				start.minute,
			);
			const stopDate = new Date(
				stop.year,
				stop.month - 1,
				stop.day,
				stop.hour,
				stop.minute,
			);
			if (stopDate <= startDate) {
				throw new Error(
					"The stop date must be after the start date.",
				);
			}
		}

		const cc = new ActiveScheduleCCYearDayScheduleSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...slot,
			...(schedule
				? {
					action: ActiveScheduleSetAction.Modify,
					...schedule,
				}
				: {
					action: ActiveScheduleSetAction.Erase,
				}),
		});

		const result = await this.host.sendCommand(cc, this.commandOptions);

		if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
			// Cache the schedule
			const scheduleValue = ActiveScheduleCCValues.yearDaySchedule(
				slot.targetCC,
				slot.targetId,
				slot.slotId,
			);
			if (schedule) {
				this.host
					.getValueDB(this.endpoint.nodeId)
					.setValue(
						scheduleValue.endpoint(this.endpoint.index),
						schedule,
					);
			} else {
				this.host
					.getValueDB(this.endpoint.nodeId)
					.setValue(
						scheduleValue.endpoint(this.endpoint.index),
						false,
					);
			}
		}

		return result;
	}

	@validateArgs()
	public async getYearDaySchedule(
		slot: ActiveScheduleSlotId,
	): Promise<
		| (ActiveScheduleYearDaySchedule & { nextSlotId: number })
		| false
		| undefined
	> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.YearDayScheduleGet,
		);

		const cc = new ActiveScheduleCCYearDayScheduleGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...slot,
		});

		const result = await this.host.sendCommand<
			ActiveScheduleCCYearDayScheduleReport
		>(
			cc,
			this.commandOptions,
		);

		if (result) {
			if (result.startDate != undefined) {
				return {
					startDate: result.startDate,
					stopDate: result.stopDate!,
					metadata: result.metadata,
					nextSlotId: result.nextSlotId,
				};
			}
			return false;
		}
	}

	@validateArgs()
	public async setDailyRepeatingSchedule(
		slot: ActiveScheduleSlotId,
		schedule?: ActiveScheduleDailyRepeatingSchedule,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.DailyRepeatingScheduleSet,
		);

		const cc = new ActiveScheduleCCDailyRepeatingScheduleSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...slot,
			...(schedule
				? {
					action: ActiveScheduleSetAction.Modify,
					...schedule,
				}
				: {
					action: ActiveScheduleSetAction.Erase,
				}),
		});

		const result = await this.host.sendCommand(cc, this.commandOptions);

		if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
			// Cache the schedule
			const scheduleValue = ActiveScheduleCCValues.dailyRepeatingSchedule(
				slot.targetCC,
				slot.targetId,
				slot.slotId,
			);
			if (schedule) {
				this.host
					.getValueDB(this.endpoint.nodeId)
					.setValue(
						scheduleValue.endpoint(this.endpoint.index),
						schedule,
					);
			} else {
				this.host
					.getValueDB(this.endpoint.nodeId)
					.setValue(
						scheduleValue.endpoint(this.endpoint.index),
						false,
					);
			}
		}

		return result;
	}

	@validateArgs()
	public async getDailyRepeatingSchedule(
		slot: ActiveScheduleSlotId,
	): Promise<
		| (ActiveScheduleDailyRepeatingSchedule & { nextSlotId: number })
		| false
		| undefined
	> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.DailyRepeatingScheduleGet,
		);

		const cc = new ActiveScheduleCCDailyRepeatingScheduleGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...slot,
		});

		const result = await this.host.sendCommand<
			ActiveScheduleCCDailyRepeatingScheduleReport
		>(
			cc,
			this.commandOptions,
		);

		if (result) {
			if (result.weekdays != undefined && result.weekdays.length > 0) {
				return {
					weekdays: result.weekdays,
					timespan: result.timespan!,
					metadata: result.metadata,
					nextSlotId: result.nextSlotId,
				};
			}
			return false;
		}
	}
}

@commandClass(CommandClasses["Active Schedule"])
@implementedVersion(1)
@ccValues(ActiveScheduleCCValues)
export class ActiveScheduleCC extends CommandClass {
	declare ccCommand: ActiveScheduleCommand;

	public async interview(
		ctx: InterviewContext,
	): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["Active Schedule"],
			ctx,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `Interviewing ${this.ccName}...`,
			direction: "none",
		});

		ctx.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "Querying supported target CCs and schedule slots...",
			direction: "outbound",
		});

		const caps = await api.getCapabilities();
		if (caps) {
			const logLines: string[] = [
				"received supported target CCs:",
			];
			for (const [targetCC, cap] of caps.targetCapabilities) {
				logLines.push(
					`  ${
						getEnumMemberName(CommandClasses, targetCC)
					}: ${cap.numSupportedTargets} targets, ${cap.numYearDaySlotsPerTarget} year day slots, ${cap.numDailyRepeatingSlotsPerTarget} daily repeating slots`,
				);
			}
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: logLines.join("\n"),
				direction: "inbound",
			});
		}

		// Remember that the interview is complete
		this.setInterviewComplete(ctx, true);
	}

	/**
	 * Returns the supported target CCs.
	 * This only works AFTER the interview process
	 */
	public static getSupportedTargetCCsCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
	): MaybeNotKnown<readonly CommandClasses[]> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				ActiveScheduleCCValues.supportedTargetCCs.endpoint(
					endpoint.index,
				),
			);
	}

	/**
	 * Returns the capabilities for a target CC.
	 * This only works AFTER the interview process
	 */
	public static getTargetCapabilitiesCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
		targetCC: CommandClasses,
	): MaybeNotKnown<ActiveScheduleTargetCapabilities> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				ActiveScheduleCCValues.targetCapabilities(targetCC).endpoint(
					endpoint.index,
				),
			);
	}

	/**
	 * Returns whether schedules are enabled for a target.
	 * This only works AFTER the interview process
	 */
	public static getEnabledCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
		targetCC: CommandClasses,
		targetId: number,
	): MaybeNotKnown<boolean> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				ActiveScheduleCCValues.enabled(targetCC, targetId).endpoint(
					endpoint.index,
				),
			);
	}

	/**
	 * Returns a cached year day schedule.
	 * This only works AFTER the interview process.
	 * A return value of `false` means the slot is empty.
	 */
	public static getYearDayScheduleCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
		targetCC: CommandClasses,
		targetId: number,
		slotId: number,
	): MaybeNotKnown<ActiveScheduleYearDaySchedule | false> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				ActiveScheduleCCValues.yearDaySchedule(
					targetCC,
					targetId,
					slotId,
				).endpoint(endpoint.index),
			);
	}

	/**
	 * Returns a cached daily repeating schedule.
	 * This only works AFTER the interview process.
	 * A return value of `false` means the slot is empty.
	 */
	public static getDailyRepeatingScheduleCached(
		ctx: GetValueDB,
		endpoint: EndpointId,
		targetCC: CommandClasses,
		targetId: number,
		slotId: number,
	): MaybeNotKnown<ActiveScheduleDailyRepeatingSchedule | false> {
		return ctx
			.getValueDB(endpoint.nodeId)
			.getValue(
				ActiveScheduleCCValues.dailyRepeatingSchedule(
					targetCC,
					targetId,
					slotId,
				).endpoint(endpoint.index),
			);
	}
}

// =============================================================================

// @publicAPI
export interface ActiveScheduleCCCapabilitiesReportOptions {
	targetCapabilities: ReadonlyMap<
		CommandClasses,
		Omit<ActiveScheduleTargetCapabilities, "targetCC">
	>;
}

@CCCommand(ActiveScheduleCommand.CapabilitiesReport)
@ccValueProperty(
	"supportedTargetCCs",
	ActiveScheduleCCValues.supportedTargetCCs,
)
export class ActiveScheduleCCCapabilitiesReport extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCCapabilitiesReportOptions>,
	) {
		super(options);
		this.targetCapabilities = options.targetCapabilities;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCCapabilitiesReport {
		validatePayload(raw.payload.length >= 1);
		const numTargetCCs = raw.payload[0];

		const targetCapabilities = new Map<
			CommandClasses,
			Omit<ActiveScheduleTargetCapabilities, "targetCC">
		>();
		let offset = 1;

		// Parse target CCs (can be extended CCs, 1 or 2 bytes each)
		const targetCCs: CommandClasses[] = [];
		for (let i = 0; i < numTargetCCs; i++) {
			const { ccId, bytesRead } = parseCCId(raw.payload, offset);
			targetCCs.push(ccId);
			offset += bytesRead;
		}

		// After the CCs, we expect 3 arrays of 16-bit values (6 bytes per target CC)
		validatePayload(raw.payload.length >= offset + numTargetCCs * 6);

		// Parse numSupportedTargets for all target CCs
		const numSupportedTargetsArray: number[] = [];
		for (let i = 0; i < numTargetCCs; i++) {
			numSupportedTargetsArray.push(raw.payload.readUInt16BE(offset));
			offset += 2;
		}

		// Parse numYearDaySlotsPerTarget for all target CCs
		const numYearDaySlotsPerTargetArray: number[] = [];
		for (let i = 0; i < numTargetCCs; i++) {
			numYearDaySlotsPerTargetArray.push(
				raw.payload.readUInt16BE(offset),
			);
			offset += 2;
		}

		// Parse numDailyRepeatingSlotsPerTarget for all target CCs
		const numDailyRepeatingSlotsPerTargetArray: number[] = [];
		for (let i = 0; i < numTargetCCs; i++) {
			numDailyRepeatingSlotsPerTargetArray.push(
				raw.payload.readUInt16BE(offset),
			);
			offset += 2;
		}

		// Combine into target capabilities
		for (let i = 0; i < numTargetCCs; i++) {
			targetCapabilities.set(targetCCs[i], {
				numSupportedTargets: numSupportedTargetsArray[i],
				numYearDaySlotsPerTarget: numYearDaySlotsPerTargetArray[i],
				numDailyRepeatingSlotsPerTarget:
					numDailyRepeatingSlotsPerTargetArray[i],
			});
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCapabilities,
		});
	}

	public targetCapabilities: ReadonlyMap<
		CommandClasses,
		Omit<ActiveScheduleTargetCapabilities, "targetCC">
	>;

	public get supportedTargetCCs(): CommandClasses[] {
		return [...this.targetCapabilities.keys()];
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		// Persist capabilities for each target CC
		for (const [targetCC, cap] of this.targetCapabilities) {
			const capValue = ActiveScheduleCCValues.targetCapabilities(
				targetCC,
			);
			this.setValue(ctx, capValue, { targetCC, ...cap });
		}

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const numTargetCCs = this.targetCapabilities.size;
		// 1 byte for count + up to 2 bytes per target CC (extended CCs)
		// + 6 bytes per target for the three 16-bit values
		this.payload = new Bytes(1 + numTargetCCs * 2 + numTargetCCs * 6);

		this.payload[0] = numTargetCCs;

		// Write target CCs (can be extended CCs, 1 or 2 bytes each)
		let offset = 1;
		for (const targetCC of this.targetCapabilities.keys()) {
			offset += encodeCCId(targetCC, this.payload, offset);
		}

		// Write numSupportedTargets for all target CCs
		for (const cap of this.targetCapabilities.values()) {
			this.payload.writeUInt16BE(cap.numSupportedTargets, offset);
			offset += 2;
		}

		// Write numYearDaySlotsPerTarget for all target CCs
		for (const cap of this.targetCapabilities.values()) {
			this.payload.writeUInt16BE(cap.numYearDaySlotsPerTarget, offset);
			offset += 2;
		}

		// Write numDailyRepeatingSlotsPerTarget for all target CCs
		for (const cap of this.targetCapabilities.values()) {
			this.payload.writeUInt16BE(
				cap.numDailyRepeatingSlotsPerTarget,
				offset,
			);
			offset += 2;
		}

		// Trim payload to actual size
		this.payload = this.payload.subarray(0, offset);

		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		const message: MessageRecord = {};
		for (const [targetCC, cap] of this.targetCapabilities) {
			message[getEnumMemberName(CommandClasses, targetCC)] =
				`${cap.numSupportedTargets} targets, ${cap.numYearDaySlotsPerTarget} year day slots, ${cap.numDailyRepeatingSlotsPerTarget} daily repeating slots`;
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

@CCCommand(ActiveScheduleCommand.CapabilitiesGet)
@expectedCCResponse(ActiveScheduleCCCapabilitiesReport)
export class ActiveScheduleCCCapabilitiesGet extends ActiveScheduleCC {}

// =============================================================================

// @publicAPI
export interface ActiveScheduleCCEnableSetOptions extends ActiveScheduleTarget {
	enabled: boolean;
}

@CCCommand(ActiveScheduleCommand.EnableSet)
@useSupervision()
export class ActiveScheduleCCEnableSet extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCEnableSetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.enabled = options.enabled;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCEnableSet {
		const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
		validatePayload(raw.payload.length >= bytesRead + 3);
		const targetId = raw.payload.readUInt16BE(bytesRead);
		const enabled = !!(raw.payload[bytesRead + 2] & 0b1);

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCC,
			targetId,
			enabled,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public enabled: boolean;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(5); // Max size for extended CC
		let offset = encodeCCId(this.targetCC, this.payload, 0);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload[offset++] = this.enabled ? 0x01 : 0x00;
		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				action: this.enabled ? "enable" : "disable",
			},
		};
	}
}

// @publicAPI
export interface ActiveScheduleCCEnableReportOptions
	extends ActiveScheduleTarget
{
	reportReason: ActiveScheduleReportReason;
	enabled: boolean;
}

@CCCommand(ActiveScheduleCommand.EnableReport)
export class ActiveScheduleCCEnableReport extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCEnableReportOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.reportReason = options.reportReason;
		this.enabled = options.enabled;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCEnableReport {
		const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
		validatePayload(raw.payload.length >= bytesRead + 3);
		const targetId = raw.payload.readUInt16BE(bytesRead);
		const reportReason = (raw.payload[bytesRead + 2] >> 1) & 0b111;
		const enabled = !!(raw.payload[bytesRead + 2] & 0b1);

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCC,
			targetId,
			reportReason,
			enabled,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public reportReason: ActiveScheduleReportReason;
	public enabled: boolean;

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		const enabledValue = ActiveScheduleCCValues.enabled(
			this.targetCC,
			this.targetId,
		);
		this.setValue(ctx, enabledValue, this.enabled);

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(5); // Max size for extended CC
		let offset = encodeCCId(this.targetCC, this.payload, 0);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload[offset++] = ((this.reportReason & 0b111) << 1)
			| (this.enabled ? 0b1 : 0);
		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"report reason": getEnumMemberName(
					ActiveScheduleReportReason,
					this.reportReason,
				),
				enabled: this.enabled,
			},
		};
	}
}

// @publicAPI
export type ActiveScheduleCCEnableGetOptions = ActiveScheduleTarget;

@CCCommand(ActiveScheduleCommand.EnableGet)
@expectedCCResponse(ActiveScheduleCCEnableReport)
export class ActiveScheduleCCEnableGet extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCEnableGetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCEnableGet {
		const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
		validatePayload(raw.payload.length >= bytesRead + 2);
		const targetId = raw.payload.readUInt16BE(bytesRead);

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCC,
			targetId,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(4); // Max size for extended CC
		let offset = encodeCCId(this.targetCC, this.payload, 0);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
			},
		};
	}
}

// =============================================================================

/** @publicAPI */
export type ActiveScheduleCCYearDayScheduleSetOptions =
	& ActiveScheduleSlotId
	& (
		| {
			action: ActiveScheduleSetAction.Erase;
		}
		| ({
			action: ActiveScheduleSetAction.Modify;
		} & ActiveScheduleYearDaySchedule)
	);

@CCCommand(ActiveScheduleCommand.YearDayScheduleSet)
@useSupervision()
export class ActiveScheduleCCYearDayScheduleSet extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCYearDayScheduleSetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
		this.action = options.action;
		if (options.action === ActiveScheduleSetAction.Modify) {
			this.startDate = options.startDate;
			this.stopDate = options.stopDate;
			this.metadata = options.metadata;
		}
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCYearDayScheduleSet {
		validatePayload(raw.payload.length >= 1);
		const action: ActiveScheduleSetAction = raw.payload[0] & 0b11;
		validatePayload(
			action === ActiveScheduleSetAction.Modify
				|| action === ActiveScheduleSetAction.Erase,
		);

		const { ccId: targetCC, bytesRead: ccBytes } = parseCCId(
			raw.payload,
			1,
		);
		let offset = 1 + ccBytes;
		validatePayload(raw.payload.length >= offset + 4);
		const targetId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const slotId = raw.payload.readUInt16BE(offset);
		offset += 2;

		// During an Erase Operation, all other fields with the exception of the
		// Target and Schedule Slot fields are not required and MAY be set to
		// zero or omitted.
		if (action !== ActiveScheduleSetAction.Modify) {
			return new this({
				nodeId: ctx.sourceNodeId,
				action,
				targetCC,
				targetId,
				slotId,
			});
		}

		const { date: startDate, bytesRead: startDateBytes } = parseDate(
			raw.payload,
			offset,
		);
		offset += startDateBytes;
		const { date: stopDate, bytesRead: stopDateBytes } = parseDate(
			raw.payload,
			offset,
		);
		offset += stopDateBytes;
		validatePayload(raw.payload.length >= offset + 1);
		const metadataLength = raw.payload[offset++] & 0b111;

		let metadata: BytesView | undefined;
		if (metadataLength > 0) {
			validatePayload(raw.payload.length >= offset + metadataLength);
			metadata = raw.payload.subarray(offset, offset + metadataLength);
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			action,
			targetCC,
			targetId,
			slotId,
			startDate,
			stopDate,
			metadata,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;
	public action: ActiveScheduleSetAction;

	public startDate?: ScheduleDate;
	public stopDate?: ScheduleDate;
	public metadata?: BytesView;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const metadataLength = this.metadata?.length ?? 0;
		// Max size: 1 (action) + 2 (extended CC) + 2 (targetId) + 2 (slotId) + 13 (schedule data) + 7 (metadata) = 27
		this.payload = new Bytes(
			this.action === ActiveScheduleSetAction.Modify
				? 20 + metadataLength
				: 7,
		);

		this.payload[0] = this.action & 0b11;
		let offset = 1;
		offset += encodeCCId(this.targetCC, this.payload, offset);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;

		if (this.action === ActiveScheduleSetAction.Modify) {
			offset += encodeDate(this.startDate!, this.payload, offset);
			offset += encodeDate(this.stopDate!, this.payload, offset);
			this.payload[offset++] = metadataLength & 0b111;
			if (this.metadata) {
				this.payload.set(this.metadata, offset);
			}
			offset += metadataLength;
		}

		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		let message: MessageRecord;
		if (this.action === ActiveScheduleSetAction.Erase) {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				action: "erase",
			};
		} else {
			const start = this.startDate!;
			const stop = this.stopDate!;
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				action: "modify",
				"start date": `${
					formatDate(start.year, start.month, start.day)
				} ${formatTime(start.hour, start.minute)}`,
				"stop date": `${formatDate(stop.year, stop.month, stop.day)} ${
					formatTime(stop.hour, stop.minute)
				}`,
			};
			if (this.metadata && this.metadata.length > 0) {
				message["metadata"] = `${this.metadata.length} bytes`;
			}
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export type ActiveScheduleCCYearDayScheduleReportOptions =
	& ActiveScheduleSlotId
	& {
		reportReason: ActiveScheduleReportReason;
		nextSlotId: number;
	}
	& AllOrNone<ActiveScheduleYearDaySchedule>;

@CCCommand(ActiveScheduleCommand.YearDayScheduleReport)
export class ActiveScheduleCCYearDayScheduleReport extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCYearDayScheduleReportOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
		this.reportReason = options.reportReason;
		this.nextSlotId = options.nextSlotId;
		this.startDate = options.startDate;
		this.stopDate = options.stopDate;
		this.metadata = options.metadata;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCYearDayScheduleReport {
		validatePayload(raw.payload.length >= 1);
		const reportReason =
			(raw.payload[0] & 0b111) as ActiveScheduleReportReason;
		const { ccId: targetCC, bytesRead: ccBytes } = parseCCId(
			raw.payload,
			1,
		);
		let offset = 1 + ccBytes;
		validatePayload(raw.payload.length >= offset + 6);
		const targetId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const slotId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const nextSlotId = raw.payload.readUInt16BE(offset);
		offset += 2;

		let ccOptions: ActiveScheduleCCYearDayScheduleReportOptions = {
			targetCC,
			targetId,
			slotId,
			reportReason,
			nextSlotId,
		};

		if (raw.payload.length >= offset + 12) {
			const { date: startDate, bytesRead: startDateBytes } = parseDate(
				raw.payload,
				offset,
			);
			offset += startDateBytes;
			const { date: stopDate, bytesRead: stopDateBytes } = parseDate(
				raw.payload,
				offset,
			);
			offset += stopDateBytes;

			// Check if not empty (all zeros means empty)
			if (
				startDate.year !== 0
				|| startDate.month !== 0
				|| startDate.day !== 0
				|| startDate.hour !== 0
				|| startDate.minute !== 0
			) {
				let metadata: BytesView | undefined;
				if (raw.payload.length >= offset + 1) {
					const metadataLength = raw.payload[offset++] & 0b111;
					if (metadataLength > 0) {
						validatePayload(
							raw.payload.length >= offset + metadataLength,
						);
						metadata = raw.payload.subarray(
							offset,
							offset + metadataLength,
						);
					}
				}

				ccOptions = {
					...ccOptions,
					startDate,
					stopDate,
					metadata,
				};
			}
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			...ccOptions,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;
	public reportReason: ActiveScheduleReportReason;
	public nextSlotId: number;
	public startDate?: ScheduleDate;
	public stopDate?: ScheduleDate;
	public metadata?: BytesView;

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		const scheduleValue = ActiveScheduleCCValues.yearDaySchedule(
			this.targetCC,
			this.targetId,
			this.slotId,
		);

		if (this.startDate != undefined) {
			this.setValue(
				ctx,
				scheduleValue,
				{
					startDate: this.startDate,
					stopDate: this.stopDate!,
					metadata: this.metadata,
				} satisfies ActiveScheduleYearDaySchedule,
			);
		} else {
			this.setValue(ctx, scheduleValue, false);
		}

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const metadataLength = this.metadata?.length ?? 0;
		const hasSchedule = this.startDate != undefined;
		// Max size: 1 (reportReason) + 2 (extended CC) + 2 (targetId) + 2 (slotId) + 2 (nextSlotId) + 13 (schedule) + 7 (metadata)
		this.payload = new Bytes(hasSchedule ? 22 + metadataLength : 9);

		this.payload[0] = this.reportReason & 0b111;
		let offset = 1;
		offset += encodeCCId(this.targetCC, this.payload, offset);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.nextSlotId, offset);
		offset += 2;

		if (hasSchedule) {
			offset += encodeDate(this.startDate!, this.payload, offset);
			offset += encodeDate(this.stopDate!, this.payload, offset);
			this.payload[offset++] = metadataLength & 0b111;
			if (this.metadata) {
				this.payload.set(this.metadata, offset);
			}
			offset += metadataLength;
		}

		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		let message: MessageRecord;
		if (this.startDate == undefined) {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				"next slot #": this.nextSlotId,
				schedule: "(empty)",
			};
		} else {
			const start = this.startDate;
			const stop = this.stopDate!;
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				"next slot #": this.nextSlotId,
				"start date": `${
					formatDate(start.year, start.month, start.day)
				} ${formatTime(start.hour, start.minute)}`,
				"stop date": `${formatDate(stop.year, stop.month, stop.day)} ${
					formatTime(stop.hour, stop.minute)
				}`,
			};
			if (this.metadata && this.metadata.length > 0) {
				message["metadata"] = `${this.metadata.length} bytes`;
			}
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export type ActiveScheduleCCYearDayScheduleGetOptions = ActiveScheduleSlotId;

@CCCommand(ActiveScheduleCommand.YearDayScheduleGet)
@expectedCCResponse(ActiveScheduleCCYearDayScheduleReport)
export class ActiveScheduleCCYearDayScheduleGet extends ActiveScheduleCC {
	public constructor(
		options: WithAddress<ActiveScheduleCCYearDayScheduleGetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCYearDayScheduleGet {
		const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
		validatePayload(raw.payload.length >= bytesRead + 4);
		const targetId = raw.payload.readUInt16BE(bytesRead);
		const slotId = raw.payload.readUInt16BE(bytesRead + 2);

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCC,
			targetId,
			slotId,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(6); // Max size for extended CC
		let offset = encodeCCId(this.targetCC, this.payload, 0);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;
		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
			},
		};
	}
}

// =============================================================================

/** @publicAPI */
export type ActiveScheduleCCDailyRepeatingScheduleSetOptions =
	& ActiveScheduleSlotId
	& (
		| {
			action: ActiveScheduleSetAction.Erase;
		}
		| ({
			action: ActiveScheduleSetAction.Modify;
		} & ActiveScheduleDailyRepeatingSchedule)
	);

@CCCommand(ActiveScheduleCommand.DailyRepeatingScheduleSet)
@useSupervision()
export class ActiveScheduleCCDailyRepeatingScheduleSet
	extends ActiveScheduleCC
{
	public constructor(
		options: WithAddress<ActiveScheduleCCDailyRepeatingScheduleSetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
		this.action = options.action;
		if (options.action === ActiveScheduleSetAction.Modify) {
			this.weekdays = options.weekdays;
			this.timespan = options.timespan;
			this.metadata = options.metadata;
		}
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCDailyRepeatingScheduleSet {
		validatePayload(raw.payload.length >= 1);
		const action: ActiveScheduleSetAction = raw.payload[0] & 0b11;
		validatePayload(
			action === ActiveScheduleSetAction.Modify
				|| action === ActiveScheduleSetAction.Erase,
		);

		const { ccId: targetCC, bytesRead: ccBytes } = parseCCId(
			raw.payload,
			1,
		);
		let offset = 1 + ccBytes;
		validatePayload(raw.payload.length >= offset + 4);
		const targetId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const slotId = raw.payload.readUInt16BE(offset);
		offset += 2;

		if (action !== ActiveScheduleSetAction.Modify) {
			return new this({
				nodeId: ctx.sourceNodeId,
				action,
				targetCC,
				targetId,
				slotId,
			});
		}

		validatePayload(raw.payload.length >= offset + 1);
		const weekdays: ScheduleWeekday[] = parseBitMask(
			[raw.payload[offset++]],
			ScheduleWeekday.Sunday,
		);
		const { timespan, bytesRead: timespanBytes } = parseTimespan(
			raw.payload,
			offset,
		);
		offset += timespanBytes;
		const metadataLength = raw.payload[offset++] & 0b111;

		let metadata: BytesView | undefined;
		if (metadataLength > 0) {
			validatePayload(raw.payload.length >= offset + metadataLength);
			metadata = raw.payload.subarray(offset, offset + metadataLength);
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			action,
			targetCC,
			targetId,
			slotId,
			weekdays,
			timespan,
			metadata,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;
	public action: ActiveScheduleSetAction;

	public weekdays?: ScheduleWeekday[];
	public timespan?: ScheduleTimespan;
	public metadata?: BytesView;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const metadataLength = this.metadata?.length ?? 0;
		// Max size: 1 (action) + 2 (extended CC) + 2 (targetId) + 2 (slotId) + 6 (schedule data) + 7 (metadata) = 20
		this.payload = new Bytes(
			this.action === ActiveScheduleSetAction.Modify
				? 13 + metadataLength
				: 7,
		);

		this.payload[0] = this.action & 0b11;
		let offset = 1;
		offset += encodeCCId(this.targetCC, this.payload, offset);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;

		if (this.action === ActiveScheduleSetAction.Modify) {
			const weekdayBitmask = encodeBitMask(
				this.weekdays!,
				ScheduleWeekday.Saturday,
				ScheduleWeekday.Sunday,
			);
			this.payload[offset++] = weekdayBitmask[0];
			offset += encodeTimespan(this.timespan!, this.payload, offset);
			this.payload[offset++] = metadataLength & 0b111;
			if (this.metadata) {
				this.payload.set(this.metadata, offset);
			}
			offset += metadataLength;
		}

		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		let message: MessageRecord;
		if (this.action === ActiveScheduleSetAction.Erase) {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				action: "erase",
			};
		} else {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				action: "modify",
				weekdays: this.weekdays!.map((w) =>
					getEnumMemberName(ScheduleWeekday, w)
				).join(", "),
				"start time": formatTime(
					this.timespan?.startHour ?? 0,
					this.timespan?.startMinute ?? 0,
				),
				duration: formatTime(
					this.timespan?.durationHour ?? 0,
					this.timespan?.durationMinute ?? 0,
				),
			};
			if (this.metadata && this.metadata.length > 0) {
				message["metadata"] = `${this.metadata.length} bytes`;
			}
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export type ActiveScheduleCCDailyRepeatingScheduleReportOptions =
	& ActiveScheduleSlotId
	& {
		reportReason: ActiveScheduleReportReason;
		nextSlotId: number;
	}
	& AllOrNone<ActiveScheduleDailyRepeatingSchedule>;

@CCCommand(ActiveScheduleCommand.DailyRepeatingScheduleReport)
export class ActiveScheduleCCDailyRepeatingScheduleReport
	extends ActiveScheduleCC
{
	public constructor(
		options: WithAddress<
			ActiveScheduleCCDailyRepeatingScheduleReportOptions
		>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
		this.reportReason = options.reportReason;
		this.nextSlotId = options.nextSlotId;
		this.weekdays = options.weekdays;
		this.timespan = options.timespan;
		this.metadata = options.metadata;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCDailyRepeatingScheduleReport {
		validatePayload(raw.payload.length >= 1);
		const reportReason =
			(raw.payload[0] & 0b111) as ActiveScheduleReportReason;
		const { ccId: targetCC, bytesRead: ccBytes } = parseCCId(
			raw.payload,
			1,
		);
		let offset = 1 + ccBytes;
		validatePayload(raw.payload.length >= offset + 6);
		const targetId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const slotId = raw.payload.readUInt16BE(offset);
		offset += 2;
		const nextSlotId = raw.payload.readUInt16BE(offset);
		offset += 2;

		let ccOptions: ActiveScheduleCCDailyRepeatingScheduleReportOptions = {
			targetCC,
			targetId,
			slotId,
			reportReason,
			nextSlotId,
		};

		if (raw.payload.length >= offset + 1) {
			const weekdayBitmask = raw.payload[offset];
			// Check if not empty (0 bitmask means empty)
			if (weekdayBitmask !== 0) {
				const weekdays: ScheduleWeekday[] = parseBitMask(
					[raw.payload[offset++]],
					ScheduleWeekday.Sunday,
				);
				const { timespan, bytesRead: timespanBytes } = parseTimespan(
					raw.payload,
					offset,
				);
				offset += timespanBytes;
				const metadataLength = raw.payload[offset++] & 0b111;

				let metadata: BytesView | undefined;
				if (metadataLength > 0) {
					validatePayload(
						raw.payload.length >= offset + metadataLength,
					);
					metadata = raw.payload.subarray(
						offset,
						offset + metadataLength,
					);
				}

				ccOptions = {
					...ccOptions,
					weekdays,
					timespan,
					metadata,
				};
			}
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			...ccOptions,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;
	public reportReason: ActiveScheduleReportReason;
	public nextSlotId: number;
	public weekdays?: ScheduleWeekday[];
	public timespan?: ScheduleTimespan;
	public metadata?: BytesView;

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		const scheduleValue = ActiveScheduleCCValues.dailyRepeatingSchedule(
			this.targetCC,
			this.targetId,
			this.slotId,
		);

		if (this.weekdays?.length) {
			this.setValue(
				ctx,
				scheduleValue,
				{
					weekdays: this.weekdays,
					timespan: this.timespan!,
					metadata: this.metadata,
				} satisfies ActiveScheduleDailyRepeatingSchedule,
			);
		} else {
			this.setValue(ctx, scheduleValue, false);
		}

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const metadataLength = this.metadata?.length ?? 0;
		const hasSchedule = this.weekdays?.length;
		// Max size: 1 (reportReason) + 2 (extended CC) + 2 (targetId) + 2 (slotId) + 2 (nextSlotId) + 6 (schedule) + 7 (metadata)
		this.payload = new Bytes(hasSchedule ? 15 + metadataLength : 9);

		this.payload[0] = this.reportReason & 0b111;
		let offset = 1;
		offset += encodeCCId(this.targetCC, this.payload, offset);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.nextSlotId, offset);
		offset += 2;

		if (hasSchedule) {
			const weekdayBitmask = encodeBitMask(
				this.weekdays!,
				ScheduleWeekday.Saturday,
				ScheduleWeekday.Sunday,
			);
			this.payload[offset++] = weekdayBitmask[0];
			offset += encodeTimespan(this.timespan!, this.payload, offset);
			this.payload[offset++] = metadataLength & 0b111;
			if (this.metadata) {
				this.payload.set(this.metadata, offset);
			}
			offset += metadataLength;
		}

		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		let message: MessageRecord;
		if (!this.weekdays?.length) {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				"next slot #": this.nextSlotId,
				schedule: "(empty)",
			};
		} else {
			message = {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
				"next slot #": this.nextSlotId,
				weekdays: this.weekdays
					.map((w) => getEnumMemberName(ScheduleWeekday, w))
					.join(", "),
				"start time": formatTime(
					this.timespan!.startHour,
					this.timespan!.startMinute,
				),
				duration: formatTime(
					this.timespan!.durationHour,
					this.timespan!.durationMinute,
				),
			};
			if (this.metadata && this.metadata.length > 0) {
				message["metadata"] = `${this.metadata.length} bytes`;
			}
		}
		return {
			...super.toLogEntry(ctx),
			message,
		};
	}
}

// @publicAPI
export type ActiveScheduleCCDailyRepeatingScheduleGetOptions =
	ActiveScheduleSlotId;

@CCCommand(ActiveScheduleCommand.DailyRepeatingScheduleGet)
@expectedCCResponse(ActiveScheduleCCDailyRepeatingScheduleReport)
export class ActiveScheduleCCDailyRepeatingScheduleGet
	extends ActiveScheduleCC
{
	public constructor(
		options: WithAddress<ActiveScheduleCCDailyRepeatingScheduleGetOptions>,
	) {
		super(options);
		this.targetCC = options.targetCC;
		this.targetId = options.targetId;
		this.slotId = options.slotId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ActiveScheduleCCDailyRepeatingScheduleGet {
		const { ccId: targetCC, bytesRead } = parseCCId(raw.payload, 0);
		validatePayload(raw.payload.length >= bytesRead + 4);
		const targetId = raw.payload.readUInt16BE(bytesRead);
		const slotId = raw.payload.readUInt16BE(bytesRead + 2);

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCC,
			targetId,
			slotId,
		});
	}

	public targetCC: CommandClasses;
	public targetId: number;
	public slotId: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(6); // Max size for extended CC
		let offset = encodeCCId(this.targetCC, this.payload, 0);
		this.payload.writeUInt16BE(this.targetId, offset);
		offset += 2;
		this.payload.writeUInt16BE(this.slotId, offset);
		offset += 2;
		this.payload = this.payload.subarray(0, offset);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				"target CC": getEnumMemberName(CommandClasses, this.targetCC),
				"target ID": this.targetId,
				"slot #": this.slotId,
			},
		};
	}
}
