import { readdir, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type {
  Framework,
  Language,
  PackageManager,
  Template,
} from "./types.ts";

/**
 * Runs a command asynchronously in a Node-compatible way (replaces Bun's `$`
 * shell tag template, which is not available when the bundled CLI runs under
 * Node via `npx`/`npm create`).
 */
export function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    child.on("error", (err) => resolve({ success: false, error: err.message }));
    child.on("close", (code) => {
      if (code === 0) resolve({ success: true });
      else
        resolve({
          success: false,
          error: `${command} exited with code ${code}`,
        });
    });
  });
}

export const FRAMEWORKS: Record<
  Framework,
  { label: string; description: string }
> = {
  sinwan: {
    label: "Sinwan",
    description: "Frontend app with Sinwan components and sinwan-router",
  },
  "sinwan-engine": {
    label: "Sinwan Engine",
    description: "Server app with sinwan-engine HTTP routes and modules",
  },
};

export const TEMPLATES: Record<
  Template,
  { label: string; description: string; framework: Framework }
> = {
  "bun-sinwan": {
    label: "Bun + Sinwan",
    description:
      "Bun dev server with bun-plugin-sinwan and Tailwind CSS powered by bun.build()",
    framework: "sinwan",
  },
  "vite-sinwan": {
    label: "Vite + Sinwan",
    description: "Vite bundler with vite-plugin-sinwan and Tailwind CSS",
    framework: "sinwan",
  },
  "bun-sinwan-engine": {
    label: "Bun + Sinwan Engine",
    description: "Bun HTTP server with sinwan-engine, a users module and bun.build()",
    framework: "sinwan-engine",
  },
};

export const PACKAGE_MANAGERS: PackageManager[] = [
  "bun",
  "pnpm",
  "npm",
  "yarn",
];

export const LANGUAGES: Record<
  Language,
  { label: string; description: string }
> = {
  ts: {
    label: "TypeScript",
    description: "Type-safe development with .ts/.tsx files",
  },
  js: {
    label: "JavaScript",
    description: "Plain JavaScript with .js/.jsx files",
  },
};

export function isValidPackageName(name: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    name,
  );
}

export function toValidPackageName(name: string): string {
  const match = name.trim().match(/^(@[a-z0-9-*~][a-z0-9-*._~]*)\/(.+)$/i);
  if (match && match[1] && match[2]) {
    const scope = match[1].toLowerCase();
    const pkg = match[2]
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-._~]+/g, "-")
      .replace(/^-+/g, "")
      .replace(/-+$/g, "");
    return `${scope}/${pkg}`;
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-_~]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
}

export function isValidTemplate(value: string): value is Template {
  return value in TEMPLATES;
}

export function isValidFramework(value: string): value is Framework {
  return value in FRAMEWORKS;
}

export function getTemplatesForFramework(framework: Framework): Template[] {
  return Object.keys(TEMPLATES)
    .filter(isValidTemplate)
    .filter((template) => TEMPLATES[template].framework === framework);
}

export function isValidPackageManager(value: string): value is PackageManager {
  return PACKAGE_MANAGERS.some((manager) => manager === value);
}

export function isValidLanguage(value: string): value is Language {
  return value in LANGUAGES;
}

export function getPackageManagersForTemplate(
  template: Template,
): PackageManager[] {
  // The Bun templates are built around bun.build() and the Bun runtime, so
  // bun is the only supported package manager. Vite is bundler-agnostic and
  // works with any package manager.
  if (template !== "vite-sinwan") return ["bun"];
  return ["bun", "pnpm", "npm", "yarn"];
}

export function defaultPackageManagerForTemplate(
  _template: Template,
): PackageManager {
  return "bun";
}

/** A directory counts as empty when it is missing or holds only `.git`. */
export async function isEmptyDir(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.every((entry) => entry === ".git");
  } catch {
    return true;
  }
}

/** Removes everything in `dir` except `.git`. A missing `dir` is a no-op. */
export async function emptyDir(dir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((entry) => entry !== ".git")
      .map((entry) => rm(path.join(dir, entry), { recursive: true, force: true })),
  );
}

export async function canWriteDir(dir: string): Promise<boolean> {
  try {
    const s = await stat(dir);
    return s.isDirectory();
  } catch {
    return true;
  }
}

export function getTemplateDir(
  template: Template,
  language: Language = "ts",
): string {
  // `import.meta.dirname` is Bun/Node >= 20.11. Use `fileURLToPath` for
  // broader Node compatibility.
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../templates", language, template);
}

export function replacePlaceholders(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => values[key] ?? `{{${key}}}`,
  );
}

export function isTemplatedFile(relativePath: string): boolean {
  return (
    relativePath.endsWith(".json") ||
    relativePath.endsWith(".toml") ||
    relativePath.endsWith(".html") ||
    relativePath.endsWith(".md")
  );
}

export function formatTargetDir(projectName: string): string {
  return projectName.toLowerCase().replace(/\s+/g, "-");
}
