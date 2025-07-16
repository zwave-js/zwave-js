import { CommandClasses, Indicator } from "@zwave-js/core";
import { pick } from "@zwave-js/shared";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Indicator values exposed to the user are human-friendly and have sensible labels",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				{
					ccId: CommandClasses.Indicator,
					version: 4,
					indicators: {
						[Indicator["Button 1 indication"]]: {
							properties: [
								0x02, // Binary
								0x03, // On/Off Periods
								0x04, // On/Off Cycle count
								0x05, // On/Off Period: On time
							],
						},
						[Indicator["Button 2 indication"]]: {
							properties: [
								0x01, // Multilevel
								0x0A, // Timeout hours
							],
						},
						[Indicator["Button 3 indication"]]: {
							properties: [
								0x02, // Binary
								0x06, // Timeout minutes
							],
						},
					},
				},
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const indicatorValueIds = node.getDefinedValueIDs()
				.filter((vid) => vid.commandClass === CommandClasses.Indicator)
				// Ignore the "identify" value
				.filter((vid) => vid.property !== "identify")
				// Ignore the legacy v1 value
				.filter((vid) => vid.property !== "value");

			const humanReadable = indicatorValueIds.map((vid) => {
				return pick(vid, [
					"propertyName",
					"propertyKeyName",
				]);
			}).sort((a, b) => {
				let result = (a.propertyName ?? "").localeCompare(
					b.propertyName ?? "",
				);
				result ||= (a.propertyKeyName ?? "").localeCompare(
					b.propertyKeyName ?? "",
				);
				return result;
			});

			// There should only be:
			// - 3 binary/multilevel values
			// - 2 timeout values for buttons 2 and 3

			t.expect(humanReadable).toEqual([
				{
					propertyName: "Button 1 indication",
					propertyKeyName: "Binary",
				},
				{
					propertyName: "Button 2 indication",
					propertyKeyName: "Multilevel",
				},
				{
					propertyName: "Button 2 indication",
					propertyKeyName: "Timeout",
				},
				{
					propertyName: "Button 3 indication",
					propertyKeyName: "Binary",
				},
				{
					propertyName: "Button 3 indication",
					propertyKeyName: "Timeout",
				},
			]);
		},
	},
);
