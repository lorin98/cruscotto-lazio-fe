import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../shared/testing/axe';
import { problema } from '../../shared/testing/msw';
import { renderPagina } from '../../shared/testing/render-pagina';
import { ElencoDomande, ElencoPagamenti, SchedaDomanda } from '../../features/elenco-operativo';
import { DETTAGLIO, PAGINA_DOMANDE, PAGINA_PAGAMENTI, SINOTTICO, VALORI } from '../../features/elenco-operativo/testing/fixture';
import { useParams } from 'react-router';

// Test dei componenti dell'elenco operativo (pattern interrogazione, ADR 0029) sui wireframe approvati: dati dal server,
// totali del DTO di sintesi (mai somme della pagina), filtri nell'indirizzo, riga -> anteprima -> scheda, stati.

const TUTTI = ['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];
const profilo = (roles: string[]) =>
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p1-dirigente', roles } })));

function servi() {
  const richieste: string[] = [];
  profilo(TUTTI);
  server.use(
    http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
    http.get('*/api/elenco-operativo/domande/sinottico', ({ request }) => {
      richieste.push(`sinottico${new URL(request.url).search}`);
      return HttpResponse.json(SINOTTICO);
    }),
    http.get('*/api/elenco-operativo/domande', ({ request }) => {
      richieste.push(`domande${new URL(request.url).search}`);
      return HttpResponse.json(PAGINA_DOMANDE);
    }),
    http.get('*/api/elenco-operativo/pagamenti', ({ request }) => {
      richieste.push(`pagamenti${new URL(request.url).search}`);
      return HttpResponse.json(PAGINA_PAGAMENTI);
    }),
  );
  return richieste;
}

function PaginaScheda() {
  const { tipo, codiceABarre } = useParams();
  return <SchedaDomanda tipo={tipo} codiceABarre={codiceABarre} />;
}

describe('RA006: interrogazione libera delle domande con il sinottico sopra e i totali sotto (TX-0056, TX-0057, TX-0060)', () => {
  it('sinottico sopra e totali sotto dal server, non dalle righe della pagina', async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    expect(await screen.findByRole('heading', { level: 1, name: 'Elenco operativo delle domande' })).toBeTruthy();
    const kpi = await screen.findByRole('region', { name: 'Domande' });
    expect(kpi.textContent).toContain('1284');
    expect(kpi.textContent).toContain('di sostegno 412 - di pagamento 872');
    const tabella = await screen.findByRole('table', { name: /Elenco operativo delle domande, vista generale/ });
    expect(within(tabella).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['04230000001', '54230000001', "Totale dell'insieme filtrato: 1284 domande"]);
    // il piede porta il richiesto del sinottico (12.345.678,90), non la somma delle due righe (15.000)
    const piede = tabella.querySelector('tfoot');
    expect(piede?.textContent?.replace(/\s/g, ' ')).toContain('12.345.678,90');
    expect(piede?.textContent).not.toContain('15.000');
    // il pagato assente resta "non valorizzato", mai zero
    expect(within(tabella).getAllByText('non valorizzato').length).toBeGreaterThan(0);
  });

  it("filtri dell'indirizzo: chip con le descrizioni, tolti uno a uno; criteri mandati al server", async () => {
    const richieste = servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01&sigc=true');
    const barra = await screen.findByRole('region', { name: 'Filtri attivi' });
    expect(await within(barra).findByText(/SRA01 Produzione integrata/)).toBeTruthy();
    expect(within(barra).getByText(/solo SIGC/)).toBeTruthy();
    await waitFor(() => expect(richieste).toContain('domande?intervento=SRA01&sigc=true'));
    expect(richieste).toContain('sinottico?intervento=SRA01&sigc=true');
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro SIGC solo SIGC' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01'));
  });

  it('vista per ambito: cambiano colonne e indicatori, non le righe', async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /vista generale/ });
    await userEvent.click(screen.getByRole('button', { name: 'Vista: fisico' }));
    const tabella = await screen.findByRole('table', { name: /vista fisico/ });
    expect(within(tabella).getByRole('columnheader', { name: 'Superficie di sostegno' })).toBeTruthy();
    expect(within(tabella).getAllByRole('rowheader')).toHaveLength(3);
    expect(screen.queryByRole('region', { name: 'Richiesto' })).toBeNull();
  });

  it("riga -> anteprima -> link alla scheda della domanda", async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const riga = await screen.findByRole('row', { name: "Apri l'anteprima della domanda 04230000001" });
    await userEvent.click(riga);
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('AZIENDA AGRICOLA ROSSI (RSSMRA80A01H501U)')).toBeTruthy();
    expect(within(dialogo).getByRole('link', { name: 'Apri il dettaglio' }).getAttribute('href')).toBe('/elenco-operativo/domande/SOSTEGNO/04230000001');
  });

  it('stato vuoto con "Modifica i filtri"; errore dal problem-type', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/domande', () => HttpResponse.json({ ...PAGINA_DOMANDE, righe: [], totaleRighe: 0 })));
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    expect(await screen.findByText(/Nessuna domanda per questi filtri\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Modifica i filtri' })).toBeTruthy();
  });

  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    await expectNoA11yViolations(container);
  });
});

describe('RA006: filtri dal vivo nel pannello, senza Applica', () => {
  it('una scelta cambia subito l indirizzo; il conteggio e annunciato', async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    await userEvent.click(screen.getByRole('button', { name: /Filtri/ }));
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByRole('status').textContent).toBe('1284 domande con questi filtri');
    await userEvent.click(await within(dialogo).findByRole('button', { name: 'Solo SIGC' }));
    await waitFor(() => expect(router.state.location.search).toBe('?sigc=true'));
    await expectNoA11yViolations(dialogo);
  });

  it('il testo libero parte dopo il ritardo e solo da 3 caratteri', async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    await userEvent.click(screen.getByRole('button', { name: /Filtri/ }));
    const campo = await screen.findByRole('searchbox', { name: 'Cerca per codice a barre, CUAA o denominazione' });
    await userEvent.type(campo, 'ro');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    await userEvent.type(campo, 's');
    await waitFor(() => expect(router.state.location.search).toBe('?testo=ros'));
  });
});

describe('RA002: elenco delle domande ordinato e paginato dal server (TX-0056)', () => {
  it("ordinamento dal server col clic sull'intestazione; paginazione", async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const tabella = await screen.findByRole('table', { name: /Elenco operativo delle domande/ });
    const intestazione = within(tabella).getByRole('columnheader', { name: /Ammesso/ });
    expect(intestazione.getAttribute('aria-sort')).toBe('none');
    await userEvent.click(within(intestazione).getByRole('button'));
    await waitFor(() => expect(router.state.location.search).toBe('?ordina=ammesso%3Aasc'));
    const pagine = screen.getByRole('navigation', { name: 'Pagine dei risultati' });
    expect(pagine.textContent).toContain('Pagina 1 di 52');
    await userEvent.click(within(pagine).getByRole('button', { name: 'Pagina successiva' }));
    await waitFor(() => expect(router.state.location.search).toBe('?pagina=1&ordina=ammesso%3Aasc'));
  });
});

describe('RA002: elenco operativo dei pagamenti del perimetro (TX-0059)', () => {
  it('totali del server, domanda chiusa detta in testo e senza link alla scheda', async () => {
    servi();
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti');
    expect(await screen.findByRole('heading', { level: 1, name: 'Elenco operativo dei pagamenti' })).toBeTruthy();
    expect((await screen.findByRole('region', { name: 'Righe pagate / escluse' })).textContent).toContain('2 / 1');
    expect(screen.getByRole('region', { name: 'Decretato' }).textContent).toContain('1 riga senza importo');
    const tabella = screen.getByRole('table', { name: /Elenco operativo dei pagamenti/ });
    expect(within(tabella).getByText('Pagata (domanda chiusa)')).toBeTruthy();
    expect(screen.getByText('Perimetro: la tua area (ADA)')).toBeTruthy();
    await userEvent.click(within(tabella).getByRole('row', { name: /pagamento D84-2/ }));
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).queryByRole('link', { name: 'Apri la domanda' })).toBeNull();
    expect(within(dialogo).getByText(/La domanda è chiusa/)).toBeTruthy();
  });

  it('nessuna violazione axe', async () => {
    servi();
    const { container } = renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti');
    await screen.findByRole('table', { name: /Elenco operativo dei pagamenti/ });
    await expectNoA11yViolations(container);
  });
});

describe('RA004: scheda completa della domanda (TX-0058)', () => {
  it('h1 dalla denominazione, schede, responsabile non esposto (OP-008)', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/domande/:tipo/:codice', () => HttpResponse.json(DETTAGLIO)));
    renderPagina(PaginaScheda, '/elenco-operativo/domande/:tipo/:codiceABarre', '/elenco-operativo/domande/PAGAMENTO/54230000001');
    expect(await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' })).toBeTruthy();
    expect((await screen.findByRole('region', { name: 'Pagato' })).textContent).toContain("quota sull'ammesso: 62,5 %");
    await userEvent.click(screen.getByRole('tab', { name: 'Determine (1)' }));
    const tabella = await screen.findByRole('table', { name: 'Determine della domanda (righe aperte)' });
    expect(within(tabella).getByText("riservato ai profili dell'area procedurale")).toBeTruthy();
    await userEvent.click(screen.getByRole('tab', { name: 'Anomalie (0)' }));
    expect(await screen.findByText('Nessuna anomalia presente per questa domanda.')).toBeTruthy();
  });

  it('404: stesso messaggio per inesistente, chiusa o fuori perimetro', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/domande/:tipo/:codice', () => HttpResponse.json(problema(404, 'NOT_FOUND'), { status: 404 })));
    renderPagina(PaginaScheda, '/elenco-operativo/domande/:tipo/:codiceABarre', '/elenco-operativo/domande/SOSTEGNO/04230000099');
    expect(await screen.findByRole('heading', { level: 1, name: 'Domanda non disponibile' })).toBeTruthy();
    expect((await screen.findByRole('alert')).textContent).toContain('non esiste, è chiusa oppure è fuori dal tuo perimetro');
  });

  it('nessuna violazione axe', async () => {
    servi();
    server.use(http.get('*/api/elenco-operativo/domande/:tipo/:codice', () => HttpResponse.json(DETTAGLIO)));
    const { container } = renderPagina(PaginaScheda, '/elenco-operativo/domande/:tipo/:codiceABarre', '/elenco-operativo/domande/PAGAMENTO/54230000001');
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    await expectNoA11yViolations(container);
  });
});

describe('RA003: dai report del finanziario all elenco gia filtrato sulla selezione', () => {
  it("l'indirizzo dei link del finanziario arriva al server cosi' com'e', coi chip della selezione", async () => {
    const richieste = servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?anno=2025&annualita=PRIMA&intervento=SRA01&presentata=true');
    const barra = await screen.findByRole('region', { name: 'Filtri attivi' });
    expect(await within(barra).findByText(/SRA01 Produzione integrata/)).toBeTruthy();
    expect(within(barra).getByText(/Prima annualità/)).toBeTruthy();
    expect(within(barra).getByText(/solo le presentate/)).toBeTruthy();
    await waitFor(() => expect(richieste).toContain('domande?anno=2025&annualita=PRIMA&intervento=SRA01&presentata=true'));
    expect(richieste).toContain('sinottico?anno=2025&annualita=PRIMA&intervento=SRA01&presentata=true');
  });

  it('dai report procedurali per stato: le chiavi dei report arrivano al server, con un chip ciascuna (D-02 Rev. 2)', async () => {
    const richieste = servi();
    const ricerca = 'intervento=SRD01&statoSostegno=DECADENZA_TOTALE&statoPagamento=RILASCIATO&voceProgrammazione=AMMESSA';
    renderPagina(ElencoDomande, '/elenco-operativo/domande', `/elenco-operativo/domande?${ricerca}`);
    const barra = await screen.findByRole('region', { name: 'Filtri attivi' });
    expect(await within(barra).findByText(/DECADENZA TOTALE/)).toBeTruthy();
    expect(within(barra).getByText(/AMMESSA/)).toBeTruthy();
    await waitFor(() => expect(richieste).toContain(`domande?${ricerca}`));
    expect(richieste).toContain(`sinottico?${ricerca}`);
  });

  it("le chiavi dei report procedurali arrivano anche all'elenco dei pagamenti", async () => {
    const richieste = servi();
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti', '/elenco-operativo/pagamenti?voceProgrammazione=AMMESSA&esito=PAGATA');
    await waitFor(() => expect(richieste).toContain('pagamenti?esito=PAGATA&voceProgrammazione=AMMESSA'));
  });

  it('i parametri non dichiarati dello uiplan non passano al server', async () => {
    const richieste = servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01&inventato=1&decreto=D84');
    await waitFor(() => expect(richieste).toContain('domande?intervento=SRA01'));
    expect(richieste.some((r) => r.includes('inventato') || r.includes('decreto'))).toBe(false);
  });
});

describe("RA005: esportazione dell'elenco filtrato (CSV e XLSX dal backend)", () => {
  it("il file ha i filtri e l'ordinamento della pagina, senza pagina e dimensione, e il nome della transazione", async () => {
    servi();
    const esportazioni: Array<{ percorso: string; xrw: string | null }> = [];
    server.use(
      http.get('*/api/elenco-operativo/domande/:formato', ({ request, params }) => {
        if (params.formato !== 'csv' && params.formato !== 'xlsx') return undefined;
        const u = new URL(request.url);
        esportazioni.push({ percorso: `${u.pathname}${u.search}`, xrw: request.headers.get('X-Requested-With') });
        return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
      }),
    );
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01&pagina=2&dimensione=50&ordina=cuaa%3Adesc');
    await userEvent.click(await screen.findByRole('button', { name: "Scarica l'elenco delle domande in CSV" }));
    await waitFor(() => expect(clic).toHaveBeenCalled());
    expect(esportazioni).toEqual([{ percorso: '/api/elenco-operativo/domande/csv?intervento=SRA01&ordina=cuaa:desc', xrw: 'XMLHttpRequest' }]);
    expect((clic.mock.contexts.at(-1) as HTMLAnchorElement).download).toMatch(/tx-0056\.csv$/);
    clic.mockRestore();
  });
});
