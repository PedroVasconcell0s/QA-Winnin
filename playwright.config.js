// playwright.config.js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],

  projects: [
    // ============================
    // PROJETO UI - GE
    // ============================
    {
      name: 'ge-ui',
      testDir: 'src/steps', // aqui ficam seus testes UI
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'https://ge.globo.com',
        headless: false,
        viewport: { width: 1366, height: 768 },
        trace: 'off',
      },
    },

    // ============================
    // PROJETO API - ServeRest
    // ============================
    {
      name: 'serverest-api',
      testDir: 'tests/api', // aqui ficarão SOMENTE os testes de API
      use: {
        baseURL: process.env.SERVEREST_URL || 'https://serverest.dev',
        headless: true,
      },
    },
  ],
});