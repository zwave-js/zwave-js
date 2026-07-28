module.exports = {
	addCompatFlag: (...args) => require("./addCompatFlag.cjs")(...args),
	addCompatFlagCreatePR: (...args) =>
		require("./addCompatFlagCreatePR.cjs")(...args),
	addFingerprint: (...args) => require("./addFingerprint.cjs")(...args),
	addFingerprintCreatePR: (...args) =>
		require("./addFingerprintCreatePR.cjs")(...args),
	approveWorkflows: (...args) => require("./approveWorkflows.cjs")(...args),
	checkAuthorized: (...args) => require("./checkAuthorized.cjs")(...args),
	classifyLogfile: (...args) =>
		require("./classifyLogfile.cjs").classifyLogfile(...args),
	classificationToFeedback: (...args) =>
		require("./classifyLogfile.cjs").classificationToFeedback(...args),
	extractLogfile: (...args) => require("./extractLogfile.cjs")(...args),
	extractLogfileInDiscussion: (...args) =>
		require("./extractLogfileInDiscussion.cjs")(...args),
	ensureLogfileFeedback: (...args) =>
		require("./ensureLogfileFeedback.cjs")(...args),
	ensureLogfileFeedbackInDiscussion: (...args) =>
		require("./ensureLogfileFeedbackInDiscussion.cjs")(...args),
	hideTransferredComments: (...args) =>
		require("./hideTransferredComments.cjs")(...args),
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
	answerFromDocs: (...args) => require("./answerFromDocs.cjs")(...args),
	extractLogfileUrlFromDiscussion: (...args) =>
		require("./extractLogfileUrlFromDiscussion.cjs")(...args),
	escalate: (...args) => require("./escalate.cjs")(...args),
	updatePostsIndex: (...args) => require("./updatePostsIndex.cjs")(...args),
	updateEvalTrackingIssue: (...args) =>
		require("./updateEvalTrackingIssue.cjs")(...args),
};
