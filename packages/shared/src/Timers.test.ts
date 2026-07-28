import { afterEach, test, vi } from "vitest";
import * as nativeTimers from "./Timers.js";

/**
 * Re-imports the module with the given globals removed, so the tests also cover
 * the MessageChannel and setTimeout fallbacks used on non-Node runtimes.
 */
async function importWithout(
	...globals: string[]
): Promise<typeof import("./Timers.js")> {
	vi.resetModules();
	for (const name of globals) {
		vi.stubGlobal(name, undefined);
	}
	try {
		return await import("./Timers.js");
	} finally {
		vi.unstubAllGlobals();
	}
}

const variants: [
	name: string,
	load: () => Promise<
		typeof import("./Timers.js")
	>,
][] = [
	["native setImmediate", () => Promise.resolve(nativeTimers)],
	["MessageChannel fallback", () => importWithout("setImmediate")],
	[
		"setTimeout fallback",
		() => importWithout("setImmediate", "MessageChannel"),
	],
];

afterEach(() => {
	vi.resetModules();
});

for (const [variant, load] of variants) {
	test(`${variant}: invokes the callback asynchronously`, async (t) => {
		const timers = await load();
		let called = false;
		timers.setImmediate(() => {
			called = true;
		});
		t.expect(called).toBe(false);

		await new Promise<void>((resolve) => timers.setImmediate(resolve));
		t.expect(called).toBe(true);
	});

	test(`${variant}: forwards additional arguments to the callback`, async (t) => {
		const timers = await load();
		const actual = await new Promise<[number, string]>((resolve) => {
			timers.setImmediate(
				(a: number, b: string) => resolve([a, b]),
				1,
				"foo",
			);
		});
		t.expect(actual).toStrictEqual([1, "foo"]);
	});

	test(`${variant}: clear() prevents the callback from running`, async (t) => {
		const timers = await load();
		let called = false;
		const immediate = timers.setImmediate(() => {
			called = true;
		});
		immediate.clear();

		// Yield twice, so an uncleared callback would have had a chance to run
		await new Promise<void>((resolve) => timers.setImmediate(resolve));
		await new Promise<void>((resolve) => timers.setImmediate(resolve));
		t.expect(called).toBe(false);
	});
}
