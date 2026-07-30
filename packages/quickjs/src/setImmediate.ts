import { setImmediate as scheduleImmediate } from "@zwave-js/shared";

// @zwave-js/waddle drives its task steps through the global setImmediate, which txiki.js
// does not provide. @zwave-js/shared initializes before this module, so its own scheduler
// has already picked the MessageChannel backend rather than recursing into this one.
globalThis.setImmediate ??= ((
	callback: (...args: any[]) => void,
	...args: any[]
) => scheduleImmediate(
	callback,
	...args,
)) as unknown as typeof globalThis.setImmediate;
