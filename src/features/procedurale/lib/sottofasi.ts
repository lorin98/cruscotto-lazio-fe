// sottofasi.ts — le sottofasi di ammissibilita' come DATI (PURO, zero React; TX-0031, TX-0032): le righe della tabella
// delle voci di SR-01 (la voce, la sottofase censita che la abbina, l'esito, le domande della voce e della sottofase
// censita) e quelle delle altre sottofasi dell'anagrafica, nell'ordine della risposta; lo stato vuoto dell'anagrafica
// (tutte le voci non censite, nessun errore) e quello di un insieme filtrato senza domande con la fonte attiva (voci a 0,
// D-06 Rev. 6). La pagina non somma: la voce conta le domande distinte (D-06 Rev. 5).
import { maiuscolaIniziale } from '../../../shared/lib';
import type { Dato, SottofaseCensita, Sottofasi, VoceSottofase } from './dto';

/** Il testo di una sottofase censita: "CODICE - descrizione dell'anagrafica". */
export function testoCensita(c: SottofaseCensita): string {
  return `${c.codice} - ${c.descrizione}`;
}

/** La voce di SR-01 con l'iniziale maiuscola (il backend la scrive minuscola). */
export function etichettaVoce(v: Pick<VoceSottofase, 'descrizione'>): string {
  return maiuscolaIniziale(v.descrizione);
}

/** Una riga della tabella delle voci: la censita null = voce non censita (esito e domande della sottofase non ci sono). */
export interface RigaVoceSottofase {
  chiave: string;
  voce: string;
  censita: string | null;
  esito: string | null;
  domandeVoce: Dato;
  domandeCensita: Dato | null;
}

/** Le righe della tabella delle voci, nell'ordine di SR-01 (quello della risposta). */
export function righeVoci(s: Sottofasi): RigaVoceSottofase[] {
  return (s.voci ?? []).map((v) => ({
    chiave: v.fase,
    voce: etichettaVoce(v),
    censita: v.censita ? testoCensita(v.censita) : null,
    esito: v.censita?.esito ?? null,
    domandeVoce: v.domande,
    domandeCensita: v.censita?.domande ?? null,
  }));
}

/** Le altre sottofasi dell'anagrafica (codice libero, nessuna voce le prende), ciascuna con le sue domande. */
export function altreSottofasi(s: Sottofasi): SottofaseCensita[] {
  return s.altre ?? [];
}

/** Anagrafica vuota: nessuna voce censita e nessuna altra sottofase (lo stato lo dice, non e' un errore). */
export function anagraficaVuota(s: Sottofasi): boolean {
  return (s.voci ?? []).every((v) => v.censita === null) && altreSottofasi(s).length === 0;
}

const zero = (d: Dato | undefined) => d?.valore === 0;

/** Con la fonte attiva e i filtri, nessuna domanda nell'insieme: tutte le voci e le altre sottofasi a 0. */
export function senzaDomandeNeiFiltri(s: Sottofasi): boolean {
  const voci = (s.voci ?? []).filter((v) => v.censita !== null);
  return voci.length > 0 && voci.every((v) => zero(v.domande)) && altreSottofasi(s).every((a) => zero(a.domande));
}
