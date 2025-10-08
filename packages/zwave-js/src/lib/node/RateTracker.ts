/**
 * Tracks the rate of incoming messages.
 * Rate is calculated as number of messages per second, based on a sliding window of the last minute.
 * @internal
 */
export class RateTracker {
	private readonly _averagingPeriod: number;
	private readonly _timestamps: number[];
	private _rate: number;
	private _timeout: ReturnType<typeof setTimeout> | undefined;

	constructor(private onRateChange: (rate: number) => void) {
		this._averagingPeriod = 60_000; // 1 minute in milliseconds
		this._timestamps = [];
		this._rate = 0;
	}

	public get rate(): number {
		return this._rate;
	}

	public recordIncomingMessage(): void {
		this._timestamps.push(Date.now());

		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = undefined;
		}
		this.calcRateAndReschedule();
	}

	/**
	 * Re-calculate the rate, remove expired timestamps, and schedule the next rate update.
	 */
	private calcRateAndReschedule() {
		const now = Date.now();
		this.removeExpiredTimestamps(now);

		const oldRate = this._rate;
		this._rate = this._timestamps.length / (this._averagingPeriod / 1000);
		if (this._rate !== oldRate) {
			// Notify listeners about the rate change
			this.onRateChange(this._rate);
		}

		// Schedule the next expiration
		if (this._timestamps.length) {
			const nextOldest = this._timestamps[0];
			// Time until the next oldest timestamp expires, or at least 2 seconds to avoid too frequent calculations
			// This means the rate might be off by 2 seconds, but for statistics that is fine
			const nextTimeout = Math.max(
				this._averagingPeriod - (now - nextOldest),
				2000,
			);

			this._timeout = setTimeout(
				this.calcRateAndReschedule.bind(this),
				nextTimeout,
			);
		} else {
			// When there are no new messages, only start re-scheduling when a new message arrives
			clearTimeout(this._timeout);
			this._timeout = undefined;
		}
	}

	private removeExpiredTimestamps(now: number) {
		const expireCutoff = now - this._averagingPeriod;

		const firstValidIndex = this._timestamps.findIndex((timestamp) =>
			timestamp > expireCutoff
		);

		if (firstValidIndex > 0) {
			// Some timestamps at the beginning are expired
			this._timestamps.splice(0, firstValidIndex);
		} else if (firstValidIndex === -1) {
			// All timestamps are expired
			this._timestamps.length = 0;
		}
		// Else firstValidIndex === 0, no timestamps are expired, so we do nothing
	}

	public destroy(): void {
		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = undefined;
		}
		this._timestamps.length = 0;
		this._rate = 0;
	}
}
