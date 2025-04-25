import { ManufacturerProprietaryCC } from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import type { MockNodeBehavior } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"sendAndReceiveData works",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses["Manufacturer Proprietary"],
			],
		},

		customSetup: async (driver, mockController, mockNode) => {
			const respondToManufacturerProprietary: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC.ccId
							=== CommandClasses["Manufacturer Proprietary"]
					) {
						// Simply echo the received CC
						const received =
							receivedCC as ManufacturerProprietaryCC;
						const response = new ManufacturerProprietaryCC({
							nodeId: self.id,
							manufacturerId: received.manufacturerId!,
							payload: received.payload,
						});
						return { action: "sendCC", cc: response };
					}
				},
			};
			mockNode.defineBehavior(respondToManufacturerProprietary);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const manufacturerId = 0x1234;
			const data = Bytes.from("c0ffee", "hex");
			const response = await node
				.commandClasses["Manufacturer Proprietary"].sendAndReceiveData(
					manufacturerId,
					data,
				);
			t.expect(response?.manufacturerId).toBe(manufacturerId);
			t.expect(response?.data).toEqual(data);
		},
	},
);
