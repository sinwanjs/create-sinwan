import { $ } from "bun";
import {
  mkdir,
  readFile,
  writeFile,
  cp,
  readdir,
  stat,
} from "node:fs/promises";
import path from "node:path";
import type { CreateOptions, TemplateFile } from "./types.ts";
import {
  getTemplateDir,
  isTemplatedFile,
  replacePlaceholders,
} from "./utils.ts";
import { fetchLatestVersions, toPlaceholders } from "./versions.ts";

export async function collectTemplateFiles(
  templateDir: string,
): Promise<TemplateFile[]> {
  const files: TemplateFile[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(templateDir, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push({
          sourcePath: fullPath,
          relativePath,
          isTemplate: isTemplatedFile(relativePath),
        });
      }
    }
  }

  await walk(templateDir);
  return files;
}

export async function writeTemplateFile(
  file: TemplateFile,
  targetDir: string,
  placeholders: Record<string, string>,
): Promise<void> {
  const targetPath = path.join(targetDir, file.relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (file.isTemplate) {
    const content = await readFile(file.sourcePath, "utf-8");
    await writeFile(
      targetPath,
      replacePlaceholders(content, placeholders),
      "utf-8",
    );
  } else {
    await cp(file.sourcePath, targetPath, { preserveTimestamps: true });
  }
}

export async function scaffoldProject(options: CreateOptions): Promise<void> {
  const templateDir = getTemplateDir(options.template, options.language);
  const files = await collectTemplateFiles(templateDir);

  await mkdir(options.targetDir, { recursive: true });

  const versions = await fetchLatestVersions();
  const placeholders = toPlaceholders(
    versions,
    path.basename(options.targetDir),
  );

  for (const file of files) {
    await writeTemplateFile(file, options.targetDir, placeholders);
  }
}

export async function initGit(targetDir: string): Promise<void> {
  try {
    await $`git init`.cwd(targetDir).quiet();
    await $`git add .`.cwd(targetDir).quiet();
  } catch {
    // Git is optional; ignore failures.
  }
}
