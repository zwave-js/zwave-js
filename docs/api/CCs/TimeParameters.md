# Time Parameters CC

?> CommandClass ID: `0x8b`

## Time Parameters CC methods

### `get`

```ts
async get(): Promise<MaybeNotKnown<Date>>;
```

### `set`

```ts
async set(
	dateAndTime: Date,
): Promise<SupervisionResult | undefined>;
```
