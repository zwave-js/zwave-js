import { readFile, realpath, stat } from "node:fs/promises";
import {
	basename,
	dirname,
	isAbsolute,
	join,
	relative,
	resolve,
	sep,
} from "node:path";
import { fileURLToPath } from "node:url";

import { fs as nodeFS } from "@zwave-js/core/bindings/fs/node";
import type { BytesView } from "@zwave-js/shared";
import type { FileSystem } from "@zwave-js/shared/bindings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the checkout this server was started from */
export const LAUNCH_ROOT = resolve(__dirname, "../../..");

const DEVICES_SUBDIR = join("packages", "config", "config", "devices");

/** A zwave-js checkout, e.g. the main clone or one of its git worktrees */
export interface Checkout {
	/** Canonical path of the repository root */
	root: string;
	/**
	 * Canonical path of the device config directory. This is the `rootDir` against
	 * which `~/`-prefixed `$import` specifiers are resolved.
	 */
	devicesDir: string;
	/** Filesystem binding for the @zwave-js/config loaders, restricted to `devicesDir` */
	fs: FileSystem;
}

/**
 * Canonicalizes a path, following symlinks. For paths that do not exist yet,
 * the nearest existing ancestor is canonicalized instead.
 */
async function realpathAllowMissing(file: string): Promise<string> {
	try {
		return await realpath(file);
	} catch (e: any) {
		const parent = dirname(file);
		if (e?.code !== "ENOENT" || parent === file) throw e;
		return join(await realpathAllowMissing(parent), basename(file));
	}
}

function isInside(dir: string, file: string): boolean {
	const rel = relative(dir, file);
	return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

/**
 * Resolves a file path (relative paths against the checkout root) and returns its
 * canonical absolute path, or `undefined` if it points outside the checkout's
 * device config directory.
 */
export async function resolveDeviceConfigPath(
	checkout: Pick<Checkout, "root" | "devicesDir">,
	file: string,
): Promise<string | undefined> {
	let ret: string;
	try {
		// Compare canonical paths, so symlinks cannot escape the device config directory
		ret = await realpathAllowMissing(resolve(checkout.root, file));
	} catch {
		return undefined;
	}
	return isInside(checkout.devicesDir, ret) ? ret : undefined;
}

/**
 * Nested `$import`s are resolved by the config loaders themselves, so every file
 * read must be checked here to keep symlinks from pulling in content from outside
 * the device config directory.
 */
function createGuardedFS(
	checkout: Pick<Checkout, "root" | "devicesDir">,
): FileSystem {
	return {
		...nodeFS,
		async readFile(file: string): Promise<BytesView> {
			const resolved = await resolveDeviceConfigPath(checkout, file);
			if (!resolved) {
				throw new Error(
					`Refusing to read ${file}, which is located outside ${checkout.devicesDir}`,
				);
			}
			return nodeFS.readFile(resolved);
		},
	};
}

async function loadCheckout(root: string): Promise<Checkout | undefined> {
	try {
		const pkg = JSON.parse(
			await readFile(join(root, "packages/config/package.json"), "utf8"),
		);
		if (pkg?.name !== "@zwave-js/config") return undefined;
		const devicesDir = await realpath(join(root, DEVICES_SUBDIR));
		if (!(await stat(devicesDir)).isDirectory()) return undefined;
		return { root, devicesDir, fs: createGuardedFS({ root, devicesDir }) };
	} catch {
		return undefined;
	}
}

// Only successful lookups are cached, so a worktree created later is still found
const checkouts = new Map<string, Promise<Checkout | undefined>>();

/**
 * Returns the zwave-js checkout rooted at `root`, or `undefined` if `root` is not one.
 * Every canonical root maps to a single `Checkout` instance.
 */
export async function getCheckout(root: string): Promise<Checkout | undefined> {
	let canonical: string;
	try {
		canonical = await realpath(root);
	} catch {
		return undefined;
	}
	let ret = checkouts.get(canonical);
	if (!ret) {
		ret = loadCheckout(canonical);
		checkouts.set(canonical, ret);
	}
	const checkout = await ret;
	if (!checkout && checkouts.get(canonical) === ret) {
		checkouts.delete(canonical);
	}
	return checkout;
}

/** Returns the checkout `dir` is located in, if any, by walking up from `dir` */
export async function findCheckoutContaining(
	dir: string,
): Promise<Checkout | undefined> {
	for (let cur = resolve(dir); ; cur = dirname(cur)) {
		const checkout = await getCheckout(cur);
		if (checkout) return checkout;
		if (dirname(cur) === cur) return undefined;
	}
}

/**
 * Returns the checkout whose device config directory contains the canonical path
 * `file`, by walking up to the nearest `packages/config/config/devices` directory.
 */
export async function findCheckoutForDeviceFile(
	file: string,
): Promise<Checkout | undefined> {
	for (let cur = file; ; cur = dirname(cur)) {
		if (cur.endsWith(sep + DEVICES_SUBDIR)) {
			const checkout = await getCheckout(resolve(cur, "../../../.."));
			if (checkout?.devicesDir === cur) return checkout;
		}
		if (dirname(cur) === cur) return undefined;
	}
}

export interface CheckoutHints {
	/** Explicit `root` argument of the tool call */
	root?: string;
	/** Path arguments of the tool call, keyed by argument name */
	paths: Record<string, string>;
	/** Returns the checkout of the client's workspace, if any */
	getWorkspaceCheckout: () => Promise<Checkout | undefined>;
	/** Root to use when nothing else determines the checkout */
	fallbackRoot: string;
}

export type ResolvedCheckout =
	| {
			checkout: Checkout;
			/** Canonical absolute path for each path argument */
			paths: Record<string, string>;
	  }
	| { error: string };

/**
 * Determines the checkout a tool call works in. In order of precedence, this is
 * the explicit `root`, the checkout containing the path arguments, the client's
 * workspace, and finally the fallback root.
 */
export async function resolveToolCheckout(
	hints: CheckoutHints,
): Promise<ResolvedCheckout> {
	let explicit: Checkout | undefined;
	if (hints.root) {
		explicit = await findCheckoutContaining(hints.root);
		if (!explicit) {
			return {
				error: `Error: root ${hints.root} is not inside a zwave-js checkout`,
			};
		}
	}

	let defaultCheckout: Checkout | undefined;
	const getDefaultCheckout = async (): Promise<Checkout | undefined> => {
		defaultCheckout ??=
			explicit
			?? (await hints.getWorkspaceCheckout())
			?? (await getCheckout(hints.fallbackRoot));
		return defaultCheckout;
	};

	let checkout = explicit;
	const paths: Record<string, string> = {};
	for (const [key, value] of Object.entries(hints.paths)) {
		const notInside = {
			error:
				`Error: ${key} must be located inside the ${DEVICES_SUBDIR} `
				+ `directory of a zwave-js checkout${
					explicit ? ` (root: ${explicit.root})` : ""
				}`,
		};

		let file = value;
		if (!isAbsolute(file)) {
			const base = await getDefaultCheckout();
			if (!base) return notInside;
			file = resolve(base.root, file);
		}
		try {
			file = await realpathAllowMissing(file);
		} catch {
			return notInside;
		}

		const owner = explicit
			? isInside(explicit.devicesDir, file)
				? explicit
				: undefined
			: await findCheckoutForDeviceFile(file);
		if (!owner) return notInside;
		if (checkout && owner !== checkout) {
			return {
				error: `Error: all file arguments must be located in the same checkout (${checkout.root})`,
			};
		}
		checkout = owner;
		paths[key] = file;
	}

	checkout ??= await getDefaultCheckout();
	if (!checkout) {
		return {
			error: `Error: could not find a zwave-js checkout. Pass the root argument.`,
		};
	}
	return { checkout, paths };
}
