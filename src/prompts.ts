import * as p from "@clack/prompts";
import { cyan, gray, green } from "kolorist";
import path from "node:path";
import type {
  CreateOptions,
  Framework,
  Language,
  PackageManager,
  Template,
} from "./types.ts";
import {
  defaultPackageManagerForTemplate,
  formatTargetDir,
  FRAMEWORKS,
  getPackageManagersForTemplate,
  getTemplatesForFramework,
  isEmptyDir,
  isValidFramework,
  isValidPackageName,
  isValidLanguage,
  isValidPackageManager,
  isValidTemplate,
  LANGUAGES,
  TEMPLATES,
  toValidPackageName,
} from "./utils.ts";

function fail(message: string): never {
  p.cancel(message);
  return process.exit(1);
}

function handleCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) return fail("Operation cancelled.");
  return value;
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

async function selectTemplate(): Promise<Template> {
  const framework = handleCancel(
    await p.select<Framework>({
      message: "Select a framework:",
      initialValue: "sinwan",
      options: Object.keys(FRAMEWORKS)
        .filter(isValidFramework)
        .map((key) => ({
          value: key,
          label: FRAMEWORKS[key].label,
          hint: FRAMEWORKS[key].description,
        })),
    }),
  );

  const templates = getTemplatesForFramework(framework);
  const [first] = templates;
  if (templates.length === 1 && first) return first;

  return handleCancel(
    await p.select<Template>({
      message: "Select a template:",
      initialValue: first,
      options: templates.map((key) => ({
        value: key,
        label: TEMPLATES[key].label,
        hint: TEMPLATES[key].description,
      })),
    }),
  );
}

/**
 * Collects the scaffold options, asking only for what the flags leave out.
 * Without a terminal it never asks: a missing project name or template, or a
 * non-empty target without `--force`, exits with code 1.
 */
export async function runPrompts(
  args: CliArgs,
  interactive: boolean = Boolean(process.stdin.isTTY),
): Promise<CreateOptions> {
  p.intro(`${green("create-sinwan")} — scaffold a new Sinwan project`);

  let projectName = args.projectName;
  if (!projectName) {
    if (!interactive) {
      fail("Pass a project name: there is no terminal to ask in.");
    }
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

  const defaultTargetDir = formatTargetDir(projectName);
  let targetDir = args.targetDir;
  // A name given on the command line already says where the project goes.
  if (!targetDir && !args.projectName) {
    targetDir = handleCancel(
      await p.text({
        message: "Target directory:",
        placeholder: defaultTargetDir,
        initialValue: defaultTargetDir,
      }),
    );
  }
  const resolvedTargetDir = path.resolve(targetDir || defaultTargetDir);

  const packageName = toValidPackageName(
    projectName === "." ? path.basename(resolvedTargetDir) : projectName,
  );
  if (!isValidPackageName(packageName)) {
    fail(`Invalid project name: ${projectName}`);
  }

  let force = args.force ?? false;
  if (!force && !(await isEmptyDir(resolvedTargetDir))) {
    const dirName = cyan(path.basename(resolvedTargetDir));
    if (!interactive) {
      fail(
        `Directory ${dirName} is not empty. Pass --force to remove its contents.`,
      );
    }
    force = handleCancel(
      await p.confirm({
        message: `Directory ${dirName} is not empty. Remove its contents and continue?`,
        initialValue: false,
      }),
    );
    if (!force) fail("Operation cancelled.");
  }

  let template: Template;
  if (args.template && isValidTemplate(args.template)) {
    template = args.template;
  } else {
    if (!interactive) {
      fail(
        `Pass --template (${Object.keys(TEMPLATES).join(", ")}): there is no terminal to ask in.`,
      );
    }
    template = await selectTemplate();
  }

  let language: Language = "ts";
  if (args.language && isValidLanguage(args.language)) {
    language = args.language;
  } else if (interactive) {
    language = handleCancel(
      await p.select<Language>({
        message: "Select a language:",
        initialValue: "ts",
        options: Object.keys(LANGUAGES)
          .filter(isValidLanguage)
          .map((key) => ({
            value: key,
            label: LANGUAGES[key].label,
            hint: LANGUAGES[key].description,
          })),
      }),
    );
  }

  const allowedManagers = getPackageManagersForTemplate(template);
  let packageManager = defaultPackageManagerForTemplate(template);
  const requestedManager = args.packageManager;
  if (requestedManager && isValidPackageManager(requestedManager)) {
    if (allowedManagers.includes(requestedManager)) {
      packageManager = requestedManager;
    } else {
      p.log.warn(
        `${template} only supports ${allowedManagers.join(", ")}; using ${packageManager} instead of ${requestedManager}.`,
      );
    }
  } else if (interactive && allowedManagers.length > 1) {
    packageManager = handleCancel(
      await p.select<PackageManager>({
        message: "Select a package manager:",
        initialValue: packageManager,
        options: allowedManagers.map((m) => ({
          value: m,
          label: m,
          hint: m === "bun" ? "recommended" : undefined,
        })),
      }),
    );
  }

  p.outro(
    `Scaffolding ${cyan(template)} (${cyan(language === "ts" ? "TypeScript" : "JavaScript")}) project with ${cyan(packageManager)}...`,
  );

  return {
    projectName: packageName,
    targetDir: resolvedTargetDir,
    template,
    language,
    packageManager,
    skipInstall: args.skipInstall ?? false,
    skipGit: args.skipGit ?? false,
    force,
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
  if (displayDir.includes(" ")) {
    displayDir = `"${displayDir}"`;
  }
  console.log(`  cd ${cyan(displayDir)}`);
  if (skipInstall) {
    console.log(`  ${cyan(`${packageManager} install`)}`);
  }
  console.log(`  ${cyan(`${packageManager} run dev`)}`);
}
