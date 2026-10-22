// criteri.ts — i criteri delle superfici nell'indirizzo della pagina (PURO): i cinque filtri del programma, gli stessi dei
// report finanziari (entities/filtri: SC-FS_FILTRI "filtri come nei report finanziari"), e la campagna, un solo anno
// (TX-0018: campagna non ripetibile, 2000-2100; assente = tutte le campagne presenti). Sono gli url_params della route
// /fisico/superfici dello uiplan: dall'indirizzo arrivano solo valori nel formato ammesso, e cosi' si riscrivono.
import { CHIAVI_FILTRO, filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri } from '../../../entities/filtri';
import type { ChiaveFiltro, Filtri, FiltroNellaBarra } from '../../../entities/filtri';
import { isAnnoValido } from '../../../shared/lib';

/** Criteri di TX-0018: i filtri del programma e la campagna (assente = tutte le campagne presenti). */
export interface Criteri extends Filtri {
  campagna?: number;
}

export const ETICHETTA_CAMPAGNA = 'Campagna';

/** La campagna di un testo dell'indirizzo: quattro cifre di un anno 2000-2100, altrimenti nessuna. */
export function campagnaDaTesto(testo: string | null | undefined): number | undefined {
  const t = testo?.trim() ?? '';
  if (!/^\d{4}$/.test(t)) return undefined;
  const anno = Number(t);
  return isAnnoValido(anno) ? anno : undefined;
}

/**
 * Criteri dalla query string: i filtri del programma (formato, doppioni e tetto come nel finanziario) e la PRIMA campagna
 * valida. Il backend rifiuta la campagna ripetuta (400 DATO_NON_VALIDO "ripetuto"): dall'indirizzo ne arriva al piu' una.
 */
export function criteriDaRicerca(ricerca: string | URLSearchParams): Criteri {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const campagna = p
    .getAll('campagna')
    .map(campagnaDaTesto)
    .find((a) => a !== undefined);
  return campagna === undefined ? filtriDaRicerca(p) : { ...filtriDaRicerca(p), campagna };
}

/** Query string dei criteri (senza "?"): i filtri ripetuti come li vuole il backend, poi la campagna (una sola). */
export function ricercaDaCriteri(criteri: Criteri): string {
  const filtri = ricercaDaFiltri(criteri);
  const campagna = criteri.campagna !== undefined && isAnnoValido(criteri.campagna) ? `campagna=${criteri.campagna}` : '';
  return [filtri, campagna].filter(Boolean).join('&');
}

/** I criteri con la campagna data (undefined = tutte le campagne). */
export function conCampagna(criteri: Criteri, campagna: number | undefined): Criteri {
  const resto: Criteri = { ...criteri };
  delete resto.campagna;
  return campagna === undefined ? resto : { ...resto, campagna };
}

/** I criteri con il solo intervento dato al posto di quelli scelti ("Mostra solo SRB01" dell'anteprima). */
export function soloIntervento(criteri: Criteri, codice: string): Criteri {
  return { ...criteri, intervento: [codice] };
}

/** Un criterio attivo della barra (entities/filtri): la campagna non e' una dimensione del programma (dimensione null). */
export type CriterioAttivo = FiltroNellaBarra<Criteri>;

/** I criteri attivi nell'ordine della barra: i filtri del programma, poi la campagna. */
export function criteriAttivi(criteri: Criteri): CriterioAttivo[] {
  const filtri = filtriNellaBarra(criteri);
  if (criteri.campagna === undefined) return filtri;
  return [...filtri, { chiave: `campagna:${criteri.campagna}`, etichetta: ETICHETTA_CAMPAGNA, valore: String(criteri.campagna), dimensione: null, senza: conCampagna(criteri, undefined) }];
}

/** "Etichetta: valore" di ogni criterio, per l'intestazione del PNG dei grafici (filtri applicati, NFR-50). */
export function testiCriteri(criteri: Criteri): string[] {
  return criteriAttivi(criteri).map((c) => `${c.etichetta}: ${c.valore}`);
}

/** Vero se c'e' almeno un filtro del programma (la campagna esclusa): serve a dire se il vuoto dipende dai filtri. */
export function conFiltriDelProgramma(criteri: Criteri): boolean {
  return CHIAVI_FILTRO.some((k: ChiaveFiltro) => (criteri[k] ?? []).length > 0);
}
