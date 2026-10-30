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
import type { QueryClient } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { InitialEntry } from 'react-router';
import { AUTH_STATUS_QUERY_KEY } from '../../../shared/api/auth/auth-status';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { problema, trattenuta } from '../../../shared/testing/msw';
import { clientDiTest, renderConQuery } from '../../../shared/testing/render';
import { DETERMINE, DETERMINE_CHIUSA, DETERMINE_NESSUNA, DETERMINE_P4_SOSTEGNO, DETERMINE_TIPO, DETERMINE_TIPO_SOSTEGNO } from '../../../features/procedurale/testing/fixture';
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

/**
 * La pagina nel router dei test; l'indirizzo puo' portare lo state della navigazione (il link della scheda dell'elenco).
 * `prima` e' la voce della cronologia che la precede (la scheda di partenza, per Indietro e Avanti); `client` il
 * QueryClient, per seminarlo o per rileggere la sessione.
 */
function apri(indirizzo: InitialEntry, { client = clientDiTest(), prima }: { client?: QueryClient; prima?: string } = {}) {
  const router = createMemoryRouter(
    [
      { path: ROUTE, Component: Pagina },
      { path: '*', element: <p>altra pagina</p> },
    ],
    prima ? { initialEntries: [prima, indirizzo], initialIndex: 1 } : { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />, client), router, client };
}
const campo = () => screen.getByRole('searchbox', { name: 'Codice a barre della domanda' });
/**
 * La sessione (/auth/status) e' letta e React ne ha avuto la notifica (notifyManager la pianifica su un timer a 0): prima
 * di asserire l'assenza di un link legato a un grant, che finche' la sessione non e' letta manca comunque (review step9
 * PRO2-04, come sessioneLetta di tests/finanziario-ui.test.tsx).
 */
async function sessioneLetta(client: QueryClient) {
  await waitFor(() => expect(client.getQueryState(AUTH_STATUS_QUERY_KEY)?.status).toBe('success'));
  await act(() => new Promise<void>((r) => setTimeout(r, 20)));
}

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
    const { client } = apri('/procedurale/determine/54810769585');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    await sessioneLetta(client);
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

  // review step9 PRO2-05: lo state della decisione D1 insieme al perimetro del P4; l'avviso non legge il perimetro
  it('D-11, P4 di Latina dalla scheda SOSTEGNO 54810769588: la SOSTEGNO di Latina con perimetro ADA, nessun avviso', async () => {
    profiloP4();
    servi({ [DETERMINE_P4_SOSTEGNO.codiceABarre]: DETERMINE_P4_SOSTEGNO });
    const { client, container } = apri({ pathname: '/procedurale/determine/54810769588', state: { tipoDellaScheda: 'SOSTEGNO' } });
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769588/ });
    await sessioneLetta(client);
    const badge = within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent);
    expect(badge).toEqual(['Domanda di sostegno', 'Domanda corrente', '1 determina con riga aperta', 'Perimetro: ADA, domande della tua area']);
    // il tipo di partenza e' arrivato (la regione c'e'), ma la risposta e' dello stesso tipo: vuota e nascosta
    expect(container.querySelector('.visually-hidden[role="status"]')?.textContent).toBe('');
    expect(screen.queryAllByRole('status').filter((s) => s.textContent?.startsWith('Il codice a barre'))).toEqual([]);
    expect(screen.queryByRole('link', { name: /scheda Determine$/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/SOSTEGNO/54810769588');
  });

  it('404 con lo state della scheda SOSTEGNO: domanda inesistente (regionale) e fuori dal perimetro (P4) danno la stessa pagina', async () => {
    const conState = { pathname: '/procedurale/determine/54810769586', state: { tipoDellaScheda: 'SOSTEGNO' } };
    /** La pagina del 404 come la vede l'utente: avviso, focus, titolo e il main intero (gli id generati a parte). */
    const comeAppare = async (client: QueryClient) => {
      const avviso404 = await screen.findByRole('alert');
      await sessioneLetta(client);
      const main = document.querySelector('main') as HTMLElement;
      return {
        testo: avviso404.textContent,
        classi: avviso404.className,
        focus: document.activeElement?.textContent,
        titolo: document.title,
        // gli id di useId di React (_r_0_, _r_3_...) dipendono dall'ordine dei montaggi, non dalla risposta
        main: main.innerHTML.replace(/_r_[0-9a-z]+_/g, 'ID'),
        regione: main.querySelector('.visually-hidden[role="status"]')?.textContent,
      };
    };
    // regionale (stessi grant del P4: il perimetro lo decide il backend): il 404 della domanda inesistente, simulato sullo
    // stesso codice per confrontare la pagina intera
    profilo(['csr.tx-0020.read', 'csr.tx-0058.read']);
    servi({});
    const regionale = apri(conState);
    const comeRegionale = await comeAppare(regionale.client);
    regionale.unmount();
    // P4 di Latina: 54810769586 e' di Frosinone, il backend risponde 404 con lo stesso corpo
    profiloP4();
    servi({});
    const p4 = apri(conState);
    expect(await comeAppare(p4.client)).toEqual(comeRegionale);
    expect(comeRegionale.testo).toBe('Domanda non trovata: nessuna domanda con il codice a barre 54810769586 fra quelle che puoi consultare. Cerca un altro codice');
    expect(comeRegionale.focus).toBe('Determine della domanda 54810769586');
    // lo state c'era: la regione dell'avviso e' montata, vuota, e non dice nulla dell'altra domanda
    expect(comeRegionale.regione).toBe('');
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

// decisione D1 dell'utente del 30/10/2026 (review step9 EO-01, flusso determine riapprovato): il link della scheda
// dell'elenco porta il tipo della scheda nello state della navigazione. TX-0020 sceglie fra le domande del codice con la
// regola dell'aggancio: in SC-PC_DETERMINA_TIPO 34810022870 e' SOSTEGNO (G00010) e PAGAMENTO (G00011), la risposta e' la
// PAGAMENTO. Il link scheda-di-partenza finisce sul segnaposto del router: l'arrivo si guarda nel router.
describe("RF020: domanda dell'altro tipo in arrivo dalla scheda dell'elenco, SC-PC_DETERMINA_TIPO (decisione D1 del 30/10/2026)", () => {
  const INDIRIZZO = '/procedurale/determine/34810022870';
  const dallaScheda = (tipoDellaScheda: unknown) => ({ pathname: INDIRIZZO, state: { tipoDellaScheda } });
  const AVVISO = 'Il codice a barre 34810022870 è anche di una domanda di pagamento: questa pagina mostra quella domanda, non la domanda di sostegno da cui arrivi.';
  const PARTENZA = 'Apri la scheda della domanda di sostegno, scheda Determine';
  const tabella = () => screen.findByRole('table', { name: /^Determine da cui la domanda 34810022870/ });
  /** La regione dell'avviso: role=status col testo dell'avviso (le altre regioni di stato della pagina hanno altri testi). */
  const avviso = () => screen.queryAllByRole('status').find((s) => s.textContent?.startsWith('Il codice a barre')) ?? null;

  it('dalla scheda SOSTEGNO con la risposta PAGAMENTO: avviso role=status sopra la testata e link alla scheda di partenza; nessuna violazione axe', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    const { container, router } = apri(dallaScheda('SOSTEGNO'));
    await tabella();
    const regione = avviso() as HTMLElement;
    expect(regione.textContent).toBe(`${AVVISO} ${PARTENZA}`);
    const link = within(regione).getByRole('link', { name: PARTENZA });
    expect(link.getAttribute('href')).toBe('/elenco-operativo/domande/SOSTEGNO/34810022870');
    // sopra la testata, che dice il tipo della risposta e apre la scheda della PAGAMENTO
    const h1 = screen.getByRole('heading', { level: 1, name: 'Determine della domanda 34810022870' });
    expect(regione.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Domanda di pagamento 34810022870 - fonte delle informazioni')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/PAGAMENTO/34810022870');
    // il tipo non e' mai nell'indirizzo
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(INDIRIZZO);
    await expectNoA11yViolations(container);
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/elenco-operativo/domande/SOSTEGNO/34810022870'));
    expect(screen.getByText('altra pagina')).toBeTruthy();
    // la scheda della domanda si apre sulla scheda Determine (state della navigazione, mai nell'indirizzo)
    expect(router.state.location.state).toEqual({ schedaIniziale: 'determine' });
    expect(router.state.location.search).toBe('');
  });

  it('la regione role=status c e gia in caricamento, vuota e nascosta, e si riempie con la risposta (si annuncia)', async () => {
    const t = trattenuta();
    server.use(
      http.get('*/api/procedurale/domande/:codice/determina', async () => {
        await t.attesa;
        return HttpResponse.json(DETERMINE_TIPO);
      }),
    );
    const { container } = apri(dallaScheda('SOSTEGNO'));
    await screen.findByText('Caricamento in corso…');
    const regione = container.querySelector('.visually-hidden[role="status"]');
    expect(regione?.textContent).toBe('');
    await act(async () => t.libera());
    await tabella();
    expect(avviso()).toBe(regione);
    expect(regione?.className).toBe('alert alert-info my-3');
  });

  // decisione D4 dell'utente del 30/10/2026 (review step9 PRO2-03): TX-0020 sceglie per prima la domanda con determine
  // aperte, quindi da una scheda senza determine aperte la pagina mostra sempre l'altra domanda; il testo neutro resta vero
  it('dalla scheda SOSTEGNO senza determine aperte (34810063735): la PAGAMENTO chiusa con G00016, avviso neutro e scheda di partenza, niente scheda della risposta', async () => {
    servi({ [DETERMINE_CHIUSA.codiceABarre]: DETERMINE_CHIUSA });
    apri({ pathname: '/procedurale/determine/34810063735', state: { tipoDellaScheda: 'SOSTEGNO' } });
    await screen.findByRole('table', { name: /^Determine da cui la domanda 34810063735/ });
    const regione = avviso() as HTMLElement;
    expect(regione.textContent).toBe(`Il codice a barre 34810063735 è anche di una domanda di pagamento: questa pagina mostra quella domanda, non la domanda di sostegno da cui arrivi. ${PARTENZA}`);
    expect(within(regione).getByRole('link', { name: PARTENZA }).getAttribute('href')).toBe('/elenco-operativo/domande/SOSTEGNO/34810063735');
    expect(screen.getByText('Domanda chiusa: non è più nelle fonti SIAN')).toBeTruthy();
    // la PAGAMENTO e' chiusa: la scheda della risposta non si offre (la scheda risponde solo per le domande correnti)
    expect(screen.queryByRole('link', { name: 'Apri la scheda della domanda' })).toBeNull();
  });

  it('dalla scheda PAGAMENTO senza determine aperte (34810063736): la SOSTEGNO con G00017, avviso neutro e scheda di partenza', async () => {
    servi({ [DETERMINE_TIPO_SOSTEGNO.codiceABarre]: DETERMINE_TIPO_SOSTEGNO });
    apri({ pathname: '/procedurale/determine/34810063736', state: { tipoDellaScheda: 'PAGAMENTO' } });
    await screen.findByRole('table', { name: /^Determine da cui la domanda 34810063736/ });
    const regione = avviso() as HTMLElement;
    const partenza = 'Apri la scheda della domanda di pagamento, scheda Determine';
    expect(regione.textContent).toBe(`Il codice a barre 34810063736 è anche di una domanda di sostegno: questa pagina mostra quella domanda, non la domanda di pagamento da cui arrivi. ${partenza}`);
    expect(within(regione).getByRole('link', { name: partenza }).getAttribute('href')).toBe('/elenco-operativo/domande/PAGAMENTO/34810063736');
    expect(screen.getByText('Domanda di sostegno 34810063736 - fonte delle informazioni')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Apri la scheda della domanda' }).getAttribute('href')).toBe('/elenco-operativo/domande/SOSTEGNO/34810063736');
  });

  // review step9 PRO2-01 (flusso riapprovato: "il tipo si legge una volta sola all'arrivo"): createBrowserRouter rilegge lo
  // state della voce a una ricarica e con Indietro o Avanti, quindi la pagina lo toglie dalla voce appena arrivata
  it('il tipo si legge una volta sola: lo state lascia la voce (replace, stesso indirizzo) e l avviso resta; una ricarica della voce non ha l avviso', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    const arrivo = apri(dallaScheda('SOSTEGNO'));
    await tabella();
    await waitFor(() => expect(arrivo.router.state.location.state).toBeNull());
    expect(arrivo.router.state.historyAction).toBe('REPLACE');
    expect(`${arrivo.router.state.location.pathname}${arrivo.router.state.location.search}`).toBe(INDIRIZZO);
    expect(avviso()?.textContent).toBe(`${AVVISO} ${PARTENZA}`);
    // ricarica: il browser rimonta l'app sulla stessa voce della cronologia, con lo state che la voce ha adesso
    const voce = arrivo.router.state.location;
    arrivo.unmount();
    apri(voce);
    await tabella();
    expect(avviso()).toBeNull();
    expect(screen.queryByRole('link', { name: PARTENZA })).toBeNull();
  });

  it('Indietro e Avanti: la voce delle determine torna senza state, nessun avviso; il consumo non aggiunge voci alla cronologia', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    const { router } = apri(dallaScheda('SOSTEGNO'), { prima: '/elenco-operativo/domande/SOSTEGNO/34810022870' });
    await tabella();
    await waitFor(() => expect(router.state.location.state).toBeNull());
    expect(avviso()).not.toBeNull();
    // Indietro porta alla scheda di partenza (la voce che precede), non a una copia della pagina
    await act(async () => router.navigate(-1));
    expect(router.state.location.pathname).toBe('/elenco-operativo/domande/SOSTEGNO/34810022870');
    expect(screen.getByText('altra pagina')).toBeTruthy();
    await act(async () => router.navigate(1));
    expect(router.state.location.pathname).toBe(INDIRIZZO);
    await tabella();
    expect(avviso()).toBeNull();
  });

  it('cambio d identita senza ricarica (la pagina resta montata, la shell rilegge la sessione): l avviso sparisce', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    const { client } = apri(dallaScheda('SOSTEGNO'));
    await tabella();
    // il link della scheda di partenza c'e': la prima lettura della sessione non azzera il tipo
    expect(within(avviso() as HTMLElement).getByRole('link', { name: PARTENZA })).toBeTruthy();
    // un altro utente entra nello stesso browser: la nuova lettura di /auth/status trova un'altra identita'
    server.use(
      http.get('*/auth/status', () =>
        HttpResponse.json({ authenticated: true, user: { username: 'ALTRO', profile: 'p4-responsabile-procedimento-ada', roles: ['csr.tx-0020.read', 'csr.tx-0058.read'] } }),
      ),
    );
    await act(async () => client.invalidateQueries({ queryKey: AUTH_STATUS_QUERY_KEY }));
    await waitFor(() => expect(avviso()).toBeNull());
    expect(client.getQueryData<{ user?: { username: string } }>(AUTH_STATUS_QUERY_KEY)?.user?.username).toBe('ALTRO');
    expect(screen.queryByRole('link', { name: PARTENZA })).toBeNull();
  });

  // review step9 PRO2-02: con TX-0020 gia' in cache (staleTime di 5 minuti nell'app) la risposta c'e' al primo render; la
  // regione deve comunque nascere vuota e riempirsi dopo, o non si annuncia (review v1 X-08 dell'elenco)
  it('con TX-0020 gia in cache la regione role=status nasce vuota e si riempie dopo il montaggio (si annuncia)', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    // anche la sessione gia' letta: al primo render ci sono la risposta e il link della scheda di partenza
    const sessione = { authenticated: true, user: { username: 'U', profile: 'p2-referente-adg', roles: ['csr.tx-0020.read', 'csr.tx-0058.read'] } };
    server.use(http.get('*/auth/status', () => HttpResponse.json(sessione)));
    const client = clientDiTest();
    client.setQueryData(AUTH_STATUS_QUERY_KEY, sessione);
    // la chiave di TX-0020 (getTx0020QueryKey del generato, che i componenti non importano)
    client.setQueryData(['/api/procedurale/domande/34810022870/determina'], DETERMINE_TIPO);
    // le regioni role=status a cui si aggiunge un contenuto quando sono gia' nel DOM
    const riempite: Node[] = [];
    const osservatore = new MutationObserver((mutazioni) => {
      for (const m of mutazioni) if (m.addedNodes.length > 0 && m.target instanceof HTMLElement && m.target.getAttribute('role') === 'status') riempite.push(m.target);
    });
    osservatore.observe(document.body, { childList: true, subtree: true });
    try {
      apri(dallaScheda('SOSTEGNO'), { client });
      // la risposta dalla cache: la tabella c'e' gia' al primo render
      expect(screen.getByRole('table', { name: /^Determine da cui la domanda 34810022870/ })).toBeTruthy();
      await waitFor(() => expect(avviso()?.textContent).toBe(`${AVVISO} ${PARTENZA}`));
      await waitFor(() => expect(riempite).toContain(avviso()));
    } finally {
      osservatore.disconnect();
    }
  });

  it('stesso tipo (scheda PAGAMENTO, risposta PAGAMENTO): nessun avviso', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    apri(dallaScheda('PAGAMENTO'));
    await tabella();
    expect(avviso()).toBeNull();
    expect(screen.queryByRole('link', { name: /scheda Determine$/ })).toBeNull();
  });

  it('senza state (indirizzo condiviso): nessun avviso', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    apri(INDIRIZZO);
    await tabella();
    expect(avviso()).toBeNull();
    expect(screen.queryByRole('link', { name: /scheda Determine$/ })).toBeNull();
  });

  it('state non valido (fuori dall elenco chiuso SOSTEGNO, PAGAMENTO): ignorato, nessun avviso', async () => {
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    for (const state of [{ tipoDellaScheda: 'ALTRO' }, { tipoDellaScheda: 'sostegno' }, { tipoDellaScheda: ['SOSTEGNO'] }, { tipo: 'SOSTEGNO' }, 'SOSTEGNO', null]) {
      const pagina = apri({ pathname: INDIRIZZO, state });
      await tabella();
      expect(avviso(), JSON.stringify(state)).toBeNull();
      expect(screen.queryByRole('link', { name: /scheda Determine$/ })).toBeNull();
      pagina.unmount();
    }
  });

  it('senza csr.tx-0058.read: l avviso senza il link alla scheda di partenza (gate di UX)', async () => {
    profilo(['csr.tx-0020.read']);
    servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO });
    const { client } = apri(dallaScheda('SOSTEGNO'));
    await tabella();
    await sessioneLetta(client);
    expect(avviso()?.textContent).toBe(AVVISO);
    expect(screen.queryByRole('link', { name: PARTENZA })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Apri la scheda della domanda' })).toBeNull();
  });

  it('dopo una nuova ricerca dal modulo, anche dello stesso codice, l avviso non c e piu', async () => {
    const lette = servi({ [DETERMINE_TIPO.codiceABarre]: DETERMINE_TIPO, [DETERMINE.codiceABarre]: DETERMINE });
    const { router } = apri(dallaScheda('SOSTEGNO'));
    await tabella();
    expect(avviso()).not.toBeNull();
    const voce = router.state.location.key;
    await userEvent.clear(campo());
    await userEvent.type(campo(), '34810022870{Enter}');
    // la ricerca e' una voce nuova della cronologia, senza state
    await waitFor(() => expect(router.state.location.key).not.toBe(voce));
    expect(router.state.location.state).toBeNull();
    expect(avviso()).toBeNull();
    expect(router.state.location.pathname).toBe(INDIRIZZO);
    await userEvent.clear(campo());
    await userEvent.type(campo(), '54810769585{Enter}');
    await screen.findByRole('table', { name: /^Determine da cui la domanda 54810769585/ });
    expect(avviso()).toBeNull();
    expect(lette).toEqual(['34810022870', '54810769585']);
  });
});
