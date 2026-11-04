// Smoke and accessibility tests against the built site (dist/, served like on Vercel by
// scripts/serve-dist.ts). Run `npm run build` first, then `npm run test:smoke`. Also runs in CI.
import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  // Chrome and Safari (WebKit), on desktop and phones: the two browsers most visitors use.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone', use: { ...devices['iPhone 15 Pro'] } },
  ],
  webServer: {
    command: 'npm run serve',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
});
