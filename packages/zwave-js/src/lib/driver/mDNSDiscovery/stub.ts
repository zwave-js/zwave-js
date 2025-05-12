import type { RemoteSerialPort } from "../mDNSDiscovery.js";

// On other platforns than Node.js, we cannot use mDNS discovery
export function discoverRemoteSerialPorts(
	_timeout: number | false = 1000,
): Promise<RemoteSerialPort[] | undefined> {
	return Promise.resolve([]);
}
