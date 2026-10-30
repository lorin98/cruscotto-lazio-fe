// criteri.ts — i criteri dei report istituzionali nell'indirizzo della pagina (PURO): i cinque filtri del programma, gli
// stessi dei report finanziari (entities/filtri: SC-IS_FILTRI "filtri come nei report finanziari"), per la verifica SMP
// non SIGC l'anno di riferimento del file (TX-0016.anno: uno solo, facoltativo, 2000-2100; assente = l'ultimo anno con
// un file) e per la verifica SMP SIGC l'esercizio finanziario (TX-0015.esercizio: obbligatorio, senza la pagina non legge).
// Sono gli url_params delle route dello uiplan: dall'indirizzo arrivano solo valori nel formato ammesso. L'anno e
// l'esercizio sono parametri della pagina, non filtri: si scelgono col selettore, non hanno un chip e restano quando i
// filtri cambiano. Il codice dell'intervento del percorso del dettaglio e' quello comune di entities/filtri
// (codiceDelPercorso).
import { filtriAttivi, filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { anniProposti, isAnnoValido } from '../../../shared/lib';

/**
 * Criteri di TX-0016 nel layer puro: i filtri del programma e l'anno di riferimento del file (assente = l'ultimo anno con
 * un file). Le chiavi sono quelle di CriteriVerifica di api/ (Tx0016Params): ui/contratto.ts lo verifica a compilazione.
 */
export interface CriteriDellaVerifica extends Filtri {
  anno?: number;
}

/**
 * Criteri di TX-0015 nel layer puro: i filtri del programma e l'esercizio finanziario (obbligatorio). Le chiavi sono
 * quelle di CriteriVerificaSigc di api/ (Tx0015Params): ui/contratto.ts lo verifica a compilazione.
 */
export interface CriteriDellaVerificaSigc extends Filtri {
  esercizio: number;
}

export const ETICHETTA_ANNO = 'Anno di riferimento';
/** Il parametro dell'anno nell'indirizzo (TX-0016.anno), della verifica e del dettaglio dell'intervento. */
export const PARAMETRO_ANNO = 'anno';

export const ETICHETTA_ESERCIZIO = 'Esercizio';
/** Il parametro dell'esercizio nell'indirizzo della verifica SMP SIGC (TX-0015.esercizio). */
export const PARAMETRO_ESERCIZIO = 'esercizio';

/** Il parametro di pagina che resta nell'indirizzo quando i filtri cambiano: l'anno (non SIGC) o l'esercizio (SIGC). */
export type ParametroDiPagina = typeof PARAMETRO_ANNO | typeof PARAMETRO_ESERCIZIO;

/** Il periodo CSR proposto nel selettore dell'anno: 2023-2029 (il periodo predefinito dell'output regionale, D-03 del backend). */
export const ANNI_DEL_PERIODO = { primo: 2023, ultimo: 2029 } as const;

/**
 * Gli esercizi proposti nel selettore della verifica SMP SIGC, come nel finanziario da cui la pagina viene: il periodo CSR
 * con la regola n+2 (l'esercizio n va dal 16/10/n-1 al 15/10/n: i pagamenti ammessi fino al 31/12/2029 cadono
 * nell'esercizio 2030).
 */
export const ESERCIZI = { primo: 2023, ultimo: 2030 } as const;

/**
 * Anni proposti nel selettore dell'anno di riferimento: il periodo CSR, piu' l'anno della risposta (l'ultimo con un
 * file, se fuori dal periodo) e quello scelto (dall'indirizzo), in ordine. La spec non elenca gli anni dei file.
 */
export function anniDiRiferimento(risposta: number | null | undefined, scelto: number | undefined): number[] {
  return anniProposti(ANNI_DEL_PERIODO.primo, ANNI_DEL_PERIODO.ultimo, risposta, scelto);
}

/** Esercizi proposti nel selettore della verifica SMP SIGC: 2023-2030 e quello scelto (dall'indirizzo), in ordine. */
export function eserciziProposti(scelto: number | undefined): number[] {
  return anniProposti(ESERCIZI.primo, ESERCIZI.ultimo, scelto);
}

/**
 * L'ultimo esercizio finanziario chiuso alla data data (card della Home, scelta dell'utente del 30/10/2026): l'esercizio n
 * va dal 16/10/n-1 al 15/10/n, quindi dal 16 ottobre di un anno l'ultimo chiuso e' quello dell'anno, prima e' quello
 * dell'anno precedente. La data e' quella del calendario locale (ottobre = mese 9 di Date).
 */
export function esercizioUltimoChiuso(oggi: Date): number {
  const anno = oggi.getFullYear();
  const dopoLaChiusura = oggi.getMonth() > 9 || (oggi.getMonth() === 9 && oggi.getDate() >= 16);
  return dopoLaChiusura ? anno : anno - 1;
}

/**
 * Query string dei filtri (senza "?") col parametro di pagina della ricerca corrente (l'anno o l'esercizio, se valido):
 * il parametro resta quando i filtri cambiano.
 */
export function ricercaConParametro(parametro: ParametroDiPagina): (filtri: Filtri, search: string) => string {
  return (filtri, search) => {
    const valore = Number(new URLSearchParams(search).get(parametro));
    return [ricercaDaFiltri(filtri), isAnnoValido(valore) ? `${parametro}=${valore}` : ''].filter(Boolean).join('&');
  };
}

/** Query string dei filtri (senza "?") con l'anno della ricerca corrente: l'anno resta quando i filtri cambiano. */
export const ricercaConAnno = ricercaConParametro(PARAMETRO_ANNO);

/** Vero se c'e' almeno un filtro del programma: lo stato vuoto parla dei filtri solo allora. */
export function conFiltri(filtri: Filtri): boolean {
  return filtriAttivi(filtri).length > 0;
}

/** Criteri di TX-0016: i filtri e l'anno scelto, se c'e'. */
export function criteriVerifica(filtri: Filtri, anno: number | undefined): CriteriDellaVerifica {
  return anno === undefined ? filtri : { ...filtri, anno };
}

/** Criteri di TX-0015: i filtri e l'esercizio scelto. */
export function criteriVerificaSigc(filtri: Filtri, esercizio: number): CriteriDellaVerificaSigc {
  return { ...filtri, esercizio };
}

/** I criteri della verifica aperta senza filtri ne' anno: la card della Home legge con questi, nella stessa cache. */
export function criteriVerificaSenzaFiltri(): CriteriDellaVerifica {
  return criteriVerifica(filtriDaRicerca(''), undefined);
}

/**
 * I filtri della verifica SMP SIGC aperta senza filtri: la card della Home legge TX-0015 con questi e l'ultimo esercizio
 * chiuso, la stessa lettura (e cache) della pagina aperta con quell'esercizio.
 */
export function filtriVerificaSigcSenzaFiltri(): Filtri {
  return filtriDaRicerca('');
}

/** "Etichetta: valore" di ogni filtro e dell'anno scelto, per l'intestazione del PNG dei grafici (filtri applicati, NFR-50). */
export function testiCriteri(filtri: Filtri, anno?: number): string[] {
  const testi = filtriNellaBarra(filtri).map((f) => `${f.etichetta}: ${f.valore}`);
  return anno === undefined ? testi : [...testi, `${ETICHETTA_ANNO}: ${anno}`];
}

/** "Etichetta: valore" di ogni filtro e dell'esercizio, per l'intestazione del PNG della verifica SMP SIGC (NFR-50). */
export function testiCriteriSigc(filtri: Filtri, esercizio: number): string[] {
  return [...filtriNellaBarra(filtri).map((f) => `${f.etichetta}: ${f.valore}`), `${ETICHETTA_ESERCIZIO}: ${esercizio}`];
}

/** I filtri del dettaglio: il solo intervento della route (la lettura di TX-0016 dell'intervento). */
export function soloIntervento(codice: string): Filtri {
  return { intervento: [codice] };
}
