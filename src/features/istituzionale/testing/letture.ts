// letture.ts — le letture dell'istituzionale nei test (MSW): TX-0016, TX-0015 e TX-0060 rispondono come il backend ai
// parametri della query (verificaPer, verificaSigcPer: le righe dei filtri, l'anno di riferimento o l'esercizio), mai lo
// stesso corpo per ogni query (lezione della review del fisico), e registrano cosa e' stato chiesto; le esportazioni rispondono con un file e
// registrano percorso, query e X-Requested-With. Ogni test monta solo cio' che gli serve (il server dei test non monta i
// mock generati dell'istituzionale e dell'elenco).
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import type { ValoriFiltriElenco, VerificaSmp, VerificaSmpNonSigc } from '../api';
import { VALORI, VERIFICA, VERIFICA_SMP, verificaPer, verificaSigcPer } from './fixture';

export interface Lette {
  verifica: string[];
  verificaSigc: string[];
  filtri: number;
  file: string[];
}

interface Basi {
  verifica?: VerificaSmpNonSigc;
  verificaSigc?: VerificaSmp;
  /** I valori di TX-0060; null = TX-0060 in errore (503 CAPACITA_ESAURITA). */
  valori?: ValoriFiltriElenco | null;
}

const indisponibile = () => HttpResponse.json({ type: 'urn:cruscottocsr:problem:capacita-esaurita', title: 'Errore', status: 503, errorCode: 'CAPACITA_ESAURITA' }, { status: 503 });

/** Gli handler delle letture e dei file dell'istituzionale, con le basi date (di norma quelle della fixture). */
export function lettureIstituzionale({ verifica = VERIFICA, verificaSigc = VERIFICA_SMP, valori = VALORI }: Basi = {}): { handlers: RequestHandler[]; lette: Lette } {
  const lette: Lette = { verifica: [], verificaSigc: [], filtri: 0, file: [] };
  const file = ({ request }: { request: Request }) => {
    const u = new URL(request.url);
    lette.file.push(`${u.pathname}${u.search} ${request.headers.get('X-Requested-With') ?? ''}`);
    return new HttpResponse('a;b', { headers: { 'Content-Type': 'text/csv' } });
  };
  const handlers = [
    http.get('*/api/istituzionale/verifica-smp-non-sigc/:formato', file),
    http.get('*/api/istituzionale/verifica-smp-sigc/:formato', file),
    http.get('*/api/istituzionale/verifica-smp-non-sigc', ({ request }) => {
      const u = new URL(request.url);
      lette.verifica.push(u.search);
      return HttpResponse.json(verificaPer(verifica, u.searchParams));
    }),
    http.get('*/api/istituzionale/verifica-smp-sigc', ({ request }) => {
      const u = new URL(request.url);
      lette.verificaSigc.push(u.search);
      return HttpResponse.json(verificaSigcPer(verificaSigc, u.searchParams));
    }),
    http.get('*/api/elenco-operativo/filtri', () => {
      lette.filtri += 1;
      return valori ? HttpResponse.json(valori) : indisponibile();
    }),
  ];
  return { handlers, lette };
}
