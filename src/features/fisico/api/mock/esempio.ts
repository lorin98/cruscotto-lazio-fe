// esempio.ts — dati DI ESEMPIO del fisico per il dev server con MSW (npm run dev): valori INVENTATI e deterministici, nella
// forma dei DTO della spec (TX-0018, TX-0017, TX-0030), con le assenze dei dati reali (intervento non a superficie
// NON_VALORIZZATO, quantita' richiesta a premio e pagato per Unit Amount FONTE_NON_ATTIVA, una riga dell'output in entrambi
// i monitoraggi FONTE_AMBIGUA). Il mock fa da server: filtra le superfici per intervento e campagna, l'output regionale e le
// Unit Amount per intervento e obiettivi (azione portante senza legame: nessuna riga); i file CSV e XLSX sono un testo
// d'esempio. Output regionale e Unit Amount sono del fisico dal 29/10/2026 (dati d'esempio dell'istituzionale e del
// procedurale); le determine di una domanda sono del procedurale. I valori dei filtri (TX-0060) sono quelli d'esempio
// dell'elenco operativo. Solo il worker del browser li usa (browser.ts li raccoglie per
// convenzione di percorso); i test hanno le loro fixture.
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import { PROBLEM_TYPES } from '../../../../shared/api/problem/problem-types';

const ULTIMI = [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }];
const PREMIO = { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'QUANTITA_RICHIESTA_PREMIO' };

function campagna(anno: number, ds: number, dp: number, pagamento: number, sostegno: number, oltre: number) {
  return {
    anno,
    domandePagamento: pagamento,
    domandeSostegno: sostegno,
    sostegniDiscordanti: 0,
    superficieDs: ds,
    superficieDp: dp,
    differenzaDpDs: Math.round((dp - ds) * 100) / 100,
    domandeDpOltreDs: oltre,
    quantitaRichiestaPremio: PREMIO,
  };
}

const RIGHE = [
  { codiceIntervento: 'SRA01', motivo: null, campagne: [campagna(2024, 120.5, 118.25, 14, 12, 2), campagna(2025, 131, 133.4, 16, 13, 4)] },
  { codiceIntervento: 'SRA29', motivo: null, campagne: [campagna(2023, 80, 79.5, 9, 9, 0), campagna(2024, 86.75, 88, 10, 9, 1), campagna(2025, 90.2, 87.9, 11, 10, 0)] },
  { codiceIntervento: 'SRD01', motivo: 'NON_VALORIZZATO', campagne: [] },
];

function superfici(p: URLSearchParams) {
  const interventi = p.getAll('intervento');
  const anno = p.get('campagna');
  const righe = RIGHE.filter((r) => interventi.length === 0 || interventi.includes(r.codiceIntervento)).map((r) => {
    if (anno === null) return r;
    const campagne = r.campagne.filter((c) => String(c.anno) === anno);
    return { ...r, campagne, motivo: campagne.length === 0 ? 'NON_VALORIZZATO' : null };
  });
  return { campagna: anno === null ? null : Number(anno), perimetro: 'REGIONALE', righe, ultimiDatiSincronizzati: ULTIMI };
}

// ---------------------------------------------------------------- output regionale (TX-0017, dall'istituzionale)

const v = (valore: unknown) => ({ valore, motivo: null, fonte: null });
const NV = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
const AMBIGUA = { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null };
const OBIETTIVI: Record<string, string[]> = { SRA01: ['OS5', 'OG1'], SRD01: ['OS4', 'OG2', 'OP1'], SRA16: ['OS5', 'OG1'] };

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
  { codiceIntervento: 'SRA16', indicatoreOutput: 'O.14', unitaMisura: 'ettari', targetFinePeriodo: v(300), annoTarget: 2029, anni: anni({ 2027: { realizzatoSigc: AMBIGUA, realizzatoNonSigc: AMBIGUA } }), importiUnitari: [] },
  { codiceIntervento: 'SRD01', indicatoreOutput: 'O.20', unitaMisura: 'numero di operazioni', targetFinePeriodo: v(10), annoTarget: 2029, anni: anni({ 2025: { realizzatoNonSigc: v(12) } }), importiUnitari: [] },
];

// ---------------------------------------------------------------- Unit Amount (TX-0030, dal procedurale)

/** Il pagato per Unit Amount: la fonte non e' attiva (il caso reale, OP-FIS-14). */
const PAGATO = { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'PAGATO_PER_UNIT_AMOUNT' };

const UNIT_AMOUNT = [
  { codiceIntervento: 'SRA01', codiceUnitAmount: 'UA01', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(250), outputPrevisto: v(300), importoPagato: PAGATO, percentualePagata: PAGATO, baseStorica: PAGATO },
  { codiceIntervento: 'SRA01', codiceUnitAmount: 'UA02', gruppoColturale: 'Seminativi', esercizio: 2024, importoUnitario: v(180), outputPrevisto: v(200), importoPagato: PAGATO, percentualePagata: PAGATO, baseStorica: PAGATO },
  { codiceIntervento: 'SRD01', codiceUnitAmount: 'UA1', gruppoColturale: 'Ortive', esercizio: 2025, importoUnitario: NV, outputPrevisto: v(10), importoPagato: PAGATO, percentualePagata: PAGATO, baseStorica: PAGATO },
];

/** Le righe dei filtri: dimensioni insieme, valori dello stesso filtro in alternativa; azione senza legame: nessuna. */
function filtra<R extends { codiceIntervento: string }>(righe: readonly R[], p: URLSearchParams): R[] {
  if (p.getAll('azione').length > 0) return [];
  const interventi = p.getAll('intervento');
  const obiettivi = ['os', 'og', 'op'].map((k) => p.getAll(k)).filter((x) => x.length > 0);
  return righe.filter((r) => (interventi.length === 0 || interventi.includes(r.codiceIntervento)) && obiettivi.every((x) => x.some((o) => (OBIETTIVI[r.codiceIntervento] ?? []).includes(o))));
}

const file = () => new HttpResponse('Esempio;dati inventati\n', { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });

const problema = (status: number, type: string, errorCode: string, detail?: string) => HttpResponse.json({ type, title: 'Errore', status, errorCode, ...(detail ? { detail } : {}) }, { status });

export const handlersEsempio: RequestHandler[] = [
  http.get('*/api/fisico/superficie-ammissibile/:formato', ({ params }) =>
    params.formato === 'csv' || params.formato === 'xlsx'
      ? new HttpResponse('Esempio;dati inventati\n', { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } })
      : problema(404, PROBLEM_TYPES.NON_TROVATO, 'NOT_FOUND'),
  ),
  http.get('*/api/fisico/superficie-ammissibile', ({ request }) => HttpResponse.json(superfici(new URL(request.url).searchParams))),
  http.get('*/api/fisico/output-regionale/:formato', file),
  http.get('*/api/fisico/output-regionale', ({ request }) =>
    HttpResponse.json({ annoInizio: 2023, annoFine: 2029, perimetro: 'REGIONALE', realizzatoNonSigcCumulativo: true, righe: filtra(OUTPUT, new URL(request.url).searchParams), ultimiDatiSincronizzati: ULTIMI }),
  ),
  http.get('*/api/fisico/unit-amount/:formato', file),
  http.get('*/api/fisico/unit-amount', ({ request }) => HttpResponse.json({ perimetro: 'REGIONALE', righe: filtra(UNIT_AMOUNT, new URL(request.url).searchParams), ultimiDatiSincronizzati: ULTIMI })),
];
