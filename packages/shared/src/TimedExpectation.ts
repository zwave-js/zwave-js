import { type Timer, setTimer } from "./Timers.js";

/** Allows waiting for something for a given amount of time, after which the expectation will automatically be rejected. */
export class TimedExpectation<TResult = void, TPredicate = never>
	implements PromiseLike<TResult>
{
	public constructor(
		timeoutMs: number,
		predicate?: (input: TPredicate) => boolean,
		timeoutErrorMessage: string =
			"Expectation was not fulfilled within the timeout",
		preventDefault: boolean = false,
	) {
		this.resolver = Promise.withResolvers<TResult>();
		this.timeout = setTimer(() => this.reject(), timeoutMs);
		this.timeoutErrorMessage = timeoutErrorMessage;
		this.predicate = predicate;
		this.preventDefault = preventDefault;

		// We need create the stack on a temporary object or the Error
		// class will try to print the message
		const tmp = { message: "" };
		Error.captureStackTrace(tmp, TimedExpectation);
		this.stack = (tmp as any).stack.replace(/^Error:?\s*\n/, "");
	}

	private readonly resolver: PromiseWithResolvers<TResult>;
	private timeout?: Timer;
	private _done: boolean = false;
	private readonly timeoutErrorMessage: string;
	public readonly predicate?: (input: TPredicate) => boolean;
	public readonly preventDefault: boolean;

	/** The stack trace where the timed expectation was created */
	public readonly stack: string;

	public resolve(result: TResult): void {
		if (this._done) return;

		this.timeout?.clear();
		this.resolver.resolve(result);
	}

	private reject(): void {
		if (this._done) return;

		this.timeout?.clear();
		const err = new Error(this.timeoutErrorMessage);
		err.stack = this.stack;
		this.resolver.reject(err);
	}

	// Make this await-able
	// oxlint-disable-next-line no-thenable
	then<TResult1 = TResult, TResult2 = never>(
		onfulfilled?:
			| ((value: TResult) => TResult1 | PromiseLike<TResult1>)
			| null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
	): PromiseLike<TResult1 | TResult2> {
		return this.resolver.promise.then(onfulfilled, onrejected);
	}
}
