import {
	NotificationCCReport,
	NotificationCCValues,
} from "@zwave-js/cc/NotificationCC";
import {
	CommandClasses,
	UNKNOWN_STATE,
	type ValueMetadataNumeric,
} from "@zwave-js/core";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"remapNotifications compat flag remaps supported events and metadata during interview",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			commandClasses: [
				{
					ccId: CommandClasses.Notification,
					isSupported: true,
					version: 8,
					supportsV1Alarm: false,
					notificationTypesAndEvents: {
						// Access Control - Manual lock, Manual unlock, Manual not fully locked, Auto lock
						[0x06]: [0x01, 0x02, 0x07, 0x09],
					},
				},
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/remapNotifications",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Track value events to ensure "clear" doesn't fire "value removed"
			const valueRemovedEvents: any[] = [];
			const valueUpdatedEvents: any[] = [];

			node.on("value removed", (_, args) => {
				valueRemovedEvents.push(args);
			});

			node.on("value updated", (_, args) => {
				valueUpdatedEvents.push(args);
			});

			// Verify the compat flag is loaded
			t.expect(node.deviceConfig?.compat?.remapNotifications)
				.toBeDefined();

			// The supported notification events should be remapped:
			// 0x01, 0x02, 0x07, 0x09 should be replaced by 0x18, 0x19
			// (0x07 maps with "clear" and 0x09 with "idle", so they don't add target events)
			const supportedAccessControlEvents: number[] | undefined = node
				.getValue(
					NotificationCCValues.supportedNotificationEvents(0x06).id,
				);

			t.expect(supportedAccessControlEvents).toBeDefined();
			// Should contain the remapped targets
			t.expect(supportedAccessControlEvents).toContain(0x18);
			t.expect(supportedAccessControlEvents).toContain(0x19);
			// Should NOT contain the original events
			t.expect(supportedAccessControlEvents).not.toContain(0x01);
			t.expect(supportedAccessControlEvents).not.toContain(0x02);
			t.expect(supportedAccessControlEvents).not.toContain(0x09);
			t.expect(supportedAccessControlEvents).not.toContain(0x07);

			// Metadata should be created for "Door handle state" variable
			const doorHandleStateId = NotificationCCValues
				.notificationVariable(
					"Access Control",
					"Door handle state",
				).id;
			const metadata = node.getValueMetadata(
				doorHandleStateId,
			) as ValueMetadataNumeric;
			t.expect(metadata).toBeDefined();
			t.expect(metadata.states?.[0x18]).toBe(
				"Window/door handle is open",
			);
			t.expect(metadata.states?.[0x19]).toBe(
				"Window/door handle is closed",
			);

			// Send a "Manual lock operation" (0x01) report - should be remapped to 0x19 (handle closed)
			let cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x01,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			let doorHandleValue = node.getValue(doorHandleStateId);
			t.expect(doorHandleValue).toBe(0x19);

			// Send a "Manual unlock operation" (0x02) report - should be remapped to 0x18 (handle open)
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x02,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			doorHandleValue = node.getValue(doorHandleStateId);
			t.expect(doorHandleValue).toBe(0x18);

			// Now both handle states are set (0x19 from lock, 0x18 from unlock).
			// The "Door handle state" variable tracks the last event, but
			// event 0x18 and 0x19 share the same variable, so only the
			// last one persists. To properly test multi-clear, verify the
			// value is set to undefined after clearing.

			// Clear the event trackers before the clear action
			valueRemovedEvents.length = 0;
			valueUpdatedEvents.length = 0;

			// Send a "Manual not fully locked operation" (0x07) report - should clear both handle events
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x07,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			doorHandleValue = node.getValue(doorHandleStateId);
			t.expect(doorHandleValue).toBe(UNKNOWN_STATE);

			// Verify that "clear" action emits "value updated" with UNKNOWN_STATE, NOT "value removed"
			t.expect(valueRemovedEvents).toHaveLength(0);
			t.expect(valueUpdatedEvents.length).toBeGreaterThan(0);
			const clearEvent = valueUpdatedEvents.find(
				(e) =>
					e.property === "Access Control"
					&& e.propertyKey === "Door handle state",
			);
			t.expect(clearEvent).toBeDefined();
			t.expect(clearEvent.newValue).toBe(UNKNOWN_STATE);

			// Send a "Manual lock operation" (0x01) again to set the value
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x01,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			doorHandleValue = node.getValue(doorHandleStateId);
			t.expect(doorHandleValue).toBe(0x19);

			// Send a "Auto lock operation" (0x09) report - should set both handle events to idle (0)
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x09,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			doorHandleValue = node.getValue(doorHandleStateId);
			t.expect(doorHandleValue).toBe(0);
		},
	},
);
