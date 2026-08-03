module.exports = {
	addCompatFlag: (...args) => require("./addCompatFlag.cjs")(...args),
	addCompatFlagCreatePR: (...args) =>
		require("./addCompatFlagCreatePR.cjs")(...args),
	addFingerprint: (...args) => require("./addFingerprint.cjs")(...args),
	addFingerprintCreatePR: (...args) =>
		require("./addFingerprintCreatePR.cjs")(...args),
	approveWorkflows: (...args) => require("./approveWorkflows.cjs")(...args),
	checkAuthorized: (...args) => require("./checkAuthorized.cjs")(...args),
	hideTransferredComments: (...args) =>
		require("./hideTransferredComments.cjs")(...args),
	importConfigCreatePR: (...args) =>
		require("./importConfigCreatePR.cjs")(...args),
	shouldAutomerge: (...args) => require("./shouldAutomerge.cjs")(...args),
	escalate: (...args) => require("./escalate.cjs")(...args),
};
