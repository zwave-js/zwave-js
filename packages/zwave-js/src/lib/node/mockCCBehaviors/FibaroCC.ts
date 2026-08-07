import {
	FibaroVenetianBlindCCGet,
	FibaroVenetianBlindCCReport,
	FibaroVenetianBlindCCSet,
} from "@zwave-js/cc/manufacturerProprietary/FibaroCC";
import type { MockNodeBehavior } from "@zwave-js/testing";

const POSITION_KEY = "FibaroVenetianBlind_position";
const TILT_KEY = "FibaroVenetianBlind_tilt";

const respondToFibaroVenetianBlindGet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof FibaroVenetianBlindCCGet) {
			const cc = new FibaroVenetianBlindCCReport({
				nodeId: controller.ownNodeId,
				position: (self.state.get(POSITION_KEY) as number) ?? 0,
				tilt: (self.state.get(TILT_KEY) as number) ?? 0,
			});
			return { action: "sendCC", cc };
		}
	},
};

const respondToFibaroVenetianBlindSet: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof FibaroVenetianBlindCCSet) {
			if (receivedCC.position != undefined) {
				self.state.set(POSITION_KEY, receivedCC.position);
			}
			if (receivedCC.tilt != undefined) {
				self.state.set(TILT_KEY, receivedCC.tilt);
			}
			return { action: "ok" };
		}
	},
};

export const FibaroCCBehaviors: MockNodeBehavior[] = [
	respondToFibaroVenetianBlindGet,
	respondToFibaroVenetianBlindSet,
];
