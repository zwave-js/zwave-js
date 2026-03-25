import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type BytesView } from "@zwave-js/shared";

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
		const commands = commandList.trim()
			.split("\n")
			.map((line) => line.trim())
			.map((line) =>
				line.split(/\s+/, 2).map((part) => part.trim()) as [
					string,
					string,
				]
			)
			.filter((parts) => parts.every((part) => !!part));
		this._commands = new Map(commands);
	}
}
