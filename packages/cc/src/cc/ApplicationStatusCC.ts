import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import {
	CommandClasses,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	type MessageRecord,
	validatePayload,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	commandClass,
	implementedVersion,
} from "../lib/CommandClassDecorators.js";
import { ApplicationStatus, ApplicationStatusCommand } from "../lib/_Types.js";

@API(CommandClasses["Application Status"])
export class ApplicationStatusCCAPI extends CCAPI {
	public supportsCommand(
		cmd: ApplicationStatusCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case ApplicationStatusCommand.Busy:
			case ApplicationStatusCommand.RejectedRequest:
				return true; // These are receive-only commands
		}
		return super.supportsCommand(cmd);
	}
}

@commandClass(CommandClasses["Application Status"])
@implementedVersion(1)
export class ApplicationStatusCC extends CommandClass {
	declare ccCommand: ApplicationStatusCommand;
	declare nodeId: number;
}

// @publicAPI
export interface ApplicationStatusCCBusyOptions {
	status: ApplicationStatus;
	waitTime: number;
}

@CCCommand(ApplicationStatusCommand.Busy)
export class ApplicationStatusCCBusy extends ApplicationStatusCC {
	public constructor(
		options: ApplicationStatusCCBusyOptions & { nodeId: number },
	) {
		super(options);
		this.status = options.status;
		this.waitTime = options.waitTime;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ApplicationStatusCCBusy {
		validatePayload(raw.payload.length >= 2);
		const status: ApplicationStatus = raw.payload[0];
		const waitTime: number = raw.payload[1];

		return new this({
			nodeId: ctx.sourceNodeId,
			status,
			waitTime,
		});
	}

	public readonly status: ApplicationStatus;
	public readonly waitTime: number;

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.status, this.waitTime]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const message: MessageRecord = {
			status: getEnumMemberName(ApplicationStatus, this.status),
		};
		if (
			this.status === ApplicationStatus.TryAgainInWaitTimeSeconds
		) {
			message["wait time"] = `${this.waitTime} seconds`;
		}
		return {
			...super.toLogEntry(),
			message,
		};
	}
}

// @publicAPI
export interface ApplicationStatusCCRejectedRequestOptions {
	status: number;
}

@CCCommand(ApplicationStatusCommand.RejectedRequest)
export class ApplicationStatusCCRejectedRequest extends ApplicationStatusCC {
	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ApplicationStatusCCRejectedRequest {
		validatePayload(raw.payload.length >= 1);
		const status: number = raw.payload[0];
		// This field MUST be set to 0
		validatePayload(status === 0);

		return new this({
			nodeId: ctx.sourceNodeId,
		});
	}

	public serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([0x00]);
		return super.serialize(ctx);
	}
}
