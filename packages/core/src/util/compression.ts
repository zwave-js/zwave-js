import {
	type DeflateOptions,
	type InflateOptions,
	deflateSync as defflateSync,
	gunzipSync as fgunzipSync,
	inflateSync as infflateSync,
} from "fflate";

export function deflateSync(
	data: Uint8Array,
	opts?: DeflateOptions,
): Uint8Array {
	return defflateSync(data, opts);
}

export function inflateSync(
	data: Uint8Array,
	opts?: InflateOptions,
): Uint8Array {
	return infflateSync(data, opts);
}

export function gunzipSync(data: Uint8Array): Uint8Array {
	return fgunzipSync(data);
}
