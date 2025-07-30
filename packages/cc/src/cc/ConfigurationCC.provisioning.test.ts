import { CommandClasses, type ProvisioningConfigParameter } from "@zwave-js/core";
import { test } from "vitest";
import type { ConfigurationCC } from "./ConfigurationCC.js";

test("ConfigurationCC: provisioning config parameters type is properly exported", (t) => {
	// This test ensures that the ProvisioningConfigParameter type is properly accessible
	const param: ProvisioningConfigParameter = {
		parameter: 1,
		value: 123,
	};
	
	// Test that the type includes all expected properties
	t.expect(typeof param.parameter).toBe("number");
	t.expect(typeof param.value).toBe("number");
	t.expect(param.bitMask).toBeUndefined();
});

test("ConfigurationCC: provisioning config parameters with bitmask", (t) => {
	// Test that partial parameters work correctly
	const param: ProvisioningConfigParameter = {
		parameter: 2,
		bitMask: 0x01,
		value: 1,
	};
	
	t.expect(param.parameter).toBe(2);
	t.expect(param.bitMask).toBe(0x01);
	t.expect(param.value).toBe(1);
});