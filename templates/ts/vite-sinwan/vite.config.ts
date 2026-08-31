import { defineConfig } from "vite";
import { sinwan } from "vite-plugin-sinwan";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    sinwan({
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
      // Plugin-free Fast Refresh (default: true, dev server only)
      fastRefresh: true,
    }),
  ],
});
