// sigc.ts — funzioni PURE del filtro SIGC (zero React), revisioni del finanziario del 31/10/2026 (R01, F1-F5): il
// parametro `sigc` dei report (true = interventi SIGC, false = interventi NO SIGC, assente = tutti) filtra gli INTERVENTI
// per la loro classificazione nella programmazione; gli interventi non classificati restano fuori da entrambi i valori. Il
// controllo "Tutti | SIGC | NO SIGC" sta nella barra dei filtri di ogni report e il valore resta passando da una pagina
// all'altra e da un'area all'altra. Una card di un solo tipo (solo SIGC, solo NO SIGC) col valore opposto e' "non
// pertinente": resta al suo posto col motivo e il dato SENZA filtro (il backend col valore opposto risponde zero righe).

/** Il nome del parametro nell'indirizzo e nei contratti (lo stesso dell'elenco operativo). */
export const PARAMETRO_SIGC = 'sigc';

/** Il filtro come lo dice l'utente. */
export type FiltroSigc = 'SIGC' | 'NO SIGC';

/** Il valore del parametro come nei contratti (enum di stringhe): 'true' interventi SIGC, 'false' NO SIGC. */
export type ValoreSigc = 'true' | 'false';

/** Il valore del filtro dall'indirizzo: 'true' e 'false', altrimenti assente (tutti). */
export function sigcDaRicerca(ricerca: string | URLSearchParams): ValoreSigc | undefined {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const v = p.get(PARAMETRO_SIGC);
  return v === 'true' || v === 'false' ? v : undefined;
}

/** La sola parte del filtro SIGC di una query string (senza "?"): cio' che resta passando a un'altra area. */
export function ricercaDelSoloSigc(ricerca: string): string {
  const v = sigcDaRicerca(ricerca);
  return v === undefined ? '' : `${PARAMETRO_SIGC}=${v}`;
}

/**
 * La query string (senza "?") col filtro cambiato e gli altri parametri com'erano. La prima pagina delle tabelle la
 * garantiscono le pagine (chiave coi criteri; l'elenco scrive il SIGC coi suoi criteri: review H-11).
 */
export function ricercaConSigc(ricerca: string, valore: ValoreSigc | undefined): string {
  const p = new URLSearchParams(ricerca);
  if (valore === undefined) p.delete(PARAMETRO_SIGC);
  else p.set(PARAMETRO_SIGC, valore);
  return p.toString();
}

/** Un percorso col solo filtro SIGC dato (la voce dell'area nel menu e nelle briciole; review H-12). */
export function percorsoConSigc(percorso: string, valore: ValoreSigc | undefined): string {
  return valore === undefined ? percorso : `${percorso}?${PARAMETRO_SIGC}=${valore}`;
}

/** Il filtro come lo dice l'utente; assente = tutti. */
export function etichettaSigc(valore: ValoreSigc | undefined): FiltroSigc | undefined {
  return valore === undefined ? undefined : valore === 'true' ? 'SIGC' : 'NO SIGC';
}

/**
 * La riga del filtro SIGC fra i "Filtri applicati" dell'intestazione dei PNG e dei file (NFR-50): "Interventi: SIGC", o
 * niente senza filtro. La stessa in tutte le aree (review J-03).
 */
export function righeSigc(valore: ValoreSigc | undefined): string[] {
  const e = etichettaSigc(valore);
  return e ? [`Interventi: ${e}`] : [];
}

/**
 * Il sottotitolo di una card non pertinente senza le istruzioni d'uso ("Clic su una barra: ...", "Trascina ..."): nel corpo
 * non attivabile non valgono (review H-08, A-06). Le frasi si separano su punto o punto e virgola; senza istruzioni resta
 * com'e'.
 */
export function senzaIstruzioni(testo: string | undefined): string | undefined {
  if (!testo) return testo;
  const frasi = testo.split(/(?<=[.;])\s+/);
  const restano = frasi.filter((f) => !/^(clic|trascina)\b/i.test(f.trim()));
  if (restano.length === frasi.length) return testo;
  const unito = restano.join(' ').trim().replace(/;$/, '.');
  return unito || undefined;
}

/** Una card (o una pagina) di un solo tipo col filtro opposto: il filtro scelto e il motivo leggibile. */
export interface NonPertinenza {
  filtro: FiltroSigc;
  motivo: string;
}

/** Di che tipo sono i dati di una card di un solo tipo. */
export type SoloTipo = 'sigc' | 'nosigc';

/**
 * La non pertinenza di una card di un solo tipo: con il filtro opposto (solo SIGC con NO SIGC, solo NO SIGC con SIGC) il
 * filtro e il motivo, altrimenti null (la card e' normale).
 */
export function nonPertinenza(sigc: ValoreSigc | undefined, solo: SoloTipo, motivo: string): NonPertinenza | null {
  if (solo === 'sigc' && sigc === 'false') return { filtro: 'NO SIGC', motivo };
  if (solo === 'nosigc' && sigc === 'true') return { filtro: 'SIGC', motivo };
  return null;
}

/** I criteri senza il filtro SIGC: la lettura di una card non pertinente (lo stesso dato, e la stessa cache, di "Tutti"). */
export function senzaSigc<C extends { sigc?: unknown }>(criteri: C): C {
  if (criteri.sigc === undefined) return criteri;
  const resto: C = { ...criteri };
  delete resto.sigc;
  return resto;
}

/** Una card di un solo tipo: la sua non pertinenza e i criteri della sua lettura, dalla stessa decisione. */
export interface LetturaDelTipo<C> {
  np: NonPertinenza | null;
  criteri: C;
}

/**
 * Una sola decisione per la resa e la lettura di una card di un solo tipo (review H-06: prima ricopiata in ogni pagina):
 * col filtro opposto e' non pertinente e legge senza filtro (il dato reale, la stessa cache di "Tutti": F3), altrimenti e'
 * normale e legge coi criteri dati.
 */
export function letturaDelTipo<C extends { sigc?: ValoreSigc }>(criteri: C, solo: SoloTipo, motivo: string): LetturaDelTipo<C> {
  const np = nonPertinenza(criteri.sigc, solo, motivo);
  return { np, criteri: np ? senzaSigc(criteri) : criteri };
}
