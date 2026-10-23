// criteri.ts — i criteri dei report istituzionali nell'indirizzo della pagina (PURO): i cinque filtri del programma, gli
// stessi dei report finanziari (entities/filtri: SC-IS_FILTRI "filtri come nei report finanziari"), e per la verifica SMP
// non SIGC l'anno di riferimento del file (TX-0016.anno: uno solo, facoltativo, 2000-2100; assente = l'ultimo anno con
// un file). Sono gli url_params delle route dello uiplan: dall'indirizzo arrivano solo valori nel formato ammesso. L'anno
// e' un parametro della pagina, non un filtro: si sceglie col selettore, non ha un chip e resta quando i filtri cambiano
// (come l'esercizio della verifica SMP del finanziario). Il codice dell'intervento del percorso del dettaglio e' quello
// comune di entities/filtri (codiceDelPercorso).
import { filtriAttivi, filtriNellaBarra, ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { anniProposti, isAnnoValido } from '../../../shared/lib';

/**
 * Criteri di TX-0016 nel layer puro: i filtri del programma e l'anno di riferimento del file (assente = l'ultimo anno con
 * un file). Le chiavi sono quelle di CriteriVerifica di api/ (Tx0016Params): ui/contratto.ts lo verifica a compilazione.
 */
export interface CriteriDellaVerifica extends Filtri {
  anno?: number;
}

export const ETICHETTA_ANNO = 'Anno di riferimento';
/** Il parametro dell'anno nell'indirizzo (TX-0016.anno), della verifica e del dettaglio dell'intervento. */
export const PARAMETRO_ANNO = 'anno';

/** Il periodo CSR proposto nel selettore dell'anno: 2023-2029 (il periodo predefinito di TX-0017, D-03 del backend). */
export const ANNI_DEL_PERIODO = { primo: 2023, ultimo: 2029 } as const;

/**
 * Anni proposti nel selettore dell'anno di riferimento: il periodo CSR, piu' l'anno della risposta (l'ultimo con un
 * file, se fuori dal periodo) e quello scelto (dall'indirizzo), in ordine. La spec non elenca gli anni dei file.
 */
export function anniDiRiferimento(risposta: number | null | undefined, scelto: number | undefined): number[] {
  return anniProposti(ANNI_DEL_PERIODO.primo, ANNI_DEL_PERIODO.ultimo, risposta, scelto);
}

/** Query string dei filtri (senza "?") con l'anno della ricerca corrente: l'anno resta quando i filtri cambiano. */
export function ricercaConAnno(filtri: Filtri, search: string): string {
  const anno = Number(new URLSearchParams(search).get(PARAMETRO_ANNO));
  return [ricercaDaFiltri(filtri), isAnnoValido(anno) ? `${PARAMETRO_ANNO}=${anno}` : ''].filter(Boolean).join('&');
}

/** Vero se c'e' almeno un filtro del programma: lo stato vuoto parla dei filtri solo allora. */
export function conFiltri(filtri: Filtri): boolean {
  return filtriAttivi(filtri).length > 0;
}

/** Criteri di TX-0016: i filtri e l'anno scelto, se c'e'. */
export function criteriVerifica(filtri: Filtri, anno: number | undefined): CriteriDellaVerifica {
  return anno === undefined ? filtri : { ...filtri, anno };
}

/** "Etichetta: valore" di ogni filtro e dell'anno scelto, per l'intestazione del PNG dei grafici (filtri applicati, NFR-50). */
export function testiCriteri(filtri: Filtri, anno?: number): string[] {
  const testi = filtriNellaBarra(filtri).map((f) => `${f.etichetta}: ${f.valore}`);
  return anno === undefined ? testi : [...testi, `${ETICHETTA_ANNO}: ${anno}`];
}

/** I filtri del dettaglio: il solo intervento della route (le letture di TX-0016 e TX-0017 dell'intervento). */
export function soloIntervento(codice: string): Filtri {
  return { intervento: [codice] };
}
