import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";

function parseCommandList(output: string): [string, string][] {
	const commands: [string, string][] = [];
	for (const line of output.trim().split("\n")) {
		const match = line.match(
			/^\s*([A-Za-z][A-Za-z0-9_]*)\s{2,}(.*?)\s*$/,
		);
		if (match) {
			commands.push([match[1], match[2]]);
		} else if (commands.length > 0) {
			// Continuation line — append to the previous command's description
			let trimmed = line.trim();
			if (trimmed) {
				// "[" indicates an argument description
				if (trimmed.startsWith("[")) trimmed = " " + trimmed;
				commands.at(-1)![1] += trimmed;
			}
		}
	}
	return commands;
}

/** Encapsulates information about the currently active bootloader */
export class EndDeviceCLI {
	public constructor(
		writeSerial: (data: BytesView) => Promise<void>,
		expectMessage: (timeoutMs?: number) => Promise<string | undefined>,
	) {
		this.writeSerial = writeSerial;
		this.expectMessage = expectMessage;
		this._commands = new Map();
	}

	public readonly writeSerial: (data: BytesView) => Promise<void>;
	public readonly expectMessage: () => Promise<string | undefined>;

	private _commands: Map<string, string>;
	public get commands(): ReadonlyMap<string, string> {
		return this._commands;
	}

	public async executeCommand(command: string): Promise<string | undefined> {
		const normalizedCommand = command.trim();
		const commandName = normalizedCommand.split(/\s+/, 1)[0];
		if (!this.commands.has(commandName)) {
			throw new ZWaveError(
				`Unknown CLI command ${normalizedCommand}`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		const response = this.expectMessage();
		await this.writeSerial(Bytes.from(normalizedCommand + "\r\n", "ascii"));
		let ret = await response;
		if (!ret) return;

		// Successful commands echo the command itself, followed by a line break
		if (ret.startsWith(normalizedCommand + "\r\n")) {
			ret = ret.slice(normalizedCommand.length + 2);
		}
		ret = ret.trim();
		// Most commands prefix their response with the log level, usually "[I] "
		ret = ret.replace(/^\[[A-Z]\] /, "");
		return ret;
	}

	public async detectCommands(): Promise<void> {
		const response = this.expectMessage();
		await this.writeSerial(Bytes.from("help\r\n", "ascii"));
		const commandList = await response;
		if (!commandList) {
			throw new ZWaveError(
				"Failed to detect CLI commands",
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		this._commands = new Map(parseCommandList(commandList));
	}
}
