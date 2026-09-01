import type { PackageManager, PackageManagerInfo } from "./types.ts";
import { runCommand } from "./utils.ts";

const MANAGER_INFO: Record<PackageManager, PackageManagerInfo> = {
  bun: {
    name: "bun",
    installCommand: "bun",
    installArgs: ["install"],
    detectCommand: "bun",
  },
  pnpm: {
    name: "pnpm",
    installCommand: "pnpm",
    installArgs: ["install"],
    detectCommand: "pnpm",
  },
  npm: {
    name: "npm",
    installCommand: "npm",
    installArgs: ["install"],
    detectCommand: "npm",
  },
  yarn: {
    name: "yarn",
    installCommand: "yarn",
    installArgs: ["install"],
    detectCommand: "yarn",
  },
};

export function getPackageManagerInfo(
  manager: PackageManager,
): PackageManagerInfo {
  return MANAGER_INFO[manager];
}

export async function isPackageManagerAvailable(
  manager: PackageManager,
): Promise<boolean> {
  const info = MANAGER_INFO[manager];
  const result = await runCommand(info.detectCommand, ["--version"]);
  return result.success;
}

export async function installDependencies(
  cwd: string,
  manager: PackageManager,
): Promise<{ success: boolean; command: string; error?: string }> {
  const info = MANAGER_INFO[manager];
  const command = `${info.installCommand} ${info.installArgs.join(" ")}`;

  if (!(await isPackageManagerAvailable(manager))) {
    return {
      success: false,
      command,
      error: `${manager} is not installed or not on PATH`,
    };
  }

  try {
    const result = await runCommand(info.installCommand, info.installArgs, {
      cwd,
    });
    if (result.success) return { success: true, command };
    return { success: false, command, error: result.error };
  } catch (error) {
    return {
      success: false,
      command,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getInstallInstructions(
  manager: PackageManager,
  cwd: string,
): string {
  const info = MANAGER_INFO[manager];
  return `cd ${cwd}\n${info.installCommand} ${info.installArgs.join(" ")}`;
}
