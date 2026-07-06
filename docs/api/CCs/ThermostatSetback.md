# Thermostat Setback CC

?> CommandClass ID: `0x47`

## Thermostat Setback CC methods

### `get`

```ts
async get(): Promise<
	{
		setbackState: SetbackState;
		setbackType: SetbackType;
	} | undefined
>;
```

### `set`

```ts
async set(
	setbackType: SetbackType,
	setbackState: SetbackState,
): Promise<SupervisionResult | undefined>;
```

## Related types

### `SetbackSpecialState`

```ts
type SetbackSpecialState =
	| "Frost Protection"
	| "Energy Saving"
	| "Unused";
```

### `SetbackState`

```ts
type SetbackState = number | SetbackSpecialState;
```

### `SetbackType`

```ts
enum SetbackType {
	None = 0x00,
	Temporary = 0x01,
	Permanent = 0x02,
}
```
