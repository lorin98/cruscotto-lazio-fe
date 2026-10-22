// esempio.ts — dati DI ESEMPIO dell'istituzionale per il dev server con MSW (npm run dev): valori INVENTATI e
// deterministici, nella forma dei DTO della spec (TX-0016, TX-0017), con le assenze dei dati reali (dati di programma
// NON_VALORIZZATO di un intervento SIGC, ANNO_NON_CONSERVATO dell'avviso per un anno diverso dal file piu' recente,
// FONTE_AMBIGUA di una riga in entrambi i monitoraggi). Il mock fa da server: filtra per intervento e obiettivi (azione
// portante senza legame: nessuna riga) e, per TX-0016, l'anno di riferimento; i file CSV e XLSX sono un testo d'esempio.
// I valori dei filtri (TX-0060) sono quelli d'esempio dell'elenco operativo. Solo il worker del browser li usa
// (browser.ts li raccoglie per convenzione di percorso); i test hanno le loro fixture.
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import { PROBLEM_TYPES } from '../../../../shared/api/problem/problem-types';

const ULTIMI = [{ flusso: 'ASR2_DS20', conclusoIl: '2026-03-02T09:30:00Z' }];
const v = (valore: unknown) => ({ valore, motivo: null, fonte: null });
const NV = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
const ANNO = { valore: null, motivo: 'ANNO_NON_CONSERVATO', fonte: null };
const AMBIGUA = { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null };
const OBIETTIVI: Record<string, string[]> = { SRA01: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRA16: ['OS5', 'OG1'] };

function verifica(codiceIntervento: string, conFile: boolean, dati: Record<string, unknown> = {}) {
  const programma = conFile ? null : NV;
  return {
    codiceIntervento,
    indicatoreOutput: conFile ? v('O.20') : NV,
    indicatoreRisultato: conFile ? v('R.9') : NV,
    avvisiAttivati: programma ?? v(2),
    avvisiChiusi: programma ?? v(1),
    azioniAttivate: programma ?? v(3),
    dotazioneAvvisi: programma ?? v(2000000),
    chiusuraUltimoAvvisoAperto: programma ?? v('2025-03-31'),
    domandeRicevute: conFile ? 3 : 0,
    valoreDomandeRicevute: v(conFile ? 180000 : 0),
    domandeRicevuteSenzaRichiesto: conFile ? 1 : 0,
    domandeFinanziate: conFile ? 2 : 0,
    valoreDomandeFinanziate: v(conFile ? 160000 : 0),
    outputAttesoFinanziate: conFile ? v(40) : NV,
    domandeSaldate: conFile ? 1 : 0,
    anticipiErogati: v(conFile ? 20000 : 0),
    spesaErogata: v(conFile ? 90000 : 0),
    outputErogato: conFile ? v(12) : NV,
    includeTopUp: programma ?? v(true),
    importoTopUp: programma ?? v(150000),
    concessioniPreviste: programma ?? v(false),
    ...dati,
  };
}

const VERIFICA = [verifica('SRA01', false), verifica('SRD01', true), verifica('SRA16', true, { outputErogato: AMBIGUA })];

function anni(misure: Record<number, Record<string, unknown>>) {
  return [2023, 2024, 2025, 2026, 2027, 2028, 2029].map((anno) => ({ anno, programmato: NV, realizzatoSigc: NV, realizzatoNonSigc: NV, ...misure[anno] }));
}

const OUTPUT = [
  {
    codiceIntervento: 'SRA01',
    indicatoreOutput: 'O.14',
    unitaMisura: 'ettari',
    targetFinePeriodo: v(1500),
    annoTarget: 2029,
    anni: anni({ 2023: { realizzatoSigc: v(400) }, 2024: { programmato: v(500), realizzatoSigc: v(450) }, 2025: { programmato: v(520) } }),
    importiUnitari: [
      { codiceUnitAmount: 'UA01', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(250) },
      { codiceUnitAmount: 'UA02', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(180) },
    ],
  },
  { codiceIntervento: 'SRD01', indicatoreOutput: 'O.20', unitaMisura: 'numero di operazioni', targetFinePeriodo: v(10), annoTarget: 2029, anni: anni({ 2025: { realizzatoNonSigc: v(12) } }), importiUnitari: [] },
  { codiceIntervento: 'SRA16', indicatoreOutput: 'O.14', unitaMisura: 'ettari', targetFinePeriodo: v(300), annoTarget: 2029, anni: anni({ 2027: { realizzatoSigc: AMBIGUA, realizzatoNonSigc: AMBIGUA } }), importiUnitari: [] },
];

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
  const righe = filtra(VERIFICA, p).map((r) => (anno === null || anno === '2025' || r.dotazioneAvvisi.valore === null ? r : { ...r, dotazioneAvvisi: ANNO, chiusuraUltimoAvvisoAperto: ANNO, includeTopUp: ANNO, importoTopUp: ANNO, azioniAttivate: ANNO }));
  return HttpResponse.json({ annoRiferimento: anno === null ? 2025 : Number(anno), perimetro: 'REGIONALE', outputCumulativo: true, righe, ultimiDatiSincronizzati: ULTIMI });
}

const file = () => new HttpResponse('Esempio;dati inventati\n', { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });

export const handlersEsempio: RequestHandler[] = [
  http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', file),
  http.get('*/api/istituzionale/output-regionale/:formato', file),
  http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => rispostaVerifica(new URL(request.url).searchParams)),
  http.get('*/api/istituzionale/output-regionale', ({ request }) =>
    HttpResponse.json({ annoInizio: 2023, annoFine: 2029, perimetro: 'REGIONALE', realizzatoNonSigcCumulativo: true, righe: filtra(OUTPUT, new URL(request.url).searchParams), ultimiDatiSincronizzati: ULTIMI }),
  ),
];
