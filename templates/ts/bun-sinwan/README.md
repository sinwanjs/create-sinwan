# {{PROJECT_NAME}}

A [Sinwan](https://sinwanjs.com) app served by Bun. `server/index.ts` serves `index.html` and the `/api/hello` routes; the demo uses `sinwan-router` with Home, About, and Contact pages.

To install dependencies:

```bash
bun install
```

To start a development server with hot reloading:

```bash
bun dev
```

To run for production (Bun bundles and minifies the frontend when the server starts):

```bash
bun start
```

Both servers listen on `PORT`, or `3000` when it is not set.

To export the frontend as static files to `dist/` (for static hosting; the `/api` routes are not included, so the API tester will not work there):

```bash
bun run build
```

To type check:

```bash
bun run typecheck
```
