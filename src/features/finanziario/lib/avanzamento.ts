// avanzamento.ts — pagato sulla dotazione degli interventi, funzione PURA (zero React): la media ponderata sugli
// interventi utilizzabili (dotazione positiva e pagato valorizzato), con gli esclusi e il loro motivo. Un'unica regola
// per il grafico dell'avanzamento e per il KPI della panoramica.
import { confronta, percentuale, sommaCentesimi } from '../../../shared/lib';
import type { RigaSpesa } from './dto';
import { assenzaImporto, codiceDi, problemaDotazione, valoreDi } from './importi';

export interface InterventoAvanzamento {
  codice: string;
  dotazione: number;
  pagato: number;
  quota: number;
}

export interface Avanzamento {
  /** Interventi con dotazione positiva e pagato valorizzato, dalla quota maggiore. */
  incluse: InterventoAvanzamento[];
  /** Interventi esclusi, con il motivo: "SRA03: dotazione pari a zero". */
  omessi: string[];
  totaleDotazione: number;
  totalePagato: number;
  /** Media ponderata del pagato sulla dotazione (0-100), null se nessun intervento e' utilizzabile. */
  media: number | null;
}

/** Il motivo per cui un intervento resta fuori dal rapporto, null se e' utilizzabile. */
export function esclusione(r: RigaSpesa): string | null {
  const problemi = [problemaDotazione(r.dotazioneSpesaPubblica), valoreDi(r.pagamentiTotali) == null ? `pagato: ${assenzaImporto(r.pagamentiTotali)}` : null];
  const elenco = problemi.filter((p): p is string => p != null);
  return elenco.length ? `${codiceDi(r)}: ${elenco.join(', ')}` : null;
}

/** Pagato sulla dotazione degli interventi utilizzabili: la stessa regola per il grafico e per il KPI della panoramica. */
export function avanzamentoPonderato(righe: readonly RigaSpesa[]): Avanzamento {
  const incluse: InterventoAvanzamento[] = [];
  const omessi: string[] = [];
  for (const r of righe) {
    const motivo = esclusione(r);
    if (motivo) {
      omessi.push(motivo);
      continue;
    }
    const dotazione = valoreDi(r.dotazioneSpesaPubblica) as number;
    const pagato = valoreDi(r.pagamentiTotali) as number;
    incluse.push({ codice: codiceDi(r), dotazione, pagato, quota: pagato / dotazione });
  }
  incluse.sort((a, b) => b.quota - a.quota || confronta(a.codice, b.codice));
  const totaleDotazione = sommaCentesimi(incluse.map((x) => x.dotazione));
  const totalePagato = sommaCentesimi(incluse.map((x) => x.pagato));
  return { incluse, omessi, totaleDotazione, totalePagato, media: incluse.length ? percentuale(totalePagato, totaleDotazione) : null };
}
