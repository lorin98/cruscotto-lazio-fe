// esempio.ts — dati DI ESEMPIO del fisico per il dev server con MSW (npm run dev): valori INVENTATI e deterministici, nella
// forma dei DTO della spec (TX-0018, TX-0020), con le assenze dei dati reali (intervento non a superficie NON_VALORIZZATO,
// quantita' richiesta a premio FONTE_NON_ATTIVA). Il mock fa da server: filtra le superfici per intervento e campagna,
// risponde 404 NOT_FOUND per un codice a barre sconosciuto e 400 DATO_NON_VALIDO per uno senza cifre. I valori dei filtri
// (TX-0060) sono quelli d'esempio dell'elenco operativo. Solo il worker del browser li usa (browser.ts li raccoglie per
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

const DETERMINE: Record<string, object> = {
  '54810769585': {
    codiceABarre: '54810769585',
    tipoDomanda: 'PAGAMENTO',
    domandaChiusa: false,
    corrente: { valore: { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false }, motivo: null },
    elenco: [
      { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false },
      { codice: 'G00002', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: true },
      { codice: 'G00001', data: '2025-01-10', fonteStatoAreaProgrammazione: true, fonteComparto: false },
    ],
  },
  '54810000001': { codiceABarre: '54810000001', tipoDomanda: 'SOSTEGNO', domandaChiusa: false, corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] },
  '34810063735': {
    codiceABarre: '34810063735',
    tipoDomanda: 'PAGAMENTO',
    domandaChiusa: true,
    corrente: { valore: { codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }, motivo: null },
    elenco: [{ codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }],
  },
};

const problema = (status: number, type: string, errorCode: string, detail?: string) => HttpResponse.json({ type, title: 'Errore', status, errorCode, ...(detail ? { detail } : {}) }, { status });

export const handlersEsempio: RequestHandler[] = [
  http.get('*/api/fisico/superficie-ammissibile/:formato', ({ params }) =>
    params.formato === 'csv' || params.formato === 'xlsx'
      ? new HttpResponse('Esempio;dati inventati\n', { headers: { 'Content-Type': 'text/csv; charset=UTF-8' } })
      : problema(404, PROBLEM_TYPES.NON_TROVATO, 'NOT_FOUND'),
  ),
  http.get('*/api/fisico/superficie-ammissibile', ({ request }) => HttpResponse.json(superfici(new URL(request.url).searchParams))),
  http.get('*/api/fisico/domande/:codice/determina', ({ params }) => {
    const codice = String(params.codice).trim();
    if (!/^\d{1,30}$/.test(codice)) return problema(400, PROBLEM_TYPES.DATO_NON_VALIDO, 'DATO_NON_VALIDO', 'codiceABarre: sole cifre, al più 30');
    const d = DETERMINE[codice];
    return d ? HttpResponse.json(d) : problema(404, PROBLEM_TYPES.NON_TROVATO, 'NOT_FOUND');
  }),
];
