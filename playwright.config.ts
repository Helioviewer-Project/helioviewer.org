import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * Test files must be prefixed with 'mobile_', 'desktop_' or 'all_'
 */
const Platforms = {
  mobile: /(mobile|(desktop.*@Mobile))/,
  desktop: /(desktop)/,
  mobileTag: /@Mobile/,
  desktopTag: /@Desktop/
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 300000,
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
        'list',
        {
            printSteps: true,
        },
    ],
    [
        'html',
    ]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      grep: Platforms.desktop,
      grepInvert: Platforms.mobileTag
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grep: Platforms.desktop,
      grepInvert: Platforms.mobileTag
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: Platforms.desktop,
      grepInvert: Platforms.mobileTag
    },

    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
      grep: Platforms.desktop,
      grepInvert: Platforms.mobileTag
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      grep: Platforms.mobile,
      grepInvert: Platforms.desktopTag
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      grep: Platforms.mobile,
      grepInvert: Platforms.desktopTag
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
