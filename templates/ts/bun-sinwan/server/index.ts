import { serve } from "bun";
import index from "../index.html";
import { apiRoutes } from "./api";

// Development server: Bun bundles index.html through the bunfig.toml plugins
// and hot-reloads on change. `bun start` serves the built dist/ instead.
const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    ...apiRoutes,
  },

  development: {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
