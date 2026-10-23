// Pagina /procedurale/sottofasi (green-fe step7): describe taggati coi REQ della route (RF024, RF025, RF031, RF032), dati
// dagli scenari del backend (fixture del procedurale) con letture che rispondono ai parametri della query, MSW seminato
// con onUnhandledRequest 'error' (ogni lettura e' dichiarata qui), axe-core diretto. ECharts e' il grafico finto del setup.
import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { trovaCard } from '../../../shared/testing/card-grafico';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { sottofasiPagamentoPer, sottofasiSostegnoPer } from '../../../features/procedurale/testing/fixture';
import { lettureProcedurale } from '../../../features/procedurale/testing/letture';
import type { Basi } from '../../../features/procedurale/testing/letture';
import Pagina from './page';

const PERCORSO = '/procedurale/sottofasi';
const TITOLO = 'Procedurale: sottofasi di ammissibilità';
const SOSTEGNO = 'Domande di sostegno per sottofase di ammissibilità';
const PAGAMENTO = 'Domande di pagamento per sottofase di ammissibilità';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p3-funzionario-area-pro', roles } })));

function servi(basi?: Basi) {
  const { handlers, lette } = lettureProcedurale(basi);
  server.use(...handlers);
  return lette;
}

const apri = (indirizzo = PERCORSO) => renderPagina(Pagina, PERCORSO, indirizzo);
const h1 = () => screen.getByRole('heading', { level: 1, name: TITOLO });
const voci = (card: HTMLElement, titolo: string) => within(card).getByRole('table', { name: new RegExp(`^${titolo}: `) });

describe('RF031: sottofasi di ammissibilita della domanda di sostegno (TX-0031)', () => {
  it('senza la fonte delle sottofasi della domanda: il grafico non disponibile detto in testo, la tabella delle sei voci; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri(`${PERCORSO}?intervento=SRD01`);
    const card = await trovaCard(SOSTEGNO);
    expect(testo(card.textContent)).toContain('Grafico non disponibile: nessuna domanda di sostegno è legata a una sottofase (fonte sottofasi della domanda non attiva).');
    const t = voci(card, SOSTEGNO);
    expect(within(t).getAllByRole('row').slice(1).map((r) => r.firstElementChild?.textContent)).toEqual([
      "Congruenza e conformita' documenti allegati",
      "Criteri di ammissibilita'",
      "Ammissibilita' voci di spesa",
      'Criteri di selezione',
      'Indicatori di risultato',
      'Valutazioni personalizzazioni regionali',
    ]);
    expect(lette.sottofasiSostegno).toEqual(['?intervento=SRD01']);
    expect(screen.getByText(/^La voce conta le domande distinte di tutte le sottofasi che la abbinano/)).toBeTruthy();
    expect(document.activeElement).toBe(h1());
    expect(document.title).toBe('Sottofasi di ammissibilità - Procedurale - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(container);
  });

  it('anagrafica vuota: lo stato lo dice, senza errori; le voci restano non censite', async () => {
    servi();
    const vuota = sottofasiSostegnoPer();
    server.use(http.get('*/api/procedurale/sottofasi-sostegno', () => HttpResponse.json({ ...vuota, voci: vuota.voci?.map((v) => ({ ...v, censita: null })) })));
    apri();
    expect(await screen.findByText(/^Anagrafica delle sottofasi vuota: tutte le voci risultano non censite \(nessun errore\)/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('RF032: sottofasi di ammissibilita della domanda di pagamento (TX-0032)', () => {
  it('la voce censita con la sottofase dell anagrafica, l esito e le domande; le altre sottofasi; la pagina non somma', async () => {
    servi();
    apri();
    const card = await trovaCard(PAGAMENTO);
    expect(within(card).getAllByRole('button', { name: /^Scarica / }).map((b) => b.getAttribute('aria-label'))).toEqual([
      `Scarica il grafico ${PAGAMENTO} in PNG`,
      'Scarica i dati delle sottofasi delle domande di pagamento in CSV',
      'Scarica i dati delle sottofasi delle domande di pagamento in XLSX',
    ]);
    await userEvent.click(within(card).getByRole('button', { name: 'Tabella' }));
    expect(testo(within(voci(card, PAGAMENTO)).getByRole('row', { name: /^Antimafia/ }).textContent)).toBe('AntimafiaANTIMAFIA - Verifica antimafiaOK32');
    const altre = within(card).getByRole('table', { name: /^Altre sottofasi dell'anagrafica/ });
    expect(testo(within(altre).getByRole('row', { name: /^GAR / }).textContent)).toBe('GARGaranzie e pagamentinon valorizzatoil dato non è presente nella fonte1');
  });

  it('nessuna domanda nei filtri con la fonte attiva: le voci restano con 0 e Modifica i filtri; cambiati il focus va sul titolo', async () => {
    servi();
    const { router } = apri(`${PERCORSO}?intervento=SRA01`);
    const stato = (await screen.findByText('Nessuna domanda nelle sottofasi per i filtri scelti: le voci restano con 0.')).closest('[role="status"]') as HTMLElement;
    await userEvent.click(within(stato).getByRole('button', { name: 'Modifica i filtri' }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri dei report procedurali' });
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await waitFor(() => expect(document.activeElement).toBe(h1()));
  });

  it('col solo grant di TX-0032 la sola card di pagamento, nessuna lettura di TX-0031', async () => {
    profilo(['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0032.read']);
    const lette = servi();
    apri();
    await trovaCard(PAGAMENTO);
    expect(screen.queryByRole('region', { name: SOSTEGNO })).toBeNull();
    expect(lette.sottofasiSostegno).toEqual([]);
  });
});

describe('RF024: filtri della pagina delle sottofasi (TX-0024)', () => {
  it('TX-0024 in errore: lo stato dei valori con Riprova; le sottofasi si leggono coi criteri dell indirizzo', async () => {
    const lette = servi({ valori: null });
    apri(`${PERCORSO}?os=OS4`);
    expect(await screen.findByText(/^Valori dei filtri non disponibili: /)).toBeTruthy();
    await trovaCard(PAGAMENTO);
    expect(lette.sottofasiPagamento).toEqual(['?os=OS4']);
  });
});

describe('RF025: filtro per stato area programmazione nella pagina delle sottofasi (TX-0025)', () => {
  it('lo stato restringe le domande contate (D-06 Rev. 6), l elenco delle sottofasi resta intero', async () => {
    const lette = servi();
    apri(`${PERCORSO}?stato=REVOCATA`);
    const card = await trovaCard(PAGAMENTO);
    await userEvent.click(within(card).getByRole('button', { name: 'Tabella' }));
    expect(testo(within(voci(card, PAGAMENTO)).getByRole('row', { name: /^Antimafia/ }).textContent)).toBe('AntimafiaANTIMAFIA - Verifica antimafiaOK11');
    expect(within(voci(card, PAGAMENTO)).getAllByRole('row')).toHaveLength(8);
    expect(lette.sottofasiPagamento).toEqual(['?stato=REVOCATA']);
  });
});

describe('RF031: stati della pagina delle sottofasi (caricamento, errore)', () => {
  it('caricamento: lo scheletro della card con aria-live, poi i dati', async () => {
    const t = trattenuta();
    servi();
    server.use(
      http.get('*/api/procedurale/sottofasi-pagamento', async ({ request }) => {
        await t.attesa;
        return HttpResponse.json(sottofasiPagamentoPer(new URL(request.url).searchParams));
      }),
    );
    apri();
    await trovaCard(SOSTEGNO);
    expect(screen.getByText('Caricamento in corso…').closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    await act(async () => t.libera());
    await trovaCard(PAGAMENTO);
  });

  it('errore di una lettura dal problem-type: un solo avviso della pagina con Riprova, l altra card resta', async () => {
    let tentativi = 0;
    servi();
    server.use(
      http.get('*/api/procedurale/sottofasi-sostegno', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(sottofasiSostegnoPer());
      }),
    );
    apri();
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    await trovaCard(PAGAMENTO);
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    await trovaCard(SOSTEGNO);
  });
});
