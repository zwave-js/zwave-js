import { test } from "vitest";

import { ControllerGate } from "./ControllerGate.js";

test("close() waits until the previous lease is released", async (t) => {
	const gate = new ControllerGate();
	// Close the gate for a first operation
	const first = await gate.close();
	t.expect(gate.isClosed).toBe(true);

	// Let a second operation wait for the gate
	let secondClosed = false;
	const second = gate.close().then((lease) => {
		secondClosed = true;
		return lease;
	});
	// The second operation must still wait
	await Promise.resolve();
	t.expect(secondClosed).toBe(false);

	// Release the gate to the second operation, then release it again
	first.release();
	(await second).release();
	// Without leases, the gate is open
	t.expect(gate.isClosed).toBe(false);
});

test("Releasing a lease twice does not open the gate for the next operation", async (t) => {
	const gate = new ControllerGate();
	// Close and release the gate, then close it for a second operation
	const first = await gate.close();
	first.release();
	await gate.close();

	// A second release of the old lease must not open the gate
	first.release();
	t.expect(gate.isClosed).toBe(true);
});

test("destroy() opens the gate and rejects the holder and everyone waiting", async (t) => {
	const gate = new ControllerGate();
	const lease = await gate.close();
	const waiting = gate.close();

	gate.seal(new Error("sealed"));

	await t.expect(lease.destroyed).rejects.toThrow("sealed");
	await t.expect(waiting).rejects.toThrow("sealed");
	t.expect(gate.isClosed).toBe(false);

	// A stale release must not affect a new holder
	await gate.close();
	lease.release();
	t.expect(gate.owner).toBe("third");
});
