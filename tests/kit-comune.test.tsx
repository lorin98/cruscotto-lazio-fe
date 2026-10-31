// Kit comune portato fuori dalle feature per il fisico (shared/ui ed entities/filtri): testata della pagina e di
// dettaglio, file CSV e XLSX del backend, totali su piu' righe della tabella interattiva, nome accessibile del KPI, gruppi
// del pannello del programma e controlli del pannello dei filtri (il solo test dei controlli: review del fisico H1); la
// tabella a confronto delle card della Home (rework 2 della card istituzionale, 31/10/2026). Dati di prova inventati.
import { createRef } from 'react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { BarraRiferimenti, Briciole, Caselle, ConfrontoArea, Gruppo, Kpi, PulsantiScarica, Scelte, TabellaInterattiva, TestaPagina, TestataDettaglio, scaricamentiDalBackend } from '../src/shared/ui';
import type { ColonnaConfronto, ColonnaTabella } from '../src/shared/ui';
import { GruppiProgramma } from '../src/entities/filtri';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

vi.mock('../src/shared/ui/salva-file', async (originale) => ({ ...(await originale<typeof import('../src/shared/ui/salva-file')>()), salvaFile: vi.fn() }));

function inRouter(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  return render(<RouterProvider router={router} />);
}

describe('Testata della pagina (Briciole e TestaPagina del kit)', () => {
  it('Home e le voci, l ultima corrente; il titolo prende il focus e da il nome al documento', async () => {
    inRouter(
      <>
        <Briciole voci={[{ etichetta: 'Fisico', a: '/fisico/superfici' }, { etichetta: 'Determine di una domanda' }]} />
        <TestaPagina titolo="Determine di una domanda" titoloDocumento="Determine di una domanda - Fisico" sottotitolo="Sotto" />
      </>,
    );
    const percorso = screen.getByRole('navigation', { name: 'Percorso' });
    expect(within(percorso).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/', '/fisico/superfici']);
    expect(within(percorso).getByText('Determine di una domanda').getAttribute('aria-current')).toBe('page');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Determine di una domanda' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Determine di una domanda - Fisico - Cruscotto CSR 2023-2027');
    await expectNoA11yViolations(document.body);
  });
});

describe('TestataDettaglio: la testata delle pagine di dettaglio (scheda della domanda, determine)', () => {
  it('sopratitolo, un solo h1 col ref che nomina la sezione, badge in testo e azioni; senza dati il solo h1', async () => {
    const h1 = createRef<HTMLHeadingElement>();
    const { rerender } = inRouter(<TestataDettaglio idTitolo="t-prova" titolo="Determine della domanda 1" h1={h1} sopratitolo="Domanda di pagamento 1" badge={['Domanda corrente', '3 determine']} azioni={<a href="/x">Apri</a>} />);
    const sezione = screen.getByRole('region', { name: 'Determine della domanda 1' });
    expect(within(sezione).getByText('Domanda di pagamento 1')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Dati principali' })).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Domanda corrente', '3 determine']);
    expect(within(sezione).getByRole('link', { name: 'Apri' })).toBeTruthy();
    expect(h1.current).toBe(screen.getByRole('heading', { level: 1, name: 'Determine della domanda 1' }));
    expect(h1.current?.tabIndex).toBe(-1);
    await expectNoA11yViolations(document.body);
    rerender(<TestataDettaglio idTitolo="t-prova" titolo="Determine di una domanda" h1={h1} />);
    expect(screen.queryByRole('list', { name: 'Dati principali' })).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('region', { name: 'Determine di una domanda' }).children).toHaveLength(1);
  });
});

describe('scaricamentiDalBackend: CSV e XLSX dal backend', () => {
  it('un file per formato col nome dalla base, nell ordine dato; il messaggio proprio solo se passato', async () => {
    const esporta = vi.fn(() => Promise.resolve(new Blob(['a;b'])));
    const s = scaricamentiDalBackend({ base: 'Superfici TX-0018', esporta });
    expect(s.map((x) => [x.formato, x.file])).toEqual([
      ['CSV', 'superfici-tx-0018.csv'],
      ['XLSX', 'superfici-tx-0018.xlsx'],
    ]);
    expect(s[0].messaggioErrore).toBeUndefined();
    await s[1].scarica();
    expect(esporta).toHaveBeenCalledWith('xlsx');
    const messaggio = () => 'troppe righe';
    const ordinati = scaricamentiDalBackend({ base: 'x', esporta, formati: ['xlsx', 'csv'], messaggioErrore: messaggio });
    expect(ordinati.map((x) => x.formato)).toEqual(['XLSX', 'CSV']);
    expect(ordinati[0].messaggioErrore).toBe(messaggio);
  });

  it("l'errore del file dice il messaggio proprio", async () => {
    const s = scaricamentiDalBackend({ base: 'x', esporta: () => Promise.reject(new Error('no')), messaggioErrore: () => 'La tabella supera il limite.' });
    render(<PulsantiScarica oggetto="la tabella X" scaricamenti={s} />);
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella X in CSV' }));
    expect((await screen.findByRole('alert')).textContent).toBe('File CSV non scaricato. La tabella supera il limite.');
  });
});

describe('TabellaInterattiva: piu righe di totali (un totale per campagna)', () => {
  interface R {
    k: string;
    anno: number;
    v: number;
  }
  const colonne: ColonnaTabella<R>[] = [
    { chiave: 'k', titolo: 'Codice', valore: (r) => r.k, fissa: true },
    { chiave: 'anno', titolo: 'Anno', valore: (r) => r.anno },
    { chiave: 'v', titolo: 'Valore', valore: (r) => r.v, numerica: true },
  ];
  const righe: R[] = [
    { k: 'A', anno: 2024, v: 1 },
    { k: 'A', anno: 2025, v: 2 },
    { k: 'B', anno: 2025, v: 3 },
  ];
  it('le righe di totali restituite stanno nel piede, calcolate sulle righe trovate', async () => {
    const totali = (rr: readonly R[]) =>
      [2025, 2024].flatMap((anno) => {
        const di = rr.filter((r) => r.anno === anno);
        return di.length ? [{ k: `Totale ${anno}`, anno: String(anno), v: String(di.reduce((a, r) => a + r.v, 0)) }] : [];
      });
    render(<TabellaInterattiva caption="Prova" righe={righe} colonne={colonne} chiaveRiga={(r) => `${r.k}${r.anno}`} testoRicerca={(r) => r.k} totali={totali} />);
    const piede = () => screen.getAllByRole('rowgroup')[2];
    expect(within(piede()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['Totale 2025', 'Totale 2024']);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'B');
    expect(within(piede()).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['Totale 2025']);
  });
});

describe('Kpi: nome accessibile con le sigle sciolte', () => {
  it('il nome contiene l etichetta visibile (WCAG 2.5.3); senza, il nome e l etichetta', () => {
    render(
      <>
        <Kpi etichetta="Superficie ammissibile DS" nomeAccessibile="Superficie ammissibile DS: superficie delle domande di sostegno" valore="15,50 ha" icona="it-map-marker" />
        <Kpi etichetta="Domande" valore="3" icona="it-files" />
      </>,
    );
    expect(screen.getByRole('region', { name: 'Superficie ammissibile DS: superficie delle domande di sostegno' }).textContent).toContain('15,50 ha');
    expect(screen.getByRole('region', { name: 'Domande' })).toBeTruthy();
  });
});

describe('GruppiProgramma: i gruppi del pannello del programma (entities/filtri)', () => {
  it('con i valori: interventi a caselle, obiettivi a chip, azione disabilitata con la spiegazione senza il legame', async () => {
    const imposta = vi.fn(() => vi.fn());
    const { container } = render(
      <GruppiProgramma
        valori={{ interventi: [{ chiave: 'SRB01', descrizione: 'Montagna' }], obiettiviSpecifici: [{ chiave: 'OS4', descrizione: null }], obiettiviGenerali: ['OG2'], obiettiviPolicy: ['OP1'], azioniPortanti: [], legameAzioniDisponibile: false }}
        bozza={{ intervento: ['SRB01'] }}
        imposta={imposta}
      />,
    );
    expect((screen.getByRole('checkbox', { name: 'SRB01 Montagna' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('button', { name: 'OS4' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('senza i valori (senzaVoci): i gruppi vuoti lo dicono in testo, nessuna spiegazione sul legame che non si conosce', () => {
    render(<GruppiProgramma valori={{ interventi: [{ chiave: 'SRB01' }] }} bozza={{}} imposta={() => () => undefined} senzaVoci="Nessuna voce: valori dei filtri non disponibili." />);
    expect(screen.getAllByText('Nessuna voce: valori dei filtri non disponibili.')).toHaveLength(4);
    expect(screen.queryByText(/Non disponibile finché/)).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'SRB01' })).toBeTruthy();
  });
});

describe('Controlli del pannello dei filtri (kit: Gruppo, Caselle, Scelte)', () => {
  it('Gruppo: il titolo dice quanti valori sono scelti; aperto o chiuso', () => {
    const { rerender } = render(
      <Gruppo titolo="Intervento" scelti={1} aperto>
        <p>corpo</p>
      </Gruppo>,
    );
    const gruppo = screen.getByText('Intervento', { selector: 'summary' }).closest('details');
    expect(gruppo?.open).toBe(true);
    expect(gruppo?.textContent).toContain('1 scelto');
    rerender(
      <Gruppo titolo="Intervento" scelti={2}>
        <p>corpo</p>
      </Gruppo>,
    );
    expect(screen.getByText('Intervento', { selector: 'summary' }).closest('details')?.open).toBe(false);
    expect(screen.getByText('2 scelti')).toBeTruthy();
  });

  it('Caselle: oltre 8 voci la ricerca (senza maiuscole e accenti), la ricerca fallita detta, codice e descrizione o etichetta', async () => {
    const onCambia = vi.fn();
    const opzioni = Array.from({ length: 10 }, (_, n) => ({ valore: `SRD${String(n + 1).padStart(2, '0')}`, descrizione: n === 0 ? 'Qualità' : `Prova ${n + 1}` }));
    const { container } = render(<Caselle id="c" etichetta="Intervento" opzioni={opzioni} scelti={['SRD02']} segnaposto="Cerca per codice o descrizione" onCambia={onCambia} />);
    const cerca = screen.getByRole('searchbox', { name: 'Cerca in Intervento' });
    expect(cerca.getAttribute('placeholder')).toBe('Cerca per codice o descrizione');
    expect(screen.queryByText('Nessuna voce corrisponde alla ricerca.')).toBeNull();
    await userEvent.click(screen.getByRole('checkbox', { name: 'SRD01 Qualità' }));
    expect(onCambia).toHaveBeenLastCalledWith(['SRD02', 'SRD01']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'SRD02 Prova 2' }));
    expect(onCambia).toHaveBeenLastCalledWith([]);
    await userEvent.type(cerca, 'QUALITA');
    expect(screen.getAllByRole('checkbox').map((c) => c.closest('label')?.textContent)).toEqual(['SRD01 Qualità']);
    await userEvent.clear(cerca);
    await userEvent.type(cerca, 'nessuno');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText('Nessuna voce corrisponde alla ricerca.')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('Caselle: la lista vuota dice il testo dato, o nulla (mai una ricerca fallita); disabilitate col fieldset; con l etichetta', () => {
    const { rerender, container } = render(<Caselle id="v" etichetta="Ente" opzioni={[]} scelti={[]} vuoto="Nessun valore nel tuo perimetro." onCambia={() => undefined} />);
    expect(screen.getByText('Nessun valore nel tuo perimetro.')).toBeTruthy();
    expect(screen.queryByRole('searchbox')).toBeNull();
    rerender(<Caselle id="v" etichetta="Ente" opzioni={[]} scelti={[]} onCambia={() => undefined} />);
    expect(container.textContent).toBe('Ente');
    rerender(<Caselle id="v" etichetta="Azione portante" opzioni={[{ valore: '3', etichetta: '3 - Azione di prova' }]} scelti={[]} disabilitato onCambia={() => undefined} />);
    expect(container.querySelector('fieldset')?.disabled).toBe(true);
    expect(screen.getByRole('checkbox', { name: '3 - Azione di prova' })).toBeTruthy();
  });

  it('Scelte: chip ripetibili o a scelta singola (ri-clic toglie), testo dall etichetta o codice - descrizione', async () => {
    const onCambia = vi.fn();
    const { rerender } = render(<Scelte etichetta="OS" opzioni={[{ valore: 'OS4', descrizione: 'Clima' }, { valore: 'OS5' }]} scelti={['OS4']} onCambia={onCambia} />);
    const gruppo = screen.getByRole('group', { name: 'OS' });
    expect(within(gruppo).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['OS4 - Clima', 'true'],
      ['OS5', 'false'],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'OS5' }));
    expect(onCambia).toHaveBeenLastCalledWith(['OS4', 'OS5']);
    rerender(<Scelte etichetta="Campagna" opzioni={[{ valore: '', etichetta: 'Tutte le campagne' }, { valore: '2025', etichetta: '2025' }]} scelti={['']} esclusive onCambia={onCambia} />);
    await userEvent.click(screen.getByRole('button', { name: '2025' }));
    expect(onCambia).toHaveBeenLastCalledWith(['2025']);
    await userEvent.click(screen.getByRole('button', { name: 'Tutte le campagne' }));
    expect(onCambia).toHaveBeenLastCalledWith([]);
  });
});

describe('BarraRiferimenti: la barra dei riferimenti del dettaglio (review del riallineamento FIS-06, prima nel fisico e nell istituzionale)', () => {
  const ULTIMI = [{ flusso: 'PROSA_DS04', conclusoIl: '2026-03-02T10:00:00Z' }];

  it('la pill del perimetro e "Dati al" in una regione nominata, senza filtri; nessuna violazione axe', async () => {
    const { container } = render(<BarraRiferimenti perimetro="Perimetro: regionale" ultimi={ULTIMI} inErrore={false} />);
    const barra = screen.getByRole('region', { name: 'Riferimenti dei dati' });
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Ultimo dato sincronizzato: dati al 02\/03\/2026/ })).toBeTruthy();
    expect(within(barra).queryByRole('button', { name: /^Filtri/ })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('prima delle risposte nessuna pill; con tutte le letture in errore "Dati al" dice che il dato non c e', () => {
    const { rerender } = render(<BarraRiferimenti perimetro={undefined} ultimi={undefined} inErrore={false} />);
    expect(screen.getByRole('region', { name: 'Riferimenti dei dati' }).textContent).toBe('');
    rerender(<BarraRiferimenti perimetro="Perimetro: regionale (i report istituzionali non hanno perimetro ADA)" ultimi={undefined} inErrore />);
    expect(screen.getByText('Perimetro: regionale (i report istituzionali non hanno perimetro ADA)')).toBeTruthy();
    expect(screen.getByText('Ultimo dato sincronizzato: non disponibile')).toBeTruthy();
  });
});

describe('ConfrontoArea: la tabella a confronto delle card della Home (rework 2 della card istituzionale, 31/10/2026)', () => {
  const RIGHE = [
    { chiave: 'conteggio', etichetta: 'Domande', formato: (v: number) => `${v} domande` },
    // lo spazio fisso prima dell'unita', come formatEuro
    { chiave: 'importo', etichetta: 'Spesa', formato: (v: number) => `${v}\u00a0euro` },
    { chiave: 'solo-b', etichetta: 'Pagate', formato: String },
  ];
  const A = {
    chiave: 'a',
    titolo: 'Fonte A',
    nomeNelTesto: 'fonte A',
    dettaglio: 'cumulativi',
    senzaDato: { righe: ['solo-b'], testo: 'dato non confrontabile nella fonte A' },
  };
  const PRONTA_A: ColonnaConfronto = { ...A, stato: 'pronta', celle: { conteggio: { valore: 3 }, importo: { valore: null, motivo: 'manca per 1 intervento' } } };
  const cella = (riga: string, indice: number) => screen.getByRole('rowheader', { name: riga }).closest('tr')?.querySelectorAll('td')[indice]?.textContent;

  it('intestazioni di riga e di colonna, valori col formato della riga, non disponibile col motivo sotto la tabella, trattino della riga senza dato; axe', async () => {
    const B: ColonnaConfronto = { chiave: 'b', titolo: 'Fonte B', stato: 'pronta', celle: { conteggio: { valore: 10 }, importo: { valore: 2.5 }, 'solo-b': { valore: 7 } } };
    const { container } = render(<ConfrontoArea titolo="Due fonti a confronto" righe={RIGHE} colonne={[PRONTA_A, B]} />);
    const tabella = screen.getByRole('table', { name: 'Due fonti a confronto' });
    expect(within(tabella).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Fonte A (cumulativi)', 'Fonte B']);
    expect(within(tabella).getByRole('columnheader', { name: 'Fonte A (cumulativi)' })).toBeTruthy();
    // review A-01: lo spazio fisso prima dell'unita' diventa normale, cosi' l'unita' puo' andare a capo
    expect([cella('Domande', 0), cella('Domande', 1), cella('Spesa', 0), cella('Spesa', 1), cella('Pagate', 0), cella('Pagate', 1)]).toEqual(['3 domande', '10 domande', 'non disponibile', '2.5 euro', '—dato non confrontabile nella fonte A', '7']);
    // il trattino per gli occhi, il perche' solo per i lettori di schermo (review X-05)
    expect(within(tabella).getByText('—').getAttribute('aria-hidden')).toBe('true');
    expect(within(tabella).getByText('dato non confrontabile nella fonte A').className).toBe('visually-hidden');
    // il motivo con riga e colonna (col nome della colonna nelle frasi), fuori dalla cella; nessuna attesa annunciata
    expect(screen.getByText('Spesa, fonte A: manca per 1 intervento')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('colonna in attesa: scheletro nelle sue celle (non nelle righe che non ha) e un solo annuncio; colonna fallita: non disponibile senza motivo', () => {
    const { rerender } = render(<ConfrontoArea titolo="T" righe={RIGHE} colonne={[{ ...A, stato: 'attesa' }, { chiave: 'b', titolo: 'Fonte B', stato: 'attesa' }]} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(document.querySelectorAll('td .ui-skeleton')).toHaveLength(5);
    expect(cella('Pagate', 0)).toBe('—dato non confrontabile nella fonte A');
    rerender(<ConfrontoArea titolo="T" righe={RIGHE} colonne={[{ ...A, stato: 'errore' }]} />);
    expect([cella('Domande', 0), cella('Spesa', 0), cella('Pagate', 0)]).toEqual(['non disponibile', 'non disponibile', '—dato non confrontabile nella fonte A']);
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelectorAll('.ui-ambito__nota')).toHaveLength(0);
  });

  it('colonna pronta senza la cella di una riga: non disponibile, mai uno scheletro che non finisce (review H-02)', () => {
    render(<ConfrontoArea titolo="T" righe={RIGHE} colonne={[{ chiave: 'b', titolo: 'Fonte B', stato: 'pronta', celle: { conteggio: { valore: 1 } } }]} />);
    expect([cella('Domande', 0), cella('Spesa', 0), cella('Pagate', 0)]).toEqual(['1 domande', 'non disponibile', 'non disponibile']);
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelectorAll('td .ui-skeleton')).toHaveLength(0);
  });
});
