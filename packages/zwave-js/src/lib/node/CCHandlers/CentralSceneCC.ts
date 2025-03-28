import {
	type CentralSceneCCNotification,
	CentralSceneCCValues,
	CentralSceneKeys,
	type PersistValuesContext,
} from "@zwave-js/cc";
import { type LogNode } from "@zwave-js/core";
import { type Timer, setTimer, stringify } from "@zwave-js/shared";
import { type ZWaveNode } from "../Node.js";

export interface CentralSceneHandlerStore {
	keyHeldDownContext:
		| {
			timeout: Timer;
			sceneNumber: number;
		}
		| undefined;
	lastSequenceNumber: number | undefined;
	forcedKeyUp: boolean;
}

export function getDefaultCentralSceneHandlerStore(): CentralSceneHandlerStore {
	return {
		keyHeldDownContext: undefined,
		lastSequenceNumber: undefined,
		forcedKeyUp: false,
	};
}

/** Handles the receipt of a ThermostatModeCC Set */
export function handleCentralSceneNotification(
	ctx: PersistValuesContext & LogNode,
	node: ZWaveNode,
	command: CentralSceneCCNotification,
	store: CentralSceneHandlerStore,
): void {
	// Did we already receive this command?
	if (command.sequenceNumber === store.lastSequenceNumber) {
		return;
	} else {
		store.lastSequenceNumber = command.sequenceNumber;
	}
	/*
	If the Slow Refresh field is false:
	- A new Key Held Down notification MUST be sent every 200ms until the key is released.
	- The Sequence Number field MUST be updated at each notification transmission.
	- If not receiving a new Key Held Down notification within 400ms, a controlling node SHOULD use an adaptive timeout approach as described in 4.17.1:
	A controller SHOULD apply an adaptive approach based on the reception of the Key Released Notification.
	Initially, the controller SHOULD time out if not receiving any Key Held Down Notification refresh after
	400ms and consider this to be a Key Up Notification. If, however, the controller subsequently receives a
	Key Released Notification, the controller SHOULD consider the sending node to be operating with the Slow
	Refresh capability enabled.

	If the Slow Refresh field is true:
	- A new Key Held Down notification MUST be sent every 55 seconds until the key is released.
	- The Sequence Number field MUST be updated at each notification refresh.
	- If not receiving a new Key Held Down notification within 60 seconds after the most recent Key Held Down
	notification, a receiving node MUST respond as if it received a Key Release notification.
	*/

	const setSceneValue = (
		sceneNumber: number,
		key: CentralSceneKeys,
	): void => {
		const valueId = CentralSceneCCValues.scene(sceneNumber).id;
		node.valueDB.setValue(valueId, key, { stateful: false });
	};

	const forceKeyUp = (): void => {
		store.forcedKeyUp = true;
		// force key up event
		setSceneValue(
			store.keyHeldDownContext!.sceneNumber,
			CentralSceneKeys.KeyReleased,
		);
		// clear old timer
		store.keyHeldDownContext?.timeout?.clear();
		// clear the key down context
		store.keyHeldDownContext = undefined;
	};

	if (
		store.keyHeldDownContext
		&& store.keyHeldDownContext.sceneNumber
			!== command.sceneNumber
	) {
		// The user pressed another button, force release
		forceKeyUp();
	}

	const slowRefreshValueId = CentralSceneCCValues.slowRefresh.endpoint(
		command.endpointIndex,
	);
	if (command.keyAttribute === CentralSceneKeys.KeyHeldDown) {
		// Set or refresh timer to force a release of the key
		store.forcedKeyUp = false;
		store.keyHeldDownContext?.timeout?.clear();
		// If the node does not advertise support for the slow refresh capability, we might still be dealing with a
		// slow refresh node. We use the stored value for fallback behavior
		const slowRefresh = command.slowRefresh
			?? node.valueDB.getValue<boolean>(slowRefreshValueId);
		store.keyHeldDownContext = {
			sceneNumber: command.sceneNumber,
			// Unref'ing long running timers allows the process to exit mid-timeout
			timeout: setTimer(
				forceKeyUp,
				slowRefresh ? 60000 : 400,
			).unref(),
		};
	} else if (command.keyAttribute === CentralSceneKeys.KeyReleased) {
		// Stop the release timer
		if (store.keyHeldDownContext) {
			store.keyHeldDownContext.timeout.clear();
			store.keyHeldDownContext = undefined;
		} else if (store.forcedKeyUp) {
			// If we timed out and the controller subsequently receives a Key Released Notification,
			// we SHOULD consider the sending node to be operating with the Slow Refresh capability enabled.
			node.valueDB.setValue(slowRefreshValueId, true);
			// Do not raise the duplicate event
			return;
		}
	}

	setSceneValue(command.sceneNumber, command.keyAttribute);
	ctx.logNode(node.id, {
		message: `received CentralScene notification ${stringify(command)}`,
		direction: "inbound",
	});
}
