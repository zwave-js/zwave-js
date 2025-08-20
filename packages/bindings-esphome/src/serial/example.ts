/**
 * Example usage of the ESPHome Z-Wave binding
 */

import type { ZWaveSerialBindingFactory } from "@zwave-js/serial";
import { type ESPHomeSocketOptions, createESPHomeFactory } from "./esphome.js";

// Example configuration using options object
const espHomeOptions: ESPHomeSocketOptions = {
	host: "192.168.1.100", // IP address of your ESPHome device
	port: 6053, // ESPHome API port (optional, defaults to 6053)
};

// Create the binding factory using options object
export const createESPHomeBindingFromOptions = (): ZWaveSerialBindingFactory =>
	createESPHomeFactory(espHomeOptions);

// Export the factory and types for use with zwave-js
export type { ESPHomeSocketOptions } from "./esphome.js";
export { createESPHomeFactory } from "./esphome.js";

// Usage example:
// import { Driver } from "zwave-js";
// import { createESPHomeFactory } from "@zwave-js/bindings-esphome";
//
// const binding = createESPHomeFactory({ host: "192.168.1.100", port: 6053 });
// const driver = new Driver(binding, driverOptions);
// await driver.start();
