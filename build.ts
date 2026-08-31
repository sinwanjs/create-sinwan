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

// Rename the linked sourcemap to match and fix the sourceMappingURL comment.
const mapPath = path.join(outdir, "index.js.map");
const newMapPath = path.join(outdir, "cli.js.map");
try {
  await rename(mapPath, newMapPath);
  let content = await Bun.file(entryPath).text();
  content = content.replace(
    "sourceMappingURL=index.js.map",
    "sourceMappingURL=cli.js.map",
  );
  await Bun.write(entryPath, content);
} catch {
  // No sourcemap file — nothing to rename.
}

console.log("✅ Built dist/cli.js");
