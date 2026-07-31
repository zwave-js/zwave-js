import type {
	Database,
	DatabaseFactory,
	DatabaseOptions,
} from "@zwave-js/shared/bindings";
import { Database as SQLiteDatabase, type IStatement } from "tjs:sqlite";

/**
 * An implementation of the Database bindings for txiki.js, backed by `tjs:sqlite`.
 *
 * The bindings expose `get`/`has`/`keys`/`entries`/`size` synchronously, so the full
 * contents are loaded into a `Map` on `open()` and every mutation is written through
 * to SQLite.
 */
class SQLiteCache<V> implements Database<V> {
	public constructor(filename: string, options: DatabaseOptions<V> = {}) {
		this.#filename = filename;
		this.#reviver = options.reviver;
		this.#serializer = options.serializer;
		this.#enableTimestamps = options.enableTimestamps ?? false;
	}

	#filename: string;
	#reviver: DatabaseOptions<V>["reviver"];
	#serializer: DatabaseOptions<V>["serializer"];
	#enableTimestamps: boolean;

	#cache = new Map<string, { value: V; timestamp?: number }>();

	#db: SQLiteDatabase | undefined;
	#insert: IStatement | undefined;
	#delete: IStatement | undefined;

	public open(): Promise<void> {
		const db = new SQLiteDatabase(this.#filename);
		db.exec(`
			PRAGMA journal_mode = WAL;
			CREATE TABLE IF NOT EXISTS entries (
				key TEXT PRIMARY KEY,
				value TEXT,
				timestamp INTEGER
			);
		`);

		this.#db = db;
		// tjs:sqlite matches named parameters including their prefix, so bindings must be
		// passed as `:key` rather than `key`
		this.#insert = db.prepare(
			`INSERT INTO entries (key, value, timestamp) VALUES (:key, :value, :timestamp)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value, timestamp = excluded.timestamp`,
		);
		this.#delete = db.prepare(`DELETE FROM entries WHERE key = :key`);

		for (
			const row of db.prepare(
				`SELECT key, value, timestamp FROM entries`,
			).all()
		) {
			const key = row.key as string;
			let value = row.value == undefined
				? undefined
				: JSON.parse(row.value as string);
			if (this.#reviver) value = this.#reviver(key, value);
			this.#cache.set(key, {
				value,
				timestamp: row.timestamp ?? undefined,
			});
		}

		return Promise.resolve();
	}

	public close(): Promise<void> {
		this.#insert?.finalize();
		this.#delete?.finalize();
		this.#db?.close();
		this.#insert = undefined;
		this.#delete = undefined;
		this.#db = undefined;
		this.#cache.clear();
		return Promise.resolve();
	}

	public has(key: string): boolean {
		return this.#cache.has(key);
	}

	public get(key: string): V | undefined {
		return this.#cache.get(key)?.value;
	}

	public set(key: string, value: V, updateTimestamp: boolean = true): this {
		const timestamp = this.#enableTimestamps
			? (updateTimestamp
				? Date.now()
				: this.#cache.get(key)?.timestamp)
			: undefined;
		this.#cache.set(key, { value, timestamp });

		const serialized = this.#serializer
			? this.#serializer(key, value)
			: value;
		this.#insert?.run({
			":key": key,
			// A serializer may legitimately return undefined, which has no JSON
			// representation and which tjs:sqlite refuses to bind
			":value": JSON.stringify(serialized) ?? null,
			":timestamp": timestamp ?? null,
		});

		return this;
	}

	public delete(key: string): boolean {
		this.#delete?.run({ ":key": key });
		return this.#cache.delete(key);
	}

	public clear(): void {
		this.#cache.clear();
		this.#db?.exec(`DELETE FROM entries`);
	}

	public getTimestamp(key: string): number | undefined {
		return this.#cache.get(key)?.timestamp;
	}

	public get size(): number {
		return this.#cache.size;
	}

	public keys(): MapIterator<string> {
		return this.#cache.keys();
	}

	public *entries(): MapIterator<[string, V]> {
		for (const [key, { value }] of this.#cache) {
			yield [key, value];
		}
	}
}

export const db: DatabaseFactory = {
	createInstance<V>(
		filename: string,
		options?: DatabaseOptions<V>,
	): Database<V> {
		return new SQLiteCache(filename, options);
	},
};
