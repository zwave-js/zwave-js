import { test } from "vitest";
import type { ConfigurationCCAPISetOptions } from "./ConfigurationCC.js";

test("ConfigurationCCAPISetOptions type includes confirm property", (t) => {
	const options1: ConfigurationCCAPISetOptions = {
		parameter: 1,
		value: 5,
		confirm: true,
	};
	t.expect(options1.confirm).toBe(true);

	const options2: ConfigurationCCAPISetOptions = {
		parameter: 1,
		value: 5,
	};
	t.expect(options2.confirm).toBeUndefined();
});

test("ConfigurationCCAPISetOptions variants with confirm", (t) => {
	const variant1: ConfigurationCCAPISetOptions = {
		parameter: 1,
		value: 5,
		confirm: true,
	};
	t.expect(variant1.confirm).toBe(true);

	const variant2: ConfigurationCCAPISetOptions = {
		parameter: 1,
		value: 5,
		valueSize: 1,
		valueFormat: 0,
		confirm: false,
	};
	t.expect(variant2.confirm).toBe(false);

	const variant3: ConfigurationCCAPISetOptions = {
		parameter: 1,
		bitMask: 0xff00,
		value: 5,
		confirm: true,
	};
	t.expect(variant3.confirm).toBe(true);
});