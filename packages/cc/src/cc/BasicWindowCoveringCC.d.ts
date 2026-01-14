import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { BasicWindowCoveringCommand, type LevelChangeDirection } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";
export declare const BasicWindowCoveringCCValues: Readonly<{
    levelChangeUp: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly property: "levelChangeUp";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeUp";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Open";
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    levelChangeDown: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly property: "levelChangeDown";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Basic Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeDown";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Close";
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class BasicWindowCoveringCCAPI extends CCAPI {
    supportsCommand(cmd: BasicWindowCoveringCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    startLevelChange(direction: keyof typeof LevelChangeDirection): Promise<SupervisionResult | undefined>;
    stopLevelChange(): Promise<SupervisionResult | undefined>;
}
export declare class BasicWindowCoveringCC extends CommandClass {
    ccCommand: BasicWindowCoveringCommand;
}
export interface BasicWindowCoveringCCStartLevelChangeOptions {
    direction: keyof typeof LevelChangeDirection;
}
export declare class BasicWindowCoveringCCStartLevelChange extends BasicWindowCoveringCC {
    constructor(options: WithAddress<BasicWindowCoveringCCStartLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BasicWindowCoveringCCStartLevelChange;
    direction: keyof typeof LevelChangeDirection;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BasicWindowCoveringCCStopLevelChange extends BasicWindowCoveringCC {
}
//# sourceMappingURL=BasicWindowCoveringCC.d.ts.map