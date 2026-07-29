export class Timer {
	readonly #callback: (...args: any[]) => void;
	readonly #delay?: number;
	readonly #args: any[];

	readonly #inner: NodeJS.Timeout;

	/** @internal */
	constructor(
		callback: (...args: any[]) => void,
		delay?: number,
		...args: any[]
	) {
		this.#callback = callback;
		this.#delay = delay;
		this.#args = args;
		this.#inner = globalThis.setTimeout(callback, delay, ...args);
	}

	/** Clears the timeout. */
	public clear(): void {
		globalThis.clearTimeout(this.#inner);
	}

	public unref(): this {
		// Not supported in browsers
		if (typeof this.#inner.unref === "function") {
			this.#inner.unref();
		}
		return this;
	}

	public refresh(): this {
		if (typeof this.#inner.refresh === "function") {
			this.#inner.refresh();
		} else {
			globalThis.clearTimeout(this.#inner);
			globalThis.setTimeout(this.#callback, this.#delay, ...this.#args);
		}
		return this;
	}
}

export class Interval {
	readonly #inner: NodeJS.Timeout;

	/** @internal */
	constructor(inner: NodeJS.Timeout) {
		this.#inner = inner;
	}

	/** Clears the timeout. */
	public clear(): void {
		globalThis.clearInterval(this.#inner);
	}

	public unref(): this {
		// Not supported in browsers
		if (typeof this.#inner.unref === "function") {
			this.#inner.unref();
		}
		return this;
	}
}

interface ImmediateBackend {
	schedule(
		callback: (...args: any[]) => void,
		args: any[],
	): NodeJS.Immediate | number;
	clear(handle: NodeJS.Immediate | number): void;
}

function createImmediateBackend(): ImmediateBackend {
	// Typed as possibly undefined because only Node has this
	const nativeSetImmediate: typeof globalThis.setImmediate | undefined =
		globalThis.setImmediate;
	if (nativeSetImmediate) {
		return {
			schedule: (callback, args) => nativeSetImmediate(callback, ...args),
			clear: (handle) =>
				globalThis.clearImmediate(handle as NodeJS.Immediate),
		};
	}

	const pending = new Map<
		number,
		{ callback: (...args: any[]) => void; args: any[] }
	>();
	let nextHandle = 1;
	let running = false;

	function run(handle: number): void {
		// Defer while another callback is executing, so callbacks never run nested
		if (running) {
			globalThis.setTimeout(run, 0, handle);
			return;
		}
		const task = pending.get(handle);
		if (!task) return;
		running = true;
		try {
			task.callback(...task.args);
		} finally {
			pending.delete(handle);
			running = false;
		}
	}

	// The Node type definitions describe MessagePort without the DOM methods, and this
	// branch only runs where there is no native setImmediate
	const MessageChannelCtor = globalThis.MessageChannel as unknown as
		| (new () => {
			port1: {
				addEventListener(
					type: "message",
					listener: (event: { data: number }) => void,
				): void;
				start(): void;
			};
			port2: { postMessage(value: number): void };
		})
		| undefined;

	let register: (handle: number) => void;
	if (MessageChannelCtor) {
		// Posting a message queues a task rather than a timer, so neither Node's 1 ms
		// delay floor nor the HTML spec's 4 ms clamp on nested timeouts applies
		const channel = new MessageChannelCtor();
		channel.port1.addEventListener("message", (event) => run(event.data));
		// addEventListener does not implicitly start the port, unlike assigning to onmessage
		channel.port1.start();
		register = (handle) => channel.port2.postMessage(handle);
	} else {
		register = (handle) => {
			globalThis.setTimeout(run, 0, handle);
		};
	}

	return {
		schedule: (callback, args) => {
			const handle = nextHandle++;
			pending.set(handle, { callback, args });
			register(handle);
			return handle;
		},
		clear: (handle) => {
			pending.delete(handle as number);
		},
	};
}

const immediateBackend = createImmediateBackend();

export class Immediate {
	readonly #inner: NodeJS.Immediate | number;

	/** @internal */
	constructor(callback: (...args: any[]) => void, args: any[]) {
		this.#inner = immediateBackend.schedule(callback, args);
	}

	/** Cancels the callback if it has not run yet. */
	public clear(): void {
		immediateBackend.clear(this.#inner);
	}
}

export function setTimer<TArgs extends any[]>(
	callback: (...args: TArgs) => void,
	delay?: number,
	...args: TArgs
): Timer {
	return new Timer(
		callback,
		delay,
		...args,
	);
}

export function setInterval<TArgs extends any[]>(
	callback: (...args: TArgs) => void,
	delay?: number,
	...args: TArgs
): Interval {
	return new Interval(globalThis.setInterval(callback, delay, ...args));
}

/**
 * Schedules the callback to run in a later task, once the microtask queue has drained.
 * This uses Node's `setImmediate` where available, so its ordering relative to timers
 * and I/O is whatever the runtime provides.
 */
export function setImmediate<TArgs extends any[]>(
	callback: (...args: TArgs) => void,
	...args: TArgs
): Immediate {
	return new Immediate(callback, args);
}
