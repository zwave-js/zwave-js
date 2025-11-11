// Remove everything that's not a letter, number, . or -
function normalizeUserAgentPortion(str: string): string {
	return str.replaceAll(/[^a-zA-Z0-9.-]/g, "");
}

export function mergeUserAgent(
	existingComponents: Map<string, string>,
	additionalComponents: Record<string, string | null | undefined>,
	allowOverwrite: boolean = false,
): Map<string, string> {
	const ret = new Map(existingComponents);

	for (let [name, version] of Object.entries(additionalComponents)) {
		name = normalizeUserAgentPortion(name);
		// node-zwave-js was renamed to zwave-js in v15
		if (name === "node-zwave-js" || name === "zwave-js") continue;

		if (!allowOverwrite && ret.has(name)) continue;

		if (version == undefined) {
			ret.delete(name);
		} else {
			version = normalizeUserAgentPortion(version);
			ret.set(name, version);
		}
	}

	return ret;
}

export function userAgentComponentsToString(
	components: Map<string, string>,
): string {
	return [...components]
		.map(([name, version]) => `${name}/${version}`)
		.join(" ");
}
