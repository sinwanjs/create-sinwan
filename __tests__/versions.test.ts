import { describe, expect, it, mock, beforeEach } from "bun:test";
import { fetchLatestVersions, toPlaceholders } from "../src/versions.ts";

describe("toPlaceholders", () => {
  it("maps all package versions to placeholder keys", () => {
    const versions = {
      sinwan: "^1.2.5",
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
    expect(ph.VITE_VERSION).toBe("latest");
    expect(ph.TYPESCRIPT_VERSION).toBe("latest");
  });
});

describe("fetchLatestVersions", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("fetches latest versions from npm registry", async () => {
    const versions = await fetchLatestVersions();

    expect(versions["sinwan"]).toMatch(/^\^\d+\.\d+\.\d+/);
    expect(versions["tailwindcss"]).toMatch(/^\^\d+\.\d+\.\d+/);
    expect(versions["vite"]).toMatch(/^\^\d+\.\d+\.\d+/);
    expect(versions["typescript"]).toMatch(/^\^\d+\.\d+\.\d+/);
  });

  it("returns a version for every tracked package", async () => {
    const versions = await fetchLatestVersions();

    const expectedPackages = [
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
    ];

    for (const pkg of expectedPackages) {
      expect(versions[pkg]).toBeDefined();
      expect(versions[pkg]).toMatch(/^\^/);
    }
  });

  it("throws on fetch failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 })),
    ) as unknown as typeof fetch;

    await expect(fetchLatestVersions()).rejects.toThrow(
      /Failed to fetch latest version/,
    );

    globalThis.fetch = originalFetch;
  });
});
