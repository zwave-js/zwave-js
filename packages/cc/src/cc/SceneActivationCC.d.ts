import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { SceneActivationCommand } from "../lib/_Types.js";
export declare const SceneActivationCCValues: Readonly<{
    sceneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly property: "sceneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly endpoint: number;
            readonly property: "sceneId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly label: "Scene ID";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    dimmingDuration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly property: "dimmingDuration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Activation"];
            readonly endpoint: number;
            readonly property: "dimmingDuration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Dimming duration";
            readonly type: "duration";
            readonly readable: true;
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
export declare class SceneActivationCCAPI extends CCAPI {
    supportsCommand(_cmd: SceneActivationCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    /**
     * Activates the Scene with the given ID
     * @param duration The duration specifying how long the transition should take. Can be a Duration instance or a user-friendly duration string like `"1m17s"`.
     */
    set(sceneId: number, dimmingDuration?: Duration | string): Promise<SupervisionResult | undefined>;
}
export declare class SceneActivationCC extends CommandClass {
    ccCommand: SceneActivationCommand;
}
export interface SceneActivationCCSetOptions {
    sceneId: number;
    dimmingDuration?: Duration | string;
}
export declare class SceneActivationCCSet extends SceneActivationCC {
    constructor(options: WithAddress<SceneActivationCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SceneActivationCCSet;
    sceneId: number;
    dimmingDuration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=SceneActivationCC.d.ts.map