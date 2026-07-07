# Shared types

The following types are accepted or returned by many different Command Class APIs. They are documented centrally here and referenced from the individual API pages.

## `SupervisionResult`

<!-- #import SupervisionResult from "@zwave-js/core" -->

```ts
type SupervisionResult =
	| {
		status:
			| SupervisionStatus.NoSupport
			| SupervisionStatus.Fail
			| SupervisionStatus.Success;
		remainingDuration?: undefined;
	}
	| {
		status: SupervisionStatus.Working;
		remainingDuration: Duration;
	};
```

Commands that support _Supervision_ resolve with a `SupervisionResult` (or `undefined` if the command was not supervised or the node did not respond). It indicates whether the node succeeded in executing the command.

## `SupervisionStatus`

<!-- #import SupervisionStatus from "@zwave-js/core" -->

```ts
enum SupervisionStatus {
	NoSupport = 0x00,
	Working = 0x01,
	Fail = 0x02,
	Success = 0xff,
}
```

## `Duration`

<!-- #import Duration from "@zwave-js/core" -->

```ts
interface Duration {
	unit: DurationUnit;
	value: number;
}
```

Some commands accept or report a transition duration, e.g. how long a light takes to dim to the target brightness. Where a `Duration` is accepted, a string like `"2m5s"` or `"default"` can usually be passed instead.

## `DurationUnit`

<!-- #import DurationUnit from "@zwave-js/core" -->

```ts
type DurationUnit = "seconds" | "minutes" | "unknown" | "default";
```

## `MaybeNotKnown`

```ts
type MaybeNotKnown<T> = T | undefined;
```

A value of type `MaybeNotKnown<T>` is either of type `T`, or `undefined` when the driver has no information about it, e.g. because the node has not been queried yet.

## `MaybeUnknown`

```ts
type MaybeUnknown<T> = T | null;
```

A value of type `MaybeUnknown<T>` is either of type `T`, or `null` when the device affirmatively reported that its current state is unknown. Unlike [`MaybeNotKnown`](#maybenotknown), this is an answer from the device, not missing information.

## `SecurityClass`

<!-- #import SecurityClass from "@zwave-js/core" -->

```ts
enum SecurityClass {
	/**
	 * Used internally during inclusion of a node. Don't use this!
	 */
	Temporary = -2,
	/**
	 * `None` is used to indicate that a node is included without security.
	 * It is not meant as input to methods that accept a security class.
	 */
	None = -1,
	S2_Unauthenticated = 0,
	S2_Authenticated = 1,
	S2_AccessControl = 2,
	S0_Legacy = 7,
}
```

## `Scale`

<!-- #import Scale from "@zwave-js/core" -->

```ts
interface Scale {
	readonly label: string;
	readonly unit?: string;
	readonly description?: string;
	readonly key: number;
}
```

The unit and presentation information for a sensor reading, resolved from the Z-Wave specifications.

## `Timeout`

<!-- #import Timeout from "@zwave-js/core" -->

```ts
interface Timeout {
	unit: TimeoutUnit;
	value: number;
}
```

## `TimeoutUnit`

<!-- #import TimeoutUnit from "@zwave-js/core" -->

```ts
type TimeoutUnit = "seconds" | "minutes" | "none" | "infinite";
```
