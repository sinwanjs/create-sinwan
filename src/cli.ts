import { Command } from "commander";
import * as p from "@clack/prompts";
import { cyan, green } from "kolorist";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
import { installDependencies, isPackageManagerAvailable } from "./install.ts";
import { runPrompts, printNextSteps, type CliArgs } from "./prompts.ts";
import { initGit, scaffoldProject } from "./scaffold.ts";
import {
  getPackageManagersForTemplate,
  isValidLanguage,
  isValidPackageManager,
  isValidTemplate,
  TEMPLATES,
} from "./utils.ts";

export type Spinner = ReturnType<typeof p.spinner>;

type CliOptions = Omit<CliArgs, "projectName">;

export interface CliDeps {
  runPrompts: typeof runPrompts;
  scaffoldProject: typeof scaffoldProject;
  initGit: typeof initGit;
  isPackageManagerAvailable: typeof isPackageManagerAvailable;
  installDependencies: typeof installDependencies;
  printNextSteps: typeof printNextSteps;
  spinner: () => Spinner;
  log: (message: string) => void;
  error: (message: string) => void;
  exit: (code: number) => never;
  /** Runs `handler` on Ctrl+C until the returned function is called. */
  onInterrupt: (handler: () => void) => () => void;
}

export const defaultCliDeps: CliDeps = {
  runPrompts,
  scaffoldProject,
  initGit,
  isPackageManagerAvailable,
  installDependencies,
  printNextSteps,
  spinner: () => p.spinner(),
  log: (message) => console.log(message),
  error: (message) => console.error(message),
  exit: (code) => process.exit(code),
  onInterrupt: (handler) => {
    process.on("SIGINT", handler);
    return () => process.off("SIGINT", handler);
  },
};

export const CLI_VERSION = packageJson.version;

export function createProgram(deps: CliDeps = defaultCliDeps): Command {
  return new Command()
    .name("create-sinwan")
    .description("Official CLI to scaffold Sinwan projects")
    .version(CLI_VERSION)
    .argument("[project-name]", "Name of the new project")
    .option(
      "-t, --template <template>",
      `Template (${Object.keys(TEMPLATES).join(", ")})`,
    )
    .option("-l, --language <language>", "Language (ts, js)")
    .option(
      "-p, --package-manager <manager>",
      "Package manager (bun, pnpm, npm, yarn)",
    )
    .option("--target-dir <dir>", "Target directory (defaults to project name)")
    .option("--skip-install", "Do not install dependencies")
    .option("--skip-git", "Do not initialize a git repository")
    .option(
      "-f, --force",
      "Remove existing files in the target directory (keeps .git)",
    )
    .action(async (projectName: string | undefined, options: CliOptions) => {
      const templateArg = options.template;
      const languageArg = options.language;
      const managerArg = options.packageManager;

      if (templateArg && !isValidTemplate(templateArg)) {
        deps.error(`Invalid template: ${templateArg}`);
        deps.exit(1);
      }
      if (languageArg && !isValidLanguage(languageArg)) {
        deps.error(`Invalid language: ${languageArg}`);
        deps.exit(1);
      }
      if (managerArg && !isValidPackageManager(managerArg)) {
        deps.error(`Invalid package manager: ${managerArg}`);
        deps.exit(1);
      }
      if (
        templateArg &&
        managerArg &&
        isValidTemplate(templateArg) &&
        isValidPackageManager(managerArg)
      ) {
        const allowed = getPackageManagersForTemplate(templateArg);
        if (!allowed.includes(managerArg)) {
          deps.error(
            `Template ${templateArg} only supports ${allowed.join(", ")}, not ${managerArg}.`,
          );
          deps.exit(1);
        }
      }

      const createOptions = await deps.runPrompts({
        ...options,
        projectName,
      });

      let spinner = deps.spinner();
      // The spinner swallows Ctrl+C, so stop it and exit explicitly.
      const removeInterrupt = deps.onInterrupt(() => {
        spinner.stop("Cancelled.");
        deps.exit(130);
      });
      spinner.start(
        `Creating ${cyan(path.basename(createOptions.targetDir))}...`,
      );

      try {
        const { unresolvedPackages } =
          await deps.scaffoldProject(createOptions);

        if (!createOptions.skipGit) {
          await deps.initGit(createOptions.targetDir);
        }

        spinner.stop(`${green("✔")} Project scaffolded.`);
        if (unresolvedPackages.length > 0) {
          deps.log(
            `Could not fetch the latest version of ${unresolvedPackages.join(", ")} from npm; package.json uses "latest" instead.`,
          );
        }

        let installed = false;
        if (!createOptions.skipInstall) {
          spinner = deps.spinner();
          spinner.start(
            `Installing dependencies with ${cyan(createOptions.packageManager)}...`,
          );

          const available = await deps.isPackageManagerAvailable(
            createOptions.packageManager,
          );
          if (!available) {
            spinner.stop(
              `${createOptions.packageManager} is not available on PATH.`,
            );
            deps.log(
              `Run ${cyan(`cd ${createOptions.targetDir} && ${createOptions.packageManager} install`)} manually.`,
            );
          } else {
            const result = await deps.installDependencies(
              createOptions.targetDir,
              createOptions.packageManager,
            );
            installed = result.success;
            if (result.success) {
              spinner.stop(`${green("✔")} Dependencies installed.`);
            } else {
              spinner.stop(`Install failed: ${result.error}`);
              deps.log(`Run ${cyan(result.command)} manually.`);
            }
          }
        }

        deps.printNextSteps(
          createOptions.targetDir,
          createOptions.packageManager,
          !installed,
        );
      } catch (error) {
        spinner.stop(
          `Failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        deps.exit(1);
      } finally {
        removeInterrupt();
      }
    });
}
