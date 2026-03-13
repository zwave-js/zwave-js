# Node Naming and Location CC

?> CommandClass ID: `0x77`

## Node Naming and Location CC methods

### `getName`

```ts
async getName(): Promise<MaybeNotKnown<string>>;
```

### `setName`

```ts
async setName(name: string): Promise<SupervisionResult | undefined>;
```

### `getLocation`

```ts
async getLocation(): Promise<MaybeNotKnown<string>>;
```

### `setLocation`

```ts
async setLocation(
	location: string,
): Promise<SupervisionResult | undefined>;
```
