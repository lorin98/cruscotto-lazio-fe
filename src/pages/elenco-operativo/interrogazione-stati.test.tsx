import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../shared/testing/axe';
import { problema } from '../../shared/testing/msw';
import { renderPagina } from '../../shared/testing/render-pagina';
import { ElencoDomande, ElencoPagamenti } from '../../features/elenco-operativo';
import { PAGINA_DOMANDE, PAGINA_PAGAMENTI, SINOTTICO, VALORI } from '../../features/elenco-operativo/testing/fixture';

// Stati delle due interrogazioni dopo la review v1: errori dal problem-type in un solo avviso, coi chip ancora rimovibili
// (V-05), aggiornamento dichiarato con i dati precedenti visibili (V-05, V-03), fascia di importo rovesciata ed errori
// delle letture dentro il pannello (X-03), letture solo coi grant del profilo (A-06), limite dell'esportazione (V-16).
// Dalla review v2: gli stati anche per i pagamenti (V-05), mai il numero precedente detto "con questi filtri" (V-04),
// l'estremo di una fascia che torna valido parte con l'altro (A-02).
// Ogni test dichiara gli endpoint che usa: i mock generati dell'elenco non sono montati nei test (H-16).

const TUTTI = ['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];

function servi(roles = TUTTI) {
  const richieste: string[] = [];
  const registra = (nome: string, corpo: object) => ({ request }: { request: Request }) => {
    richieste.push(`${nome}${new URL(request.url).search}`);
    return HttpResponse.json(corpo);
  };
  server.use(
    http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p1-dirigente', roles } })),
    http.get('*/api/elenco-operativo/filtri', registra('filtri', VALORI)),
    http.get('*/api/elenco-operativo/domande/sinottico', registra('sinottico', SINOTTICO)),
    http.get('*/api/elenco-operativo/domande', registra('domande', PAGINA_DOMANDE)),
    http.get('*/api/elenco-operativo/pagamenti', registra('pagamenti', PAGINA_PAGAMENTI)),
  );
  return richieste;
}

/** Una risposta trattenuta finche' il test non la libera (aggiornamento in corso). */
function trattenuta() {
  let libera = () => {};
  const attesa = new Promise<void>((r) => {
    libera = r;
  });
  return { attesa, libera: () => libera() };
}

const errore = (status: number, codice: string, detail?: string) => () => HttpResponse.json(problema(status, codice, detail), { status });

async function apriPannello() {
  await userEvent.click(screen.getByRole('button', { name: /Filtri/ }));
  return screen.findByRole('dialog');
}

describe('RA006: errori delle letture dal problem-type, un solo avviso per pagina (review v1 V-05)', () => {
  it('400 DATO_NON_VALIDO su elenco e sinottico: un solo avviso col messaggio del backend; i chip restano e si tolgono', async () => {
    servi();
    server.use(
      http.get('*/api/elenco-operativo/domande/sinottico', errore(400, 'DATO_NON_VALIDO', 'intervento non valido')),
      http.get('*/api/elenco-operativo/domande', errore(400, 'DATO_NON_VALIDO', 'intervento non valido')),
    );
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA99');
    await screen.findByText('2 sezioni della pagina non si sono caricate.');
    const avvisi = screen.getAllByRole('alert');
    expect(avvisi).toHaveLength(1);
    expect(avvisi[0].textContent).toContain('Richiesta non valida: intervento non valido. Correggila e riprova.');
    await userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: 'Togli il filtro Intervento SRA99' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  // review v2 V-05: gli stessi stati anche per l'elenco dei pagamenti
  const PAGINE = [
    ['domande', ElencoDomande, '/elenco-operativo/domande', '*/api/elenco-operativo/domande', /Elenco operativo delle domande/],
    ['pagamenti', ElencoPagamenti, '/elenco-operativo/pagamenti', '*/api/elenco-operativo/pagamenti', /Elenco operativo dei pagamenti/],
  ] as const;

  it.each(PAGINE)('%s, 503 CAPACITA_ESAURITA: il messaggio della capacita, senza tabella', async (_, Pagina, percorso, api, tabella) => {
    servi();
    server.use(http.get(api, errore(503, 'CAPACITA_ESAURITA')));
    renderPagina(Pagina, percorso);
    expect((await screen.findByRole('alert')).textContent).toContain('Il servizio è occupato da altre letture: riprova tra qualche secondo.');
    expect(screen.queryByRole('table', { name: tabella })).toBeNull();
  });

  it.each(PAGINE)('%s, 403 ACCESSO_NEGATO: accesso negato, senza dati', async (_, Pagina, percorso, api, tabella) => {
    servi();
    server.use(http.get(api, errore(403, 'ACCESSO_NEGATO')));
    renderPagina(Pagina, percorso);
    expect((await screen.findByRole('alert')).textContent).toContain('Non hai i permessi per consultare questi dati.');
    expect(screen.queryByRole('table', { name: tabella })).toBeNull();
  });

  it('pagamenti: il 400 diventa un solo avviso, la barra dei filtri resta', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/pagamenti', errore(400, 'DATO_NON_VALIDO', 'decreto non valido')));
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti', '/elenco-operativo/pagamenti?decreto=D99');
    expect((await screen.findByRole('alert')).textContent).toContain('Richiesta non valida: decreto non valido.');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: 'Togli il filtro Decreto D99' })).toBeTruthy();
  });

  it('valori dei filtri (TX-0060) non disponibili: il pannello lo dice e la ricerca per testo resta usabile', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/filtri', errore(503, 'CAPACITA_ESAURITA')));
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const dialogo = await apriPannello();
    expect(await within(dialogo).findByText('Valori dei filtri non disponibili: resta la ricerca per testo.')).toBeTruthy();
    await userEvent.type(within(dialogo).getByRole('searchbox', { name: 'Cerca per codice a barre, CUAA o denominazione' }), 'rossi');
    await waitFor(() => expect(router.state.location.search).toBe('?testo=rossi'));
  });
});

describe('RA006: aggiornamento dichiarato, i dati precedenti restano visibili (review v1 V-05, V-03)', () => {
  it("elenco: righe precedenti, aria-busy e avviso finche' arrivano le nuove", async () => {
    servi();
    const r = trattenuta();
    server.use(
      http.get('*/api/elenco-operativo/domande', async ({ request }) => {
        if (!new URL(request.url).searchParams.has('intervento')) await r.attesa;
        return HttpResponse.json(PAGINA_DOMANDE);
      }),
    );
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    await userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: /^Togli il filtro Intervento/ }));
    const sezione = screen.getByRole('region', { name: 'Elenco delle domande' });
    await waitFor(() => expect(sezione.getAttribute('aria-busy')).toBe('true'));
    expect(within(sezione).getByText(/^Aggiornamento dei risultati/)).toBeTruthy();
    expect(within(sezione).getAllByRole('rowheader').map((c) => c.textContent)).toContain('04230000001');
    r.libera();
    await waitFor(() => expect(sezione.getAttribute('aria-busy')).toBe('false'));
    expect(within(sezione).queryByText(/^Aggiornamento dei risultati/)).toBeNull();
  });

  it('sinottico in aggiornamento: aria-busy, avviso, e nel piede nessuna somma dei criteri precedenti', async () => {
    servi();
    const r = trattenuta();
    server.use(
      http.get('*/api/elenco-operativo/domande/sinottico', async ({ request }) => {
        if (!new URL(request.url).searchParams.has('intervento')) await r.attesa;
        return HttpResponse.json(SINOTTICO);
      }),
    );
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01');
    const tabella = await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    await waitFor(() => expect(tabella.querySelector('tfoot')?.textContent).toMatch(/12\.345\.678,90/));
    await userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: /^Togli il filtro Intervento/ }));
    const sinottico = screen.getByRole('region', { name: /^Sinottico dell/ });
    await waitFor(() => expect(sinottico.getAttribute('aria-busy')).toBe('true'));
    expect(within(sinottico).getByText(/^Aggiornamento del sinottico/)).toBeTruthy();
    // mai il numero precedente detto "con questi filtri" (review v2 V-04)
    expect(within(sinottico).queryByText(/con questi filtri/)).toBeNull();
    expect(within(sinottico).getByText('Conteggio in corso…')).toBeTruthy();
    const piede = screen.getByRole('table', { name: /Elenco operativo delle domande/ }).querySelector('tfoot');
    expect(piede?.textContent).toContain('in aggiornamento');
    expect(piede?.textContent).not.toMatch(/12\.345\.678,90/);
    r.libera();
    await waitFor(() => expect(sinottico.getAttribute('aria-busy')).toBe('false'));
    expect(within(sinottico).getByText('1284 domande con questi filtri')).toBeTruthy();
  });

  it("pagamenti: righe e totali precedenti, aria-busy e avviso sulla card e sul sinottico finche' arrivano i nuovi (review v2 V-05)", async () => {
    servi();
    const r = trattenuta();
    server.use(
      http.get('*/api/elenco-operativo/pagamenti', async ({ request }) => {
        if (!new URL(request.url).searchParams.has('esito')) await r.attesa;
        return HttpResponse.json(PAGINA_PAGAMENTI);
      }),
    );
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti', '/elenco-operativo/pagamenti?esito=PAGATA');
    await screen.findByRole('table', { name: /Elenco operativo dei pagamenti/ });
    await userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: /^Togli il filtro Esito/ }));
    const sezione = screen.getByRole('region', { name: 'Righe di pagamento' });
    const sinottico = screen.getByRole('region', { name: /^Sinottico dell/ });
    await waitFor(() => expect(sezione.getAttribute('aria-busy')).toBe('true'));
    expect(sinottico.getAttribute('aria-busy')).toBe('true');
    expect(within(sezione).getByText(/^Aggiornamento dei risultati/)).toBeTruthy();
    expect(within(sinottico).getByText(/^Aggiornamento del sinottico/)).toBeTruthy();
    expect(within(sezione).getAllByRole('rowheader').length).toBeGreaterThan(0);
    r.libera();
    await waitFor(() => expect(sezione.getAttribute('aria-busy')).toBe('false'));
    expect(sinottico.getAttribute('aria-busy')).toBe('false');
    expect(within(sezione).queryByText(/^Aggiornamento dei risultati/)).toBeNull();
  });
});

describe('RA006: fascia di importo ed errori delle letture nel pannello (review v1 X-03)', () => {
  it('"Fino a" minore di "Da": il campo lo dice e la fascia rovesciata non parte', async () => {
    const richieste = servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const dialogo = await apriPannello();
    const fascia = await within(dialogo).findByRole('group', { name: 'Importo richiesto (euro)' });
    await userEvent.type(within(fascia).getByRole('textbox', { name: 'Da' }), '100');
    await waitFor(() => expect(router.state.location.search).toBe('?richiestoDa=100'));
    const a = within(fascia).getByRole('textbox', { name: 'Fino a' });
    await userEvent.type(a, '50');
    expect(a.getAttribute('aria-invalid')).toBe('true');
    expect(within(fascia).getByText(/"Fino a" non può essere minore di "Da"/)).toBeTruthy();
    // oltre il ritardo del debounce: l'estremo non valido non e' andato ne' nell'indirizzo ne' al server
    await new Promise((r) => setTimeout(r, 400));
    expect(router.state.location.search).toBe('?richiestoDa=100');
    expect(richieste.some((q) => q.includes('richiestoA'))).toBe(false);
  });

  it("l'estremo scartato perche' rovesciava la fascia parte quando l'altro la raddrizza (review v2 A-02)", async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?richiestoDa=10000');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const dialogo = await apriPannello();
    const fascia = await within(dialogo).findByRole('group', { name: 'Importo richiesto (euro)' });
    const da = within(fascia).getByRole('textbox', { name: 'Da' });
    const a = within(fascia).getByRole('textbox', { name: 'Fino a' });
    await userEvent.type(a, '5000');
    expect(a.getAttribute('aria-invalid')).toBe('true');
    await new Promise((r) => setTimeout(r, 400));
    expect(router.state.location.search).toBe('?richiestoDa=10000');
    await userEvent.clear(da);
    await userEvent.type(da, '1000');
    await waitFor(() => expect(router.state.location.search).toBe('?richiestoDa=1000&richiestoA=5000'));
    expect(a.getAttribute('aria-invalid')).toBeNull();
    expect(a).toHaveProperty('value', '5000');
    const barra = screen.getByRole('region', { name: 'Filtri attivi', hidden: true });
    expect(within(barra).getByRole('button', { name: /^Togli il filtro Richiesto fino a 5000,00/, hidden: true })).toBeTruthy();
  });

  it('un 400 del sinottico col pannello aperto si legge nel pannello (role=alert nel dialogo)', async () => {
    servi();
    server.use(
      http.get('*/api/elenco-operativo/domande/sinottico', ({ request }) =>
        new URL(request.url).searchParams.has('sigc') ? HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'sigc non valido'), { status: 400 }) : HttpResponse.json(SINOTTICO),
      ),
    );
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const dialogo = await apriPannello();
    await userEvent.click(await within(dialogo).findByRole('button', { name: 'Solo SIGC' }));
    const avviso = await within(dialogo).findByRole('alert');
    expect(avviso.textContent).toBe('Risultati non disponibili con questi filtri: Richiesta non valida: sigc non valido. Correggila e riprova.');
  });
});

describe("RA006: filtro dell'atto di concessione solo se TX-0060 lo dichiara disponibile (D-02 Rev. 5-6, D11 del backend)", () => {
  const NON_DISPONIBILE = 'Atto di concessione non disponibile finché nessuna domanda ha un atto di concessione.';
  const RIFIUTO = "concessione: nessuna domanda del database ha l'atto di concessione (fonte ATTO_CONCESSIONE non attiva)";
  const senzaAtto = () => server.use(http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json({ ...VALORI, attoConcessioneDisponibile: false })));

  it('con attoConcessioneDisponibile vero il pannello offre il filtro e lo manda', async () => {
    const richieste = servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const dialogo = await apriPannello();
    expect(within(dialogo).queryByText(NON_DISPONIBILE)).toBeNull();
    await userEvent.click(await within(dialogo).findByRole('button', { name: "Con l'atto di concessione" }));
    await waitFor(() => expect(router.state.location.search).toBe('?concessione=true'));
    await waitFor(() => expect(richieste).toContain('domande?concessione=true'));
  });

  it.each([
    ['domande', ElencoDomande, '/elenco-operativo/domande', /Elenco operativo delle domande/],
    ['pagamenti', ElencoPagamenti, '/elenco-operativo/pagamenti', /Elenco operativo dei pagamenti/],
  ] as const)('%s, attoConcessioneDisponibile falso: il controllo non si mostra, il pannello lo dice e non manda mai concessione', async (_, Pagina, percorso, tabella) => {
    const richieste = servi();
    senzaAtto();
    const { router } = renderPagina(Pagina, percorso);
    await screen.findByRole('table', { name: tabella });
    const dialogo = await apriPannello();
    expect(await within(dialogo).findByText(NON_DISPONIBILE)).toBeTruthy();
    expect(within(dialogo).queryByRole('button', { name: "Con l'atto di concessione" })).toBeNull();
    expect(within(dialogo).queryByRole('button', { name: "Senza l'atto" })).toBeNull();
    await expectNoA11yViolations(dialogo);
    // gli altri controlli del gruppo restano
    expect(within(dialogo).getByRole('button', { name: 'Con anomalie' })).toBeTruthy();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Con anomalie' }));
    await waitFor(() => expect(router.state.location.search).toBe('?anomalie=true'));
    expect(richieste.some((r) => r.includes('concessione'))).toBe(false);
  });

  it("domande: l'indirizzo con concessione e il 400 DATO_NON_VALIDO sul campo, come gli altri 400 dei filtri: un solo avviso, il chip resta e si toglie", async () => {
    servi();
    senzaAtto();
    server.use(
      http.get('*/api/elenco-operativo/domande/sinottico', errore(400, 'DATO_NON_VALIDO', RIFIUTO)),
      http.get('*/api/elenco-operativo/domande', errore(400, 'DATO_NON_VALIDO', RIFIUTO)),
    );
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?concessione=true');
    await screen.findByText('2 sezioni della pagina non si sono caricate.');
    const avvisi = screen.getAllByRole('alert');
    expect(avvisi).toHaveLength(1);
    expect(avvisi[0].textContent).toContain(`Richiesta non valida: ${RIFIUTO}. Correggila e riprova.`);
    await userEvent.click(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: "Togli il filtro Atto di concessione con l'atto" }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it("pagamenti: l'indirizzo con concessione=false e il 400 sul campo: un solo avviso, la barra dei filtri resta", async () => {
    servi();
    senzaAtto();
    server.use(http.get('*/api/elenco-operativo/pagamenti', errore(400, 'DATO_NON_VALIDO', RIFIUTO)));
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti', '/elenco-operativo/pagamenti?concessione=false');
    expect((await screen.findByRole('alert')).textContent).toContain(`Richiesta non valida: ${RIFIUTO}.`);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: 'Filtri attivi' })).getByRole('button', { name: "Togli il filtro Atto di concessione senza l'atto" })).toBeTruthy();
  });
});

describe('RA006: ogni lettura col suo grant (review v1 A-06)', () => {
  it('senza TX-0057 e TX-0060: niente sinottico ne valori dei filtri; il pannello resta con la ricerca per testo', async () => {
    const richieste = servi(['csr.tx-0056.read', 'csr.tx-0058.read']);
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    expect(screen.queryByRole('region', { name: /^Sinottico dell/ })).toBeNull();
    const dialogo = await apriPannello();
    expect(within(dialogo).getByText('Il tuo profilo non legge i valori dei filtri: resta la ricerca per testo.')).toBeTruthy();
    expect(within(dialogo).getByRole('searchbox', { name: 'Cerca per codice a barre, CUAA o denominazione' })).toBeTruthy();
    expect(richieste.filter((r) => !r.startsWith('domande'))).toEqual([]);
  });

  it("senza TX-0056: la pagina lo dice e non legge l'elenco; il sinottico resta", async () => {
    const richieste = servi(['csr.tx-0057.read', 'csr.tx-0060.read']);
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    expect((await screen.findByRole('alert')).textContent).toBe("Il tuo profilo non consulta l'elenco delle domande.");
    expect((await screen.findByRole('region', { name: 'Domande' })).textContent).toContain('1284');
    expect(richieste.some((r) => r.startsWith('domande'))).toBe(false);
  });

  it("pagamenti senza TX-0059: la pagina lo dice e non legge l'elenco", async () => {
    const richieste = servi(['csr.tx-0056.read', 'csr.tx-0060.read']);
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti');
    expect((await screen.findByRole('alert')).textContent).toBe("Il tuo profilo non consulta l'elenco dei pagamenti.");
    expect(richieste.some((r) => r.startsWith('pagamenti'))).toBe(false);
  });
});

describe("RA005: esportazione dell'elenco filtrato, limite delle righe e pagamenti (review v1 V-16)", () => {
  function salvataggio() {
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    return vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  }

  it('oltre il limite la pagina lo dice prima del clic, e il 400 del file si spiega', async () => {
    servi();
    server.use(
      http.get('*/api/elenco-operativo/domande', () => HttpResponse.json({ ...PAGINA_DOMANDE, totaleRighe: 3000 })),
      http.get('*/api/elenco-operativo/domande/:formato', ({ params }) =>
        params.formato === 'csv' || params.formato === 'xlsx' ? HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'troppe righe'), { status: 400 }) : undefined,
      ),
    );
    const clic = salvataggio();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    // formato italiano: le migliaia si separano da 10.000
    expect(await screen.findByText('I file contengono al più 2173 domande: restringi i filtri per scaricarli (ora 3000).')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Scarica l'elenco delle domande in CSV" }));
    expect((await screen.findByRole('alert')).textContent).toBe('File CSV non scaricato. Troppe righe per un file: al più 2173 domande. Restringi i filtri e riprova.');
    expect(clic).not.toHaveBeenCalled();
    clic.mockRestore();
  });

  it("entro il limite nessun avviso; il file dei pagamenti ha i filtri e il nome di TX-0059", async () => {
    servi();
    const esportazioni: string[] = [];
    server.use(
      http.get('*/api/elenco-operativo/pagamenti/:formato', ({ request, params }) => {
        if (params.formato !== 'csv' && params.formato !== 'xlsx') return undefined;
        const u = new URL(request.url);
        esportazioni.push(`${u.pathname}${u.search}`);
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    const clic = salvataggio();
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti', '/elenco-operativo/pagamenti?esito=PAGATA&dimensione=50');
    await userEvent.click(await screen.findByRole('button', { name: "Scarica l'elenco dei pagamenti in CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalled());
    expect(esportazioni).toEqual(['/api/elenco-operativo/pagamenti/csv?esito=PAGATA']);
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toMatch(/tx-0059\.csv$/);
    expect(screen.queryByText(/I file contengono al più/)).toBeNull();
    clic.mockRestore();
  });
});
