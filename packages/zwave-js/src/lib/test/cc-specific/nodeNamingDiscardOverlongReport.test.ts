import { CommandClass } from "@zwave-js/cc";
import {
	NodeNamingAndLocationCCNameReport,
	NodeNamingAndLocationCCValues,
} from "@zwave-js/cc/NodeNamingCC";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { ccCaps, createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

class SpoofedNodeNamingAndLocationCCNameReport extends NodeNamingAndLocationCCNameReport {
	public override serialize(
		...args: Parameters<CommandClass["serialize"]>
	): ReturnType<CommandClass["serialize"]> {
		const [ctx] = args;
		this.payload = Bytes.concat([[0x00], Bytes.from(this.name, "ascii")]);
		return CommandClass.prototype.serialize.call(this, ctx);
	}
}

integrationTest(
	"Node Naming CC reports with overlong payloads are discarded",
	{
		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["Node Naming and Location"],
					isSupported: true,
					version: 1,
					name: "Initial Name",
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const nameValueId = NodeNamingAndLocationCCValues.name.id;
			const spoofedName = "12345678901234567";
			const spoofedNamePayload = Bytes.from(spoofedName, "ascii");

			t.expect(spoofedNamePayload.length).toBeGreaterThan(16);
			t.expect(node.getValue(nameValueId)).toBe("Initial Name");

			const cc = new SpoofedNodeNamingAndLocationCCNameReport({
				nodeId: mockController.ownNodeId,
				name: spoofedName,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			t.expect(node.getValue(nameValueId)).toBe("Initial Name");
		},
	},
);
