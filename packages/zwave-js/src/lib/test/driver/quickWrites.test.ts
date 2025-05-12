import { GetControllerIdResponse } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"The driver should not crash when ACKing lots of frames",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			// Simulate a slow (realistic) serialport
			mockController.mockPort.writeDelay = 5;

			const res = new GetControllerIdResponse({
				homeId: 0xdeadbeef,
				ownNodeId: 1,
			});
			const resBuffer = await res.serialize(
				driver["getEncodingContext"](),
			);

			const data = Bytes.concat([
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
				resBuffer,
			]);
			mockController.mockPort.emitData(data);

			// Ensure the driver ACKed 10 messages
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
			await mockController.expectHostACK(1000);
		},
	},
);
