import * as p from "@clack/prompts";
import { cyan, gray, green } from "kolorist";
import path from "node:path";
import type {
  CreateOptions,
  Language,
  PackageManager,
  Template,
} from "./types.ts";
import {
  defaultPackageManagerForTemplate,
  formatTargetDir,
  getPackageManagersForTemplate,
  isEmptyDir,
  isValidPackageName,
  isValidLanguage,
  isValidPackageManager,
  isValidTemplate,
  LANGUAGES,
  TEMPLATES,
  toValidPackageName,
} from "./utils.ts";

function handleCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
  return value as T;
}

export interface CliArgs {
  projectName?: string;
  targetDir?: string;
  template?: string;
  language?: string;
  packageManager?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  force?: boolean;
}

export async function runPrompts(args: CliArgs): Promise<CreateOptions> {
  p.intro(`${green("create-sinwan")} — scaffold a new Sinwan project`);

  let projectName = args.projectName;
  if (!projectName) {
    projectName = handleCancel(
      await p.text({
        message: "Project name:",
        placeholder: "my-sinwan-app",
        validate: (value) => {
          if (!value) return "Project name is required";
          if (!isValidPackageName(value)) return "Invalid package name";
          return undefined;
        },
      }),
    );
  }

  const validPackageName = toValidPackageName(projectName);
  const defaultTargetDir = formatTargetDir(projectName);

  const targetDir = args.targetDir
    ? args.targetDir
    : handleCancel(
        await p.text({
          message: "Target directory:",
          placeholder: defaultTargetDir,
          initialValue: defaultTargetDir,
        }),
      );

  const resolvedTargetDir = path.resolve(targetDir || defaultTargetDir);
  const empty = await isEmptyDir(resolvedTargetDir);
  if (!empty && !args.force) {
    const overwrite = handleCancel(
      await p.confirm({
        message: `Directory ${cyan(path.basename(resolvedTargetDir))} is not empty. Overwrite?`,
        initialValue: false,
      }),
    );
    if (!overwrite) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  let template: Template =
    args.template && isValidTemplate(args.template)
      ? args.template
      : "bun-sinwan";
  if (!args.template || !isValidTemplate(args.template)) {
    const templateChoice = handleCancel(
      await p.select({
        message: "Select a template:",
        initialValue: "bun-sinwan",
        options: Object.entries(TEMPLATES).map(
          ([key, { label, description }]) => ({
            value: key as Template,
            label,
            hint: description,
          }),
        ),
      }),
    );
    template = templateChoice as Template;
  }

  let language: Language =
    args.language && isValidLanguage(args.language) ? args.language : "ts";
  if (!args.language || !isValidLanguage(args.language)) {
    const languageChoice = handleCancel(
      await p.select({
        message: "Select a language:",
        initialValue: "ts",
        options: Object.entries(LANGUAGES).map(
          ([key, { label, description }]) => ({
            value: key as Language,
            label,
            hint: description,
          }),
        ),
      }),
    );
    language = languageChoice as Language;
  }

  const allowedManagers = getPackageManagersForTemplate(template);
  let packageManager: PackageManager =
    defaultPackageManagerForTemplate(template);
  if (args.packageManager && isValidPackageManager(args.packageManager)) {
    if (allowedManagers.includes(args.packageManager)) {
      packageManager = args.packageManager;
    }
  } else if (allowedManagers.length > 1) {
    const managerChoice = handleCancel(
      await p.select({
        message: "Select a package manager:",
        initialValue: packageManager,
        options: allowedManagers.map((m) => ({
          value: m,
          label: m,
          hint: m === "bun" ? "recommended" : undefined,
        })),
      }),
    );
    packageManager = managerChoice;
  } else {
    // Only one package manager is supported for this template (e.g. bun for
    // the Bun template) — skip the prompt and use it directly.
    packageManager = allowedManagers[0]!;
  }

  const skipInstall = args.skipInstall ?? false;
  const skipGit = args.skipGit ?? false;

  p.outro(
    `Scaffolding ${cyan(template)} (${cyan(language === "ts" ? "TypeScript" : "JavaScript")}) project with ${cyan(packageManager)}...`,
  );

  return {
    projectName: validPackageName,
    targetDir: resolvedTargetDir,
    template,
    language,
    packageManager,
    skipInstall,
    skipGit,
    force: args.force ?? false,
  };
}

export function printNextSteps(
  targetDir: string,
  packageManager: PackageManager,
  skipInstall: boolean,
): void {
  let displayDir = path.relative(process.cwd(), targetDir) || ".";
  if (displayDir.startsWith("..")) {
    displayDir = targetDir;
  }
  console.log("\n" + green("✔ Done."));
  console.log(gray("Next steps:"));
  console.log(`  cd ${cyan(displayDir)}`);
  if (skipInstall) {
    console.log(`  ${cyan(`${packageManager} install`)}`);
  }
  console.log(`  ${cyan(`${packageManager} run dev`)}`);
}
