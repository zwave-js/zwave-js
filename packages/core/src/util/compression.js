import { deflateSync as defflateSync, gunzipSync as fgunzipSync, inflateSync as infflateSync, } from "fflate";
export function deflateSync(data, opts) {
    return defflateSync(data, opts);
}
export function inflateSync(data, opts) {
    return infflateSync(data, opts);
}
export function gunzipSync(data) {
    return fgunzipSync(data);
}
//# sourceMappingURL=compression.js.map