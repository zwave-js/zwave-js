import { createReadStream } from "node:fs";
import type { UnderlyingSource } from "node:stream/web";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
	ClassifyLogEntry,
	CompleteLogEntries,
	FilterLogEntries,
	ParseNestedStructures,
	UnformatLogEntry,
} from "./lib/unfmt.js";

const argv = yargs(hideBin(process.argv)).parseSync();
const [filename] = argv._.map(String);

if (!filename) {
	console.error("Usage: cli <filename>");
	process.exit(1);
}

const rs = createReadStream(filename, {
	encoding: "utf8",
});
const source: UnderlyingSource<string> = {
	start(controller) {
		rs.on("data", (chunk: any) => {
			controller.enqueue(chunk);
		});
		rs.on("end", () => {
			controller.close();
		});
		rs.on("error", (err) => {
			controller.error(err);
		});
	},
	cancel() {
		rs.removeAllListeners();
		rs.destroy();
	},
};
const readable = new ReadableStream<string>(source);

const parser = new CompleteLogEntries();
const unfmt = new UnformatLogEntry();
const filter = new FilterLogEntries();
const parseNested = new ParseNestedStructures();
const classify = new ClassifyLogEntry();

const iter = readable
	.pipeThrough(parser)
	.pipeThrough(unfmt)
	.pipeThrough(parseNested)
	.pipeThrough(filter)
	.pipeThrough(classify)
	// TODO: Group related entries somehow
	.values();

for await (const chunk of iter) {
	console.dir(chunk, { depth: Infinity });
}
