import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

type TextOptions = {
  message: string;
  placeholder?: string;
  initialValue?: string;
  validate?: (value: string) => string | undefined;
};
type ConfirmOptions = { message: string; initialValue: boolean };
type SelectOptions = {
  message: string;
  initialValue: string;
  options: { value: string; label: string; hint?: string }[];
};

const CANCEL = Symbol("cancel");
const answers: { text: (string | symbol)[]; confirm: (boolean | symbol)[]; select: (string | symbol)[] } = {
  text: [],
  confirm: [],
  select: [],
};

const text = mock((_options: TextOptions) =>
  Promise.resolve(answers.text.shift() ?? ""),
);
const confirm = mock((_options: ConfirmOptions) =>
  Promise.resolve(answers.confirm.shift() ?? false),
);
const select = mock((_options: SelectOptions) =>
  Promise.resolve(answers.select.shift() ?? ""),
);
const cancel = mock((_message?: string) => {});
const warn = mock((_message: string) => {});

mock.module("@clack/prompts", () => ({
  intro: () => {},
  outro: () => {},
  cancel,
  log: { warn },
  isCancel: (value: unknown): value is symbol => typeof value === "symbol",
  text,
  confirm,
  select,
  spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
}));

const { runPrompts, printNextSteps } = await import("../src/prompts.ts");
type Args = Parameters<typeof runPrompts>[0];
const ask = (args: Args) => runPrompts(args, true);
const askWithoutTerminal = (args: Args) => runPrompts(args, false);

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

describe("runPrompts", () => {
  let tmpDir: string;
  const originalExit = process.exit;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "create-sinwan-prompts-"));
    answers.text = [];
    answers.confirm = [];
    answers.select = [];
    for (const fn of [text, confirm, select, cancel, warn]) fn.mockClear();
    process.exit = (code) => {
      throw new ExitSignal(Number(code));
    };
  });

  afterEach(() => {
    process.exit = originalExit;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("uses the flags without prompting", async () => {
    const options = await ask({
      projectName: "My App",
      targetDir: tmpDir,
      template: "vite-sinwan",
      language: "js",
      packageManager: "npm",
      skipInstall: true,
      skipGit: true,
      force: true,
    });

    expect(options).toEqual({
      projectName: "my-app",
      targetDir: tmpDir,
      template: "vite-sinwan",
      language: "js",
      packageManager: "npm",
      skipInstall: true,
      skipGit: true,
      force: true,
    });
    expect(text).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("asks for every missing value", async () => {
    const target = path.join(tmpDir, "picked");
    answers.text = ["my-app", target];
    answers.select = ["sinwan", "vite-sinwan", "js", "yarn"];

    const options = await ask({});

    expect(options).toMatchObject({
      projectName: "my-app",
      targetDir: target,
      template: "vite-sinwan",
      language: "js",
      packageManager: "yarn",
      skipInstall: false,
      skipGit: false,
      force: false,
    });
    const [nameOptions] = text.mock.calls[0]!;
    expect(nameOptions.validate?.("")).toBe("Project name is required");
    expect(nameOptions.validate?.("Bad Name")).toBe("Invalid package name");
    expect(nameOptions.validate?.("good-name")).toBeUndefined();
    const [dirOptions] = text.mock.calls[1]!;
    expect(dirOptions.initialValue).toBe("my-app");
    const [frameworkOptions] = select.mock.calls[0]!;
    expect(frameworkOptions.message).toBe("Select a framework:");
    expect(frameworkOptions.options.map((option) => option.value)).toEqual([
      "sinwan",
      "sinwan-engine",
    ]);
    const [templateOptions] = select.mock.calls[1]!;
    expect(templateOptions.options.map((option) => option.value)).toEqual([
      "bun-sinwan",
      "vite-sinwan",
    ]);
    const [managerOptions] = select.mock.calls[3]!;
    expect(managerOptions.options.map((option) => option.hint)).toEqual([
      "recommended",
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("uses the name's directory without asking and skips the manager prompt for bun-sinwan", async () => {
    const cwd = process.cwd();
    process.chdir(tmpDir);
    try {
      answers.select = ["sinwan", "bun-sinwan", "ts"];

      const options = await ask({ projectName: "My App" });

      expect(options.targetDir).toBe(path.join(realpathSync(tmpDir), "my-app"));
      expect(options.projectName).toBe("my-app");
      expect(options.packageManager).toBe("bun");
      expect(text).not.toHaveBeenCalled();
      expect(select).toHaveBeenCalledTimes(3);
    } finally {
      process.chdir(cwd);
    }
  });

  it("skips the template and manager prompts for sinwan-engine", async () => {
    answers.select = ["sinwan-engine", "js"];

    const options = await ask({
      projectName: "api",
      targetDir: tmpDir,
    });

    expect(options.template).toBe("bun-sinwan-engine");
    expect(options.language).toBe("js");
    expect(options.packageManager).toBe("bun");
    expect(select.mock.calls.map(([call]) => call.message)).toEqual([
      "Select a framework:",
      "Select a language:",
    ]);
  });

  it("does not ask for the framework when the template flag is set", async () => {
    const options = await ask({
      projectName: "api",
      targetDir: tmpDir,
      template: "bun-sinwan-engine",
      language: "ts",
    });

    expect(options.template).toBe("bun-sinwan-engine");
    expect(options.packageManager).toBe("bun");
    expect(select).not.toHaveBeenCalled();
  });

  it("re-prompts invalid template and language flags", async () => {
    answers.select = ["sinwan", "bun-sinwan", "ts"];

    const options = await ask({
      projectName: "app",
      targetDir: tmpDir,
      template: "next",
      language: "rust",
    });

    expect(options.template).toBe("bun-sinwan");
    expect(options.language).toBe("ts");
  });

  it("keeps bun when bun-sinwan gets another manager", async () => {
    const options = await ask({
      projectName: "app",
      targetDir: tmpDir,
      template: "bun-sinwan",
      language: "ts",
      packageManager: "npm",
    });

    expect(options.packageManager).toBe("bun");
    expect(warn).toHaveBeenCalledWith(
      "bun-sinwan only supports bun; using bun instead of npm.",
    );
  });

  it("uses the directory name for '.'", async () => {
    const dir = path.join(tmpDir, "Cool App");
    const cwd = process.cwd();
    mkdirSync(dir);
    process.chdir(dir);
    try {
      const options = await ask({
        projectName: ".",
        template: "bun-sinwan-engine",
        language: "ts",
      });

      expect(options.projectName).toBe("cool-app");
      expect(options.targetDir).toBe(realpathSync(dir));
    } finally {
      process.chdir(cwd);
    }
  });

  it("keeps the scope of a scoped project name", async () => {
    const options = await ask({
      projectName: "@acme/web",
      targetDir: tmpDir,
      template: "bun-sinwan-engine",
      language: "js",
    });

    expect(options.projectName).toBe("@acme/web");
  });

  it("exits on a name that cannot become a package name", async () => {
    await expect(
      ask({ projectName: "!!!", targetDir: tmpDir }),
    ).rejects.toEqual(new ExitSignal(1));
    expect(cancel).toHaveBeenCalledWith("Invalid project name: !!!");
  });

  it("overwrites a non-empty directory after confirmation", async () => {
    writeFileSync(path.join(tmpDir, "file.txt"), "x");
    answers.confirm = [true];

    const options = await ask({
      projectName: "app",
      targetDir: tmpDir,
      template: "vite-sinwan",
      language: "ts",
      packageManager: "bun",
    });

    expect(options.targetDir).toBe(tmpDir);
    expect(options.force).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("exits when overwriting is declined", async () => {
    writeFileSync(path.join(tmpDir, "file.txt"), "x");
    answers.confirm = [false];

    await expect(
      ask({ projectName: "app", targetDir: tmpDir }),
    ).rejects.toEqual(new ExitSignal(1));
    expect(cancel).toHaveBeenCalledWith("Operation cancelled.");
  });

  it("exits when a prompt is cancelled", async () => {
    answers.text = [CANCEL];

    await expect(ask({})).rejects.toEqual(new ExitSignal(1));
    expect(cancel).toHaveBeenCalledWith("Operation cancelled.");
  });

  describe("without a terminal", () => {
    it("uses defaults for language and package manager", async () => {
      const options = await askWithoutTerminal({
        projectName: "site",
        targetDir: tmpDir,
        template: "vite-sinwan",
      });

      expect(options).toMatchObject({
        template: "vite-sinwan",
        language: "ts",
        packageManager: "bun",
      });
      expect(text).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
    });

    it("requires a project name", async () => {
      await expect(askWithoutTerminal({})).rejects.toEqual(new ExitSignal(1));
      expect(cancel).toHaveBeenCalledWith(
        "Pass a project name: there is no terminal to ask in.",
      );
      expect(text).not.toHaveBeenCalled();
    });

    it("requires a template", async () => {
      await expect(
        askWithoutTerminal({ projectName: "app", targetDir: tmpDir }),
      ).rejects.toEqual(new ExitSignal(1));
      expect(cancel).toHaveBeenCalledWith(
        "Pass --template (bun-sinwan, vite-sinwan, bun-sinwan-engine): there is no terminal to ask in.",
      );
      expect(select).not.toHaveBeenCalled();
    });

    it("refuses a non-empty directory without --force", async () => {
      writeFileSync(path.join(tmpDir, "file.txt"), "x");

      await expect(
        askWithoutTerminal({
          projectName: "app",
          targetDir: tmpDir,
          template: "bun-sinwan",
        }),
      ).rejects.toEqual(new ExitSignal(1));
      expect(cancel.mock.calls[0]?.[0]).toContain("Pass --force");
      expect(confirm).not.toHaveBeenCalled();
    });
  });
});

describe("printNextSteps", () => {
  const originalLog = console.log;
  let lines: string[];

  beforeEach(() => {
    lines = [];
    console.log = (message: string) => {
      lines.push(message);
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it("shows a relative directory and the install step", () => {
    printNextSteps(path.join(process.cwd(), "my-app"), "pnpm", true);

    const output = lines.join("\n");
    expect(output).toContain("my-app");
    expect(output).toContain("pnpm install");
    expect(output).toContain("pnpm run dev");
  });

  it("uses . for the current directory and skips install", () => {
    printNextSteps(process.cwd(), "bun", false);

    const output = lines.join("\n");
    expect(output).toContain("cd ");
    expect(output).not.toContain("bun install");
    expect(lines.some((line) => /cd .*\.\S*$/.test(line))).toBe(true);
  });

  it("quotes a directory with spaces", () => {
    printNextSteps(path.join(process.cwd(), "My App"), "bun", false);

    expect(lines.join("\n")).toContain('"My App"');
  });

  it("uses the absolute path outside the current directory", () => {
    const outside = path.resolve(process.cwd(), "..", "elsewhere");

    printNextSteps(outside, "npm", false);

    expect(lines.join("\n")).toContain(outside);
  });
});
