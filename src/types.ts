export type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
export type Template = "bun-sinwan" | "vite-sinwan";
export type Language = "ts" | "js";

export interface CreateOptions {
  projectName: string;
  targetDir: string;
  template: Template;
  language: Language;
  packageManager: PackageManager;
  skipInstall: boolean;
  skipGit: boolean;
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
