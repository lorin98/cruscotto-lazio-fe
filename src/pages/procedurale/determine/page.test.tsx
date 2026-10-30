// Pagina /procedurale/determine/:codice? (green-fe step7; dal fisico col riallineamento degli ambiti del 29/10/2026, con
// gli stessi casi della pagina /procedurale/determine/:codice?): describe taggato col REQ della route (RF020), dati dagli scenari
// del backend (SC-FS_DETERMINA, SC-FS_DETERMINA_NESSUNA, SC-FS_DETERMINA_ASSENTE), MSW seminato con onUnhandledRequest
// 'error' (ogni lettura dichiarata qui), axe-core diretto, tastiera e focus del modulo di ricerca. Il badge del perimetro e
// il messaggio unico del 404 del wireframe del procedurale sono dei passi successivi.
import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { DETERMINE, DETERMINE_CHIUSA, DETERMINE_NESSUNA } from '../../../features/procedurale/testing/fixture';
import Pagina from './page';

const ROUTE = '/procedurale/determine/:codice?';
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p2-referente-adg', roles } })));

/** TX-0020: le risposte per codice (le altre 404), e i codici letti. */
function servi(risposte: Record<string, object> = { [DETERMINE.codiceABarre]: DETERMINE }) {
  const lette: string[] = [];
  server.use(
    http.get('*/api/procedurale/domande/:codice/determina', ({ params }) => {
      const codice = String(params.codice);
      lette.push(codice);
      return risposte[codice] ? HttpResponse.json(risposte[codice]) : HttpResponse.json(problema(404, 'NOT_FOUND'), { status: 404 });
    }),
  );
  return lette;
}

const apri = (indirizzo: string) => renderPagina(Pagina, ROUTE, indirizzo);
const campo = () => screen.getByRole('searchbox', { name: 'Codice a barre della domanda' });

describe("RF020: codice e data delle determine da cui la domanda prende l'informazione (TX-0020)", () => {
  it('senza codice (ingresso dal menu): il solo modulo e lo stato iniziale, nessuna lettura; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri('/procedurale/determine');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Determine di una domanda' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Determine di una domanda - Procedurale - Cruscotto CSR 2023-2027');
    expect(screen.getByRole('status').textContent).toBe('Scrivi il codice a barre di una domanda per vedere da quali determine prende le informazioni.');
    expect(screen.queryByRole('link', { name: 'Apri la scheda della domanda' })).toBeNull();
    expect(lette).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('con il codice: la corrente, le determine con riga aperta e da dove vengono i campi, in testo; nessuna violazione axe', async () => {
    const lette = servi();
    const { container } = apri('/procedurale/determine/54810769585');
    const tabella = await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585 prende le informazioni/ });
    expect(lette).toEqual(['54810769585']);
    expect(screen.getByRole('heading', { level: 1, name: 'Determine della domanda 54810769585' })).toBeTruthy();
    expect(screen.getByText('Domanda di pagamento 54810769585 - fonte delle informazioni')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual([
      'Domanda di pagamento',
      'Domanda corrente',
      '3 determine con riga aperta',
      'Perimetro: regionale',
    ]);
    expect(testo(screen.getByRole('region', { name: 'Determina corrente' }).textContent)).toContain('G00003del 30/06/2025 (la più recente con riga aperta: data, poi codice)');
    expect(testo(screen.getByRole('region', { name: /^Stato area programmazione da:/ }).textContent)).toContain('G00001del 10/01/2025');
    expect(testo(screen.getByRole('region', { name: /^Comparto da:/ }).textContent)).toContain('G00002del 30/06/2025');
    const righe = within(tabella).getAllByRole('row').slice(1).map((r) => Array.from(r.querySelectorAll('th, td')).map((c) => c.textContent));
    expect(righe).toEqual([
      ['G00003', '30/06/2025', 'sì, corrente', 'no', 'no'],
      ['G00002', '30/06/2025', 'no', 'no', 'sì'],
      ['G00001', '10/01/2025', 'no', 'sì', 'no'],
    ]);
    // link scheda-domanda verso l'elenco operativo: tipo e codice dalla risposta
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/PAGAMENTO/54810769585');
    await expectNoA11yViolations(container);
  });

  it('caricamento: lo scheletro con role=status e aria-live, distinto da vuoto ed errore; poi le determine', async () => {
    const t = trattenuta();
    server.use(
      http.get('*/api/procedurale/domande/:codice/determina', async () => {
        await t.attesa;
        return HttpResponse.json(DETERMINE);
      }),
    );
    apri('/procedurale/determine/54810769585');
    const caricamento = await screen.findByText('Caricamento in corso…');
    expect(caricamento.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
    // il titolo della domanda c'e' gia', senza dati: niente badge ne' link alla scheda
    expect(screen.getByRole('heading', { level: 1, name: 'Determine della domanda 54810769585' })).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Dati principali' })).toBeNull();
    await act(async () => t.libera());
    expect(await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585 prende le informazioni/ })).toBeTruthy();
    expect(screen.queryByText('Caricamento in corso…')).toBeNull();
  });

  it('domanda chiusa: lo dice in testo e non offre la scheda (risponde solo per le domande correnti); le determine restano', async () => {
    servi({ [DETERMINE_CHIUSA.codiceABarre]: DETERMINE_CHIUSA });
    apri('/procedurale/determine/34810063735');
    expect(await screen.findByText('Domanda chiusa: non è più nelle fonti SIAN')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Apri la scheda della domanda' })).toBeNull();
    expect(screen.getByRole('table', { name: /^Determine da cui la domanda 34810063735/ })).toBeTruthy();
  });

  it('senza il grant della scheda (csr.tx-0058.read) il link alla scheda non si vede (gate di UX)', async () => {
    profilo(['csr.tx-0020.read']);
    servi();
    apri('/procedurale/determine/54810769585');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    expect(screen.queryByRole('link', { name: 'Apri la scheda della domanda' })).toBeNull();
  });

  it('nessuna determina aperta: lo stato lo dice (non valorizzato), niente tabella vuota', async () => {
    servi({ [DETERMINE_NESSUNA.codiceABarre]: DETERMINE_NESSUNA });
    apri('/procedurale/determine/54810000001');
    expect(await screen.findByText('Nessuna determina aperta per la domanda 54810000001 (non valorizzato): la domanda non prende informazioni da nessuna determina.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('0 determine con riga aperta')).toBeTruthy();
  });

  it('404 NOT_FOUND: nessuna domanda con quel codice, col link che riporta al campo', async () => {
    servi({});
    apri('/procedurale/determine/99999999999');
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toBe('Nessuna domanda con il codice a barre 99999999999. Cerca un altro codice');
    expect(within(avviso).getByRole('link', { name: 'Cerca un altro codice' }).getAttribute('href')).toBe(`#${campo().id}`);
  });

  it('codice non valido nell indirizzo: nessuna lettura, il campo lo dice (aria-invalid, aria-describedby)', async () => {
    const lette = servi();
    apri('/procedurale/determine/5481A');
    const c = campo();
    expect(c.getAttribute('aria-invalid')).toBe('true');
    const errore = screen.getByRole('alert');
    expect(errore.textContent).toBe('Codice a barre non valido: contano solo le cifre, fino a 30.');
    expect(c.getAttribute('aria-describedby')?.split(' ')).toContain(errore.id);
    expect(lette).toEqual([]);
  });

  it('400 DATO_NON_VALIDO del backend: detto sotto il campo, nessun altro avviso', async () => {
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'codiceABarre'), { status: 400 })));
    apri('/procedurale/determine/123456789012345');
    await waitFor(() => expect(campo().getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual(['Codice a barre non valido: contano solo le cifre, fino a 30.']);
  });

  it('503 CAPACITA_ESAURITA: un solo avviso della pagina con Riprova', async () => {
    let tentativi = 0;
    server.use(
      http.get('*/api/procedurale/domande/:codice/determina', () => {
        tentativi += 1;
        return tentativi === 1 ? HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 }) : HttpResponse.json(DETERMINE);
      }),
    );
    apri('/procedurale/determine/54810769585');
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toContain('Il servizio è occupato da altre letture');
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ })).toBeTruthy();
  });
});

describe('RF020: ricerca per codice a barre (accessibilita da tastiera)', () => {
  it('Tab porta al campo, Invio cerca: la pagina passa al codice (sole cifre) e il focus va sul titolo', async () => {
    servi();
    const { router } = apri('/procedurale/determine');
    await userEvent.tab();
    // il primo elemento focalizzabile dopo il titolo e' nel percorso; si arriva al campo con Tab
    while (document.activeElement !== campo()) await userEvent.tab();
    await userEvent.keyboard('5481 0769-585{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/procedurale/determine/54810769585'));
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Determine della domanda 54810769585' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
  });

  it('errore di validazione associato al campo (aria-describedby) e focus sul campo, senza navigare', async () => {
    servi();
    const { router } = apri('/procedurale/determine');
    await userEvent.type(campo(), 'abc{Enter}');
    const errore = await screen.findByRole('alert');
    expect(errore.textContent).toBe('Scrivi il codice a barre della domanda: contano solo le cifre.');
    expect(campo().getAttribute('aria-describedby')?.split(' ')).toEqual([expect.stringMatching(/-aiuto$/), errore.id]);
    expect(document.activeElement).toBe(campo());
    expect(router.state.location.pathname).toBe('/procedurale/determine');
    await userEvent.clear(campo());
    await userEvent.type(campo(), '1'.repeat(31));
    await userEvent.click(screen.getByRole('button', { name: 'Cerca' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Il codice a barre ha al più 30 cifre: ne hai scritte 31.');
  });
});
