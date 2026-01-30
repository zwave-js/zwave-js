# Energy Production CC

?> CommandClass ID: `0x90`

## Energy Production CC methods

### `get`

```ts
async get(
	parameter: EnergyProductionParameter,
): Promise<MaybeNotKnown<{ value: number; scale: EnergyProductionScale }>>;
```
