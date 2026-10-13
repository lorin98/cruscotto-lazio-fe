import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { server } from '../../shared/api/mock/server';
import { problema } from '../../shared/testing/msw';
import { renderConQuery } from '../../shared/testing/render';
import { DETTAGLIO, PAGINA_DOMANDE, PAGINA_PAGAMENTI, SINOTTICO, VALORI } from '../../features/elenco-operativo/testing/fixture';
import PaginaDomande from './domande/page';
import PaginaPagamenti from './pagamenti/page';
import PaginaScheda from './dettaglio-domanda/page';

// Scheda della domanda (TX-0058) dopo la review v1: riferimento del percorso convalidato prima di ogni lettura (A-01),
// colonne delle schede Determine e Pagamenti (V-02), ritorno alla ricerca e alla vista di partenza anche dopo una domanda
// collegata (V-12, X-04), domanda di sostegno come link solo se e' fra le collegate (V-13), link mostrati solo col grant
// della lettura che aprono (A-05). Le tre pagine stanno in un router in memoria, come nell'applicazione.

const TUTTI = ['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p1-dirigente', roles } })));

/** La domanda di sostegno della domanda di pagamento del DETTAGLIO, collegata a lei. */
const SOSTEGNO = {
  ...DETTAGLIO,
  domanda: PAGINA_DOMANDE.righe?.[0],
  codiceDomandaSostegno: null,
  collegate: [{ codiceABarre: '54230000001', tipo: 'PAGAMENTO', statoDescrizione: 'Valida' }],
};

function servi(roles = TUTTI, dettaglio: typeof DETTAGLIO = DETTAGLIO) {
  const letture: string[] = [];
  profilo(roles);
  server.use(
    http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
    http.get('*/api/elenco-operativo/domande/sinottico', () => HttpResponse.json(SINOTTICO)),
    http.get('*/api/elenco-operativo/domande', () => HttpResponse.json(PAGINA_DOMANDE)),
    http.get('*/api/elenco-operativo/pagamenti', () => HttpResponse.json(PAGINA_PAGAMENTI)),
    http.get('*/api/elenco-operativo/domande/:tipo/:codice', ({ params }) => {
      letture.push(`${String(params.tipo)}/${String(params.codice)}`);
      return HttpResponse.json(params.codice === '04230000001' ? SOSTEGNO : dettaglio);
    }),
  );
  return letture;
}

function apri(indirizzo: string) {
  const router = createMemoryRouter(
    [
      { path: '/elenco-operativo/domande', Component: PaginaDomande },
      { path: '/elenco-operativo/pagamenti', Component: PaginaPagamenti },
      { path: '/elenco-operativo/domande/:tipo/:codiceABarre', Component: PaginaScheda },
    ],
    { initialEntries: [indirizzo] },
  );
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}

const indirizzo = (r: { state: { location: { pathname: string; search: string } } }) => `${r.state.location.pathname}${r.state.location.search}`;

describe('RA004: riferimento della scheda convalidato prima della lettura (review v1 A-01)', () => {
  it.each(['SOSTEGNO/..%2F..%2Fdomande%2Fcsv%3Fx%3D1', 'SOSTEGNO/%2E%2E', 'SOSTEGNO/0423%5C0001', 'SOSTEGNO/0423ABC', 'ALTRO/04230000001'])(
    '%s: nessuna richiesta alle API, il riferimento non valido e detto',
    async (riferimento) => {
      profilo(TUTTI);
      const richieste: string[] = [];
      server.use(
        http.all('*/api/*', ({ request }) => {
          richieste.push(request.url);
          return HttpResponse.json(problema(500, 'ERRORE_INTERNO'), { status: 500 });
        }),
      );
      apri(`/elenco-operativo/domande/${riferimento}`);
      expect(await screen.findByRole('heading', { level: 1, name: 'Domanda non valida' })).toBeTruthy();
      expect((await screen.findByRole('alert')).textContent).toContain("Tipo o codice a barre non validi: l'indirizzo non indica una domanda.");
      // il profilo arriva (unica lettura della pagina), poi nessuna lettura dell'API
      await waitFor(() => expect(screen.getAllByRole('link', { name: "Torna all'elenco" }).length).toBeGreaterThan(0));
      await new Promise((r) => setTimeout(r, 50));
      expect(richieste).toEqual([]);
    },
  );

  it('il 400 DATO_NON_VALIDO del backend ha lo stesso esito di un riferimento non valido', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/domande/:tipo/:codice', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'codice a barre non valido'), { status: 400 })));
    apri('/elenco-operativo/domande/SOSTEGNO/04230000099');
    expect(await screen.findByRole('heading', { level: 1, name: 'Domanda non valida' })).toBeTruthy();
    expect((await screen.findByRole('alert')).textContent).toContain('Tipo o codice a barre non validi');
  });
});

describe('RA004: schede Determine e Pagamenti con le colonne del wireframe approvato (review v1 V-02)', () => {
  it('Pagamenti: quote FEASR, nazionale e regionale; protocollo e tipologie fra le colonne a scelta', async () => {
    servi();
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    await userEvent.click(screen.getByRole('tab', { name: 'Pagamenti (1)' }));
    const nome = 'Righe correnti degli elenchi di liquidazione della domanda';
    const tabella = await screen.findByRole('table', { name: nome });
    expect(within(tabella).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Decreto',
      'Data di autorizzazione',
      'Esito',
      'Decretato',
      'Pagato',
      'Quota FEASR',
      'Quota nazionale',
      'Quota regionale',
    ]);
    const riga = within(tabella).getAllByRole('row')[1];
    // formato italiano degli importi: le migliaia si separano da 10.000 (minimumGroupingDigits 2)
    expect(riga.textContent).toMatch(/1000,00.*1050,00.*450,00/);
    const pannello = screen.getByRole('tabpanel');
    await userEvent.click(within(pannello).getByText('Colonne'));
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'Protocollo' }));
    expect(within(screen.getByRole('table', { name: nome })).getByRole('columnheader', { name: 'Protocollo' })).toBeTruthy();
    expect(within(screen.getByRole('table', { name: nome })).getByText('P-1')).toBeTruthy();
    expect(within(pannello).getByRole('checkbox', { name: 'Tipologia di elenco' })).toHaveProperty('checked', false);
  });

  it('riga esclusa: i motivi al posto del decretato, gli altri importi non si mostrano', async () => {
    const riga = PAGINA_PAGAMENTI.righe?.[0];
    servi(TUTTI, { ...DETTAGLIO, pagamenti: [{ ...riga, esito: 'ESCLUSA', motiviEsclusione: ['M01', 'M02'] }] });
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    await userEvent.click(screen.getByRole('tab', { name: 'Pagamenti (1)' }));
    const tabella = await screen.findByRole('table', { name: 'Righe correnti degli elenchi di liquidazione della domanda' });
    const celle = within(within(tabella).getAllByRole('row')[1]).getAllByRole('cell').map((c) => c.textContent);
    expect(celle).toEqual(['30/06/2025', 'Esclusa', 'Motivi di esclusione: M01, M02', '-', '-', '-', '-']);
  });

  it('Determine: la differenza fra richiesto e ammesso; ADA, provincia, comparto e spese a scelta', async () => {
    servi();
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    await userEvent.click(screen.getByRole('tab', { name: 'Determine (1)' }));
    const tabella = await screen.findByRole('table', { name: /^Determine della domanda/ });
    expect(within(tabella).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Determina',
      'Data',
      'Stato area programmazione',
      'Responsabile del procedimento',
      'Contributo richiesto',
      'Contributo ammesso',
      'Differenza',
    ]);
    expect(within(tabella).getAllByRole('row')[1].textContent).toMatch(/2000,00/);
    const pannello = screen.getByRole('tabpanel');
    await userEvent.click(within(pannello).getByText('Colonne'));
    expect(within(pannello).getAllByRole('checkbox').filter((c) => !(c as HTMLInputElement).checked).map((c) => c.parentElement?.textContent)).toEqual([
      'ADA',
      'Provincia',
      'Comparto',
      'Spesa imponibile',
      'Spesa imponibile ammessa',
    ]);
    await userEvent.click(within(pannello).getByRole('checkbox', { name: 'Spesa imponibile' }));
    expect(within(screen.getByRole('table', { name: /^Determine della domanda/ })).getByRole('columnheader', { name: 'Spesa imponibile' })).toBeTruthy();
  });
});

describe("RA004: ritorno alla ricerca di partenza e domande collegate (review v1 V-12, V-13, X-04)", () => {
  it("dopo una domanda collegata, Torna all'elenco riporta alla ricerca e alla vista di partenza", async () => {
    const letture = servi();
    const { router } = apri('/elenco-operativo/domande?intervento=SRA01');
    await screen.findByRole('table', { name: /vista generale/ });
    await userEvent.click(screen.getByRole('button', { name: 'Vista: fisico' }));
    await userEvent.click(await screen.findByRole('row', { name: "Apri l'anteprima della domanda 54230000001" }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('link', { name: 'Apri il dettaglio' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' })).toBeTruthy();
    // la domanda di sostegno e' fra le collegate: il suo codice apre la sua scheda
    await userEvent.click(await screen.findByRole('link', { name: '04230000001' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'AZIENDA AGRICOLA ROSSI' })).toBeTruthy();
    expect(letture).toEqual(['PAGAMENTO/54230000001', 'SOSTEGNO/04230000001']);
    await userEvent.click(screen.getByRole('link', { name: "Torna all'elenco" }));
    await waitFor(() => expect(indirizzo(router)).toBe('/elenco-operativo/domande?intervento=SRA01'));
    expect(await screen.findByRole('table', { name: /vista fisico/ })).toBeTruthy();
  });

  it("aperta da un link (senza ricerca di partenza) torna all'elenco senza filtri, mai fuori dall'applicazione", async () => {
    servi();
    const { router } = apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    expect(screen.getByRole('link', { name: "Torna all'elenco" }).getAttribute('href')).toBe('/elenco-operativo/domande');
    await userEvent.click(screen.getByRole('link', { name: "Torna all'elenco" }));
    await waitFor(() => expect(indirizzo(router)).toBe('/elenco-operativo/domande'));
  });

  it('la domanda di sostegno che non e fra le collegate resta testo, come nel wireframe', async () => {
    servi(TUTTI, { ...DETTAGLIO, collegate: [] });
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    expect(await screen.findByText('04230000001')).toBeTruthy();
    expect(screen.queryByRole('link', { name: '04230000001' })).toBeNull();
  });
});

describe('RA004: i link verso la scheda e verso le domande si mostrano solo col grant che li apre (review v1 A-05)', () => {
  const senza = (grant: string) => TUTTI.filter((g) => g !== grant);

  it('senza csr.tx-0058.read le anteprime non portano alla scheda', async () => {
    servi(senza('csr.tx-0058.read'));
    apri('/elenco-operativo/domande');
    await userEvent.click(await screen.findByRole('row', { name: "Apri l'anteprima della domanda 04230000001" }));
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('AZIENDA AGRICOLA ROSSI (RSSMRA80A01H501U)')).toBeTruthy();
    expect(within(dialogo).queryByRole('link', { name: 'Apri il dettaglio' })).toBeNull();
  });

  it("senza csr.tx-0058.read l'anteprima del pagamento non apre la domanda", async () => {
    servi(senza('csr.tx-0058.read'));
    apri('/elenco-operativo/pagamenti');
    const tabella = await screen.findByRole('table', { name: /Elenco operativo dei pagamenti/ });
    await userEvent.click(within(tabella).getByRole('row', { name: /pagamento D84-1/ }));
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).queryByRole('link', { name: 'Apri la domanda' })).toBeNull();
  });

  it('senza csr.tx-0056.read la scheda non porta alle altre domande del beneficiario', async () => {
    servi(['csr.tx-0058.read']);
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    expect(screen.getByRole('link', { name: "Torna all'elenco" })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Altre domande del beneficiario' })).toBeNull();
  });

  it('con csr.tx-0056.read il link alle altre domande del beneficiario porta il CUAA', async () => {
    servi();
    apri('/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    expect((await screen.findByRole('link', { name: 'Altre domande del beneficiario' })).getAttribute('href')).toBe('/elenco-operativo/domande?testo=01234567890');
  });
});
