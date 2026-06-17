import { SceneActivationCCValues } from "@zwave-js/cc/SceneActivationCC";
import { CommandClasses } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";

// Regression test for https://github.com/zwave-js/zwave-js/issues/7546
// Scene Activation CC is typically ONLY reported as controlled, never as supported.
integrationTest(
	"Scene Activation CC advertised only as controlled is not ignored",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				// A realistic device supports a few CCs and only controls Scene Activation
				CommandClasses.Version,
				{
					ccId: CommandClasses["Scene Activation"],
					isSupported: false,
					isControlled: true,
				},
			],
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			// The CC must be remembered as controlled, even though it is neither
			// supported nor in the supported part of the NIF
			t.expect(node.controlsCC(CommandClasses["Scene Activation"]))
				.toBe(true);
			t.expect(node.supportsCC(CommandClasses["Scene Activation"]))
				.toBe(false);

			// ...and its value IDs must be exposed
			const definedValueIDs = node.getDefinedValueIDs();
			t.expect(
				definedValueIDs.some((v) =>
					SceneActivationCCValues.sceneId.is(v)
				),
			).toBe(true);
		},
	},
);
