# Manufacturer Proprietary CC

?> CommandClass ID: `0x91`

## Manufacturer Proprietary CC methods

### `sendData`

```ts
async sendData(
	manufacturerId: number,
	data?: BytesView,
): Promise<void>;
```

### `sendAndReceiveData`

```ts
async sendAndReceiveData(manufacturerId: number, data?: BytesView): Promise<{ manufacturerId: number | undefined; data: Bytes; } | undefined>;
```
