// esempio.ts — dati DI ESEMPIO dell'istituzionale per il dev server con MSW (npm run dev): valori INVENTATI e
// deterministici, nella forma dei DTO della spec (TX-0016, TX-0015), con le assenze dei dati reali (dati di programma
// NON_VALORIZZATO di un intervento SIGC, ANNO_NON_CONSERVATO dell'avviso per un anno diverso dal file piu' recente,
// indicatori e output NON_VALORIZZATO per un anno senza file, FONTE_AMBIGUA di una riga in entrambi i monitoraggi, la
// previsione di pagamento SIGC da fonte non attiva). Il mock fa da server: righe in ordine di codice, filtrate per
// intervento e obiettivi (azione portante senza legame: nessuna riga), per TX-0016 l'anno di riferimento
// (SC-IS_SMP_ANNO) e per TX-0015 l'esercizio; i file CSV e XLSX sono un testo d'esempio. L'output regionale (TX-0017) e'
// del fisico dal 29/10/2026.
// I valori dei filtri (TX-0060) sono quelli d'esempio dell'elenco operativo. Solo il worker del browser li usa
// (browser.ts li raccoglie per convenzione di percorso); i test hanno le loro fixture.
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import { PROBLEM_TYPES } from '../../../../shared/api/problem/problem-types';

const ULTIMI = [{ flusso: 'ASR2_DS20', conclusoIl: '2026-03-02T09:30:00Z' }];
/** Un dato col motivo dell'assenza (DatoMotivato della spec): il valore, oppure null col motivo. */
type Dato = { valore: unknown; motivo: string | null; fonte: null };
const v = (valore: unknown): Dato => ({ valore, motivo: null, fonte: null });
const NV: Dato = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
const ANNO: Dato = { valore: null, motivo: 'ANNO_NON_CONSERVATO', fonte: null };
const AMBIGUA: Dato = { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null };
const OBIETTIVI: Record<string, string[]> = { SRA01: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRA16: ['OS5', 'OG1'] };

/** Un intervento col file NOSIGC 2025 e l'avviso (come SRD01 degli scenari del backend): dati di programma e conti veri. */
const CON_FILE = {
  indicatoreOutput: v('O.20'),
  indicatoreRisultato: v('R.9'),
  avvisiAttivati: v(2),
  avvisiChiusi: v(1),
  azioniAttivate: v(3),
  dotazioneAvvisi: v(2000000),
  chiusuraUltimoAvvisoAperto: v('2025-03-31'),
  domandeRicevute: 3,
  valoreDomandeRicevute: v(180000),
  domandeRicevuteSenzaRichiesto: 1,
  domandeFinanziate: 2,
  valoreDomandeFinanziate: v(160000),
  outputAttesoFinanziate: v(40),
  domandeSaldate: 1,
  anticipiErogati: v(20000),
  spesaErogata: v(90000),
  outputErogato: v(12),
  includeTopUp: v(true),
  importoTopUp: v(150000),
  concessioniPreviste: v(false),
};

/** Un intervento SIGC, senza file NOSIGC ne' avviso: dati di programma NON_VALORIZZATO, zero domande e zero spesa non SIGC. */
const SENZA_FILE: typeof CON_FILE = {
  indicatoreOutput: NV,
  indicatoreRisultato: NV,
  avvisiAttivati: NV,
  avvisiChiusi: NV,
  azioniAttivate: NV,
  dotazioneAvvisi: NV,
  chiusuraUltimoAvvisoAperto: NV,
  domandeRicevute: 0,
  valoreDomandeRicevute: v(0),
  domandeRicevuteSenzaRichiesto: 0,
  domandeFinanziate: 0,
  valoreDomandeFinanziate: v(0),
  outputAttesoFinanziate: NV,
  domandeSaldate: 0,
  anticipiErogati: v(0),
  spesaErogata: v(0),
  outputErogato: NV,
  includeTopUp: NV,
  importoTopUp: NV,
  concessioniPreviste: NV,
};

const verifica = (codiceIntervento: string, conFile: boolean, dati: Partial<typeof CON_FILE> = {}) => ({ codiceIntervento, ...(conFile ? CON_FILE : SENZA_FILE), ...dati });

const VERIFICA = [verifica('SRA01', false), verifica('SRA16', true, { outputErogato: AMBIGUA }), verifica('SRD01', true)];

/** SC-IS_SMP_ANNO: l'avviso porta i dati del file 2025 (tutti i suoi dati, anche avvisi e concessioni: SC-IS_SMP_SENZA_FONTE). */
const AVVISO_DI_UN_ALTRO_ANNO = { avvisiAttivati: ANNO, avvisiChiusi: ANNO, azioniAttivate: ANNO, dotazioneAvvisi: ANNO, chiusuraUltimoAvvisoAperto: ANNO, includeTopUp: ANNO, importoTopUp: ANNO, concessioniPreviste: ANNO };
/** Un anno senza file NOSIGC (gli esempi hanno i file 2024 e 2025): indicatori e output NON_VALORIZZATO. */
const SENZA_FILE_DELL_ANNO = { indicatoreOutput: NV, indicatoreRisultato: NV, outputAttesoFinanziate: NV, outputErogato: NV };

/** La riga per l'anno chiesto: com'e' col 2025; altrimenti l'avviso di un altro anno (se c'e') e, senza file, niente indicatori. */
function rigaDellAnno(r: (typeof VERIFICA)[number], anno: string): (typeof VERIFICA)[number] {
  if (anno === '2025') return r;
  return { ...r, ...(r.dotazioneAvvisi.valore === null ? {} : AVVISO_DI_UN_ALTRO_ANNO), ...(anno === '2024' ? {} : SENZA_FILE_DELL_ANNO) };
}

/** Un dato col motivo FONTE_NON_ATTIVA e la fonte attesa (la previsione di pagamento di TX-0015, D-11 del backend). */
const fna = (fonte: string) => ({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte });

/** TX-0015 (verifica SMP SIGC): una riga per intervento, i conteggi veri e i dati col motivo dell'assenza. */
const sigc = (codiceIntervento: string, base: number) => ({
  codiceIntervento,
  avvisiAttivati: v(2),
  azioniAttivate: NV,
  domandeRicevute: base,
  domandeRicevuteSenzaRichiesto: 4,
  valoreDomandeRicevute: v(base * 3000),
  domandeFinanziate: Math.round(base * 0.6),
  valoreDomandeFinanziate: v(base * 2000),
  dotazioneAnnoPrecedente: v(base * 2500),
  dotazionePeriodoImpegno: v(base * 10000),
  domandePagateEsercizio: Math.round(base * 0.4),
  spesaErogataCampagnaPrecedente: v(base * 1200),
  spesaErogataCampagneAnteriori: v(base * 900),
  previsionePagamentoEsercizio: fna('PREVISIONE_PAGAMENTO'),
  importoTopUp: v(0),
  includeTopUp: v(false),
  ettariUbaRichiesti: null,
  outputAttesoFinanziate: null,
  outputErogatoEsercizio: null,
  indicatoreOutput: null,
  indicatoreRisultato: null,
});

const VERIFICA_SIGC = [sigc('SRA01', 120), sigc('SRA16', 40), sigc('SRD01', 75)];

/** Le righe dei filtri: dimensioni insieme, valori dello stesso filtro in alternativa; azione senza legame: nessuna. */
function filtra<R extends { codiceIntervento: string }>(righe: readonly R[], p: URLSearchParams): R[] {
  if (p.getAll('azione').length > 0) return [];
  const interventi = p.getAll('intervento');
  const obiettivi = ['os', 'og', 'op'].map((k) => p.getAll(k)).filter((x) => x.length > 0);
  return righe.filter((r) => (interventi.length === 0 || interventi.includes(r.codiceIntervento)) && obiettivi.every((x) => x.some((o) => (OBIETTIVI[r.codiceIntervento] ?? []).includes(o))));
}

function rispostaVerifica(p: URLSearchParams) {
  const anno = p.get('anno');
  if (anno !== null && !/^\d{4}$/.test(anno)) return HttpResponse.json({ type: PROBLEM_TYPES.DATO_NON_VALIDO, title: 'Errore', status: 400, errorCode: 'DATO_NON_VALIDO', detail: 'anno: valore non ammesso' }, { status: 400 });
  const righe = filtra(VERIFICA, p).map((r) => (anno === null ? r : rigaDellAnno(r, anno)));
  return HttpResponse.json({ annoRiferimento: anno === null ? 2025 : Number(anno), perimetro: 'REGIONALE', outputCumulativo: true, righe, ultimiDatiSincronizzati: ULTIMI });
}

const file = () => new HttpResponse('Esempio;dati inventati\n', { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });

export const handlersEsempio: RequestHandler[] = [
  http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', file),
  http.get('*/api/istituzionale/verifica-smp-sigc/:formato', file),
  http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => rispostaVerifica(new URL(request.url).searchParams)),
  http.get('*/api/istituzionale/verifica-smp-sigc', ({ request }) => {
    const p = new URL(request.url).searchParams;
    const esercizio = Number(p.get('esercizio') ?? 2025);
    return HttpResponse.json({ perimetro: 'REGIONALE', esercizio, annoDomande: esercizio - 1, pagamentiSenzaData: 3, righe: filtra(VERIFICA_SIGC, p), ultimiDatiSincronizzati: ULTIMI });
  }),
];
