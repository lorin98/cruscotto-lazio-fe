// Test dei componenti del fisico (green-fe step5): un test L2 per componente (render su MSW, ruoli e stati accessibili) e
// un test a11y con axe-core diretto. ECharts e' il grafico finto di src/shared/test/setup.ts (jsdom non disegna). Le
// letture sono dichiarate da ogni test (il server dei test non monta i mock generati del fisico e dell'elenco).
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { graficoDi, trovaCard } from '../src/shared/testing/card-grafico';
import { clicSulDato } from '../src/shared/testing/grafico-finto';
import { problema } from '../src/shared/testing/msw';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { renderConQuery } from '../src/shared/testing/render';
import { DetermineDellaDomanda, SuperficiAmmissibili } from '../src/features/fisico';
import { DETERMINE, SUPERFICI, VALORI, superficiPer } from '../src/features/fisico/testing/fixture';
import type { SuperficieAmmissibile } from '../src/features/fisico/api';

const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

/** TX-0018 risponde come il backend ai criteri della query (review V2); TX-0060 coi valori, oppure in errore (null). */
function serviSuperfici(corpo: SuperficieAmmissibile = SUPERFICI, valori: object | null = VALORI) {
  const lette: string[] = [];
  server.use(
    http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
      const u = new URL(request.url);
      lette.push(u.search);
      return HttpResponse.json(superficiPer(corpo, u.searchParams));
    }),
    http.get('*/api/elenco-operativo/filtri', () => (valori ? HttpResponse.json(valori) : HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }))),
  );
  return lette;
}

function PaginaDetermine() {
  const { codice } = useParams();
  return <DetermineDellaDomanda codice={codice} />;
}

function apriDetermine(indirizzo: string) {
  const router = createMemoryRouter([{ path: '/fisico/determine/:codice?', Component: PaginaDetermine }], { initialEntries: [indirizzo] });
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

describe('SuperficiAmmissibili (pagina delle superfici, componente)', () => {
  it('barra coi chip e le pill, KPI della campagna di riferimento, tre card grafico e nessuna violazione axe', async () => {
    serviSuperfici();
    const { container } = renderPagina(SuperficiAmmissibili, '/fisico/superfici', '/fisico/superfici?intervento=SRB01');
    expect(await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' })).toBeTruthy();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRB01' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026 per tutti i flussi/ })).toBeTruthy();
    const ds = screen.getByRole('region', { name: 'Superficie ammissibile DS: superficie delle domande di sostegno, campagna 2025' });
    expect(testo(ds.textContent)).toContain('15,50 ha');
    expect(testo(ds.textContent)).toContain('2 domande di sostegno');
    expect(testo(screen.getByRole('region', { name: /^Domande con DP oltre la DS/ }).textContent)).toContain('su 3 domande di pagamento: 33,3 %');
    await trovaCard('Superficie DS e DP per intervento, campagna 2025');
    await trovaCard('Superficie DS e DP per campagna');
    await trovaCard('Verifica incrociata: differenza DP - DS per intervento, campagna 2025');
    await expectNoA11yViolations(container);
  });

  it('vista Tabella: una riga per intervento e campagna, un totale per campagna, nessuna violazione axe', async () => {
    serviSuperfici();
    const { container } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    const gruppo = await screen.findByRole('group', { name: 'Vista delle superfici' });
    await userEvent.click(within(gruppo).getByRole('button', { name: 'Tabella' }));
    const tabella = screen.getByRole('table', { name: /^Superficie ammissibile DS e DP per intervento e campagna/ });
    const intestazioni = within(tabella).getAllByRole('rowheader').map((c) => c.textContent);
    expect(intestazioni).toEqual(['SRA29', 'SRB01', 'SRB01', 'Totale campagna 2025 (1 intervento con superfici)', 'Totale campagna 2024 (1 intervento con superfici)']);
    expect(tabella.textContent).toContain('nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)');
    expect(within(screen.getByRole('group', { name: 'Scarica la tabella Superfici per intervento e campagna' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['CSV', 'XLSX']);
    await expectNoA11yViolations(container);
  });
});

describe('PannelloFiltriSuperfici (componente)', () => {
  it('voci di TX-0060 e campagne della risposta; Applica porta i criteri nell indirizzo; nessuna violazione axe', async () => {
    serviSuperfici();
    const { router } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' });
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'SRB01 Sostegno zone con svantaggi naturali montagna' }));
    const campagna = within(pannello).getByRole('group', { name: 'Campagna' });
    expect(within(campagna).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tutte le campagne', '2025', '2024']);
    await userEvent.click(within(campagna).getByRole('button', { name: '2024' }));
    await expectNoA11yViolations(pannello);
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01&campagna=2024'));
  });

  it('senza i valori di TX-0060 (in errore) lo dice in testo e propone i codici della risposta', async () => {
    serviSuperfici(SUPERFICI, null);
    renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await screen.findByRole('heading', { level: 2, name: 'Totali della campagna 2025' });
    await userEvent.click(screen.getByRole('button', { name: /^Filtri/ }));
    const pannello = await screen.findByRole('dialog', { name: 'Filtri delle superfici ammissibili' });
    expect(within(pannello).getByRole('status').textContent).toMatch(/^Valori dei filtri non disponibili/);
    expect(within(pannello).getByRole('checkbox', { name: 'SRA29' })).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'SRB01' })).toBeTruthy();
  });
});

describe('AnteprimaIntervento (componente)', () => {
  it('il clic su una barra apre l anteprima con la descrizione di TX-0060; Mostra solo mette il filtro; nessuna violazione axe', async () => {
    serviSuperfici();
    const { router } = renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    const card = await trovaCard('Superficie DS e DP per intervento, campagna 2025');
    const grafico = graficoDi(card);
    expect(grafico).toBeDefined();
    if (grafico) clicSulDato(grafico, 0, 0);
    const anteprima = await screen.findByRole('dialog', { name: 'SRB01' });
    expect(anteprima.textContent).toContain('SRB01 - Sostegno zone con svantaggi naturali montagna');
    expect(testo(anteprima.textContent)).toContain('Superficie DS, campagna 202515,50 ha');
    expect(anteprima.textContent).toContain('fonte quantità richiesta a premio non attiva');
    await expectNoA11yViolations(anteprima);
    await userEvent.click(within(anteprima).getByRole('button', { name: 'Mostra solo SRB01' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRB01'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'SRB01' })).toBeNull());
  });
});

describe('TabellaSuperfici (componente)', () => {
  it('la riga apre l anteprima dell intervento (clic o Invio)', async () => {
    serviSuperfici();
    renderPagina(SuperficiAmmissibili, '/fisico/superfici');
    await userEvent.click(within(await screen.findByRole('group', { name: 'Vista delle superfici' })).getByRole('button', { name: 'Tabella' }));
    const riga = screen.getByRole('row', { name: "Apri l'anteprima dell'intervento SRB01, campagna 2024" });
    riga.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'SRB01' })).toBeTruthy();
  });
});

describe('CercaDomanda e DetermineDellaDomanda (componenti)', () => {
  it('senza codice: il solo modulo e lo stato iniziale, nessuna lettura; nessuna violazione axe', async () => {
    const { container } = apriDetermine('/fisico/determine');
    expect(screen.getByRole('heading', { level: 1, name: 'Determine di una domanda' })).toBeTruthy();
    expect(screen.getByRole('search', { name: 'Cerca le determine di una domanda' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Scrivi il codice a barre di una domanda per vedere da quali determine prende le informazioni.');
    await expectNoA11yViolations(container);
  });

  it('il modulo riduce il testo alle cifre e porta alla stessa route col codice', async () => {
    const { router } = apriDetermine('/fisico/determine');
    server.use(http.get('*/api/fisico/domande/:codice/determina', () => HttpResponse.json(DETERMINE)));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Codice a barre della domanda' }), '5481 0769-585');
    await userEvent.click(screen.getByRole('button', { name: 'Cerca' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/fisico/determine/54810769585'));
  });

  it('con un codice: testata, KPI e tabella delle determine; nessuna violazione axe', async () => {
    server.use(http.get('*/api/fisico/domande/:codice/determina', () => HttpResponse.json(DETERMINE)));
    const { container } = apriDetermine('/fisico/determine/54810769585');
    expect(await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585 prende le informazioni/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/PAGAMENTO/54810769585');
    await expectNoA11yViolations(container);
  });
});
