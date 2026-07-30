/** This module defines which users are authorized to give the bot commands */

const { config } = require("./config.cjs");

const authorizedUsers = config.users.authorized;
const reviewers = {
	config: ["AlCalzone", "blhoward2"],
};
module.exports = {
	authorizedUsers,
	reviewers,
};
