// superfici.ts — conti PURI sulla risposta di TX-0018 (zero React): campagne presenti, campagna di riferimento, totali di
// una campagna, righe della tabella, interventi senza superfici. Regole del backend (D-01): le superfici di campagne
// diverse NON si sommano (un impegno pluriennale ripete la stessa DS in piu' campagne), dentro una campagna si' (ogni
// domanda e' di un solo intervento, quindi la somma fra interventi non conta due volte). Il report e' completo (nessuna
// paginazione lato server): i KPI e i totali per campagna sono somme delle righe della stessa campagna.
import { centesimi, percentuale } from '../../../shared/lib';
import type { CampagnaSuperficie, InterventoSuperficie } from './dto';

/** Le campagne presenti nella risposta, dalla piu' recente. */
export function campagnePresenti(righe: readonly InterventoSuperficie[]): number[] {
  return [...new Set(righe.flatMap((r) => r.campagne.map((c) => c.anno)))].sort((a, b) => b - a);
}

/**
 * La campagna di riferimento di KPI, barre per intervento e verifica incrociata (scelta di disegno approvata il
 * 22/10/2026): quella del filtro Campagna, altrimenti la piu' recente presente nella risposta; null se la risposta non ha
 * campagne (nessuna superficie).
 */
export function campagnaDiRiferimento(righe: readonly InterventoSuperficie[], filtro: number | undefined): number | null {
  if (filtro !== undefined) return filtro;
  return campagnePresenti(righe)[0] ?? null;
}

/** La campagna `anno` di un intervento, se ha domande con superfici in quella campagna. */
export function campagnaDi(riga: InterventoSuperficie, anno: number): CampagnaSuperficie | undefined {
  return riga.campagne.find((c) => c.anno === anno);
}

/** Somme di una campagna fra gli interventi che la hanno. */
export interface TotaliCampagna {
  anno: number;
  /** Interventi con superfici nella campagna. */
  interventi: number;
  domandePagamento: number;
  domandeSostegno: number;
  sostegniDiscordanti: number;
  superficieDs: number;
  superficieDp: number;
  differenzaDpDs: number;
  domandeDpOltreDs: number;
}

function somma(campagne: readonly CampagnaSuperficie[], anno: number): TotaliCampagna {
  const tot = (leggi: (c: CampagnaSuperficie) => number) => campagne.reduce((acc, c) => acc + leggi(c), 0);
  return {
    anno,
    interventi: campagne.length,
    domandePagamento: tot((c) => c.domandePagamento),
    domandeSostegno: tot((c) => c.domandeSostegno),
    sostegniDiscordanti: tot((c) => c.sostegniDiscordanti),
    superficieDs: centesimi(tot((c) => c.superficieDs)),
    superficieDp: centesimi(tot((c) => c.superficieDp)),
    differenzaDpDs: centesimi(tot((c) => c.differenzaDpDs)),
    domandeDpOltreDs: tot((c) => c.domandeDpOltreDs),
  };
}

/** I totali della campagna `anno` sulle righe date; null se nessun intervento ha superfici in quella campagna. */
export function totaliCampagna(righe: readonly InterventoSuperficie[], anno: number): TotaliCampagna | null {
  const campagne = righe.flatMap((r) => r.campagne.filter((c) => c.anno === anno));
  return campagne.length === 0 ? null : somma(campagne, anno);
}

/** I totali di ogni campagna presente, in ordine crescente (la serie per campagna) o decrescente (il piede della tabella). */
export function totaliPerCampagna(righe: readonly InterventoSuperficie[], ordine: 'crescente' | 'decrescente' = 'crescente'): TotaliCampagna[] {
  const anni = campagnePresenti(righe);
  const ordinati = ordine === 'crescente' ? [...anni].reverse() : anni;
  return ordinati.map((anno) => totaliCampagna(righe, anno)).filter((t): t is TotaliCampagna => t !== null);
}

/** Quota (centesimi, arrotondata) delle domande con DP oltre la DS sulle domande di pagamento; null senza domande. */
export function quotaDpOltreDs(t: Pick<TotaliCampagna, 'domandeDpOltreDs' | 'domandePagamento'>): number | null {
  return t.domandePagamento > 0 ? percentuale(t.domandeDpOltreDs, t.domandePagamento) : null;
}

/** Perche' un intervento manca da un grafico della campagna: nessuna superficie in nessuna campagna, o non in questa. */
export interface InterventoSenzaSuperfici {
  codice: string;
  motivo: 'nessuna-campagna' | 'non-in-campagna';
}

/** Gli interventi fuori dai grafici della campagna `anno`, nell'ordine della risposta (codice). */
export function senzaSuperfici(righe: readonly InterventoSuperficie[], anno: number): InterventoSenzaSuperfici[] {
  return righe
    .filter((r) => campagnaDi(r, anno) === undefined)
    .map((r) => ({ codice: r.codiceIntervento, motivo: r.campagne.length === 0 ? 'nessuna-campagna' : 'non-in-campagna' }));
}

/** Una riga della tabella: un intervento in una campagna, oppure l'intervento senza superfici (campagna null). */
export interface RigaSuperficie {
  chiave: string;
  codiceIntervento: string;
  campagna: CampagnaSuperficie | null;
  /** Motivo dell'assenza della riga senza campagna (NON_VALORIZZATO). */
  motivo: string | null;
}

/** Una riga per intervento e campagna (come il file CSV e XLSX di D-06); un intervento senza superfici ha una riga sola. */
export function righeTabella(righe: readonly InterventoSuperficie[]): RigaSuperficie[] {
  return righe.flatMap((r): RigaSuperficie[] =>
    r.campagne.length === 0
      ? [{ chiave: r.codiceIntervento, codiceIntervento: r.codiceIntervento, campagna: null, motivo: r.motivo ?? 'NON_VALORIZZATO' }]
      : r.campagne.map((c) => ({ chiave: `${r.codiceIntervento}:${c.anno}`, codiceIntervento: r.codiceIntervento, campagna: c, motivo: null })),
  );
}

/** Le righe della tabella riportate agli interventi (per i totali sulle righe trovate dalla ricerca). */
export function interventiDelleRighe(righe: readonly RigaSuperficie[]): InterventoSuperficie[] {
  const perCodice = new Map<string, CampagnaSuperficie[]>();
  for (const r of righe) {
    const campagne = perCodice.get(r.codiceIntervento) ?? [];
    if (r.campagna) campagne.push(r.campagna);
    perCodice.set(r.codiceIntervento, campagne);
  }
  return [...perCodice].map(([codiceIntervento, campagne]) => ({ codiceIntervento, campagne, motivo: campagne.length === 0 ? 'NON_VALORIZZATO' : null }));
}

/**
 * Cosa mostra la pagina: nessun intervento per i filtri; interventi ma nessuna superficie nella campagna di riferimento (o
 * in nessuna campagna, senza filtro Campagna): mai una pagina di zeri; altrimenti i dati.
 */
export type EsitoSuperfici = { tipo: 'nessun-intervento' } | { tipo: 'senza-superfici'; campagna: number | null } | { tipo: 'dati'; campagna: number };

export function esitoSuperfici(righe: readonly InterventoSuperficie[], filtroCampagna: number | undefined): EsitoSuperfici {
  if (righe.length === 0) return { tipo: 'nessun-intervento' };
  const campagna = campagnaDiRiferimento(righe, filtroCampagna);
  if (campagna === null || totaliCampagna(righe, campagna) === null) return { tipo: 'senza-superfici', campagna };
  return { tipo: 'dati', campagna };
}
