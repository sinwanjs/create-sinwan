// Pre-configured Sinwan plugin for Bun's dev server.
//
// bunfig.toml's [serve.static] plugins array only accepts module paths that
// export a ready-made plugin object — it cannot call a factory function with
// options. This file instantiates sinwan() with the cache enabled so that
// cross-module reactive prop analysis runs in dev mode (build.ts calls sinwan()
// with no cache, so caching is dev-only here).
import { sinwan } from "bun-plugin-sinwan";

export default sinwan({
  // Enable template hoisting (default: true)
  hoist: true,
  // Emit explicit binding descriptors (default: false)
  explicitBindings: false,
  // Path to reactive-props metadata from `sinwan analyze`
  analyze: "./.sinwan/props.json",
  // Incremental cross-file analysis for dev/HMR
  cache: {
    root: process.cwd(),
    tsConfigPath: "./tsconfig.json",
    cachePath: "./.sinwan/cache.json",
    bunfigPath: "./bunfig.toml",
  },
});
