// @ts-check

const { execFileSync } = require("node:child_process");
const {
	closeSync,
	createReadStream,
	createWriteStream,
	mkdtempSync,
	openSync,
	readdirSync,
	readSync,
	renameSync,
	rmSync,
	statSync,
} = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { pipeline } = require("node:stream/promises");
const { createGunzip } = require("node:zlib");
const {
	compressedUploadKind,
	pickLogfileFromArchive,
} = require("./utils.cjs");

const MAX_ARCHIVE_SIZE = 250 * 1024 * 1024;

/**
 * @param {string} path
 */
function readMagicBytes(path) {
	const header = new Uint8Array(4);
	const fd = openSync(path, "r");
	try {
		readSync(fd, header);
	} finally {
		closeSync(fd);
	}
	return header;
}

/**
 * Replaces a downloaded logfile archive with the plain logfile it contains, so
 * the analysis agent never unpacks it itself - archive members are commonly
 * named with timestamps containing colons, which the run's artifact upload
 * rejects and thereby fails the whole workflow.
 */
async function main() {
	const path = process.env.LOGFILE_PATH;
	if (!path) throw new Error("LOGFILE_PATH is not set");

	const kind = compressedUploadKind(readMagicBytes(path));
	if (!kind) return;

	const size = statSync(path).size;
	if (size > MAX_ARCHIVE_SIZE) {
		throw new Error(
			`Compressed logfile uploads are limited to ${
				MAX_ARCHIVE_SIZE / 1024 / 1024
			} MB, this one is ${Math.ceil(size / 1024 / 1024)} MB`,
		);
	}

	// Extract outside of /tmp/gh-aw so the original member names never reach
	// an artifact
	const dir = mkdtempSync(join(tmpdir(), "zwave-logfile-"));
	try {
		if (kind === "gzip") {
			const extracted = join(dir, "logfile.log");
			// Stream, because the decompressed log can exceed Node's buffer limit
			await pipeline(
				createReadStream(path),
				createGunzip(),
				createWriteStream(extracted),
			);
			renameSync(extracted, path);
			console.log("Decompressed the gzipped logfile");
			return;
		}

		// Let unzip resolve the member names instead of matching a pattern,
		// which would trip over glob characters in the name
		execFileSync("unzip", ["-q", "-o", "-d", dir, path]);
		const names = readdirSync(dir, { recursive: true, encoding: "utf8" });
		const name = pickLogfileFromArchive(names);
		if (!name) {
			throw new Error(
				`Could not identify a single logfile in the archive. It contains: ${
					names.join(", ")
				}`,
			);
		}
		renameSync(join(dir, name), path);
		console.log(`Extracted ${name} from the downloaded archive`);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

if (require.main === module) {
	main().catch((e) => {
		console.error(e.message);
		process.exitCode = 1;
	});
}

module.exports = main;
