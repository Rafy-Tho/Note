import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: [
    {
      command: 'npm run dev --workspace frontend -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev --workspace backend',
      url: 'http://127.0.0.1:3000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
