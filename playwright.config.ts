import { defineConfig } from "@playwright/test";

const existingServerURL = process.env.PLAYWRIGHT_TEST_URL;
const baseURL = existingServerURL ?? "http://127.0.0.1:3173";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL },
  webServer: existingServerURL ? undefined : {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3173",
    url: baseURL,
  },
});
