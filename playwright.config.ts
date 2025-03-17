import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for testing the 747 E-Wallet Application
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 30000,
  /* Expect a test to pass within this time */
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: false, // We don't want to run tests in parallel to avoid conflicts
  /* Reporter to use */
  reporter: 'html',
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'on-first-retry',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000, // 2 minutes
  },
});