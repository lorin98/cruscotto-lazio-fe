// filtri.ts — funzioni PURE della feature finanziario (zero React): filtri di RF001 nell'indirizzo della pagina, le loro
// etichette e i chip, anni consultabili, parametri di pagina.
// I filtri vivono nella query string (uiplan: la pagina dei filtri li applica, ogni report li legge e li mostra). I cinque
// filtri del programma (intervento, OS, OG, OP, azione portante) sono gli stessi del fisico: formato, lettura, scrittura,
// etichette e chip stanno in entities/filtri e qui si riesportano, cosi' i moduli della feature non cambiano.
import { ricercaDaFiltri } from '../../../entities/filtri';
import { isAnnoValido } from '../../../shared/lib';
import type { Filtri } from '../../../entities/filtri';

export {
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  MAX_VALORI_FILTRO,
  filtriAttivi,
  filtriDaRicerca,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
} from '../../../entities/filtri';
export type { ChiaveFiltro, Filtri, FiltroAttivo } from '../../../entities/filtri';

// anno della riserva ed esercizio della verifica SMP: la regola dell'anno dei parametri del contratto (shared/lib/anni),
// la stessa della campagna del fisico
export { isAnnoValido } from '../../../shared/lib';

// Periodo di programmazione CSR 2023-2027 con la regola n+2: la riserva riguarda gli anni 2023-2029; l'esercizio n va
// dal 16/10/n-1 al 15/10/n, quindi i pagamenti ammessi fino al 31/12/2029 cadono nell'esercizio 2030.
const PRIMO_ANNO_CSR = 2023;
const ULTIMO_ANNO: Record<'riserva' | 'esercizio', number> = { riserva: 2029, esercizio: 2030 };

/** Anni da proporre nel selettore; un anno valido gia' scelto (es. dall'indirizzo) resta sempre selezionabile. */
export function anniSelezionabili(tipo: 'riserva' | 'esercizio', corrente?: number): number[] {
  const anni: number[] = [];
  for (let a = PRIMO_ANNO_CSR; a <= ULTIMO_ANNO[tipo]; a++) anni.push(a);
  if (isAnnoValido(corrente) && !anni.includes(corrente)) anni.push(corrente);
  return anni.sort((x, y) => x - y);
}

/**
 * Parametri di pagina (non filtri) che restano nell'indirizzo quando i filtri cambiano: anno della riserva, esercizio SMP,
 * scheda del dettaglio dell'intervento (cosi' tornando indietro dall'elenco operativo la scheda si ritrova).
 */
export const PARAMETRI_DI_PAGINA = ['anno', 'esercizio', 'scheda'] as const;

/** Imposta (o toglie, con null) un parametro di pagina, lasciando gli altri. */
export function conParametroDiPagina(ricerca: URLSearchParams, chiave: (typeof PARAMETRI_DI_PAGINA)[number], valore: string | null): URLSearchParams {
  const nuova = new URLSearchParams(ricerca);
  if (valore === null) nuova.delete(chiave);
  else nuova.set(chiave, valore);
  return nuova;
}

/** Query string con i filtri dati e i parametri di pagina della ricerca corrente (anno della riserva, esercizio SMP). */
export function ricercaConParametri(ricercaCorrente: string, filtri: Filtri): string {
  const corrente = new URLSearchParams(ricercaCorrente);
  const pagina = new URLSearchParams();
  for (const k of PARAMETRI_DI_PAGINA) {
    const v = corrente.get(k);
    if (v) pagina.set(k, v);
  }
  return [ricercaDaFiltri(filtri), pagina.toString()].filter(Boolean).join('&');
}
