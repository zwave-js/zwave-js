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

const vendorWithStringDeviceId = {
	manufacturerId: 0x1234,
	productType: 0x5678,
	productId: 0x9abc,
	deviceId: "test-device-id",
};

integrationTest("Device Specific Get returns a configured string device ID", {
	additionalDriverOptions: { vendor: vendorWithStringDeviceId },

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
			t.expect(response.deviceId).toBe(
				vendorWithStringDeviceId.deviceId,
			);
		}
	},
});

integrationTest(
	"Device Specific Get returns a configured binary device ID",
	{
		additionalDriverOptions: {
			vendor: {
				...vendorWithStringDeviceId,
				deviceId: Uint8Array.from([0x12, 0x34, 0x56, 0x78]),
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const request = new ManufacturerSpecificCCDeviceSpecificGet({
				nodeId: mockController.ownNodeId,
				deviceIdType: DeviceIdType.FactoryDefault,
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
			t.expect(response.deviceId).toBe("0x12345678");
		},
	},
);

integrationTest(
	"Device Specific Get returns a pseudo-random fallback device ID",
	{
		testBody: async (t, driver, node, mockController, mockNode) => {
			const request = new ManufacturerSpecificCCDeviceSpecificGet({
				nodeId: mockController.ownNodeId,
				deviceIdType: DeviceIdType.FactoryDefault,
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

			t.expect(response.type).toBe(DeviceIdType.PseudoRandom);
			t.expect(response.deviceId).toMatch(/^0x[0-9a-f]{32}$/);
		},
	},
);
