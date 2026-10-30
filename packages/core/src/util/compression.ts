import { Bytes, type BytesView } from "@zwave-js/shared";
import {
	type DeflateOptions,
	Gunzip,
	type InflateOptions,
	deflateSync as defflateSync,
	inflateSync as infflateSync,
} from "fflate";

export function deflateSync(data: BytesView, opts?: DeflateOptions): BytesView {
	return defflateSync(data, opts);
}

export function inflateSync(data: BytesView, opts?: InflateOptions): BytesView {
	return infflateSync(data, opts) as BytesView;
}

/**
 * Decompresses gzipped data. If `maxOutputLength` is given, decompression is aborted
 * with an error as soon as the output exceeds that length.
 */
export function gunzipSync(
	data: BytesView,
	maxOutputLength: number = Number.POSITIVE_INFINITY,
): BytesView {
	// fflate's gunzipSync allocates the output based on the size in the trailer, so truncated input
	// can make it allocate gigabytes. The streaming decompressor avoids that, but silently accepts
	// empty or truncated input, so check the minimum size (header + trailer)...
	if (data.length < 18) {
		throw new Error("Invalid gzip data");
	}

	const chunks: Uint8Array[] = [];
	let outputLength = 0;

	// ...and that each member's output size matches the one stored in its trailer (modulo 2^32)
	const view = Bytes.view(data);
	let memberOutputStart = 0;
	const checkMemberLength = (memberEnd: number) => {
		const expectedLength = view.readUInt32LE(memberEnd - 4);
		if (
			(outputLength - memberOutputStart) % 0x1_0000_0000
			!== expectedLength
		) {
			throw new Error("Invalid or truncated gzip data");
		}
		memberOutputStart = outputLength;
	};

	const gunzip = new Gunzip((chunk) => {
		outputLength += chunk.length;
		if (outputLength > maxOutputLength) {
			throw new Error(
				`Decompressed data exceeds the maximum length of ${maxOutputLength} bytes`,
			);
		}
		chunks.push(chunk);
	});
	// The output of the previous member has been passed to the callback at this point
	gunzip.onmember = checkMemberLength;
	// Each push is fully decompressed before the callback is called, so feeding small
	// input chunks limits how much memory a highly compressed input can allocate at once
	const inputChunkSize = 16 * 1024;
	let offset = 0;
	do {
		const end = offset + inputChunkSize;
		gunzip.push(data.subarray(offset, end), end >= data.length);
		offset = end;
	} while (offset < data.length);

	checkMemberLength(data.length);

	return Bytes.concat(chunks);
}
