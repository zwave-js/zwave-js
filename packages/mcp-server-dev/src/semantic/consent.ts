import { getErrorMessage } from "@zwave-js/shared";
import { readFile } from "node:fs/promises";
import type { LocalDownloadPolicy } from "./env.js";
import { LOCAL_MODEL_ID, LOCAL_MODEL_REVISION } from "./env.js";
import { writeFileAtomic } from "./fsUtils.js";

export interface ConsentRecord {
	modelId: string;
	revision: string;
	approved: boolean;
	decidedAt: string;
}

export interface ConsentStore {
	version: 1;
	records: ConsentRecord[];
}

export type ConsentDecision = "approve" | "decline" | "cancel";

export function emptyConsentStore(): ConsentStore {
	return { version: 1, records: [] };
}

export function findConsentRecord(
	store: ConsentStore,
	modelId: string,
	revision: string,
): ConsentRecord | undefined {
	// A different revision is treated as an entirely new download that needs
	// its own consent, even for the same model id.
	return store.records.find(
		(r) => r.modelId === modelId && r.revision === revision,
	);
}

/** Pure, immutable update: replaces any existing record for the same model+revision */
export function withConsentRecord(
	store: ConsentStore,
	record: ConsentRecord,
): ConsentStore {
	const records = store.records.filter(
		(r) =>
			!(r.modelId === record.modelId && r.revision === record.revision),
	);
	records.push(record);
	return { version: 1, records };
}

export async function loadConsentStore(
	filePath: string,
): Promise<ConsentStore> {
	let text: string;
	try {
		text = await readFile(filePath, "utf8");
	} catch (error: any) {
		if (error?.code === "ENOENT") return emptyConsentStore();
		throw new Error(
			`Failed to read semantic model consent file ${filePath}: ${
				getErrorMessage(error)
			}`,
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		throw new Error(
			`Semantic model consent file ${filePath} is invalid JSON: ${
				getErrorMessage(error)
			}`,
		);
	}
	if (
		parsed == null
		|| typeof parsed !== "object"
		|| (parsed as Partial<ConsentStore>).version !== 1
		|| !Array.isArray((parsed as Partial<ConsentStore>).records)
		|| !(parsed as ConsentStore).records.every((record) =>
			record != null
			&& typeof record === "object"
			&& typeof record.modelId === "string"
			&& typeof record.revision === "string"
			&& typeof record.approved === "boolean"
			&& typeof record.decidedAt === "string"
		)
	) {
		throw new Error(
			`Semantic model consent file ${filePath} has an invalid structure.`,
		);
	}
	return parsed as ConsentStore;
}

export async function saveConsentStore(
	filePath: string,
	store: ConsentStore,
): Promise<void> {
	await writeFileAtomic(filePath, JSON.stringify(store, null, "\t"));
}

/** Adds or replaces one consent decision, preserving records for other
 * model revisions already in the file */
export async function persistConsentRecord(
	filePath: string,
	record: ConsentRecord,
): Promise<void> {
	const current = await loadConsentStore(filePath);
	await saveConsentStore(filePath, withConsentRecord(current, record));
}

export async function persistConsentDecision(
	filePath: string,
	modelId: string,
	revision: string,
	decision: ConsentDecision,
): Promise<void> {
	if (decision === "cancel") return;
	await persistConsentRecord(filePath, {
		modelId,
		revision,
		approved: decision === "approve",
		decidedAt: new Date().toISOString(),
	});
}

export type ConsentAction =
	// Consent for this exact model+revision is already resolved (or the env
	// policy forces a decision); proceed straight to loading.
	| { type: "proceed"; localFilesOnly: boolean }
	// No saved decision exists and the policy is "ask": the caller must elicit
	// the user via the MCP client before loading can proceed.
	| { type: "elicit" };

/**
 * Pure decision of what to do before loading the local embedding model, given
 * the configured download policy and any previously saved consent. Contains
 * no I/O so it can be unit tested directly.
 */
export function decideConsentAction(
	downloadPolicy: LocalDownloadPolicy,
	storedRecord: ConsentRecord | undefined,
): ConsentAction {
	if (downloadPolicy === "deny") {
		// Still attempt to load from whatever is already cached locally;
		// only network downloads are blocked.
		return { type: "proceed", localFilesOnly: true };
	}
	if (downloadPolicy === "allow") {
		return { type: "proceed", localFilesOnly: false };
	}
	// downloadPolicy === "ask"
	if (storedRecord) {
		return { type: "proceed", localFilesOnly: !storedRecord.approved };
	}
	return { type: "elicit" };
}

export class ConsentRequiredError extends Error {
	constructor(
		public readonly modelCacheDir: string,
		public readonly consentFile: string,
	) {
		super(
			`Downloading the local semantic search model `
				+ `(${LOCAL_MODEL_ID}@${LOCAL_MODEL_REVISION}) requires user `
				+ `consent, but the connected MCP client does not support elicitation.`,
		);
		this.name = "ConsentRequiredError";
	}
}

export class LocalModelUnavailableError extends Error {
	constructor(
		public readonly modelCacheDir: string,
		public readonly downloadPolicy: LocalDownloadPolicy,
	) {
		super(
			`The local semantic model ${LOCAL_MODEL_ID}@${LOCAL_MODEL_REVISION} `
				+ `is not available in ${modelCacheDir}, and the current download `
				+ `policy "${downloadPolicy}" does not permit downloading it.`,
		);
		this.name = "LocalModelUnavailableError";
	}
}
