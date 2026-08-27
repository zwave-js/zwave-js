import {
	DeviceIdType,
	ManufacturerSpecificCCDeviceSpecificGet,
	ManufacturerSpecificCCDeviceSpecificReport,
} from "@zwave-js/cc";
import {
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

const vendor = {
	manufacturerId: 0x1234,
	productType: 0x5678,
	productId: 0x9abc,
	deviceId: "0x1234567890abcdef",
};

integrationTest("Responses to Manufacturer Specific Device Specific Get", {
	additionalDriverOptions: { vendor },

	testBody: async (t, driver, node, mockController, mockNode) => {
		for (
			const deviceIdType of [
				DeviceIdType.FactoryDefault,
				DeviceIdType.SerialNumber,
				DeviceIdType.PseudoRandom,
			]
		) {
			const request = new ManufacturerSpecificCCDeviceSpecificGet({
				nodeId: mockController.ownNodeId,
				deviceIdType,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(request),
			);

			const { payload: response } = await mockNode.expectControllerFrame(
				(
					frame,
				): frame is MockZWaveRequestFrame & {
					payload: ManufacturerSpecificCCDeviceSpecificReport;
				} => frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ManufacturerSpecificCCDeviceSpecificReport,
				{ timeout: 1000 },
			);

			t.expect(response.type).toBe(DeviceIdType.SerialNumber);
			t.expect(response.deviceId).toBe(vendor.deviceId);
		}
	},
});
