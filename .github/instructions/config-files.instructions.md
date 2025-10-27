---
applyTo: "packages/config/config/devices/*/*.json"
---

# Device Configuration Files

- Treat the files as JSON files with support for comments.
- When making changes, keep your explanation brief and to the point.
- Follow the existing code style patterns and formatting standards.
- Use American English for all text content.

## File Structure and Property Order

Device configuration files must follow this property order for consistency:

1. `manufacturer` - The brand name under which the device is sold
2. `manufacturerId` - 4-digit hexadecimal manufacturer ID
3. `label` - Short device label (usually model number/SKU)
4. `description` - Longer device description (marketed name)
5. `devices` - Array of product type/ID combinations
6. `firmwareVersion` - Firmware version range the config applies to
7. `preferred` - Mark as preferred over overlapping configs (only rarely needed)
8. `endpoints` - Endpoint-specific configuration (only if needed)
9. `associations` - Association groups (only if needed)
10. `paramInformation` - Configuration parameters array
11. `scenes` - Custom labels and description for Central Scenes (only if needed)
12. `proprietary` - Proprietary CC settings (only if needed)
13. `compat` - Compatibility flags for non-compliant devices (only if needed)
14. `metadata` - User-facing metadata (inclusion instructions, etc.)

## Consistency Guidelines

When authoring and reviewing configuration files, consistency is key for maintainability and user experience:

### Cross-Device Consistency

- **Parameter names and descriptions**: Strive for consistency across similar parameters from the same manufacturer
- **Options and values**: Use similar wording and value ranges for equivalent functionality across devices
- **Association groups**: Label the controller communication group as "Lifeline" for all devices
- **Templates**: Leverage templates to maintain consistency across device families (see Templates section)

### Important Notes

- Do not change the actual meaning or behavior of parameters to achieve consistency
- If the manufacturer uses different terminology across devices, reflect that accurately
- Brand names should match the specific device/time period, even if inconsistent across a manufacturer's history

### Within-File Consistency

- Use consistent formatting, capitalization, and terminology throughout each file
- Follow the established property order for all devices
- Apply consistent value formatting (e.g., always use lowercase for boolean options)
- Reference the `master_template.json` or manufacturer-specific templates (in each manufacturer's `templates` folder) to reuse common parameters using `$import`s

## Device Identification

### Manufacturer

- Use the **brand** under which the device is sold, not the actual manufacturer
- Example: Use "Yale" not "Assa Abloy"
- Use the correct brand name for the specific device/time period

### Label

- Use the device model number or SKU
- Remove manufacturer name from the label
- Keep it concise and accurate

### Description

- Use the marketed product name
- Apply Title Case formatting
- Remove manufacturer name from the description
- Avoid overlap between the device label and description, unless that's how the device is actually marketed and no information on a model number or SKU can be found
- If the device has no proper marketed product name, use a descriptive device type (e.g., "Motion Sensor", "Power Switch", "Door Lock")

### Firmware Version

- Should be as wide as possible, by default "0.0" to "255.255"
- Only specify a narrower range if
  - there are multiple revisions of a device that only differ in firmware version
  - changes in a firmware version are significant enough that using conditional parameters would introduce too much complexity

## Configuration Parameters

### Parameter Organization

- Parameters should generally follow numeric order by parameter number
- However, parameters can be reordered for logical grouping when it improves usability
- Group related functionality together, even if parameter numbers are non-sequential
- Example: Group all motion sensor parameters (7, 19, 25) together, even if parameters 8-18 and 20-24 exist and control different features
- Prioritize user experience and logical workflow over strict numeric ordering

### Parameter Labels

- Use Title Case formatting
- Be clear, concise, and descriptive
- Avoid unnecessary technical jargon
- Shorten wherever possible (e.g., "Threshold at which to send a battery report" → "Battery Report Threshold")
- Do not include unnecessary whitespace, newlines, or tabs

### Parameter Descriptions

- Use Sentence case formatting
- Only include if it adds significant value beyond the label
- Remove descriptions that merely restate the label or repeat information available elsewhere
- Keep descriptions that do add additional explanation, but keep them concise
- Remove ranges/units that are defined in other properties
- Do not include unnecessary whitespace, newlines, or tabs
- **When editing new or uncleaned files**: If possible, convert description information to proper fields instead of removing:
  - If description states available options, convert those to the `options` field
  - If description states min/max values, convert those to `minValue`/`maxValue` fields
  - If description explains the parameter unit, convert to the `unit` field
- **Exception 1**: When parameter has gaps in valid ranges (e.g., 0-99 plus 255), explain the allowable range. This includes cases with a single option outside of the allowable range.
  - Examples:
    - `"description": "Allowable range: 0-99, 255"`
    - `"description": "Allowable range: 30-1000"` plus an option for 0 (Disabled)
- **Exception 2**: When units change based on parameter value, describe this in the description
  - Examples:
    - `"description": "Values 1-127 = seconds; 128-255 = minutes (minus 127)"`
    - `"description": "0 = disabled, 1 to 60 = seconds, 61 to 120 = minutes (minus 60), 121 - 254 = hours (minus 120), 255 = indefinitely"`
    - `"description": "5-100 = 100 ms (500 ms - 10 seconds); 101-160 = seconds (minus 100); 161-254 = minutes (minus 160)"`

### Parameter Options

- Use Sentence case formatting for option labels
- Provide predefined options whenever possible to improve UI experience
- Only include options for values with special meaning that isn't encoded elsewhere (e.g., 0 = off, 100 = last brightness, not examples like 10 = 10% or defaults available in `defaultValue`)
- Set `allowManualEntry: false` if predefined options are the only valid values
- For enable/disable parameters, use "Enable"/"Disable" labels and avoid putting "Enable" in the parameter label
- Use options as hints for special values (e.g., 0 = disable, 255 = default) while still allowing manual entry

### Parameter Values and Ranges

- Define `minValue`/`maxValue` only as large as necessary
- Check device manual for actual valid ranges, don't default to 0-255
- Use `unsigned: true` for parameters interpreted as unsigned values
- Mark parameters as `readOnly` or `writeOnly` when applicable
- Set appropriate `defaultValue` (required unless `readOnly`)
- Use `recommendedValue` sparingly, only when there's a compelling reason to suggest a value different from the factory default that would provide better device performance or behavior and benefit most users. Note that recommended values are only automatically applied when the `applyRecommendedConfigParamValues` driver option is enabled (disabled by default).

### Units

- Use unit symbols instead of full words where common:
  - `%` instead of "percent"
  - `°C` instead of "degrees Celsius"
  - `W`, `V`, `A` instead of "watts", "volts", "Ampere"
- Don't abbreviate time units except `ms` for milliseconds
- Use decimal notation for multiples: `0.01 V`, `10 seconds`, `100 ms`
- Do not define range 0-99 as percent (it's not mathematically 0-100%)

## Partial Parameters

Partial parameters break down single device parameters that control multiple options into individual, user-friendly parameters.

### Understanding Partial Parameters

Some devices use one parameter number to configure several unrelated options through bit manipulation. Instead of forcing users to calculate binary combinations, partial parameters present each option as a separate parameter.

### Syntax and Format

- Format: `"#": "40[0x01]"` where `40` is the parameter number and `0x01` is the hexadecimal bitmask
- The bitmask defines which bits of the original parameter this partial parameter controls
- Example: `40[0x01]` controls bit 0, `40[0x02]` controls bit 1, `40[0x04]` controls bit 2, `40[0x08]` controls bit 3

### How Values Work

- All values are relative to the bitmask - Z-Wave JS handles the bit shifting automatically
- Single-bit parameters always use values 0 and 1 (regardless of which bit position)
- Multi-bit parameters use values 0 to (2^bits - 1), e.g., 3-bit mask = values 0-7
- The `valueSize` must be the actual parameter size from the device manual (same for all partials of the same parameter)

### Requirements

- All partial parameters sharing the same base number must have identical `valueSize`
- Each bitmask must fit within the configured `valueSize`
- Bitmasks for the same parameter should not overlap (each bit used only once)
- `minValue`, `maxValue`, `defaultValue`, and option values are relative to the lowest bit

### Spotting Candidates for Partial Parameters

Look for parameters where:

- Values are powers of 2 (1, 2, 4, 8, 16...) representing individual options
- Values can be combined by addition (e.g., 5 = 4 + 1, enabling two separate features)
- Documentation mentions "bitwise" settings or "combine values"
- A parameter controls multiple unrelated features simultaneously
- The manual lists values like "1=feature A, 2=feature B, 3=features A+B, 4=feature C, 5=features A+C"

### Example

Parameter 7 with values 0-15 where:

- 1 = physical tap, 2 = 3-way switch, 4 = Z-Wave command, 8 = timer
- Value 13 (8+4+1) = timer + Z-Wave command + physical tap

Becomes four partial parameters:

- `7[0x01]`: Physical tap (0=disable, 1=enable)
- `7[0x02]`: 3-way switch (0=disable, 1=enable)
- `7[0x04]`: Z-Wave command (0=disable, 1=enable)
- `7[0x08]`: Timer (0=disable, 1=enable)

## Association Groups

- When adding a new device, defining associations in the config file is rarely necessary
- All devices have a group for communication with the controller - this should be labeled "Lifeline"
- Modern devices typically use Association group 1 as the lifeline, but older devices may use different numbers

## Central Scene Labels

The `scenes` property allows defining custom labels and descriptions for Central Scenes instead of the default "Scene 001", "Scene 002" format.

### Structure

```json
{
	"scenes": {
		"1": {
			"label": "Upper Paddle"
		},
		"2": {
			"label": "Lower Paddle"
		},
		"3": {
			"label": "External Switch",
			"description": "Only available on some devices"
		}
	}
}
```

### Requirements

- Scene numbers must be numeric strings between "1" and "255"
- Each scene object must have a `label` property (string)
- Each scene object may have an optional `description` property (string)
- Use descriptive, user-friendly names that clearly indicate the scene's function
- Follow Title Case formatting for scene labels
- Follow Sentence case formatting for scene descriptions
- Only define scenes that the device actually supports
- Only add a description if it adds significant value beyond the label

### Guidelines

- Use clear, concise labels that users will easily understand
- Prefer standardized terminology when possible:
  - "Single Press", "Double Press", "Triple Press" for tap sequences
  - "Hold" or "Press and Hold" for held down actions
  - "Release" for key release actions
- Avoid manufacturer-specific jargon unless it's commonly understood
- Keep labels reasonably short to fit in user interfaces

## Conditional Settings

- Conditional settings typically apply when reviewing hand-edited config files, not when adding new ones
- Use `$if` property to make parameters/settings conditional based on firmware version or device variants
- Available variables: `manufacturerId`, `productType`, `productId`, `firmwareVersion`
- Supports operators: `<`, `<=`, `>`, `>=`, `===`, `&&`, `||`, `(...)`
- Version comparisons support patch numbers (1.2.3) with missing patch assumed as 0
- Convert primitive values to objects with `value` property when making conditional

Example:

```json
{
	"$if": "firmwareVersion >= 1.0 && productType === 0x1234",
	"value": "Conditional value"
}
```

## Templates

Templates allow reusing common parameter definitions across devices to maintain uniformity and ease management.

### Understanding Template Syntax

- `$import` property replaces normal parameter properties with template content
- Syntax: `"$import": "path/to/template.json#selector"`
- Path is relative to importing file; `#selector` navigates to specific template parts
- Use `~/` for config root directory to avoid broken references when files move
- Properties before `$import` may be overwritten; properties after override imported values
- Templates must be in `templates/` subdirectories to avoid being treated as device configs
- The `#` property is never imported to avoid conflicts with parameter numbers

### Template Types

1. **Master Template** (`~/templates/master_template.json`):
   - Common parameter bases usable across all manufacturers
   - Examples: `base_enable_disable`, `base_0-99_nounit`, `orientation`, `led_indicator_three_options`
   - Modifying existing master templates affects ALL devices using them, be careful with changes

2. **Manufacturer-specific Templates** (in each manufacturer's `templates/` folder):
   - Parameters common to devices from that specific manufacturer
   - Should only be created if there are multiple devices from that manufacturer reusing the same parameter definitions
   - Changing existing manufacturer templates affects all devices from that manufacturer

### When Reviewing Templates

- Check that `$import` paths are correct and use `~/` when referencing master template
- Verify override properties come after `$import` to ensure they take precedence
- Ensure new templates don't duplicate existing master template functionality
- Confirm manufacturer-specific templates are truly manufacturer-specific

## Compatibility Flags

Compatibility flags require domain knowledge about Z-Wave protocol issues and device quirks. When reviewing files with `compat` flags:

### What to Check During Review

- Check that flag usage matches the documented syntax and options
- Ensure comments explain why the flag is needed (device behavior, firmware bugs, etc.)
- Confirm flags are applied to the correct devices (not overly broad)

### When to Question Compat Flags

- If no explanation comment is provided
- If similar devices from the same manufacturer don't need the same flag

## Comments

- Use JSON5 comments to explain omitted parameters or compat flags
- Explain why certain decisions were made
- Document workarounds and their necessity
- Multiline comments are allowed, but make sure each line starts with `//`. Do not use `/* ... */` style comments.

Example:

```json
{
	"compat": {
		// The device is a Binary Sensor, but uses Basic Sets to report its status
		"mapBasicSet": "auto"
	}
}
```

## Device Metadata

- The `metadata` property is optional with the following structure:

  ```json
  {
  	// rest of the file
  	"metadata": {
  		"wakeup": "How to wake up the device manually",
  		"inclusion": "How to include this device",
  		"exclusion": "How to exclude this device",
  		"reset": "How to factory-reset this device",
  		"manual": "A link to the device manual"
  	}
  }
  ```
- All properties in `metadata` are optional.
- Do not add metadata if there is none

### `wakeup`, `inclusion`, `exclusion`, and `reset` Instructions

Ensure the instructions follow these guidelines:

- These properties should be short instructions on how to perform the respective actions.
- Use Markdown formatting where appropriate
- Ensure proper escaping of characters for embedding in JSON strings.
- Use proper english grammar and punctuation.
- Write instructions in the second person, addressing the user directly.
- Ensure a consistent style and formatting across all instructions.
- Do not refer to the controller, Z-Wave controller, network, hub, or any external system in these instructions. If an App must be used to perform the steps, do mention it.
- Focus exclusively on the steps needed on the device itself
- Steps should be concise and clear
- Do not say "to start inclusion", "to start exclusion" or similar phrases
- If an instruction explains what the LED does, keep this information.
- Remove verbose explanations about when factory reset should be used.
- Do not tell the user to repeat the procedure when it failed, but mention which LED behavior indicates failure.
- Do not refer to auto-inclusion in the inclusion or exclusion instructions.
- If inclusion instructions have one part about automatic inclusion and one part about manual inclusion, keep only the manual part.
- Do not refer to exclusion mode in the reset instructions.
- Avoid double line breaks (\n\n) in the instructions.
- Replace line breaks in lists with additional list items.
- Remove steps referring to QR codes or entering PIN codes
- Do not refer to external URLs in the instructions
- Remove steps about "waiting for the process to end" or similar waiting instructions
- Remove confirmations from the controller or network in the instructions
- Remove steps about moving the device close to its final location
- Remove steps about bringing the device close to the controller or hub
- Remove steps about testing the device after inclusion
- Avoid putting steps in parentheses, put them in a separate sentence instead
- Avoid phrases like "The device reverts to factory default state" or "The device will be reset to factory defaults"
- Avoid clarifying phrases with another word in parentheses, such as "the ON (top) button" or "the OFF (bottom) button". Decide on one term and use it consistently.
- Avoid repetitive language in subsequent steps
- Distinguish clearly which part of the device's feedback (LED/sound) indicates that the inclusion/exclusion/reset process has started and which part confirms success or failure

After rewording instructions, double check them for the following requirements:

- Use individual sentences for instructions with one or two steps.
- Turn instructions with 3 or more steps into a numbered list.

### `manual` URL

- Do not change the `manual` URL under any circumstances

## Quality Standards

- Configuration files must follow the mandatory style guide
- Files that don't follow standards will not be accepted
- Check files using `yarn run lint:zwave` for semantic errors that need to be fixed (warnings may be tolerated). This command does not take the filename as an argument, use it verbatim.
- Run `yarn run lint:configjson:fix` to ensure correct formatting - this command runs quickly, so you can use it frequently. This command does not take the filename as an argument, use it verbatim.
- After doing edits, always run `yarn run lint:zwave` again to ensure no new issues were introduced
- After doing edits, always run `yarn run lint:configjson:fix` again to ensure no new issues were introduced
- Also check for any other issues that would be caught by common sense and that are not specifically covered by the instructions listed here, for example value ranges that do not make sense in the context they are used in.
