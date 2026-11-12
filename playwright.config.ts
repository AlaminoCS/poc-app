import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: "pnpm --filter @poc/api dev",
          url: "http://127.0.0.1:3001/api/health",
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            ALLOW_TEST_OTP: "true",
            MAIL_DRIVER: "memory",
            CORS_ORIGIN: "http://127.0.0.1:3000,http://localhost:3000",
            API_PORT: "3001",
            COOKIE_SECURE: "false",
          },
        },
        {
          command: "pnpm --filter @poc/web dev",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...process.env,
            NEXT_PUBLIC_API_URL: "",
            API_URL: "http://127.0.0.1:3001",
            NEXT_PUBLIC_APP_URL: baseURL,
            NEXT_PUBLIC_ALLOW_TEST_TURNSTILE: "true",
          },
        },
      ],
});

