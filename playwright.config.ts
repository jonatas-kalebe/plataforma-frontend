import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: { baseURL: 'http://localhost:4000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run build && npm run serve:ssr:frontend',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe'
  }
});
