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
	ZWaveError,
	ZWaveErrorCodes,
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
import { CCAPI, type PhysicalCCAPIEndpoint } from "../lib/API.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
	type PersistValuesContext,
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
	useSupervision,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import {
	ActiveScheduleCommand,
	type ActiveScheduleDailyRepeatingSchedule,
	ActiveScheduleReportReason,
	ActiveScheduleSetAction,
	type ActiveScheduleSlotId,
	type ActiveScheduleTarget,
	type ActiveScheduleTargetCapabilities,
	type ActiveScheduleYearDaySchedule,
	type ScheduleDate,
	type ScheduleTimespan,
	ScheduleWeekday,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

/**
 * Parses a date from the given buffer at the given location.
 * The date format is: year (2 bytes, BE), month, day, hour, minute (1 byte each).
 * @returns The date components and the number of bytes read (always 6).
 */
function parseDate(
	payload: Bytes,
	offset: number = 0,
): { date: ScheduleDate; bytesRead: number } {
	validatePayload(payload.length >= offset + 6);
	return {
		date: {
			year: payload.readUInt16BE(offset),
			month: payload[offset + 2],
			day: payload[offset + 3],
			hour: payload[offset + 4],
			minute: payload[offset + 5],
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

/** Throws if the given date is outside the ranges defined by the CC */
function assertValidScheduleDate(date: ScheduleDate, which: string): void {
	// CC:00A4.01.06.11.008: If any of the values above are not in the
	// respective provided ranges, the command MUST be ignored.
	if (
		date.year < 0
		|| date.year > 0xffff
		|| date.month < 1
		|| date.month > 12
		|| date.day < 1
		|| date.day > 31
		|| date.hour < 0
		|| date.hour > 23
		|| date.minute < 0
		|| date.minute > 59
	) {
		throw new ZWaveError(
			`The ${which} date is invalid`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

/** Throws if the given timespan is outside the ranges defined by the CC */
function assertValidScheduleTimespan(timespan: ScheduleTimespan): void {
	// CC:00A4.01.09.11.009: If any of the numeric values above are not in the
	// respective provided ranges, the command MUST be ignored by the receiving
	// node.
	if (
		timespan.startHour < 0
		|| timespan.startHour > 23
		|| timespan.startMinute < 0
		|| timespan.startMinute > 59
		|| timespan.durationHour < 0
		|| timespan.durationHour > 23
		|| timespan.durationMinute < 0
		|| timespan.durationMinute > 59
	) {
		throw new ZWaveError(
			"The timespan is invalid",
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

/** Throws if the given metadata is longer than allowed by the CC */
function assertValidScheduleMetadata(metadata: BytesView | undefined): void {
	// CC:00A4.01.00.11.018: Schedule Metadata MUST be less than or equal to
	// seven (7) bytes in length.
	if (metadata && metadata.length > 7) {
		throw new ZWaveError(
			"The schedule metadata must be at most 7 bytes long",
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

// Target CC, target ID (16 bit) and slot ID (16 bit) are packed without
// overlap. Multiply/divide instead of shifting because the result exceeds
// the signed 32-bit range of bitwise operators
function packScheduleSlotKey(
	targetCC: CommandClasses,
	targetId: number,
	slotId: number,
): number {
	return targetCC * 0x1_0000_0000 + targetId * 0x1_0000 + slotId;
}

function unpackScheduleSlotKey(
	key: number,
): { targetCC: CommandClasses; targetId: number; slotId: number } {
	return {
		targetCC: Math.floor(key / 0x1_0000_0000),
		targetId: Math.floor(key / 0x1_0000) % 0x1_0000,
		slotId: key % 0x1_0000,
	};
}

/** Checks if the target encoded in a schedule value's property key is affected by a batch erase for the given target */
function scheduleValueKeyMatchesEraseScope(
	propertyKey: unknown,
	target: ActiveScheduleTarget,
): boolean {
	if (typeof propertyKey !== "number") return false;
	const { targetCC, targetId } = unpackScheduleSlotKey(propertyKey);
	// CC:00A4.01.06.11.007: A Schedule Slot ID value of zero during an Erase
	// Set Action signifies a batch erase operation. Assuming that the target
	// is otherwise valid, the operation MUST execute based on the target
	// values outlined in the Schedule Erase Definitions table:

	// "Erase all schedules of this type on the node."
	if (target.targetCC === 0) return true;
	if (targetCC !== target.targetCC) return false;
	// "Erase all schedules of this type attached to all Targets from the
	// specified Target CC." ...or attached to the specific Target
	return target.targetId === 0 || targetId === target.targetId;
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
			// Multiply instead of shifting because extended target CCs (16 bit)
			// would overflow the signed 32-bit range of bitwise operators
			(targetCC: CommandClasses, targetId: number) =>
				targetCC * 0x1_0000 + targetId,
			({ property, propertyKey }) =>
				property === "enabled" && typeof propertyKey === "number",
			undefined,
			{ internal: true },
		),
		...V.dynamicPropertyAndKeyWithName(
			"yearDaySchedule",
			"yearDaySchedule",
			(targetCC: CommandClasses, targetId: number, slotId: number) =>
				packScheduleSlotKey(targetCC, targetId, slotId),
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
				packScheduleSlotKey(targetCC, targetId, slotId),
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

		// Get-type commands are only possible in singlecast
		this.assertPhysicalEndpoint(this.endpoint);

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

		// Get-type commands are only possible in singlecast
		this.assertPhysicalEndpoint(this.endpoint);

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
		schedule: ActiveScheduleYearDaySchedule | undefined,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.YearDayScheduleSet,
		);

		if (schedule) {
			// CC:00A4.01.06.13.006: This value MAY be equal to zero *ONLY*
			// when coupled with an **Erase** Set Action.
			if (slot.slotId < 1) {
				throw new ZWaveError(
					"The slot ID must be at least 1 when modifying a schedule",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			assertValidScheduleDate(schedule.startDate, "start");
			assertValidScheduleDate(schedule.stopDate, "stop");
			assertValidScheduleMetadata(schedule.metadata);

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
			// CC:00A4.01.06.11.002: The stop parameters of the time fence MUST
			// occur after the start parameters.
			if (stopDate <= startDate) {
				throw new ZWaveError(
					"The stop date must be after the start date",
					ZWaveErrorCodes.Argument_Invalid,
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

		if (isUnsupervisedOrSucceeded(result)) {
			this.cacheScheduleResult(
				ActiveScheduleCCValues.yearDaySchedule,
				slot,
				schedule,
			);
		}

		return result;
	}

	/** Updates the schedule cache after a successful Set command */
	private cacheScheduleResult(
		scheduleValue:
			| typeof ActiveScheduleCCValues.yearDaySchedule
			| typeof ActiveScheduleCCValues.dailyRepeatingSchedule,
		slot: ActiveScheduleSlotId,
		schedule:
			| ActiveScheduleYearDaySchedule
			| ActiveScheduleDailyRepeatingSchedule
			| undefined,
	): void {
		if (!this.isSinglecast()) return;

		const valueDB = this.host.getValueDB(this.endpoint.nodeId);
		if (schedule) {
			// Cache the schedule
			valueDB.setValue(
				scheduleValue(slot.targetCC, slot.targetId, slot.slotId)
					.endpoint(this.endpoint.index),
				schedule,
			);
			// CC:00A4.01.06.11.001 / CC:00A4.01.09.11.001: When set
			// successfully, scheduling as reported in the Active Schedule
			// Enable Report Command MUST be automatically enabled for the
			// identified Target.
			valueDB.setValue(
				ActiveScheduleCCValues.enabled(
					slot.targetCC,
					slot.targetId,
				).endpoint(this.endpoint.index),
				true,
			);
		} else if (slot.slotId === 0) {
			// CC:00A4.01.06.11.007: A Schedule Slot ID value of zero
			// during an Erase Set Action signifies a batch erase
			// operation. Assuming that the target is otherwise valid, the
			// operation MUST execute based on the target values outlined
			// in the Schedule Erase Definitions table:
			// Mark all cached schedules in the erased scope as empty
			const affected = valueDB.findValues((vid) =>
				vid.endpoint === this.endpoint.index
				&& scheduleValue.is(vid)
				&& scheduleValueKeyMatchesEraseScope(vid.propertyKey, slot)
			);
			for (const vid of affected) {
				valueDB.setValue(vid, false);
			}
		} else {
			// Mark the cached schedule as empty
			valueDB.setValue(
				scheduleValue(slot.targetCC, slot.targetId, slot.slotId)
					.endpoint(this.endpoint.index),
				false,
			);
		}
	}

	/**
	 * Requests the year day schedule stored in the given slot.
	 * A slot ID of 0 requests the first occupied slot for the given target.
	 *
	 * @returns The schedule together with the slot it is actually stored in
	 * and the ID of the next occupied slot (0 if there is none),
	 * `false` if the requested slot is empty,
	 * or `undefined` if the node did not respond.
	 */
	@validateArgs()
	public async getYearDaySchedule(
		slot: ActiveScheduleSlotId,
	): Promise<
		| (ActiveScheduleYearDaySchedule & {
			slotId: number;
			nextSlotId: number;
		})
		| false
		| undefined
	> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.YearDayScheduleGet,
		);

		// CC:00A4.01.07.11.002: This command MUST NOT be issued via multicast
		// addressing.
		this.assertPhysicalEndpoint(this.endpoint);

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
					// The report echoes the slot the schedule is actually
					// stored in, so a slot 0 query returns the first occupied slot
					slotId: result.slotId,
					nextSlotId: result.nextSlotId,
				};
			}
			return false;
		}
	}

	@validateArgs({ strictEnums: true })
	public async setDailyRepeatingSchedule(
		slot: ActiveScheduleSlotId,
		schedule: ActiveScheduleDailyRepeatingSchedule | undefined,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.DailyRepeatingScheduleSet,
		);

		if (schedule) {
			// CC:00A4.01.09.11.005: This field is to be subject to the same
			// requirements regarding valid values and batch delete operations
			// as the corresponding field in the Active Schedule Year Day
			// Schedule Set Command. The field also MUST also use the same
			// logic described in the Schedule Erase Definitions table for
			// deleting multiple schedules.
			if (slot.slotId < 1) {
				throw new ZWaveError(
					"The slot ID must be at least 1 when modifying a schedule",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			// An empty weekday bitmask signifies an empty slot in reports, so
			// a schedule must apply to at least one weekday
			if (schedule.weekdays.length === 0) {
				throw new ZWaveError(
					"The schedule must apply to at least one weekday",
					ZWaveErrorCodes.Argument_Invalid,
				);
			}

			assertValidScheduleTimespan(schedule.timespan);
			assertValidScheduleMetadata(schedule.metadata);
		}

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

		if (isUnsupervisedOrSucceeded(result)) {
			// CC:00A4.01.09.11.005: The field also MUST also use the same
			// logic described in the Schedule Erase Definitions table for
			// deleting multiple schedules.
			this.cacheScheduleResult(
				ActiveScheduleCCValues.dailyRepeatingSchedule,
				slot,
				schedule,
			);
		}

		return result;
	}

	/**
	 * Requests the daily repeating schedule stored in the given slot.
	 * A slot ID of 0 requests the first occupied slot for the given target.
	 *
	 * @returns The schedule together with the slot it is actually stored in
	 * and the ID of the next occupied slot (0 if there is none),
	 * `false` if the requested slot is empty,
	 * or `undefined` if the node did not respond.
	 */
	@validateArgs()
	public async getDailyRepeatingSchedule(
		slot: ActiveScheduleSlotId,
	): Promise<
		| (ActiveScheduleDailyRepeatingSchedule & {
			slotId: number;
			nextSlotId: number;
		})
		| false
		| undefined
	> {
		this.assertSupportsCommand(
			ActiveScheduleCommand,
			ActiveScheduleCommand.DailyRepeatingScheduleGet,
		);

		// CC:00A4.01.0A.11.002: This command MUST NOT be issued via multicast
		// addressing.
		this.assertPhysicalEndpoint(this.endpoint);

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
					// The report echoes the slot the schedule is actually
					// stored in, so a slot 0 query returns the first occupied slot
					slotId: result.slotId,
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
			tag: "interview",
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

		// CL:00A4.01.11.01.1: A node controlling this Command Class MUST
		// perform a supporting node interview according to the figure
		// "Active Schedule Command Class Interview"
		const caps = await api.getCapabilities();
		if (caps) {
			let logMessage = "received supported target CCs:";
			for (const [targetCC, cap] of caps.targetCapabilities) {
				logMessage += `
${
					getEnumMemberName(CommandClasses, targetCC)
				}: ${cap.numSupportedTargets} targets, ${cap.numYearDaySlotsPerTarget} year day slots, ${cap.numDailyRepeatingSlotsPerTarget} daily repeating slots`;
			}
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: logMessage,
				direction: "inbound",
			});

			// Schedules of Target CCs with more than one Target are
			// interviewed during their respective Target CC interview
			for (const [targetCC, cap] of caps.targetCapabilities) {
				if (cap.numSupportedTargets !== 1) continue;
				await ActiveScheduleCC.interviewTarget(ctx, endpoint, {
					targetCC,
					targetId: 1,
				}, { tag: "interview" });
			}
		}

		// Remember that the interview is complete
		this.setInterviewComplete(ctx, true);
	}

	/**
	 * Queries all schedule data and the enabled state for a given Target.
	 * The Active Schedule CC capabilities must be known before calling this.
	 */
	public static async interviewTarget(
		ctx: InterviewContext,
		endpoint: PhysicalCCAPIEndpoint,
		target: ActiveScheduleTarget,
		options?: RefreshValuesOptions,
	): Promise<void> {
		const api = CCAPI.create(
			CommandClasses["Active Schedule"],
			ctx,
			endpoint,
		).withOptions({
			priority: options?.priority ?? MessagePriority.NodeQuery,
			tag: options?.tag,
		});

		const caps = ActiveScheduleCC.getTargetCapabilitiesCached(
			ctx,
			endpoint,
			target.targetCC,
		);
		if (!caps) return;

		ctx.logNode(endpoint.nodeId, {
			endpoint: endpoint.index,
			message: `Querying schedules for target CC ${
				getEnumMemberName(CommandClasses, target.targetCC)
			}, target ID ${target.targetId}...`,
			direction: "outbound",
		});

		// CL:00A4.01.11.02.1: Any time schedule data for a Target (distinct
		// combination of Target CC and Target ID) is queried by a controlling
		// node, it MUST follow the process defined in the figure
		// "Active Schedule Target Interview":
		// Query the first occupied slot (ID 0), then follow the chain of next
		// occupied slots until it ends.
		const walkSlotChain = async (
			numSlots: number,
			getSchedule: (
				slot: ActiveScheduleSlotId,
			) => Promise<{ nextSlotId: number } | false | undefined>,
		): Promise<void> => {
			if (numSlots === 0) return;
			// Protect against nodes reporting a cyclic slot chain
			const queriedSlots = new Set<number>();
			let slotId = 0;
			while (queriedSlots.size <= numSlots) {
				const result = await getSchedule({ ...target, slotId });
				// An empty slot or a missing response ends the chain
				if (!result) break;
				slotId = result.nextSlotId;
				if (slotId === 0 || queriedSlots.has(slotId)) break;
				queriedSlots.add(slotId);
			}
		};

		await walkSlotChain(
			caps.numYearDaySlotsPerTarget,
			(slot) => api.getYearDaySchedule(slot),
		);
		await walkSlotChain(
			caps.numDailyRepeatingSlotsPerTarget,
			(slot) => api.getDailyRepeatingSchedule(slot),
		);

		// CL:00A4.01.61.01.1: A controlling node MUST display a UI showing the
		// following:
		// - Which Targets on the node have (a) schedule(s) attached
		// - If that Target's schedules(s) is/are enabled
		// Query the enabled state, so applications have access to it
		await api.getEnabled(target);
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

// @publicAPI
export interface ActiveScheduleCCCapabilitiesReportOptions {
	targetCapabilities: ReadonlyMap<
		CommandClasses,
		ActiveScheduleTargetCapabilities
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
		// CC:00A4.01.02.11.001: A node advertising support for this CC MUST
		// support at least one (1) valid Target CC.
		// CC:00A4.01.02.11.008: If any of the numeric values above are not in
		// the respective provided ranges, the command MUST be ignored by the
		// receiving node.
		validatePayload(numTargetCCs >= 1);

		const targetCapabilities = new Map<
			CommandClasses,
			ActiveScheduleTargetCapabilities
		>();
		let offset = 1;

		const targetCCs: CommandClasses[] = [];
		for (let i = 0; i < numTargetCCs; i++) {
			const { ccId, bytesRead } = parseCCId(raw.payload, offset);
			targetCCs.push(ccId);
			offset += bytesRead;
		}

		// The CC list is followed by 3 arrays of 16-bit values (6 bytes per target CC)
		validatePayload(raw.payload.length >= offset + numTargetCCs * 6);

		for (let i = 0; i < numTargetCCs; i++) {
			targetCapabilities.set(targetCCs[i], {
				numSupportedTargets: raw.payload.readUInt16BE(
					offset + i * 2,
				),
				numYearDaySlotsPerTarget: raw.payload.readUInt16BE(
					offset + (numTargetCCs + i) * 2,
				),
				numDailyRepeatingSlotsPerTarget: raw.payload.readUInt16BE(
					offset + (2 * numTargetCCs + i) * 2,
				),
			});
		}

		return new this({
			nodeId: ctx.sourceNodeId,
			targetCapabilities,
		});
	}

	public targetCapabilities: ReadonlyMap<
		CommandClasses,
		ActiveScheduleTargetCapabilities
	>;

	public get supportedTargetCCs(): CommandClasses[] {
		return [...this.targetCapabilities.keys()];
	}

	public persistValues(ctx: PersistValuesContext): boolean {
		if (!super.persistValues(ctx)) return false;

		for (const [targetCC, cap] of this.targetCapabilities) {
			const capValue = ActiveScheduleCCValues.targetCapabilities(
				targetCC,
			);
			this.setValue(ctx, capValue, cap);
		}

		return true;
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		const numTargetCCs = this.targetCapabilities.size;
		// 1 byte for count + up to 2 bytes per target CC (extended CCs)
		// + 6 bytes per target for the three 16-bit values
		this.payload = new Bytes(1 + numTargetCCs * 2 + numTargetCCs * 6);

		this.payload[0] = numTargetCCs;

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

		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.03.11.001: All other bits are reserved and MUST be set
		// low (0) by the sending node. If any of the reserved bits are high
		// (1), they MUST be ignored by the receiving node.
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
		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.03.11.001 (referenced for this command's fields): All
		// other bits are reserved and MUST be set low (0) by the sending node.
		// If any of the reserved bits are high (1), they MUST be ignored by
		// the receiving node.
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
		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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

// CC:00A4.01.04.11.001: The Active Schedule Enable Report Command MUST be
// returned as a response to this command.
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
		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.06.11.003: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
		const action: ActiveScheduleSetAction = raw.payload[0] & 0b11;
		// CC:00A4.01.06.11.004: All other values are reserved and MUST NOT be
		// used by a sending node. Reserved values MUST be ignored by a
		// receiving node.
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

		// CC:00A4.01.06.13.005: During an Erase Operation, all other fields
		// with the exception of the Target and Schedule Slot fields are not
		// required and MAY be set to zero or omitted.
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
		// CC:00A4.01.06.11.009: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
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

		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.08.11.001: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
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

			// CC:00A4.01.08.11.004: If a requested schedule slot is
			// erased/empty the time fields MUST be set to 0x00.
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

		// Slot ID 0 in a report means the target has no occupied slots,
		// so there is nothing to persist
		if (this.slotId === 0) return true;

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

		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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

// CC:00A4.01.07.11.001: The Active Schedule Year Day Schedule Report Command
// MUST be returned in response to this command.
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
		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.09.11.003: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
		const action: ActiveScheduleSetAction = raw.payload[0] & 0b11;
		// CC:00A4.01.09.11.004: All other values are reserved and MUST NOT be
		// used by a sending node. Reserved values MUST be ignored by a
		// receiving node.
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

		// CC:00A4.01.09.13.002: During an Erase Operation, all other fields
		// with the exception of the Target and Schedule Slot fields are not
		// required and MAY be set to zero or omitted.
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
		// CC:00A4.01.09.11.008: Reserved bits MUST be ignored by a receiving
		// node.
		const weekdays: ScheduleWeekday[] = parseBitMask(
			[raw.payload[offset++] & 0b0111_1111],
			ScheduleWeekday.Sunday,
		);
		const { timespan, bytesRead: timespanBytes } = parseTimespan(
			raw.payload,
			offset,
		);
		offset += timespanBytes;
		validatePayload(raw.payload.length >= offset + 1);
		// CC:00A4.01.06.11.009: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
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
			// CC:00A4.01.09.11.007: The 'Res' bit is reserved and MUST be set
			// to zero by a sending node.
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

		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
		// CC:00A4.01.0B.11.001: These bits MUST be set to 0 by a sending node
		// and MUST be ignored by a receiving node.
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
			// CC:00A4.01.09.11.008: Reserved bits MUST be ignored by a
			// receiving node.
			const weekdayBitmask = raw.payload[offset++] & 0b0111_1111;
			// CC:00A4.01.0B.11.003: If a requested schedule slot is
			// erased/empty the time fields MUST be set to 0x00.
			if (weekdayBitmask !== 0) {
				const weekdays: ScheduleWeekday[] = parseBitMask(
					[weekdayBitmask],
					ScheduleWeekday.Sunday,
				);
				const { timespan, bytesRead: timespanBytes } = parseTimespan(
					raw.payload,
					offset,
				);
				offset += timespanBytes;
				validatePayload(raw.payload.length >= offset + 1);
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

		// Slot ID 0 in a report means the target has no occupied slots,
		// so there is nothing to persist
		if (this.slotId === 0) return true;

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
		const hasSchedule = !!this.weekdays?.length;
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

		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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

// CC:00A4.01.0A.11.001: The Active Schedule Daily Repeating Report Command
// MUST be returned in response to this command.
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
		// Trim to the actual length, since the CC id encodes as 1 or 2 bytes
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
