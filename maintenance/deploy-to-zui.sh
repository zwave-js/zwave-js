#!/bin/bash

set -e
set -o pipefail

# Builds and packs the project for local testing in Z-Wave JS UI

## Ensure we've been given a path to Z-UI
if [ -z "$1" ]; then
	read -p "Please enter the path to Z-Wave JS UI: " ZWAVE_JS_UI_PATH
else
	ZWAVE_JS_UI_PATH="$1"
fi

zui_package_json="$ZWAVE_JS_UI_PATH/package.json"
if ! [ -f "$zui_package_json" ] || ! jq -e '.name == "zwave-js-ui"' "$zui_package_json" > /dev/null; then
  echo "Error: $ZWAVE_JS_UI_PATH does not contain a package.json with name: zwave-js-ui"
  exit 1
fi

## Build Z-Wave JS
echo "Packing Z-Wave JS tarballs"
rm -rf .monopack/
yarn build
yarn monopack --absolute --no-version

## And deploy it to Z-UI
echo "Deploying to Z-Wave JS UI"
ABS_PATH="$(cd "$(dirname "$0")/.." && pwd)"
TMP_CACHE_DIR="/tmp/empty-cache-$(date +%s%N)"

cd "$ZWAVE_JS_UI_PATH"
git restore package.json package-lock.json
rm -rf "$TMP_CACHE_DIR"
npm i "$ABS_PATH/.monopack/zwave-js.tgz" --cache "$TMP_CACHE_DIR"
