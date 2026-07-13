# Z-Wave JS development MCP server

The `zwave-dev` MCP server provides tools for authoring and reviewing device
configuration files. It runs locally over stdio and is configured in the
repository's `.mcp.json` and `.vscode/mcp.json`.

## Semantic parameter discovery

Three tools help recognize equivalent parameter concepts despite inconsistent
manufacturer terminology:

- `search_parameter_definitions` searches concrete parameters and reusable
  templates from a free-text description.
- `find_similar_parameters` starts from a parameter in a device config and
  returns similar parameters, compatible templates, structural differences,
  `$import` suggestions, and evidence for possible `$purpose` values.
- `suggest_parameter_purpose` accepts free text or a concrete parameter and
  ranks `$purpose` values using prototypes derived from existing tagged
  parameters.

Parameter embeddings intentionally exclude the `$purpose` identifier. For each
purpose, the server deduplicates tagged definitions, averages their normalized
vectors into a prototype, and retains definitions nearest the
prototype as examples. Purpose results include prototype similarity, sample
size, confidence, and those representative definitions so agents can review
the inferred meaning.

Embeddings only rank candidates. Results are evidence for a developer or agent
to review; the tools do not modify configs or assert that definitions are
equivalent.

### Local model and consent

The server runs
[`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
in the MCP process. The q8 model artifact and tokenizer metadata are
approximately 24 MB. The model is pinned to revision
`751bff37182d3f1213fa05d7196b954e230abad9` and uses the Apache-2.0 license.

No model is downloaded during dependency installation, build, MCP startup, or
unrelated tool calls. On the first semantic search:

1. The server first checks the local model cache.
2. If the model is absent and the client supports MCP elicitation, the client
   displays the model source, license, revision, size, and cache path for
   approval.
3. The approve or decline decision is saved for that exact model revision.
   A new revision requires a new decision.
4. Clients without elicitation receive a
   `model_download_consent_required` result without downloading anything.

The model, semantic index, and consent decision are cached separately under
`$XDG_CACHE_HOME/zwave-js-mcp-server-dev`, or `~/.cache` when
`XDG_CACHE_HOME` is unset. Delete the consent file shown in the tool response,
or set `ZWAVE_DEV_SEMANTIC_CONSENT_FILE`, to reset a saved choice.

### Headless configuration

Set these variables in the `env` object of the MCP server configuration.

| Variable                             | Default    | Description                                                 |
| ------------------------------------ | ---------- | ----------------------------------------------------------- |
| `ZWAVE_DEV_SEMANTIC_ENABLED`         | `true`     | Set to `false` to disable all semantic tools                |
| `ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD`  | `ask`      | `ask`, `allow`, or `deny`; explicit values override consent |
| `ZWAVE_DEV_SEMANTIC_MODEL_CACHE_DIR` | User cache | Local model artifact directory                              |
| `ZWAVE_DEV_SEMANTIC_INDEX_CACHE_DIR` | User cache | Embedding index directory                                   |
| `ZWAVE_DEV_SEMANTIC_CONSENT_FILE`    | User cache | Persisted local-model consent decisions                     |

For a headless local setup that may download the pinned model:

```json
{
	"env": {
		"ZWAVE_DEV_SEMANTIC_LOCAL_DOWNLOAD": "allow"
	}
}
```

The first search embeds the current parameter corpus. Later searches reuse
cached vectors for unchanged definitions, while config edits are picked up on
the next tool call.

To disable semantic discovery without affecting other MCP tools:

```json
{
	"env": {
		"ZWAVE_DEV_SEMANTIC_ENABLED": "false"
	}
}
```
