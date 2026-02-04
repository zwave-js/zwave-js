import { SoundSwitchCC, SoundSwitchCCValues } from "@zwave-js/cc";
import type { GetValueDB } from "@zwave-js/core";
import { type Timer, setTimer } from "@zwave-js/shared";
import type { ZWaveNode } from "../Node.js";

export interface SoundSwitchHandlerStore {
	// Map of endpoint index -> auto-reset timer
	autoResetTimers: Map<number, Timer>;
}

export function getDefaultSoundSwitchHandlerStore(): SoundSwitchHandlerStore {
	return {
		autoResetTimers: new Map(),
	};
}

/** Handles timer management after setting the toneId value */
export function handleSoundSwitchSetValue(
	ctx: GetValueDB,
	node: ZWaveNode,
	store: SoundSwitchHandlerStore,
	endpointIndex: number,
	toneId: number,
): void {
	// Cancel any existing timer for this endpoint
	const existingTimer = store.autoResetTimers.get(endpointIndex);
	if (existingTimer) {
		existingTimer.clear();
		store.autoResetTimers.delete(endpointIndex);
	}

	// Schedule auto-reset timer if playing a tone with known duration
	if (toneId > 0) {
		const durationSeconds = SoundSwitchCC.getToneDurationCached(
			ctx,
			{ nodeId: node.id, index: endpointIndex, virtual: false },
			toneId,
		);
		if (durationSeconds !== undefined && durationSeconds > 0) {
			const timeoutMs = durationSeconds * 1000;
			const timer = setTimer(() => {
				node.valueDB.setValue(
					SoundSwitchCCValues.toneId.endpoint(endpointIndex),
					0,
				);
				store.autoResetTimers.delete(endpointIndex);
			}, timeoutMs).unref();

			store.autoResetTimers.set(endpointIndex, timer);
		}
	}
}
