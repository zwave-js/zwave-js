let httpClientPromise: Promise<typeof import("ky").default> | undefined;

/**
 * Returns a shared proxy-aware HTTP client instance.
 * This client respects HTTP_PROXY and HTTPS_PROXY environment variables
 * when running in Node.js environments with undici available.
 */
export function getHttpClient(): Promise<typeof import("ky").default> {
	if (httpClientPromise) return httpClientPromise;

	httpClientPromise = (async () => {
		const { default: ky } = await import("ky");

		// Try to load undici for proxy support. This may fail in non-Node.js
		// runtimes, so we fall back to plain ky without proxy support.
		try {
			const { EnvHttpProxyAgent } = await import("undici");
			const proxyAgent = new EnvHttpProxyAgent();

			return ky.extend({
				// @ts-expect-error - The dispatcher option is passed through to fetch
				// and is supported by Node.js 18+ with undici.
				dispatcher: proxyAgent,
			});
		} catch {
			// undici is not available, use plain ky
			return ky;
		}
	})();

	return httpClientPromise;
}
