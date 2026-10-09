// csp.spec.ts — la build di produzione sotto la CSP del README (sezione "Deploy: header di sicurezza"): nessuna
// violazione con i grafici ECharts disegnati e i tooltip aperti, sia di un elemento sia di un asse (review v2 A-02), con
// i dialoghi di react-aria aperti (pannello dei filtri, anteprima dell'intervento) e sul dettaglio dell'intervento.
// Le risposte del backend sono intercettate con dati inventati; l'utente ha tutti i grant del finanziario.
import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'report-sample'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

const GRANT = Array.from({ length: 15 }, (_, i) => `csr.tx-${String(i + 1).padStart(4, '0')}.read`);
const euro = (valore: number) => ({ valore, motivo: null, fonte: null });
const nonAttiva = (fonte: string) => ({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte });

/** Una riga del riepilogo (TX-0011) nella forma della fixture RIEPILOGO: stanziato e impegni da fonti non attive. */
const rigaRiepilogo = (codiceIntervento: string, domandePresentate: number, dotazione: number, pagati: number) => ({
  codiceIntervento,
  domandePresentate,
  dotazioneSpesaPubblica: euro(dotazione),
  risorseQuotaFeasr: euro(dotazione * 0.4),
  importoStanziato: nonAttiva('QUADRO_SINOTTICO'),
  impegnatoCofinanziatoFeasr: nonAttiva('IMPEGNI'),
  impegnatoCofinanziatoFeasrENon: nonAttiva('IMPEGNI'),
  pagamentiNettoRettifiche: euro(pagati),
  dotazioneResiduaSuImpegni: nonAttiva('IMPEGNI'),
  dotazioneResiduaSuPagamenti: euro(dotazione - pagati),
});

const RISPOSTE: Record<string, unknown> = {
  '/auth/status': { authenticated: true, user: { username: 'utente.prova', roles: GRANT } },
  '/api/finanziario/filtri': {
    interventi: [{ chiave: 'SRA01', descrizione: 'Intervento di prova A' }, { chiave: 'SRB02', descrizione: 'Intervento di prova B' }],
    obiettiviSpecifici: [],
    obiettiviGenerali: ['OG1'],
    obiettiviPolicy: ['OP1'],
    azioniPortanti: [],
    legameAzioniDisponibile: false,
    ultimiDatiSincronizzati: [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }],
  },
  '/api/finanziario/riepilogo': {
    perimetro: 'REGIONALE',
    dotazioneAssistenzaTecnica: euro(100_000),
    righe: [rigaRiepilogo('SRA01', 12, 1_000_000, 380_000), rigaRiepilogo('SRB02', 3, 2_000_000, 450_000)],
  },
  '/api/finanziario/spesa-per-intervento': {
    perimetro: 'REGIONALE',
    righe: [
      { codiceIntervento: 'SRA01', dotazioneSpesaPubblica: euro(1_000_000), pagamentiTotali: euro(400_000), percentualeContributoAmbientale: 40 },
      { codiceIntervento: 'SRB02', dotazioneSpesaPubblica: euro(2_000_000), pagamentiTotali: euro(500_000), percentualeContributoAmbientale: 10 },
    ],
  },
  '/api/finanziario/totale-domande': { perimetro: 'REGIONALE', presentate: 1200, primaAnnualita: 400 },
  '/api/finanziario/sigc/domande': { perimetro: 'REGIONALE', presentate: 800, pagate: 500, daPagare: 300 },
  '/api/finanziario/sigc/importi': { perimetro: 'REGIONALE', richiesto: euro(900_000), ammesso: euro(800_000), pagato: euro(500_000), ancoraDaPagare: euro(300_000) },
  '/api/finanziario/domande-per-anno': {
    perimetro: 'REGIONALE',
    righe: [
      { annoRaccolta: 2024, primaAnnualita: 3000, altreAnnualita: 2000, nonClassificate: 100, totali: 5100 },
      { annoRaccolta: 2025, primaAnnualita: 2500, altreAnnualita: 2500, nonClassificate: 0, totali: 5000 },
    ],
  },
  '/api/finanziario/importi-per-anno': {
    perimetro: 'REGIONALE',
    righe: [
      { annoRaccolta: 2024, importoStanziato: nonAttiva('QUADRO_SINOTTICO'), importoAmmesso: euro(4_000_000), importoDecretato: euro(3_000_000), domandeSenzaAmmesso: 0 },
      { annoRaccolta: 2025, importoStanziato: nonAttiva('QUADRO_SINOTTICO'), importoAmmesso: euro(5_000_000), importoDecretato: euro(2_000_000), domandeSenzaAmmesso: 0 },
    ],
  },
};

/** La risposta intercettata: le righe per intervento seguono il filtro `intervento` della query, come il backend. */
function rispostaPer(url: URL): unknown {
  const risposta = RISPOSTE[url.pathname] as { righe?: { codiceIntervento?: string }[] } | undefined;
  const interventi = url.searchParams.getAll('intervento');
  if (!risposta?.righe || interventi.length === 0) return risposta;
  return { ...risposta, righe: risposta.righe.filter((r) => r.codiceIntervento === undefined || interventi.includes(r.codiceIntervento)) };
}

/** Il backend intercettato e la CSP del README sul documento; le violazioni si raccolgono nella pagina. */
async function preparaPagina(page: Page) {
  await page.addInitScript(() => {
    const finestra = window as unknown as { violazioni: string[] };
    finestra.violazioni = [];
    document.addEventListener('securitypolicyviolation', (e) => finestra.violazioni.push(`${e.violatedDirective} ${e.sourceFile}:${e.lineNumber} [${e.sample}]`));
  });
  await page.route('**/*', async (route: Route) => {
    const url = new URL(route.request().url());
    const risposta = rispostaPer(url);
    if (risposta) return route.fulfill({ json: risposta });
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return route.fulfill({ status: 404, json: { type: 'about:blank', status: 404, title: 'Not Found' } });
    if (route.request().resourceType() === 'document') {
      const r = await route.fetch();
      return route.fulfill({ response: r, headers: { ...r.headers(), 'content-security-policy': CSP } });
    }
    return route.continue();
  });
}

const violazioni = (page: Page) => page.evaluate(() => (window as unknown as { violazioni: string[] }).violazioni);

// Review v2 A-03: eccezione iOS dichiarata nel README. Su WebKit iOS, all'apertura di una modale, usePreventScroll di
// react-aria antepone in <head> uno <style> con `overscroll-behavior: contain`, bloccato da style-src 'self'. E' l'UNICA
// violazione tollerata, e solo sul profilo webkit-mobile di playwright.config.ts (attivo con E2E_WEBKIT=1).
const PROFILO_WEBKIT = 'webkit-mobile';
const ECCEZIONE_IOS = /^style-src-elem .*\[.*overscroll-behavior.*\]$/s;

/** Le violazioni dopo l'apertura di una modale: sul profilo WebKit mobile senza l'eccezione iOS dichiarata. */
async function violazioniConModale(page: Page) {
  const tutte = await violazioni(page);
  return test.info().project.name === PROFILO_WEBKIT ? tutte.filter((v) => !ECCEZIONE_IOS.test(v)) : tutte;
}

/**
 * Passa il mouse sul grafico (indice nella pagina) finche' compare il tooltip: in richText e' testo disegnato nell'SVG
 * del grafico, quindi il grafico ha piu' testi di prima e uno di essi contiene `atteso`.
 */
async function apriTooltip(page: Page, indice: number, atteso: RegExp) {
  const grafico = page.locator('.ui-grafico').nth(indice);
  await grafico.scrollIntoViewIfNeeded();
  const box = await grafico.boundingBox();
  if (!box) throw new Error('grafico non visibile');
  const testiPrima = await grafico.locator('svg text').count();
  for (let y = 0.1; y < 0.95; y += 0.08) {
    for (let x = 0.1; x < 0.95; x += 0.08) {
      await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
      const testi = await grafico.locator('svg text').allTextContents();
      if (testi.length > testiPrima && testi.some((t) => atteso.test(t))) return;
    }
  }
  throw new Error(`tooltip ${String(atteso)} non comparso`);
}

test('panoramica: grafici, tooltip di un elemento e KPI senza violazioni della CSP', async ({ page }) => {
  await preparaPagina(page);
  await page.goto('/finanziario');
  await expect(page.getByRole('heading', { level: 1, name: 'Finanziario: panoramica' })).toBeVisible();
  await expect(page.locator('.ui-grafico svg').first()).toBeVisible();
  await apriTooltip(page, 0, /della dotazione \(pagato/);
  expect(await violazioni(page)).toEqual([]);
});

test('domande: tooltip di un asse (piu serie) senza violazioni, numeri degli assi in italiano', async ({ page }) => {
  await preparaPagina(page);
  await page.goto('/finanziario/domande');
  await expect(page.getByRole('heading', { level: 1, name: 'Finanziario: domande e importi per anno' })).toBeVisible();
  const grafico = page.locator('.ui-grafico').first();
  await expect(grafico.locator('svg')).toBeVisible();
  // asse delle domande con i numeri in italiano: "6000" (it-IT non raggruppa le quattro cifre), mai "6,000"
  await expect(grafico.getByText('6000', { exact: true })).toBeVisible();
  await expect(grafico.getByText(/^\d{1,3},\d{3}$/)).toHaveCount(0);
  await apriTooltip(page, 0, /^20\d\d$|Prima annualità/);
  expect(await violazioni(page)).toEqual([]);
});

test('pannello dei filtri e anteprima: dialoghi senza violazioni (react-aria con la regola nel tema)', async ({ page }) => {
  await preparaPagina(page);
  await page.goto('/finanziario');
  await page.getByRole('button', { name: /^Filtri/ }).click();
  const filtri = page.getByRole('dialog', { name: 'Filtri' });
  await expect(filtri).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(filtri).toBeHidden();
  expect(await violazioniConModale(page)).toEqual([]);

  // review v2 N-25: anche l'anteprima laterale del riepilogo, aperta dalla riga della tabella
  await page.goto('/finanziario/riepilogo');
  await page.getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }).click();
  const anteprima = page.getByRole('dialog', { name: 'SRA01' });
  await expect(anteprima).toBeVisible();
  await expect(anteprima).toContainText('Domande presentate');
  await page.keyboard.press('Escape');
  await expect(anteprima).toBeHidden();
  expect(await violazioniConModale(page)).toEqual([]);
});

test("dettaglio dell'intervento: KPI, grafici e schede senza violazioni della CSP", async ({ page }) => {
  await preparaPagina(page);
  await page.goto('/finanziario/interventi/SRA01');
  await expect(page.getByRole('heading', { level: 1, name: 'Intervento di prova A' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Domande presentate' })).toContainText('12');
  // scheda Sintesi (gauge e cascata), poi le schede che leggono solo quando si aprono, ognuna con due grafici
  await expect(page.getByRole('tabpanel').locator('.ui-grafico svg')).toHaveCount(2);
  for (const scheda of ['Domande', 'SIGC']) {
    await page.getByRole('tab', { name: scheda }).click();
    await expect(page.getByRole('tabpanel', { name: scheda }).locator('.ui-grafico svg')).toHaveCount(2);
  }
  expect(await violazioni(page)).toEqual([]);
});
