#!/usr/bin/env bash
# compare-builds.sh
# Builds the project on two branches (legacy TS and tsgo) and diffs the ESM output.
#
# Usage: ./compare-builds.sh [--tsgo-bin PATH]
#   --tsgo-bin PATH  Path to a specific tsgo binary to use for the tsgo branch build.
#                    If omitted, uses the installed `tsgo` binary from package.json scripts as-is.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TSGO_BIN=""
TS_BRANCH="ts-6.0"
TSGO_BRANCH="switch-to-tsgo-preview"
ESM_PACKAGES=(cc config core host maintenance nvmedit serial shared testing zwave-js)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tsgo-bin) TSGO_BIN="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -n "$TSGO_BIN" && ! -x "$TSGO_BIN" ]]; then
  echo "tsgo binary not found or not executable: $TSGO_BIN" >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"

cleanup() {
  echo ""
  git checkout -- packages/*/package.json packages/*/tsconfig.build.json 2>/dev/null || true
  echo "Restoring original branch: $CURRENT_BRANCH"
  git checkout "$CURRENT_BRANCH" 2>&1
}
trap cleanup EXIT

# Restore any leftover modifications before switching branches
git checkout -- packages/*/package.json packages/*/tsconfig.build.json 2>/dev/null || true

# Avoid comparing stale build artifacts
rm -r built/

clean_build() {
  echo "Cleaning build outputs..."
  rm -rf packages/*/build packages/*/*.tsbuildinfo .turbo
}

collect_esm() {
  local dest="$1"
  rm -rf "$dest"
  for pkg in "${ESM_PACKAGES[@]}"; do
    if [[ -d "packages/$pkg/build/esm" ]]; then
      mkdir -p "$dest/$pkg"
      cp -r "packages/$pkg/build/esm/." "$dest/$pkg/"
    else
      echo "  WARNING: packages/$pkg/build/esm not found, skipping" >&2
    fi
  done
}

# ── Legacy TS build (master) ────────────────────────────────────────────────
echo "=== Switching to $TS_BRANCH ==="
git checkout "$TS_BRANCH" 2>&1
echo "=== yarn install ==="
yarn install 2>&1 | tail -3
clean_build
echo "=== Building (legacy TS) ==="
yarn build 2>&1 | tail -5
echo "=== Collecting ESM output -> built/ts/ ==="
collect_esm built/ts
echo "Collected $(find built/ts -name '*.js' | wc -l) .js files"

# ── tsgo build ──────────────────────────────────────────────────────────────
echo ""
echo "=== Switching to $TSGO_BRANCH ==="
git checkout "$TSGO_BRANCH" 2>&1
echo "=== yarn install ==="
yarn install 2>&1 | tail -3

# Patch build scripts to use the provided tsgo binary (only if --tsgo-bin was given)
if [[ -n "$TSGO_BIN" ]]; then
  echo "=== Patching build scripts to use: $TSGO_BIN ==="
  git checkout -- packages/*/package.json 2>/dev/null || true
  grep -rl '"build".*"tsgo ' packages/*/package.json | xargs sed -i "s|\"tsgo |\"$TSGO_BIN |g"
else
  echo "=== Using installed tsgo binary ==="
fi

clean_build
echo "=== Building (tsgo) ==="
yarn build 2>&1 | tail -5
echo "=== Collecting ESM output -> built/tsgo/ ==="
collect_esm built/tsgo
echo "Collected $(find built/tsgo -name '*.js' | wc -l) .js files"

# ── Diff ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Generating diffs -> built/diff/ ==="
rm -rf built/diff && mkdir -p built/diff

diff -rq built/ts built/tsgo 2>/dev/null | grep '^Files' \
  | sed "s|Files built/ts/\(.*\) and built/tsgo/.* differ|\1|" \
  | while IFS= read -r file; do
      dir="$(dirname "$file")"
      mkdir -p "built/diff/$dir"
      diff -u "built/ts/$file" "built/tsgo/$file" > "built/diff/${file%.js}.diff" 2>&1 || true
    done || true

TOTAL_DIFFS="$(find built/diff -name '*.diff' | wc -l)"
echo "Generated $TOTAL_DIFFS diff files."

echo ""
echo "=== Non-.map / non-.d.ts file differences ==="
diff -rq built/ts built/tsgo 2>/dev/null \
  | grep -v '\.map differ$' \
  | grep -v '\.ts differ$' \
  || echo "(none)"
