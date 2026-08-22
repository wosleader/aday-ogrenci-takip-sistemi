import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function normalizeViteBase(basePath?: string): string {
  const normalizedBase = (basePath || "/").trim();

  if (!normalizedBase || normalizedBase === "/") {
    return "/";
  }

  const withLeadingSlash = normalizedBase.startsWith("/") ? normalizedBase : `/${normalizedBase}`;
  return `${withLeadingSlash.replace(/\/+$/, "")}/`;
}

function readCliBaseArg(argv: string[]): string | undefined {
  const inlineBaseArg = argv.find((arg) => arg.startsWith("--base="));

  if (inlineBaseArg) {
    return inlineBaseArg.slice("--base=".length);
  }

  const baseArgIndex = argv.indexOf("--base");
  return baseArgIndex >= 0 ? argv[baseArgIndex + 1] : undefined;
}

const appBase = normalizeViteBase(readCliBaseArg(process.argv));

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["manifest.webmanifest"],
      manifest: {
        name: "Aday Öğrenci Takip Sistemi",
        short_name: "Aday Takip",
        description: "Offline-first aday öğrenci CRM uygulaması",
        theme_color: "#0f766e",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: appBase,
        scope: appBase,
        icons: []
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    globals: true,
    maxWorkers: 8
  }
});
