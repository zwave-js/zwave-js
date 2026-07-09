import type { Timer } from "@zwave-js/shared";

export interface AwaitedThing<T> {
	handler: (thing: T) => void;
	timeout?: Timer;
	predicate: (msg: T) => boolean;
	refreshPredicate?: (msg: T) => boolean;
}
