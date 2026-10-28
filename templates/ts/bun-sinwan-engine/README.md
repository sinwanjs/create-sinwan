# {{PROJECT_NAME}}

A [sinwan-engine](https://sinwanjs.com) HTTP server running on Bun. `src/index.ts` creates the app and registers the users module from `src/routes/users.route.ts` (served under `/users`).

Copy `.env.example` to `.env` to change the port. The server reads `PORT` (also `HTTP_PORT`) and defaults to `3030`.

To install dependencies:

```bash
bun install
```

To start a development server (restarts on file changes):

```bash
bun dev
```

To build and run for production:

```bash
bun run build
bun start
```

To type check:

```bash
bun run typecheck
```
