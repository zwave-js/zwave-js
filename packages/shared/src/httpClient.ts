let httpClient: typeof import("ky").default | undefined;

/**
 * Returns a shared proxy-aware HTTP client instance.
 * This client respects HTTP_PROXY and HTTPS_PROXY environment variables.
 */
export async function getHttpClient(): Promise<typeof import("ky").default> {
	if (httpClient) return httpClient;

	const { default: ky } = await import("ky");
	const { EnvHttpProxyAgent } = await import("undici");
	const proxyAgent = new EnvHttpProxyAgent();

	httpClient = ky.extend({
		// @ts-expect-error - dispatcher is not in the type definition, but it's passed through to fetch.
		dispatcher: proxyAgent,
	});

	return httpClient;
}
