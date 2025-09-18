import { clamp } from "alcalzone-shared/math";
/** Represents a timeout that is used by some command classes */
export class Timeout {
    unit;
    constructor(value, unit) {
        this.unit = unit;
        if (value === 0)
            this.unit = "none";
        switch (unit) {
            case "none":
            case "infinite":
                value = 0;
                break;
        }
        this.value = value;
    }
    _value;
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = clamp(v, 0, this.unit === "seconds" ? 60 : 191);
    }
    static isTimeout(value) {
        return typeof value === "object"
            && value != null
            && "value" in value
            && typeof value.value === "number"
            && "unit" in value
            && typeof value.unit === "string";
    }
    static parse(payload) {
        if (payload == undefined)
            return undefined;
        if (payload === 0xff)
            return new Timeout(0, "infinite");
        const isMinutes = !!(payload & 0b0100_0000);
        const value = (payload & 0b0011_1111) + (isMinutes ? 1 : 0); // minutes start at 1
        return new Timeout(value, isMinutes ? "minutes" : "seconds");
    }
    /** Serializes a timeout for a Set command */
    serialize() {
        if (this.unit === "infinite")
            return 0xff;
        if (this.unit === "none")
            return 0x00;
        const isMinutes = this.unit === "minutes";
        return (isMinutes ? 0b0100_0000 : 0) | (this._value & 0b0011_1111);
    }
    toJSON() {
        if (this.unit === "none" || this.unit === "infinite")
            return this.unit;
        return {
            value: this.value,
            unit: this.unit,
        };
    }
    toMilliseconds() {
        switch (this.unit) {
            case "none":
                return 0;
            case "minutes":
                return this._value * 60000;
            case "seconds":
                return this._value * 1000;
            case "infinite":
                return Number.POSITIVE_INFINITY;
        }
    }
    toString() {
        switch (this.unit) {
            case "minutes":
                return `[Timeout: ${this._value}${this.value === 1 ? "minute" : "minutes"}]`;
            case "seconds":
                return `[Timeout: ${this._value}${this.value === 1 ? "second" : "seconds"}]`;
            default:
                return `[Timeout: ${this.unit}]`;
        }
    }
}
//# sourceMappingURL=Timeout.js.map