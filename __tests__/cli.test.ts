import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  spyOn,
} from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { scaffoldProject } from "../src/scaffold.ts";
import {
  replacePlaceholders,
  toValidPackageName,
  isValidPackageName,
  getPackageManagersForTemplate,
  defaultPackageManagerForTemplate,
  emptyDir,
  getTemplatesForFramework,
  isEmptyDir,
  isValidFramework,
} from "../src/utils.ts";
import {
  getPackageManagerInfo,
  isPackageManagerAvailable,
} from "../src/install.ts";
import { isValidLanguage } from "../src/utils.ts";
import type { CreateOptions } from "../src/types.ts";
import type { VersionLookup } from "../src/versions.ts";

const fakeVersions = async (
  packages: readonly string[],
): Promise<VersionLookup> => ({
  versions: Object.fromEntries(packages.map((pkg) => [pkg, "^1.0.0"])),
  failed: [],
});

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

  it("restricts the Sinwan Engine template to bun only", () => {
    expect(getPackageManagersForTemplate("bun-sinwan-engine")).toEqual(["bun"]);
  });

  it("validates frameworks", () => {
    expect(isValidFramework("sinwan")).toBe(true);
    expect(isValidFramework("sinwan-engine")).toBe(true);
    expect(isValidFramework("react")).toBe(false);
  });

  it("groups templates by framework", () => {
    expect(getTemplatesForFramework("sinwan")).toEqual([
      "bun-sinwan",
      "vite-sinwan",
    ]);
    expect(getTemplatesForFramework("sinwan-engine")).toEqual([
      "bun-sinwan-engine",
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

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Home.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "About.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Contact.tsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(tmpDir, "src", "main.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "bunfig.toml"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "_gitignore"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.name).toBe("test-app");
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.dependencies["sinwan-router"]).toMatch(/^\^\d+/);
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

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Home.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "About.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Contact.jsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(tmpDir, "src", "main.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "build.js"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "jsconfig.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "_gitignore"))).toBe(false);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(false);

    const jsconfig = JSON.parse(
      readFileSync(path.join(tmpDir, "jsconfig.json"), "utf-8"),
    );
    expect(jsconfig.compilerOptions.jsxImportSource).toBe("sinwan");

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.dependencies["sinwan-router"]).toMatch(/^\^\d+/);
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

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "vite.config.ts"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Home.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "About.tsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Contact.tsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "_gitignore"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.dependencies["sinwan-router"]).toMatch(/^\^\d+/);
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

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "package.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "vite.config.js"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "main.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "App.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Home.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "About.jsx"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "src", "pages", "Contact.jsx"))).toBe(
      true,
    );
    expect(existsSync(path.join(tmpDir, "jsconfig.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "_gitignore"))).toBe(false);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(false);

    const jsconfig = JSON.parse(
      readFileSync(path.join(tmpDir, "jsconfig.json"), "utf-8"),
    );
    expect(jsconfig.compilerOptions.jsxImportSource).toBe("sinwan");
    expect(
      readFileSync(path.join(tmpDir, "vite.config.js"), "utf-8"),
    ).toContain('jsx: { importSource: "sinwan" }');

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies.sinwan).toMatch(/^\^\d+/);
    expect(pkg.dependencies["sinwan-router"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["vite-plugin-sinwan"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["@tailwindcss/vite"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["typescript"]).toBeUndefined();
  });

  it("scaffolds bun-sinwan-engine template (TypeScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-api",
      targetDir: tmpDir,
      template: "bun-sinwan-engine",
      language: "ts",
      packageManager: "bun",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "src", "index.ts"))).toBe(true);
    expect(
      existsSync(path.join(tmpDir, "src", "routes", "users.route.ts")),
    ).toBe(true);
    expect(existsSync(path.join(tmpDir, "build.ts"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".env.example"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "_gitignore"))).toBe(false);
    expect(existsSync(path.join(tmpDir, "index.html"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.name).toBe("test-api");
    expect(pkg.scripts.dev).toBe("bun --watch src/index.ts");
    expect(pkg.dependencies["sinwan-engine"]).toMatch(/^\^\d+/);
    expect(pkg.dependencies.sinwan).toBeUndefined();
    expect(pkg.devDependencies["@types/bun"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies["typescript"]).toMatch(/^\^\d+/);
    expect(
      readFileSync(path.join(tmpDir, "README.md"), "utf-8"),
    ).toStartWith("# test-api");
  });

  it("scaffolds bun-sinwan-engine template (JavaScript)", async () => {
    const options: CreateOptions = {
      projectName: "test-api",
      targetDir: tmpDir,
      template: "bun-sinwan-engine",
      language: "js",
      packageManager: "bun",
      skipInstall: true,
      skipGit: true,
      force: true,
    };

    await scaffoldProject(options, fakeVersions);

    expect(existsSync(path.join(tmpDir, "src", "index.js"))).toBe(true);
    expect(
      existsSync(path.join(tmpDir, "src", "routes", "users.route.js")),
    ).toBe(true);
    expect(existsSync(path.join(tmpDir, "build.js"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".env.example"))).toBe(true);
    expect(existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "tsconfig.json"))).toBe(false);

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.scripts.dev).toBe("bun --watch src/index.js");
    expect(pkg.dependencies["sinwan-engine"]).toMatch(/^\^\d+/);
    expect(pkg.devDependencies).toBeUndefined();
  });

  const engineOptions = (overrides: Partial<CreateOptions> = {}): CreateOptions => ({
    projectName: "test-api",
    targetDir: tmpDir,
    template: "bun-sinwan-engine",
    language: "ts",
    packageManager: "bun",
    skipInstall: true,
    skipGit: true,
    force: false,
    ...overrides,
  });

  it("looks versions up on npm by default", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      Object.assign(async () => Response.json({ version: "9.9.9" }), {
        preconnect: fetch.preconnect,
      }),
    );
    try {
      const result = await scaffoldProject(engineOptions());

      expect(result.unresolvedPackages).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    } finally {
      fetchSpy.mockRestore();
    }

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies["sinwan-engine"]).toBe("^9.9.9");
  });

  it("writes the scoped project name into package.json", async () => {
    await scaffoldProject(
      engineOptions({ projectName: "@acme/web" }),
      fakeVersions,
    );

    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.name).toBe("@acme/web");
  });

  it("fetches only the packages the template uses", async () => {
    const requested: string[] = [];

    await scaffoldProject(engineOptions(), async (packages) => {
      requested.push(...packages);
      return fakeVersions(packages);
    });

    expect(requested.sort()).toEqual(
      ["@types/bun", "sinwan-engine", "typescript"].sort(),
    );
  });

  it("falls back to latest and reports packages npm could not resolve", async () => {
    const result = await scaffoldProject(engineOptions(), async (packages) => ({
      versions: {},
      failed: [...packages],
    }));

    expect(result.unresolvedPackages.sort()).toEqual(
      ["@types/bun", "sinwan-engine", "typescript"].sort(),
    );
    const pkg = JSON.parse(
      readFileSync(path.join(tmpDir, "package.json"), "utf-8"),
    );
    expect(pkg.dependencies["sinwan-engine"]).toBe("latest");
  });

  it("does not create the target when the version lookup throws", async () => {
    const target = path.join(tmpDir, "never");

    await expect(
      scaffoldProject(engineOptions({ targetDir: target }), () =>
        Promise.reject(new Error("offline")),
      ),
    ).rejects.toThrow("offline");

    expect(existsSync(target)).toBe(false);
  });

  it("removes existing files but keeps .git when forced", async () => {
    mkdirSync(path.join(tmpDir, ".git"));
    writeFileSync(path.join(tmpDir, ".git", "HEAD"), "ref");
    mkdirSync(path.join(tmpDir, "src"));
    writeFileSync(path.join(tmpDir, "src", "old.ts"), "stale");
    writeFileSync(path.join(tmpDir, "stale.txt"), "stale");

    await scaffoldProject(engineOptions({ force: true }), fakeVersions);

    expect(existsSync(path.join(tmpDir, ".git", "HEAD"))).toBe(true);
    expect(existsSync(path.join(tmpDir, "stale.txt"))).toBe(false);
    expect(existsSync(path.join(tmpDir, "src", "old.ts"))).toBe(false);
    expect(existsSync(path.join(tmpDir, "src", "index.ts"))).toBe(true);
  });

  it("keeps existing files when not forced", async () => {
    writeFileSync(path.join(tmpDir, "notes.txt"), "keep");

    await scaffoldProject(engineOptions(), fakeVersions);

    expect(existsSync(path.join(tmpDir, "notes.txt"))).toBe(true);
  });
});

describe("directory helpers", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "create-sinwan-dirs-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("treats a directory holding only .git as empty", async () => {
    mkdirSync(path.join(tmpDir, ".git"));
    expect(await isEmptyDir(tmpDir)).toBe(true);

    writeFileSync(path.join(tmpDir, "file.txt"), "x");
    expect(await isEmptyDir(tmpDir)).toBe(false);
  });

  it("ignores a missing directory when emptying", async () => {
    const missing = path.join(tmpDir, "missing");

    await emptyDir(missing);

    expect(existsSync(missing)).toBe(false);
    expect(readdirSync(tmpDir)).toEqual([]);
  });
});
