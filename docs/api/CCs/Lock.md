# Lock CC

?> CommandClass ID: `0x76`

## Lock CC methods

### `get`

```ts
async get(): Promise<MaybeNotKnown<boolean>>;
```

### `set`

```ts
async set(locked: boolean): Promise<SupervisionResult | undefined>;
```

Locks or unlocks the lock.

**Parameters:**

- `locked`: Whether the lock should be locked
