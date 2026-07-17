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

	/** @internal Derived from getCachedParamValue with the current endpoint scope baked in */
	getScopedParamValue?: (
		parameter: number,
		bitMask?: number,
	) => number | undefined;
}

/** Returns a copy of the context where param references resolve against the given endpoint */
export function scopeContextToEndpoint(
	context: ConditionalConfigContext | undefined,
	endpoint: number,
): ConditionalConfigContext | undefined {
	if (!context?.getCachedParamValue) return context;
	const { getCachedParamValue } = context;
	return {
		...context,
		getScopedParamValue: (parameter, bitMask) =>
			getCachedParamValue(endpoint, parameter, bitMask),
	};
}
