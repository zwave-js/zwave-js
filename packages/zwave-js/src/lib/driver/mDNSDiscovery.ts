export { discoverRemoteSerialPorts } from "#mdns_discovery";

export interface RemoteSerialPort {
	port: string;
	info: Record<string, string>;
}
