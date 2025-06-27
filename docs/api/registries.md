# Registries

Z-Wave JS provides access to static information about meters, sensors, notifications, device classes, and scales that are defined in the Z-Wave specification.

This information can be accessed through the functions documented below, all of which are available through the following modules:

- `@zwave-js/core` (main export)
- `@zwave-js/core/registries` (subpath export)

## Meters

The meter registry provides information about different types of meters (Electric, Gas, Water, etc.) and their supported scales. Each meter has a type (identified by a number) and can support multiple scales for different units of measurement.

The Z-Wave specification defines the following meter types:

| Meter Type | Name     | Scales                                            |
| ---------- | -------- | ------------------------------------------------- |
| 0x01       | Electric | kWh, kVAh, W, V, A, Power Factor, kVar, kVarh     |
| 0x02       | Gas      | Cubic meters, Cubic feet, Pulse count             |
| 0x03       | Water    | Cubic meters, Cubic feet, US gallons, Pulse count |
| 0x04       | Heating  | kWh                                               |
| 0x05       | Cooling  | kWh                                               |

### `getMeter`

```ts
getMeter(type: number): Meter | undefined
```

Returns the meter definition for a given meter type, if it exists. The returned object has the following structure:

```ts
interface Meter {
	readonly key: number;
	readonly name: string;
	readonly scales: MeterScaleGroup;
}
```

The `scales` property is a record where the keys are scale identifiers and the values are objects containing the scale's label and optional unit:

```ts
type MeterScaleGroup = Record<
	number, // Scale key/identifier
	{
		readonly label: string;
		readonly unit?: string;
	}
>;
```

### `getAllMeters`

```ts
getAllMeters(): Meter[]
```

Returns all available meter definitions.

### `getMeterName`

```ts
getMeterName(meterType: number): string
```

Returns the human-readable name of a meter type.

### `getMeterScale`

```ts
getMeterScale(type: number, scale: number): MeterScale | undefined
```

Returns the scale definition for a specific meter type and scale. The returned object contains the scale's key, label, and optional unit:

```ts
interface MeterScale {
	readonly key: number;
	readonly label: string;
	readonly unit?: string;
}
```

### `getAllMeterScales`

```ts
getAllMeterScales(meterType: number): MeterScale[] | undefined
```

Returns all scales for a given meter type.

### `getUnknownMeterScale`

```ts
getUnknownMeterScale(key: number): MeterScale
```

Returns a placeholder scale definition for unknown scales.

## Sensors

The sensor registry provides information about different sensor types and their supported scales. Sensors can measure various physical quantities like temperature, humidity, luminance, etc.

### `getSensor`

```ts
getSensor(type: number): Sensor | undefined
```

Returns the sensor definition for a given sensor type. The returned object has the following structure:

```ts
interface Sensor {
	readonly key: number;
	readonly label: string;
	readonly scaleGroupName?: string;
	readonly scales: ScaleGroup;
}
```

The `scales` property is a record where the keys are scale identifiers and the values are objects containing the scale's label and optional unit/description:

```ts
type ScaleGroup = Record<
	number, // Scale key/identifier
	{
		readonly label: string;
		readonly unit?: string;
		readonly description?: string;
	}
>;
```

### `getAllSensors`

```ts
getAllSensors(): Sensor[]
```

Returns all available sensor definitions.

### `getSensorName`

```ts
getSensorName(sensorType: number): string
```

Returns the human-readable name of a sensor type.

### `getSensorScale`

```ts
getSensorScale(type: number, scale: number): Scale | undefined
```

Returns the scale definition for a specific sensor type and scale. The returned object contains the scale's key, label, and optional unit/description:

```ts
interface Scale {
	readonly key: number;
	readonly label: string;
	readonly unit?: string;
	readonly description?: string;
}
```

### `getAllSensorScales`

```ts
getAllSensorScales(sensorType: number): Scale[] | undefined
```

Returns all scales for a given sensor type.

## Named Scales

Named scales are reusable scale groups that can be shared across multiple sensor or meter types. For example, temperature scales are used by multiple sensor types.

### `getNamedScale`

```ts
getNamedScale(name: string, scale: number): Scale | undefined
```

Returns a specific scale from a named scale group.

### `getNamedScaleGroup`

```ts
getNamedScaleGroup(name: string): ScaleGroup | undefined
```

Returns all scales in a named scale group.

### `getAllNamedScaleGroups`

```ts
getAllNamedScaleGroups(): NamedScaleGroup[]
```

Returns all available named scale groups. Each group has the following structure:

```ts
interface NamedScaleGroup {
	name: string;
	scales: ScaleGroup;
}
```

### `getUnknownScale`

```ts
getUnknownScale(key: number): Scale
```

Returns a placeholder scale definition for unknown scales.

### Available Named Scale Groups

- `"temperature"`: Celsius, Fahrenheit
- `"humidity"`: Percentage value, Absolute humidity
- `"mass"`: Kilogram
- `"acceleration"`: Meter per square second
- `"percentage"`: Percentage value
- `"acidity"`: Acidity
- `"direction"`: Degrees
- `"pressure"`: Kilopascal, Pound per square inch
- `"airPressure"`: Kilopascal, Inches of Mercury
- `"density"`: Density
- `"unitless"`: Unitless

## Device Classes

Z-Wave devices have a basic, generic and optionally a specific device class. The basic device class is given by the following enum:

```ts
enum BasicDeviceClass {
	"Controller" = 0x01,
	"Static Controller" = 0x02,
	"End Node" = 0x03,
	"Routing End Node" = 0x04,
}
```

Generic and specific device classes are more complex and can be looked up using the following APIs.

### `getGenericDeviceClass`

```ts
getGenericDeviceClass(generic: number): GenericDeviceClass
```

Returns the generic device class definition. The returned object has the following structure:

```ts
interface GenericDeviceClass {
	readonly key: number;
	readonly label: string;
	readonly zwavePlusDeviceType?: string;
	readonly requiresSecurity: boolean;
	readonly maySupportBasicCC: boolean;
}
```

### `getSpecificDeviceClass`

```ts
getSpecificDeviceClass(generic: number, specific: number): SpecificDeviceClass
```

Returns the specific device class definition. The structure is the same as `GenericDeviceClass`:

```ts
interface SpecificDeviceClass {
	readonly key: number;
	readonly label: string;
	readonly zwavePlusDeviceType?: string;
	readonly requiresSecurity: boolean;
	readonly maySupportBasicCC: boolean;
}
```

### `getAllDeviceClasses`

```ts
getAllDeviceClasses(): GenericDeviceClassWithSpecific[]
```

Returns all device classes with their specific subclasses.

```ts
interface GenericDeviceClassWithSpecific {
	readonly key: number;
	readonly label: string;
	readonly zwavePlusDeviceType?: string;
	readonly requiresSecurity: boolean;
	readonly maySupportBasicCC: boolean;
	readonly specific: SpecificDeviceClass[];
}
```

## Notifications

Z-Wave defines several notifications that all have a numeric type and a name. Notifications can have multiple grouped states (variables) and stateless events:

```ts
interface Notification {
	readonly type: number;
	readonly name: string;
	readonly variables: readonly NotificationVariable[];
	readonly events: ReadonlyMap<number, NotificationEvent>;
}
```

Notification variables have a name and one or more states:

```ts
interface NotificationVariable {
	readonly name: string;
	readonly states: ReadonlyMap<number, NotificationState>;
}

interface NotificationState {
	readonly type: "state";
	readonly variableName: string;
	readonly idle: boolean;
	readonly value: number;
	readonly label: string;
	readonly description?: string;
	readonly parameter?: NotificationParameter;
}
```

Event definitions have the following structure:

```ts
interface NotificationEvent {
	readonly type: "event";
	readonly value: number;
	readonly label: string;
	readonly description?: string;
	readonly parameter?: NotificationParameter;
}
```

### `getNotification`

```ts
getNotification(type: number): Notification | undefined
```

Returns the notification definition for a given notification type.

### `getAllNotifications`

```ts
getAllNotifications(): Notification[]
```

Returns all available notification definitions.

### `getNotificationName`

```ts
getNotificationName(notificationType: number): string
```

Returns the human-readable name of a notification type.

### `getNotificationEventName`

```ts
getNotificationEventName(type: number, event: number): string
```

Returns the human-readable name of a notification event.

### `getNotificationValue`

```ts
getNotificationValue(type: number, value: number): NotificationValue | undefined
```

Returns the notification value definition, which can be either a state or an event.

```ts
type NotificationValue = NotificationEvent | NotificationState;
```

### `getNotificationValueName`

```ts
getNotificationValueName(type: number, value: number): string
```

Returns the human-readable name of a notification value.

## Indicators

The indicator registry provides information about indicator properties used by the Indicator Command Class. These properties define different LED behaviors, audio indicators, and other visual or audio feedback mechanisms on Z-Wave devices.

Indicators are given by the `Indicator` enum. Each indicator can have multiple properties, which can be queried using the following APIs.

### `getIndicatorProperty`

```ts
getIndicatorProperty(propertyId: number): IndicatorProperty | undefined
```

Returns the indicator property definition. The returned object has the following structure:

```ts
interface IndicatorProperty {
	readonly id: number;
	readonly label: string;
	readonly description?: string;
}
```

### `getAllIndicatorProperties`

```ts
getAllIndicatorProperties(): IndicatorProperty[]
```

Returns all defined indicator properties.
