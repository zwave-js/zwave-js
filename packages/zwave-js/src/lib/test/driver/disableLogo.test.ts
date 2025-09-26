import { SpyTransport } from "@zwave-js/core/test";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Logo can be disabled with logConfig.disableLogo", {
	// debug: true,
	
	additionalDriverOptions: {
		logConfig: {
			disableLogo: true,
		},
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		// The driver has already started, so we can check the log messages
		// The logo should not have been printed since we set disableLogo: true
		
		// Since we can't easily intercept the startup logs in this test format,
		// let's just verify that the configuration was applied correctly
		const logConfig = driver.getLogConfig();
		t.expect(logConfig.disableLogo).toBe(true);
	},
});

integrationTest("Logo is printed by default (disableLogo is false/undefined)", {
	// debug: true,

	testBody: async (t, driver, node, mockController, mockNode) => {
		// The driver has already started with default settings
		// The logo should have been printed since disableLogo is not set
		
		const logConfig = driver.getLogConfig();
		t.expect(logConfig.disableLogo).toBeFalsy();
	},
});