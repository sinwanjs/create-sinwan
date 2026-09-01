#!/usr/bin/env node
import { Command } from "commander";
import * as p from "@clack/prompts";
import { cyan, green } from "kolorist";
import path from "node:path";
import { installDependencies, isPackageManagerAvailable } from "./install.ts";
import { runPrompts, printNextSteps } from "./prompts.ts";
import { initGit, scaffoldProject } from "./scaffold.ts";
import type { Language, PackageManager, Template } from "./types.ts";
import {
  isValidLanguage,
  isValidPackageManager,
  isValidTemplate,
  TEMPLATES,
} from "./utils.ts";

const program = new Command()
  .name("create-sinwan")
  .description("Professional CLI to scaffold Sinwan projects")
  .version("0.1.0")
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
  .option("-f, --force", "Overwrite non-empty target directory")
  .action(async (projectName: string | undefined, options) => {
    const templateArg: string | undefined = options.template;
    const languageArg: string | undefined = options.language;
    const managerArg: string | undefined = options.packageManager;

    if (templateArg && !isValidTemplate(templateArg)) {
      console.error(`Invalid template: ${templateArg}`);
      process.exit(1);
    }
    if (languageArg && !isValidLanguage(languageArg)) {
      console.error(`Invalid language: ${languageArg}`);
      process.exit(1);
    }
    if (managerArg && !isValidPackageManager(managerArg)) {
      console.error(`Invalid package manager: ${managerArg}`);
      process.exit(1);
    }

    const createOptions = await runPrompts({
      projectName,
      targetDir: options.targetDir,
      template: templateArg as Template | undefined,
      language: languageArg as Language | undefined,
      packageManager: managerArg as PackageManager | undefined,
      skipInstall: options.skipInstall,
      skipGit: options.skipGit,
      force: options.force,
    });

    const s = p.spinner();
    s.start(`Creating ${cyan(path.basename(createOptions.targetDir))}...`);

    try {
      await scaffoldProject(createOptions);

      if (!createOptions.skipGit) {
        await initGit(createOptions.targetDir);
      }

      s.stop(`${green("✔")} Project scaffolded.`);

      if (!createOptions.skipInstall) {
        const installSpinner = p.spinner();
        installSpinner.start(
          `Installing dependencies with ${cyan(createOptions.packageManager)}...`,
        );

        const available = await isPackageManagerAvailable(
          createOptions.packageManager,
        );
        if (!available) {
          installSpinner.stop(
            `${createOptions.packageManager} is not available on PATH.`,
          );
          console.log(
            `Run ${cyan(`cd ${createOptions.targetDir} && ${createOptions.packageManager} install`)} manually.`,
          );
        } else {
          const result = await installDependencies(
            createOptions.targetDir,
            createOptions.packageManager,
          );
          if (result.success) {
            installSpinner.stop(`${green("✔")} Dependencies installed.`);
          } else {
            installSpinner.stop(`Install failed: ${result.error}`);
            console.log(`Run ${cyan(result.command)} manually.`);
          }
        }
      }

      printNextSteps(
        createOptions.targetDir,
        createOptions.packageManager,
        createOptions.skipInstall,
      );
    } catch (error) {
      s.stop(
        `Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  });

await program.parseAsync(process.argv);
