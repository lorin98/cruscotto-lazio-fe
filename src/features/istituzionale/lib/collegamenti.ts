// collegamenti.ts — gli indirizzi dei links[] dello uiplan dell'istituzionale (PURO, ADR 0028 §8): il dettaglio
// dell'intervento dai due report e la verifica filtrata dal dettaglio (stessa feature), le domande e i pagamenti
// dell'elenco operativo (OP-IS-09: link tenuti dall'utente il 22/10/2026, la coincidenza vale per definizione, D-05 del
// backend) e la verifica SMP SIGC, nella stessa area dal 29/10/2026 (il link G4, ancora senza filtri portati). Ogni link
// porta solo i parametri della sua `query`, nell'ordine dello uiplan; verso un'altra feature e' solo URL, nessun import
// dalla feature di arrivo.
import { PERCORSO_ELENCO_DOMANDE, PERCORSO_ELENCO_PAGAMENTI } from '../../../entities/domanda';
import { isAnnoValido, scriviRipetuti } from '../../../shared/lib';
import { PARAMETRO_ANNO } from './criteri';
import { PERCORSI } from './pagine';

/**
 * link:verifica-smp-sigc (decisione G4): la verifica SMP SIGC, dal 29/10/2026 nell'istituzionale; per ora senza parametri
 * (query vuota), i filtri comuni li porta lo step6.
 */
export const VERIFICA_SMP_SIGC = PERCORSI.verificaSigc;

/** Percorso con la query delle chiavi date, nell'ordine dato; senza valori il solo percorso. */
function conQuery(percorso: string, chiavi: readonly string[], valori: Record<string, string | undefined>): string {
  const query = scriviRipetuti(chiavi, (k) => {
    const v = valori[k];
    return v === undefined ? [] : [v];
  });
  return query ? `${percorso}?${query}` : percorso;
}

const anno = (a: number | undefined) => (isAnnoValido(a) ? String(a) : undefined);

/**
 * link:dettaglio-intervento-smp: il dettaglio dell'intervento, col codice nel percorso CODIFICATO (un valore con '/' resta
 * un solo segmento della route) e, dalla verifica non SIGC, l'anno di riferimento scelto.
 */
export function percorsoIntervento(codice: string, annoScelto?: number): string {
  return conQuery(`${PERCORSI.interventi}/${encodeURIComponent(codice)}`, [PARAMETRO_ANNO], { [PARAMETRO_ANNO]: anno(annoScelto) });
}

/** link:verifica-smp-intervento: la verifica SMP non SIGC filtrata sull'intervento, con l'anno scelto nel dettaglio. */
export function verificaDellIntervento(codice: string, annoScelto?: number): string {
  return conQuery(PERCORSI.verifica, ['intervento', PARAMETRO_ANNO], { intervento: codice, [PARAMETRO_ANNO]: anno(annoScelto) });
}

/**
 * link:elenco-ricevute-riga e link:elenco-ricevute-intervento: le domande di sostegno correnti dell'intervento
 * nell'elenco operativo (tipo=SOSTEGNO: D-05 del backend, le ricevute sono le domande correnti di sostegno).
 */
export function elencoRicevute(codice: string): string {
  return conQuery(PERCORSO_ELENCO_DOMANDE, ['tipo', 'intervento'], { tipo: 'SOSTEGNO', intervento: codice });
}

/**
 * link:elenco-spesa-riga e link:elenco-spesa-intervento: le righe PAGATA non SIGC degli elenchi di liquidazione
 * dell'intervento (esito=PAGATA, sigc=false: la negazione esatta del predicato SIGC dei pagamenti, anticipi inclusi).
 */
export function elencoSpesa(codice: string): string {
  return conQuery(PERCORSO_ELENCO_PAGAMENTI, ['esito', 'sigc', 'intervento'], { esito: 'PAGATA', sigc: 'false', intervento: codice });
}

/** Il link verso l'elenco si mostra solo con un valore maggiore di 0 (wireframe: niente link verso un elenco vuoto). */
export function conValore(v: number | null | undefined): boolean {
  return typeof v === 'number' && v > 0;
}
