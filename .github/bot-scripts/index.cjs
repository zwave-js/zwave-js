module.exports = {
	addCompatFlag: (...args) => require("./addCompatFlag.cjs")(...args),
	addCompatFlagCreatePR: (...args) =>
		require("./addCompatFlagCreatePR.cjs")(...args),
	addFingerprint: (...args) => require("./addFingerprint.cjs")(...args),
	addFingerprintCreatePR: (...args) =>
		require("./addFingerprintCreatePR.cjs")(...args),
	approveWorkflows: (...args) => require("./approveWorkflows.cjs")(...args),
	checkAuthorized: (...args) => require("./checkAuthorized.cjs")(...args),
	ensureLogfile: (...args) => require("./ensureLogfile.cjs")(...args),
	ensureLogfileInDiscussion: (...args) =>
		require("./ensureLogfileInDiscussion.cjs")(...args),
	extractLogfile: (...args) => require("./extractLogfile.cjs")(...args),
	extractLogfileInDiscussion: (...args) =>
		require("./extractLogfileInDiscussion.cjs")(...args),
	ensureLogfileFeedback: (...args) =>
		require("./ensureLogfileFeedback.cjs")(...args),
	ensureLogfileFeedbackInDiscussion: (...args) =>
		require("./ensureLogfileFeedbackInDiscussion.cjs")(...args),
	fixLintFeedback: (...args) => require("./fixLintFeedback.cjs")(...args),
	getFixLintInfo: (...args) => require("./getFixLintInfo.cjs")(...args),
	rebaseFeedback: (...args) => require("./rebaseFeedback.cjs")(...args),
	renameCommitGetPRInfo: (...args) =>
		require("./renameCommitGetPRInfo.cjs")(...args),
	renameCommitCheck: (...args) => require("./renameCommitCheck.cjs")(...args),
	renameCommitFeedback: (...args) =>
		require("./renameCommitFeedback.cjs")(...args),
	importConfigCreatePR: (...args) =>
		require("./importConfigCreatePR.cjs")(...args),
	shouldAutomerge: (...args) => require("./shouldAutomerge.cjs")(...args),
	packPr: (...args) => require("./packPr.cjs")(...args),
	analyzeLogfileParseCommand: (...args) =>
		require("./analyzeLogfileParseCommand.cjs")(...args),
	analyzeLogfile: (...args) => require("./analyzeLogfile.cjs")(...args),
	analyzeLogfileInDiscussion: (...args) =>
		require("./analyzeLogfileInDiscussion.cjs")(...args),
};
