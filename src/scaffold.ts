import { mkdir, readFile, writeFile, cp, readdir } from "node:fs/promises";
import path from "node:path";
import type { CreateOptions, TemplateFile } from "./types.ts";
import {
  emptyDir,
  getTemplateDir,
  isTemplatedFile,
  replacePlaceholders,
  runCommand,
} from "./utils.ts";
import {
  fetchLatestVersions,
  packagesInTemplates,
  toPlaceholders,
  type VersionLookup,
} from "./versions.ts";

export interface ScaffoldResult {
  /** Packages written as `latest` because npm could not be reached. */
  unresolvedPackages: string[];
}

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
  // npm strips `.gitignore` files from published tarballs, so the template
  // ships them as `_gitignore`. Restore the leading dot when scaffolding.
  const relativePath = file.relativePath.replace(
    /(^|\/)_gitignore$/,
    "$1.gitignore",
  );
  const targetPath = path.join(targetDir, relativePath);
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

export async function scaffoldProject(
  options: CreateOptions,
  fetchVersions: (
    packages: readonly string[],
  ) => Promise<VersionLookup> = fetchLatestVersions,
): Promise<ScaffoldResult> {
  const templateDir = getTemplateDir(options.template, options.language);
  const files = await collectTemplateFiles(templateDir);
  const contents = await Promise.all(
    files
      .filter((file) => file.isTemplate)
      .map((file) => readFile(file.sourcePath, "utf-8")),
  );

  // Resolve versions before touching the target so a network problem never
  // leaves a half-written project behind.
  const { versions, failed } = await fetchVersions(
    packagesInTemplates(contents),
  );

  if (options.force) {
    await emptyDir(options.targetDir);
  }
  await mkdir(options.targetDir, { recursive: true });

  const placeholders = toPlaceholders(versions, options.projectName);
  for (const file of files) {
    await writeTemplateFile(file, options.targetDir, placeholders);
  }

  return { unresolvedPackages: failed };
}

export async function initGit(targetDir: string): Promise<void> {
  try {
    // Git is optional; ignore failures.
    const init = await runCommand("git", ["init"], { cwd: targetDir });
    if (!init.success) return;
    await runCommand("git", ["add", "."], { cwd: targetDir });
  } catch {
    // Git is optional; ignore failures.
  }
}
