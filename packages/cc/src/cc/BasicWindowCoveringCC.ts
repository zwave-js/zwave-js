import {
	CommandClasses,
	type GetValueDB,
	type MaybeNotKnown,
	type MessageOrCCLogEntry,
	type SupervisionResult,
	ValueMetadata,
	type WithAddress,
	validatePayload,
} from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import {
	CCAPI,
	SET_VALUE,
	type SetValueImplementation,
	throwUnsupportedProperty,
	throwWrongValueType,
} from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import {
	API,
	CCCommand,
	ccValues,
	commandClass,
	implementedVersion,
	useSupervision,
} from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import {
	BasicWindowCoveringCommand,
	type LevelChangeDirection,
} from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

export const BasicWindowCoveringCCValues = V.defineCCValues(
	CommandClasses["Basic Window Covering"],
	{
		...V.staticProperty(
			"levelChangeUp",
			{
				...ValueMetadata.WriteOnlyBoolean,
				label: "Open",
				states: {
					true: "Start",
					false: "Stop",
				},
			},
		),
		...V.staticProperty(
			"levelChangeDown",
			{
				...ValueMetadata.WriteOnlyBoolean,
				label: "Close",
				states: {
					true: "Start",
					false: "Stop",
				},
			},
		),
	},
);

@API(CommandClasses["Basic Window Covering"])
export class BasicWindowCoveringCCAPI extends CCAPI {
	public supportsCommand(
		cmd: BasicWindowCoveringCommand,
	): MaybeNotKnown<boolean> {
		switch (cmd) {
			case BasicWindowCoveringCommand.StartLevelChange:
			case BasicWindowCoveringCommand.StopLevelChange:
				return true; // This is mandatory
		}
		return super.supportsCommand(cmd);
	}

	protected override get [SET_VALUE](): SetValueImplementation {
		return async function(
			this: BasicWindowCoveringCCAPI,
			{ property },
			value,
		) {
			const valueId = {
				commandClass: this.ccId,
				property,
			};

			if (
				BasicWindowCoveringCCValues.levelChangeUp.is(valueId)
				|| BasicWindowCoveringCCValues.levelChangeDown.is(valueId)
			) {
				if (typeof value !== "boolean") {
					throwWrongValueType(
						this.ccId,
						property,
						"boolean",
						typeof value,
					);
				}

				if (value) {
					const direction = BasicWindowCoveringCCValues.levelChangeUp
							.is(valueId)
						? "up"
						: "down";
					return this.startLevelChange(direction);
				} else {
					return this.stopLevelChange();
				}
			} else {
				throwUnsupportedProperty(this.ccId, property);
			}
		};
	}

	@validateArgs({ strictEnums: true })
	public async startLevelChange(
		direction: keyof typeof LevelChangeDirection,
	): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			BasicWindowCoveringCommand,
			BasicWindowCoveringCommand.StartLevelChange,
		);

		const cc = new BasicWindowCoveringCCStartLevelChange({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
			direction,
		});

		return this.host.sendCommand(cc, this.commandOptions);
	}

	@validateArgs({ strictEnums: true })
	public async stopLevelChange(): Promise<SupervisionResult | undefined> {
		this.assertSupportsCommand(
			BasicWindowCoveringCommand,
			BasicWindowCoveringCommand.StopLevelChange,
		);

		const cc = new BasicWindowCoveringCCStopLevelChange({
			nodeId: this.endpoint.nodeId,
			endpointIndex: this.endpoint.index,
		});

		return this.host.sendCommand(cc, this.commandOptions);
	}
}

@commandClass(CommandClasses["Basic Window Covering"])
@implementedVersion(1)
@ccValues(BasicWindowCoveringCCValues)
export class BasicWindowCoveringCC extends CommandClass {
	declare ccCommand: BasicWindowCoveringCommand;
}

// @publicAPI
export interface BasicWindowCoveringCCStartLevelChangeOptions {
	direction: keyof typeof LevelChangeDirection;
}

@CCCommand(BasicWindowCoveringCommand.StartLevelChange)
@useSupervision()
export class BasicWindowCoveringCCStartLevelChange
	extends BasicWindowCoveringCC
{
	public constructor(
		options: WithAddress<BasicWindowCoveringCCStartLevelChangeOptions>,
	) {
		super(options);
		this.direction = options.direction;
	}

	public static from(
		raw: CCRaw,
		ctx: CCParsingContext,
	): BasicWindowCoveringCCStartLevelChange {
		// The CC is obsolete and will never be extended. Check for exact length
		validatePayload(raw.payload.length === 1);
		const direction = !!(raw.payload[0] & 0b0100_0000)
			? "down"
			: "up";

		return new this({
			nodeId: ctx.sourceNodeId,
			direction,
		});
	}

	public direction: keyof typeof LevelChangeDirection;

	public async serialize(ctx: CCEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([
			this.direction === "down" ? 0b0100_0000 : 0b0000_0000,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(ctx),
			message: {
				direction: this.direction,
			},
		};
	}
}

@CCCommand(BasicWindowCoveringCommand.StopLevelChange)
@useSupervision()
export class BasicWindowCoveringCCStopLevelChange
	extends BasicWindowCoveringCC
{}
