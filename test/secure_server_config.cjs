// @ts-check
const { CommandClasses, SecurityClass } = require("@zwave-js/core");

// Mock server config with a node that communicates securely, so a driver talking to it
// exercises the S2 nonce exchange and the AES-CCM encryption of every command.
// The keys must match the ones the driver is configured with.
const securityKeys = {
	S0_Legacy: Buffer.from("0102030405060708090a0b0c0d0e0f10", "hex"),
	S2_Unauthenticated: Buffer.from("11111111111111111111111111111111", "hex"),
	S2_Authenticated: Buffer.from("22222222222222222222222222222222", "hex"),
	S2_AccessControl: Buffer.from("33333333333333333333333333333333", "hex"),
};

/** @type {import("zwave-js/Testing").MockServerOptions["config"]} */
module.exports.default = {
	controller: {
		// MockServerControllerOptions does not declare securityKeys, but prepareMocks
		// spreads the whole config into MockController.create, which does accept it
		...{ securityKeys },
	},
	nodes: [
		{
			id: 2,
			capabilities: {
				commandClasses: [
					CommandClasses.Version,
					CommandClasses["Security 2"],
					{ ccId: CommandClasses.Basic, secure: true },
				],
				securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
			},
		},
	],
};
