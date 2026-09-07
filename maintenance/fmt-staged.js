import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Oxfmt is fast enough to run on the whole repo
// despite lint-staged telling us which files have changed.
const repoRoot = path.join(__dirname, "..");
spawnSync("yarn", ["fmt"], {
	cwd: repoRoot,
});
