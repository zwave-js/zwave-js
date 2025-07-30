import { type JSONObject, pick } from "@zwave-js/shared";
import { throwInvalidConfig } from "../utils_safe.js";
import {
	type ConditionalItem,
	conditionApplies,
	validateCondition,
} from "./ConditionalItem.js";
import type { DeviceID } from "./shared.js";

export class ConditionalSceneConfig
	implements ConditionalItem<SceneConfig>
{
	public constructor(
		filename: string,
		sceneId: number,
		definition: JSONObject,
	) {
		this.sceneId = sceneId;

		validateCondition(
			filename,
			definition,
			`Scene ${sceneId} contains an`,
		);
		this.condition = definition.$if;

		if (typeof definition.label !== "string") {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${filename}:
Scene ${sceneId} has a non-string label`,
			);
		}
		this.label = definition.label;

		if (
			definition.description != undefined
			&& typeof definition.description !== "string"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${filename}:
Scene ${sceneId} has a non-string description`,
			);
		}
		this.description = definition.description;
	}

	public readonly condition?: string;

	public readonly sceneId: number;
	public readonly label: string;
	public readonly description?: string;

	public evaluateCondition(
		deviceId?: DeviceID,
	): SceneConfig | undefined {
		if (!conditionApplies(this, deviceId)) return;

		return pick(this, [
			"sceneId",
			"label",
			"description",
		]);
	}
}

export type SceneConfig = Omit<
	ConditionalSceneConfig,
	"condition" | "evaluateCondition"
>;