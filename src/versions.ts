const NPM_REGISTRY = "https://registry.npmjs.org";

const PACKAGES = [
  "sinwan",
  "bun-plugin-sinwan",
  "vite-plugin-sinwan",
  "bun-plugin-tailwind",
  "tailwindcss",
  "vite",
  "@tailwindcss/vite",
  "@types/bun",
  "typescript",
  "@types/node",
] as const;

export type PackageName = (typeof PACKAGES)[number];

export type VersionMap = Record<string, string>;

async function fetchLatestVersion(pkg: string): Promise<string> {
  try {
    const res = await fetch(`${NPM_REGISTRY}/${pkg}/latest`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as { version: string };
    return `^${data.version}`;
  } catch (error) {
    throw new Error(
      `Failed to fetch latest version for "${pkg}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function fetchLatestVersions(): Promise<VersionMap> {
  const entries = await Promise.all(
    PACKAGES.map(async (pkg) => [pkg, await fetchLatestVersion(pkg)] as const),
  );

  return Object.fromEntries(entries);
}

export function toPlaceholders(
  versions: VersionMap,
  projectName: string,
): Record<string, string> {
  return {
    PROJECT_NAME: projectName,
    SINWAN_VERSION: versions["sinwan"] ?? "latest",
    BUN_PLUGIN_SINWAN_VERSION: versions["bun-plugin-sinwan"] ?? "latest",
    VITE_PLUGIN_SINWAN_VERSION: versions["vite-plugin-sinwan"] ?? "latest",
    BUN_PLUGIN_TAILWIND_VERSION: versions["bun-plugin-tailwind"] ?? "latest",
    TAILWINDCSS_VERSION: versions["tailwindcss"] ?? "latest",
    VITE_VERSION: versions["vite"] ?? "latest",
    TAILWINDCSS_VITE_VERSION: versions["@tailwindcss/vite"] ?? "latest",
    TYPES_BUN_VERSION: versions["@types/bun"] ?? "latest",
    TYPESCRIPT_VERSION: versions["typescript"] ?? "latest",
    TYPES_NODE_VERSION: versions["@types/node"] ?? "latest",
  };
}
