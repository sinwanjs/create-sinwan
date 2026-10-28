# Changelog

All notable changes to **create-sinwan** are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/) and create-sinwan adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-28

First stable release. The command-line flags (`--template`, `--language`, `--package-manager`, `--target-dir`, `--skip-install`, `--skip-git`, `--force`) are now stable.

### Added

- **Sinwan Engine template**: `bun-sinwan-engine` (TypeScript and JavaScript) scaffolds a Bun HTTP server with `sinwan-engine`, a `users` module under `/users`, a request logger, `.env.example` for `PORT`, and a `bun.build()` production build. It uses bun only.
- **Framework prompt**: the interactive CLI now asks first whether to create a Sinwan (frontend) or Sinwan Engine (server) project, then shows only that framework's templates. The template prompt is skipped when the framework has one template; `--template` skips both prompts.
- **Runs without a terminal**: in CI and scripts the CLI never prompts. It needs a project name and `--template`, defaults the language to `ts` and the package manager to the template's default, and exits with code 1 and a message when something is missing or the target is not empty without `--force`.
- **`bun-sinwan` TypeScript** has a `typecheck` script (`bun check`) and `typescript` in its devDependencies.

### Changed

- **A project name given on the command line sets the directory** without asking for it; the "Target directory" prompt only appears after a typed name.
- **`--force` empties the target directory** (keeping `.git`) instead of writing over it, so stale files from an earlier project no longer stay next to the new ones. The interactive overwrite prompt does the same. A directory containing only `.git` counts as empty.
- **`-p` with a bun-only template is an error** (`-t bun-sinwan -p npm` exits 1); an incompatible manager chosen alongside an interactive template choice falls back to bun with a warning instead of being ignored silently.
- **Exit codes**: cancelling a prompt or declining to overwrite exits 1 (was 0); Ctrl+C while scaffolding or installing exits 130 (the progress spinner used to swallow it and keep running).
- **Next steps** show the install command when the install was skipped, failed, or the package manager was missing, and quote a directory with spaces.
- **Only the template's packages are looked up on npm**, in parallel with a 10-second timeout, before the target directory is created.
- **Packaging**: the CLI ships as a single bundled `dist/cli.js` with no runtime dependencies (`@clack/prompts`, `commander` and `kolorist` are bundled), no longer pulls in `typescript` as a peer dependency (about 23 MB per `npx create-sinwan`), drops the `main`/`module`/`types` fields that pointed at the CLI or at a missing file, declares `engines.node >=18`, and includes this changelog.
- **Template READMEs** use the project name as the title and document every script; `bun-sinwan` explains that `bun run build` is a static frontend export without the `/api` routes, and that the servers read `PORT`. The Vite TypeScript README no longer contains unrelated ESLint boilerplate. `index.html` titles use the project name.
- **`bun-sinwan-engine` reads `PORT`** (falling back to `HTTP_PORT`, then `3030`).
- **Vite and Bun template configs** drop options pointing at files those projects never have (`analyze: ./.sinwan/props.json`, `bunfigPath` in Vite); the Vite TypeScript cache uses `tsconfig.app.json`.

### Fixed

- **Package name**: `package.json` `name` now comes from the project name instead of the directory, so `@acme/web` keeps its scope and `My App` becomes `my-app`; a name that cannot become a valid package name exits with an error. `.` uses the current directory's name.
- **Offline or flaky npm**: one failed or malformed registry reply no longer aborts scaffolding and leaves an empty folder; that dependency is written as `"latest"` and the CLI names it. Registry replies are validated, so a reply without a version can no longer write `^undefined`.
- **JavaScript templates build again**: both now ship a `jsconfig.json` with `jsxImportSource: "sinwan"`, and the Vite template sets `oxc.jsx.importSource: "sinwan"`, so JSX compiles against Sinwan instead of failing with `Could not resolve "react/jsx-runtime"`.
- **Bun templates' navigation**: `NavLink` styles the active link through a `class` function (`({ isActive }) => …`) instead of `activeClass`.
- **`create-sinwan --version`** prints the package version instead of the hard-coded `0.1.0`.

### Security

- **`bun-sinwan` no longer serves project files**: the template's `/src/assets/*` route joined the request path onto the project folder, so `/src/assets/../../.env` (or `package.json`, or server source) could be downloaded from the dev and production servers. The route is removed; Bun already serves the favicon and images as bundled assets.
