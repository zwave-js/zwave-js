import type {
	MessageOrCCLogEntry,
	MessageRecord,
	ValueID,
} from "@zwave-js/core/safe";
import {
	CommandClasses,
	enumValuesToMetadataStates,
	Maybe,
	MessagePriority,
	parseFloatWithScale,
	validatePayload,
	ValueMetadata,
} from "@zwave-js/core/safe";
import type { ZWaveApplicationHost, ZWaveHost } from "@zwave-js/host/safe";
import { getEnumMemberName, pick } from "@zwave-js/shared/safe";
import {
	CCAPI,
	PhysicalCCAPI,
	PollValueImplementation,
	POLL_VALUE,
	throwUnsupportedProperty,
} from "../lib/API";
import {
	ccValue,
	CommandClass,
	type CommandClassDeserializationOptions,
} from "../lib/CommandClass";
import {
	API,
	CCCommand,
	CCValues,
	commandClass,
	expectedCCResponse,
	implementedVersion,
} from "../lib/CommandClassDecorators";
import { V } from "../lib/Values";
import {
	BatteryChargingStatus,
	BatteryCommand,
	BatteryReplacementStatus,
} from "../lib/_Types";

export const BatteryCCValues = Object.freeze({
	...V.defineStaticCCValues(CommandClasses.Battery, {
		...V.staticProperty("level", {
			...ValueMetadata.ReadOnlyUInt8,
			max: 100,
			unit: "%",
			label: "Battery level",
		} as const),

		...V.staticProperty("isLow", {
			...ValueMetadata.ReadOnlyBoolean,
			label: "Low battery level",
		} as const),

		...V.staticProperty(
			"maximumCapacity",
			{
				...ValueMetadata.ReadOnlyUInt8,
				max: 100,
				unit: "%",
				label: "Maximum capacity",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"temperature",
			{
				...ValueMetadata.ReadOnlyUInt8,
				label: "Temperature",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"chargingStatus",
			{
				...ValueMetadata.ReadOnlyUInt8,
				label: "Charging status",
				states: enumValuesToMetadataStates(BatteryChargingStatus),
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"rechargeable",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Rechargeable",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"backup",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Used as backup",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"overheating",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Overheating",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"lowFluid",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Fluid is low",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"rechargeOrReplace",
			{
				...ValueMetadata.ReadOnlyUInt8,
				label: "Recharge or replace",
				states: enumValuesToMetadataStates(BatteryReplacementStatus),
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"disconnected",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Battery is disconnected",
			} as const,
			{
				minVersion: 2,
			} as const,
		),

		...V.staticProperty(
			"lowTemperatureStatus",
			{
				...ValueMetadata.ReadOnlyBoolean,
				label: "Battery temperature is low",
			} as const,
			{
				minVersion: 3,
			} as const,
		),
	}),
});

// @noSetValueAPI This CC is read-only

@API(CommandClasses.Battery)
export class BatteryCCAPI extends PhysicalCCAPI {
	public supportsCommand(cmd: BatteryCommand): Maybe<boolean> {
		switch (cmd) {
			case BatteryCommand.Get:
				return true; // This is mandatory
			case BatteryCommand.HealthGet:
				return this.version >= 2;
		}
		return super.supportsCommand(cmd);
	}

	protected [POLL_VALUE]: PollValueImplementation = async ({
		property,
	}): Promise<unknown> => {
		switch (property) {
			case "level":
			case "isLow":
			case "chargingStatus":
			case "rechargeable":
			case "backup":
			case "overheating":
			case "lowFluid":
			case "rechargeOrReplace":
			case "lowTemperatureStatus":
			case "disconnected":
				return (await this.get())?.[property];

			case "maximumCapacity":
			case "temperature":
				return (await this.getHealth())?.[property];

			default:
				throwUnsupportedProperty(this.ccId, property);
		}
	};

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public async get() {
		this.assertSupportsCommand(BatteryCommand, BatteryCommand.Get);

		const cc = new BatteryCCGet(this.applHost, {
			nodeId: this.endpoint.nodeId,
			endpoint: this.endpoint.index,
		});
		const response = await this.applHost.sendCommand<BatteryCCReport>(
			cc,
			this.commandOptions,
		);
		if (response) {
			return pick(response, [
				"level",
				"isLow",
				"chargingStatus",
				"rechargeable",
				"backup",
				"overheating",
				"lowFluid",
				"rechargeOrReplace",
				"lowTemperatureStatus",
				"disconnected",
			]);
		}
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public async getHealth() {
		this.assertSupportsCommand(BatteryCommand, BatteryCommand.HealthGet);

		const cc = new BatteryCCHealthGet(this.applHost, {
			nodeId: this.endpoint.nodeId,
			endpoint: this.endpoint.index,
		});
		const response = await this.applHost.sendCommand<BatteryCCHealthReport>(
			cc,
			this.commandOptions,
		);
		if (response) {
			return pick(response, ["maximumCapacity", "temperature"]);
		}
	}
}

@commandClass(CommandClasses.Battery)
@implementedVersion(3)
@CCValues(BatteryCCValues)
export class BatteryCC extends CommandClass {
	declare ccCommand: BatteryCommand;

	public async interview(applHost: ZWaveApplicationHost): Promise<void> {
		const node = this.getNode(applHost)!;

		applHost.controllerLog.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: `Interviewing ${this.ccName}...`,
			direction: "none",
		});

		// Query the Battery status
		await this.refreshValues(applHost);

		// Remember that the interview is complete
		this.setInterviewComplete(applHost, true);
	}

	public async refreshValues(applHost: ZWaveApplicationHost): Promise<void> {
		const node = this.getNode(applHost)!;
		const endpoint = this.getEndpoint(applHost)!;
		const api = CCAPI.create(
			CommandClasses.Battery,
			applHost,
			endpoint,
		).withOptions({
			priority: MessagePriority.NodeQuery,
		});

		applHost.controllerLog.logNode(node.id, {
			endpoint: this.endpointIndex,
			message: "querying battery status...",
			direction: "outbound",
		});

		const batteryStatus = await api.get();
		if (batteryStatus) {
			let logMessage = `received response for battery information:
level:                           ${batteryStatus.level}${
				batteryStatus.isLow ? " (low)" : ""
			}`;
			if (this.version >= 2) {
				logMessage += `
status:                          ${
					BatteryChargingStatus[batteryStatus.chargingStatus!]
				}
rechargeable:                    ${batteryStatus.rechargeable}
is backup:                       ${batteryStatus.backup}
is overheating:                  ${batteryStatus.overheating}
fluid is low:                    ${batteryStatus.lowFluid}
needs to be replaced or charged: ${
					BatteryReplacementStatus[batteryStatus.rechargeOrReplace!]
				}
is low temperature               ${batteryStatus.lowTemperatureStatus}
is disconnected:                 ${batteryStatus.disconnected}`;
			}
			applHost.controllerLog.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: logMessage,
				direction: "inbound",
			});
		}

		if (this.version >= 2) {
			// always query the health
			applHost.controllerLog.logNode(node.id, {
				endpoint: this.endpointIndex,
				message: "querying battery health...",
				direction: "outbound",
			});

			const batteryHealth = await api.getHealth();
			if (batteryHealth) {
				const logMessage = `received response for battery health:
max. capacity: ${batteryHealth.maximumCapacity} %
temperature:   ${batteryHealth.temperature} °C`;
				applHost.controllerLog.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: logMessage,
					direction: "inbound",
				});
			}
		}
	}
}

@CCCommand(BatteryCommand.Report)
export class BatteryCCReport extends BatteryCC {
	public constructor(
		host: ZWaveHost,
		options: CommandClassDeserializationOptions,
	) {
		super(host, options);

		validatePayload(this.payload.length >= 1);
		this._level = this.payload[0];
		if (this._level === 0xff) {
			this._level = 0;
			this._isLow = true;
		} else {
			this._isLow = false;
		}

		if (this.payload.length >= 3) {
			// Starting with V2
			this._chargingStatus = this.payload[1] >>> 6;
			this._rechargeable = !!(this.payload[1] & 0b0010_0000);
			this._backup = !!(this.payload[1] & 0b0001_0000);
			this._overheating = !!(this.payload[1] & 0b1000);
			this._lowFluid = !!(this.payload[1] & 0b0100);
			this._rechargeOrReplace = !!(this.payload[1] & 0b10)
				? BatteryReplacementStatus.Now
				: !!(this.payload[1] & 0b1)
				? BatteryReplacementStatus.Soon
				: BatteryReplacementStatus.No;
			this._lowTemperatureStatus = !!(this.payload[2] & 0b10);
			this._disconnected = !!(this.payload[2] & 0b1);
		}
	}

	private _level: number;
	@ccValue()
	public get level(): number {
		return this._level;
	}

	private _isLow: boolean;
	@ccValue()
	public get isLow(): boolean {
		return this._isLow;
	}

	private _chargingStatus: BatteryChargingStatus | undefined;
	@ccValue({ minVersion: 2 })
	public get chargingStatus(): BatteryChargingStatus | undefined {
		return this._chargingStatus;
	}

	private _rechargeable: boolean | undefined;
	@ccValue({ minVersion: 2 })
	public get rechargeable(): boolean | undefined {
		return this._rechargeable;
	}

	private _backup: boolean | undefined;
	@ccValue({ minVersion: 2 })
	public get backup(): boolean | undefined {
		return this._backup;
	}

	private _overheating: boolean | undefined;
	@ccValue({ minVersion: 2 })
	public get overheating(): boolean | undefined {
		return this._overheating;
	}

	private _lowFluid: boolean | undefined;
	@ccValue({ minVersion: 2 })
	public get lowFluid(): boolean | undefined {
		return this._lowFluid;
	}

	private _rechargeOrReplace: BatteryReplacementStatus | undefined;
	@ccValue({ minVersion: 2 })
	public get rechargeOrReplace(): BatteryReplacementStatus | undefined {
		return this._rechargeOrReplace;
	}

	private _disconnected: boolean | undefined;
	@ccValue({ minVersion: 2 })
	public get disconnected(): boolean | undefined {
		return this._disconnected;
	}

	private _lowTemperatureStatus: boolean | undefined;
	@ccValue({ minVersion: 3 })
	public get lowTemperatureStatus(): boolean | undefined {
		return this._lowTemperatureStatus;
	}

	public toLogEntry(applHost: ZWaveApplicationHost): MessageOrCCLogEntry {
		const message: MessageRecord = {
			level: this._level,
			"is low": this._isLow,
		};
		if (this.chargingStatus != undefined) {
			message["charging status"] = getEnumMemberName(
				BatteryChargingStatus,
				this.chargingStatus,
			);
		}
		if (this.rechargeable != undefined) {
			message.rechargeable = this.rechargeable;
		}
		if (this.backup != undefined) {
			message.backup = this.backup;
		}
		if (this.overheating != undefined) {
			message.overheating = this.overheating;
		}
		if (this.lowFluid != undefined) {
			message["low fluid"] = this.lowFluid;
		}
		if (this.rechargeOrReplace != undefined) {
			message["recharge or replace"] = getEnumMemberName(
				BatteryReplacementStatus,
				this.rechargeOrReplace,
			);
		}
		if (this.lowTemperatureStatus != undefined) {
			message.lowTemperatureStatus = this.lowTemperatureStatus;
		}
		if (this.disconnected != undefined) {
			message.disconnected = this.disconnected;
		}
		return {
			...super.toLogEntry(applHost),
			message,
		};
	}
}

@CCCommand(BatteryCommand.Get)
@expectedCCResponse(BatteryCCReport)
export class BatteryCCGet extends BatteryCC {}

@CCCommand(BatteryCommand.HealthReport)
export class BatteryCCHealthReport extends BatteryCC {
	public constructor(
		host: ZWaveHost,
		options: CommandClassDeserializationOptions,
	) {
		super(host, options);

		validatePayload(this.payload.length >= 2);

		// Parse maximum capacity. 0xff means unknown
		this._maximumCapacity = this.payload[0];
		if (this._maximumCapacity === 0xff) this._maximumCapacity = undefined;

		const { value: temperature, scale } = parseFloatWithScale(
			this.payload.slice(1),
			true, // The temperature field may be omitted
		);
		this._temperature = temperature;
		this.temperatureScale = scale;
	}

	public persistValues(applHost: ZWaveApplicationHost): boolean {
		if (!super.persistValues(applHost)) return false;
		const valueDB = this.getValueDB(applHost);

		// Update the temperature unit in the value DB
		const valueId: ValueID = {
			commandClass: this.ccId,
			endpoint: this.endpointIndex,
			property: "temperature",
		};
		valueDB.setMetadata(valueId, {
			...ValueMetadata.ReadOnlyNumber,
			label: "Temperature",
			unit: this.temperatureScale === 0x00 ? "°C" : undefined,
		});

		return true;
	}

	private _maximumCapacity: number | undefined;
	@ccValue({ minVersion: 2 })
	public get maximumCapacity(): number | undefined {
		return this._maximumCapacity;
	}

	private _temperature: number | undefined;
	@ccValue({ minVersion: 2 })
	public get temperature(): number | undefined {
		return this._temperature;
	}

	private readonly temperatureScale: number | undefined;

	public toLogEntry(applHost: ZWaveApplicationHost): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(applHost),
			message: {
				temperature:
					this.temperature != undefined
						? this.temperature
						: "unknown",
				"max capacity":
					this.maximumCapacity != undefined
						? `${this.maximumCapacity} %`
						: "unknown",
			},
		};
	}
}

@CCCommand(BatteryCommand.HealthGet)
@expectedCCResponse(BatteryCCHealthReport)
export class BatteryCCHealthGet extends BatteryCC {}
