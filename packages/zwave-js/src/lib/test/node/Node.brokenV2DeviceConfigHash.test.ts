import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"The broken V2 device config hash does not cause the device config to be unnecessarily changed",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xffff,
			productType: 0xffff,
			productId: 0xffff,

			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
			],
		},

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/brokenV2DeviceConfigHash",
		),

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/brokenV2DeviceConfigHash",
				),
			},
		},

		async testBody(t, _driver, node) {
			// The device config was hashed incorrectly in some versions, yielding the following hashable,
			// which corresponds to the hash stored in the fixture's jsonl file:
			// const hashableV2_broken = {
			// 	endpoints: {
			// 		"0": {
			// 			paramInformation: [
			// 				{
			// 					parameterNumber: 1,
			// 					valueSize: 1,
			// 					minValue: 0,
			// 					maxValue: 1,
			// 					unsigned: false,
			// 					defaultValue: 0,
			// 					allowManualEntry: false,
			// 					hidden: false, // This should not be here
			// 					options: [{ value: 0 }, { value: 1 }],
			// 				},
			// 			],
			// 		},
			// 	},
			// };

			// This is the expected hash without the hidden property, encoded as hex for simplicity
			const hashV2_fixed = Bytes.from(
				"24763224ab465652ad640022302d8e860a22078da10e72100079089f1b0039f01001ca203c050e051db4a0042ac70c17a84a7818029d008d08835a1d38dbb03616086b6b01",
				"hex",
			);

			// Hashing the brokenConfig as version 2 should yield the fixed hash:
			const hashV2_actual = await node.deviceConfig!.getHash(2);
			t.expect(Bytes.view(hashV2_actual)).toEqual(hashV2_fixed);

			// Despite the mismatch between stored hash and actual hash, this node's device config should be considered unchanged
			t.expect(
				node.hasDeviceConfigChanged(),
				"device config should not be considered changed",
			).toBeFalsy();
		},
	},
);
