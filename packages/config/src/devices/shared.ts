export interface FirmwareVersionRange {
	min: string;
	max: string;
}

export interface DeviceID {
	manufacturerId: number;
	productType: number;
	productId: number;
	firmwareVersion?: string;
	sdkVersion?: string;
}

/** The context that `$if` conditions in config files are evaluated against */
export interface ConditionalConfigContext extends DeviceID {
	/**
	 * Returns the cached value of a config parameter, or `undefined` if it is not known.
	 * Comparisons involving unknown parameter values evaluate as if they didn't exist.
	 */
	getCachedParamValue?: (
		endpoint: number,
		parameter: number,
		bitMask?: number,
	) => number | undefined;

	/** @internal The endpoint scope param references are resolved against during evaluation */
	endpoint?: number;
}
