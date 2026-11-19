import { Bytes, type BytesView } from "@zwave-js/shared";
import { test } from "vitest";

import { ZWaveSerialMode } from "../serialport/definitions.js";

import { SerialModeSwitch } from "./SerialModeSwitch.js";

function collect(stream: ReadableStream<BytesView>): { data: string } {
	const ret = { data: "" };
	void (async () => {
		for await (const chunk of stream) {
			ret.data += Bytes.view(chunk).toString("ascii");
		}
	})();
	return ret;
}

async function feed(chunks: string[]) {
	const sw = new SerialModeSwitch();
	const outputs = {
		serialAPI: collect(sw.toSerialAPI),
		bootloader: collect(sw.toBootloader),
		cli: collect(sw.toCLI),
	};
	const writer = sw.getWriter();
	for (const chunk of chunks) {
		await writer.write(Bytes.from(chunk, "ascii"));
	}
	// Let the collectors pick up the last chunk
	await new Promise((resolve) => setTimeout(resolve, 0));
	return {
		mode: sw.mode,
		serialAPI: outputs.serialAPI.data,
		bootloader: outputs.bootloader.data,
		cli: outputs.cli.data,
	};
}

const bootloaderMenu =
	"Gecko Bootloader v3.00.01\r\n1. upload gbl\r\n2. run\r\n3. ebl info\r\n4. erase nvm\r\nBL > ";

test("detects the bootloader when its menu arrives in one chunk", async ({
	expect,
}) => {
	const result = await feed(["\r\n" + bootloaderMenu]);
	expect(result).toStrictEqual({
		mode: ZWaveSerialMode.Bootloader,
		serialAPI: "",
		bootloader: "\r\n" + bootloaderMenu,
		cli: "",
	});
});

test("detects the bootloader when a line break arrives in a chunk of its own", async ({
	expect,
}) => {
	const result = await feed(["\r", "\n" + bootloaderMenu]);
	expect(result).toStrictEqual({
		mode: ZWaveSerialMode.Bootloader,
		serialAPI: "",
		bootloader: "\r\n" + bootloaderMenu,
		cli: "",
	});
});

test("detects the CLI when its prompt follows a chunk with only whitespace", async ({
	expect,
}) => {
	const result = await feed(["\r\n", "> "]);
	expect(result).toStrictEqual({
		mode: ZWaveSerialMode.CLI,
		serialAPI: "",
		bootloader: "",
		cli: "\r\n> ",
	});
});

test("detects the Serial API from a single ACK", async ({ expect }) => {
	const result = await feed(["\x06"]);
	expect(result).toStrictEqual({
		mode: ZWaveSerialMode.SerialAPI,
		serialAPI: "\x06",
		bootloader: "",
		cli: "",
	});
});
