// playwright.config.ts — test e2e sulla build di PRODUZIONE servita da `vite preview` (step10 di green-fe): gli header
// del contenitore (CSP del README) li applica il test, le risposte del backend sono intercettate (dati inventati).
// Browser: il Chrome installato (channel 'chrome'); senza Chrome, `npx playwright install chromium` e togliere channel.
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
