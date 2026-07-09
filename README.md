# create-sinwan

Official CLI to scaffold [Sinwan](https://sinwanjs.com) projects.

## Quick start

```bash
# Interactive — prompts for template, language, package manager
bunx create-sinwan

# Or scaffold non-interactively
bunx create-sinwan my-app --template bun-sinwan --language ts --package-manager bun
```

## Templates

| Template      | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `bun-sinwan`  | Bun dev server with `bun-plugin-sinwan` and Tailwind CSS powered by `bun.build()` |
| `vite-sinwan` | Vite bundler with `vite-plugin-sinwan` and Tailwind CSS                           |

Each template is available in **TypeScript** (`ts`) and **JavaScript** (`js`).

### TypeScript vs JavaScript

|                     | TypeScript                 | JavaScript     |
| ------------------- | -------------------------- | -------------- |
| Source files        | `.ts` / `.tsx`             | `.js` / `.jsx` |
| Type checking       | `tsc` + `tsconfig.json`    | None           |
| Dev dependencies    | `typescript`, `@types/bun` | None extra     |
| Build script (Vite) | `tsc -b && vite build`     | `vite build`   |

```bash
# TypeScript (default)
bunx create-sinwan my-app --template vite-sinwan --language ts

# JavaScript
bunx create-sinwan my-app --template vite-sinwan --language js
```

## Package managers

The CLI supports `bun`, `pnpm`, `npm` and `yarn`. It auto-detects whether the chosen manager is available on PATH and installs dependencies after scaffolding. If the manager is missing, it prints the manual install command.

## Options

```
-V, --version                      output the version number
-t, --template <template>          Template (bun-sinwan, vite-sinwan)
-l, --language <language>          Language (ts, js)
-p, --package-manager <manager>    Package manager (bun, pnpm, npm, yarn)
    --target-dir <dir>             Target directory (defaults to project name)
    --skip-install                 Do not install dependencies
    --skip-git                     Do not initialize a git repository
-f, --force                        Overwrite non-empty target directory
-h, --help                         display help for command
```

### Examples

```bash
# Scaffold a Bun + TypeScript project (default)
bunx create-sinwan my-app

# Scaffold a Vite + JavaScript project
bunx create-sinwan my-app -t vite-sinwan -l js

# Scaffold into a specific directory, skip install & git
bunx create-sinwan my-app -t bun-sinwan -l ts --target-dir ./projects/my-app --skip-install --skip-git

# Overwrite an existing directory
bunx create-sinwan my-app -t vite-sinwan -l js -f
```

## Development

```bash
bun install
bun run dev
bun run build
bun run test
```

The CLI is bundled to `dist/cli.js` and exposed via the `create-sinwan` bin, so it works with `bunx create-sinwan` and `npm create sinwan`.
