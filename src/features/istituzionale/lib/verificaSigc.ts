// verificaSigc.ts — la verifica SMP SIGC come DATI (PURO, zero React; flussi verifica-smp-sigc e intervento approvati il
// 30/10/2026): i venti dati di TX-0015 per intervento nell'ordine della pagina del finanziario da cui viene, col titolo
// della colonna (tabella della pagina) e della voce (scheda Verifica SMP SIGC del dettaglio), il tipo del valore e le
// colonne nascoste di partenza (visibili quelle del low-fi, le altre da "Colonne", come nella verifica non SIGC); il valore
// per l'ordinamento, il testo della ricerca e i riferimenti della risposta (pagina e scheda). I componenti li rendono con
// un map: qui nessun calcolo resta nei componenti.
import { testoPerimetro } from '../../../shared/lib';
import type { ValoreOrdinabile } from '../../../shared/lib';
import type { RigaVerificaSigc, VerificaSigc } from './dto';
import { annoOpzionale, numeroOpzionale, periodoEsercizio, siNo } from './formato';

/**
 * Il tipo del valore di un dato di TX-0015: conteggio col motivo (avvisi e azioni attivate), conteggio, importo e si'/no col
 * motivo, quantita' di output, numero facoltativo (ettari o UBA) e testo facoltativo (indicatori), "non disponibile" se
 * assenti.
 */
export type TipoDatoSigc = 'conteggioMotivato' | 'conteggio' | 'importo' | 'siNo' | 'quantita' | 'numero' | 'testo';
export type CampoVerificaSigc = Exclude<keyof RigaVerificaSigc, 'codiceIntervento'>;

export interface DatoVerificaSigc {
  campo: CampoVerificaSigc;
  /** Titolo della colonna nella tabella della verifica SMP SIGC (quello della pagina del finanziario). */
  colonna: string;
  /** Etichetta della voce nella scheda Verifica SMP SIGC del dettaglio dell'intervento. */
  voce: string;
  tipo: TipoDatoSigc;
  /** Parte nascosta nella tabella (si mostra da "Colonne"): visibili quelle del wireframe approvato. */
  nascosta?: boolean;
}

/** I dati di TX-0015 nell'ordine della pagina e del wireframe (l'intervento e' l'intestazione di riga, a parte). */
export const DATI_VERIFICA_SIGC: readonly DatoVerificaSigc[] = [
  { campo: 'avvisiAttivati', colonna: 'Avvisi attivati', voce: 'Avvisi attivati', tipo: 'conteggioMotivato' },
  { campo: 'azioniAttivate', colonna: 'Azioni attivate', voce: 'Azioni attivate', tipo: 'conteggioMotivato' },
  { campo: 'domandeRicevute', colonna: 'Domande ricevute', voce: 'Domande ricevute', tipo: 'conteggio' },
  { campo: 'domandeRicevuteSenzaRichiesto', colonna: 'Domande ricevute senza richiesto', voce: 'Domande ricevute senza importo richiesto (escluse dal valore)', tipo: 'conteggio', nascosta: true },
  { campo: 'valoreDomandeRicevute', colonna: 'Valore domande ricevute', voce: 'Valore delle domande ricevute', tipo: 'importo', nascosta: true },
  { campo: 'domandeFinanziate', colonna: 'Domande finanziate', voce: 'Domande finanziate', tipo: 'conteggio' },
  { campo: 'valoreDomandeFinanziate', colonna: 'Valore domande finanziate', voce: 'Valore delle domande finanziate', tipo: 'importo', nascosta: true },
  { campo: 'dotazioneAnnoPrecedente', colonna: 'Dotazione anno precedente', voce: "Dotazione dell'anno precedente", tipo: 'importo', nascosta: true },
  { campo: 'dotazionePeriodoImpegno', colonna: 'Dotazione periodo di impegno', voce: "Dotazione dell'intero periodo di impegno", tipo: 'importo', nascosta: true },
  { campo: 'domandePagateEsercizio', colonna: "Domande pagate nell'esercizio", voce: "Domande pagate nell'esercizio", tipo: 'conteggio' },
  { campo: 'spesaErogataCampagnaPrecedente', colonna: 'Spesa erogata campagna precedente', voce: "Spesa erogata nell'esercizio, campagna precedente", tipo: 'importo' },
  { campo: 'spesaErogataCampagneAnteriori', colonna: 'Spesa erogata campagne anteriori', voce: "Spesa erogata nell'esercizio, campagne anteriori", tipo: 'importo' },
  { campo: 'previsionePagamentoEsercizio', colonna: "Si prevede di pagare nell'esercizio", voce: "Si prevede di pagare importi entro l'esercizio", tipo: 'siNo' },
  { campo: 'importoTopUp', colonna: 'Importo top-up', voce: 'Importo top-up', tipo: 'importo', nascosta: true },
  { campo: 'includeTopUp', colonna: 'Include top-up', voce: 'La dotazione include top-up', tipo: 'siNo' },
  { campo: 'ettariUbaRichiesti', colonna: 'Ettari o UBA richiesti', voce: 'Ettari o UBA richiesti', tipo: 'numero', nascosta: true },
  { campo: 'outputAttesoFinanziate', colonna: 'Output atteso delle finanziate', voce: 'Output atteso delle domande finanziate', tipo: 'quantita', nascosta: true },
  { campo: 'outputErogatoEsercizio', colonna: "Output erogato nell'esercizio", voce: "Output erogato nell'esercizio (solo SIGC)", tipo: 'quantita' },
  { campo: 'indicatoreOutput', colonna: 'Indicatore di output', voce: 'Indicatore comune di output', tipo: 'testo', nascosta: true },
  { campo: 'indicatoreRisultato', colonna: 'Indicatore di risultato', voce: 'Indicatore di risultato', tipo: 'testo', nascosta: true },
];

/** Valore per l'ordinamento della colonna: il numero o il testo; i si'/no come il loro testo; assente = null. */
export function valoreOrdinabileSigc(r: RigaVerificaSigc, d: DatoVerificaSigc): ValoreOrdinabile {
  const campo = r[d.campo];
  const v = typeof campo === 'object' && campo !== null ? campo.valore : campo;
  if (typeof v === 'boolean') return siNo(v);
  return typeof v === 'number' || typeof v === 'string' ? v : null;
}

/** Testo su cui cerca la ricerca della tabella: il codice dell'intervento e gli indicatori. */
export function testoRicercaSigc(r: RigaVerificaSigc): string {
  return `${r.codiceIntervento ?? ''} ${r.indicatoreOutput ?? ''} ${r.indicatoreRisultato ?? ''}`;
}

/** L'esercizio coi suoi estremi: "2025 (dal 16/10/2024 al 15/10/2025)"; `compresi` aggiunge "estremi compresi". */
export function testoEsercizio(esercizio: number, compresi = false): string {
  return `${esercizio} (${periodoEsercizio(esercizio)}${compresi ? ', estremi compresi' : ''})`;
}

type Riferimenti = Pick<VerificaSigc, 'esercizio' | 'annoDomande' | 'pagamentiSenzaData' | 'perimetro'>;

/**
 * I riferimenti della risposta della pagina (tabella sopra la card): esercizio con gli estremi, anno delle domande,
 * pagamenti senza data di autorizzazione (esclusi dall'esercizio e contati), perimetro. L'esercizio e' quello della
 * risposta, oppure quello chiesto.
 */
export function vociRiferimentiSigc(d: Riferimenti, chiesto: number): { etichetta: string; valore: string }[] {
  return [
    { etichetta: 'Esercizio', valore: testoEsercizio(d.esercizio ?? chiesto, true) },
    { etichetta: 'Anno delle domande', valore: annoOpzionale(d.annoDomande) },
    { etichetta: "Pagamenti senza data di autorizzazione (esclusi dall'esercizio)", valore: numeroOpzionale(d.pagamentiSenzaData) },
    { etichetta: 'Perimetro', valore: testoPerimetro(d.perimetro ?? 'REGIONALE') },
  ];
}

/** I riferimenti in testa alle voci della scheda SIGC del dettaglio: esercizio, anno delle domande, pagamenti senza data. */
export function vociRiferimentiSigcIntervento(d: Riferimenti, chiesto: number): { etichetta: string; valore: string }[] {
  return [
    { etichetta: 'Esercizio', valore: testoEsercizio(d.esercizio ?? chiesto) },
    { etichetta: 'Anno delle domande', valore: annoOpzionale(d.annoDomande) },
    { etichetta: "Pagamenti dell'intervento senza data di autorizzazione (esclusi dall'esercizio)", valore: numeroOpzionale(d.pagamentiSenzaData) },
  ];
}
