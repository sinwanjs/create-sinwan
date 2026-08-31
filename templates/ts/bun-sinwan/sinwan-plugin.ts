// Pre-configured Sinwan plugin for Bun's dev server.
//
// bunfig.toml's [serve.static] plugins array only accepts module paths that
// export a ready-made plugin object — it cannot call a factory function with
// options. This file instantiates sinwan() with the cache enabled so that
// cross-module reactive prop analysis runs in dev mode (build.ts calls sinwan()
// with no cache, so caching is dev-only here).
import { sinwan } from "bun-plugin-sinwan";

export default sinwan({
  hoist: true,
  cache: {
    root: "./src",
    tsConfigPath: "./tsconfig.json",
    bunfigPath: "./bunfig.toml",
    workspaces: "./package.json",
    cachePath: "./.sinwan/cache.json",
  },
});
