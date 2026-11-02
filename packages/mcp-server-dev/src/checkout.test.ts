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
	findCheckoutContaining,
	findCheckoutForDeviceFile,
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
	it("returns one cached instance per canonical root", async () => {
		expect(main.root).toBe(mainRoot);
		expect(main.devicesDir).toBe(join(mainRoot, DEVICES_SUBDIR));
		expect(await getCheckout(mainRoot)).toBe(main);
		expect(await getCheckout(`${mainRoot}/`)).toBe(main);

		const link = join(tmp, "master-link");
		await symlink(mainRoot, link);
		expect(await getCheckout(link)).toBe(main);
	});

	it("keeps separate instances for different checkouts", () => {
		expect(worktree).not.toBe(main);
		expect(worktree.devicesDir).toBe(join(worktreeRoot, DEVICES_SUBDIR));
		expect(worktree.fs).not.toBe(main.fs);
	});

	it("rejects directories that are not a zwave-js checkout", async () => {
		expect(await getCheckout(tmp)).toBeUndefined();
		expect(await getCheckout(join(tmp, "missing"))).toBeUndefined();

		const other = join(tmp, "other");
		await createCheckout(other, "some-other-package");
		expect(await getCheckout(other)).toBeUndefined();
	});

	it("finds a checkout created after a failed lookup", async () => {
		const late = join(tmp, "late");
		expect(await getCheckout(late)).toBeUndefined();
		await createCheckout(late);
		expect((await getCheckout(late))?.root).toBe(late);
	});
});

describe("findCheckoutForDeviceFile", () => {
	it("returns the checkout with the nearest devices directory", async () => {
		expect(await findCheckoutForDeviceFile(mainFile)).toBe(main);
		expect(await findCheckoutForDeviceFile(worktreeFile)).toBe(worktree);
		expect(
			await findCheckoutForDeviceFile(
				join(worktreeRoot, DEVICES_SUBDIR, "new/file.json"),
			),
		).toBe(worktree);
	});

	it("rejects files outside of a devices directory", async () => {
		expect(
			await findCheckoutForDeviceFile(join(worktreeRoot, "package.json")),
		).toBeUndefined();
		expect(
			await findCheckoutForDeviceFile(
				join(tmp, "other", DEVICES_SUBDIR, "file.json"),
			),
		).toBeUndefined();
	});
});

describe("findCheckoutContaining", () => {
	it("walks up to the nearest checkout root", async () => {
		expect(
			await findCheckoutContaining(join(worktreeRoot, "packages")),
		).toBe(worktree);
		expect(await findCheckoutContaining(join(mainRoot, ".claude"))).toBe(
			main,
		);
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

	it("resolves relative paths against the checkout root", async () => {
		expect(
			await resolveDeviceConfigPath(
				worktree,
				`${DEVICES_SUBDIR}/0x0001/device.json`,
			),
		).toBe(worktreeFile);
	});
});

describe("resolveToolCheckout", () => {
	function hints(
		overrides: Partial<Parameters<typeof resolveToolCheckout>[0]> = {},
	) {
		return {
			paths: {},
			getWorkspaceCheckout: vi.fn(async () => undefined),
			fallbackRoot: mainRoot,
			...overrides,
		};
	}

	it("uses the checkout of the file argument", async () => {
		const getWorkspaceCheckout = vi.fn(async () => main);
		const result = await resolveToolCheckout(
			hints({ paths: { filename: worktreeFile }, getWorkspaceCheckout }),
		);
		expect(result).toEqual({
			checkout: worktree,
			paths: { filename: worktreeFile },
		});
		expect(getWorkspaceCheckout).not.toHaveBeenCalled();
	});

	it("uses the workspace checkout when there is no file argument", async () => {
		const result = await resolveToolCheckout(
			hints({ getWorkspaceCheckout: async () => worktree }),
		);
		expect(result).toEqual({ checkout: worktree, paths: {} });
	});

	it("falls back to the fallback root without a workspace checkout", async () => {
		const result = await resolveToolCheckout(hints());
		expect(result).toEqual({ checkout: main, paths: {} });
	});

	it("prefers an explicit root over the workspace", async () => {
		const result = await resolveToolCheckout(
			hints({
				root: join(worktreeRoot, "packages"),
				getWorkspaceCheckout: async () => main,
			}),
		);
		expect(result).toEqual({ checkout: worktree, paths: {} });
	});

	it("resolves relative file arguments against the workspace checkout", async () => {
		const result = await resolveToolCheckout(
			hints({
				paths: { filename: `${DEVICES_SUBDIR}/0x0001/device.json` },
				getWorkspaceCheckout: async () => worktree,
			}),
		);
		expect(result).toEqual({
			checkout: worktree,
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

	it("rejects files outside of an explicit root", async () => {
		const result = await resolveToolCheckout(
			hints({ root: worktreeRoot, paths: { filename: mainFile } }),
		);
		expect(result).toMatchObject({
			error: expect.stringContaining(worktreeRoot),
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
