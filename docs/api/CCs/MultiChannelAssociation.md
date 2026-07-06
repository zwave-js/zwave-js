# Multi Channel Association CC

?> CommandClass ID: `0x8e`

## Multi Channel Association CC methods

### `getGroupCount`

```ts
async getGroupCount(): Promise<MaybeNotKnown<number>>;
```

Returns the number of association groups a node supports.
Association groups are consecutive, starting at 1.

### `reportGroupCount`

```ts
async reportGroupCount(groupCount: number): Promise<void>;
```

### `getGroup`

```ts
async getGroup(groupId: number): Promise<
	{
		endpoints: EndpointAddress[];
		maxNodes: number;
		nodeIds: number[];
	} | undefined
>;
```

Returns information about an association group.

### `sendReport`

```ts
async sendReport(
	options: {
		groupId: number;
		maxNodes: number;
		nodeIds: number[];
		endpoints: EndpointAddress[];
		reportsToFollow: number;
	},
): Promise<void>;
```

### `addDestinations`

```ts
async addDestinations(
	options: {
		groupId: number;
		nodeIds: number[];
	},
): Promise<SupervisionResult | undefined>;

async addDestinations(
	options: {
		groupId: number;
		endpoints: EndpointAddress[];
	},
): Promise<SupervisionResult | undefined>;

async addDestinations(
	options: {
		groupId: number;
		nodeIds: number[];
		endpoints: EndpointAddress[];
	},
): Promise<SupervisionResult | undefined>;
```

Adds new nodes or endpoints to an association group.

### `removeDestinations`

```ts
async removeDestinations(
	options: {
		/** The group from which to remove the nodes. If none is specified, the nodes will be removed from all groups. */
		groupId?: number;
		/** The nodes to remove. If no nodeIds and no endpoint addresses are specified, ALL nodes will be removed. */
		nodeIds?: number[];
		/** The single endpoints to remove. If no nodeIds and no endpoint addresses are specified, ALL will be removed. */
		endpoints?: EndpointAddress[];
	},
): Promise<SupervisionResult | undefined>;
```

Removes nodes or endpoints from an association group.

## Related types

### `EndpointAddress`

```ts
interface EndpointAddress {
	nodeId: number;
	endpoint: number | number[];
}
```
