// Kit comune portato fuori dalle feature (o esteso) per l'istituzionale: selettore d'anno e anno della pagina
// nell'indirizzo (shared/ui, prima nel finanziario), link verso l'elenco operativo (entities/domanda, prima nel
// finanziario), riga sotto il sottotitolo della testata, card del grafico senza PNG o col nome dei file, messaggio del
// file oltre il limite dell'esportazione, interruttore a piu' scelte, stato vuoto coi filtri e badge di un'assenza (prima
// nel fisico e nel finanziario). Dati di prova inventati.
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AxiosError, AxiosHeaders } from 'axios';
import { AvvisoAggiornamento, CardGrafico, Interruttore,InterruttoreVista, OLTRE_IL_LIMITE_DELL_ESPORTAZIONE, SelettoreAnno, TestaPagina, Vuoto, VuotoConFiltri, messaggioOltreIlLimite, useAnnoNellIndirizzo } from '../src/shared/ui';
import { AssenzaMotivata, BadgeAssenza } from '../src/entities/importo';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import type { DatiGrafico, Scaricamento } from '../src/shared/ui';
import { SelettoreAnno as SelettoreFinanziario } from '../src/features/finanziario/ui/SelettoreAnno';
import { ApriNellElenco as ApriFinanziario } from '../src/features/finanziario/ui/LinkElenco';
import { ApriNellElenco } from '../src/entities/domanda';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

describe('SelettoreAnno del kit: select con Mostra, gli anni e la voce senza anno di chi lo usa', () => {
  it('la scelta si applica solo con Mostra; la voce vuota vale nessun anno; l aiuto e collegato alla select', async () => {
    const onCambia = vi.fn();
    const { container } = render(<SelettoreAnno id="f-anno" etichetta="Anno di riferimento" aiuto="Facoltativo." anni={[2024, 2025]} voceVuota="Ultimo anno con un file (predefinito)" anno={undefined} onCambia={onCambia} />);
    const select = screen.getByRole('combobox', { name: 'Anno di riferimento' });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Ultimo anno con un file (predefinito)', '2024', '2025']);
    expect(select.getAttribute('aria-describedby')).toBe('f-anno-aiuto');
    expect(document.getElementById('f-anno-aiuto')?.textContent).toBe('Facoltativo.');
    await userEvent.selectOptions(select, '2024');
    expect(onCambia).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenLastCalledWith(2024);
    await userEvent.selectOptions(select, '');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenLastCalledWith(undefined);
    await expectNoA11yViolations(container);
  });

  it('il finanziario lo usa con gli anni del periodo CSR e "Scegli un anno" (stesso comportamento di prima)', () => {
    render(<SelettoreFinanziario id="f-es" etichetta="Esercizio finanziario" aiuto="Obbligatorio." tipo="esercizio" anno={2031} onCambia={() => undefined} />);
    const voci = screen.getAllByRole('option').map((o) => o.textContent);
    expect(voci[0]).toBe('Scegli un anno');
    expect(voci.slice(1)).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031']);
  });
});

describe('useAnnoNellIndirizzo del kit: l anno della pagina nella query string', () => {
  function Prova() {
    const [anno, imposta] = useAnnoNellIndirizzo('anno');
    return (
      <>
        <p>{`anno ${anno ?? 'nessuno'}`}</p>
        <button type="button" onClick={() => imposta(2024)}>
          2024
        </button>
        <button type="button" onClick={() => imposta(undefined)}>
          togli
        </button>
      </>
    );
  }

  it('un valore non valido vale nessun anno; la scelta lascia i filtri e sostituisce la voce di cronologia', async () => {
    const router = createMemoryRouter([{ path: '*', Component: Prova }], { initialEntries: ['/altra', '/report?intervento=SRD01&anno=abc'], initialIndex: 1 });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('anno nessuno')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01&anno=2024'));
    expect(screen.getByText('anno 2024')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'togli' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01'));
    // replace: tornando indietro si arriva alla pagina di prima, non alle scelte d'anno
    void router.navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).toBe('/altra'));
  });
});

describe('ApriNellElenco di entities/domanda: il link di drill-down verso l elenco operativo (prima nel finanziario)', () => {
  it('nome accessibile completo che contiene il testo visibile; senza indirizzo nulla; il finanziario riesporta lo stesso', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <>
              <ApriNellElenco variante="testo" indirizzo="/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01" descrizione="le domande di sostegno correnti dell'intervento SRD01" />
              <ApriNellElenco variante="testo" indirizzo="/elenco-operativo/pagamenti?esito=PAGATA" testo="Apri nei pagamenti" descrizione="le righe pagate non SIGC dell'intervento SRD01" />
              <ApriNellElenco indirizzo={null} descrizione="nessuna" />
            </>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    const { container } = render(<RouterProvider router={router} />);
    const link = screen.getAllByRole('link');
    expect(link.map((l) => [l.textContent, l.getAttribute('aria-label'), l.getAttribute('href')])).toEqual([
      ["Apri nell'elenco", "Apri nell'elenco operativo le domande di sostegno correnti dell'intervento SRD01", '/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01'],
      ['Apri nei pagamenti', "Apri nei pagamenti: apri nell'elenco operativo le righe pagate non SIGC dell'intervento SRD01", '/elenco-operativo/pagamenti?esito=PAGATA'],
    ]);
    expect(link[0].className).toBe('ui-link-elenco');
    expect(ApriFinanziario).toBe(ApriNellElenco);
    await expectNoA11yViolations(container);
  });
});

describe('Estensioni del kit per l istituzionale: riga sotto il sottotitolo e card del grafico senza PNG o col nome dei file', () => {
  const DATI: DatiGrafico = {
    opzioni: { series: [{ type: 'bar', data: [1] }] },
    tabella: { caption: 'Tabella equivalente', colonne: ['Anno', 'Valore'], righe: [['2024', '1']] },
    omessi: [],
  };
  const csv: Scaricamento = { formato: 'CSV', scarica: () => undefined, file: 'prova.csv' };

  it('TestaPagina: la nota (anche con un link) sta sotto il sottotitolo, nella stessa testata', () => {
    const router = createMemoryRouter([{ path: '*', element: <TestaPagina titolo="Titolo" titoloDocumento="Titolo" sottotitolo="Sotto" nota={<a href="/altra">Altra area</a>} /> }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    const testata = screen.getByRole('heading', { level: 1, name: 'Titolo' }).parentElement;
    expect(Array.from(testata?.querySelectorAll('p') ?? []).map((p) => p.textContent)).toEqual(['Sotto', 'Altra area']);
  });

  it('CardGrafico: senzaPng toglie il PNG e lascia gli altri file; oggetto da il nome ai pulsanti', () => {
    const { rerender } = render(<CardGrafico titolo="Mini grafico" dati={DATI} fonte="Fonte" senzaPng />);
    expect(screen.queryByRole('group', { name: /^Scarica/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    rerender(<CardGrafico titolo="Output per anno" dati={DATI} fonte="Fonte" scaricamenti={[csv]} oggetto="l'output dell'intervento SRA01" />);
    expect(screen.getAllByRole('button', { name: /^Scarica/ }).map((b) => b.getAttribute('aria-label'))).toEqual(["Scarica l'output dell'intervento SRA01 in PNG", "Scarica l'output dell'intervento SRA01 in CSV"]);
    rerender(<CardGrafico titolo="Output per anno" dati={DATI} fonte="Fonte" scaricamenti={[csv]} />);
    expect(screen.getAllByRole('button', { name: /^Scarica/ }).map((b) => b.getAttribute('aria-label'))).toEqual(['Scarica il grafico Output per anno in PNG', 'Scarica il grafico Output per anno in CSV']);
  });
});

describe('messaggioOltreIlLimite del kit: il file oltre il limite dell esportazione (prima nel fisico)', () => {
  it('il 400 DATO_NON_VALIDO sul problem-type ha il testo per esteso; gli altri errori il messaggio del problem-type', () => {
    const errore = (status: number, type: string) => new AxiosError('x', undefined, undefined, undefined, { status, data: { type, title: 'Errore', status, errorCode: 'X' }, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } });
    expect(messaggioOltreIlLimite(errore(400, PROBLEM_TYPES.DATO_NON_VALIDO))).toBe(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE);
    expect(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE).toBe("La tabella supera il limite dell'esportazione (5.000 righe o 50.000 celle): restringi i filtri e riprova.");
    expect(messaggioOltreIlLimite(errore(400, 'about:blank'))).toBeNull();
    expect(messaggioOltreIlLimite(errore(503, PROBLEM_TYPES.CAPACITA_ESAURITA))).toBeNull();
    expect(messaggioOltreIlLimite(new Error('rete'))).toBeNull();
  });
});

describe('Interruttore, VuotoConFiltri e BadgeAssenza: kit per le tre misure dell output e gli stati (prima nel fisico)', () => {
  it('Interruttore: una sola scelta premuta, il clic sceglie e il focus resta sul bottone; InterruttoreVista ci sta sopra', async () => {
    const onScelta = vi.fn();
    const opzioni = [
      { valore: 'a', etichetta: 'Prima' },
      { valore: 'b', etichetta: 'Seconda' },
      { valore: 'c', etichetta: 'Terza' },
    ] as const;
    const { container, rerender } = render(<Interruttore etichetta="Misura mostrata" opzioni={opzioni} scelta="a" onScelta={onScelta} className="mb-3" />);
    const gruppo = screen.getByRole('group', { name: 'Misura mostrata' });
    expect(gruppo.className).toBe('ui-seg mb-3');
    expect(screen.getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Prima', 'true'],
      ['Seconda', 'false'],
      ['Terza', 'false'],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Terza' }));
    expect(onScelta).toHaveBeenLastCalledWith('c');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Terza' }));
    await expectNoA11yViolations(container);
    rerender(<InterruttoreVista etichetta="Vista" vista="tabella" onVista={() => undefined} />);
    expect(screen.getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Grafico', 'false'],
      ['Tabella', 'true'],
    ]);
  });

  it('AvvisoAggiornamento (prima nell elenco operativo): role=status sempre montato, il testo solo durante l aggiornamento', () => {
    const { rerender } = render(<AvvisoAggiornamento attivo={false} testo="Lettura in corso." />);
    const stato = screen.getByRole('status');
    expect([stato.textContent, stato.className]).toEqual(['', 'visually-hidden']);
    rerender(<AvvisoAggiornamento attivo testo="Lettura in corso." />);
    expect(screen.getByRole('status')).toBe(stato);
    expect([stato.textContent, stato.className]).toEqual(['Lettura in corso.', 'ui-aggiornamento']);
    rerender(<AvvisoAggiornamento attivo />);
    expect(stato.textContent).toBe('Aggiornamento dei risultati: restano visibili quelli precedenti finché arrivano i nuovi.');
  });

  it('VuotoConFiltri: il testo e Modifica i filtri; BadgeAssenza: la stessa forma di AssenzaMotivata con una resa data', async () => {
    const onModifica = vi.fn();
    render(
      <>
        <Vuoto>
          <VuotoConFiltri onModifica={onModifica}>Nessun intervento.</VuotoConFiltri>
        </Vuoto>
        <p data-testid="badge">
          <BadgeAssenza resa={{ disponibile: false, testo: 'non valorizzato', nota: 'nessun target' }} />
        </p>
        <p data-testid="motivata">
          <AssenzaMotivata dato={{ motivo: 'NON_VALORIZZATO' }} />
        </p>
      </>,
    );
    expect(screen.getByRole('status').textContent).toBe('Nessun intervento.Modifica i filtri');
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    expect(onModifica).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('badge').innerHTML).toBe('<span><span class="badge bg-secondary me-1">non valorizzato</span><span class="small">nessun target</span></span>');
    expect(screen.getByTestId('motivata').textContent).toBe('non valorizzatoil dato non è presente nella fonte');
  });
});
