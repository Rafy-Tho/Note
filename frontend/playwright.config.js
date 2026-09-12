import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { viewport: { width: 900, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm --prefix ../backend run dev',
      url: 'http://127.0.0.1:3000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
