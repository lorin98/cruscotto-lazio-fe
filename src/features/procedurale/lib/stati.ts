// stati.ts — le distribuzioni per stato come DATI (PURO, zero React): le voci di SR-01 della domanda di sostegno
// (TX-0027) e di pagamento (TX-0028) nell'ordine del backend, poi gli altri stati per codice; le voci dello stato area
// programmazione (TX-0029: le dieci di RF025, gli stati osservati, le domande senza stato). Per ogni voce le domande, il
// di cui non rilasciate e la parte rilasciata, quella che l'elenco operativo puo' aprire (D-04 Rev. 5, OP-PR-08). Una
// voce senza fonte (IN_COMPILAZIONE con FONTE_NON_ATTIVA DOMANDE_IN_COMPILAZIONE) ha domande e di cui non rilasciate null:
// il DTO porta 0 nel di cui, che per una voce senza fonte non ha significato (scelta 5 approvata il 22/10/2026).
// Poi le intestazioni brevi delle colonne, i KPI della pagina degli stati, la tabella per intervento e i messaggi di stato
// del suo filtro sulla voce.
import { confronta, formatNumber, maiuscolaIniziale, plurale } from '../../../shared/lib';
import type { AltroStato, Distribuzione, RigaStati, Stati, TipoDomanda, VoceStato } from './dto';

/** La chiave della voce delle domande senza stato area programmazione (TX-0025, voceProgrammazione dell'elenco). */
export const SENZA_STATO = 'SENZA_STATO';
/** La voce senza stato nelle distribuzioni dell'area programmazione (la risposta porta il solo numero). */
const TESTO_SENZA_STATO = 'Senza stato area programmazione (nessuna determina aperta)';

/** Una voce di una distribuzione, come la rendono grafici, tabelle e drawer. */
export interface VoceDistribuzione {
  /** Chiave del drill-down: il nome stabile della voce (RILASCIATO), il codice dell'altro stato, SENZA_STATO. */
  chiave: string;
  etichetta: string;
  /** null = voce senza fonte: mai uno 0. */
  domande: number | null;
  /** Di cui non rilasciate; null con la voce senza fonte. */
  nonRilasciate: number | null;
  /** Il motivo dell'assenza di una voce senza fonte (motivo e fonte del DTO). */
  assenza?: { motivo: string | null; fonte: string | null };
  /** Uno stato fuori catalogo (codice SIAN o codice osservato dell'anagrafica). */
  altro: boolean;
}

function daVoce(v: VoceStato): VoceDistribuzione {
  if (v.domande === null) return { chiave: v.stato, etichetta: maiuscolaIniziale(v.descrizione), domande: null, nonRilasciate: null, assenza: { motivo: v.motivo, fonte: v.fonte }, altro: false };
  return { chiave: v.stato, etichetta: maiuscolaIniziale(v.descrizione), domande: v.domande, nonRilasciate: v.domandeNonRilasciate, altro: false };
}

const perCodice = (altri: readonly AltroStato[]) => [...altri].sort((a, b) => confronta(a.codice, b.codice));

/** Le voci degli stati della domanda: le voci di SR-01 nell'ordine del backend, poi gli altri stati per codice. */
export function vociDegliStati(d: Distribuzione | undefined): VoceDistribuzione[] {
  if (!d) return [];
  const altri = perCodice(d.altriStati).map((a) => ({ chiave: a.codice, etichetta: `Altro stato: ${a.codice} (codice SIAN fuori catalogo)`, domande: a.domande, nonRilasciate: a.domandeNonRilasciate, altro: true }));
  return [...d.voci.map(daVoce), ...altri];
}

/** Le voci dello stato area programmazione: le dieci di RF025, gli stati osservati per codice, le domande senza stato. */
export function vociDellArea(d: Distribuzione | undefined): VoceDistribuzione[] {
  if (!d) return [];
  const osservati = perCodice(d.altriStati).map((a) => ({
    chiave: a.codice,
    etichetta: `${maiuscolaIniziale(a.descrizione ?? a.codice)} (stato osservato fuori catalogo)`,
    domande: a.domande,
    nonRilasciate: 0,
    altro: true,
  }));
  const senza: VoceDistribuzione = { chiave: SENZA_STATO, etichetta: TESTO_SENZA_STATO, domande: d.senzaStato, nonRilasciate: 0, altro: false };
  return [...d.voci.map(daVoce), ...osservati, senza];
}

/** La parte rilasciata della voce (domande meno di cui non rilasciate): quella che l'elenco apre; null senza fonte. */
export function rilasciate(v: VoceDistribuzione): number | null {
  return v.domande === null || v.nonRilasciate === null ? null : v.domande - v.nonRilasciate;
}

// Intestazioni brevi delle colonne della tabella per intervento (wireframe stati: "Autorizzazione ente"), per le voci col
// testo lungo; il nome accessibile resta la descrizione completa di SR-01 (WCAG 2.5.3: contiene il testo breve).
const BREVI: Readonly<Record<string, string>> = {
  IN_ISTRUTTORIA_ENTE_COMPETENTE: 'In istruttoria',
  ISTRUTTORIA_AMMISSIBILE: 'Ammissibile al finanziamento',
  ISTRUTTORIA_NON_AMMISSIBILE: 'Non ammissibile al finanziamento',
  ESITO_POSITIVO_TUTTE_LE_MISURE: 'Esito positivo su tutte le misure',
  PROPOSTA_DA_REVISIONARE: 'Da revisionare',
  PROPOSTA_AUTORIZZAZIONE_ENTE: 'Autorizzazione ente',
};

/** Il titolo breve della colonna di una voce: quello noto se e' parte della descrizione, altrimenti la descrizione. */
export function titoloBreve(v: Pick<VoceStato, 'stato' | 'descrizione'>): string {
  const breve = BREVI[v.stato];
  return breve && v.descrizione.toLowerCase().includes(breve.toLowerCase()) ? breve : maiuscolaIniziale(v.descrizione);
}

/** Il nome del tipo di domanda nei testi: "di sostegno", "di pagamento". */
export function diTipo(tipo: TipoDomanda): string {
  return tipo === 'SOSTEGNO' ? 'di sostegno' : 'di pagamento';
}

/** Gli altri stati di una distribuzione in breve: "SOSPESA 1; X 2", oppure "nessuno". */
export function testoAltriStati(d: Distribuzione | undefined): string {
  const altri = perCodice(d?.altriStati ?? []);
  return altri.length === 0 ? 'nessuno' : altri.map((a) => `${a.codice} ${formatNumber(a.domande)}`).join('; ');
}

/** I codici degli altri stati del totale (tutti quelli delle righe), per codice: una colonna a scelta per codice. */
export function codiciAltriStati(totale: Distribuzione | undefined): string[] {
  return perCodice(totale?.altriStati ?? []).map((a) => a.codice);
}

/** Le domande di un altro stato nella distribuzione (0 se l'intervento non ne ha). */
export function domandeAltroStato(d: Distribuzione | undefined, codice: string): number {
  return d?.altriStati.find((a) => a.codice === codice)?.domande ?? 0;
}

/** La voce di SR-01 di una distribuzione (la riga di un intervento), per la cella della sua colonna. */
export function voceDi(d: Distribuzione | undefined, stato: string): VoceStato | undefined {
  return d?.voci.find((v) => v.stato === stato);
}

/** Le righe della tabella per intervento, nell'ordine del backend (per codice). */
export function righeStati(d: Stati): (RigaStati & { codiceIntervento: string })[] {
  return (d.righe ?? []).filter((r): r is RigaStati & { codiceIntervento: string } => typeof r.codiceIntervento === 'string');
}

/** La distribuzione vuota: nessuna domanda per i filtri (anche senza righe), lo dice lo stato vuoto della pagina. */
export function senzaDomande(d: Pick<Stati, 'righe' | 'totale'>): boolean {
  return (d.righe ?? []).length === 0 || (d.totale?.totale ?? 0) === 0;
}

/** Le righe degli interventi con domande nella voce data (clic su una barra della pagina degli stati: filtro della tabella). */
export function righeConLaVoce<R extends RigaStati>(righe: readonly R[], chiave: string): R[] {
  return righe.filter((r) => (vociDegliStati(r.stati).find((v) => v.chiave === chiave)?.domande ?? 0) > 0);
}

/**
 * Il messaggio di stato della voce scelta (clic sulla barra o "Filtra la tabella"): la tabella per intervento sta dopo la
 * card e il focus resta sul pulsante, quindi la regione di stato della pagina dice la voce e quante righe restano
 * (WCAG 4.1.3, come il filtro dal grafico dell'elenco operativo).
 */
export function testoFiltroDellaVoce(etichetta: string, n: number): string {
  return `Tabella per intervento filtrata sulla voce ${etichetta}: ${plurale(n, 'intervento', 'interventi')}.`;
}

/** Il messaggio di stato quando la voce scelta sparisce dalla risposta (altri filtri) e il filtro della tabella si toglie. */
export const VOCE_TOLTA = 'Filtro della voce tolto: la voce non è più nella risposta coi filtri scelti.';
