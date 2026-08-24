---
name: add-endpoint-labels
description: Add human-readable endpoint labels to a Z-Wave JS device config file based on information from the device manual or manufacturer website. Use when asked to add endpoint labels to a specific device config, or when processing candidates from the findMultiEndpointDevices script.
---

You are an expert assistant for adding endpoint labels to Z-Wave JS device configuration files. Your task is to research what each Multi Channel endpoint on a device controls, then add a concise human-readable `label` to the appropriate endpoint entries in the config file. You must strictly follow the rules in `.agents/instructions/config-files.md` (relative to the repository root). Read that file before starting, paying particular attention to the "Endpoint Labels" section.

# When to Add Endpoint Labels

Endpoint labels are valuable for multi-endpoint devices where each endpoint controls a distinct, named function — for example, a 4-relay module where endpoints map to individual relays, or a thermostat controller where endpoints represent sensor inputs. They allow consumers of the device config (e.g., home automation UIs) to display meaningful names instead of bare endpoint indices.

Only add an endpoint label when the device manual or manufacturer's product page **explicitly describes what that endpoint controls**. Never invent labels or derive them from the endpoint's device class alone.

# Required Information

Before starting, ensure you have:

1. **Config file path** (relative to repo root), e.g. `packages/config/config/devices/0x0371/zw164.json`
2. **Device manual or manufacturer page URL** — the primary source for endpoint names
3. (Optional) **Endpoint summary from the discovery script** — the `endpointCount` and per-endpoint `genericClassName`/`specificClassName` fields from `findMultiEndpointDevices.ts` output help you verify endpoint count alignment

# Primary Tasks

## 1. Fetch and Read the Device Documentation

Fetch the device manual or manufacturer product page. Look for:

- An explicit list of what each channel/output/zone/circuit controls
- Per-channel or per-endpoint naming in diagrams, wiring tables, or feature lists
- Multi Channel endpoint mapping in the Z-Wave or technical specification section

If the page links to a PDF manual, fetch the PDF and extract the relevant section.

If a `zwaveAllianceId` is present in the config's `devices[]` array, also check the Z-Wave Alliance product page at `https://products.z-wavealliance.org/Products/{id}` for additional documentation links. Note: the JSON API (`/Products/{id}/json`) no longer returns data; use the HTML page and any linked manuals instead.

## 2. Map Documentation to Endpoint Numbers

Multi Channel endpoints are numbered starting from 1; endpoint 0 is the root device. Confirm that the endpoint numbering in the documentation matches the Z-Wave endpoint indices — manufacturers sometimes use 1-based channel numbering that aligns directly, or they may number differently.

Use the optional endpoint summary (from the discovery script) as a cross-check: the `genericClassName` (e.g. `"GENERIC_TYPE_SWITCH_BINARY"`) describes what kind of thing each endpoint exposes and helps verify you have the right endpoint-to-label mapping.

## 3. Derive Labels

Label rules (see "Endpoint Labels" in `config-files.md` for the full rules):

- Labels must come from the device documentation — never invent or guess
- Start from the name the documentation uses, then apply the normalization rules below
- Apply Title Case
- If multiple endpoints share an undifferentiated type, disambiguate with an index matching the documentation ("Relay 1", "Relay 2"; "Circuit 1", "Circuit 2")
- Keep labels short (1–3 words is typical); omit redundant words like "channel" or "endpoint" unless they are part of the documented name
- **Describe the device part, not the abstract feature** — prefer "Temperature Sensor" over "Temperature", "Motion Sensor" over "Motion"
- **Normalize cryptic manufacturer-internal names** when normalization loses no information about what the endpoint does. If a typical user would not understand the documented name without consulting the manual, replace it with a clear generic label — e.g. `SIG1` → `Input 1`, `OUT1` → `Output 1`.
- **Keep informative original names verbatim** when the documented name carries feature context a generic label would lose — e.g. `CT1` (current-transformer clamp input) stays `CT1`, because `Input 1` would drop that context. Do not expand or reword such names.
- Do not label root endpoint 0 unless the documentation gives it a specific name distinct from the device itself
- If any endpoint's purpose is undocumented, **omit it** — do not assign a placeholder or device-class-derived label

## 4. Check for Root Association Migration

If the existing config file has a root-level `associations` block, adding an `endpoints` block requires migrating those root associations under `endpoints["0"]` per the file format rules. This migration is subtle — it involves `$import` self-references and must be reviewed carefully.

**When the config has root-level associations: do not auto-migrate.** Instead, present the proposed endpoint labels and note that the file requires association migration before the labels can be applied. Ask the user to confirm before proceeding, or offer to perform the migration with explicit review.

Files without root-level associations are safe to update directly.

## 5. Apply the Labels

Insert the `endpoints` block in property order position 8 (after `firmwareVersion`/`preferred`, before `associations`). Only include endpoints that have a label. The `label` field is the only required field for a label-only endpoint entry:

```json
"endpoints": {
    "1": { "label": "Relay 1" },
    "2": { "label": "Relay 2" },
    "3": { "label": "Relay 3" },
    "4": { "label": "Relay 4" }
}
```

If an endpoint also has existing `associations` or `paramInformation`, keep them and add `label` alongside.

## 6. Validate

Run the `zwave-dev` MCP validation chain in order — do not finalize until all pass clean:

1. `autofix_config` — fix any automatically correctable issues
2. `lint_config` — detect remaining semantic errors
3. `format` — ensure consistent formatting (run once at the end)

# Example

Before (excerpt):

```json
{
    "manufacturer": "Fibaro",
    "manufacturerId": "0x010f",
    "label": "FGS-223",
    "description": "Double Switch 2",
    "devices": [{ "productType": "0x0203", "productId": "0x1000" }],
    "firmwareVersion": { "min": "0.0", "max": "255.255" },
    "paramInformation": [...]
}
```

After (excerpt, labels sourced from "Channel 1: S1 input" / "Channel 2: S2 input" in the manual):

```json
{
    "manufacturer": "Fibaro",
    "manufacturerId": "0x010f",
    "label": "FGS-223",
    "description": "Double Switch 2",
    "devices": [{ "productType": "0x0203", "productId": "0x1000" }],
    "firmwareVersion": { "min": "0.0", "max": "255.255" },
    "endpoints": {
        "1": { "label": "S1" },
        "2": { "label": "S2" }
    },
    "paramInformation": [...]
}
```

# Processing Multiple Candidates

When working from the `findMultiEndpointDevices.ts` output, process candidates one at a time:

1. Pick a candidate with a `manualUrl` (skip ones where `manualUrl` is null unless you can find documentation through another means)
2. Fetch and read the documentation
3. Only proceed if you can find clear, documented endpoint names
4. Apply labels, validate, and move to the next candidate
5. Skip (and note) any candidate where endpoint names are not documented

Do not apply labels to multiple files simultaneously — validate each one before moving on.
