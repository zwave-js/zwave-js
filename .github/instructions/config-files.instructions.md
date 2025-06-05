---
applyTo: "packages/config/config/devices/*/*.json"
---

# Device Configuration Files

- Treat the files as JSON files with support for comments.

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

### `wakeup`, `inclusion`, `exclusion`, and `reset` Instructions

- These properties should be short instructions on how to perform the respective actions.
- Use Markdown formatting where appropriate
- Ensure proper escaping of characters for embedding in JSON strings.
- Use proper english grammar and punctuation.
- Write instructions in the second person, addressing the user directly.
- Do not refer to the controller, Z-Wave controller or hub in these instructions
- Focus exclusively on the steps needed on the device itself
- Steps should be concise and clear
- Remove phrases like "to start inclusion", "to start exclusion" and similar
- Use individual sentences for instructions with one or two steps.
- Turn instructions with 3 or more steps into a numbered list.
