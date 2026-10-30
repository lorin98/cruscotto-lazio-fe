// Pagina /procedurale/determine/:codice? (green-fe step7; dal fisico col riallineamento degli ambiti del 29/10/2026, con
// gli stessi casi della pagina /fisico/determine/:codice?): describe taggato col REQ della route (RF020), dati dagli scenari
// del backend (SC-PC_DETERMINA, SC-PC_DETERMINA_NESSUNA, SC-PC_DETERMINA_ASSENTE, SC-PC_DETERMINA_SCOPE_P4), MSW seminato
// con onUnhandledRequest 'error' (ogni lettura dichiarata qui), axe-core diretto, tastiera e focus del modulo di ricerca.
// Dal wireframe del procedurale approvato il 30/10/2026: il badge del perimetro della risposta (regionale, ADA del P4) e
// un solo messaggio, stato e focus per la domanda inesistente e per quella fuori dal perimetro del P4 (404 con lo stesso
// corpo).
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
    await expectNoA11yViolations(container);
    // il conteggio si chiude con una ricerca valida: una lettura partita senza codice sarebbe gia' registrata (review step9 PRO-01)
    await userEvent.type(campo(), '54810769585{Enter}');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    expect(lette).toEqual(['54810769585']);
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

  it('404 NOT_FOUND: domanda non trovata fra quelle che il profilo puo consultare, col link che riporta al campo', async () => {
    servi({});
    apri('/procedurale/determine/99999999999');
    const avviso = await screen.findByRole('alert');
    expect(avviso.textContent).toBe('Domanda non trovata: nessuna domanda con il codice a barre 99999999999 fra quelle che puoi consultare. Cerca un altro codice');
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
    // il conteggio si chiude con una ricerca valida: una lettura del codice non valido sarebbe gia' registrata (review step9 PRO-01)
    await userEvent.clear(c);
    await userEvent.type(c, '54810769585{Enter}');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    expect(lette).toEqual(['54810769585']);
  });

  it('400 DATO_NON_VALIDO del backend: detto sotto il campo, nessun altro avviso', async () => {
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'codiceABarre'), { status: 400 })));
    apri('/procedurale/determine/123456789012345');
    await waitFor(() => expect(campo().getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual(['Codice a barre non valido: contano solo le cifre, fino a 30.']);
  });

  it('503 CAPACITA_ESAURITA: un solo avviso della pagina con Riprova (e "Cerca un altro codice")', async () => {
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
    expect(within(avviso).getByRole('link', { name: 'Cerca un altro codice' })).toBeTruthy();
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    expect(await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ })).toBeTruthy();
  });
});

describe('RF020: perimetro della risposta e domanda non trovata, SC-PC_DETERMINA_SCOPE_P4 (wireframe del procedurale approvato il 30/10/2026)', () => {
  const profiloP4 = () =>
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p4-responsabile-procedimento-ada', roles: ['csr.tx-0020.read', 'csr.tx-0058.read'] } }),
      ),
    );

  it('P4: la testata dice in testo il perimetro ADA; la scheda della domanda trovata si apre (TX-0058 sullo stesso perimetro); nessuna violazione axe', async () => {
    profiloP4();
    servi({ [DETERMINE.codiceABarre]: { ...DETERMINE, perimetro: 'ADA' } });
    const { container } = apri('/procedurale/determine/54810769585');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    const badge = within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent);
    expect(badge).toEqual(['Domanda di pagamento', 'Domanda corrente', '3 determine con riga aperta', 'Perimetro: ADA, domande della tua area']);
    expect(screen.queryByText('Perimetro: regionale')).toBeNull();
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/PAGAMENTO/54810769585');
    await expectNoA11yViolations(container);
  });

  it('404 fuori dal perimetro del P4 e 404 di una domanda inesistente: stesso messaggio, stesso stato, stesso focus', async () => {
    // regionale: il codice non esiste
    servi({});
    const regionale = apri('/procedurale/determine/54810769585');
    const avvisoRegionale = await screen.findByRole('alert');
    const comeRegionale = { testo: avvisoRegionale.textContent, classi: avvisoRegionale.className, focus: document.activeElement?.textContent, titolo: document.title };
    regionale.unmount();
    // P4: la stessa domanda esiste ma e' di un'altra area, il backend risponde 404 con lo stesso corpo
    profiloP4();
    servi({});
    apri('/procedurale/determine/54810769585');
    const avvisoP4 = await screen.findByRole('alert');
    expect({ testo: avvisoP4.textContent, classi: avvisoP4.className, focus: document.activeElement?.textContent, titolo: document.title }).toEqual(comeRegionale);
    expect(comeRegionale.testo).toBe('Domanda non trovata: nessuna domanda con il codice a barre 54810769585 fra quelle che puoi consultare. Cerca un altro codice');
    expect(comeRegionale.focus).toBe('Determine della domanda 54810769585');
    // niente testata coi badge, KPI o tabella: la pagina non dice altro della domanda
    expect(screen.queryByRole('list', { name: 'Dati principali' })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('404: "Cerca un altro codice" porta il focus al campo del modulo, anche da tastiera; nessuna violazione axe', async () => {
    servi({});
    const { container } = apri('/procedurale/determine/99999999999');
    const avviso = await screen.findByRole('alert');
    expect(avviso.classList.contains('alert-danger')).toBe(true);
    await expectNoA11yViolations(container);
    within(avviso).getByRole('link', { name: 'Cerca un altro codice' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(campo());
  });

  // decisione D2 dell'utente del 30/10/2026 (review step9 PRO-02): come nel wireframe approvato, "Cerca un altro codice"
  // anche nell'avviso degli errori diversi da 404 e 400; Riprova resta, come nelle altre pagine
  it('403, 429 e 503: l avviso della pagina con Riprova e "Cerca un altro codice", mai il messaggio della domanda non trovata', async () => {
    for (const [status, codice] of [
      [403, 'ACCESSO_NEGATO'],
      [429, 'TROPPE_RICHIESTE'],
      [503, 'TEMPO_SCADUTO'],
    ] as const) {
      server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(status, codice), { status })));
      const pagina = apri('/procedurale/determine/54810769585');
      const avviso = await screen.findByRole('alert');
      expect(avviso.textContent, codice).not.toContain('Domanda non trovata');
      expect(within(avviso).getByRole('button', { name: 'Riprova' })).toBeTruthy();
      expect(within(avviso).getByRole('link', { name: 'Cerca un altro codice' }).getAttribute('href')).toBe(`#${campo().id}`);
      pagina.unmount();
    }
  });

  it('403 ACCESSO_NEGATO: "Cerca un altro codice" porta il focus al campo del modulo, anche da tastiera; nessuna violazione axe', async () => {
    server.use(http.get('*/api/procedurale/domande/:codice/determina', () => HttpResponse.json(problema(403, 'ACCESSO_NEGATO'), { status: 403 })));
    const { container } = apri('/procedurale/determine/54810769585');
    const avviso = await screen.findByRole('alert');
    await expectNoA11yViolations(container);
    within(avviso).getByRole('link', { name: 'Cerca un altro codice' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(campo());
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
