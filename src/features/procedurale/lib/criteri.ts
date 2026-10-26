// criteri.ts — i criteri dei report procedurali nell'indirizzo della pagina (PURO): i filtri del programma di RF024
// (intervento, OS, OG, OP: formato, lettura e chip di entities/filtri, senza l'azione portante, che RF024 non prevede e il
// contratto rifiuta con 400, D-01 Rev. 1) e lo stato area programmazione (`stato`, chiavi di TX-0025). Sono gli
// url_params delle route dello uiplan, gli stessi in tutte le pagine (passano dal menu); il dettaglio dell'intervento
// prende dall'indirizzo il solo stato. TX-0030 non accetta lo stato: le Unit Amount non lo mandano ne' lo mostrano, ma lo
// lasciano nell'indirizzo per le altre pagine (D-06 Rev. 6 del backend).
import { filtriDaRicerca, filtriNellaBarra, ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri, FiltroNellaBarra } from '../../../entities/filtri';
import { leggiRipetuti, maiuscolaIniziale, scriviRipetuti } from '../../../shared/lib';
import type { StatoArea } from './dto';

/** I criteri dei report: i filtri del programma (mai l'azione portante) e lo stato area programmazione. */
export interface CriteriProcedurali extends Filtri {
  stato?: string[];
}

/** Il parametro dello stato area programmazione nell'indirizzo e nelle letture (TX-0026..TX-0029, TX-0031, TX-0032). */
export const PARAMETRO_STATO = 'stato';
export const ETICHETTA_STATO = 'Stato area programmazione';

const PROGRAMMA = ['intervento', 'os', 'og', 'op'] as const;

// Chiavi degli stati: di TX-0025 (voci di RF025 come AMMESSA, codici osservati dell'anagrafica come REVOCATA, SENZA_STATO)
// e codici degli stati SIAN fuori catalogo delle distribuzioni (SOSPESA, "PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA
// ESEGUIRE"): lettere, cifre, spazi e punteggiatura breve, al piu' 100 caratteri, senza spazi ai bordi. Un valore diverso
// non arriva dall'indirizzo in pagina ne' finisce in un link o in un filtro. Il backend accetta i codici osservati come
// sono nel database, anche con segni fuori da questo formato (StatoOsservato): per loro la tabella dice che la voce non
// si apre nell'elenco (motivoSenzaLink di lib/collegamenti), il clic sulla barra non filtra la pagina e il pannello dei
// filtri non li propone, ma dice quanti sono (vociDelloStatoNelPannello).
const CHIAVE_STATO = /^[A-Za-z0-9](?:[A-Za-z0-9_ .,'()/-]{0,98}[A-Za-z0-9_.)])?$/;

/** Una chiave di stato utilizzabile in un indirizzo. */
export function chiaveStatoValida(valore: string | null | undefined): valore is string {
  return typeof valore === 'string' && CHIAVE_STATO.test(valore);
}

/** I soli filtri del programma del procedurale (senza l'azione portante), con almeno un valore. */
function soloProgramma(f: Filtri): Filtri {
  const p: Filtri = {};
  for (const k of PROGRAMMA) if ((f[k] ?? []).length > 0) p[k] = f[k];
  return p;
}

const conStato = (stato: readonly string[] | undefined): Pick<CriteriProcedurali, 'stato'> => ((stato ?? []).length > 0 ? { stato: [...(stato ?? [])] } : {});

/** I criteri dalla query string: chiavi note, valori nel formato ammesso, senza doppioni, al piu' 100 per chiave. */
export function criteriDaRicerca(ricerca: string | URLSearchParams): CriteriProcedurali {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  return { ...soloProgramma(filtriDaRicerca(p)), ...conStato(leggiRipetuti(p, PARAMETRO_STATO, chiaveStatoValida)) };
}

/** La query string dei criteri (senza "?"): i filtri del programma nell'ordine delle chiavi, poi lo stato. */
export function ricercaDaCriteri(c: CriteriProcedurali): string {
  return [ricercaDaFiltri(soloProgramma(c)), scriviRipetuti([PARAMETRO_STATO], () => c.stato)].filter(Boolean).join('&');
}

/** La parte dell'indirizzo che resta passando dal menu da una pagina all'altra del procedurale: i criteri validi. */
export function ricercaDeiCriteri(search: string): string {
  return ricercaDaCriteri(criteriDaRicerca(search));
}

/** Un percorso del procedurale coi criteri dati (link fra le pagine: stati-*-panoramica, il menu, il percorso). */
export function conCriteri(percorso: string, c: CriteriProcedurali): string {
  const q = ricercaDaCriteri(c);
  return q ? `${percorso}?${q}` : percorso;
}

/** Vero se c'e' almeno un criterio: lo stato vuoto parla dei filtri solo allora. */
export function conFiltri(c: CriteriProcedurali): boolean {
  return ricercaDaCriteri(c) !== '';
}

/** I criteri di una lettura dei report per domanda (i cinque filtri, mai l'azione). */
export function criteriDelReport(c: CriteriProcedurali): CriteriProcedurali {
  return { ...soloProgramma(c), ...conStato(c.stato) };
}

/** I criteri dei report della panoramica aperta senza filtri: la card della Home legge con questi, nella stessa cache. */
export function criteriSenzaFiltri(): CriteriProcedurali {
  return criteriDelReport(criteriDaRicerca(''));
}

/** I criteri di TX-0030: intervento e obiettivi, senza lo stato (che resta nell'indirizzo per le altre pagine). */
export function criteriUnitAmount(c: CriteriProcedurali): Filtri {
  return soloProgramma(c);
}

/** I criteri del dettaglio dell'intervento: l'intervento della route e lo stato dell'indirizzo. */
export function criteriDellIntervento(codice: string, stato: readonly string[] | undefined): CriteriProcedurali {
  return { intervento: [codice], ...conStato(stato) };
}

/** I criteri dopo "Azzera" o "Togli tutti": nessun filtro; le Unit Amount tengono lo stato, che non mostrano. */
export function nessunFiltro(c: CriteriProcedurali, tieniStato: boolean): CriteriProcedurali {
  return tieniStato ? conStato(c.stato) : {};
}

/** La descrizione di una voce di TX-0025 com'e' nei chip ("Ammessa"); senza i valori, la chiave. */
export function testoStato(chiave: string, valori: readonly StatoArea[] | undefined): string {
  const voce = valori?.find((v) => v.chiave === chiave);
  return voce ? maiuscolaIniziale(voce.descrizione) : chiave;
}

/** Una voce di TX-0025 come nel pannello: la descrizione, con l'origine detta per gli stati osservati e senza stato. */
export function etichettaStatoArea(v: StatoArea): string {
  if (v.origine === 'OSSERVATO') return `${maiuscolaIniziale(v.descrizione)} (stato osservato fuori catalogo)`;
  if (v.origine === 'SENZA_STATO') return `${maiuscolaIniziale(v.descrizione)} (nessuna determina aperta)`;
  return maiuscolaIniziale(v.descrizione);
}

/**
 * Le voci di TX-0025 che il pannello propone: solo quelle con una chiave che l'indirizzo esprime (chiaveStatoValida).
 * Le altre, scritte con "Applica i filtri", criteriDaRicerca le scarterebbe: la pagina si rileggerebbe senza filtro e
 * senza dirlo (review A3 dell'iterazione 2). Quante sono escluse lo dice la nota del pannello.
 */
export function vociDelloStatoNelPannello(valori: readonly StatoArea[]): { voci: StatoArea[]; escluse: number } {
  const voci = valori.filter((v) => chiaveStatoValida(v.chiave));
  return { voci, escluse: valori.length - voci.length };
}

/** La nota del pannello sugli stati osservati che non si possono scegliere come filtro. */
export function notaStatiEsclusi(escluse: number): string {
  return `Stati osservati con un codice che l'indirizzo non esprime, non selezionabili come filtro: ${escluse}.`;
}

/** I criteri senza un valore dello stato (il chip tolto); senza valori rimasti lo stato sparisce. */
function senzaLoStato(c: CriteriProcedurali, valore: string): CriteriProcedurali {
  const { stato, ...resto } = c;
  return { ...resto, ...conStato((stato ?? []).filter((s) => s !== valore)) };
}

/**
 * I criteri attivi come voci della barra, nell'ordine dei parametri: i filtri del programma (chip di entities/filtri, col
 * codice come nei wireframe) e, se `conLoStato`, lo stato con la descrizione di TX-0025; ogni voce coi criteri senza di lei.
 */
export function criteriNellaBarra(c: CriteriProcedurali, valori: readonly StatoArea[] | undefined, conLoStato = true): FiltroNellaBarra<CriteriProcedurali>[] {
  const stati = (conLoStato ? (c.stato ?? []) : []).map((s) => ({
    chiave: `${PARAMETRO_STATO}:${s}`,
    etichetta: ETICHETTA_STATO,
    valore: testoStato(s, valori),
    dimensione: null,
    senza: senzaLoStato(c, s),
  }));
  return [...filtriNellaBarra(c), ...stati];
}

/** "Etichetta: valore" di ogni criterio applicato alla lettura, per l'intestazione del PNG dei grafici (NFR-50). */
export function testiCriteri(c: CriteriProcedurali, valori: readonly StatoArea[] | undefined, conLoStato = true): string[] {
  return criteriNellaBarra(c, valori, conLoStato).map((f) => `${f.etichetta}: ${f.valore}`);
}

/** Il filtro per stato ammette la voce (vuoto = tutte): il link delle domande ammesse c'e' solo se ammette AMMESSA. */
export function statoAmmette(c: CriteriProcedurali, chiave: string): boolean {
  const stato = c.stato ?? [];
  return stato.length === 0 || stato.some((s) => s.toUpperCase() === chiave.toUpperCase());
}
