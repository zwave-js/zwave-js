import type { LogFactory } from "../../log/shared.js";

export const log: LogFactory = () => {
	throw new Error(
		"The default log bindings are not available on this platform",
	);
};
