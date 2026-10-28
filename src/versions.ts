const NPM_REGISTRY = "https://registry.npmjs.org";
const FETCH_TIMEOUT_MS = 10_000;

/** Template placeholder → npm package whose latest version fills it. */
export const VERSION_PLACEHOLDERS = {
  SINWAN_VERSION: "sinwan",
  SINWAN_ROUTER_VERSION: "sinwan-router",
  SINWAN_ENGINE_VERSION: "sinwan-engine",
  BUN_PLUGIN_SINWAN_VERSION: "bun-plugin-sinwan",
  VITE_PLUGIN_SINWAN_VERSION: "vite-plugin-sinwan",
  BUN_PLUGIN_TAILWIND_VERSION: "bun-plugin-tailwind",
  TAILWINDCSS_VERSION: "tailwindcss",
  VITE_VERSION: "vite",
  TAILWINDCSS_VITE_VERSION: "@tailwindcss/vite",
  TYPES_BUN_VERSION: "@types/bun",
  TYPESCRIPT_VERSION: "typescript",
  TYPES_NODE_VERSION: "@types/node",
} as const;

export type VersionMap = Record<string, string>;

export type FetchLike = (
  url: string,
  init: { signal: AbortSignal },
) => Promise<Response>;

export interface VersionLookup {
  versions: VersionMap;
  /** Packages whose latest version could not be fetched. */
  failed: string[];
}

/** Packages referenced by version placeholders in the given template text. */
export function packagesInTemplates(contents: readonly string[]): string[] {
  return Object.entries(VERSION_PLACEHOLDERS)
    .filter(([placeholder]) =>
      contents.some((content) => content.includes(`{{${placeholder}}}`)),
    )
    .map(([, pkg]) => pkg);
}

async function fetchLatestVersion(
  pkg: string,
  fetchImpl: FetchLike,
): Promise<string> {
  const res = await fetchImpl(`${NPM_REGISTRY}/${pkg}/latest`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data: unknown = await res.json();
  if (
    typeof data === "object" &&
    data !== null &&
    "version" in data &&
    typeof data.version === "string"
  ) {
    return `^${data.version}`;
  }
  throw new Error("response has no version");
}

/**
 * Fetches the latest version of each package. A failed lookup never aborts
 * the others; it is reported in `failed` so the caller can fall back.
 */
export async function fetchLatestVersions(
  packages: readonly string[],
  fetchImpl: FetchLike = fetch,
): Promise<VersionLookup> {
  const results = await Promise.all(
    packages.map(async (pkg) => {
      try {
        return { pkg, version: await fetchLatestVersion(pkg, fetchImpl) };
      } catch {
        return { pkg, version: undefined };
      }
    }),
  );

  const versions: VersionMap = {};
  const failed: string[] = [];
  for (const { pkg, version } of results) {
    if (version === undefined) failed.push(pkg);
    else versions[pkg] = version;
  }
  return { versions, failed };
}

export function toPlaceholders(
  versions: VersionMap,
  projectName: string,
): Record<string, string> {
  const placeholders: Record<string, string> = { PROJECT_NAME: projectName };
  for (const [placeholder, pkg] of Object.entries(VERSION_PLACEHOLDERS)) {
    placeholders[placeholder] = versions[pkg] ?? "latest";
  }
  return placeholders;
}
