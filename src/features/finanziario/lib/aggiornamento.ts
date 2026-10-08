// aggiornamento.ts — ultimo dato sincronizzato per flusso d'import (NFR-25 b, OP-FE-04): la risposta di TX-0001 porta, per
// ogni flusso con un'acquisizione conclusa, l'istante di conclusione. Qui solo il testo della riga sotto il titolo.
import { formatDataOra } from '../../../shared/lib/format';

/** Una voce di ultimiDatiSincronizzati (forma della spec; i campi sono facoltativi nel contratto). */
export interface UltimoDato {
  flusso?: string;
  conclusoIl?: string;
}

/** Codice del registro degli import in forma leggibile: PROSA_DS04 -> "PROSA DS-04"; gli altri (es. DS-12) restano come sono. */
export function etichettaFlusso(flusso: string): string {
  const m = /^([A-Z]+)_DS(\d{2})$/.exec(flusso);
  return m ? `${m[1]} DS-${m[2]}` : flusso;
}

/** "DS-12 02/03/2026 10:15; PROSA DS-04 03/03/2026 09:30", oppure "nessuna acquisizione conclusa" (come negli export). */
export function testoUltimiDati(voci: readonly UltimoDato[]): string {
  const complete = voci.filter((v): v is Required<UltimoDato> => !!v.flusso && !!v.conclusoIl);
  if (complete.length === 0) return 'nessuna acquisizione conclusa';
  return complete.map((v) => `${etichettaFlusso(v.flusso)} ${formatDataOra(v.conclusoIl)}`).join('; ');
}

/** L'istante di conclusione piu' recente fra le voci complete (ISO), o undefined se nessuna voce e' completa. */
export function piuRecente(voci: readonly UltimoDato[]): string | undefined {
  const istanti = voci.filter((v) => v.flusso && v.conclusoIl).map((v) => v.conclusoIl as string);
  return istanti.length ? istanti.reduce((a, b) => (new Date(b).getTime() > new Date(a).getTime() ? b : a)) : undefined;
}
