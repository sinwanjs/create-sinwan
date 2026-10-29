# {{PROJECT_NAME}}

A [Sinwan](https://sinwanjs.com) app served by Bun. `server/index.ts` is the development server, `server/prod.ts` serves the production build from `dist/`, and both serve the `/api/hello` routes from `server/api.ts`; the demo uses `sinwan-router` with Home, About, and Contact pages.

To install dependencies:

```bash
bun install
```

To start a development server with hot reloading:

```bash
bun dev
```

To build the frontend for production into `dist/` (minified, with absolute asset URLs and lazy routes split into separate chunks):

```bash
bun run build
```

To run the production server, which serves `dist/` and the `/api` routes without bundling, so the Sinwan and Tailwind plugins do not run at startup (run `bun run build` first):

```bash
bun start
```

Both servers listen on `PORT`, or `3000` when it is not set. `dist/` also works on any static host, without the `/api` routes; the host must serve `index.html` for unknown paths so client-side routes such as `/about` load.

To type check:

```bash
bun run typecheck
```
