import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

// Chromium is kept inside the project so no global install is needed.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(__dirname, "node_modules", ".playwright-browsers");

const API_PORT = process.env.E2E_API_PORT ?? "8010";
const WEB_PORT = process.env.E2E_WEB_PORT ?? "3100";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // Tests share one database, so they run one after another.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: "**/purchase.spec.ts" },
  ],
  webServer: [
    {
      command: "./e2e/start-backend.sh",
      url: `http://127.0.0.1:${API_PORT}/up`,
      timeout: 180_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `npx next dev --webpack -p ${WEB_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${WEB_PORT}/api/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        API_ORIGIN: `http://127.0.0.1:${API_PORT}`,
        INTERNAL_API_URL: `http://127.0.0.1:${API_PORT}/api/v1`,
        NEXT_PUBLIC_API_URL: "",
      },
    },
  ],
});
