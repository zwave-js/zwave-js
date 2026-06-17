import type { CommandClass } from "@zwave-js/cc";
import type { CommandRequest, ContainsCC } from "@zwave-js/serial/serialapi";
import { type Timer, setTimer } from "@zwave-js/shared";

/** A partial CC session and the segments received for it so far */
export interface PartialCCSession {
	nodeId: number;
	/** The received segments, keyed by their remaining segments count */
	segments: Map<number, CommandClass>;
	/** The message which contained the final segment, if it was already received */
	finalMsg?: CommandRequest & ContainsCC;
	/** The message which contained the most recent segment */
	lastSegmentMsg: CommandRequest & ContainsCC;
	/** The request this session is the response to, if known */
	requestCC?: CommandClass;
	/** How many times the response may still be re-requested when segments are missing */
	attemptsLeft: number;
	timeout?: Timer;
}

export type PartialCCUpdate =
	// The command was stored and the session expects more segments
	| { type: "segment"; duplicate: boolean }
	// All segments were received and the command can be merged
	| {
		type: "complete";
		/** The final segment, which the partials are merged into */
		command: CommandClass;
		/** The other segments, ordered like they were transmitted by the node */
		partials: CommandClass[];
		/** The message which contained the final segment */
		finalMsg: CommandRequest & ContainsCC;
	};

export interface PartialCCSessionManagerHost {
	/** How long to wait for the next segment of a session */
	getSegmentTimeout(): number;
	/** How many times the response of a session with missing segments may be re-requested */
	getMaxReRequestAttempts(): number;
	/** Determines the request CC a newly created session is the response to, if any */
	findRequestCC(command: CommandClass): CommandClass | undefined;
	/** Re-requests the response a session belongs to because segments are missing */
	rerequestSession(session: PartialCCSession): void;
	/** Called when an incomplete session is dropped */
	onSessionLost(session: PartialCCSession): void;
}

/**
 * Tracks the state of partial CC sessions, i.e. commands which are split into
 * multiple segments that need to be reassembled before they can be handled.
 *
 * Segments are identified by their "remaining segments" counter (e.g. a
 * "reports to follow" field), which decreases towards 0 for the final segment.
 * Since Z-Wave commands from a node are received in order, this allows detecting
 * duplicated and missing segments.
 */
export class PartialCCSessionManager {
	public constructor(host: PartialCCSessionManagerHost) {
		this.host = host;
	}

	private host: PartialCCSessionManagerHost;
	private sessions = new Map<string, PartialCCSession>();
	private drains = new Map<
		string,
		{ nextRemaining: number; timeout: Timer }
	>();

	/**
	 * Determines if the given command belongs to a partial CC session and tracks it if so.
	 * Returns `undefined` for commands that do not support partial sessions.
	 */
	public handleCommand(
		command: CommandClass,
		msg: CommandRequest & ContainsCC,
	): PartialCCUpdate | undefined {
		const sessionId = command.getPartialCCSessionId();
		if (!sessionId) return undefined;

		const remaining = command.getRemainingSegments() ?? 0;
		const key = JSON.stringify({
			nodeId: command.nodeId,
			ccId: command.ccId,
			ccCommand: command.ccCommand,
			...sessionId,
		});

		// When a session completes while filling a hole from a previous session,
		// the node keeps sending the remaining segments, which are already part of
		// the merged command. These surplus segments are swallowed for a short time
		// so they are not mistaken for the beginning of a new session.
		const drain = this.drains.get(key);
		if (drain) {
			// Segments in the surplus tail may go missing too, so any segment that
			// continues the completed series in descending order was already merged
			if (remaining <= drain.nextRemaining) {
				if (remaining === 0) {
					this.deleteDrain(key);
				} else {
					drain.nextRemaining = remaining - 1;
				}
				return { type: "segment", duplicate: true };
			}
			// A higher count means a new series started, handle the segment normally
			this.deleteDrain(key);
		}

		let session = this.sessions.get(key);

		if (!session) {
			// The response fits into a single segment, no need to track a session
			if (remaining === 0) {
				return {
					type: "complete",
					command,
					partials: [],
					finalMsg: msg,
				};
			}

			session = {
				nodeId: command.nodeId as number,
				segments: new Map(),
				lastSegmentMsg: msg,
				requestCC: this.host.findRequestCC(command),
				attemptsLeft: this.host.getMaxReRequestAttempts(),
			};
			this.sessions.set(key, session);
		}

		// A segment with a higher count than all previous ones means the node has started
		// sending the response again, e.g. after it was re-requested. The data may have
		// changed in the meantime, so discard the previous segments to avoid merging two
		// different responses.
		// Caution: This loses previously received segments when the first segment(s) of the
		// original response were not received, where keeping them would have been valid.
		// There is no way to distinguish the two cases though.
		if (
			session.segments.size > 0
			&& remaining > Math.max(...session.segments.keys())
		) {
			session.segments.clear();
			session.finalMsg = undefined;
		}

		const duplicate = session.segments.has(remaining);
		// In case of a duplicate, assume the newest segment is the correct one
		session.segments.set(remaining, command);
		session.lastSegmentMsg = msg;
		if (remaining === 0) session.finalMsg = msg;

		// The session is complete when the final segment and everything before it was received
		const expectedTotal = Math.max(...session.segments.keys()) + 1;
		if (
			session.segments.has(0)
			&& session.segments.size === expectedTotal
		) {
			this.deleteSession(key);

			// When this segment filled a hole, the segments after it are still
			// being transmitted and need to be swallowed when they arrive
			if (remaining > 0) {
				this.deleteDrain(key);
				this.drains.set(key, {
					nextRemaining: remaining - 1,
					timeout: setTimer(() => {
						this.drains.delete(key);
					}, this.host.getSegmentTimeout()),
				});
			}

			const partials = [...session.segments.entries()]
				.filter(([rem]) => rem > 0)
				.toSorted(([a], [b]) => b - a)
				.map(([, cc]) => cc);
			return {
				type: "complete",
				command: session.segments.get(0)!,
				partials,
				finalMsg: session.finalMsg!,
			};
		}

		// Wait for the missing segments, in case the node retransmits them.
		// Anything still missing when the timer elapses is either re-requested
		// or considered lost.
		session.timeout?.clear();
		session.timeout = setTimer(() => {
			this.recoverOrDrop(key, session);
		}, this.host.getSegmentTimeout());

		return { type: "segment", duplicate };
	}

	/** Re-requests the response a session belongs to, or drops the session when that is not possible */
	private recoverOrDrop(key: string, session: PartialCCSession): void {
		if (session.requestCC && session.attemptsLeft > 0) {
			session.attemptsLeft--;
			this.host.rerequestSession(session);
			// Limit how long to wait for the re-requested segments
			session.timeout?.clear();
			session.timeout = setTimer(() => {
				this.recoverOrDrop(key, session);
			}, this.host.getSegmentTimeout());
		} else {
			this.deleteSession(key);
			this.host.onSessionLost(session);
		}
	}

	private deleteSession(key: string): void {
		const session = this.sessions.get(key);
		if (session) {
			session.timeout?.clear();
			this.sessions.delete(key);
		}
	}

	private deleteDrain(key: string): void {
		const drain = this.drains.get(key);
		if (drain) {
			drain.timeout.clear();
			this.drains.delete(key);
		}
	}

	/** Drops all sessions and stops all timers */
	public clear(): void {
		for (const session of this.sessions.values()) {
			session.timeout?.clear();
		}
		this.sessions.clear();
		for (const drain of this.drains.values()) {
			drain.timeout.clear();
		}
		this.drains.clear();
	}
}
