// @ts-check

const { execFileSync } = require("node:child_process");
const {
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { gunzipSync } = require("node:zlib");
const {
	compressedUploadKind,
	pickLogfileFromArchive,
} = require("./utils.cjs");

/**
 * Replaces a downloaded logfile archive with the plain logfile it contains, so
 * the analysis agent never unpacks it itself - archive members are commonly
 * named with timestamps containing colons, which the run's artifact upload
 * rejects and thereby fails the whole workflow.
 */
function main() {
	const path = process.env.LOGFILE_PATH;
	if (!path) throw new Error("LOGFILE_PATH is not set");

	const data = new Uint8Array(readFileSync(path));
	const kind = compressedUploadKind(data);
	if (!kind) return;

	if (kind === "gzip") {
		writeFileSync(path, gunzipSync(data));
		console.log("Decompressed the gzipped logfile");
		return;
	}

	// Extract outside of /tmp/gh-aw so the original member names never reach
	// an artifact, and let unzip resolve them instead of matching a pattern,
	// which would trip over glob characters in the name
	const dir = mkdtempSync(join(tmpdir(), "zwave-logfile-"));
	try {
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

if (require.main === module) main();

module.exports = main;
