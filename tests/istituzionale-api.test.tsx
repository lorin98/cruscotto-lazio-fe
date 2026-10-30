import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { problema } from '../src/shared/testing/msw';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import { eProblema } from '../src/shared/api/problem/e-problema';
import { OLTRE_IL_LIMITE_DELL_ESPORTAZIONE, messaggioOltreIlLimite } from '../src/shared/ui';
import { handlersEsempio } from '../src/features/istituzionale/api/mock/esempio';
import * as Api from '../src/features/istituzionale/api';
import { esportaVerificaSmpNonSigc, esportaVerificaSmpSigc, useValoriFiltri, useVerificaSmpNonSigc, useVerificaSmpSigc } from '../src/features/istituzionale/api';
import { useValoriFiltri as useValoriFiltriFisico } from '../src/features/fisico/api';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const VERIFICA = { annoRiferimento: 2025, perimetro: 'REGIONALE', outputCumulativo: true, righe: [], ultimiDatiSincronizzati: [] };
const VERIFICA_SIGC = { perimetro: 'REGIONALE', esercizio: 2025, annoDomande: 2024, pagamentiSenzaData: 0, righe: [], ultimiDatiSincronizzati: [] };

describe('feature istituzionale, wrapper api (step3) su MSW', () => {
  it('useVerificaSmpNonSigc manda i filtri ripetuti e l anno di riferimento (TX-0016)', async () => {
    let query = '';
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(VERIFICA);
      }),
    );
    const { result } = renderHook(() => useVerificaSmpNonSigc({ intervento: ['SRD01', 'SRA01'], os: ['OS4'], anno: 2024 }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRD01&intervento=SRA01&os=OS4&anno=2024');
    expect(result.current.data?.annoRiferimento).toBe(2025);
  });

  it('useVerificaSmpSigc manda i filtri ripetuti e l esercizio (TX-0015, dal finanziario il 29/10/2026)', async () => {
    let query = '';
    server.use(
      http.get('*/api/istituzionale/verifica-smp-sigc', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(VERIFICA_SIGC);
      }),
    );
    const { result } = renderHook(() => useVerificaSmpSigc({ intervento: ['SRA01'], og: ['OG1'], op: ['OP2'], azione: ['3'] }, 2025), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toBe('?intervento=SRA01&og=OG1&op=OP2&azione=3&esercizio=2025');
    expect(result.current.data?.annoDomande).toBe(2024);
  });

  it('le letture non abilitate, e la verifica SIGC senza esercizio, non chiamano il backend', () => {
    const verifica = renderHook(() => useVerificaSmpNonSigc({}, { abilitato: false }), { wrapper: wrapper() });
    const sigc = renderHook(() => useVerificaSmpSigc({}, 2025, { abilitato: false }), { wrapper: wrapper() });
    const senzaEsercizio = renderHook(() => useVerificaSmpSigc({}, undefined), { wrapper: wrapper() });
    expect(verifica.result.current.fetchStatus).toBe('idle');
    expect(sigc.result.current.fetchStatus).toBe('idle');
    expect(senzaEsercizio.result.current.fetchStatus).toBe('idle');
  });

  it('il 400 DATO_NON_VALIDO si riconosce dal problem-type, non dal solo status', async () => {
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'anno: valore non ammesso'), { status: 400 })));
    const nonValido = renderHook(() => useVerificaSmpNonSigc({ anno: 2025 }), { wrapper: wrapper() });
    await waitFor(() => expect(nonValido.result.current.isError).toBe(true));
    expect(eProblema(nonValido.result.current.error, 'invalid-data')).toBe(true);
    // un 400 senza il problem-type del contratto non e' DATO_NON_VALIDO
    server.use(http.get('*/api/istituzionale/verifica-smp-sigc', () => new HttpResponse(null, { status: 400 })));
    const senzaTipo = renderHook(() => useVerificaSmpSigc({}, 2025), { wrapper: wrapper() });
    await waitFor(() => expect(senzaTipo.result.current.isError).toBe(true));
    expect(eProblema(senzaTipo.result.current.error, 'invalid-data')).toBe(false);
    // review H3: il riconoscimento e' quello comune, la feature non ha un suo predicato senza consumatori
    expect(Object.keys(Api)).not.toContain('rispostaDatoNonValido');
  });

  it('i valori dei filtri sono la lettura comune di TX-0060: stessa cache del fisico e dell elenco (decisione G2)', async () => {
    let letture = 0;
    server.use(
      http.get('*/api/elenco-operativo/filtri', () => {
        letture += 1;
        return HttpResponse.json({ perimetro: 'REGIONALE', interventi: [{ chiave: 'SRD01', descrizione: 'Investimenti produttivi' }] });
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    const istituzionale = renderHook(() => useValoriFiltri(), { wrapper: wrapper(client) });
    await waitFor(() => expect(istituzionale.result.current.isSuccess).toBe(true));
    const fisico = renderHook(() => useValoriFiltriFisico(), { wrapper: wrapper(client) });
    expect(fisico.result.current.data?.interventi?.[0]?.chiave).toBe('SRD01');
    expect(letture).toBe(1);
    expect(useValoriFiltri).toBe(useValoriFiltriFisico);
  });

  it("le esportazioni chiedono il file del formato con gli stessi criteri delle letture (D-07), con X-Requested-With", async () => {
    const richieste: string[] = [];
    const registra = ({ request }: { request: Request }) => {
      const u = new URL(request.url);
      richieste.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
      return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
    };
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', registra), http.get('*/api/istituzionale/verifica-smp-sigc/:formato', registra));
    expect(await esportaVerificaSmpNonSigc('csv', { intervento: ['SRD01'], anno: 2025 })).toBeInstanceOf(Blob);
    expect(await esportaVerificaSmpSigc('xlsx', { intervento: ['SRD01'], os: ['OS4'], esercizio: 2025 })).toBeInstanceOf(Blob);
    expect(richieste).toEqual([
      '/api/istituzionale/verifica-smp-non-sigc/csv?intervento=SRD01&anno=2025 XMLHttpRequest',
      '/api/istituzionale/verifica-smp-sigc/xlsx?intervento=SRD01&os=OS4&esercizio=2025 XMLHttpRequest',
    ]);
  });

  it("il 400 dell'esportazione oltre il limite si riconosce dal corpo JSON del Blob d'errore", async () => {
    server.use(http.get('*/api/istituzionale/verifica-smp-sigc/:formato', () => HttpResponse.json(problema(400, 'DATO_NON_VALIDO', 'oltre 5000 righe'), { status: 400 })));
    const errore = await esportaVerificaSmpSigc('csv', { esercizio: 2025 }).catch((e: unknown) => e);
    expect(eProblema(errore, 'invalid-data')).toBe(true);
    // il percorso che l'utente vede: il testo del kit sotto i pulsanti
    expect(messaggioOltreIlLimite(errore)).toBe(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE);
  });
});

describe('feature istituzionale: i dati di prima durante la lettura di un altro anno (dettaglio dell intervento)', () => {
  it('con mantieniDati la risposta di prima resta (placeholderData) finche arriva quella del nuovo anno; senza, no', async () => {
    server.use(http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => HttpResponse.json({ ...VERIFICA, annoRiferimento: Number(new URL(request.url).searchParams.get('anno')) })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const con = renderHook((p: { anno: number }) => useVerificaSmpNonSigc({ anno: p.anno }, { mantieniDati: true }), { initialProps: { anno: 2025 }, wrapper: wrapper(client) });
    await waitFor(() => expect(con.result.current.data?.annoRiferimento).toBe(2025));
    con.rerender({ anno: 2024 });
    expect(con.result.current.data?.annoRiferimento).toBe(2025);
    expect(con.result.current.isPlaceholderData).toBe(true);
    await waitFor(() => expect(con.result.current.data?.annoRiferimento).toBe(2024));
    const senza = renderHook((p: { anno: number }) => useVerificaSmpNonSigc({ anno: p.anno }), { initialProps: { anno: 2023 }, wrapper: wrapper(client) });
    await waitFor(() => expect(senza.result.current.data?.annoRiferimento).toBe(2023));
    senza.rerender({ anno: 2022 });
    expect(senza.result.current.data).toBeUndefined();
  });
});

// il mock del dev server risponde come il backend: righe dei filtri, anno con i dati dell'avviso del file piu' recente
describe('mock di esempio del dev server dell istituzionale', () => {
  it('righe filtrate per intervento e obiettivi, nessuna con l azione; ANNO_NON_CONSERVATO con un altro anno; 400 per un anno non valido', async () => {
    server.use(...handlersEsempio);
    type Motivo = { motivo: string | null };
    type Riga = { codiceIntervento: string; dotazioneAvvisi?: Motivo; avvisiAttivati?: Motivo; avvisiChiusi?: Motivo; concessioniPreviste?: Motivo; indicatoreOutput?: Motivo; outputErogato?: Motivo };
    const leggi = async (q: string) => (await (await fetch(`http://localhost/api/istituzionale/${q}`)).json()) as { righe: Riga[]; annoRiferimento?: number; esercizio?: number };

    expect((await leggi('verifica-smp-non-sigc?os=OS4')).righe.map((r) => r.codiceIntervento)).toEqual(['SRD01']);
    expect((await leggi('verifica-smp-sigc?esercizio=2025&azione=3')).righe).toEqual([]);
    const sigc = await leggi('verifica-smp-sigc?esercizio=2024&intervento=SRA01&intervento=SRA16');
    expect([sigc.esercizio, ...sigc.righe.map((r) => r.codiceIntervento)]).toEqual([2024, 'SRA01', 'SRA16']);
    const anno2024 = await leggi('verifica-smp-non-sigc?anno=2024&intervento=SRD01');
    expect([anno2024.annoRiferimento, anno2024.righe[0].dotazioneAvvisi?.motivo]).toEqual([2024, 'ANNO_NON_CONSERVATO']);
    // SC-IS_SMP_ANNO (review V3): tutti i dati dell'avviso, anche avvisi e concessioni; senza file niente indicatori
    expect([anno2024.righe[0].avvisiAttivati?.motivo, anno2024.righe[0].concessioniPreviste?.motivo, anno2024.righe[0].indicatoreOutput?.motivo]).toEqual(['ANNO_NON_CONSERVATO', 'ANNO_NON_CONSERVATO', null]);
    const anno2023 = await leggi('verifica-smp-non-sigc?anno=2023&intervento=SRD01');
    expect([anno2023.righe[0].indicatoreOutput?.motivo, anno2023.righe[0].outputErogato?.motivo, anno2023.righe[0].avvisiChiusi?.motivo]).toEqual(['NON_VALORIZZATO', 'NON_VALORIZZATO', 'ANNO_NON_CONSERVATO']);
    // le righe in ordine di codice, come il backend
    expect((await leggi('verifica-smp-non-sigc')).righe.map((r) => r.codiceIntervento)).toEqual(['SRA01', 'SRA16', 'SRD01']);
    const nonValido = await fetch('http://localhost/api/istituzionale/verifica-smp-non-sigc?anno=abc');
    expect(nonValido.status).toBe(400);
    expect(await nonValido.json()).toMatchObject({ type: PROBLEM_TYPES.DATO_NON_VALIDO });
    expect((await fetch('http://localhost/api/istituzionale/verifica-smp-sigc/csv?esercizio=2025')).status).toBe(200);
  });
});
