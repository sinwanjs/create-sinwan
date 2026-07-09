import { rm, mkdir, rename } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname ?? __dirname);
const outdir = path.join(root, "dist");
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [path.join(root, "src", "index.ts")],
  outdir,
  target: "bun",
  format: "esm",
  minify: true,
  sourcemap: "linked",
  splitting: false,
  packages: "bundle",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Rename the output entry to cli.js to match the bin entry.
const bundledPath = path.join(outdir, "index.js");
const entryPath = path.join(outdir, "cli.js");
await rename(bundledPath, entryPath);

console.log("✅ Built dist/cli.js");
