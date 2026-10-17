#!/usr/bin/env node
// Equal popout grid: the pure column/row choice, bundled the same way as verify-instance.mjs.
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "verify-popout-grid-"));

await build({
  stdin: {
    contents: `export { computeGridSize } from "./src/voice/gridSize.ts";\n`,
    resolveDir: root,
    sourcefile: "verify-popout-grid-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(dir, "m.mjs"),
  logLevel: "error",
});

const { computeGridSize } = await import(pathToFileURL(join(dir, "m.mjs")).href);
let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${name}`);
  if (!cond) failed++;
};

const one = computeGridSize(1, 1280, 720);
check("one tile is a single cell", one.cols === 1 && one.rows === 1);

const wide = computeGridSize(4, 1600, 400);
check("wide window prefers more columns than rows", wide.cols > wide.rows && wide.cols * wide.rows >= 4);

const tall = computeGridSize(4, 400, 1600);
check("tall window prefers more rows than columns", tall.rows > tall.cols && tall.cols * tall.rows >= 4);

// 2 tiles in a square: 1×2 and 2×1 score the same (100). The smaller column count wins.
const tie = computeGridSize(2, 200, 200);
check("a tie keeps the smaller column count", tie.cols === 1 && tie.rows === 2);

// Narrow/tall (width/height < 0.7) with n > 1 forces a single column.
const narrowTall = computeGridSize(4, 200, 800);
check("narrow/tall window forces a single column", narrowTall.cols === 1 && narrowTall.rows === 4);

// n = 1 is unaffected by the single-column rule even when the ratio is below 0.7.
const oneNarrow = computeGridSize(1, 100, 800);
check("n=1 stays one cell when narrow/tall", oneNarrow.cols === 1 && oneNarrow.rows === 1);

// Straddle 0.7 for the same n and width family: above keeps maximization, below forces one column.
const justAbove = computeGridSize(4, 701, 1000);
check("just above 0.7 does not force a single column", justAbove.cols !== 1);

const justBelow = computeGridSize(4, 699, 1000);
check("just below 0.7 forces a single column", justBelow.cols === 1 && justBelow.rows === 4);

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("popout grid checks passed");
