// Test della regola comune dei filtri del programma nell'indirizzo (entities/filtri: useFiltriProgrammaNellIndirizzo e
// useBozzaFiltri), il solo test della regola X-03 (review del fisico H2): finanziario e fisico la compongono con la loro
// lettura dei valori (TX-0001, TX-0060) e la loro scrittura dell'indirizzo. Profilo dal server MSW dei test.
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri, useBozzaFiltri, useFiltriProgrammaNellIndirizzo } from '../src/entities/filtri';
import type { Filtri, LetturaValoriFiltri } from '../src/entities/filtri';
import { clientDiTest } from '../src/shared/testing/render';

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
