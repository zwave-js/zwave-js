import {
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
} from "@zwave-js/cc";
import { CommandClasses, SecurityClass } from "@zwave-js/core";
import {
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"S0 Commands Supported Get is answered on an S2-enabled node",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Security,
				CommandClasses["Security 2"],
			],
			securityClasses: new Set([
				SecurityClass.S2_AccessControl,
				SecurityClass.S0_Legacy,
			]),
		},

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (_t, _driver, node, mockController, mockNode) => {
			node.addCC(CommandClasses.Security, {
				isSupported: true,
				version: 1,
			});
			node.addCC(CommandClasses["Security 2"], {
				isSupported: true,
				version: 1,
			});
			node.setSecurityClass(SecurityClass.S0_Legacy, true);
			node.setSecurityClass(SecurityClass.S2_AccessControl, true);

			const nonceGet = new SecurityCCNonceGet({
				nodeId: mockController.ownNodeId,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(nonceGet, {
					ackRequested: false,
				}),
			);
			const nonceReport = await mockNode.expectControllerFrame(
				(
					frame,
				): frame is MockZWaveFrame & {
					type: MockZWaveFrameType.Request;
					payload: SecurityCCNonceReport;
				} => frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SecurityCCNonceReport,
			);

			mockNode.clearReceivedControllerFrames();

			const command = SecurityCC.encapsulate(
				mockNode.id,
				mockNode.securityManagers.securityManager!,
				new SecurityCCCommandsSupportedGet({
					nodeId: mockController.ownNodeId,
				}),
			);
			command.nonce = nonceReport.payload.nonce;
			await mockNode.sendToController(
				createMockZWaveRequestFrame(command, {
					ackRequested: false,
				}),
			);
			await wait(500);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof SecurityCCCommandEncapsulation
					&& frame.payload.encapsulated
						instanceof SecurityCCCommandsSupportedReport
					&& frame.payload.encapsulated.supportedCCs.length === 0
					&& frame.payload.encapsulated.controlledCCs.length === 0,
				{
					errorMessage:
						"Expected an empty S0 Commands Supported Report",
				},
			);
		},
	},
);
