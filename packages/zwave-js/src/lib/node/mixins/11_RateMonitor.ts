import type { CommandClasses, MaybeNotKnown } from "@zwave-js/core";
import { type Interval, setInterval } from "@zwave-js/shared";
import { roundTo } from "alcalzone-shared/math";
import type { Driver } from "../../driver/Driver.js";
import type { DeviceClass } from "../DeviceClass.js";
import type { NodeStatisticsHost } from "../NodeStatistics.js";
import { NodeEventsMixin } from "./10_Events.js";

/**
 * Interface for NodeRateMonitor
 */
export interface NodeRateMonitor {
	/** @internal */
	updateCommandRateStatistics(): void;

	get lastCommandTimestampRX(): MaybeNotKnown<Date>;
	set lastCommandTimestampRX(value: Date);
}

export abstract class NodeRateMonitorMixin extends NodeEventsMixin
	implements NodeRateMonitor
{
	public constructor(
		nodeId: number,
		driver: Driver,
		index: number,
		deviceClass?: DeviceClass,
		supportedCCs?: CommandClasses[],
	) {
		super(nodeId, driver, index, deviceClass, supportedCCs);

		// Schedule regular updates of the command rate statistics
		this.#updateCommandRateInterval = setInterval(
			() => this.updateCommandRateStatistics(),
			5000,
		);
	}

	#updateCommandRateInterval: Interval | undefined;
	#firstCommandTimestampRX: Date | undefined;
	#commandRxTimestamps: Date[] = [];
	#lastCommandRateUpdate: Date | undefined;

	get lastCommandTimestampRX(): MaybeNotKnown<Date> {
		return this.#commandRxTimestamps.at(-1);
	}
	set lastCommandTimestampRX(value: Date) {
		if (this.#firstCommandTimestampRX === undefined) {
			this.#firstCommandTimestampRX = value;
		}
		this.#commandRxTimestamps.push(value);
		this.updateCommandRateStatistics();
	}

	public updateCommandRateStatistics(): void {
		// Remove timestamps older than 1 minute
		this.#commandRxTimestamps = this.#commandRxTimestamps.filter(
			(ts) => new Date().getTime() - ts.getTime() < 60_000,
		);

		// If we have recently updated the command rate statistics, skip this update to save on events
		if (
			this.#lastCommandRateUpdate
			&& new Date().getTime() - this.#lastCommandRateUpdate.getTime()
				< 5000
		) {
			return;
		}

		const numCommands = this.#commandRxTimestamps.length;
		if (numCommands === 0) {
			// No commands received recently, command rate is 0
			this.#emitStatisticsUpdate(0);
			return;
		}

		// If the first recorded timestamp is too new, don't calculate the command rate yet to avoid spikes
		if (
			!this.#firstCommandTimestampRX
			|| new Date().getTime() - this.#firstCommandTimestampRX.getTime()
				< 5000
		) {
			return;
		}

		// Average over max. 1 minute
		const period = Math.min(
			Date.now() - this.#firstCommandTimestampRX.getTime(),
			60_000,
		);
		const commandRate = roundTo(numCommands / (period / 60000), 1); // commands per minute

		console.debug(
			`Node ${this.id}
  commands received in the last minute: ${numCommands}
  first command timestamp RX: ${this.#firstCommandTimestampRX.toISOString()}
  command rate RX: ${commandRate} commands/min`,
		);

		// And emit the statistics update
		this.#emitStatisticsUpdate(commandRate);
	}

	#emitStatisticsUpdate(commandRate: number): void {
		const stats = this as unknown as NodeStatisticsHost;
		if (stats.statistics.commandRateRX !== commandRate) {
			stats.updateStatistics((s) => ({
				...s,
				commandRateRX: commandRate,
			}));
			this.#lastCommandRateUpdate = new Date();
		}
	}

	public destroy(): void {
		super.destroy();
		this.#updateCommandRateInterval?.clear();
	}
}
