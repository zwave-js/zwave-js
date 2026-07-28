#!/bin/sh
set -e

# Setup main repo
echo "🏗️  Preparing repository..."
echo ""
yarn
yarn node maintenance/patch-typescript.js
# Run serially: the bootstrap scripts each build the shared project references
# (core, shared, config) themselves, and concurrent builds clobber each other's
# declaration outputs. Sequential runs skip them as up-to-date instead.
yarn turbo run bootstrap --concurrency=1
echo "✅ Repository ready"

# Do not install VSCode extension on CI
if [ -z "$CI" ]; then
	# Install/Update VSCode extension
	echo ""
	echo "🏗️  Preparing VSCode extension..."
	echo ""
	git submodule update --init -- .vscode/extensions/zwave-js-config-editor
	cd .vscode/extensions/zwave-js-config-editor
	git checkout main
	npm i
	# TODO check if this can be made better. We want to build in any case.
	if [ -d out ]; then
		npm run build
		echo ""
		echo "✅ VSCode extension ready"
		echo ""
	else
		npm run build
		echo ""
		echo "✅ VSCode extension ready. Install the recommended workspace extension to use it!"
		echo ""
	fi
fi
