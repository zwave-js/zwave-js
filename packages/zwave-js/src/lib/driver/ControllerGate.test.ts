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

test("release() hands the gate to the next waiting operation without opening it", async (t) => {
	const gate = new ControllerGate();
	// Let a second operation wait behind the first
	const first = await gate.close();
	const second = gate.close();

	// Hand the gate over
	first.release();
	// Checked synchronously, before anyone could start a transaction
	t.expect(gate.isClosed).toBe(true);

	// The gate opens once the last lease is released
	(await second).release();
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

test("seal() aborts the current lease, rejects everyone waiting and keeps the gate closed", async (t) => {
	const gate = new ControllerGate();
	// Close the gate and let a second operation wait
	const lease = await gate.close();
	const waiting = gate.close();

	gate.seal(new Error("sealed"));

	// The current lease is aborted and the waiting operation is rejected
	t.expect(lease.signal.aborted).toBe(true);
	await t.expect(waiting).rejects.toThrow("sealed");
	// The gate stays closed and rejects new operations
	t.expect(gate.isClosed).toBe(true);
	await t.expect(gate.close()).rejects.toThrow("sealed");

	// A release of the aborted lease does not open the gate either
	lease.release();
	t.expect(gate.isClosed).toBe(true);
});

test("A lease handed over right before seal() is aborted", async (t) => {
	const gate = new ControllerGate();
	// Hand the gate to a second operation and seal it right after
	const first = await gate.close();
	const second = gate.close();

	first.release();
	gate.seal(new Error("sealed"));

	// The lease of the second operation must be aborted
	t.expect((await second).signal.aborted).toBe(true);
});

test("whenClosed() resolves once the gate is closed", async (t) => {
	const gate = new ControllerGate();
	let resolved = false;
	void gate.whenClosed().then(() => {
		resolved = true;
	});
	await Promise.resolve();
	t.expect(resolved).toBe(false);

	const lease = await gate.close();
	await Promise.resolve();
	t.expect(resolved).toBe(true);

	lease.release();
	resolved = false;
	void gate.whenClosed().then(() => {
		resolved = true;
	});
	await Promise.resolve();
	t.expect(resolved).toBe(false);
});
