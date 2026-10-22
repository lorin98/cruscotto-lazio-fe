// Kit comune portato fuori dalle feature per il fisico (shared/ui ed entities/filtri): testata della pagina, file CSV e
// XLSX del backend, totali su piu' righe della tabella interattiva, nome accessibile del KPI, gruppi del pannello del
// programma. Dati di prova inventati.
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Briciole, Kpi, PulsantiScarica, TabellaInterattiva, TestaPagina, scaricamentiDalBackend } from '../src/shared/ui';
import type { ColonnaTabella } from '../src/shared/ui';
import { GruppiProgramma } from '../src/entities/filtri';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

vi.mock('../src/shared/ui/salva-file', async (originale) => ({ ...(await originale<typeof import('../src/shared/ui/salva-file')>()), salvaFile: vi.fn() }));

function inRouter(ui: React.ReactElement) {
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
