// Test della regola comune dei filtri del programma nell'indirizzo (entities/filtri: useFiltriProgrammaNellIndirizzo e
// useBozzaFiltri), il solo test della regola X-03 (review del fisico H2): finanziario, fisico e istituzionale la
// compongono con la loro lettura dei valori (TX-0001, TX-0060) e la loro scrittura dell'indirizzo. Poi il pannello comune
// con le voci di TX-0060 (fisico, istituzionale), il pannello della pagina col focus dopo "Applica i filtri" e la pagina
// del dettaglio dell'intervento col codice non valido. Profilo dal server MSW dei test.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, RouterProvider, createMemoryRouter, useLocation } from 'react-router';
import { ID_TITOLO_INTERVENTO, InterventoNonValido, PannelloFiltriProgramma, ValoriFiltriNonDisponibili, filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useBozzaFiltri, useFiltriProgrammaNellIndirizzo, usePannelloConFocus } from '../src/entities/filtri';
import type { Filtri, LetturaValoriFiltri, ValoriProgramma } from '../src/entities/filtri';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { clientDiTest, renderConQuery } from '../src/shared/testing/render';

const posizione = { attuale: '' };

function Spia() {
  const l = useLocation();
  posizione.attuale = `${l.pathname}${l.search}`;
  return null;
}

function inIndirizzo(iniziale: string) {
  const client = clientDiTest();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[iniziale]}>
        {children}
        <Spia />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function usaRegola(iniziale: string, valori: LetturaValoriFiltri, conValori = true) {
  return renderHook(
    (p: { valori: LetturaValoriFiltri }) =>
      useFiltriProgrammaNellIndirizzo<Filtri>({ leggi: filtriDaRicerca, scrivi: (f) => ricercaDaFiltri(f), attivi: filtriNellaBarra, conValori, valori: p.valori, nessuno: {} }),
    { initialProps: { valori }, wrapper: inIndirizzo(iniziale) },
  );
}

const IN_CORSO: LetturaValoriFiltri = { data: undefined, isError: false };

describe('entities/filtri: regola del filtro per azione portante senza il legame (X-03)', () => {
  it('finche i valori non rispondono un indirizzo con l azione e in attesa; senza il legame l azione non si applica e il chip lo dice', async () => {
    const { result, rerender } = usaRegola('/report?os=OS4&azione=3', IN_CORSO);
    expect(result.current.inAttesa).toBe(true);
    rerender({ valori: { data: { legameAzioniDisponibile: false }, isError: false } });
    await waitFor(() => expect(result.current.inAttesa).toBe(false));
    expect(result.current.filtri).toEqual({ os: ['OS4'] });
    expect(result.current.chip.map((c) => [c.chiave, c.valore])).toEqual([
      ['os:OS4', 'OS4'],
      ['azione:3', '3 (non applicato: il legame con le azioni portanti viene da una fonte non attiva)'],
    ]);
  });

  it('col legame l azione si applica; senza azione nell indirizzo non si aspetta', async () => {
    const col = usaRegola('/report?azione=3', { data: { legameAzioniDisponibile: true }, isError: false });
    await waitFor(() => expect(col.result.current.inAttesa).toBe(false));
    expect(col.result.current.filtri).toEqual({ azione: ['3'] });
    expect(col.result.current.chip[0].valore).toBe('3');
    const senza = usaRegola('/report?os=OS4', IN_CORSO);
    expect(senza.result.current.inAttesa).toBe(false);
  });

  it('senza il grant dei valori, o con i valori in errore, il legame non si conosce e l azione va al backend com e', async () => {
    const senzaGrant = usaRegola('/report?azione=3', IN_CORSO, false);
    await waitFor(() => expect(senzaGrant.result.current.inAttesa).toBe(false));
    expect(senzaGrant.result.current.filtri).toEqual({ azione: ['3'] });
    const inErrore = usaRegola('/report?azione=3', { data: undefined, isError: true });
    await waitFor(() => expect(inErrore.result.current.inAttesa).toBe(false));
    expect(inErrore.result.current.filtri).toEqual({ azione: ['3'] });
  });

  it('un chip tolto e Togli tutti riscrivono l indirizzo con la scrittura della feature', async () => {
    const { result } = usaRegola('/report?intervento=SRB01&os=OS4', { data: { legameAzioniDisponibile: true }, isError: false });
    act(() => result.current.chip[0].onTogli?.());
    await waitFor(() => expect(posizione.attuale).toBe('/report?os=OS4'));
    act(() => result.current.togliTutti());
    await waitFor(() => expect(posizione.attuale).toBe('/report'));
  });
});

describe('entities/filtri: la regola senza l azione portante (senzaAzione, il procedurale RF024: review H3)', () => {
  it('nessuna lettura dei valori da passare e nessuna attesa, anche col profilo in caricamento; chip e Togli tutti come sempre', async () => {
    const { result } = renderHook(() => useFiltriProgrammaNellIndirizzo<Filtri>({ leggi: filtriDaRicerca, scrivi: (f) => ricercaDaFiltri(f), attivi: filtriNellaBarra, senzaAzione: true, nessuno: {} }), {
      wrapper: inIndirizzo('/report?os=OS4&azione=3'),
    });
    // al primo render il profilo e' ancora in caricamento: con l'azione portante la pagina aspetterebbe
    expect(result.current.inAttesa).toBe(false);
    expect(result.current.chip.map((c) => [c.chiave, c.valore])).toEqual([
      ['os:OS4', 'OS4'],
      ['azione:3', '3'],
    ]);
    act(() => result.current.togliTutti());
    await waitFor(() => expect(posizione.attuale).toBe('/report'));
  });

  it('la regola "senza l azione non si aspetta" e scritta una volta: il legame si chiede solo coi parametri con l azione (H3 iter2)', () => {
    const sorgente = readFileSync(resolve(process.cwd(), 'src/entities/filtri/ui/useFiltriProgrammaNellIndirizzo.ts'), 'utf8');
    expect(sorgente).toContain('function legameIgnoto(profiloIgnoto: boolean, p: ConAzione): boolean');
    expect(sorgente).not.toMatch(/if \(p\.senzaAzione\) return/);
  });
});

describe('entities/filtri: bozza del pannello (useBozzaFiltri)', () => {
  it('a ogni apertura riparte dai criteri applicati; imposta toglie una dimensione senza valori', () => {
    const { result, rerender } = renderHook((p: { aperto: boolean; applicati: Filtri }) => useBozzaFiltri(p.aperto, p.applicati), { initialProps: { aperto: false, applicati: { os: ['OS4'] } } });
    rerender({ aperto: true, applicati: { os: ['OS4'] } });
    act(() => result.current.imposta('intervento')(['SRB01']));
    expect(result.current.bozza).toEqual({ os: ['OS4'], intervento: ['SRB01'] });
    act(() => result.current.imposta('os')([]));
    expect(result.current.bozza).toEqual({ intervento: ['SRB01'], os: undefined });
    // chiuso senza applicare e riaperto: la bozza riparte dai criteri applicati
    rerender({ aperto: false, applicati: { os: ['OS4'] } });
    rerender({ aperto: true, applicati: { os: ['OS4'] } });
    expect(result.current.bozza).toEqual({ os: ['OS4'] });
  });
});

describe('entities/filtri: pannello dei filtri del programma con le voci di TX-0060 (PannelloFiltriProgramma)', () => {
  type ConAnno = Filtri & { anno?: number };
  const stato = (data: ValoriProgramma | undefined, isError = false) => ({ data, isPending: data === undefined && !isError, isError, fetchStatus: 'idle' as const, error: null, refetch: () => undefined });
  function apri(valori: Parameters<typeof PannelloFiltriProgramma<ConAnno>>[0]['valori'], criteri: ConAnno = {}, senzaAzione = false) {
    const onApplica = vi.fn();
    render(
      <PannelloFiltriProgramma<ConAnno>
        aperto
        senzaAzione={senzaAzione}
        titolo="Filtri di prova"
        criteri={criteri}
        valori={valori}
        codiciRisposta={['SRD01']}
        nessuno={{ anno: 2025 }}
        onApplica={onApplica}
        onChiudi={() => undefined}
        nota="Nota della pagina."
        altriGruppi={(bozza, setBozza) => (
          <button type="button" onClick={() => setBozza((b) => ({ ...b, anno: 2024 }))}>
            {`Anno ${bozza.anno ?? 'nessuno'}`}
          </button>
        )}
      />,
    );
    return { onApplica, dialogo: screen.getByRole('dialog', { name: 'Filtri di prova' }) };
  }

  it('senza il grant (valori null): lo stato in testo, i codici della risposta, i gruppi della pagina sulla bozza e Azzera ai criteri dati', async () => {
    const { onApplica, dialogo } = apri(null, { os: ['OS4'] });
    expect(within(dialogo).getByRole('status').textContent).toMatch(/^Valori dei filtri non disponibili/);
    expect(within(dialogo).getByRole('checkbox', { name: 'SRD01' })).toBeTruthy();
    expect(within(dialogo).getByText('Nota della pagina.')).toBeTruthy();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Anno nessuno' }));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenLastCalledWith({ os: ['OS4'], anno: 2024 });
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Azzera' }));
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenLastCalledWith({ anno: 2025 });
  });

  it('valori in caricamento: lo scheletro; senza il legame Applica toglie l azione portante', async () => {
    const inCorso = apri(stato(undefined));
    expect(within(inCorso.dialogo).getByText('Caricamento dei valori dei filtri…')).toBeTruthy();
    cleanup();
    const { onApplica, dialogo } = apri(stato({ interventi: [{ chiave: 'SRD01', descrizione: 'Investimenti' }], legameAzioniDisponibile: false }), { azione: ['3'], os: ['OS4'] });
    expect(within(dialogo).getByRole('checkbox', { name: 'SRD01 Investimenti' })).toBeTruthy();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Applica i filtri' }));
    expect(onApplica).toHaveBeenLastCalledWith({ os: ['OS4'] });
  });

  it('senzaAzione (procedurale, RF024): niente gruppo dell azione portante, lo stato senza valori non la nomina', () => {
    const conVoci = apri(stato({ interventi: [{ chiave: 'SRD01', descrizione: 'Investimenti' }], obiettiviGenerali: ['OG2'] }), {}, true);
    expect(within(conVoci.dialogo).queryByText('Azione portante')).toBeNull();
    expect(within(conVoci.dialogo).getByText('Obiettivo generale (OG)')).toBeTruthy();
    cleanup();
    const { dialogo } = apri(null, {}, true);
    expect(within(dialogo).getByRole('status').textContent).toBe(
      "Valori dei filtri non disponibili: Intervento propone i codici delle righe della risposta, senza descrizione; gli obiettivi non hanno voci. I filtri già nell'indirizzo restano e il report si legge comunque.",
    );
    expect(within(dialogo).queryByText('Azione portante')).toBeNull();
  });
});

describe('entities/filtri: ValoriFiltriNonDisponibili con piu letture dei valori (procedurale: TX-0024 e TX-0025)', () => {
  it('lo stato con la prima lettura in errore; Riprova rilegge tutte quelle in errore; nessuno stato senza errori o senza letture', async () => {
    const h1 = createRef<HTMLHeadingElement>();
    const lettura = (isError: boolean, refetch = vi.fn()) => ({ data: isError ? undefined : {}, isPending: false, isError, fetchStatus: 'idle' as const, error: null, refetch });
    const [prima, seconda] = [lettura(true), lettura(true)];
    const { rerender } = render(<ValoriFiltriNonDisponibili letture={[prima, null, seconda, lettura(false)]} h1={h1} />);
    await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect([prima.refetch.mock.calls.length, seconda.refetch.mock.calls.length]).toEqual([1, 1]);
    rerender(<ValoriFiltriNonDisponibili letture={[lettura(false), null]} h1={h1} />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<ValoriFiltriNonDisponibili letture={[]} h1={h1} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('entities/filtri: pannello della pagina e focus dopo Applica i filtri (usePannelloConFocus, review H4)', () => {
  /** Una pagina minima: l'h1, lo stato del pannello e i comandi che lo aprono e lo applicano. */
  function Pagina({ criteri, applica }: { criteri: Filtri; applica: (f: Filtri) => void }) {
    const { h1, pannello, apri, chiudi, onApplica, applicaConFocus } = usePannelloConFocus(criteri, applica, ricercaDaFiltri);
    return (
      <>
        <h1 ref={h1} tabIndex={-1}>
          Titolo
        </h1>
        <p>{`pannello ${pannello ?? 'chiuso'}`}</p>
        <button type="button" onClick={() => apri('barra')}>
          Filtri
        </button>
        <button type="button" onClick={() => apri('vuoto')}>
          Modifica i filtri
        </button>
        <button type="button" onClick={() => onApplica({ os: ['OS4'] })}>
          Applica OS4
        </button>
        <button type="button" onClick={() => onApplica(criteri)}>
          Applica gli stessi
        </button>
        <button type="button" onClick={() => applicaConFocus({ intervento: ['SRB01'] })}>
          Mostra solo SRB01
        </button>
        <button type="button" onClick={chiudi}>
          Chiudi
        </button>
      </>
    );
  }

  it('dallo stato vuoto con criteri nuovi il focus va sull h1; con criteri invariati o dalla barra resta sul comando', async () => {
    const applica = vi.fn();
    render(<Pagina criteri={{}} applica={applica} />);
    const h1 = screen.getByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    expect(screen.getByText('pannello vuoto')).toBeTruthy();
    const stessi = screen.getByRole('button', { name: 'Applica gli stessi' });
    await userEvent.click(stessi);
    expect(screen.getByText('pannello chiuso')).toBeTruthy();
    expect(applica).toHaveBeenLastCalledWith({});
    expect(document.activeElement).toBe(stessi);
    await userEvent.click(screen.getByRole('button', { name: 'Filtri' }));
    const os4 = screen.getByRole('button', { name: 'Applica OS4' });
    await userEvent.click(os4);
    expect(applica).toHaveBeenLastCalledWith({ os: ['OS4'] });
    expect(document.activeElement).toBe(os4);
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    await userEvent.click(os4);
    expect(screen.getByText('pannello chiuso')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(h1));
  });

  it('applicaConFocus (un comando che sparisce col contenuto) applica e porta il focus sull h1; Chiudi chiude', async () => {
    const applica = vi.fn();
    render(<Pagina criteri={{}} applica={applica} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mostra solo SRB01' }));
    expect(applica).toHaveBeenLastCalledWith({ intervento: ['SRB01'] });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 })));
    await userEvent.click(screen.getByRole('button', { name: 'Filtri' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chiudi' }));
    expect(screen.getByText('pannello chiuso')).toBeTruthy();
    expect(applica).toHaveBeenCalledTimes(1);
  });
});

describe('InterventoNonValido: la pagina del dettaglio dell intervento col codice del percorso non valido (H2 iter2, prima nel kit)', () => {
  it('InterventoNonValido: il percorso con l area, un solo h1 col focus (id del titolo dei due dettagli) e il titolo del documento, l avviso col suggerimento', async () => {
    const pagina = <InterventoNonValido area="Area" ingresso="/area" suggerimento="Scegli dalla panoramica." titoloDocumento="Intervento non valido - Area" />;
    const router = createMemoryRouter([{ path: '/', element: pagina }], { initialEntries: ['/'] });
    const { container } = renderConQuery(<RouterProvider router={router} />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Intervento non valido' });
    await waitFor(() => expect(document.activeElement).toBe(h1));
    expect(h1.id).toBe(ID_TITOLO_INTERVENTO);
    expect(document.title).toBe('Intervento non valido - Area - Cruscotto CSR 2023-2027');
    expect(screen.getByRole('navigation', { name: 'Percorso' }).textContent).toBe('HomeAreaIntervento');
    expect(screen.getByRole('link', { name: 'Area' }).getAttribute('href')).toBe('/area');
    expect(screen.getByRole('alert').textContent).toBe("Il codice nell'indirizzo non è un codice di intervento: nessun dato richiesto. Scegli dalla panoramica.");
    await expectNoA11yViolations(container);
  });


  it('sta nell entity accanto a codiceDelPercorso: il kit non la esporta piu', async () => {
    expect(ID_TITOLO_INTERVENTO).toBe('t-intervento');
    expect(Object.keys(await import('../src/shared/ui'))).not.toContain('IntestazioneNonValida');
  });
});
