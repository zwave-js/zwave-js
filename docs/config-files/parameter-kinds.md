# Parameter kinds

The `$kind` property describes the purpose of a configuration parameter. It allows applications to understand what a parameter does without having to parse labels or descriptions, enabling features like:

- Grouping similar parameters across different devices
- Providing consistent UI controls for the same functionality
- Enabling cross-device automation (e.g., "set all auto-off timers to 30 minutes")

## Usage

Add the `$kind` property to a parameter definition:

```json
{
	"#": "3",
	"$kind": "timer.auto_off",
	"label": "Auto Turn-Off Timer",
	"valueSize": 4,
	"unit": "minutes",
	"minValue": 0,
	"maxValue": 65535,
	"defaultValue": 0,
	"options": [
		{
			"label": "Disabled",
			"value": 0
		}
	]
}
```

## Available Kinds

The following semantic kinds are defined. Some kinds support sub-variants using dot notation (e.g., `ramp_rate.manual`).

### `state_after_power_failure`

Defines what state the device returns to after power is restored.

**Typical options:** Off, On, Previous state, Schedule

**Example parameters:**

- "State After Power Failure"
- "State After Power Loss"
- "State After Power Outage"
- "Power Restore State"

---

### `timer`

Automatic turn-on or turn-off after a delay.

**Common pattern:** Value 0 = disabled

**Sub-variants:**

| Kind             | Description                                     |
| ---------------- | ----------------------------------------------- |
| `timer.auto_off` | Automatic turn-off after a delay when turned on |
| `timer.auto_on`  | Automatic turn-on after a delay when turned off |

**Example parameters:**

- "Auto Turn-Off Timer" → `timer.auto_off`
- "Auto Off Timer" → `timer.auto_off`
- "Auto Shut-Off" → `timer.auto_off`
- "Auto Turn-On Timer" → `timer.auto_on`
- "Auto On Timer" → `timer.auto_on`

---

### `ramp_rate`

Speed or duration of dimming transitions.

When a device has a single parameter that applies to both directions, use the base kind. Use `.manual` / `.zwave` variants when separate parameters exist for different control methods.

**Sub-variants:**

| Kind               | Description                                |
| ------------------ | ------------------------------------------ |
| `ramp_rate`        | General ramp rate (applies to all control) |
| `ramp_rate.manual` | Ramp rate for physical/manual control only |
| `ramp_rate.zwave`  | Ramp rate for Z-Wave control only          |

**Example parameters:**

- "Dimming Speed" → `ramp_rate`
- "Ramp Rate" → `ramp_rate`

---

### `dimming_duration`

Duration of a full dimming transition (from off to on or vice versa).

**Sub-variants:**

| Kind                           | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `dimming_duration`             | General dimming duration (applies to all control)  |
| `dimming_duration.manual`      | Dimming duration for physical/manual control only  |
| `dimming_duration.zwave`       | Dimming duration for Z-Wave control only           |
| `dimming_duration_up`          | Dimming duration for dimming up (all control)      |
| `dimming_duration_up.manual`   | Dimming duration for dimming up (manual control)   |
| `dimming_duration_up.zwave`    | Dimming duration for dimming up (Z-Wave control)   |
| `dimming_duration_down`        | Dimming duration for dimming down (all control)    |
| `dimming_duration_down.manual` | Dimming duration for dimming down (manual control) |
| `dimming_duration_down.zwave`  | Dimming duration for dimming down (Z-Wave control) |

**Example parameters:**

- "Ramp Rate On (Manual Control)" → `dimming_duration_up.manual`
- "Ramp Rate Off (Z-Wave)" → `dimming_duration_down.zwave`
- "Fade On Time" → `dimming_duration_up`
- "Fade Off Time" → `dimming_duration_down`

---

### `minimum_brightness`

Minimum dim level the device will go to.

**Example parameters:**

- "Minimum Brightness"
- "Minimum Dim Level"
- "Min Brightness"

---

### `maximum_brightness`

Maximum dim level the device will go to.

**Example parameters:**

- "Maximum Brightness"
- "Maximum Dim Level"
- "Max Brightness"

---

### `orientation`

Inverts physical switch direction (up=on vs up=off).

**Sub-variants:**

| Kind                    | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `orientation`           | Simple toggle: Disable = normal, Enable = inverted (up=off, down=on) |
| `orientation.momentary` | Includes momentary button mode option alongside normal/inverted      |

**Example parameters:**

- "Inverted Orientation"
- "Paddle Orientation"
- "Switch Orientation"

---

### `motion_sensitivity`

Sensitivity level of a motion/PIR sensor.

**Example parameters:**

- "Motion Sensor Sensitivity"
- "PIR Sensitivity"
- "Motion Sensitivity Level"

---

### `motion_clear_delay`

Time to wait after last motion before reporting "no motion" (motion cleared).

**Example parameters:**

- "Motion Clear Time"
- "Motion Reset Time"
- "PIR Timeout"
- "Motion Sensor Timeout"
- "Re-trigger Interval" (when used for clear delay)

---

### `motion_retrigger_interval`

Minimum time between motion detection reports / blind time after detection.

**Example parameters:**

- "Motion Retrigger Interval"
- "Motion Blind Time"
- "Re-trigger Interval" (when used for blind time)
- "PIR Re-trigger Interval"

---

### `calibration`

Calibration offset for sensor readings.

**Sub-variants:**

| Kind                      | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `calibration.temperature` | Calibration offset for temperature sensor      |
| `calibration.humidity`    | Calibration offset for humidity sensor         |
| `calibration.brightness`  | Calibration offset for light/brightness sensor |

**Example parameters:**

- "Temperature Calibration" → `calibration.temperature`
- "Temperature Offset" → `calibration.temperature`
- "Temperature Correction" → `calibration.temperature`
- "Humidity Calibration" → `calibration.humidity`
- "Humidity Offset" → `calibration.humidity`
- "Humidity Correction" → `calibration.humidity`
- "Light Intensity Offset" → `calibration.brightness`
- "Brightness Offset" → `calibration.brightness`
- "Lux Calibration" → `calibration.brightness`

**NOT calibration** (do not use this kind for these):

- "Hysteresis Upper Temperature Offset" — this is a thermostat deadband/hysteresis setting, not a sensor calibration offset
- "Temperature Control Hysteresis" — same reason

---

### `overload_protection`

Enable/disable or threshold for overload/overcurrent protection.

**Sub-variants:**

| Kind                            | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| `overload_protection`           | Enable/disable flag for overload protection                 |
| `overload_protection.threshold` | Power (W) or current (A) threshold that triggers protection |

**Example parameters:**

- "Overload Protection"
- "Current Overload Protection"
- "Power Overload Threshold"

---

### `reporting_threshold`

Threshold for automatic reporting based on value change (delta from previous reading).

**Sub-variants:**

| Kind                              | Description                       |
| --------------------------------- | --------------------------------- |
| `reporting_threshold.power`       | Power/wattage change threshold    |
| `reporting_threshold.energy`      | Energy/kWh change threshold       |
| `reporting_threshold.temperature` | Temperature change threshold      |
| `reporting_threshold.humidity`    | Humidity change threshold         |
| `reporting_threshold.brightness`  | Light/brightness change threshold |
| `reporting_threshold.battery`     | Battery level change threshold    |
| `reporting_threshold.current`     | Current/amperage change threshold |
| `reporting_threshold.voltage`     | Voltage change threshold          |

**Example parameters:**

- "Temperature Change Reporting Threshold" → `reporting_threshold.temperature`
- "Humidity Change Report Threshold" → `reporting_threshold.humidity`
- "Brightness Change Report Threshold" → `reporting_threshold.brightness`
- "Power Reporting Threshold" → `reporting_threshold.power`
- "Battery Change Report Threshold" → `reporting_threshold.battery`

**NOT a specific threshold** (do not use a sub-variant for these):

- "Temperature & Humidity Reporting Threshold" — combined parameter controlling multiple sensor types; don't tag with a single sub-variant

---

### `reporting_interval`

Time interval for periodic automatic reporting.

**Sub-variants:**

| Kind                             | Description                         |
| -------------------------------- | ----------------------------------- |
| `reporting_interval.power`       | Power/wattage reporting interval    |
| `reporting_interval.energy`      | Energy/kWh reporting interval       |
| `reporting_interval.temperature` | Temperature reporting interval      |
| `reporting_interval.humidity`    | Humidity reporting interval         |
| `reporting_interval.brightness`  | Light level/lux reporting interval  |
| `reporting_interval.battery`     | Battery level reporting interval    |
| `reporting_interval.current`     | Current/amperage reporting interval |
| `reporting_interval.voltage`     | Voltage reporting interval          |

**Example parameters:**

- "Power Reporting Interval"
- "Temperature Report Interval"
- "Sensor Reporting Frequency"
- "Battery Report Interval" → `reporting_interval.battery`
- "Battery Reporting Interval" → `reporting_interval.battery`
- "Battery Level Reporting Interval" → `reporting_interval.battery`

**NOT a reporting interval** (do not use this kind for these):

- "Temperature & Humidity Reporting Interval" — combined parameter controlling multiple sensor types; don't tag with a single sub-variant
- "Temperature Check Interval" / "Temperature Measuring Interval" — sensor polling/measurement interval, not a reporting interval. Some devices have separate parameters for how often a sensor is read vs. how often reports are sent

---

### `low_battery_threshold`

Battery level (%) that defines when the device is considered to have a low battery. Typically triggers low battery alerts/warnings.

**Example parameters:**

- "Low Battery Threshold"
- "Low Battery Alert Threshold"
- "Low Battery Level"
- "Low Battery Alarm Threshold"

---

## Guidelines for Contributors

When adding `$kind` to device configurations:

1. **Use existing kinds when applicable.** Check the list above before creating assumptions about new kinds.

2. **Match by purpose, not label.** Parameters with different labels but the same purpose should use the same kind. For example, "Auto Shut-Off Timer", "Auto Turn-Off Timer", and "Auto Off" should all use `timer.auto_off`.

3. **Use sub-variants appropriately.** Only use sub-variants (e.g., `ramp_rate.manual`) when the distinction is meaningful. If a device has a single ramp rate parameter that applies to all control methods, use the base kind `ramp_rate`.

4. **Don't force kinds.** If a parameter doesn't clearly fit any existing kind, leave it without a `$kind` rather than forcing an incorrect one.

5. **Consider the unit field.** The `unit` field already conveys information about what's being measured. The `$kind` describes the semantic _purpose_, not the measurement type. For example, both temperature thresholds and temperature calibration offsets might have `unit: "°C"`, but they have different `$kind` values.

## Template Usage

The `$kind` property can be defined in templates and inherited via `$import`:

```json
// In template file
"auto_off_timer_base": {
	"$kind": "timer.auto_off",
	"label": "Auto Turn-Off Timer",
	"valueSize": 4,
	"unit": "minutes",
	"minValue": 0,
	"maxValue": 65535,
	"defaultValue": 0,
	"options": [
		{
			"label": "Disabled",
			"value": 0
		}
	]
}

// In device file
{
	"#": "3",
	"$import": "~/templates/manufacturer_template.json#auto_off_timer_base"
}
```

This ensures consistent semantic categorization across all devices that use the template.
