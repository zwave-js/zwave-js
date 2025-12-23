var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { CommandClasses, MessagePriority, ZWaveError, ZWaveErrorCodes, encodeBitMask, getDSTInfo, isUnsupervisedOrSucceeded, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, formatDate, formatTime, getEnumMemberName, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ScheduleEntryLockCommand, ScheduleEntryLockScheduleKind, ScheduleEntryLockSetAction, ScheduleEntryLockWeekday, } from "../lib/_Types.js";
import { encodeTimezone, parseTimezone } from "../lib/serializers.js";
import { UserCodeCC } from "./UserCodeCC.js";
export const ScheduleEntryLockCCValues = V.defineCCValues(CommandClasses["Schedule Entry Lock"], {
    ...V.staticProperty("numWeekDaySlots", undefined, { internal: true }),
    ...V.staticProperty("numYearDaySlots", undefined, { internal: true }),
    ...V.staticProperty("numDailyRepeatingSlots", undefined, {
        internal: true,
    }),
    ...V.dynamicPropertyAndKeyWithName("userEnabled", "userEnabled", (userId) => userId, ({ property, propertyKey }) => property === "userEnabled" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("scheduleKind", "scheduleKind", (userId) => userId, ({ property, propertyKey }) => property === "scheduleKind" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("schedule", "schedule", (scheduleKind, userId, slotId) => (scheduleKind << 16) | (userId << 8) | slotId, ({ property, propertyKey }) => property === "schedule" && typeof propertyKey === "number", undefined, { internal: true }),
});
/** Caches information about a schedule */
function persistSchedule(ctx, scheduleKind, userId, slotId, schedule) {
    const scheduleValue = ScheduleEntryLockCCValues.schedule(scheduleKind, userId, slotId);
    if (schedule != undefined) {
        this.setValue(ctx, scheduleValue, schedule);
    }
    else {
        this.removeValue(ctx, scheduleValue);
    }
}
/** Updates the schedule kind assumed to be active for user in the cache */
function setUserCodeScheduleKindCached(ctx, endpoint, userId, scheduleKind) {
    ctx
        .getValueDB(endpoint.nodeId)
        .setValue(ScheduleEntryLockCCValues.scheduleKind(userId).endpoint(endpoint.index), scheduleKind);
}
/** Updates whether scheduling is active for one or all user(s) in the cache */
function setUserCodeScheduleEnabledCached(ctx, endpoint, userId, enabled) {
    const setEnabled = (userId) => {
        ctx
            .getValueDB(endpoint.nodeId)
            .setValue(ScheduleEntryLockCCValues.userEnabled(userId).endpoint(endpoint.index), enabled);
    };
    if (userId == undefined) {
        // Enable/disable all users
        const numUsers = UserCodeCC.getSupportedUsersCached(ctx, endpoint)
            ?? 0;
        for (let userId = 1; userId <= numUsers; userId++) {
            setEnabled(userId);
        }
    }
    else {
        setEnabled(userId);
    }
}
let ScheduleEntryLockCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Schedule Entry Lock"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _setEnabled_decorators;
    let _setWeekDaySchedule_decorators;
    let _getWeekDaySchedule_decorators;
    let _setYearDaySchedule_decorators;
    let _getYearDaySchedule_decorators;
    let _setDailyRepeatingSchedule_decorators;
    let _getDailyRepeatingSchedule_decorators;
    let _setTimezone_decorators;
    var ScheduleEntryLockCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _setEnabled_decorators = [validateArgs()];
            _setWeekDaySchedule_decorators = [validateArgs()];
            _getWeekDaySchedule_decorators = [validateArgs()];
            _setYearDaySchedule_decorators = [validateArgs()];
            _getYearDaySchedule_decorators = [validateArgs()];
            _setDailyRepeatingSchedule_decorators = [validateArgs()];
            _getDailyRepeatingSchedule_decorators = [validateArgs()];
            _setTimezone_decorators = [validateArgs()];
            __esDecorate(this, null, _setEnabled_decorators, { kind: "method", name: "setEnabled", static: false, private: false, access: { has: obj => "setEnabled" in obj, get: obj => obj.setEnabled }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setWeekDaySchedule_decorators, { kind: "method", name: "setWeekDaySchedule", static: false, private: false, access: { has: obj => "setWeekDaySchedule" in obj, get: obj => obj.setWeekDaySchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getWeekDaySchedule_decorators, { kind: "method", name: "getWeekDaySchedule", static: false, private: false, access: { has: obj => "getWeekDaySchedule" in obj, get: obj => obj.getWeekDaySchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setYearDaySchedule_decorators, { kind: "method", name: "setYearDaySchedule", static: false, private: false, access: { has: obj => "setYearDaySchedule" in obj, get: obj => obj.setYearDaySchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getYearDaySchedule_decorators, { kind: "method", name: "getYearDaySchedule", static: false, private: false, access: { has: obj => "getYearDaySchedule" in obj, get: obj => obj.getYearDaySchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setDailyRepeatingSchedule_decorators, { kind: "method", name: "setDailyRepeatingSchedule", static: false, private: false, access: { has: obj => "setDailyRepeatingSchedule" in obj, get: obj => obj.setDailyRepeatingSchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDailyRepeatingSchedule_decorators, { kind: "method", name: "getDailyRepeatingSchedule", static: false, private: false, access: { has: obj => "getDailyRepeatingSchedule" in obj, get: obj => obj.getDailyRepeatingSchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setTimezone_decorators, { kind: "method", name: "setTimezone", static: false, private: false, access: { has: obj => "setTimezone" in obj, get: obj => obj.setTimezone }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ScheduleEntryLockCommand.EnableSet:
                case ScheduleEntryLockCommand.EnableAllSet:
                case ScheduleEntryLockCommand.WeekDayScheduleSet:
                case ScheduleEntryLockCommand.WeekDayScheduleGet:
                case ScheduleEntryLockCommand.YearDayScheduleSet:
                case ScheduleEntryLockCommand.YearDayScheduleGet:
                case ScheduleEntryLockCommand.SupportedGet:
                    return true; // V1
                case ScheduleEntryLockCommand.TimeOffsetSet:
                case ScheduleEntryLockCommand.TimeOffsetGet:
                    return this.version >= 2;
                case ScheduleEntryLockCommand.DailyRepeatingScheduleSet:
                case ScheduleEntryLockCommand.DailyRepeatingScheduleGet:
                    return this.version >= 3;
            }
            return super.supportsCommand(cmd);
        }
        /**
         * Enables or disables schedules. If a user ID is given, that user's
         * schedules will be enabled or disabled. If no user ID is given, all schedules
         * will be affected.
         */
        async setEnabled(enabled, userId) {
            let result;
            if (userId != undefined) {
                this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.EnableSet);
                const cc = new ScheduleEntryLockCCEnableSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    userId,
                    enabled,
                });
                result = await this.host.sendCommand(cc, this.commandOptions);
            }
            else {
                this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.EnableAllSet);
                const cc = new ScheduleEntryLockCCEnableAllSet({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    enabled,
                });
                result = await this.host.sendCommand(cc, this.commandOptions);
            }
            if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
                // Remember the new state in the cache
                setUserCodeScheduleEnabledCached(this.host, this.endpoint, userId, enabled);
            }
            return result;
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getNumSlots() {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.SupportedGet);
            const cc = new ScheduleEntryLockCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (result) {
                return pick(result, [
                    "numWeekDaySlots",
                    "numYearDaySlots",
                    "numDailyRepeatingSlots",
                ]);
            }
        }
        async setWeekDaySchedule(slot, schedule) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.WeekDayScheduleSet);
            if (this.isSinglecast()) {
                const numSlots = ScheduleEntryLockCC.getNumWeekDaySlotsCached(this.host, this.endpoint);
                if (slot.slotId < 1 || slot.slotId > numSlots) {
                    throw new ZWaveError(`The schedule slot # must be between 1 and the number of supported day-of-week slots ${numSlots}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            if (schedule) {
                if (schedule.stopHour < schedule.startHour
                    || schedule.stopHour === schedule.startHour
                        && schedule.stopMinute <= schedule.startMinute) {
                    throw new ZWaveError(`The stop time must be after the start time.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            const cc = new ScheduleEntryLockCCWeekDayScheduleSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
                ...(schedule
                    ? {
                        action: ScheduleEntryLockSetAction.Set,
                        ...schedule,
                    }
                    : {
                        action: ScheduleEntryLockSetAction.Erase,
                    }),
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
                // Editing (but not erasing) a schedule will enable scheduling for that user
                // and switch it to the current scheduling kind
                if (!!schedule) {
                    setUserCodeScheduleEnabledCached(this.host, this.endpoint, slot.userId, true);
                    setUserCodeScheduleKindCached(this.host, this.endpoint, slot.userId, ScheduleEntryLockScheduleKind.WeekDay);
                }
                // And cache the schedule
                persistSchedule.call(cc, this.host, ScheduleEntryLockScheduleKind.WeekDay, slot.userId, slot.slotId, schedule ?? false);
            }
            return result;
        }
        async getWeekDaySchedule(slot) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.WeekDayScheduleSet);
            const cc = new ScheduleEntryLockCCWeekDayScheduleGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (result?.weekday != undefined) {
                return {
                    weekday: result.weekday,
                    startHour: result.startHour,
                    startMinute: result.startMinute,
                    stopHour: result.stopHour,
                    stopMinute: result.stopMinute,
                };
            }
        }
        async setYearDaySchedule(slot, schedule) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.YearDayScheduleSet);
            if (this.isSinglecast()) {
                const numSlots = ScheduleEntryLockCC.getNumYearDaySlotsCached(this.host, this.endpoint);
                if (slot.slotId < 1 || slot.slotId > numSlots) {
                    throw new ZWaveError(`The schedule slot # must be between 1 and the number of supported day-of-year slots ${numSlots}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            if (schedule) {
                const startDate = new Date(schedule.startYear, schedule.startMonth - 1, schedule.startDay, schedule.startHour, schedule.startMinute);
                const stopDate = new Date(schedule.stopYear, schedule.stopMonth - 1, schedule.stopDay, schedule.stopHour, schedule.stopMinute);
                if (stopDate <= startDate) {
                    throw new ZWaveError(`The stop date must be after the start date.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            const cc = new ScheduleEntryLockCCYearDayScheduleSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
                ...(schedule
                    ? {
                        action: ScheduleEntryLockSetAction.Set,
                        ...schedule,
                    }
                    : {
                        action: ScheduleEntryLockSetAction.Erase,
                    }),
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
                // Editing (but not erasing) a schedule will enable scheduling for that user
                // and switch it to the current scheduling kind
                if (!!schedule) {
                    setUserCodeScheduleEnabledCached(this.host, this.endpoint, slot.userId, true);
                    setUserCodeScheduleKindCached(this.host, this.endpoint, slot.userId, ScheduleEntryLockScheduleKind.YearDay);
                }
                // And cache the schedule
                persistSchedule.call(cc, this.host, ScheduleEntryLockScheduleKind.YearDay, slot.userId, slot.slotId, schedule ?? false);
            }
            return result;
        }
        async getYearDaySchedule(slot) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.YearDayScheduleSet);
            const cc = new ScheduleEntryLockCCYearDayScheduleGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (result?.startYear != undefined) {
                return {
                    startYear: result.startYear,
                    startMonth: result.startMonth,
                    startDay: result.startDay,
                    startHour: result.startHour,
                    startMinute: result.startMinute,
                    stopYear: result.stopYear,
                    stopMonth: result.stopMonth,
                    stopDay: result.stopDay,
                    stopHour: result.stopHour,
                    stopMinute: result.stopMinute,
                };
            }
        }
        async setDailyRepeatingSchedule(slot, schedule) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.DailyRepeatingScheduleSet);
            if (this.isSinglecast()) {
                const numSlots = ScheduleEntryLockCC
                    .getNumDailyRepeatingSlotsCached(this.host, this.endpoint);
                if (slot.slotId < 1 || slot.slotId > numSlots) {
                    throw new ZWaveError(`The schedule slot # must be between 1 and the number of supported daily repeating slots ${numSlots}.`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            const cc = new ScheduleEntryLockCCDailyRepeatingScheduleSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
                ...(schedule
                    ? {
                        action: ScheduleEntryLockSetAction.Set,
                        ...schedule,
                    }
                    : {
                        action: ScheduleEntryLockSetAction.Erase,
                    }),
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (this.isSinglecast() && isUnsupervisedOrSucceeded(result)) {
                // Editing (but not erasing) a schedule will enable scheduling for that user
                // and switch it to the current scheduling kind
                if (!!schedule) {
                    setUserCodeScheduleEnabledCached(this.host, this.endpoint, slot.userId, true);
                    setUserCodeScheduleKindCached(this.host, this.endpoint, slot.userId, ScheduleEntryLockScheduleKind.DailyRepeating);
                }
                // And cache the schedule
                persistSchedule.call(cc, this.host, ScheduleEntryLockScheduleKind.DailyRepeating, slot.userId, slot.slotId, schedule ?? false);
            }
            return result;
        }
        async getDailyRepeatingSchedule(slot) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.DailyRepeatingScheduleSet);
            const cc = new ScheduleEntryLockCCDailyRepeatingScheduleGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...slot,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (result?.weekdays != undefined) {
                return {
                    weekdays: result.weekdays,
                    startHour: result.startHour,
                    startMinute: result.startMinute,
                    durationHour: result.durationHour,
                    durationMinute: result.durationMinute,
                };
            }
        }
        async getTimezone() {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.TimeOffsetGet);
            const cc = new ScheduleEntryLockCCTimeOffsetGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const result = await this.host.sendCommand(cc, this.commandOptions);
            if (result) {
                return pick(result, ["standardOffset", "dstOffset"]);
            }
        }
        async setTimezone(timezone) {
            this.assertSupportsCommand(ScheduleEntryLockCommand, ScheduleEntryLockCommand.TimeOffsetSet);
            const cc = new ScheduleEntryLockCCTimeOffsetSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...timezone,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ScheduleEntryLockCCAPI = _classThis;
})();
export { ScheduleEntryLockCCAPI };
let ScheduleEntryLockCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Schedule Entry Lock"]), implementedVersion(3), ccValues(ScheduleEntryLockCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ScheduleEntryLockCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Schedule Entry Lock"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "Querying supported number of schedule slots...",
                direction: "outbound",
            });
            const slotsResp = await api.getNumSlots();
            if (slotsResp) {
                let logMessage = `received supported number of schedule slots:
day of week:     ${slotsResp.numWeekDaySlots}
day of year:     ${slotsResp.numYearDaySlots}`;
                if (slotsResp.numDailyRepeatingSlots != undefined) {
                    logMessage += `
daily repeating: ${slotsResp.numDailyRepeatingSlots}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            // If the timezone is not configured with the Time CC, do it here
            if (api.supportsCommand(ScheduleEntryLockCommand.TimeOffsetSet)
                && (!endpoint.supportsCC(CommandClasses.Time)
                    || endpoint.getCCVersion(CommandClasses.Time) < 2)) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "setting timezone information...",
                    direction: "outbound",
                });
                // Set the correct timezone on this node
                const timezone = getDSTInfo();
                await api.setTimezone(timezone);
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        /**
         * Returns the number of supported day-of-week slots.
         * This only works AFTER the interview process
         */
        static getNumWeekDaySlotsCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.numWeekDaySlots.endpoint(endpoint.index)) || 0;
        }
        /**
         * Returns the number of supported day-of-year slots.
         * This only works AFTER the interview process
         */
        static getNumYearDaySlotsCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.numYearDaySlots.endpoint(endpoint.index)) || 0;
        }
        /**
         * Returns the number of supported daily-repeating slots.
         * This only works AFTER the interview process
         */
        static getNumDailyRepeatingSlotsCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.numDailyRepeatingSlots.endpoint(endpoint.index)) || 0;
        }
        /**
         * Returns whether scheduling for a given user ID (most likely) enabled. Since the Schedule Entry Lock CC
         * provides no way to query the enabled state, Z-Wave JS tracks this in its own cache.
         *
         * This only works AFTER the interview process and is likely to be wrong if a device
         * with existing schedules is queried. To be sure, disable scheduling for all users and enable
         * only the desired ones.
         */
        static getUserCodeScheduleEnabledCached(ctx, endpoint, userId) {
            return !!ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.userEnabled(userId).endpoint(endpoint.index));
        }
        /**
         * Returns which scheduling kind is (most likely) enabled for a given user ID . Since the Schedule Entry Lock CC
         * provides no way to query the current state, Z-Wave JS tracks this in its own cache.
         *
         * This only works AFTER the interview process and is likely to be wrong if a device
         * with existing schedules is queried. To be sure, edit a schedule of the desired kind
         * which will automatically switch the user to that scheduling kind.
         */
        static getUserCodeScheduleKindCached(ctx, endpoint, userId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.scheduleKind(userId).endpoint(endpoint.index));
        }
        /**
         * Returns the assumed state of a schedule. Since the Schedule Entry Lock CC
         * provides no way to query the current state, Z-Wave JS tracks this in its own cache.
         *
         * A return value of `false` means the slot is empty, a return value of `undefined` means the information is not cached yet.
         *
         * This only works AFTER the interview process.
         */
        static getScheduleCached(ctx, endpoint, scheduleKind, userId, slotId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(ScheduleEntryLockCCValues.schedule(scheduleKind, userId, slotId).endpoint(endpoint.index));
        }
    };
    return ScheduleEntryLockCC = _classThis;
})();
export { ScheduleEntryLockCC };
let ScheduleEntryLockCCEnableSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.EnableSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCEnableSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCEnableSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.enabled = options.enabled;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const enabled = raw.payload[1] === 0x01;
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                enabled,
            });
        }
        userId;
        enabled;
        serialize(ctx) {
            this.payload = Bytes.from([this.userId, this.enabled ? 0x01 : 0x00]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user ID": this.userId,
                    action: this.enabled ? "enable" : "disable",
                },
            };
        }
    };
    return ScheduleEntryLockCCEnableSet = _classThis;
})();
export { ScheduleEntryLockCCEnableSet };
let ScheduleEntryLockCCEnableAllSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.EnableAllSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCEnableAllSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCEnableAllSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.enabled = options.enabled;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const enabled = raw.payload[0] === 0x01;
            return new this({
                nodeId: ctx.sourceNodeId,
                enabled,
            });
        }
        enabled;
        serialize(ctx) {
            this.payload = Bytes.from([this.enabled ? 0x01 : 0x00]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    action: this.enabled ? "enable all" : "disable all",
                },
            };
        }
    };
    return ScheduleEntryLockCCEnableAllSet = _classThis;
})();
export { ScheduleEntryLockCCEnableAllSet };
let ScheduleEntryLockCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.SupportedReport), ccValueProperty("numWeekDaySlots", ScheduleEntryLockCCValues.numWeekDaySlots), ccValueProperty("numYearDaySlots", ScheduleEntryLockCCValues.numYearDaySlots), ccValueProperty("numDailyRepeatingSlots", ScheduleEntryLockCCValues.numDailyRepeatingSlots)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.numWeekDaySlots = options.numWeekDaySlots;
            this.numYearDaySlots = options.numYearDaySlots;
            this.numDailyRepeatingSlots = options.numDailyRepeatingSlots;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const numWeekDaySlots = raw.payload[0];
            const numYearDaySlots = raw.payload[1];
            let numDailyRepeatingSlots;
            if (raw.payload.length >= 3) {
                numDailyRepeatingSlots = raw.payload[2];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                numWeekDaySlots,
                numYearDaySlots,
                numDailyRepeatingSlots,
            });
        }
        numWeekDaySlots;
        numYearDaySlots;
        numDailyRepeatingSlots;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.numWeekDaySlots,
                this.numYearDaySlots,
                this.numDailyRepeatingSlots ?? 0,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "no. of weekday schedule slots": this.numWeekDaySlots,
                "no. of day-of-year schedule slots": this.numYearDaySlots,
            };
            if (this.numDailyRepeatingSlots != undefined) {
                message["no. of daily repeating schedule slots"] =
                    this.numDailyRepeatingSlots;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCSupportedReport = _classThis;
})();
export { ScheduleEntryLockCCSupportedReport };
let ScheduleEntryLockCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.SupportedGet), expectedCCResponse(ScheduleEntryLockCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ScheduleEntryLockCCSupportedGet = _classThis;
})();
export { ScheduleEntryLockCCSupportedGet };
let ScheduleEntryLockCCWeekDayScheduleSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.WeekDayScheduleSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCWeekDayScheduleSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCWeekDayScheduleSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.action = options.action;
            if (options.action === ScheduleEntryLockSetAction.Set) {
                this.weekday = options.weekday;
                this.startHour = options.startHour;
                this.startMinute = options.startMinute;
                this.stopHour = options.stopHour;
                this.stopMinute = options.stopMinute;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const action = raw.payload[0];
            validatePayload(action === ScheduleEntryLockSetAction.Set
                || action === ScheduleEntryLockSetAction.Erase);
            const userId = raw.payload[1];
            const slotId = raw.payload[2];
            if (action !== ScheduleEntryLockSetAction.Set) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    action,
                    userId,
                    slotId,
                });
            }
            validatePayload(raw.payload.length >= 8);
            const weekday = raw.payload[3];
            const startHour = raw.payload[4];
            const startMinute = raw.payload[5];
            const stopHour = raw.payload[6];
            const stopMinute = raw.payload[7];
            return new this({
                nodeId: ctx.sourceNodeId,
                action,
                userId,
                slotId,
                weekday,
                startHour,
                startMinute,
                stopHour,
                stopMinute,
            });
        }
        userId;
        slotId;
        action;
        weekday;
        startHour;
        startMinute;
        stopHour;
        stopMinute;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.action,
                this.userId,
                this.slotId,
                // The report should have these fields set to 0xff
                // if the slot is erased. The specs don't mention anything
                // for the Set command, so we just assume the same is okay
                this.weekday ?? 0xff,
                this.startHour ?? 0xff,
                this.startMinute ?? 0xff,
                this.stopHour ?? 0xff,
                this.stopMinute ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (this.action === ScheduleEntryLockSetAction.Erase) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "erase",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "set",
                    weekday: getEnumMemberName(ScheduleEntryLockWeekday, this.weekday),
                    "start time": formatTime(this.startHour ?? 0, this.startMinute ?? 0),
                    "end time": formatTime(this.stopHour ?? 0, this.stopMinute ?? 0),
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCWeekDayScheduleSet = _classThis;
})();
export { ScheduleEntryLockCCWeekDayScheduleSet };
let ScheduleEntryLockCCWeekDayScheduleReport = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.WeekDayScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCWeekDayScheduleReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCWeekDayScheduleReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.weekday = options.weekday;
            this.startHour = options.startHour;
            this.startMinute = options.startMinute;
            this.stopHour = options.stopHour;
            this.stopMinute = options.stopMinute;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            let ccOptions = {
                userId,
                slotId,
            };
            let weekday;
            let startHour;
            let startMinute;
            let stopHour;
            let stopMinute;
            if (raw.payload.length >= 7) {
                if (raw.payload[2] !== 0xff) {
                    weekday = raw.payload[2];
                }
                if (raw.payload[3] !== 0xff) {
                    startHour = raw.payload[3];
                }
                if (raw.payload[4] !== 0xff) {
                    startMinute = raw.payload[4];
                }
                if (raw.payload[5] !== 0xff) {
                    stopHour = raw.payload[5];
                }
                if (raw.payload[6] !== 0xff) {
                    stopMinute = raw.payload[6];
                }
            }
            if (weekday != undefined
                && startHour != undefined
                && startMinute != undefined
                && stopHour != undefined
                && stopMinute != undefined) {
                ccOptions = {
                    ...ccOptions,
                    weekday,
                    startHour,
                    startMinute,
                    stopHour,
                    stopMinute,
                };
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ...ccOptions,
            });
        }
        userId;
        slotId;
        weekday;
        startHour;
        startMinute;
        stopHour;
        stopMinute;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            persistSchedule.call(this, ctx, ScheduleEntryLockScheduleKind.WeekDay, this.userId, this.slotId, this.weekday != undefined
                ? {
                    weekday: this.weekday,
                    startHour: this.startHour,
                    startMinute: this.startMinute,
                    stopHour: this.stopHour,
                    stopMinute: this.stopMinute,
                }
                : false);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.from([
                this.userId,
                this.slotId,
                this.weekday ?? 0xff,
                this.startHour ?? 0xff,
                this.startMinute ?? 0xff,
                this.stopHour ?? 0xff,
                this.stopMinute ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (this.weekday == undefined) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    schedule: "(empty)",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    weekday: getEnumMemberName(ScheduleEntryLockWeekday, this.weekday),
                    "start time": formatTime(this.startHour ?? 0, this.startMinute ?? 0),
                    "end time": formatTime(this.stopHour ?? 0, this.stopMinute ?? 0),
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCWeekDayScheduleReport = _classThis;
})();
export { ScheduleEntryLockCCWeekDayScheduleReport };
let ScheduleEntryLockCCWeekDayScheduleGet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.WeekDayScheduleGet), expectedCCResponse(ScheduleEntryLockCCWeekDayScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCWeekDayScheduleGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCWeekDayScheduleGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                slotId,
            });
        }
        userId;
        slotId;
        serialize(ctx) {
            this.payload = Bytes.from([this.userId, this.slotId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                },
            };
        }
    };
    return ScheduleEntryLockCCWeekDayScheduleGet = _classThis;
})();
export { ScheduleEntryLockCCWeekDayScheduleGet };
let ScheduleEntryLockCCYearDayScheduleSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.YearDayScheduleSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCYearDayScheduleSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCYearDayScheduleSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.action = options.action;
            if (options.action === ScheduleEntryLockSetAction.Set) {
                this.startYear = options.startYear;
                this.startMonth = options.startMonth;
                this.startDay = options.startDay;
                this.startHour = options.startHour;
                this.startMinute = options.startMinute;
                this.stopYear = options.stopYear;
                this.stopMonth = options.stopMonth;
                this.stopDay = options.stopDay;
                this.stopHour = options.stopHour;
                this.stopMinute = options.stopMinute;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const action = raw.payload[0];
            validatePayload(action === ScheduleEntryLockSetAction.Set
                || action === ScheduleEntryLockSetAction.Erase);
            const userId = raw.payload[1];
            const slotId = raw.payload[2];
            if (action !== ScheduleEntryLockSetAction.Set) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    action,
                    userId,
                    slotId,
                });
            }
            validatePayload(raw.payload.length >= 13);
            const startYear = raw.payload[3];
            const startMonth = raw.payload[4];
            const startDay = raw.payload[5];
            const startHour = raw.payload[6];
            const startMinute = raw.payload[7];
            const stopYear = raw.payload[8];
            const stopMonth = raw.payload[9];
            const stopDay = raw.payload[10];
            const stopHour = raw.payload[11];
            const stopMinute = raw.payload[12];
            return new this({
                nodeId: ctx.sourceNodeId,
                action,
                userId,
                slotId,
                startYear,
                startMonth,
                startDay,
                startHour,
                startMinute,
                stopYear,
                stopMonth,
                stopDay,
                stopHour,
                stopMinute,
            });
        }
        userId;
        slotId;
        action;
        startYear;
        startMonth;
        startDay;
        startHour;
        startMinute;
        stopYear;
        stopMonth;
        stopDay;
        stopHour;
        stopMinute;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.action,
                this.userId,
                this.slotId,
                // The report should have these fields set to 0xff
                // if the slot is erased. The specs don't mention anything
                // for the Set command, so we just assume the same is okay
                this.startYear ?? 0xff,
                this.startMonth ?? 0xff,
                this.startDay ?? 0xff,
                this.startHour ?? 0xff,
                this.startMinute ?? 0xff,
                this.stopYear ?? 0xff,
                this.stopMonth ?? 0xff,
                this.stopDay ?? 0xff,
                this.stopHour ?? 0xff,
                this.stopMinute ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (this.action === ScheduleEntryLockSetAction.Erase) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "erase",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "set",
                    "start date": `${formatDate(this.startYear ?? 0, this.startMonth ?? 0, this.startDay ?? 0)} ${formatTime(this.startHour ?? 0, this.startMinute ?? 0)}`,
                    "end date": `${formatDate(this.stopYear ?? 0, this.stopMonth ?? 0, this.stopDay ?? 0)} ${formatTime(this.stopHour ?? 0, this.stopMinute ?? 0)}`,
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCYearDayScheduleSet = _classThis;
})();
export { ScheduleEntryLockCCYearDayScheduleSet };
let ScheduleEntryLockCCYearDayScheduleReport = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.YearDayScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCYearDayScheduleReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCYearDayScheduleReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.startYear = options.startYear;
            this.startMonth = options.startMonth;
            this.startDay = options.startDay;
            this.startHour = options.startHour;
            this.startMinute = options.startMinute;
            this.stopYear = options.stopYear;
            this.stopMonth = options.stopMonth;
            this.stopDay = options.stopDay;
            this.stopHour = options.stopHour;
            this.stopMinute = options.stopMinute;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            let ccOptions = {
                userId,
                slotId,
            };
            let startYear;
            let startMonth;
            let startDay;
            let startHour;
            let startMinute;
            let stopYear;
            let stopMonth;
            let stopDay;
            let stopHour;
            let stopMinute;
            if (raw.payload.length >= 12) {
                if (raw.payload[2] !== 0xff) {
                    startYear = raw.payload[2];
                }
                if (raw.payload[3] !== 0xff) {
                    startMonth = raw.payload[3];
                }
                if (raw.payload[4] !== 0xff) {
                    startDay = raw.payload[4];
                }
                if (raw.payload[5] !== 0xff) {
                    startHour = raw.payload[5];
                }
                if (raw.payload[6] !== 0xff) {
                    startMinute = raw.payload[6];
                }
                if (raw.payload[7] !== 0xff) {
                    stopYear = raw.payload[7];
                }
                if (raw.payload[8] !== 0xff) {
                    stopMonth = raw.payload[8];
                }
                if (raw.payload[9] !== 0xff) {
                    stopDay = raw.payload[9];
                }
                if (raw.payload[10] !== 0xff) {
                    stopHour = raw.payload[10];
                }
                if (raw.payload[11] !== 0xff) {
                    stopMinute = raw.payload[11];
                }
            }
            if (startYear != undefined
                && startMonth != undefined
                && startDay != undefined
                && startHour != undefined
                && startMinute != undefined
                && stopYear != undefined
                && stopMonth != undefined
                && stopDay != undefined
                && stopHour != undefined
                && stopMinute != undefined) {
                ccOptions = {
                    ...ccOptions,
                    startYear,
                    startMonth,
                    startDay,
                    startHour,
                    startMinute,
                    stopYear,
                    stopMonth,
                    stopDay,
                    stopHour,
                    stopMinute,
                };
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ...ccOptions,
            });
        }
        userId;
        slotId;
        startYear;
        startMonth;
        startDay;
        startHour;
        startMinute;
        stopYear;
        stopMonth;
        stopDay;
        stopHour;
        stopMinute;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            persistSchedule.call(this, ctx, ScheduleEntryLockScheduleKind.YearDay, this.userId, this.slotId, this.startYear != undefined
                ? {
                    startYear: this.startYear,
                    startMonth: this.startMonth,
                    startDay: this.startDay,
                    startHour: this.startHour,
                    startMinute: this.startMinute,
                    stopYear: this.stopYear,
                    stopMonth: this.stopMonth,
                    stopDay: this.stopDay,
                    stopHour: this.stopHour,
                    stopMinute: this.stopMinute,
                }
                : false);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.from([
                this.userId,
                this.slotId,
                this.startYear ?? 0xff,
                this.startMonth ?? 0xff,
                this.startDay ?? 0xff,
                this.startHour ?? 0xff,
                this.startMinute ?? 0xff,
                this.stopYear ?? 0xff,
                this.stopMonth ?? 0xff,
                this.stopDay ?? 0xff,
                this.stopHour ?? 0xff,
                this.stopMinute ?? 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (this.startYear !== undefined) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    schedule: "(empty)",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "set",
                    "start date": `${formatDate(this.startYear ?? 0, this.startMonth ?? 0, this.startDay ?? 0)} ${formatTime(this.startHour ?? 0, this.startMinute ?? 0)}`,
                    "end date": `${formatDate(this.stopYear ?? 0, this.stopMonth ?? 0, this.stopDay ?? 0)} ${formatTime(this.stopHour ?? 0, this.stopMinute ?? 0)}`,
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCYearDayScheduleReport = _classThis;
})();
export { ScheduleEntryLockCCYearDayScheduleReport };
let ScheduleEntryLockCCYearDayScheduleGet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.YearDayScheduleGet), expectedCCResponse(ScheduleEntryLockCCYearDayScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCYearDayScheduleGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCYearDayScheduleGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                slotId,
            });
        }
        userId;
        slotId;
        serialize(ctx) {
            this.payload = Bytes.from([this.userId, this.slotId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                },
            };
        }
    };
    return ScheduleEntryLockCCYearDayScheduleGet = _classThis;
})();
export { ScheduleEntryLockCCYearDayScheduleGet };
let ScheduleEntryLockCCTimeOffsetSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.TimeOffsetSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCTimeOffsetSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCTimeOffsetSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.standardOffset = options.standardOffset;
            this.dstOffset = options.dstOffset;
        }
        static from(raw, ctx) {
            const { standardOffset, dstOffset } = parseTimezone(raw.payload);
            return new this({
                nodeId: ctx.sourceNodeId,
                standardOffset,
                dstOffset,
            });
        }
        standardOffset;
        dstOffset;
        serialize(ctx) {
            this.payload = encodeTimezone({
                standardOffset: this.standardOffset,
                dstOffset: this.dstOffset,
            });
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "standard time offset": `${this.standardOffset} minutes`,
                    "DST offset": `${this.dstOffset} minutes`,
                },
            };
        }
    };
    return ScheduleEntryLockCCTimeOffsetSet = _classThis;
})();
export { ScheduleEntryLockCCTimeOffsetSet };
let ScheduleEntryLockCCTimeOffsetReport = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.TimeOffsetReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCTimeOffsetReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCTimeOffsetReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.standardOffset = options.standardOffset;
            this.dstOffset = options.dstOffset;
        }
        static from(raw, ctx) {
            const { standardOffset, dstOffset } = parseTimezone(raw.payload);
            return new this({
                nodeId: ctx.sourceNodeId,
                standardOffset,
                dstOffset,
            });
        }
        standardOffset;
        dstOffset;
        serialize(ctx) {
            this.payload = encodeTimezone({
                standardOffset: this.standardOffset,
                dstOffset: this.dstOffset,
            });
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "standard time offset": `${this.standardOffset} minutes`,
                    "DST offset": `${this.dstOffset} minutes`,
                },
            };
        }
    };
    return ScheduleEntryLockCCTimeOffsetReport = _classThis;
})();
export { ScheduleEntryLockCCTimeOffsetReport };
let ScheduleEntryLockCCTimeOffsetGet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.TimeOffsetGet), expectedCCResponse(ScheduleEntryLockCCTimeOffsetReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCTimeOffsetGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCTimeOffsetGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ScheduleEntryLockCCTimeOffsetGet = _classThis;
})();
export { ScheduleEntryLockCCTimeOffsetGet };
let ScheduleEntryLockCCDailyRepeatingScheduleSet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.DailyRepeatingScheduleSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCDailyRepeatingScheduleSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCDailyRepeatingScheduleSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.action = options.action;
            if (options.action === ScheduleEntryLockSetAction.Set) {
                this.weekdays = options.weekdays;
                this.startHour = options.startHour;
                this.startMinute = options.startMinute;
                this.durationHour = options.durationHour;
                this.durationMinute = options.durationMinute;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const action = raw.payload[0];
            validatePayload(action === ScheduleEntryLockSetAction.Set
                || action === ScheduleEntryLockSetAction.Erase);
            const userId = raw.payload[1];
            const slotId = raw.payload[2];
            if (action !== ScheduleEntryLockSetAction.Set) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    action,
                    userId,
                    slotId,
                });
            }
            validatePayload(raw.payload.length >= 8);
            const weekdays = parseBitMask(raw.payload.subarray(3, 4), ScheduleEntryLockWeekday.Sunday);
            const startHour = raw.payload[4];
            const startMinute = raw.payload[5];
            const durationHour = raw.payload[6];
            const durationMinute = raw.payload[7];
            return new this({
                nodeId: ctx.sourceNodeId,
                action,
                userId,
                slotId,
                weekdays,
                startHour,
                startMinute,
                durationHour,
                durationMinute,
            });
        }
        userId;
        slotId;
        action;
        weekdays;
        startHour;
        startMinute;
        durationHour;
        durationMinute;
        serialize(ctx) {
            this.payload = Bytes.from([this.action, this.userId, this.slotId]);
            if (this.action === ScheduleEntryLockSetAction.Set) {
                this.payload = Bytes.concat([
                    this.payload,
                    encodeBitMask(this.weekdays, ScheduleEntryLockWeekday.Saturday, ScheduleEntryLockWeekday.Sunday),
                    Bytes.from([
                        this.startHour,
                        this.startMinute,
                        this.durationHour,
                        this.durationMinute,
                    ]),
                ]);
            }
            else {
                // Not sure if this is correct
                this.payload = Bytes.concat([this.payload, Bytes.alloc(5, 0xff)]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (this.action === ScheduleEntryLockSetAction.Erase) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "erase",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "set",
                    weekdays: this.weekdays.map((w) => getEnumMemberName(ScheduleEntryLockWeekday, w)).join(", "),
                    "start time": formatTime(this.startHour ?? 0, this.startMinute ?? 0),
                    duration: formatTime(this.durationHour ?? 0, this.durationMinute ?? 0),
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCDailyRepeatingScheduleSet = _classThis;
})();
export { ScheduleEntryLockCCDailyRepeatingScheduleSet };
let ScheduleEntryLockCCDailyRepeatingScheduleReport = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.DailyRepeatingScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCDailyRepeatingScheduleReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCDailyRepeatingScheduleReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
            this.weekdays = options.weekdays;
            this.startHour = options.startHour;
            this.startMinute = options.startMinute;
            this.durationHour = options.durationHour;
            this.durationMinute = options.durationMinute;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            if (raw.payload.length >= 7 && raw.payload[2] !== 0) {
                // Only parse the schedule if it is present and some weekday is selected
                const weekdays = parseBitMask(raw.payload.subarray(2, 3), ScheduleEntryLockWeekday.Sunday);
                const startHour = raw.payload[3];
                const startMinute = raw.payload[4];
                const durationHour = raw.payload[5];
                const durationMinute = raw.payload[6];
                return new this({
                    nodeId: ctx.sourceNodeId,
                    userId,
                    slotId,
                    weekdays,
                    startHour,
                    startMinute,
                    durationHour,
                    durationMinute,
                });
            }
            else {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    userId,
                    slotId,
                });
            }
        }
        userId;
        slotId;
        weekdays;
        startHour;
        startMinute;
        durationHour;
        durationMinute;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            persistSchedule.call(this, ctx, ScheduleEntryLockScheduleKind.DailyRepeating, this.userId, this.slotId, this.weekdays?.length
                ? {
                    weekdays: this.weekdays,
                    startHour: this.startHour,
                    startMinute: this.startMinute,
                    durationHour: this.durationHour,
                    durationMinute: this.durationMinute,
                }
                : false);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.from([this.userId, this.slotId]);
            if (this.weekdays) {
                this.payload = Bytes.concat([
                    this.payload,
                    encodeBitMask(this.weekdays, ScheduleEntryLockWeekday.Saturday, ScheduleEntryLockWeekday.Sunday),
                    Bytes.from([
                        this.startHour,
                        this.startMinute,
                        this.durationHour,
                        this.durationMinute,
                    ]),
                ]);
            }
            else {
                // Not sure if this is correct, but at least we won't parse it incorrectly ourselves when setting everything to 0
                this.payload = Bytes.concat([this.payload, Bytes.alloc(5, 0)]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            let message;
            if (!this.weekdays) {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    schedule: "(empty)",
                };
            }
            else {
                message = {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                    action: "set",
                    weekdays: this.weekdays
                        .map((w) => getEnumMemberName(ScheduleEntryLockWeekday, w))
                        .join(", "),
                    "start time": formatTime(this.startHour ?? 0, this.startMinute ?? 0),
                    duration: formatTime(this.durationHour ?? 0, this.durationMinute ?? 0),
                };
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return ScheduleEntryLockCCDailyRepeatingScheduleReport = _classThis;
})();
export { ScheduleEntryLockCCDailyRepeatingScheduleReport };
let ScheduleEntryLockCCDailyRepeatingScheduleGet = (() => {
    let _classDecorators = [CCCommand(ScheduleEntryLockCommand.DailyRepeatingScheduleGet), expectedCCResponse(ScheduleEntryLockCCDailyRepeatingScheduleReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ScheduleEntryLockCC;
    var ScheduleEntryLockCCDailyRepeatingScheduleGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScheduleEntryLockCCDailyRepeatingScheduleGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.userId = options.userId;
            this.slotId = options.slotId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const userId = raw.payload[0];
            const slotId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                userId,
                slotId,
            });
        }
        userId;
        slotId;
        serialize(ctx) {
            this.payload = Bytes.from([this.userId, this.slotId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "user ID": this.userId,
                    "slot #": this.slotId,
                },
            };
        }
    };
    return ScheduleEntryLockCCDailyRepeatingScheduleGet = _classThis;
})();
export { ScheduleEntryLockCCDailyRepeatingScheduleGet };
//# sourceMappingURL=ScheduleEntryLockCC.js.map