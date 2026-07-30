// Mock server configuration for the txiki.js boot check. Run with
//   yarn mock-server -c packages/quickjs/mock-config.mjs
// The keys must match the ones in src/boot.ts, and node 2 is secure so that the
// boot exercises the WebCrypto-backed S2 primitives rather than just framing.

const securityKeys = {
	S0_Legacy: Buffer.from("0102030405060708090a0b0c0d0e0f10", "hex"),
	S2_Unauthenticated: Buffer.from(
		"11111111111111111111111111111111",
		"hex",
	),
	S2_Authenticated: Buffer.from("22222222222222222222222222222222", "hex"),
	S2_AccessControl: Buffer.from("33333333333333333333333333333333", "hex"),
};

export default ({ require }) => {
	const { CommandClasses, SecurityClass } = require("@zwave-js/core");

	return {
		controller: {
			homeId: 0x7e570001,
			ownNodeId: 1,
			securityKeys,
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
					securityClasses: new Set([
						SecurityClass.S2_Unauthenticated,
					]),
				},
			},
		],
	};
};
