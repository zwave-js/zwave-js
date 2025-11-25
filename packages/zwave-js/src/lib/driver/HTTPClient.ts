import ky, { type KyInstance } from "ky";

let client: KyInstance | undefined;

/**
 * Returns a shared proxy-aware HTTP client instance.
 * This client respects HTTP_PROXY and HTTPS_PROXY environment variables
 * when running in Node.js environments with undici available.
 */
export async function getHttpClient(): Promise<KyInstance> {
	if (!client) {
		// Try to load undici for proxy support. This will fail in non-Node.js
		// runtimes (e.g., browsers), so we fall back to plain ky without
		// proxy support there
		try {
			const { EnvHttpProxyAgent } = await import("undici");
			const proxyAgent = new EnvHttpProxyAgent();

			client = ky.extend({
				// @ts-expect-error - The dispatcher option is passed through
				// to Node.js's native fetch (which uses undici internally).
				// This requires Node.js 18.2.0+ or Node.js 19+.
				dispatcher: proxyAgent,
			});
		} catch {
			// undici is not available
			client = ky;
		}
	}

	return client;
}
