# create-sinwan

Official CLI to scaffold [Sinwan](https://sinwanjs.com) projects.

## Quick start

```bash
# Interactive — prompts for framework, template, language, package manager
bunx create-sinwan
# or: bun create sinwan · npm create sinwan@latest · pnpm create sinwan

# Or scaffold without any prompts
bunx create-sinwan my-app --template bun-sinwan --language ts
```

Requires Node.js 18+ (or Bun) to run the CLI. Without a terminal (CI, scripts) the CLI never prompts: pass a project name and `--template`; the language defaults to `ts` and the package manager to `bun`. A non-empty target directory needs `--force`.

## Templates

The interactive CLI first asks which framework to use, then which of its templates.

| Framework       | Template            | Description                                                                       |
| --------------- | ------------------- | --------------------------------------------------------------------------------- |
| Sinwan          | `bun-sinwan`        | Bun dev server with `bun-plugin-sinwan` and Tailwind CSS powered by `bun.build()` |
| Sinwan          | `vite-sinwan`       | Vite bundler with `vite-plugin-sinwan` and Tailwind CSS                           |
| Sinwan Engine   | `bun-sinwan-engine` | Bun HTTP server with `sinwan-engine`, a users module and `bun.build()`            |

Each template is available in **TypeScript** (`ts`) and **JavaScript** (`js`). The Sinwan demo apps include `sinwan-router` with Home, About, and Contact pages. Sinwan Engine has a single template, so the CLI skips the template prompt; pass `--template bun-sinwan-engine` to skip the framework prompt as well.

### TypeScript vs JavaScript

|                  | TypeScript                                                       | JavaScript                     |
| ---------------- | ---------------------------------------------------------------- | ------------------------------ |
| Source files     | `.ts` / `.tsx`                                                   | `.js` / `.jsx`                 |
| Type checking    | `bun run typecheck` (Bun templates), `tsc -b` in `build` (Vite) | None                           |
| Config           | `tsconfig.json`                                                  | `jsconfig.json` (JSX templates) |
| Dev dependencies | `typescript`, plus `@types/bun` (Bun) or `@types/node` (Vite)    | None extra                     |

```bash
# TypeScript (default)
bunx create-sinwan my-app --template vite-sinwan --language ts

# JavaScript
bunx create-sinwan my-app --template vite-sinwan --language js
```

## Package managers

`vite-sinwan` works with `bun`, `pnpm`, `npm` and `yarn`. The Bun templates (`bun-sinwan`, `bun-sinwan-engine`) run on Bun and use `bun` only: combining one with another `--package-manager` is an error, and an interactive choice falls back to `bun` with a warning.

After scaffolding the CLI installs dependencies if the manager is on PATH; otherwise, or if the install fails, it prints the command to run.

When npm cannot be reached for a dependency's latest version, the CLI writes `"latest"` for that dependency and says which ones.

## Options

```
-V, --version                      output the version number
-t, --template <template>          Template (bun-sinwan, vite-sinwan, bun-sinwan-engine)
-l, --language <language>          Language (ts, js)
-p, --package-manager <manager>    Package manager (bun, pnpm, npm, yarn)
    --target-dir <dir>             Target directory (defaults to project name)
    --skip-install                 Do not install dependencies
    --skip-git                     Do not initialize a git repository
-f, --force                        Remove existing files in the target directory (keeps .git)
-h, --help                         display help for command
```

### Examples

```bash
# Ask for everything except the name
bunx create-sinwan my-app

# Scaffold into the current directory (name taken from the directory)
bunx create-sinwan . -t bun-sinwan-engine

# Scaffold a Vite + JavaScript project
bunx create-sinwan my-app -t vite-sinwan -l js

# Scaffold into a specific directory, skip install & git
bunx create-sinwan my-app -t bun-sinwan -l ts --target-dir ./projects/my-app --skip-install --skip-git

# Replace the contents of an existing directory
bunx create-sinwan my-app -t vite-sinwan -l js -f

# Sinwan Engine server in JavaScript
bunx create-sinwan my-api -t bun-sinwan-engine -l js
```

## Development

```bash
bun install
bun run dev
bun run build
bun run test

# Also check every version placeholder against the live npm registry
CREATE_SINWAN_LIVE_NPM=1 bun run test
```

The CLI is bundled to `dist/cli.js` and exposed via the `create-sinwan` bin, so it works with `bunx create-sinwan` and `npm create sinwan`.
