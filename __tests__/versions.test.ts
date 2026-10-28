import { describe, expect, it } from "bun:test";
import {
  fetchLatestVersions,
  packagesInTemplates,
  toPlaceholders,
  VERSION_PLACEHOLDERS,
  type FetchLike,
} from "../src/versions.ts";

const registry = (
  responses: Record<string, () => Response | Promise<Response>>,
): { fetch: FetchLike; urls: string[]; signals: AbortSignal[] } => {
  const urls: string[] = [];
  const signals: AbortSignal[] = [];
  return {
    urls,
    signals,
    fetch: async (url, init) => {
      urls.push(url);
      signals.push(init.signal);
      const pkg = url.replace("https://registry.npmjs.org/", "").replace(/\/latest$/, "");
      const respond = responses[pkg];
      if (!respond) throw new TypeError("fetch failed");
      return respond();
    },
  };
};

describe("toPlaceholders", () => {
  it("maps all package versions to placeholder keys", () => {
    const versions = {
      sinwan: "^1.2.5",
      "sinwan-router": "^1.0.0",
      "sinwan-engine": "^3.0.2",
      "bun-plugin-sinwan": "^0.1.1",
      "vite-plugin-sinwan": "^0.1.1",
      "bun-plugin-tailwind": "^0.1.2",
      tailwindcss: "^4.3.2",
      vite: "^7.1.12",
      "@tailwindcss/vite": "^4.3.2",
      "@types/bun": "^1.3.0",
      typescript: "^5.9.3",
      "@types/node": "^24.7.2",
    };

    const ph = toPlaceholders(versions, "my-app");

    expect(ph.PROJECT_NAME).toBe("my-app");
    expect(ph.SINWAN_VERSION).toBe("^1.2.5");
    expect(ph.SINWAN_ROUTER_VERSION).toBe("^1.0.0");
    expect(ph.SINWAN_ENGINE_VERSION).toBe("^3.0.2");
    expect(ph.BUN_PLUGIN_SINWAN_VERSION).toBe("^0.1.1");
    expect(ph.VITE_PLUGIN_SINWAN_VERSION).toBe("^0.1.1");
    expect(ph.BUN_PLUGIN_TAILWIND_VERSION).toBe("^0.1.2");
    expect(ph.TAILWINDCSS_VERSION).toBe("^4.3.2");
    expect(ph.VITE_VERSION).toBe("^7.1.12");
    expect(ph.TAILWINDCSS_VITE_VERSION).toBe("^4.3.2");
    expect(ph.TYPES_BUN_VERSION).toBe("^1.3.0");
    expect(ph.TYPESCRIPT_VERSION).toBe("^5.9.3");
    expect(ph.TYPES_NODE_VERSION).toBe("^24.7.2");
  });

  it("falls back to 'latest' for missing versions", () => {
    const ph = toPlaceholders({}, "test-app");

    expect(ph.PROJECT_NAME).toBe("test-app");
    expect(ph.SINWAN_VERSION).toBe("latest");
    expect(ph.SINWAN_ENGINE_VERSION).toBe("latest");
    expect(ph.TYPES_NODE_VERSION).toBe("latest");
  });
});

describe("packagesInTemplates", () => {
  it("returns only the packages whose placeholders appear", () => {
    expect(
      packagesInTemplates([
        '{"dependencies": {"sinwan-engine": "{{SINWAN_ENGINE_VERSION}}"}}',
        "# {{PROJECT_NAME}} uses {{TYPESCRIPT_VERSION}}",
      ]),
    ).toEqual(["sinwan-engine", "typescript"]);
  });

  it("returns nothing when no version placeholder is used", () => {
    expect(packagesInTemplates(["# {{PROJECT_NAME}}"])).toEqual([]);
  });
});

describe("fetchLatestVersions", () => {
  it("fetches each package's latest version with a timeout", async () => {
    const { fetch, urls, signals } = registry({
      sinwan: () => Response.json({ version: "2.0.3" }),
      "@tailwindcss/vite": () => Response.json({ version: "4.3.3" }),
    });

    const result = await fetchLatestVersions(
      ["sinwan", "@tailwindcss/vite"],
      fetch,
    );

    expect(result).toEqual({
      versions: { sinwan: "^2.0.3", "@tailwindcss/vite": "^4.3.3" },
      failed: [],
    });
    expect(urls).toEqual([
      "https://registry.npmjs.org/sinwan/latest",
      "https://registry.npmjs.org/@tailwindcss/vite/latest",
    ]);
    expect(signals.every((signal) => signal instanceof AbortSignal)).toBe(true);
  });

  it("reports failed lookups without dropping the others", async () => {
    const { fetch } = registry({
      sinwan: () => Response.json({ version: "2.0.3" }),
      vite: () => new Response("Not Found", { status: 404 }),
      typescript: () => Response.json({ error: "x" }),
      "@types/bun": () => Response.json(null),
    });

    const result = await fetchLatestVersions(
      ["sinwan", "vite", "typescript", "@types/bun", "sinwan-router"],
      fetch,
    );

    expect(result).toEqual({
      versions: { sinwan: "^2.0.3" },
      failed: ["vite", "typescript", "@types/bun", "sinwan-router"],
    });
  });

  it("rejects a non-string version", async () => {
    const { fetch } = registry({
      sinwan: () => Response.json({ version: 2 }),
    });

    expect(await fetchLatestVersions(["sinwan"], fetch)).toEqual({
      versions: {},
      failed: ["sinwan"],
    });
  });

  it.skipIf(!process.env["CREATE_SINWAN_LIVE_NPM"])(
    "resolves every tracked package from the live npm registry",
    async () => {
      const packages = Object.values(VERSION_PLACEHOLDERS);
      const { versions, failed } = await fetchLatestVersions(packages);

      expect(failed).toEqual([]);
      for (const pkg of packages) {
        expect(versions[pkg]).toMatch(/^\^\d+\.\d+\.\d+/);
      }
    },
  );
});
