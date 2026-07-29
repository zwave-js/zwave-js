import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";

/** Returns the absolute path of the embedded configuration directory */
export function getConfigDir(): string {
	throw new ZWaveError(
		"On this runtime, the location of the configuration files embedded in @zwave-js/config must be set using the deviceConfigEmbeddedDir option",
		ZWaveErrorCodes.Driver_InvalidOptions,
	);
}
