// playwright.config.ts — test e2e sulla build di PRODUZIONE servita da `vite preview` (step10 di green-fe): gli header
// del contenitore (CSP del README) li applica il test, le risposte del backend sono intercettate (dati inventati).
// Browser: il Chrome installato (channel 'chrome'); senza Chrome, `npx playwright install chromium` e togliere channel.
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;

// Review v2 A-03: profilo WebKit mobile per l'eccezione iOS della CSP dichiarata nel README (sezione "Deploy: header di
// sicurezza"): all'apertura di una modale usePreventScroll di react-aria antepone uno <style> con overscroll-behavior,
// bloccato da style-src 'self'. WebKit non e' fra i browser installati: serve `npx playwright install webkit`, poi
// `E2E_WEBKIT=1 npm run test:e2e`. Senza la variabile il progetto non si registra e gli e2e girano sul solo Chrome.
// Il nome del progetto lo legge e2e/csp.spec.ts, che su questo profilo tollera solo quella violazione.
const WEBKIT_MOBILE = process.env.E2E_WEBKIT === '1' ? [{ name: 'webkit-mobile', use: { ...devices['iPhone 15'] } }] : [];

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
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }, ...WEBKIT_MOBILE],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
