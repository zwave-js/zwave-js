import type { CommandClasses } from "./CommandClasses.js";

export enum InterviewStage {
	/** The interview process hasn't started for this node */
	None,
	/** The node's protocol information has been queried from the controller */
	ProtocolInfo,
	/** The node has been queried for supported and controlled command classes */
	NodeInfo,

	/**
	 * Information for all command classes has been queried.
	 * This includes static information that is requested once as well as dynamic
	 * information that is requested on every restart.
	 */
	CommandClasses,

	/**
	 * Device information for the node has been loaded from a config file.
	 * If defined, some of the reported information will be overwritten based on the
	 * config file contents.
	 */
	OverwriteConfig,

	/** The interview process has finished */
	Complete,
}

export interface InterviewProgress {
	/** The interview stage that is currently in progress */
	stage: InterviewStage;
	/**
	 * The approximate overall interview progress in %, rounded to two digits.
	 * This is monotonically non-decreasing within a single interview and only an approximation,
	 * as the exact amount of work cannot be known in advance.
	 */
	progress: number;
	/** During the `CommandClasses` stage: the index of the endpoint that is currently being interviewed */
	endpoint?: number;
	/** During the `CommandClasses` stage: the Command Class that is currently being interviewed */
	commandClass?: CommandClasses;
}
