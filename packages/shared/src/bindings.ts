// Definitions for runtime-agnostic low level bindings like cryptography,
// file system access, etc.

import type { ReadableWritablePair } from "node:stream/web";
import type { BytesView } from "./Bytes.js";

export interface CryptoPrimitives {
	randomBytes(length: number): BytesView;
	/** Encrypts a payload using AES-128-ECB */
	encryptAES128ECB(
		plaintext: BytesView,
		key: BytesView,
	): Promise<BytesView>;
	/** Encrypts a payload using AES-128-CBC */
	encryptAES128CBC(
		plaintext: BytesView,
		key: BytesView,
		iv: BytesView,
	): Promise<BytesView>;
	/** Encrypts a payload using AES-128-OFB */
	encryptAES128OFB(
		plaintext: BytesView,
		key: BytesView,
		iv: BytesView,
	): Promise<BytesView>;
	/** Decrypts a payload using AES-128-OFB */
	decryptAES128OFB(
		ciphertext: BytesView,
		key: BytesView,
		iv: BytesView,
	): Promise<BytesView>;
	/** Decrypts a payload using AES-256-CBC */
	decryptAES256CBC(
		ciphertext: BytesView,
		key: BytesView,
		iv: BytesView,
	): Promise<BytesView>;
	/** Encrypts and authenticates a payload using AES-128-CCM */
	encryptAES128CCM(
		plaintext: BytesView,
		key: BytesView,
		iv: BytesView,
		additionalData: BytesView,
		authTagLength: number,
	): Promise<{ ciphertext: BytesView; authTag: BytesView }>;
	/** Decrypts and verifies a payload using AES-128-CCM */
	decryptAES128CCM(
		ciphertext: BytesView,
		key: BytesView,
		iv: BytesView,
		additionalData: BytesView,
		authTag: BytesView,
	): Promise<{ plaintext: BytesView; authOK: boolean }>;
	digest(
		algorithm: "md5" | "sha-1" | "sha-256",
		data: BytesView,
	): Promise<BytesView>;

	/** Computes HMAC-SHA256 */
	hmacSHA256(
		key: BytesView,
		data: BytesView,
	): Promise<BytesView>;

	/** Encrypts and authenticates a payload using ChaCha20-Poly1305 */
	encryptChaCha20Poly1305(
		key: BytesView,
		nonce: BytesView,
		additionalData: BytesView,
		plaintext: BytesView,
	): Promise<{ ciphertext: BytesView; authTag: BytesView }>;

	/** Decrypts and verifies a payload using ChaCha20-Poly1305 */
	decryptChaCha20Poly1305(
		key: BytesView,
		nonce: BytesView,
		additionalData: BytesView,
		ciphertext: BytesView,
		authTag: BytesView,
	): Promise<{ plaintext: BytesView; authOK: boolean }>;

	/** Generates an x25519 / ECDH key pair */
	generateECDHKeyPair(): Promise<KeyPair>;
	/** Expand an x25519 / ECDH private key into the full key pair */
	keyPairFromRawECDHPrivateKey(privateKey: BytesView): Promise<KeyPair>;
	/** Derives the shared ECDH secret from an x25519 / ECDH key pair */
	deriveSharedECDHSecret(keyPair: KeyPair): Promise<BytesView>;
}

export interface KeyPair {
	publicKey: BytesView;
	privateKey: BytesView;
}

export interface FSStats {
	isDirectory(): boolean;
	isFile(): boolean;
	mtime: Date;
	size: number;
}

export interface FileHandle extends ReadableWritablePair<BytesView, BytesView> {
	close(): Promise<void>;
	read(
		position?: number | null,
		length?: number,
	): Promise<{ data: BytesView; bytesRead: number }>;
	write(
		data: BytesView,
		position?: number | null,
	): Promise<{ bytesWritten: number }>;
	stat(): Promise<FSStats>;
}

export interface ReadFile {
	/** Reads the given file */
	readFile(path: string): Promise<BytesView>;
}

export interface WriteFile {
	/** Writes the given data to a file */
	writeFile(path: string, data: BytesView): Promise<void>;
}

export interface CopyFile {
	/** Copies a file */
	copyFile(source: string, dest: string): Promise<void>;
}

export interface ReadFileSystemInfo {
	/** Lists files and subdirectories in the given directory */
	readDir(path: string): Promise<string[]>;
	/** Returns information about a file or directory, or throws if it does not exist */
	stat(path: string): Promise<FSStats>;
}

export interface ManageDirectory {
	/** Recursively creates a directory and all its parent directories that do not exist */
	ensureDir(path: string): Promise<void>;
	/** Deletes a directory and all its contents */
	deleteDir(path: string): Promise<void>;
}

export interface MakeTempDirectory {
	/** Create a temporary directory with the given prefix in a suitable location and return its path */
	makeTempDir(prefix: string): Promise<string>;
}

export interface OpenFile {
	/** Opens a file handle */
	open(path: string, flags: {
		// FIXME: Define expected behavior for each flag
		read: boolean;
		write: boolean;
		create: boolean;
		truncate: boolean;
	}): Promise<FileHandle>;
}

export interface FileSystem
	extends
		ReadFile,
		WriteFile,
		CopyFile,
		OpenFile,
		ReadFileSystemInfo,
		ManageDirectory,
		MakeTempDirectory
{}

export type Platform = "linux" | "darwin" | "win32" | "browser" | "other";

export type DatabaseOptions<V> = {
	/**
	 * An optional reviver function (similar to JSON.parse) to transform parsed values before they are accessible in the database.
	 * If this function is defined, it must always return a value.
	 */
	reviver?: (key: string, value: any) => V;
	/**
	 * An optional serializer function (similar to JSON.serialize) to transform values before they are written to the database file.
	 * If this function is defined, it must always return a value.
	 */
	serializer?: (key: string, value: V) => any;
	/** Whether timestamps should be recorded when setting values. Default: false */
	enableTimestamps?: boolean;
};

export interface DatabaseFactory {
	createInstance<V>(
		filename: string,
		options?: DatabaseOptions<V>,
	): Database<V>;
}

export interface Database<V> {
	open(): Promise<void>;
	close(): Promise<void>;

	has: Map<string, V>["has"];
	get: Map<string, V>["get"];
	set(key: string, value: V, updateTimestamp?: boolean): this;
	delete(key: string): boolean;
	clear(): void;

	getTimestamp(key: string): number | undefined;
	get size(): number;

	keys: Map<string, V>["keys"];
	entries: Map<string, V>["entries"];
}
