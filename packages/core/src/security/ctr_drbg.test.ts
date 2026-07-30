import { type BytesView, hexToUint8Array } from "@zwave-js/shared";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, vi } from "vitest";
import { CtrDRBG } from "./ctr_drbg.js";

const seenArguments: [plaintext: BytesView, key: BytesView][] = [];

vi.mock("../crypto/index.js", async () => {
	const actual = await vi.importActual<
		typeof import("../crypto/index.js")
	>("../crypto/index.js");
	return {
		...actual,
		encryptAES128ECB(plaintext: BytesView, key: BytesView) {
			seenArguments.push([plaintext, key]);
			return actual.encryptAES128ECB(plaintext, key);
		},
	};
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVectors(alg: string) {
	const text = fs.readFileSync(
		path.join(__dirname, "ctr_drbg.test.vectors.limited.txt"),
		"utf8",
	);
	const vectors = [];

	let from = -1;

	while (true) {
		from = text.indexOf(`[${alg}]`, from + 1);

		if (from === -1) break;

		for (let i = 0; i < 15; i++) {
			const vector: Record<string, any> = {};
			const start = text.indexOf(`COUNT = ${i}`, from);
			const end = text.indexOf("\n\n", start);
			const items = text.slice(start, end).split("\n");

			for (let j = 1; j < items.length; j++) {
				const key = items[j].split(" = ")[0];
				const value = hexToUint8Array(items[j].split(" = ")[1]);

				if (vector[key]) vector[key] = [vector[key], value];
				else vector[key] = value;
			}

			vectors.push(vector);
		}
	}

	return vectors;
}

for (const id of ["AES-128"]) {
	const name = id + " no df";
	const vectors = getVectors(name);

	for (const [i, vector] of vectors.entries()) {
		test(
			`CtrDRBG -> should pass ${name} NIST vector #${
				i + 1
			} (ctr,df=false)`,
			async (t) => {
				const drbg = new CtrDRBG();

				await drbg.init(
					vector.EntropyInput,
				);

				await drbg["reseed"](
					vector.EntropyInputReseed,
				);

				await drbg.generate(
					vector.ReturnedBits.byteLength,
				);

				const result = await drbg.generate(
					vector.ReturnedBits.byteLength,
				);

				t.expect(result).toStrictEqual(vector.ReturnedBits);
			},
		);
	}
}

test("does not pass aliased views to the crypto primitives", async (t) => {
	// Some runtimes make an ArrayBuffer temporarily immutable while an async WebCrypto
	// call reads from any view of it, so two views of one buffer cannot be passed together
	const drbg = new CtrDRBG();
	await drbg.init(new Uint8Array(32).fill(0xa5));
	await drbg.generate(32);

	t.expect(seenArguments.length).toBeGreaterThan(0);
	for (const [plaintext, key] of seenArguments) {
		t.expect(plaintext.buffer).not.toBe(key.buffer);
	}
});
