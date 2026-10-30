// collegamenti.ts — gli indirizzi dei links[] dello uiplan dell'istituzionale (PURO, ADR 0028 §8): il dettaglio
// dell'intervento dai due report (con l'anno dalla verifica non SIGC, con l'esercizio dalla SIGC), le due verifiche
// filtrate dal dettaglio, i link reciproci fra le due verifiche coi filtri comuni (scelta di disegno 1 del 30/10/2026: non
// l'anno ne' l'esercizio, che non si traducono), le domande e i pagamenti dell'elenco operativo (OP-IS-09: link tenuti
// dall'utente il 22/10/2026, la coincidenza vale per definizione, D-05 del backend). Ogni link porta solo i parametri
// della sua `query`, nell'ordine dello uiplan; verso un'altra feature e' solo URL, nessun import dalla feature di arrivo.
import { PERCORSO_ELENCO_DOMANDE, PERCORSO_ELENCO_PAGAMENTI } from '../../../entities/domanda';
import { ricercaDaFiltri } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { isAnnoValido, scriviRipetuti } from '../../../shared/lib';
import { PARAMETRO_ANNO, PARAMETRO_ESERCIZIO } from './criteri';
import { PERCORSI } from './pagine';

/** La route della verifica SMP SIGC, destinazione di link:verifica-smp-sigc (nell'istituzionale dal 29/10/2026). */
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

/** Il percorso del dettaglio col codice CODIFICATO: un valore con '/' resta un solo segmento della route. */
const dettaglio = (codice: string) => `${PERCORSI.interventi}/${encodeURIComponent(codice)}`;

/** link:dettaglio-intervento-smp: il dettaglio dell'intervento e, dalla verifica non SIGC, l'anno di riferimento scelto. */
export function percorsoIntervento(codice: string, annoScelto?: number): string {
  return conQuery(dettaglio(codice), [PARAMETRO_ANNO], { [PARAMETRO_ANNO]: anno(annoScelto) });
}

/**
 * link:dettaglio-intervento-smp-sigc: il dettaglio dell'intervento con l'esercizio scelto nella verifica SMP SIGC; con
 * l'esercizio e senza l'anno il dettaglio si apre sulla scheda Verifica SMP SIGC.
 */
export function percorsoInterventoSigc(codice: string, esercizio?: number): string {
  return conQuery(dettaglio(codice), [PARAMETRO_ESERCIZIO], { [PARAMETRO_ESERCIZIO]: anno(esercizio) });
}

/** link:verifica-smp-intervento: la verifica SMP non SIGC filtrata sull'intervento, con l'anno scelto nel dettaglio. */
export function verificaDellIntervento(codice: string, annoScelto?: number): string {
  return conQuery(PERCORSI.verifica, ['intervento', PARAMETRO_ANNO], { intervento: codice, [PARAMETRO_ANNO]: anno(annoScelto) });
}

/** link:verifica-smp-sigc-intervento: la verifica SMP SIGC filtrata sull'intervento, con l'esercizio scelto nel dettaglio. */
export function verificaSigcDellIntervento(codice: string, esercizio?: number): string {
  return conQuery(PERCORSI.verificaSigc, ['intervento', PARAMETRO_ESERCIZIO], { intervento: codice, [PARAMETRO_ESERCIZIO]: anno(esercizio) });
}

/** Il percorso coi filtri comuni (intervento, os, og, op, azione, nell'ordine della query dello uiplan). */
function conFiltri(percorso: string, filtri: Filtri): string {
  const query = ricercaDaFiltri(filtri);
  return query ? `${percorso}?${query}` : percorso;
}

/**
 * link:verifica-smp-sigc: dalla verifica non SIGC la verifica SMP SIGC coi filtri correnti, senza l'anno (l'anno di
 * riferimento del file non si traduce nell'esercizio, che la verifica SIGC chiede col suo selettore).
 */
export function verificaSigcConFiltri(filtri: Filtri): string {
  return conFiltri(PERCORSI.verificaSigc, filtri);
}

/** link:verifica-smp-non-sigc: dalla verifica SIGC la verifica SMP non SIGC coi filtri correnti, senza l'esercizio. */
export function verificaNonSigcConFiltri(filtri: Filtri): string {
  return conFiltri(PERCORSI.verifica, filtri);
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
