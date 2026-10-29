import path from "node:path";
import { serve } from "bun";
import { apiRoutes } from "./api.js";

// Production server: serves the `bun run build` output from dist/ as static
// files, so no bundler or plugin runs at startup or per request.
const distDir = path.join(import.meta.dir, "..", "dist");
const indexFile = Bun.file(path.join(distDir, "index.html"));

if (!(await indexFile.exists())) {
  console.error("dist/index.html is missing. Run `bun run build` first.");
  process.exit(1);
}

function decodePath(pathname) {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.includes("\0") ? null : decoded;
  } catch {
    return null;
  }
}

const server = serve({
  routes: apiRoutes,

  async fetch(req) {
    const pathname = decodePath(new URL(req.url).pathname);
    if (pathname === null) {
      return new Response("Bad request", { status: 400 });
    }

    // Only files inside dist/ are served.
    const filePath = path.join(distDir, pathname);
    if (filePath.startsWith(distDir + path.sep)) {
      const file = Bun.file(filePath);
      if (await file.exists()) return new Response(file);
    }

    // A missing file is a 404; any other path is a client-side route.
    if (path.extname(pathname)) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(indexFile);
  },
});

console.log(`🚀 Production server running at ${server.url}`);
