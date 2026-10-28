import { describe, expect, it, mock } from "bun:test";
import packageJson from "../package.json" with { type: "json" };
import {
  CLI_VERSION,
  createProgram,
  defaultCliDeps,
  type CliDeps,
} from "../src/cli.ts";
import type { CliArgs } from "../src/prompts.ts";
import type { CreateOptions } from "../src/types.ts";

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

const baseOptions: CreateOptions = {
  projectName: "my-app",
  targetDir: "/tmp/my-app",
  template: "vite-sinwan",
  language: "ts",
  packageManager: "pnpm",
  skipInstall: false,
  skipGit: false,
  force: false,
};

function setup(
  options: Partial<CreateOptions> = {},
  overrides: Partial<CliDeps> = {},
) {
  const events: string[] = [];
  const prompted: CliArgs[] = [];
  const interrupts: (() => void)[] = [];
  const deps: CliDeps = {
    runPrompts: async (args) => {
      prompted.push(args);
      return { ...baseOptions, ...options };
    },
    scaffoldProject: async (created) => {
      events.push(`scaffold ${created.targetDir}`);
      return { unresolvedPackages: [] };
    },
    initGit: async (dir) => {
      events.push(`git ${dir}`);
    },
    isPackageManagerAvailable: async () => true,
    installDependencies: async (cwd, manager) => {
      events.push(`install ${manager} ${cwd}`);
      return { success: true, command: `${manager} install` };
    },
    printNextSteps: (dir, manager, skipInstall) => {
      events.push(`next ${dir} ${manager} ${skipInstall}`);
    },
    spinner: () => ({
      start: (msg) => events.push(`start ${msg}`),
      stop: (msg) => events.push(`stop ${msg}`),
      message: (msg) => events.push(`message ${msg}`),
    }),
    log: (message) => events.push(`log ${message}`),
    error: (message) => events.push(`error ${message}`),
    exit: (code) => {
      throw new ExitSignal(code);
    },
    onInterrupt: (handler) => {
      interrupts.push(handler);
      events.push("interrupt on");
      return () => events.push("interrupt off");
    },
    ...overrides,
  };
  const run = (...args: string[]) =>
    createProgram(deps).parseAsync(["node", "create-sinwan", ...args]);
  return { events, prompted, interrupts, run };
}

const text = (events: string[]) => events.join("\n");

describe("createProgram", () => {
  it("reports the package version", () => {
    expect(CLI_VERSION).toBe(packageJson.version);
    expect(createProgram().version()).toBe(packageJson.version);
  });

  it("passes the flags to the prompts", async () => {
    const { prompted, run } = setup();

    await run(
      "my-app",
      "-t",
      "vite-sinwan",
      "-l",
      "js",
      "-p",
      "npm",
      "--target-dir",
      "out",
      "--skip-install",
      "--skip-git",
      "--force",
    );

    expect(prompted).toEqual([
      {
        projectName: "my-app",
        targetDir: "out",
        template: "vite-sinwan",
        language: "js",
        packageManager: "npm",
        skipInstall: true,
        skipGit: true,
        force: true,
      },
    ]);
  });

  it.each([
    [["-t", "next"], "Invalid template: next"],
    [["-l", "rust"], "Invalid language: rust"],
    [["-p", "cargo"], "Invalid package manager: cargo"],
    [
      ["-t", "bun-sinwan-engine", "-p", "npm"],
      "Template bun-sinwan-engine only supports bun, not npm.",
    ],
  ])("rejects %p", async (args, message) => {
    const { events, prompted, run } = setup();

    await expect(run(...args)).rejects.toEqual(new ExitSignal(1));

    expect(events).toEqual([`error ${message}`]);
    expect(prompted).toEqual([]);
  });

  it("scaffolds, initializes git, installs and prints next steps", async () => {
    const { events, run } = setup();

    await run("my-app");

    const output = text(events);
    expect(output).toContain("scaffold /tmp/my-app");
    expect(output).toContain("git /tmp/my-app");
    expect(output).toContain("Project scaffolded.");
    expect(output).toContain("install pnpm /tmp/my-app");
    expect(output).toContain("Dependencies installed.");
    expect(events.at(-2)).toBe("next /tmp/my-app pnpm false");
  });

  it("skips git and install when asked", async () => {
    const { events, run } = setup({ skipGit: true, skipInstall: true });

    await run("my-app");

    const output = text(events);
    expect(output).not.toContain("git ");
    expect(output).not.toContain("install ");
    expect(events.at(-2)).toBe("next /tmp/my-app pnpm true");
  });

  it("prints the manual command when the manager is missing", async () => {
    const { events, run } = setup(
      {},
      { isPackageManagerAvailable: async () => false },
    );

    await run("my-app");

    const output = text(events);
    expect(output).toContain("pnpm is not available on PATH.");
    expect(output).toContain("cd /tmp/my-app && pnpm install");
    expect(output).not.toContain("install pnpm");
    expect(events.at(-2)).toBe("next /tmp/my-app pnpm true");
  });

  it("prints the manual command when the install fails", async () => {
    const { events, run } = setup(
      {},
      {
        installDependencies: async () => ({
          success: false,
          command: "pnpm install",
          error: "pnpm exited with code 1",
        }),
      },
    );

    await run("my-app");

    const output = text(events);
    expect(output).toContain("Install failed: pnpm exited with code 1");
    expect(output).toContain("pnpm install");
    expect(output).toContain("manually.");
    expect(events.at(-2)).toBe("next /tmp/my-app pnpm true");
  });

  it("warns when npm versions could not be fetched", async () => {
    const { events, run } = setup(
      { skipInstall: true },
      {
        scaffoldProject: async () => ({
          unresolvedPackages: ["sinwan", "vite"],
        }),
      },
    );

    await run("my-app");

    expect(text(events)).toContain(
      'log Could not fetch the latest version of sinwan, vite from npm; package.json uses "latest" instead.',
    );
  });

  it("stops the spinner and exits 130 on Ctrl+C", async () => {
    const { events, interrupts, run } = setup(
      {},
      {
        isPackageManagerAvailable: async () => {
          const [interrupt] = interrupts;
          interrupt?.();
          return true;
        },
      },
    );

    await expect(run("my-app")).rejects.toEqual(new ExitSignal(1));

    // Under test `exit` throws instead of ending the process, so the 130 exit
    // surfaces through the failure path.
    const output = text(events);
    expect(output).toContain("stop Cancelled.");
    expect(output).toContain("stop Failed: exit 130");
    expect(events.at(-1)).toBe("interrupt off");
  });

  it("stops listening for Ctrl+C when done", async () => {
    const { events, run } = setup();

    await run("my-app");

    expect(events[0]).toBe("interrupt on");
    expect(events.at(-1)).toBe("interrupt off");
  });

  it.each([
    [new Error("disk full"), "Failed: disk full"],
    ["no network", "Failed: no network"],
  ])("stops with exit 1 when scaffolding throws %p", async (thrown, message) => {
    const { events, run } = setup(
      {},
      {
        scaffoldProject: () => Promise.reject(thrown),
      },
    );

    await expect(run("my-app")).rejects.toEqual(new ExitSignal(1));

    expect(events).toContain(`stop ${message}`);
  });
});

describe("defaultCliDeps", () => {
  it("writes to the console and exits the process", () => {
    const log = mock((_message: string) => {});
    const error = mock((_message: string) => {});
    const originalLog = console.log;
    const originalError = console.error;
    const originalExit = process.exit;
    console.log = log;
    console.error = error;
    process.exit = (code) => {
      throw new ExitSignal(Number(code));
    };
    try {
      defaultCliDeps.log("hello");
      defaultCliDeps.error("oops");
      expect(() => defaultCliDeps.exit(3)).toThrow(new ExitSignal(3));
      const spinner = defaultCliDeps.spinner();
      expect(typeof spinner.start).toBe("function");

      const handler = () => {};
      const remove = defaultCliDeps.onInterrupt(handler);
      expect(process.listeners("SIGINT")).toContain(handler);
      remove();
      expect(process.listeners("SIGINT")).not.toContain(handler);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      process.exit = originalExit;
    }

    expect(log).toHaveBeenCalledWith("hello");
    expect(error).toHaveBeenCalledWith("oops");
  });
});
