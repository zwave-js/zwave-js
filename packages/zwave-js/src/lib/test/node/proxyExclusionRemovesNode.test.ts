import {
	ApplicationUpdateRequest,
	ApplicationUpdateTypes,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";
import { RemoveNodeReason } from "../../controller/Inclusion.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A node excluded by another controller is removed from the node list",
	{
		testBody: async (t, driver, node, mockController) => {
			const nodeRemoved = new Promise<RemoveNodeReason>((resolve) => {
				driver.controller.once(
					"node removed",
					(removedNode, reason) => {
						t.expect(removedNode).toBe(node);
						resolve(reason);
					},
				);
			});

			await mockController.sendMessageToHost(
				new ApplicationUpdateRequest({
					updateType: ApplicationUpdateTypes.Node_Removed,
					payload: Bytes.from([node.id, 0]),
				}),
			);

			await t.expect(nodeRemoved).resolves.toBe(
				RemoveNodeReason.ProxyExcluded,
			);
			t.expect(driver.controller.nodes.has(node.id)).toBe(false);
		},
	},
);
