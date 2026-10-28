import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
import {
  getInstallInstructions,
  installDependencies,
  isPackageManagerAvailable,
} from "../src/install.ts";
import { initGit } from "../src/scaffold.ts";
import * as utils from "../src/utils.ts";
import {
  canWriteDir,
  formatTargetDir,
  isEmptyDir,
  isValidPackageManager,
  isValidTemplate,
  runCommand,
} from "../src/utils.ts";

const INVALID_CWD = "bad\0dir";

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "create-sinwan-runtime-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function withFailingCommands<T>(run: () => Promise<T>): Promise<T> {
  const spy = spyOn(utils, "runCommand").mockResolvedValue({
    success: false,
    error: "not found",
  });
  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
}

describe("index", () => {
  it("runs the program with process.argv", async () => {
    const originalArgv = process.argv;
    const originalExit = process.exit;
    const originalWrite = process.stdout.write;
    const written: string[] = [];
    process.argv = ["node", "create-sinwan", "--version"];
    process.exit = (code) => {
      throw new ExitSignal(Number(code));
    };
    process.stdout.write = (chunk: string | Uint8Array) => {
      written.push(String(chunk));
      return true;
    };
    try {
      await expect(import("../src/index.ts")).rejects.toEqual(
        new ExitSignal(0),
      );
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      process.stdout.write = originalWrite;
    }

    expect(written.join("")).toBe(`${packageJson.version}\n`);
  });
});

describe("runCommand", () => {
  it("reports a nonzero exit code", async () => {
    expect(await runCommand("git", ["not-a-git-command"])).toEqual({
      success: false,
      error: "git exited with code 1",
    });
  });

  it("reports a missing command", async () => {
    const result = await runCommand("create-sinwan-missing-command", []);

    expect(result.success).toBe(false);
    expect(result.error).toContain("create-sinwan-missing-command");
  });
});

describe("installDependencies", () => {
  it("installs with an available manager", async () => {
    writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "empty", private: true }),
    );

    expect(await installDependencies(tmpDir, "bun")).toEqual({
      success: true,
      command: "bun install",
    });
  });

  it("returns the error when the install fails", async () => {
    writeFileSync(path.join(tmpDir, "package.json"), "{ not json");

    const result = await installDependencies(tmpDir, "bun");

    expect(result.success).toBe(false);
    expect(result.command).toBe("bun install");
    expect(result.error).toBe("bun exited with code 1");
  });

  it("returns the error when the install cannot start", async () => {
    const result = await installDependencies(INVALID_CWD, "bun");

    expect(result.success).toBe(false);
    expect(result.command).toBe("bun install");
    expect(result.error).toBeString();
  });

  it("returns the error when the manager is unavailable", async () => {
    const result = await withFailingCommands(() =>
      installDependencies(tmpDir, "yarn"),
    );

    expect(result).toEqual({
      success: false,
      command: "yarn install",
      error: "yarn is not installed or not on PATH",
    });
  });

  it("detects a missing manager", async () => {
    expect(
      await withFailingCommands(() => isPackageManagerAvailable("pnpm")),
    ).toBe(false);
  });

  it("formats manual install instructions", () => {
    expect(getInstallInstructions("npm", "my-app")).toBe(
      "cd my-app\nnpm install",
    );
  });
});

describe("initGit", () => {
  it("initializes a repository and stages files", async () => {
    writeFileSync(path.join(tmpDir, "file.txt"), "x");

    await initGit(tmpDir);

    expect(existsSync(path.join(tmpDir, ".git"))).toBe(true);
    const status = Bun.spawnSync(["git", "status", "--porcelain"], {
      cwd: tmpDir,
    });
    expect(status.stdout.toString()).toBe("A  file.txt\n");
  });

  it("stops when git init fails", async () => {
    await withFailingCommands(() => initGit(tmpDir));

    expect(existsSync(path.join(tmpDir, ".git"))).toBe(false);
  });

  it("ignores errors thrown while starting git", async () => {
    await expect(initGit(INVALID_CWD)).resolves.toBeUndefined();
  });
});

describe("utils", () => {
  it("validates templates and package managers", () => {
    expect(isValidTemplate("bun-sinwan")).toBe(true);
    expect(isValidTemplate("next")).toBe(false);
    expect(isValidPackageManager("yarn")).toBe(true);
    expect(isValidPackageManager("cargo")).toBe(false);
  });

  it("checks directories", async () => {
    const file = path.join(tmpDir, "file.txt");
    const missing = path.join(tmpDir, "missing");

    expect(await isEmptyDir(tmpDir)).toBe(true);
    expect(await isEmptyDir(missing)).toBe(true);
    writeFileSync(file, "x");
    expect(await isEmptyDir(tmpDir)).toBe(false);

    expect(await canWriteDir(tmpDir)).toBe(true);
    expect(await canWriteDir(file)).toBe(false);
    expect(await canWriteDir(missing)).toBe(true);
  });

  it("formats the target directory", () => {
    expect(formatTargetDir("My Sinwan App")).toBe("my-sinwan-app");
  });
});
