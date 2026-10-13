import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../shared/api/mock/server';
import { graficoDi, tabellaDi, trovaCard } from '../../shared/testing/card-grafico';
import { clicSulDato } from '../../shared/testing/grafico-finto';
import { renderPagina } from '../../shared/testing/render-pagina';
import { ElencoDomande, ElencoPagamenti } from '../../features/elenco-operativo';
import { PAGINA_DOMANDE, PAGINA_PAGAMENTI, SINOTTICO, VALORI } from '../../features/elenco-operativo/testing/fixture';

// Comandi delle due interrogazioni dopo la review v1: filtri dal vivo col ritardo dichiarato (V-15, H-12, H-15),
// tastiera e focus di righe per pagina, ordinamento e chip (X-02), ordinamento attivo dichiarato (X-04), bottone
// "Colonne" (V-01), chiave di riga dei pagamenti (X-05), chip e grafici dei report procedurali (V-17, V-18).

const TUTTI = ['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];

function servi(pagamenti = PAGINA_PAGAMENTI) {
  const richieste: string[] = [];
  const registra = (nome: string, corpo: object) => ({ request }: { request: Request }) => {
    richieste.push(`${nome}${new URL(request.url).search}`);
    return HttpResponse.json(corpo);
  };
  server.use(
    http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p1-dirigente', roles: TUTTI } })),
    http.get('*/api/elenco-operativo/filtri', registra('filtri', VALORI)),
    http.get('*/api/elenco-operativo/domande/sinottico', registra('sinottico', SINOTTICO)),
    http.get('*/api/elenco-operativo/domande', registra('domande', PAGINA_DOMANDE)),
    http.get('*/api/elenco-operativo/pagamenti', registra('pagamenti', pagamenti)),
  );
  return richieste;
}

const tabellaDomande = () => screen.findByRole('table', { name: /Elenco operativo delle domande/ });

/** La pagina delle domande caricata, col pannello aperto e le ricerche nell'indirizzo registrate a ogni navigazione. */
async function pannelloAperto(indirizzo = '/elenco-operativo/domande') {
  const richieste = servi();
  const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', indirizzo);
  await tabellaDomande();
  await userEvent.click(screen.getByRole('button', { name: /Filtri/ }));
  const dialogo = await screen.findByRole('dialog');
  await within(dialogo).findByRole('button', { name: 'Solo SIGC' });
  const navigazioni: string[] = [];
  router.subscribe((s) => navigazioni.push(s.location.search));
  return { router, dialogo, navigazioni, richieste };
}

// Da qui i timer sono finti (solo setTimeout: il debounce) e il ritardo si misura al millisecondo. Gli eventi sono
// sincroni (fireEvent): l'involucro asincrono di userEvent in Testing Library aspetta un setTimeout(0) che fa avanzare
// solo coi timer finti di Jest, e coi timer finti di Vitest resterebbe fermo.
const timerFinti = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
const avanza = (ms: number) =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });
/** Un tasto alla volta, come chi scrive: ogni prefisso del testo e' un cambio del campo. */
function scrivi(campo: HTMLElement, testo: string, gia = '') {
  for (let k = 1; k <= testo.length; k++) fireEvent.change(campo, { target: { value: `${gia}${testo.slice(0, k)}` } });
}
const CERCA = { name: 'Cerca per codice a barre, CUAA o denominazione' };

describe('RA006: filtri dal vivo nel pannello, col ritardo dichiarato e senza Applica (review v1 V-15, H-12, H-15)', () => {
  afterEach(() => vi.useRealTimers());

  it("il testo parte 300 ms dopo l'ultimo tasto e solo da 3 caratteri", async () => {
    const { router, dialogo, navigazioni } = await pannelloAperto();
    timerFinti();
    const campo = within(dialogo).getByRole('searchbox', CERCA);
    scrivi(campo, 'ro');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    await avanza(1000);
    expect(navigazioni).toEqual([]);
    scrivi(campo, 's', 'ro');
    await avanza(299);
    expect(router.state.location.search).toBe('');
    await avanza(1);
    expect(router.state.location.search).toBe('?testo=ros');
    // "ro" non e' mai entrato nell'indirizzo (quindi nemmeno in una lettura)
    expect(navigazioni).toEqual(['?testo=ros']);
  });

  it("chiudere il pannello prima del ritardo porta subito il testo nell'indirizzo, senza perderlo", async () => {
    const { router, dialogo } = await pannelloAperto();
    timerFinti();
    const campo = within(dialogo).getByRole('searchbox', CERCA);
    scrivi(campo, 'rossi');
    await avanza(100);
    expect(router.state.location.search).toBe('');
    fireEvent.keyDown(campo, { key: 'Escape' });
    await avanza(0);
    expect(router.state.location.search).toBe('?testo=rossi');
  });

  it('piu scelte di fila fanno una sola navigazione (quindi una lettura), con tutte le scelte', async () => {
    const { dialogo, navigazioni } = await pannelloAperto();
    timerFinti();
    fireEvent.click(within(dialogo).getByRole('checkbox', { name: 'FROSINONE' }));
    await avanza(200);
    fireEvent.click(within(dialogo).getByRole('checkbox', { name: 'LATINA' }));
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Solo SIGC' }));
    // la bozza e' gia' nei controlli prima che parta
    expect(within(dialogo).getByRole('checkbox', { name: 'FROSINONE' })).toHaveProperty('checked', true);
    await avanza(299);
    expect(navigazioni).toEqual([]);
    await avanza(1);
    expect(navigazioni).toEqual(['?provincia=FROSINONE&provincia=LATINA&sigc=true']);
  });
});

describe('RA002: tastiera, ordinamento e colonne della tabella (review v1 X-02, X-04, V-01)', () => {
  it('righe per pagina: la scelta non sposta il focus dalla select', async () => {
    const richieste = servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await tabellaDomande();
    const select = screen.getByRole('combobox', { name: 'Righe per pagina' });
    select.focus();
    // come una freccia sulla select chiusa in Windows: il valore cambia ed emette change
    fireEvent.change(select, { target: { value: '50' } });
    await waitFor(() => expect(router.state.location.search).toBe('?dimensione=50'));
    await waitFor(() => expect(richieste).toContain('domande?dimensione=50'));
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Righe per pagina' }));
  });

  it("ordinamento: il focus resta sul bottone dell'intestazione, aria-sort e testo dicono il nuovo ordine", async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const tabella = await tabellaDomande();
    expect(screen.getByText('Ordinate per Codice a barre, crescente')).toBeTruthy();
    await userEvent.click(within(within(tabella).getByRole('columnheader', { name: /Ammesso/ })).getByRole('button'));
    await waitFor(() => expect(router.state.location.search).toBe('?ordina=ammesso%3Aasc'));
    const intestazione = within(screen.getByRole('table', { name: /Elenco operativo delle domande/ })).getByRole('columnheader', { name: /Ammesso/ });
    await waitFor(() => expect(intestazione.getAttribute('aria-sort')).toBe('ascending'));
    expect(document.activeElement).toBe(within(intestazione).getByRole('button'));
    expect(screen.getByText('Ordinate per Ammesso, crescente')).toBeTruthy();
  });

  it('ordinamento su una colonna che la vista non mostra: dichiarato accanto alla tabella, con il ritorno al predefinito', async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?ordina=liquidato%3Adesc');
    const tabella = await tabellaDomande();
    expect(within(tabella).queryByRole('columnheader', { name: /Liquidato/ })).toBeNull();
    expect(screen.getByText('Ordinate per Liquidato, decrescente')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Ordine predefinito' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(screen.queryByRole('button', { name: 'Ordine predefinito' })).toBeNull();
  });

  it('Colonne: la vista e l insieme di partenza; una colonna si nasconde e si rimostra, un altra si aggiunge', async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    await tabellaDomande();
    const colonna = (nome: RegExp) => within(screen.getByRole('table', { name: /Elenco operativo delle domande/ })).queryByRole('columnheader', { name: nome });
    await userEvent.click(screen.getByText('Colonne'));
    const pagato = screen.getByRole('checkbox', { name: 'Pagato' });
    expect(pagato).toHaveProperty('checked', true);
    expect(screen.getByRole('checkbox', { name: 'Liquidato' })).toHaveProperty('checked', false);
    await userEvent.click(pagato);
    expect(colonna(/^Pagato/)).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Pagato' }));
    expect(colonna(/^Pagato/)).toBeTruthy();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Liquidato' }));
    expect(colonna(/^Liquidato/)).toBeTruthy();
    // il codice a barre (intestazione di riga) e' fisso: non si sceglie
    expect(screen.queryByRole('checkbox', { name: 'Codice a barre' })).toBeNull();
  });

  it('togliere un chip porta il focus al chip seguente, e senza chip al bottone dei filtri', async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande', '/elenco-operativo/domande?intervento=SRA01&sigc=true');
    const barra = await screen.findByRole('region', { name: 'Filtri attivi' });
    await userEvent.click(await within(barra).findByRole('button', { name: /^Togli il filtro Intervento/ }));
    await waitFor(() => expect(document.activeElement).toBe(within(barra).getByRole('button', { name: 'Togli il filtro SIGC solo SIGC' })));
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro SIGC solo SIGC' }));
    await waitFor(() => expect(document.activeElement).toBe(within(barra).getByRole('button', { name: /^Filtri/ })));
  });
});

describe('RA002: elenco dei pagamenti, una riga per riga di elenco di liquidazione (review v1 X-05)', () => {
  it('due righe che differiscono solo per il protocollo restano due righe distinte', async () => {
    const riga = PAGINA_PAGAMENTI.righe?.[0];
    servi({ ...PAGINA_PAGAMENTI, totaleRighe: 2, righe: [riga ?? {}, { ...riga, protocollo: 'P-2' }] });
    const errori = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPagina(ElencoPagamenti, '/elenco-operativo/pagamenti');
    const tabella = await screen.findByRole('table', { name: /Elenco operativo dei pagamenti/ });
    expect(within(tabella).getAllByRole('row', { name: /pagamento D84-1/ })).toHaveLength(2);
    expect(errori.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false);
    errori.mockRestore();
  });
});

describe('RA003: chip e grafici dei report procedurali (review v1 V-17, V-18)', () => {
  it('le tre chiavi dei report: un chip ciascuna, per etichetta e valore, con gli stati in alternativa detti', async () => {
    servi();
    const ricerca = 'statoSostegno=DECADENZA_TOTALE&statoPagamento=RILASCIATO&voceProgrammazione=AMMESSA';
    renderPagina(ElencoDomande, '/elenco-operativo/domande', `/elenco-operativo/domande?${ricerca}`);
    const barra = await screen.findByRole('region', { name: 'Filtri attivi' });
    const togli = await within(barra).findAllByRole('button', { name: /^Togli il filtro/ });
    expect(togli.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Togli il filtro Stato della domanda di sostegno (report procedurale) (in alternativa agli altri stati) DECADENZA TOTALE',
      'Togli il filtro Stato della domanda di pagamento (report procedurale) (in alternativa agli altri stati) RILASCIATO',
      'Togli il filtro Stato area programmazione (report procedurale) AMMESSA',
    ]);
  });

  it("clic su una barra del grafico per stato: il filtro va nell'indirizzo ed e' annunciato", async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const card = await trovaCard('Domande per stato SIAN');
    const grafico = graficoDi(card);
    expect(grafico).toBeDefined();
    act(() => {
      if (grafico) clicSulDato(grafico, 0, 0);
    });
    expect(await screen.findByText('Filtro aggiunto: Stato SIAN Rilasciata.')).toBeTruthy();
    await waitFor(() => expect(router.state.location.search).toBe('?stato=RILASCIATO'));
  });

  it('clic sulla barra "senza stato SIAN": filtra stato=SENZA_STATO come le altre voci (review v1 V-08)', async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const grafico = graficoDi(await trovaCard('Domande per stato SIAN'));
    expect(grafico).toBeDefined();
    act(() => {
      if (grafico) clicSulDato(grafico, 0, 1);
    });
    expect(await screen.findByText('Filtro aggiunto: Stato SIAN Senza stato SIAN.')).toBeTruthy();
    await waitFor(() => expect(router.state.location.search).toBe('?stato=SENZA_STATO'));
  });

  it('tabella del grafico: "Filtra per" aggiunge lo stesso filtro, anche per la voce senza stato; ALTRI non ha il comando', async () => {
    servi();
    const { router } = renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const tabella = await tabellaDi(await trovaCard('Domande per stato SIAN'));
    expect(within(tabella).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Filtra per stato sian Rilasciata',
      'Filtra per stato sian senza stato SIAN',
    ]);
    await userEvent.click(within(tabella).getByRole('button', { name: 'Filtra per stato sian senza stato SIAN' }));
    await waitFor(() => expect(router.state.location.search).toBe('?stato=SENZA_STATO'));
    const perIntervento = await tabellaDi(await trovaCard('Domande per intervento'));
    expect(within(perIntervento).queryByRole('button', { name: /Altre voci/ })).toBeNull();
  });
});

describe('RA006: tessere del sinottico nella vista generale (review v1 V-09, V-10)', () => {
  it('Pagato con la quota pagata, Ancora da pagare con liquidato e recuperato; un aggregato senza importo dice perche', async () => {
    servi();
    renderPagina(ElencoDomande, '/elenco-operativo/domande');
    const pagato = await screen.findByRole('region', { name: 'Pagato' });
    expect(pagato.textContent).toContain("quota pagata sull'ammesso: 55");
    const ancora = screen.getByRole('region', { name: 'Ancora da pagare' });
    expect(ancora.textContent).toMatch(/liquidato 5\.000\.000,00.* - recuperato non calcolabile/);
    // nel piede della vista finanziaria (che ha la colonna Recuperato) lo stesso testo d'aggregato, mai "non valorizzato"
    await userEvent.click(screen.getByRole('button', { name: 'Vista: finanziario' }));
    const piede = (await screen.findByRole('table', { name: /vista finanziario/ })).querySelector('tfoot');
    expect(piede?.textContent).toContain('non calcolabile');
    expect(piede?.textContent).not.toContain('non valorizzato');
  });
});
