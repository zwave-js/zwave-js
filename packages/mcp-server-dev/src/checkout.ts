import { realpath, stat } from "node:fs/promises";
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
import { type BytesView, readJSON } from "@zwave-js/shared";
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
 * Returns the canonical path of `file`, or `undefined` if it points outside `devicesDir`
 */
export async function resolveDeviceConfigPath(
	devicesDir: string,
	file: string,
): Promise<string | undefined> {
	let ret: string;
	try {
		// Compare canonical paths, so symlinks cannot escape the device config directory
		ret = await realpathAllowMissing(file);
	} catch {
		return undefined;
	}
	return isInside(devicesDir, ret) ? ret : undefined;
}

/**
 * Nested `$import`s are resolved by the config loaders themselves, so every file
 * read must be checked here to keep symlinks from pulling in content from outside
 * the device config directory.
 */
function createGuardedFS(devicesDir: string): FileSystem {
	return {
		...nodeFS,
		async readFile(file: string): Promise<BytesView> {
			const resolved = await resolveDeviceConfigPath(devicesDir, file);
			if (!resolved) {
				throw new Error(
					`Refusing to read ${file}, which is located outside ${devicesDir}`,
				);
			}
			return nodeFS.readFile(resolved);
		},
	};
}

/** Returns the zwave-js checkout rooted at the canonical path `root`, if it is one */
async function loadCheckout(root: string): Promise<Checkout | undefined> {
	try {
		const pkg = await readJSON(
			nodeFS,
			join(root, "packages/config/package.json"),
		);
		if (pkg?.name !== "@zwave-js/config") return undefined;
		const devicesDir = await realpath(join(root, DEVICES_SUBDIR));
		if (!(await stat(devicesDir)).isDirectory()) return undefined;
		return { root, devicesDir, fs: createGuardedFS(devicesDir) };
	} catch {
		return undefined;
	}
}

/** Returns the zwave-js checkout rooted at `root`, or `undefined` if `root` is not one */
export async function getCheckout(root: string): Promise<Checkout | undefined> {
	let canonical: string;
	try {
		canonical = await realpath(root);
	} catch {
		return undefined;
	}
	return loadCheckout(canonical);
}

/** Returns the checkout `path` is located in, if any, by walking up from `path` */
export async function findCheckoutContaining(
	path: string,
): Promise<Checkout | undefined> {
	let cur: string;
	try {
		// Walk up the canonical path so a symlinked root finds its target's checkout
		cur = await realpathAllowMissing(resolve(path));
	} catch {
		return undefined;
	}
	for (; ; cur = dirname(cur)) {
		const checkout = await loadCheckout(cur);
		if (checkout) return checkout;
		if (dirname(cur) === cur) return undefined;
	}
}

export interface CheckoutHints {
	/** Explicit `root` argument of the tool call */
	root?: string;
	/** Path arguments of the tool call, keyed by argument name */
	paths: Record<string, string>;
	/** Returns the checkout to use when there is no `root` argument */
	getDefaultCheckout: () => Promise<Checkout | undefined>;
}

export type ResolvedCheckout =
	| {
			checkout: Checkout;
			/** Canonical absolute path for each path argument */
			paths: Record<string, string>;
	  }
	| { error: string };

/**
 * Determines the checkout a tool call works in. This is the checkout containing the
 * path arguments, or else the explicit `root`, or else the default checkout. Relative
 * path arguments are resolved against `root` or the default checkout.
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

	let checkout: Checkout | undefined;
	const paths: Record<string, string> = {};
	for (const [key, value] of Object.entries(hints.paths)) {
		const notInside = {
			error: `Error: ${key} must be located inside the ${DEVICES_SUBDIR} directory of a zwave-js checkout`,
		};

		let file = value;
		if (!isAbsolute(file)) {
			const base = explicit ?? (await hints.getDefaultCheckout());
			if (!base) return notInside;
			file = resolve(base.root, file);
		}
		const owner = await findCheckoutContaining(file);
		if (!owner) return notInside;
		const canonical = await resolveDeviceConfigPath(owner.devicesDir, file);
		if (!canonical) return notInside;
		if (checkout && owner.root !== checkout.root) {
			return {
				error: `Error: all file arguments must be located in the same checkout (${checkout.root})`,
			};
		}
		checkout = owner;
		paths[key] = canonical;
	}

	checkout ??= explicit ?? (await hints.getDefaultCheckout());
	if (!checkout) {
		return {
			error: `Error: could not find a zwave-js checkout. Pass the root argument.`,
		};
	}
	return { checkout, paths };
}
