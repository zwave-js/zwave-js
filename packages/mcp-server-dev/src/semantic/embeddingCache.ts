import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeFileAtomic } from "./fsUtils.js";
import { sha256Hex, stableStringify } from "./hash.js";

export interface EmbeddingCacheKey {
	schemaVersion: number;
	model: string;
	revision: string;
	dimensions: number;
}

interface EmbeddingCacheEntry extends EmbeddingCacheKey {
	semanticHash: string;
	vector: number[];
	createdAt: string;
}

function isValidEntry(
	value: unknown,
	key: EmbeddingCacheKey,
	semanticHash: string,
): value is EmbeddingCacheEntry {
	if (value == null || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	return v.schemaVersion === key.schemaVersion
		&& v.model === key.model
		&& v.revision === key.revision
		&& v.dimensions === key.dimensions
		&& v.semanticHash === semanticHash
		&& Array.isArray(v.vector)
		&& v.vector.length === key.dimensions
		&& v.vector.every((entry) =>
			typeof entry === "number" && Number.isFinite(entry)
		);
}

/**
 * Flat, per-semantic-hash embedding cache on disk. Entries are namespaced by a
 * hash of the model/revision/dimensions so switching models never serves stale
 * vectors, while unchanged records across repeated
 * corpus builds reuse their cached embedding instead of recomputing it.
 */
export class EmbeddingCache {
	private readonly namespaceDir: string;
	private readonly memory = new Map<string, number[]>();

	constructor(cacheDir: string, private readonly key: EmbeddingCacheKey) {
		const namespace = sha256Hex(stableStringify(key)).slice(0, 16);
		this.namespaceDir = join(cacheDir, namespace);
	}

	private fileFor(semanticHash: string): string {
		return join(this.namespaceDir, `${semanticHash}.json`);
	}

	async get(semanticHash: string): Promise<number[] | undefined> {
		const cached = this.memory.get(semanticHash);
		if (cached) return cached;

		try {
			const text = await readFile(this.fileFor(semanticHash), "utf8");
			const parsed: unknown = JSON.parse(text);
			if (isValidEntry(parsed, this.key, semanticHash)) {
				this.memory.set(semanticHash, parsed.vector);
				return parsed.vector;
			}
		} catch {
			// Not cached yet, or the file is missing/corrupt: treat as a cache miss
		}
		return undefined;
	}

	async set(semanticHash: string, vector: number[]): Promise<void> {
		if (
			vector.length !== this.key.dimensions
			|| vector.some((entry) =>
				typeof entry !== "number" || !Number.isFinite(entry)
			)
		) {
			throw new Error(
				`Cannot cache ${vector.length}-dimensional embedding for `
					+ `${this.key.dimensions}-dimensional model ${this.key.model}.`,
			);
		}
		this.memory.set(semanticHash, vector);
		const entry: EmbeddingCacheEntry = {
			...this.key,
			semanticHash,
			vector,
			createdAt: new Date().toISOString(),
		};
		await writeFileAtomic(
			this.fileFor(semanticHash),
			JSON.stringify(entry),
		);
	}
}
