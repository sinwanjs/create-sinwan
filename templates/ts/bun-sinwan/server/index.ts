import path from "node:path";
import { serve } from "bun";
import index from "../index.html";

const server = serve({
  routes: {
    // Serve static assets (e.g. favicon referenced via <link> in index.html)
    // before the catch-all route, since they aren't bundled as ES modules.
    "/src/assets/*": async (req) => {
      const filePath = path.join(
        import.meta.dirname,
        "..",
        new URL(req.url).pathname,
      );
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
