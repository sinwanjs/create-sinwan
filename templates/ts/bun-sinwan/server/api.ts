import type { BunRequest } from "bun";

// API routes shared by the dev server (index.ts) and the production server (prod.ts).
export const apiRoutes = {
  "/api/hello": {
    async GET() {
      return Response.json({
        message: "Hello, world!",
        method: "GET",
      });
    },
    async PUT() {
      return Response.json({
        message: "Hello, world!",
        method: "PUT",
      });
    },
  },

  "/api/hello/:name": async (req: BunRequest<"/api/hello/:name">) => {
    const name = req.params.name;
    return Response.json({
      message: `Hello, ${name}!`,
    });
  },
};
