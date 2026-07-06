# Multi Channel CC

?> CommandClass ID: `0x60`

## Multi Channel CC methods

### `getEndpoints`

```ts
async getEndpoints(): Promise<
	{
		isDynamicEndpointCount: boolean;
		identicalCapabilities: boolean;
		individualEndpointCount: number;
		aggregatedEndpointCount: MaybeNotKnown<number>;
	} | undefined
>;
```

### `getEndpointCapabilities`

```ts
async getEndpointCapabilities(
	endpoint: number,
): Promise<MaybeNotKnown<EndpointCapability>>;
```

### `findEndpoints`

```ts
async findEndpoints(
	genericClass: number,
	specificClass: number,
): Promise<MaybeNotKnown<readonly number[]>>;
```

### `getAggregatedMembers`

```ts
async getAggregatedMembers(
	endpoint: number,
): Promise<MaybeNotKnown<readonly number[]>>;
```

### `sendEncapsulated`

```ts
async sendEncapsulated(
	options: {
		encapsulated: CommandClass;
		destination: MultiChannelCCDestination;
	},
): Promise<void>;
```

### `getEndpointCountV1`

```ts
async getEndpointCountV1(
	ccId: CommandClasses,
): Promise<MaybeNotKnown<number>>;
```

### `sendEncapsulatedV1`

```ts
async sendEncapsulatedV1(encapsulated: CommandClass): Promise<void>;
```

## Related types

### `EndpointCapability`

```ts
interface EndpointCapability {
	generic: GenericDeviceClass;
	specific: SpecificDeviceClass;
	supportedCCs: CommandClasses[];
	isDynamic: boolean;
	wasRemoved: boolean;
}
```

### `GenericDeviceClass`

```ts
interface GenericDeviceClass {
	readonly key: number;
	readonly label: string;
	readonly zwavePlusDeviceType?: string;
	readonly requiresSecurity: boolean;
	readonly maySupportBasicCC: boolean;
	readonly isSlowActuator: boolean;
}
```

### `MultiChannelCCDestination`

```ts
type MultiChannelCCDestination = number | (1 | 2 | 3 | 4 | 5 | 6 | 7)[];
```

### `SpecificDeviceClass`

```ts
type SpecificDeviceClass = GenericDeviceClass;
```
