export type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
export type Framework = "sinwan" | "sinwan-engine";
export type Template = "bun-sinwan" | "vite-sinwan" | "bun-sinwan-engine";
export type Language = "ts" | "js";

export interface CreateOptions {
  projectName: string;
  targetDir: string;
  template: Template;
  language: Language;
  packageManager: PackageManager;
  skipInstall: boolean;
  skipGit: boolean;
  /** Remove the target's contents (except `.git`) before writing. */
  force: boolean;
}

export interface TemplateFile {
  sourcePath: string;
  relativePath: string;
  isTemplate: boolean;
}

export interface PackageManagerInfo {
  name: PackageManager;
  installCommand: string;
  installArgs: string[];
  detectCommand: string;
}
