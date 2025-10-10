import {
	ConfigurationCCInfoReport,
	TransportServiceCCFirstSegment,
	TransportServiceCCSegmentComplete,
	TransportServiceCCSegmentRequest,
	TransportServiceCCSegmentWait,
	TransportServiceCCSubsequentSegment,
} from "@zwave-js/cc";
import {
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Receiving Transport Service commands works (happy path)", {
	// debug: true,

	async testBody(t, driver, node, mockController, mockNode) {
		const cc = new ConfigurationCCInfoReport({
			nodeId: 2,
			parameter: 1,
			reportsToFollow: 0,
			info:
				"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
		});
		const ccBuffer = await cc.serialize(mockNode.encodingContext);
		const part1 = ccBuffer.slice(0, 39);
		const part2 = ccBuffer.slice(39, 78);
		const part3 = ccBuffer.slice(78);

		const awaitedCommand = driver.waitForCommand(
			(cc) => cc instanceof ConfigurationCCInfoReport,
			1000,
		);

		const frame1 = new TransportServiceCCFirstSegment({
			nodeId: 2,
			sessionId: 1,
			datagramSize: part1.length + part2.length + part3.length,
			partialDatagram: part1,
		});

		const frame2 = new TransportServiceCCSubsequentSegment({
			nodeId: 2,
			sessionId: 1,
			datagramSize: frame1.datagramSize,
			datagramOffset: part1.length,
			partialDatagram: part2,
		});

		const frame3 = new TransportServiceCCSubsequentSegment({
			nodeId: 2,
			sessionId: 1,
			datagramSize: frame1.datagramSize,
			datagramOffset: part1.length + part2.length,
			partialDatagram: part3,
		});

		await mockNode.sendToController(createMockZWaveRequestFrame(frame1));
		await wait(30);
		await mockNode.sendToController(createMockZWaveRequestFrame(frame2));
		await wait(30);
		await mockNode.sendToController(createMockZWaveRequestFrame(frame3));

		// The node should have received the confirmation
		await mockNode.expectControllerFrame(
			(f): f is MockZWaveRequestFrame =>
				f.type === MockZWaveFrameType.Request
				&& f.payload instanceof TransportServiceCCSegmentComplete,
			{
				timeout: 100,
			},
		);

		// And the ConfigurationCCInfoReport should have been assembled correctly
		const received = await awaitedCommand;
		t.expect(received).toBeInstanceOf(ConfigurationCCInfoReport);
		t.expect(received.info).toBe(cc.info);
	},
});

integrationTest(
	"Receiving Transport Service commands works (first segment missing)",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const cc = new ConfigurationCCInfoReport({
				nodeId: 2,
				parameter: 1,
				reportsToFollow: 0,
				info:
					"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
			});
			const ccBuffer = await cc.serialize(mockNode.encodingContext);
			const part1 = ccBuffer.slice(0, 39);
			const part2 = ccBuffer.slice(39, 78);
			const part3 = ccBuffer.slice(78);

			const frame1 = new TransportServiceCCFirstSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: part1.length + part2.length + part3.length,
				partialDatagram: part1,
			});

			const frame2 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length,
				partialDatagram: part2,
			});

			const frame3 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length + part2.length,
				partialDatagram: part3,
			});

			// Frame 1 went missing
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame2),
			);

			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentWait
					&& f.payload.pendingSegments === 0,
				{
					timeout: 50,
				},
			);

			mockNode.assertReceivedControllerFrame(
				(f) =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentComplete,
				{
					noMatch: true,
				},
			);
		},
	},
);

integrationTest(
	"Receiving Transport Service commands works (subsequent segment missing)",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const cc = new ConfigurationCCInfoReport({
				nodeId: 2,
				parameter: 1,
				reportsToFollow: 0,
				info:
					"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
			});
			const ccBuffer = await cc.serialize(mockNode.encodingContext);
			const part1 = ccBuffer.slice(0, 39);
			const part2 = ccBuffer.slice(39, 78);
			const part3 = ccBuffer.slice(78);

			const awaitedCommand = driver.waitForCommand(
				(cc) => cc instanceof ConfigurationCCInfoReport,
				1000,
			);

			const frame1 = new TransportServiceCCFirstSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: part1.length + part2.length + part3.length,
				partialDatagram: part1,
			});

			const frame2 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length,
				partialDatagram: part2,
			});

			const frame3 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length + part2.length,
				partialDatagram: part3,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame1),
			);
			await wait(30);
			// await mockNode.sendToController(createMockZWaveRequestFrame(frame2));
			await wait(30);
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame3),
			);

			// The node should have received a request for the missing frame
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentRequest
					&& f.payload.datagramOffset === part1.length,
				{
					timeout: 50,
				},
			);

			// Send the requested frame
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame2),
			);
			// Now, the node should have received the confirmation
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentComplete,
				{
					timeout: 50,
				},
			);

			// And the ConfigurationCCInfoReport should have been assembled correctly
			const received = await awaitedCommand;
			t.expect(received).toBeInstanceOf(ConfigurationCCInfoReport);
			t.expect(received.info).toBe(
				cc.info,
			);
		},
	},
);

integrationTest(
	"Receiving Transport Service commands works (last segment missing)",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const cc = new ConfigurationCCInfoReport({
				nodeId: 2,
				parameter: 1,
				reportsToFollow: 0,
				info:
					"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
			});
			const ccBuffer = await cc.serialize(mockNode.encodingContext);
			const part1 = ccBuffer.slice(0, 39);
			const part2 = ccBuffer.slice(39, 78);
			const part3 = ccBuffer.slice(78);

			const awaitedCommand = driver.waitForCommand(
				(cc) => cc instanceof ConfigurationCCInfoReport,
				3000,
			);

			const frame1 = new TransportServiceCCFirstSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: part1.length + part2.length + part3.length,
				partialDatagram: part1,
			});

			const frame2 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length,
				partialDatagram: part2,
			});

			const frame3 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length + part2.length,
				partialDatagram: part3,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame1),
			);
			await wait(30);
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame2),
			);
			// Last segment is missing

			// The node should have received a request for the missing frame
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentRequest
					&& f.payload.datagramOffset === frame3.datagramOffset,
				{
					timeout: 1000,
				},
			);

			// Send the requested frame
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame3),
			);
			// Now, the node should have received the confirmation
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentComplete,
				{
					timeout: 50,
				},
			);

			// And the ConfigurationCCInfoReport should have been assembled correctly
			const received = await awaitedCommand;
			t.expect(received).toBeInstanceOf(ConfigurationCCInfoReport);
			t.expect(received.info).toBe(
				cc.info,
			);
		},
	},
);

integrationTest(
	"Receiving Transport Service commands works (SegmentComplete missing)",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const cc = new ConfigurationCCInfoReport({
				nodeId: 2,
				parameter: 1,
				reportsToFollow: 0,
				info:
					"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
			});
			const ccBuffer = await cc.serialize(mockNode.encodingContext);
			const part1 = ccBuffer.slice(0, 39);
			const part2 = ccBuffer.slice(39, 78);
			const part3 = ccBuffer.slice(78);

			const awaitedCommand = driver.waitForCommand(
				(cc) => cc instanceof ConfigurationCCInfoReport,
				1000,
			);

			const frame1 = new TransportServiceCCFirstSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: part1.length + part2.length + part3.length,
				partialDatagram: part1,
			});

			const frame2 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length,
				partialDatagram: part2,
			});

			const frame3 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length + part2.length,
				partialDatagram: part3,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame1),
			);
			await wait(30);
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame2),
			);
			await wait(30);
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame3),
			);

			// The node should have received the confirmation
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentComplete,
				{
					timeout: 100,
				},
			);
			mockNode.clearReceivedControllerFrames();

			// And the ConfigurationCCInfoReport should have been assembled correctly
			const received = await awaitedCommand;
			t.expect(received).toBeInstanceOf(ConfigurationCCInfoReport);
			t.expect(received.info).toBe(
				cc.info,
			);

			// Simulate the SegmentComplete being lost. The node should send the last segment again

			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame3),
			);

			// The node should have received the confirmation again
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentComplete,
				{
					timeout: 100,
				},
			);
			mockNode.clearReceivedControllerFrames();
		},
	},
);

integrationTest(
	"Do not crash on communication errors when requesting missing segments",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const cc = new ConfigurationCCInfoReport({
				nodeId: 2,
				parameter: 1,
				reportsToFollow: 0,
				info:
					"Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong text",
			});
			const ccBuffer = await cc.serialize(mockNode.encodingContext);
			const part1 = ccBuffer.slice(0, 39);
			const part2 = ccBuffer.slice(39, 78);
			const part3 = ccBuffer.slice(78);

			const frame1 = new TransportServiceCCFirstSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: part1.length + part2.length + part3.length,
				partialDatagram: part1,
			});

			const frame2 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length,
				partialDatagram: part2,
			});

			const frame3 = new TransportServiceCCSubsequentSegment({
				nodeId: 2,
				sessionId: 1,
				datagramSize: frame1.datagramSize,
				datagramOffset: part1.length + part2.length,
				partialDatagram: part3,
			});

			// Send the first segment to the controller
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame1),
			);
			await wait(30);

			// Immediately stop acknowledging frames, so the controller's request fails with NoACK
			mockNode.autoAckControllerFrames = false;
			// We must not send the last frame here, or the issue won't happen

			// The controller should request the missing frame after a while
			// The controller should request the missing frame
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof TransportServiceCCSegmentRequest
					&& f.payload.datagramOffset === part1.length,
				{
					timeout: 1100,
				},
			);

			// Send it
			await mockNode.sendToController(
				createMockZWaveRequestFrame(frame2),
			);

			// Wait for 2 seconds to ensure there is no uncaught error
			await wait(2000);
		},
	},
);
