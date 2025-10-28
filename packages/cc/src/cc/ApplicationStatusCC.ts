import type { CCParsingContext } from "@zwave-js/cc";
import {
	type MessageOrCCLogEntry,
	type MessageRecord,
	type MaybeNotKnown,
	CommandClasses,
	validatePayload,
} from "@zwave-js/core";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	commandClass,
	implementedVersion,
} from "../lib/CommandClassDecorators.js";
import {
	ApplicationStatusCommand,
	ApplicationStatusStatus,
} from "../lib/_Types.js";

// @noInterview: This CC has no interview procedure
// @noSetValueAPI: This CC does not support setting values

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
}

// @publicAPI
export interface ApplicationStatusCCBusyOptions {
	status: ApplicationStatusStatus;
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
		const status: ApplicationStatusStatus = raw.payload[0];
		const waitTime: number = raw.payload[1];

		return new this({
			nodeId: ctx.sourceNodeId,
			status,
			waitTime,
		});
	}

	public readonly status: ApplicationStatusStatus;
	public readonly waitTime: number;

	public toLogEntry(): MessageOrCCLogEntry {
		const message: MessageRecord = {
			status: ApplicationStatusStatus[this.status],
		};
		if (
			this.status === ApplicationStatusStatus.TryAgainInWaitTimeSeconds
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
	public constructor(
		options: ApplicationStatusCCRejectedRequestOptions & { nodeId: number },
	) {
		super(options);
		this.status = options.status;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): ApplicationStatusCCRejectedRequest {
		validatePayload(raw.payload.length >= 1);
		const status: number = raw.payload[0];

		return new this({
			nodeId: ctx.sourceNodeId,
			status,
		});
	}

	public readonly status: number;

	public toLogEntry(): MessageOrCCLogEntry {
		const message: MessageRecord = {
			status: this.status,
		};
		return {
			...super.toLogEntry(),
			message,
		};
	}
}
