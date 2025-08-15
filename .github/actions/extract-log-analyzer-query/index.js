const core = require("@actions/core");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai").default;

async function run() {
	try {
		// Get inputs
		const discussionBody = core.getInput("discussion-body", {
			required: true,
		});
		const githubToken = core.getInput("github-token", { required: true });

		// Read and parse the prompt file
		const promptFilePath = path.join(
			process.env.GITHUB_WORKSPACE,
			".github/prompts/extract-log-analyzer-query.prompt.yml",
		);
		const promptFileContent = fs.readFileSync(promptFilePath, "utf8");
		const promptConfig = yaml.load(promptFileContent);

		// Extract system and user messages from the prompt config
		const messages = promptConfig.messages.map((msg) => {
			let content = msg.content;
			// Replace {{input}} placeholder with actual discussion body
			if (content.includes("{{input}}")) {
				content = content.replace("{{input}}", discussionBody);
			}
			return {
				role: msg.role,
				content: content,
			};
		});

		// Set up OpenAI client for GitHub AI inference
		const endpoint = "https://models.github.ai/inference";
		const model = promptConfig.model || "openai/gpt-4.1";

		const client = new OpenAI({
			baseURL: endpoint,
			apiKey: githubToken,
		});

		// Make the AI inference request
		const requestParams = {
			messages: messages,
			model: model,
			temperature: 1.0,
			top_p: 1.0,
		};

		// Add model parameters if specified in the prompt config
		if (promptConfig.modelParameters?.max_completion_tokens) {
			requestParams.max_completion_tokens =
				promptConfig.modelParameters.max_completion_tokens;
		}

		console.log("Making AI inference request with model:", model);
		const response = await client.chat.completions.create(requestParams);

		const extractedQuery = response.choices[0].message.content;

		// Log the extracted query for debugging
		console.log("Extracted query:", extractedQuery);

		// Set the output
		core.setOutput("result", extractedQuery);
	} catch (error) {
		core.setFailed(`Action failed: ${error.message}`);
		console.error("Error details:", error);
	}
}

run();
