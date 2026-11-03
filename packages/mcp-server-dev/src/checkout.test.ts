import {
	mkdir,
	mkdtemp,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
	type Checkout,
	type CheckoutHints,
	findCheckoutContaining,
	getCheckout,
	resolveDeviceConfigPath,
	resolveToolCheckout,
} from "./checkout.js";

const DEVICES_SUBDIR = "packages/config/config/devices";

async function createCheckout(
	root: string,
	packageName = "@zwave-js/config",
): Promise<void> {
	await mkdir(join(root, DEVICES_SUBDIR), { recursive: true });
	await writeFile(
		join(root, "packages/config/package.json"),
		JSON.stringify({ name: packageName }),
	);
}

let tmp: string;
let mainRoot: string;
let worktreeRoot: string;
let main: Checkout;
let worktree: Checkout;
let mainFile: string;
let worktreeFile: string;

beforeAll(async () => {
	tmp = await realpath(await mkdtemp(join(tmpdir(), "zwave-dev-checkout-")));
	mainRoot = join(tmp, "master");
	// Worktrees are nested inside the main checkout
	worktreeRoot = join(mainRoot, ".claude/worktrees/feature");
	await createCheckout(mainRoot);
	await createCheckout(worktreeRoot);

	mainFile = join(mainRoot, DEVICES_SUBDIR, "0x0001/device.json");
	worktreeFile = join(worktreeRoot, DEVICES_SUBDIR, "0x0001/device.json");
	for (const file of [mainFile, worktreeFile]) {
		await mkdir(join(file, ".."), { recursive: true });
		await writeFile(file, "{}");
	}

	main = (await getCheckout(mainRoot))!;
	worktree = (await getCheckout(worktreeRoot))!;
});

afterAll(async () => {
	await rm(tmp, { recursive: true, force: true });
});

describe("getCheckout", () => {
	it("canonicalizes the root", async () => {
		expect(main.root).toBe(mainRoot);
		expect(main.devicesDir).toBe(join(mainRoot, DEVICES_SUBDIR));
		expect((await getCheckout(`${mainRoot}/`))?.root).toBe(mainRoot);

		const link = join(tmp, "master-link");
		await symlink(mainRoot, link);
		expect((await getCheckout(link))?.root).toBe(mainRoot);
	});

	it("rejects directories that are not a zwave-js checkout", async () => {
		expect(await getCheckout(tmp)).toBeUndefined();
		expect(await getCheckout(join(tmp, "missing"))).toBeUndefined();

		const other = join(tmp, "other");
		await createCheckout(other, "some-other-package");
		expect(await getCheckout(other)).toBeUndefined();
	});
});

describe("findCheckoutContaining", () => {
	it("walks up to the nearest checkout root", async () => {
		expect(
			(await findCheckoutContaining(join(worktreeRoot, "packages")))
				?.root,
		).toBe(worktreeRoot);
		expect(
			(await findCheckoutContaining(join(mainRoot, ".claude")))?.root,
		).toBe(mainRoot);
		expect((await findCheckoutContaining(mainFile))?.root).toBe(mainRoot);
		expect((await findCheckoutContaining(worktreeFile))?.root).toBe(
			worktreeRoot,
		);
		expect(
			(
				await findCheckoutContaining(
					join(worktreeRoot, DEVICES_SUBDIR, "new/file.json"),
				)
			)?.root,
		).toBe(worktreeRoot);
		expect(await findCheckoutContaining(tmp)).toBeUndefined();
	});
});

describe("Checkout.fs", () => {
	it("only reads files inside its own devices directory", async () => {
		await expect(worktree.fs.readFile(worktreeFile)).resolves.toBeDefined();
		await expect(worktree.fs.readFile(mainFile)).rejects.toThrow(
			"Refusing to read",
		);
		await expect(main.fs.readFile(worktreeFile)).rejects.toThrow(
			"Refusing to read",
		);
	});

	it("rejects paths outside its devices directory", async () => {
		expect(
			await resolveDeviceConfigPath(worktree.devicesDir, worktreeFile),
		).toBe(worktreeFile);
		expect(
			await resolveDeviceConfigPath(worktree.devicesDir, mainFile),
		).toBeUndefined();
	});
});

describe("resolveToolCheckout", () => {
	function hints(overrides: Partial<CheckoutHints> = {}): CheckoutHints {
		return {
			paths: {},
			getDefaultCheckout: async () => main,
			...overrides,
		};
	}

	it("uses the checkout of the file argument", async () => {
		const getDefaultCheckout = vi.fn(async () => main);
		const result = await resolveToolCheckout(
			hints({ paths: { filename: worktreeFile }, getDefaultCheckout }),
		);
		expect(result).toEqual({
			checkout: expect.objectContaining({ root: worktreeRoot }),
			paths: { filename: worktreeFile },
		});
		expect(getDefaultCheckout).not.toHaveBeenCalled();
	});

	it("uses the default checkout when there is no file argument", async () => {
		const result = await resolveToolCheckout(
			hints({ getDefaultCheckout: async () => worktree }),
		);
		expect(result).toEqual({ checkout: worktree, paths: {} });
	});

	it("prefers an explicit root over the default checkout", async () => {
		const result = await resolveToolCheckout(
			hints({ root: join(worktreeRoot, "packages") }),
		);
		expect(result).toEqual({
			checkout: expect.objectContaining({ root: worktreeRoot }),
			paths: {},
		});
	});

	it("resolves relative file arguments against the default checkout", async () => {
		const result = await resolveToolCheckout(
			hints({
				paths: { filename: `${DEVICES_SUBDIR}/0x0001/device.json` },
				getDefaultCheckout: async () => worktree,
			}),
		);
		expect(result).toEqual({
			checkout: expect.objectContaining({ root: worktreeRoot }),
			paths: { filename: worktreeFile },
		});
	});

	it("rejects files outside of every devices directory", async () => {
		const result = await resolveToolCheckout(
			hints({ paths: { filename: join(worktreeRoot, "package.json") } }),
		);
		expect(result).toMatchObject({
			error: expect.stringContaining("filename must be located inside"),
		});
	});

	it("prefers the checkout of the file argument over an explicit root", async () => {
		const result = await resolveToolCheckout(
			hints({ root: worktreeRoot, paths: { filename: mainFile } }),
		);
		expect(result).toEqual({
			checkout: expect.objectContaining({ root: mainRoot }),
			paths: { filename: mainFile },
		});
	});

	it("resolves relative file arguments against an explicit root", async () => {
		const result = await resolveToolCheckout(
			hints({
				root: worktreeRoot,
				paths: { filename: `${DEVICES_SUBDIR}/0x0001/device.json` },
			}),
		);
		expect(result).toEqual({
			checkout: expect.objectContaining({ root: worktreeRoot }),
			paths: { filename: worktreeFile },
		});
	});

	it("rejects an explicit root that is not a checkout", async () => {
		const result = await resolveToolCheckout(hints({ root: tmp }));
		expect(result).toMatchObject({
			error: expect.stringContaining("is not inside a zwave-js checkout"),
		});
	});

	it("rejects file arguments from different checkouts", async () => {
		const result = await resolveToolCheckout(
			hints({
				paths: { filename: mainFile, templateFile: worktreeFile },
			}),
		);
		expect(result).toMatchObject({
			error: expect.stringContaining("same checkout"),
		});
	});
});
