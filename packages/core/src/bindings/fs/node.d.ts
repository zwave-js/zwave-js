import type { FSStats, FileHandle, FileSystem } from "@zwave-js/shared/bindings";
import fsp from "node:fs/promises";
/** An implementation of the FileSystem bindings for Node.js */
export declare const fs: FileSystem;
export declare class NodeFileHandle implements FileHandle {
    constructor(handle: fsp.FileHandle, flags: {
        read: boolean;
        write: boolean;
    });
    private open;
    private handle;
    private flags;
    private _readable?;
    private _writable?;
    get readable(): ReadableStream<Uint8Array>;
    get writable(): WritableStream<Uint8Array>;
    close(): Promise<void>;
    read(position?: number | null, length?: number): Promise<{
        data: Uint8Array;
        bytesRead: number;
    }>;
    write(data: Uint8Array, position?: number | null): Promise<{
        bytesWritten: number;
    }>;
    stat(): Promise<FSStats>;
}
//# sourceMappingURL=node.d.ts.map