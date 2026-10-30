// letture.ts — le letture dell'output regionale, delle Unit Amount (le due pagine del fisico dal 29/10/2026) e del
// dettaglio dell'intervento (dal 30/10/2026, con le superfici) nei test (MSW): TX-0017, TX-0018, TX-0030 e TX-0060
// rispondono come il backend ai parametri della query (outputPer, superficiPer, unitAmountPer: le righe dei filtri), mai
// lo stesso corpo per ogni query, e registrano cosa e' stato chiesto; le esportazioni rispondono con un file e registrano
// percorso, query e X-Requested-With. Ogni test monta solo cio' che gli serve (il server dei test non monta i mock
// generati del fisico e dell'elenco).
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import type { MonitoraggioOutput, SuperficieAmmissibile, ValoriFiltriElenco } from '../api';
import { OUTPUT, SUPERFICI_INTERVENTI, VALORI_PROGRAMMA, outputPer, superficiPer, unitAmountPer } from './fixture';

export interface Lette {
  output: string[];
  superfici: string[];
  unitAmount: string[];
  filtri: number;
  file: string[];
}

interface Basi {
  output?: MonitoraggioOutput;
  /** Le superfici (TX-0018) del dettaglio dell'intervento. */
  superfici?: SuperficieAmmissibile;
  /** Il pagato delle Unit Amount con la fonte attiva (di norma no: il caso reale). */
  pagato?: boolean;
  /** I valori di TX-0060; null = TX-0060 in errore (503 CAPACITA_ESAURITA). */
  valori?: ValoriFiltriElenco | null;
}

const indisponibile = () => HttpResponse.json({ type: 'urn:cruscottocsr:problem:capacita-esaurita', title: 'Errore', status: 503, errorCode: 'CAPACITA_ESAURITA' }, { status: 503 });

/** Gli handler delle letture e dei file dell'output regionale e delle Unit Amount, con le basi date. */
export function lettureFisico({ output = OUTPUT, superfici = SUPERFICI_INTERVENTI, pagato = false, valori = VALORI_PROGRAMMA }: Basi = {}): { handlers: RequestHandler[]; lette: Lette } {
  const lette: Lette = { output: [], superfici: [], unitAmount: [], filtri: 0, file: [] };
  const file = ({ request }: { request: Request }) => {
    const u = new URL(request.url);
    lette.file.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
    return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
  };
  const handlers = [
    http.get('*/api/fisico/output-regionale/:formato', file),
    http.get('*/api/fisico/unit-amount/:formato', file),
    http.get('*/api/fisico/superficie-ammissibile/:formato', file),
    http.get('*/api/fisico/output-regionale', ({ request }) => {
      const u = new URL(request.url);
      lette.output.push(u.search);
      return HttpResponse.json(outputPer(output, u.searchParams));
    }),
    http.get('*/api/fisico/superficie-ammissibile', ({ request }) => {
      const u = new URL(request.url);
      lette.superfici.push(u.search);
      return HttpResponse.json(superficiPer(superfici, u.searchParams));
    }),
    http.get('*/api/fisico/unit-amount', ({ request }) => {
      const u = new URL(request.url);
      lette.unitAmount.push(u.search);
      return HttpResponse.json(unitAmountPer(u.searchParams, { pagato }));
    }),
    http.get('*/api/elenco-operativo/filtri', () => {
      lette.filtri += 1;
      return valori ? HttpResponse.json(valori) : indisponibile();
    }),
  ];
  return { handlers, lette };
}
