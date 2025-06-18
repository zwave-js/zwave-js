---
applyTo: "packages/config/config/devices/*/*.json"
---

# Device Configuration Files

- Treat the files as JSON files with support for comments.
- When making changes, keep your explanation brief and to the point.

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
- Do not refer to the controller, Z-Wave controller, network, hub, or any external system in these instructions
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

After rewording instructions, double check them for the following requirements:

- Use individual sentences for instructions with one or two steps.
- Turn instructions with 3 or more steps into a numbered list.

### `manual` URL

- Do not change the `manual` URL under any circumstances
