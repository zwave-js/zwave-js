import { fileHandleToReadableStream, fileHandleToWritableStream, } from "@zwave-js/shared";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
/** An implementation of the FileSystem bindings for Node.js */
export const fs = {
    readDir(path) {
        return fsp.readdir(path);
    },
    readFile(path) {
        return fsp.readFile(path);
    },
    writeFile(path, data) {
        return fsp.writeFile(path, data);
    },
    copyFile(source, dest) {
        return fsp.copyFile(source, dest);
    },
    async ensureDir(path) {
        await fsp.mkdir(path, { recursive: true });
    },
    deleteDir(path) {
        return fsp.rm(path, { recursive: true, force: true });
    },
    stat(path) {
        return fsp.stat(path);
    },
    async open(path, flags) {
        let mode = "";
        if (!flags.truncate && !flags.read) {
            throw new Error("Cannot open a file writeonly without truncating it");
        }
        if (!flags.write && flags.create) {
            throw new Error("Cannot open a file readonly with create flag");
        }
        // FIXME: Figure out what the correct behavior is for each combination of flags
        if (flags.read && !flags.write) {
            mode = "r";
        }
        else if (flags.read && flags.write && !flags.create) {
            mode = "r+";
        }
        else if (flags.write && flags.create && flags.truncate) {
            mode = flags.read ? "w+" : "w";
        }
        return new NodeFileHandle(await fsp.open(path, mode), {
            read: flags.read,
            write: flags.write,
        });
    },
    async makeTempDir(prefix) {
        return fsp.mkdtemp(path.join(os.tmpdir(), prefix));
    },
};
export class NodeFileHandle {
    constructor(handle, flags) {
        this.open = true;
        this.handle = handle;
        this.flags = flags;
    }
    open;
    handle;
    flags;
    _readable;
    _writable;
    get readable() {
        if (!this.flags.read) {
            throw new Error("File is not readable");
        }
        if (!this._readable) {
            this._readable = fileHandleToReadableStream(this);
        }
        return this._readable;
    }
    get writable() {
        if (!this.flags.write) {
            throw new Error("File is not writable");
        }
        if (!this._writable) {
            this._writable = fileHandleToWritableStream(this);
        }
        return this._writable;
    }
    async close() {
        if (!this.open)
            return;
        this.open = false;
        await this.handle.close();
    }
    async read(position, length) {
        if (!this.open)
            throw new Error("File is not open");
        const ret = await this.handle.read({
            position,
            length,
        });
        return {
            data: ret.buffer.subarray(0, ret.bytesRead),
            bytesRead: ret.bytesRead,
        };
    }
    async write(data, position) {
        if (!this.open)
            throw new Error("File is not open");
        const ret = await this.handle.write(data, null, null, position);
        return {
            bytesWritten: ret.bytesWritten,
        };
    }
    stat() {
        if (!this.open)
            throw new Error("File is not open");
        return this.handle.stat();
    }
}
//# sourceMappingURL=node.js.map