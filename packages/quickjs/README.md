# @zwave-js/quickjs

Host bindings that let Z-Wave JS run on [txiki.js](https://github.com/saghul/txiki.js), a small
JavaScript runtime built on quickjs-ng and libuv. This package is private and exists to prove out
and maintain support for embedded, non-Node runtimes.

Verified against txiki.js **v26.6.0**.

## Building and running

```bash
# From the repository root
yarn build
yarn workspace @zwave-js/quickjs bundle
# Optional: type-check this package (it is not part of the TypeScript build)
yarn workspace @zwave-js/quickjs check

# Serve a mock controller and a securely communicating node, under Node.js
yarn mock-server -c test/secure_server_config.cjs

# Then, with a txiki.js binary on your PATH or built locally
tjs run packages/quickjs/build/boot.js
```

`boot.js` is only a driver: the mock controller and node run in a separate Node.js process, and the
driver reaches them over TCP through the `connect` serial binding. It waits for `driver ready` and
for every node's interview to complete, reports whether the device config index had to be
regenerated, and destroys the driver.

`test/secure_server_config.cjs` defines a node that communicates securely, so the interview runs the
S2 nonce exchange and encrypts every command — that is what covers the WebCrypto-backed primitives.
Its keys have to match the ones in `boot.ts`. Pointing `-c` at the repository's `server_config.cjs`
also works, but its node is insecure and no crypto is exercised.

Environment variables:

| Variable             | Default                          | Purpose                                          |
| -------------------- | -------------------------------- | ------------------------------------------------ |
| `ZWAVEJS_CONFIG_DIR` | `../../config/config`            | The embedded device configuration directory      |
| `ZWAVEJS_CACHE_DIR`  | `$TMPDIR/zwave-js-quickjs-cache` | Where the network cache and value DBs are stored |
| `ZWAVEJS_LOGLEVEL`   | unset (logging disabled)         | Enables driver logging at the given level        |
| `ZWAVEJS_PORT`       | `tcp://127.0.0.1:5555`           | Where the mock server (or a real stick) listens  |

Run it twice: the first boot may generate the ~3300-entry device config index, but the second must
report `device index: reused`. A second boot that regenerates means `stat()` is not returning a
stable `mtime`.

## What the bindings provide

- **`fs`** — the `FileSystem` bindings over the `tjs` file APIs. `stat()` maps txiki's `mtim` to
  `mtime`, which the device config index staleness check depends on; without it the index is
  regenerated on every boot.
- **`db`** — the `Database` bindings over `tjs:sqlite`. Because `get`/`has`/`keys`/`entries`/`size`
  are synchronous, the full contents are loaded into a `Map` on `open()` and every mutation is
  written through to SQLite.
- **`serial`** — the `connect` capability over `tjs.connect`, which yields TCP and ESPHome transports
  through `createSocketFactory` and `createESPHomeFactory`.

Crypto needs no binding: bundling with `--conditions=browser` selects
`@zwave-js/core`'s WebCrypto-based primitives, and txiki.js's `crypto.subtle` covers AES-CBC,
AES-CTR, HMAC/SHA-256, SHA-1, SHA-256 and X25519. ChaCha20-Poly1305 comes from `@noble/ciphers`.

Note that txiki.js marks a `Uint8Array`'s whole backing `ArrayBuffer` immutable for the duration of
an async `crypto.subtle` call that reads from it, and `importKey` rejects views over an immutable
buffer. Passing two views of the same buffer to overlapping crypto calls therefore fails on this
runtime, which is why `CtrDRBG` keeps its key and counter in separate buffers. That constraint is
guarded by a unit test rather than by this boot check, since it only shows up when the same process
performs a lot of S2 crypto.

## Not supported

- **Direct serial ports.** `Serial.createFactoryByPath` only accepts `tcp://` and `esphome://` URLs.
  libuv's behavior on a `/dev/tty*` file descriptor is unverified, and there is no way to configure
  baud rate or line discipline from txiki.js.
- **Listing serial ports.** `Serial.list` is not implemented.
- **mDNS discovery of remote controllers.** The `@zwave-js/serial` stub bindings are used instead.
- **Granted security classes.** The mock server can hold the network keys, but a node it serves is
  never _granted_ a security class, because that only happens through inclusion. The driver therefore
  encrypts and exchanges nonces but reports no security class for the node.
- **The `Platform` binding.** txiki.js exposes no OS name — `tjs.system` only carries
  `cpus`/`loadAvg`/`networkInterfaces`/`uptime`/`userInfo` — so there is no honest value to report
  other than `"other"`.

## Bundling notes

The bundle is ESM, not a flattened IIFE: a single top-level function scope exceeds quickjs's
`JS_MAX_LOCAL_VARS` limit of 65534.

`platform: "neutral"` configures no `mainFields` at all, so `mainFields: ["module", "main"]` is
required for CommonJS-only dependencies without an `exports` map (`json5`, `json-logic-js`,
`dayjs`).

The source map is emitted as `external`, without a `sourceMappingURL` comment. txiki.js loads and
parses a referenced map eagerly at startup, which raises peak RSS from ~75 MB to ~180 MB — more than
the rest of the driver costs. Pass the map to a decoder manually when a stack trace needs resolving.

No Node builtin polyfills are needed. `packages/web`'s `nodeModulesPolyfillPlugin` entries
(`path`, `module`, `url`, `dgram`, `os`, `buffer`, `events`) are not required here, and are no longer
required by that package either.
