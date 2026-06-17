import {
	CommandClasses,
	type InterviewProgress,
	InterviewStage,
} from "@zwave-js/core";
import { throttle } from "@zwave-js/shared";
import { roundTo } from "alcalzone-shared/math";
import { DeviceConfigMixin } from "./80_DeviceConfig.js";

// The interview progress is approximated as a percentage in [0, 100], matching the unit
// used for firmware update progress. The CommandClasses stage dominates the total interview
// time, so it occupies the largest band. The other stages are near-instant and snap to fixed
// points (see snapInterviewProgressToStage).
const INTERVIEW_PROGRESS_CC_BAND_START = 2;
const INTERVIEW_PROGRESS_CC_BAND_END = 99;
// The "discovery phase" (interviewing the CCs that establish the complete CC inventory:
// Security, Manufacturer Specific, Version, Wake Up, Multi Channel on the root and
// Security/Version on each endpoint) cannot know the total amount of work yet, so each of
// those CCs advances progress by a fixed amount derived from its weight, bounded by this cap.
const INTERVIEW_PROGRESS_DISCOVERY_CAP = 20;
const INTERVIEW_PROGRESS_DISCOVERY_UNIT = 0.6;

/**
 * The relative weight of a CC's interview, used to distribute interview progress more realistically.
 * Most CCs are quick (weight 1); CCs that are known to require many queries get a higher weight.
 */
function ccInterviewWeight(cc: CommandClasses): number {
	switch (cc) {
		case CommandClasses.Configuration:
			// May scan hundreds of parameters
			return 8;
		case CommandClasses.Version:
			// Queries the version of every supported CC
			return 5;
		case CommandClasses["User Code"]:
			return 4;
		case CommandClasses.Association:
		case CommandClasses["Association Group Information"]:
		case CommandClasses.Notification:
			return 3;
		case CommandClasses.Security:
		case CommandClasses["Security 2"]:
			// Security CCs can take a while because they may retry a few times to increase reliability
			return 2;
		case CommandClasses["Multi Channel"]:
		case CommandClasses["Multilevel Sensor"]:
			return 2;
		default:
			return 1;
	}
}

/** The overall interview progress (percent in [0, 100]) reached when the given stage has completed */
function interviewStageProgress(
	stage: InterviewStage,
): number | undefined {
	switch (stage) {
		case InterviewStage.ProtocolInfo:
			return 1;
		case InterviewStage.NodeInfo:
			return INTERVIEW_PROGRESS_CC_BAND_START;
		case InterviewStage.CommandClasses:
		case InterviewStage.OverwriteConfig:
			return INTERVIEW_PROGRESS_CC_BAND_END;
		case InterviewStage.Complete:
			return 100;
		default:
			return undefined;
	}
}

export abstract class InterviewProgressMixin extends DeviceConfigMixin {
	/** The last reported overall interview progress in percent [0, 100]. Monotonically non-decreasing. */
	private _interviewProgress: number = 0;

	// Working state for the CommandClasses interview stage only; reset between CC interviews.

	/** Whether the CC interview has reached the bulk phase, where the total amount of work is known */
	private _ccInterviewBulkPhase: boolean = false;
	/** Total remaining CC interview weight at the start of the bulk phase */
	private _ccInterviewBulkRemainingWeight: number = 0;
	/** Width of the progress band [`_interviewProgress` … CC band end] available to the bulk phase */
	private _ccInterviewBulkBand: number = 0;
	/** Start of the progress slice allotted to the CC currently being interviewed */
	private _ccInterviewStepStart: number = 0;
	/** Width of the progress slice allotted to the CC currently being interviewed */
	private _ccInterviewStepWidth: number = 0;
	private _ccInterviewCurrentEndpoint: number | undefined;
	private _ccInterviewCurrentCC: CommandClasses | undefined;

	private emitInterviewProgress: (progress: InterviewProgress) => void =
		throttle(
			(progress) => this._emit("interview progress", this, progress),
			250,
			// trailing=true so the last update of a burst is never dropped
			true,
		);

	private emitInterviewProgressUpdate(stage: InterviewStage): void {
		this.emitInterviewProgress({
			stage,
			progress: roundTo(this._interviewProgress, 2),
			endpoint: this._ccInterviewCurrentEndpoint,
			commandClass: this._ccInterviewCurrentCC,
		});
	}

	/** Resets the overall progress baseline to 0 for a fresh interview */
	protected resetInterviewProgressBaseline(): void {
		this._interviewProgress = 0;
	}

	/**
	 * Resets the per-stage progress tracking at the start of the CC interview.
	 * The overall progress baseline is intentionally NOT reset here, so it stays monotonic
	 * across a resumed interview. It is reset for a fresh interview in `interviewInternal`.
	 */
	protected resetCCInterviewProgress(): void {
		this._ccInterviewBulkPhase = false;
		this._ccInterviewBulkRemainingWeight = 0;
		this._ccInterviewBulkBand = 0;
		this._ccInterviewStepStart = 0;
		this._ccInterviewStepWidth = 0;
		this._ccInterviewCurrentEndpoint = undefined;
		this._ccInterviewCurrentCC = undefined;
		// Make sure the CC band starts at its lower bound, even on a resumed interview
		// where the earlier stage snaps did not happen in this session.
		this._interviewProgress = Math.max(
			this._interviewProgress,
			INTERVIEW_PROGRESS_CC_BAND_START,
		);
	}

	/**
	 * Sets up proportional progress distribution for the bulk phase of the CC interview,
	 * which is reached once the complete CC inventory is known. From here, progress is
	 * distributed proportionally to the remaining interview weight, summed across every
	 * not-yet-interviewed CC of the root device and all endpoints.
	 */
	protected setupCCInterviewBulkProgress(
		...remainingCCs: Iterable<CommandClasses>[]
	): void {
		let remainingWeight = 0;
		for (const ccs of remainingCCs) {
			for (const cc of ccs) {
				remainingWeight += ccInterviewWeight(cc);
			}
		}
		this._ccInterviewBulkPhase = true;
		this._ccInterviewBulkRemainingWeight = remainingWeight;
		this._ccInterviewBulkBand = Math.max(
			0,
			INTERVIEW_PROGRESS_CC_BAND_END - this._interviewProgress,
		);
	}

	/** Computes the progress slice width for the CC that is about to be interviewed */
	private computeCCInterviewStepWidth(cc: CommandClasses): number {
		if (this._ccInterviewBulkPhase) {
			if (this._ccInterviewBulkRemainingWeight <= 0) return 0;
			const width = ccInterviewWeight(cc)
				/ this._ccInterviewBulkRemainingWeight
				* this._ccInterviewBulkBand;
			// Never advance past the end of the CC band
			return Math.max(
				0,
				Math.min(
					width,
					INTERVIEW_PROGRESS_CC_BAND_END - this._ccInterviewStepStart,
				),
			);
		} else {
			// Discovery phase: a fixed amount derived from the CC's weight, bounded by the cap
			const width = ccInterviewWeight(cc)
				* INTERVIEW_PROGRESS_DISCOVERY_UNIT;
			return Math.max(
				0,
				Math.min(
					width,
					INTERVIEW_PROGRESS_DISCOVERY_CAP
						- this._ccInterviewStepStart,
				),
			);
		}
	}

	/** Reserves a progress slice for the CC that is about to be interviewed */
	protected reserveCCInterviewStepProgress(
		endpoint: number,
		cc: CommandClasses,
	): void {
		this._ccInterviewCurrentEndpoint = endpoint;
		this._ccInterviewCurrentCC = cc;
		this._ccInterviewStepStart = this._interviewProgress;
		this._ccInterviewStepWidth = this.computeCCInterviewStepWidth(cc);
	}

	/** Completes the current CC's progress slice and emits an update */
	protected completeCCInterviewStepProgress(): void {
		this._interviewProgress = Math.max(
			this._interviewProgress,
			this._ccInterviewStepStart + this._ccInterviewStepWidth,
		);
		this.emitInterviewProgressUpdate(InterviewStage.CommandClasses);
		this._ccInterviewCurrentEndpoint = undefined;
		this._ccInterviewCurrentCC = undefined;
	}

	/**
	 * Snaps the overall progress to the band end of a completed interview stage and emits an update.
	 * The CommandClasses band (the bulk of the work) is filled granularly by the CC interview itself.
	 */
	protected snapInterviewProgressToStage(
		completedStage: InterviewStage,
	): void {
		const stageProgress = interviewStageProgress(completedStage);
		if (stageProgress == undefined) return;
		this._ccInterviewCurrentEndpoint = undefined;
		this._ccInterviewCurrentCC = undefined;
		this._interviewProgress = Math.max(
			this._interviewProgress,
			stageProgress,
		);
		this.emitInterviewProgressUpdate(completedStage);
	}

	/**
	 * Reports fine-grained progress from within the interview of the CC that is currently
	 * being interviewed. Called by CCs (via `getNode(ctx)`) to keep the overall progress moving
	 * during long-running interview steps. Implements the {@link ReportInterviewProgress} trait.
	 */
	public reportInterviewProgress(completed: number, total: number): void {
		// Only meaningful while a specific CC is being interviewed
		if (this._ccInterviewCurrentCC == undefined) return;
		// This is called from many different CC interviews, so the inputs are sanitized
		// here (not at each call site): the reported fraction is clamped into [0, 1],
		// guarding against `completed > total`, negative values, and `total <= 0`.
		const fraction = total > 0
			? Math.min(1, Math.max(0, completed / total))
			: 0;
		const progress = this._ccInterviewStepStart
			+ this._ccInterviewStepWidth * fraction;
		// The overall progress must never go backwards
		if (progress > this._interviewProgress) {
			this._interviewProgress = progress;
			this.emitInterviewProgressUpdate(InterviewStage.CommandClasses);
		}
	}
}
