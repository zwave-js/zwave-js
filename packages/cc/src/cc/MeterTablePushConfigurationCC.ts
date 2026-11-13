import {
	CommandClasses,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	MessagePriority,
	type SupervisionResult,
	SupervisionStatus,
	isUnsupervisedOrSucceeded,
	type WithAddress,
	validatePayload,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { Bytes, num2hex, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { wait } from "alcalzone-shared/async";

import { CCAPI } from "../lib/API.js";
import {
	type CCRaw,
	CommandClass,
	type InterviewContext,
} from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	commandClass,
	expectedCCResponse,
	implementedVersion,
	useSupervision,
} from "../lib/CommandClassDecorators.js";
import {
	type MeterTablePushConfiguration,
	MeterTablePushConfigurationCommand,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	MeterTableMonitorCCValues,
	meterTableDatasets,
} from "./MeterTableMonitorCC.js";

const CONFIG_FIELDS = [
	"operatingStatusPushMode",
	"pushStatus",
	"pushDataset",
	"intervalMonths",
	"intervalDays",
	"intervalHours",
	"intervalMinutes",
	"pushNodeId",
] as const;

function parseConfiguration(raw: CCRaw): MeterTablePushConfiguration {
	validatePayload(raw.payload.length >= 9);
	const payload = Bytes.view(raw.payload);
	return {
		operatingStatusPushMode: payload[0] & 0b0000_1111,
		pushStatus: !!(payload[0] & 0b0001_0000),
		pushDataset: payload.readUIntBE(1, 3),
		intervalMonths: payload[4],
		intervalDays: payload[5],
		intervalHours: payload[6],
		intervalMinutes: payload[7],
		pushNodeId: payload[8],
	};
}

function encodeConfiguration(config: MeterTablePushConfiguration): Bytes {
	const inRange = (value: number, max: number) =>
		Number.isInteger(value) && value >= 0 && value <= max;
	if (
		!inRange(config.operatingStatusPushMode, 0b1111)
		|| !inRange(config.pushDataset, 0xff_ffff)
		|| !inRange(config.intervalMonths, 0xff)
		|| !inRange(config.intervalDays, 0xff)
		|| !inRange(config.intervalHours, 0xff)
		|| !inRange(config.intervalMinutes, 0xff)
		|| !inRange(config.pushNodeId, 0xff)
	) {
		throw new ZWaveError(
			`The push configuration has a value out of range: the push mode is 0-15, the datasets are 24 bits, the interval parts and the node ID are 0-255`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	const ret = new Bytes(9);
	ret[0] =
		(config.pushStatus ? 0b0001_0000 : 0)
		| (config.operatingStatusPushMode & 0b0000_1111);
	ret.writeUIntBE(config.pushDataset, 1, 3);
	ret[4] = config.intervalMonths;
	ret[5] = config.intervalDays;
	ret[6] = config.intervalHours;
	ret[7] = config.intervalMinutes;
	ret[8] = config.pushNodeId;
	return ret;
}

function configurationToLog(
	config: MeterTablePushConfiguration,
): Record<string, string | number | boolean> {
	return {
		"operating status push mode": config.operatingStatusPushMode,
		"push status (PS)": config.pushStatus,
		"push datasets":
			meterTableDatasets(config.pushDataset).join(", ") || "none",
		interval: `${config.intervalMonths} months, ${config.intervalDays} days, ${config.intervalHours} hours, ${config.intervalMinutes} minutes`,
		"push node ID": config.pushNodeId,
	};
}

@API(CommandClasses["Meter Table Push Configuration"])
export class MeterTablePushConfigurationCCAPI extends CCAPI {
	public supportsCommand(
		cmd: MeterTablePushConfigurationCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case MeterTablePushConfigurationCommand.Get:
				return this.isSinglecast();
			case MeterTablePushConfigurationCommand.Set:
				return true; // This is mandatory
		}
		return super.supportsCommand(cmd);
	}

	public async get(): Promise<MaybeNotKnown<MeterTablePushConfiguration>> {
		this.assertSupportsCommand(
			MeterTablePushConfigurationCommand,
			MeterTablePushConfigurationCommand.Get,
		);

		const cc = new MeterTablePushConfigurationCCGet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});
		const response =
			await this.host.sendCommand<MeterTablePushConfigurationCCReport>(
				cc,
				this.commandOptions,
			);
		if (response) return pick(response, [...CONFIG_FIELDS]);
	}

	@validateArgs()
	public async set(
		config: MeterTablePushConfiguration,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			MeterTablePushConfigurationCommand,
			MeterTablePushConfigurationCommand.Set,
		);

		const cc = new MeterTablePushConfigurationCCSet({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			...config,
		});
		return this.host.sendCommand(cc, this.commandOptions);
	}
}

@commandClass(CommandClasses["Meter Table Push Configuration"])
@implementedVersion(1)
export class MeterTablePushConfigurationCC extends CommandClass {
	declare ccCommand: MeterTablePushConfigurationCommand;

	public determineRequiredCCInterviews(): readonly CommandClasses[] {
		// The supported datasets come from the Meter Table Monitor interview
		return [
			...super.determineRequiredCCInterviews(),
			CommandClasses["Meter Table Monitor"],
		];
	}

	public async interview(ctx: InterviewContext): Promise<void> {
		const node = this.getNode(ctx)!;
		const endpoint = this.getEndpoint(ctx)!;
		const api = CCAPI.create(
			CommandClasses["Meter Table Push Configuration"],
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
			message: "querying push configuration...",
			direction: "outbound",
		});
		const config = await api.get();
		if (!config) {
			ctx.logNode(node.id, {
				endpoint: this.endpointIndex,
				message:
					"Querying the push configuration timed out, skipping interview...",
				level: "warn",
			});
			return;
		}

		// Nothing polls these values, so without pushes they are only
		// updated on a manual refresh. The PS flag is left as it is.
		const pushes = config.pushDataset !== 0;
		const target = config.pushNodeId;
		if (!pushes) {
			const supportedDatasets: number | undefined = this.getValue(
				ctx,
				MeterTableMonitorCCValues.supportedDatasets,
			);
			if (supportedDatasets) {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: `the meter does not push its readings, switching that on towards node ${ctx.ownNodeId}...`,
					direction: "outbound",
				});
				await this.setAndVerify(ctx, api, {
					...config,
					pushDataset: supportedDatasets,
					pushNodeId: ctx.ownNodeId,
				});
			} else {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message:
						"the meter does not push its readings, and this endpoint has no known Meter Table Monitor datasets. Values are only updated on a manual refresh.",
					level: "warn",
				});
			}
		} else if (target !== ctx.ownNodeId) {
			if (target === 0 || !ctx.getNode(target)) {
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: `readings are pushed to node ${target}, which is not in the network, changing that to ${ctx.ownNodeId}...`,
					direction: "outbound",
				});
				await this.setAndVerify(ctx, api, {
					...config,
					pushNodeId: ctx.ownNodeId,
				});
			} else {
				// For example a second gateway
				ctx.logNode(node.id, {
					endpoint: this.endpointIndex,
					message: `readings are pushed to node ${target}, leaving that as is. Values are only updated on a manual refresh.`,
					level: "warn",
				});
			}
		}

		// Remember that the interview is complete
		this.setInterviewComplete(ctx, true);
	}

	/** Sets the push configuration and warns if the meter did not take it */
	private async setAndVerify(
		ctx: InterviewContext,
		api: MeterTablePushConfigurationCCAPI,
		config: MeterTablePushConfiguration,
	): Promise<void> {
		const result = await api.set(config);
		if (result?.status === SupervisionStatus.Working) {
			// The meter is still applying it, read it back once it is done
			const remaining = result.remainingDuration?.toMilliseconds();
			if (remaining == undefined || remaining > 10000) {
				ctx.logNode(this.nodeId as number, {
					endpoint: this.endpointIndex,
					message:
						"the meter is still applying the push configuration, it was not verified",
					level: "warn",
				});
				return;
			}
			await wait(remaining + 500, true);
		} else if (!isUnsupervisedOrSucceeded(result)) {
			ctx.logNode(this.nodeId as number, {
				endpoint: this.endpointIndex,
				message: "the meter did not accept the push configuration",
				level: "warn",
			});
			return;
		}
		const accepted = await api.get();
		if (!accepted) {
			ctx.logNode(this.nodeId as number, {
				endpoint: this.endpointIndex,
				message:
					"could not read the push configuration back, it may not have been changed",
				level: "warn",
			});
		} else if (
			accepted.pushNodeId !== config.pushNodeId
			|| accepted.pushDataset !== config.pushDataset
			|| accepted.intervalMonths !== config.intervalMonths
			|| accepted.intervalDays !== config.intervalDays
			|| accepted.intervalHours !== config.intervalHours
			|| accepted.intervalMinutes !== config.intervalMinutes
		) {
			ctx.logNode(this.nodeId as number, {
				endpoint: this.endpointIndex,
				message: `the meter did not accept the change, it pushes datasets ${num2hex(accepted.pushDataset)} to node ${accepted.pushNodeId} every ${accepted.intervalMonths} months, ${accepted.intervalDays} days, ${accepted.intervalHours} hours, ${accepted.intervalMinutes} minutes`,
				level: "warn",
			});
		}
	}
}

// @publicAPI
export type MeterTablePushConfigurationCCReportOptions =
	MeterTablePushConfiguration;

@CCCommand(MeterTablePushConfigurationCommand.Report)
export class MeterTablePushConfigurationCCReport
	extends MeterTablePushConfigurationCC
	implements MeterTablePushConfiguration
{
	public constructor(
		options: WithAddress<MeterTablePushConfigurationCCReportOptions>,
	) {
		super(options);
		this.operatingStatusPushMode = options.operatingStatusPushMode;
		this.pushStatus = options.pushStatus;
		this.pushDataset = options.pushDataset;
		this.intervalMonths = options.intervalMonths;
		this.intervalDays = options.intervalDays;
		this.intervalHours = options.intervalHours;
		this.intervalMinutes = options.intervalMinutes;
		this.pushNodeId = options.pushNodeId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTablePushConfigurationCCReport {
		return new this({
			nodeId: ctx.sourceNodeId,
			...parseConfiguration(raw),
		});
	}

	public readonly operatingStatusPushMode: number;
	public readonly pushStatus: boolean;
	public readonly pushDataset: number;
	public readonly intervalMonths: number;
	public readonly intervalDays: number;
	public readonly intervalHours: number;
	public readonly intervalMinutes: number;
	public readonly pushNodeId: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeConfiguration(this);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: configurationToLog(this),
		};
	}
}

@CCCommand(MeterTablePushConfigurationCommand.Get)
@expectedCCResponse(MeterTablePushConfigurationCCReport)
export class MeterTablePushConfigurationCCGet extends MeterTablePushConfigurationCC {}

// @publicAPI
export type MeterTablePushConfigurationCCSetOptions =
	MeterTablePushConfiguration;

@CCCommand(MeterTablePushConfigurationCommand.Set)
@useSupervision()
export class MeterTablePushConfigurationCCSet
	extends MeterTablePushConfigurationCC
	implements MeterTablePushConfiguration
{
	public constructor(
		options: WithAddress<MeterTablePushConfigurationCCSetOptions>,
	) {
		super(options);
		this.operatingStatusPushMode = options.operatingStatusPushMode;
		this.pushStatus = options.pushStatus;
		this.pushDataset = options.pushDataset;
		this.intervalMonths = options.intervalMonths;
		this.intervalDays = options.intervalDays;
		this.intervalHours = options.intervalHours;
		this.intervalMinutes = options.intervalMinutes;
		this.pushNodeId = options.pushNodeId;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): MeterTablePushConfigurationCCSet {
		return new this({
			nodeId: ctx.sourceNodeId,
			...parseConfiguration(raw),
		});
	}

	public operatingStatusPushMode: number;
	public pushStatus: boolean;
	public pushDataset: number;
	public intervalMonths: number;
	public intervalDays: number;
	public intervalHours: number;
	public intervalMinutes: number;
	public pushNodeId: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = encodeConfiguration(this);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: configurationToLog(this),
		};
	}
}
