# Conditional configuration settings

Unlike other projects, we aim to present to users only the parameters and settings actually supported by the firmware version running on their device. While some legacy files accomplish this by using more than one device file, the standard way of doing this now is through the use of conditional parameters.

As part of submitting or updating a device configuration file, you must determine to **the best of your ability** whether parameters (or settings) apply to only a subset of devices or at which firmware version particular parameters were added. You should then define any later added parameters (or settings) so that they are only displayed when applicable to the device.

You can do so using the `"$if"` property. It accepts a string with logic inside, e.g.

```json
{
	"$if": "firmwareVersion >= 1.0 && productType === 0x1234"
	// ... other settings
}
```

The logic supports the JavaScript operators `<`, `<=`, `>`, `>=` and `===`, as well as `&&`, `||` and `(...)`. Available variables are `manufacturerId`, `productType`, `productId` and `firmwareVersion`.

Version comparisons support versions with and without a patch number. If the patch number is missing, it is assumed to be 0. Given the firmware version `1.2.3`, the condition `firmwareVersion >= 1.2` will be satisfied, since `1.2.3 >= 1.2.0`.

## Referencing configuration parameter values

Some devices change the definition of config parameters depending on the value of other parameters. To support this, conditions can reference the current value of a config parameter using the same syntax as the `"#"` property of parameter definitions, prefixed with `#`:

```json
{
	// Applies when parameter 71 is currently set to 1
	"$if": "#71 == 1",
	// Applies when the partial parameter 9, bitmask 0x0f is greater than -1
	"$if": "#9[0x0f] > -1",
	// Can be combined with other conditions
	"$if": "#40 >= 2 && firmwareVersion >= 1.7"
}
```

Parameter references may only be compared with number literals (no versions). Partial parameter values are interpreted with the signedness of the parameter definition, like elsewhere in Z-Wave JS.

References resolve against the endpoint whose config section the condition appears in: conditions inside an `endpoints` definition use that endpoint's own parameters, everything else uses the root device's parameters.

**Comparisons involving an unknown parameter value evaluate as if they didn't exist, i.e. they are `true`.** For example, `#40 >= 2 && firmwareVersion >= 1.7` behaves like `firmwareVersion >= 1.7` as long as the value of parameter 40 has not been queried yet. This way, guarded definitions apply during a first interview and are hidden afterwards if their conditions turn out to be unsatisfied. Note that this also means an unknown comparison makes an entire `||` condition `true`.

Z-Wave JS re-evaluates the device config whenever the value of a referenced parameter changes, so the applicable definitions update without a re-interview. Because of this, parameter references are only allowed in conditions whose effects can be applied dynamically:

- config parameter definitions and their options
- `compat` flags which do not influence the interview

They must not be used anywhere else, in particular not in the top-level `manufacturer`/`label`/`description` properties, `metadata`, associations, endpoint definitions, or `compat` flags which influence the interview (e.g. `addCCs`, `removeCCs`, `removeEndpoints`). In addition, referenced parameters must be defined in the same file (in the same endpoint scope), must not be `hidden`, and conditions must not form reference cycles between parameters. All of this is checked by `yarn lint:zwave`.

You can use `"$if"` in the following locations:

- In the top-level `manufacturer`, `label` or `description` properties
- Inside endpoint definitions
- Inside association groups
- Inside config parameters
- Inside config parameter options
- As part of the `compat` flag definition
- In each property of the device `metadata`, including `comments`

Whenever a primitive value (usually a string) should be made conditional, it needs to be converted into an object and put into the `"value"` property. The fallback value may be specified as a string:

```json
{
	// static:
	"manufacturer": "Z-Wave JS",

	// conditional (string fallback):
	"manufacturer": [
		{
			// This variant is active for firmware version 1.0 and below
			"$if": "firmwareVersion < 1.0",
			"value": "Z-Wave"
		},
		// This one for all others
		"Z-Wave JS"
	],

	// conditional (object fallback):
	"manufacturer": [
		{
			// This variant is active for firmware version 1.0 and below
			"$if": "firmwareVersion < 1.0",
			"value": "Z-Wave"
		},
		{
			// This one for all others
			"value": "Z-Wave JS"
		}
	]
}
```

When selecting one of multiple variants of a property, `"$if"` is mandatory in array item, except the last one. The first matching definition will be used, the others don't apply.

```json
{
	// ... all the rest
	"paramInformation": [
		{
			"#": "1",
			// This variant is active for firmware version 1.0
			"$if": "firmwareVersion === 1.0",
			"label": "Light configuration",
			"valueSize": 2,
			"minValue": 0,
			"maxValue": 2
		},
		{
			"#": "1",
			// This one for all others
			"label": "Sound configuration",
			"valueSize": 1,
			"minValue": 0,
			"maxValue": 1
		}
	]
}
```

An exception are properties which may contain multiple values, e.g. `metadata.comments` or parameter `options`. Here, the non-matching variants are filtered out.
