import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import path from "pathe";

/** Returns the absolute path of the embedded configuration directory */
export function getConfigDir(): string {
	// Only defined when this module was loaded from a file: URL, so bundled
	// applications and runtimes without it have to set the option instead
	if (import.meta.dirname) {
		// This module sits in src/ when running from source and in build/ otherwise,
		// so the package root is one level up either way
		return path.join(import.meta.dirname, "..", "config");
	}

	throw new ZWaveError(
		"On this runtime, the location of the configuration files embedded in @zwave-js/config must be set using the deviceConfigEmbeddedDir option",
		ZWaveErrorCodes.Driver_InvalidOptions,
	);
}
