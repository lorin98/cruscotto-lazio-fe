// verifica.ts — la verifica SMP non SIGC come DATI (PURO, zero React): i ventuno dati di TX-0016 per intervento nell'ordine
// del wireframe approvato, col titolo della colonna (tabella della pagina) e della voce (scheda del dettaglio), il tipo del
// valore, le colonne nascoste di partenza (visibili quelle del low-fi, le altre da "Colonne") e i due link verso l'elenco
// operativo (OP-IS-09); il valore per l'ordinamento e il testo dei valori; i riferimenti della risposta. I componenti li
// rendono con un map: qui nessun calcolo resta nei componenti.
import { codiceDelPercorso } from '../../../entities/filtri';
import { formatDate, formatEuro, formatNumber, testoPerimetro } from '../../../shared/lib';
import type { ValoreOrdinabile } from '../../../shared/lib';
import { conValore, elencoRicevute, elencoSpesa } from './collegamenti';
import type { RigaVerifica, Verifica } from './dto';
import { quantitaConIndicatore, siNo, testoAnnoDiRiferimento, testoOutputErogato } from './formato';

/** Il tipo del valore di un dato: conteggio, importo, data, si'/no, quantita' e testo col motivo; numero sempre valorizzato. */
export type TipoDato = 'conteggio' | 'importo' | 'data' | 'siNo' | 'quantita' | 'testo' | 'numero';
/** Il link verso l'elenco operativo di un dato: le domande ricevute (TX-0056) o la spesa erogata (TX-0059). */
export type LinkDato = 'ricevute' | 'spesa';
export type CampoVerifica = Exclude<keyof RigaVerifica, 'codiceIntervento'>;

export interface DatoVerifica {
  campo: CampoVerifica;
  /** Titolo della colonna nella tabella della verifica. */
  colonna: string;
  /** Etichetta della voce nella scheda Verifica SMP non SIGC del dettaglio. */
  voce: string;
  tipo: TipoDato;
  /** Parte nascosta nella tabella (si mostra da "Colonne"): visibili quelle del wireframe approvato. */
  nascosta?: boolean;
  link?: LinkDato;
}

/** I dati di TX-0016 nell'ordine del wireframe (l'intervento e' l'intestazione di riga, a parte). */
export const DATI_VERIFICA: readonly DatoVerifica[] = [
  { campo: 'avvisiAttivati', colonna: 'Avvisi attivati', voce: 'Avvisi attivati', tipo: 'conteggio' },
  { campo: 'avvisiChiusi', colonna: 'Avvisi chiusi', voce: 'Avvisi chiusi', tipo: 'conteggio' },
  { campo: 'azioniAttivate', colonna: 'Azioni attivate', voce: 'Azioni attivate', tipo: 'conteggio' },
  { campo: 'dotazioneAvvisi', colonna: 'Dotazione avvisi', voce: 'Dotazione degli avvisi', tipo: 'importo' },
  { campo: 'chiusuraUltimoAvvisoAperto', colonna: 'Chiusura ultimo avviso aperto', voce: "Chiusura dell'ultimo avviso aperto", tipo: 'data', nascosta: true },
  { campo: 'domandeRicevute', colonna: 'Domande ricevute', voce: 'Domande ricevute', tipo: 'numero', link: 'ricevute' },
  { campo: 'domandeRicevuteSenzaRichiesto', colonna: 'Domande ricevute senza richiesto', voce: 'Domande ricevute senza importo richiesto (escluse dal valore)', tipo: 'numero', nascosta: true },
  { campo: 'valoreDomandeRicevute', colonna: 'Valore domande ricevute', voce: 'Valore delle domande ricevute', tipo: 'importo', nascosta: true },
  { campo: 'domandeFinanziate', colonna: 'Domande finanziate', voce: 'Domande finanziate', tipo: 'numero', nascosta: true },
  { campo: 'valoreDomandeFinanziate', colonna: 'Valore domande finanziate', voce: 'Valore delle domande finanziate', tipo: 'importo', nascosta: true },
  { campo: 'domandeSaldate', colonna: 'Domande pagate (solo saldate)', voce: 'Domande pagate (solo saldate al 100%, definizione da confermare con ARSIAL)', tipo: 'numero', nascosta: true },
  { campo: 'anticipiErogati', colonna: 'Anticipi erogati', voce: 'Anticipi erogati', tipo: 'importo', nascosta: true },
  { campo: 'spesaErogata', colonna: 'Spesa erogata (anticipi inclusi)', voce: 'Spesa pubblica erogata (anticipi inclusi, al lordo dei recuperi)', tipo: 'importo', link: 'spesa' },
  { campo: 'concessioniPreviste', colonna: 'Concessioni previste senza impegni', voce: 'In assenza di importi impegnati, sono previste concessioni', tipo: 'siNo' },
  { campo: 'includeTopUp', colonna: 'Include top-up', voce: 'La dotazione include top-up', tipo: 'siNo' },
  { campo: 'importoTopUp', colonna: 'Importo top-up', voce: 'Importo top-up', tipo: 'importo' },
  { campo: 'outputAttesoFinanziate', colonna: 'Output atteso delle finanziate', voce: 'Output atteso delle domande finanziate', tipo: 'quantita', nascosta: true },
  { campo: 'outputErogato', colonna: 'Output erogato', voce: 'Output erogato (valore del file)', tipo: 'quantita' },
  { campo: 'indicatoreOutput', colonna: 'Indicatore di output', voce: 'Indicatore comune di output', tipo: 'testo', nascosta: true },
  { campo: 'indicatoreRisultato', colonna: 'Indicatore di risultato', voce: 'Indicatore di risultato', tipo: 'testo', nascosta: true },
];

/** Il titolo del dato nella tabella o nella scheda: l'output erogato dice se e' cumulativo (outputCumulativo, D-04). */
export function titoloDato(d: DatoVerifica, forma: 'colonna' | 'voce', cumulativo: boolean): string {
  const titolo = d[forma];
  if (d.campo !== 'outputErogato' || !cumulativo) return titolo;
  return forma === 'colonna' ? `${titolo} (cumulativo)` : 'Output erogato (valore del file, cumulativo)';
}

/** Il valore (o il dato motivato) del campo, letto dalla riga. */
function grezzo(r: RigaVerifica, d: DatoVerifica): unknown {
  const v = r[d.campo];
  return typeof v === 'object' && v !== null ? v.valore : v;
}

/** Valore per l'ordinamento della colonna: il numero, la data ISO, il testo; i si'/no come il loro testo; assente = null. */
export function valoreOrdinabile(r: RigaVerifica, d: DatoVerifica): ValoreOrdinabile {
  const v = grezzo(r, d);
  if (typeof v === 'boolean') return siNo(v);
  return typeof v === 'number' || typeof v === 'string' ? v : null;
}

/**
 * Il testo di un valore presente del tipo dato: conteggi in italiano, euro al centesimo, date gg/mm/aaaa, quantita' col
 * codice dell'indicatore accanto quando chi la rende lo da' (le voci del dettaglio dell'intervento, OP-IS-12).
 */
export function testoValore(tipo: TipoDato, v: number | string | boolean, indicatore?: string | null): string {
  if (typeof v === 'boolean') return siNo(v);
  if (typeof v === 'string') return tipo === 'data' ? formatDate(v) : v;
  if (tipo === 'importo') return formatEuro(v);
  return tipo === 'quantita' ? quantitaConIndicatore(v, indicatore) : formatNumber(v);
}

/** Il nome accessibile e il testo visibile di un link verso l'elenco, per il codice dell'intervento. */
export const TESTI_LINK: Record<LinkDato, (codice: string) => { testo?: string; descrizione: string }> = {
  ricevute: (codice) => ({ descrizione: `le domande di sostegno correnti dell'intervento ${codice}` }),
  spesa: (codice) => ({ testo: 'Apri nei pagamenti', descrizione: `le righe pagate non SIGC dell'intervento ${codice}` }),
};

/**
 * L'indirizzo del link verso l'elenco di un dato (OP-IS-09): solo col valore maggiore di 0 e se il profilo legge la
 * destinazione (`puo`, gate di UX); altrimenti null (nessun link verso un elenco vuoto o verso un 403). Fail-closed sul
 * codice della risposta, come il finanziario: un codice fuori formato l'elenco lo scarterebbe e aprirebbe un insieme
 * piu' largo di quello che il nome del link dichiara (review A2), quindi nessun link.
 */
export function indirizzoDelDato(r: RigaVerifica, d: DatoVerifica, puo: (l: LinkDato) => boolean): string | null {
  if (d.link === undefined || !puo(d.link) || codiceDelPercorso(r.codiceIntervento) === null) return null;
  if (d.link === 'ricevute') return conValore(r.domandeRicevute) ? elencoRicevute(r.codiceIntervento) : null;
  return conValore(r.spesaErogata.valore) ? elencoSpesa(r.codiceIntervento) : null;
}

/** I riferimenti della risposta (tabella sopra la card): anno di riferimento, come si legge l'output erogato, perimetro. */
export function vociRiferimenti(d: Pick<Verifica, 'annoRiferimento' | 'outputCumulativo' | 'perimetro'>, scelto: number | undefined): { etichetta: string; valore: string }[] {
  return [
    { etichetta: 'Anno di riferimento', valore: testoAnnoDiRiferimento(d.annoRiferimento, scelto) },
    { etichetta: 'Output erogato', valore: testoOutputErogato(d.outputCumulativo) },
    { etichetta: 'Perimetro', valore: testoPerimetro(d.perimetro) },
  ];
}

/** Testo su cui cerca la ricerca della tabella: il codice dell'intervento e gli indicatori. */
export function testoRicerca(r: RigaVerifica): string {
  return `${r.codiceIntervento} ${r.indicatoreOutput.valore ?? ''} ${r.indicatoreRisultato.valore ?? ''}`;
}
