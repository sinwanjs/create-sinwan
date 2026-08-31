import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { scaffoldProject } from "../src/scaffold.ts";
import {
  replacePlaceholders,
  toValidPackageName,
  isValidPackageName,
  getPackageManagersForTemplate,
  defaultPackageManagerForTemplate,
} from "../src/utils.ts";
import {
  getPackageManagerInfo,
  isPackageManagerAvailable,
} from "../src/install.ts";
import { isValidLanguage } from "../src/utils.ts";
import type { CreateOptions } from "../src/types.ts";

describe("utils", () => {
  it("normalizes package names", () => {
    expect(toValidPackageName("My App")).toBe("my-app");
    expect(toValidPackageName("@scope/app")).toBe("@scope/app");
    expect(toValidPackageName("my_app")).toBe("my_app");
  });

  it("validates package names", () => {
    expect(isValidPackageName("my-app")).toBe(true);
    expect(isValidPackageName("My App")).toBe(false);
    expect(isValidPackageName("")).toBe(false);
  });

  it("replaces placeholders", () => {
    expect(
      replacePlaceholders("{{PROJECT_NAME}} rocks", { PROJECT_NAME: "sinwan" }),
    ).toBe("sinwan rocks");
    expect(replacePlaceholders("{{MISSING}}", {})).toBe("{{MISSING}}");
  });

  it("validates languages", () => {
    expect(isValidLanguage("ts")).toBe(true);
    expect(isValidLanguage("js")).toBe(true);
    expect(isValidLanguage("rust")).toBe(false);
  });

  it("restricts the Bun template to bun only", () => {
    expect(getPackageManagersForTemplate("bun-sinwan")).toEqual(["bun"]);
  });

  it("allows all package managers for the Vite template", () => {
    expect(getPackageManagersForTemplate("vite-sinwan")).toEqual([
      "bun",
      "pnpm",
      "npm",
      "yarn",
    ]);
  });

  it("defaults to bun for both templates", () => {
    expect(defaultPackageManagerForTemplate("bun-sinwan")).toBe("bun");
    expect(defaultPackageManagerForTemplate("vite-sinwan")).toBe("bun");
  });
});

describe("install", () => {
  it("returns package manager info", () => {
    const bun = getPackageManagerInfo("bun");
    expect(bun.name).toBe("bun");
    expect(bun.installCommand).toBe("bun");
  });

  it("detects bun availability", async () => {
    const available = await isPackageManagerAvailable("bun");
    expect(available).toBe(true);
  });
});

describe("scaffoldProject", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "create-sinwan-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("scaffolds bun-sinwan template (TypeScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-app",
      targetDir: tmpDir,
      template: "bun-sinwan",
      language: "ts",
      packageManager: "bun",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "bunfig.toml"))).toBe(true);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.name).toBe(path.basename(tmpDir));
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["bun-plugin-sinwan"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["@types/bun"]).toMatch(/^\^\d+/);
  });

  it("scaffolds bun-sinwan template (JavaScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-app",
      targetDir: tmpDir,
      template: "bun-sinwan",
      language: "js",
      packageManager: "bun",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "build.js"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["bun-plugin-sinwan"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["@types/bun"]).toBeUndefined();
  });

  it("scaffolds vite-sinwan template (TypeScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-app",
      targetDir: tmpDir,
      template: "vite-sinwan",
      language: "ts",
      packageManager: "npm",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "vite.config.ts"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.tsx"))).toBe(true);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["vite-plugin-sinwan"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["typescript"]).toMatch(/^\^\d+/);
  });

  it("scaffolds vite-sinwan template (JavaScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-app",
      targetDir: tmpDir,
      template: "vite-sinwan",
      language: "js",
      packageManager: "npm",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "vite.config.js"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["vite-plugin-sinwan"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["@tailwindcss/vite"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["typescript"]).toBeUndefined();
  });
});
