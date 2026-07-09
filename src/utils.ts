import { exists, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Language, PackageManager, Template } from "./types.ts";

export const TEMPLATES: Record<
  Template,
  { label: string; description: string }
> = {
  "bun-sinwan": {
    label: "Bun + Sinwan",
    description:
      "Bun dev server with bun-plugin-sinwan and Tailwind CSS powered by bun.build()",
  },
  "vite-sinwan": {
    label: "Vite + Sinwan",
    description:
      "Vite bundler with vite-plugin-sinwan and tailwind CSS",
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

export function isValidPackageManager(value: string): value is PackageManager {
  return PACKAGE_MANAGERS.includes(value as PackageManager);
}

export function isValidLanguage(value: string): value is Language {
  return value in LANGUAGES;
}

export function getPackageManagersForTemplate(
  _template: Template,
): PackageManager[] {
  return ["bun", "pnpm", "npm", "yarn"];
}

export function defaultPackageManagerForTemplate(
  _template: Template,
): PackageManager {
  return "bun";
}

export async function isEmptyDir(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length === 0;
  } catch {
    return true;
  }
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
  return path.resolve(
    import.meta.dirname ?? __dirname,
    "../templates",
    language,
    template,
  );
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
