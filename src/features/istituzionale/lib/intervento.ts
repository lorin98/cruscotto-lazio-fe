// intervento.ts — il dettaglio dell'intervento come DATI (PURO, zero React; flusso intervento approvato): titolo e
// sopratitolo della testata (descrizione da TX-0060, senza il codice), badge in testo, i quattro KPI (target di fine
// periodo da TX-0017; domande ricevute, finanziate e spesa erogata non SIGC da TX-0016: nessuna quota calcolata), l'ultimo
// dato sincronizzato della prima risposta arrivata e l'esito "senza dati" (nessuna riga nei report letti). Ogni KPI c'e'
// solo con la riga della sua transazione (cioe' col suo grant: le letture sono gated).
import { assenzaInFrase } from '../../../entities/importo';
import { formatNumber, importoBreve } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import type { RigaOutput, RigaVerifica } from './dto';
import { testoTarget } from './formato';

/** Il titolo della testata (h1): la descrizione dell'intervento da TX-0060, altrimenti "Intervento <codice>". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ?? `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Istituzionale - intervento SRA01". */
export function sopratitoloIntervento(codice: string): string {
  return `Istituzionale - intervento ${codice}`;
}

/** "Indicatore di output O.14 (ettari)": l'indicatore da TX-0017 con l'unita', se no da TX-0016; null senza indicatore. */
function badgeOutput(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): string | null {
  const indicatore = output?.indicatoreOutput ?? verifica?.indicatoreOutput.valore;
  if (!indicatore) return null;
  return output?.unitaMisura ? `Indicatore di output ${indicatore} (${output.unitaMisura})` : `Indicatore di output ${indicatore}`;
}

/** I badge della testata: perimetro e indicatori, quando le righe lette li hanno. */
export function badgeIntervento(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): string[] {
  const risultato = verifica?.indicatoreRisultato.valore;
  return ['Perimetro regionale', badgeOutput(output, verifica), risultato ? `Indicatore di risultato ${risultato}` : null].filter((b): b is string => b !== null);
}

export type ChiaveKpi = 'target' | 'ricevute' | 'finanziate' | 'spesa';

/** Un KPI del dettaglio: etichetta, valore oppure l'assenza in una frase, la transazione da cui viene. */
export interface KpiIntervento {
  chiave: ChiaveKpi;
  etichetta: string;
  valore?: string;
  assente?: string;
  nota: string;
}

function kpiTarget(r: RigaOutput): KpiIntervento {
  const presente = r.targetFinePeriodo.valore != null;
  return {
    chiave: 'target',
    etichetta: 'Target di fine periodo',
    ...(presente ? { valore: testoTarget(r.targetFinePeriodo, r.annoTarget, r.unitaMisura) } : { assente: assenzaInFrase(r.targetFinePeriodo) }),
    nota: 'TX-0017',
  };
}

function kpiVerifica(r: RigaVerifica): KpiIntervento[] {
  const spesa = r.spesaErogata;
  return [
    { chiave: 'ricevute', etichetta: 'Domande ricevute non SIGC', valore: formatNumber(r.domandeRicevute), nota: 'TX-0016' },
    { chiave: 'finanziate', etichetta: 'Domande finanziate non SIGC', valore: formatNumber(r.domandeFinanziate), nota: 'TX-0016' },
    {
      chiave: 'spesa',
      etichetta: 'Spesa pubblica erogata non SIGC',
      ...(spesa.valore != null ? { valore: importoBreve(spesa.valore) } : { assente: assenzaInFrase(spesa) }),
      nota: 'TX-0016, anticipi inclusi',
    },
  ];
}

/** I KPI del dettaglio, nell'ordine del wireframe: quelli di TX-0017 e di TX-0016 se la riga c'e'. */
export function kpiIntervento(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): KpiIntervento[] {
  return [...(output ? [kpiTarget(output)] : []), ...(verifica ? kpiVerifica(verifica) : [])];
}

/**
 * L'ultimo dato sincronizzato del dettaglio: quello della prima risposta arrivata fra TX-0016 e TX-0017 (lo stesso
 * elenco, SC-IS_ULTIMO_DATO); undefined finche' nessuna e' arrivata.
 */
export function ultimiDelDettaglio(verifica: { ultimiDatiSincronizzati: UltimoDato[] } | undefined, output: { ultimiDatiSincronizzati: UltimoDato[] } | undefined): UltimoDato[] | undefined {
  return (verifica ?? output)?.ultimiDatiSincronizzati;
}

/**
 * L'ultimo dato sincronizzato non si conosce: tutte le letture fatte sono in errore. Nessuna lettura abilitata (il profilo
 * in caricamento) non e' un errore: la pill semplicemente non c'e' ancora.
 */
export function ultimoDatoInErrore(letture: ReadonlyArray<{ isError: boolean }>): boolean {
  return letture.length > 0 && letture.every((l) => l.isError);
}

/** Quanto serve di una lettura per lo stato del dettaglio: la risposta (righe) se c'e', e se e' in errore. */
export interface LetturaDettaglio {
  data?: { righe: readonly unknown[] } | undefined;
  isError: boolean;
}

/** Tutte le letture fatte hanno risposto, coi dati o con l'errore (nessuna lettura abilitata: no). */
export function tutteRisposte(letture: readonly LetturaDettaglio[]): boolean {
  return letture.length > 0 && letture.every((l) => l.data !== undefined || l.isError);
}

/**
 * Lo stato del dettaglio dalle letture fatte (quelle col grant):
 * - 'caricamento' finche' nessuna e' abilitata (il profilo e' in caricamento: la route chiede uno dei due grant); alla
 *   prima apertura finche' non hanno risposto tutte (`giaRisposte` falso: KPI e schede arrivano insieme); poi solo se
 *   nessuna lettura ha dati e una e' in corso (es. Riprova dopo l'errore di tutte). Una lettura che riparte accanto a
 *   una coi dati (Riprova, un altro anno dopo un errore) mostra lo scheletro nella sua scheda: KPI, schede e scheda
 *   attiva restano (review H1/X1);
 * - 'errore' se nessuna ha risposto coi dati (l'avviso della pagina lo dice);
 * - 'vuoto' se tutte hanno risposto senza la riga dell'intervento (es. AT001, che i report escludono);
 * - altrimenti 'dati' (anche con una sola lettura riuscita: l'altra scheda dice il suo errore o il suo caricamento).
 */
export function statoDelDettaglio(letture: readonly LetturaDettaglio[], giaRisposte: boolean): 'caricamento' | 'errore' | 'vuoto' | 'dati' {
  if (letture.length === 0 || !(giaRisposte || tutteRisposte(letture))) return 'caricamento';
  const conDati = letture.filter((l) => l.data !== undefined);
  if (conDati.length === 0) return letture.every((l) => l.isError) ? 'errore' : 'caricamento';
  return conDati.length === letture.length && conDati.every((l) => l.data?.righe.length === 0) ? 'vuoto' : 'dati';
}

export type IdScheda = 'output' | 'verifica' | 'importi';

/** I titoli delle schede, nell'ordine del wireframe. */
export const TITOLI_SCHEDE: Readonly<Record<IdScheda, string>> = { output: 'Output per anno', verifica: 'Verifica SMP non SIGC', importi: 'Importi unitari' };

/** Le schede che il profilo vede: Output per anno e Importi unitari con TX-0017, Verifica SMP non SIGC con TX-0016. */
export function schedeVisibili(conVerifica: boolean, conOutput: boolean): IdScheda[] {
  return (['output', 'verifica', 'importi'] as const).filter((s) => (s === 'verifica' ? conVerifica : conOutput));
}

/** La didascalia delle voci della verifica nel dettaglio, con l'anno di riferimento della risposta. */
export function captionVociVerifica(anno: number | null): string {
  return `I dati ASR non SIGC dell'intervento da confrontare con SMP (anno di riferimento ${anno ?? 'nessun file'}), con i valori assenti e il loro motivo`;
}

/**
 * Lo stato della scheda Verifica mentre si legge un altro anno: i dati di prima restano (review A3). Dice l'anno chiesto e
 * quello dei dati che restano in pagina (`mostrato`, l'anno di riferimento della risposta mostrata), lo stesso della
 * didascalia (captionVociVerifica): annuncio e didascalia non possono divergere (review X1).
 */
export function testoAggiornamentoAnno(anno: number | undefined, mostrato: number | null | undefined): string {
  const lettura = anno === undefined ? "dell'ultimo anno con un file" : `dell'anno ${anno}`;
  const restano = typeof mostrato === 'number' ? `i dati dell'anno di riferimento ${mostrato}` : `i dati di prima${mostrato === null ? ' (nessun file)' : ''}`;
  return `Lettura ${lettura} in corso: restano ${restano}.`;
}

/** La scheda Importi unitari di un intervento senza Unit Amount (SC-IS_OUTPUT_STRUTTURALE). */
export const SENZA_UNIT_AMOUNT = 'Intervento senza Unit Amount (per esempio un intervento strutturale): nessun importo unitario; il programmato per anno è non valorizzato e vale il solo target.';

/** Lo stato vuoto del dettaglio: l'intervento non ha righe nei report letti. */
export const SENZA_DATI = "Nessun dato per questo intervento nei report istituzionali (l'Assistenza tecnica AT001 non è nei report).";
