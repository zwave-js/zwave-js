import { UserCredentialAdminCodeOperationResult } from "@zwave-js/cc";
import { UserCredentialCCAdminPinCodeReport } from "@zwave-js/cc/UserCredentialCC";
import { ApplicationCommandRequest } from "@zwave-js/serial/serialapi";
import type { ThrowingMap } from "@zwave-js/shared";
import { MockController } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { test } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../../Testing.js";
import { createAndStartTestingDriver } from "../../driver/DriverMock.js";
import { ZWaveNode } from "../../node/Node.js";

test.sequential(
	"a report that is received while the driver is being destroyed does not cause an unhandled rejection",
	async () => {
		const { driver, mockPort } = await createAndStartTestingDriver({
			loadConfiguration: false,
			skipNodeInterview: true,
			async beforeStartup(mockPort, serial) {
				const controller = await MockController.create({
					mockPort,
					serial,
				});
				controller.defineBehavior(
					...createDefaultMockControllerBehaviors(),
				);
			},
		});

		const node = new ZWaveNode(1, driver);
		(driver.controller.nodes as ThrowingMap<number, ZWaveNode>).set(
			node.id,
			node,
		);

		const req = new ApplicationCommandRequest({
			command: new UserCredentialCCAdminPinCodeReport({
				nodeId: node.id,
				operationResult:
					UserCredentialAdminCodeOperationResult.Modified,
				pinCode: "9876",
			}),
		});
		const data = await req.serialize(driver["getEncodingContext"]());

		// Destroy the driver while the frame is still in the receive pipeline,
		// so persisting its values would hit the closed value DB
		mockPort.emitData(data);
		await driver.destroy();

		// Give the pending frame handling a chance to run
		await wait(100);
	},
);
