import type { ZWaveError } from "@zwave-js/core";
import {
	type Task as WaddleTask,
	type TaskBuilder as WaddleTaskBuilder,
	TaskInterruptBehavior,
	TaskPriority,
	type TaskReturnType,
	TaskScheduler as WaddleTaskScheduler,
} from "@zwave-js/waddle";

export type TaskTag =
	| {
		// Rebuild routes for all nodes
		id: "rebuild-routes";
	}
	| {
		// Rebuild routes for a single node
		id: "rebuild-node-routes";
		nodeId: number;
	}
	| {
		// Perform an OTA firmware update for a node
		id: "firmware-update-ota";
		nodeId: number;
	};

export type Task<T> = WaddleTask<T, TaskTag, ZWaveError>;
export type TaskBuilder<T> = WaddleTaskBuilder<T, TaskTag>;
export class TaskScheduler extends WaddleTaskScheduler<TaskTag, ZWaveError> {}

export { TaskInterruptBehavior, TaskPriority };
export type { TaskReturnType };
