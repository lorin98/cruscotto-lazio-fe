// intervento.ts — il dettaglio dell'intervento del fisico come DATI (PURO, zero React; flusso intervento approvato il
// 30/10/2026, scelta di disegno 1 del dossier): titolo e sopratitolo della testata (descrizione da TX-0060), badge in testo
// (perimetro, indicatore di output con l'unita' da TX-0017), i quattro KPI (target di fine periodo da TX-0017; superficie
// DS, superficie DP e domande con DP oltre la DS della campagna di riferimento da TX-0018: la piu' recente della risposta,
// una sola riga, nessuna somma fra interventi ne' fra campagne, nessuna quota oltre a quella della pagina Superfici, nel
// testo), le schede visibili per grant nell'ordine del wireframe, il ritorno dell'intervento senza dati e i testi delle
// schede (l'ultimo dato sincronizzato e il perimetro della prima risposta arrivata sono regole del kit, shared/lib:
// review del riallineamento FIS-06). Ogni KPI c'e' solo con la riga
// della sua transazione (cioe' col suo grant: le letture sono gated). Nessuna transazione nuova.
import { assenzaInFrase } from '../../../entities/importo';
import { ettari, formatNumber } from '../../../shared/lib';
import type { InterventoSuperficie, RigaOutput } from './dto';
import { testoDomande, testoQuantitaPremio, testoQuotaOltreDs, testoTarget } from './formato';
import type { Lettura } from './grant';
import { PERCORSI } from './pagine';
import { campagnaDi, campagnaDiRiferimento, quotaDpOltreDs } from './superfici';

/** Il titolo della testata (h1): la descrizione dell'intervento da TX-0060, altrimenti "Intervento <codice>". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ?? `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Fisico - intervento SRA01". */
export function sopratitoloIntervento(codice: string): string {
  return `Fisico - intervento ${codice}`;
}

/**
 * I badge della testata: il perimetro (sempre regionale) e, con la riga di TX-0017, l'indicatore di output con l'unita'
 * ("Indicatore di output O.14 (ettari)"; senza indicatore "non valorizzato", come nel wireframe).
 */
export function badgeIntervento(output: Pick<RigaOutput, 'indicatoreOutput' | 'unitaMisura'> | undefined): string[] {
  if (!output) return ['Perimetro regionale'];
  const unita = output.unitaMisura ? ` (${output.unitaMisura})` : '';
  return ['Perimetro regionale', `Indicatore di output ${output.indicatoreOutput ?? 'non valorizzato'}${unita}`];
}

export type ChiaveKpi = 'target' | 'ds' | 'dp' | 'oltre';

/** Un KPI del dettaglio: etichetta, nome accessibile (le sigle sciolte), valore oppure l'assenza in una frase, la nota. */
export interface KpiIntervento {
  chiave: ChiaveKpi;
  etichetta: string;
  nomeAccessibile?: string;
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

/** Le tre voci delle superfici: etichetta visibile e la spiegazione delle sigle per il nome accessibile. */
const VOCI_SUPERFICI = {
  ds: { etichetta: 'Superficie ammissibile DS', spiegazione: 'superficie delle domande di sostegno' },
  dp: { etichetta: 'Superficie ammissibile DP', spiegazione: 'superficie delle domande di pagamento' },
  oltre: { etichetta: 'Domande con DP oltre la DS', spiegazione: 'domande di pagamento con superficie oltre quella di sostegno' },
} as const;

/** L'assenza delle superfici di un intervento non a superficie o non SIGC (NON_VALORIZZATO): mai zero. */
export const SUPERFICI_NON_VALORIZZATE = 'Non valorizzato: intervento non a superficie o non SIGC';

function kpiSuperficie(chiave: 'ds' | 'dp' | 'oltre', anno: number | null, valore: string | null, nota: string): KpiIntervento {
  const v = VOCI_SUPERFICI[chiave];
  const etichetta = anno === null ? v.etichetta : `${v.etichetta}, campagna ${anno}`;
  return { chiave, etichetta, nomeAccessibile: `${etichetta}: ${v.spiegazione}`, ...(valore === null ? { assente: SUPERFICI_NON_VALORIZZATE } : { valore }), nota };
}

/** La campagna di riferimento dei KPI delle superfici: la piu' recente della riga; null se l'intervento non ne ha. */
export function campagnaDeiKpi(riga: InterventoSuperficie): number | null {
  return campagnaDiRiferimento([riga], undefined);
}

function kpiSuperfici(riga: InterventoSuperficie): KpiIntervento[] {
  const anno = campagnaDeiKpi(riga);
  const c = anno === null ? undefined : campagnaDi(riga, anno);
  if (!c) return (['ds', 'dp', 'oltre'] as const).map((k) => kpiSuperficie(k, null, null, 'TX-0018'));
  return [
    kpiSuperficie('ds', c.anno, ettari(c.superficieDs), `TX-0018, ${testoDomande(c.domandeSostegno, 'sostegno')}`),
    kpiSuperficie('dp', c.anno, ettari(c.superficieDp), `TX-0018, ${testoDomande(c.domandePagamento, 'pagamento')}`),
    kpiSuperficie('oltre', c.anno, formatNumber(c.domandeDpOltreDs), `TX-0018, ${testoQuotaOltreDs(c.domandePagamento, quotaDpOltreDs(c))}`),
  ];
}

/** I KPI del dettaglio, nell'ordine del wireframe: il target con la riga di TX-0017, le superfici con quella di TX-0018. */
export function kpiIntervento(output: RigaOutput | undefined, superfici: InterventoSuperficie | undefined): KpiIntervento[] {
  return [...(output ? [kpiTarget(output)] : []), ...(superfici ? kpiSuperfici(superfici) : [])];
}

/** La nota sotto i KPI delle superfici: quale campagna e perche' una sola. */
export const NOTA_CAMPAGNA_KPI = 'Campagna di riferimento dei KPI delle superfici: la più recente della risposta di TX-0018 (le superfici di campagne diverse non si sommano).';

export type IdScheda = 'output' | 'superfici' | 'unitAmount';

/** Le schede nell'ordine del wireframe, ognuna con la lettura (e il grant) di cui vive. */
const SCHEDE: readonly { id: IdScheda; lettura: Lettura }[] = [
  { id: 'output', lettura: 'output' },
  { id: 'superfici', lettura: 'superfici' },
  { id: 'unitAmount', lettura: 'unitAmount' },
];

/** I titoli delle schede, come nel wireframe. */
export const TITOLI_SCHEDE: Readonly<Record<IdScheda, string>> = { output: 'Output per anno', superfici: 'Superfici per campagna', unitAmount: 'Unit Amount' };

/** Le schede che il profilo vede: ognuna col grant della sua transazione. */
export function schedeVisibili(puo: (l: Lettura) => boolean): IdScheda[] {
  return SCHEDE.filter((s) => puo(s.lettura)).map((s) => s.id);
}

/** Un valore (es. dallo state della navigazione, che e' `unknown`) e' l'id di una scheda. */
export function eIdScheda(v: unknown): v is IdScheda {
  return SCHEDE.some((s) => s.id === v);
}

/** La scheda attiva: la scelta (dell'utente o del link d'arrivo) se visibile, altrimenti la prima. */
export function schedaAttiva(schede: readonly IdScheda[], scelta: IdScheda | null): IdScheda | undefined {
  return scelta !== null && schede.includes(scelta) ? scelta : schede[0];
}

/** Lo stato vuoto del dettaglio: l'intervento non ha righe nei report letti (es. AT001, che i report escludono). */
export const SENZA_DATI = "Nessun dato per questo intervento nei report del fisico (l'Assistenza tecnica AT001 non è nei report).";

const RITORNI: readonly { lettura: Lettura; percorso: string; testo: string }[] = [
  { lettura: 'output', percorso: PERCORSI.output, testo: "Torna all'output regionale" },
  { lettura: 'superfici', percorso: PERCORSI.superfici, testo: 'Torna alle superfici ammissibili' },
  { lettura: 'unitAmount', percorso: PERCORSI.unitAmount, testo: 'Torna alle Unit Amount' },
];

/** Il ritorno dell'intervento senza dati: l'output regionale (wireframe), o il primo report che il profilo puo' aprire. */
export function ritornoSenzaDati(puo: (l: Lettura) => boolean): { percorso: string; testo: string } | undefined {
  const r = RITORNI.find((x) => puo(x.lettura));
  return r && { percorso: r.percorso, testo: r.testo };
}

// ---------------------------------------------------------------- schede

/** Il titolo della card dell'output per anno, con l'unita' dell'indicatore. */
export function titoloOutputIntervento(unita: string | null): string {
  return `Output programmato e realizzato per anno${unita ? ` (${unita})` : ''}`;
}

/** Il grafico dell'output per anno nel nome del pulsante del PNG (la sigla del file la aggiunge il kit). */
export const GRAFICO_OUTPUT_INTERVENTO = 'il grafico Output programmato e realizzato per anno';

export const SOTTOTITOLO_OUTPUT_INTERVENTO = 'Il realizzato non SIGC è cumulativo per anno di riferimento, quello SIGC annuale: le barre non si sommano';

/** I file CSV e XLSX della scheda Output: l'export di TX-0017 dell'intervento. */
export function oggettoFileOutput(codice: string): string {
  return `l'output e gli importi unitari dell'intervento ${codice}`;
}

export function fonteOutputIntervento(codice: string): string {
  return `Fonte: TX-0017. PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: l'export di TX-0017 con intervento = ${codice} (output per anno e importi unitari), registrato in AUDIT_ESPORTAZIONE.`;
}

/** La scheda Output di un intervento senza riga nel report di TX-0017. */
export const SENZA_OUTPUT = 'Nessun output per questo intervento nel report.';

export const TITOLO_SUPERFICI_INTERVENTO = 'Superficie DS e DP per campagna (ettari)';

export const GRAFICO_SUPERFICI_INTERVENTO = 'il grafico Superficie DS e DP per campagna';

export const SOTTOTITOLO_SUPERFICI_INTERVENTO = 'Le superfici di campagne diverse non si sommano; la pagina Superfici filtrata su questo intervento ha le card per campagna';

/** I file CSV e XLSX della scheda Superfici: l'export di TX-0018 dell'intervento. */
export function oggettoFileSuperfici(codice: string): string {
  return `le superfici dell'intervento ${codice}`;
}

/**
 * La quantita' richiesta a premio dell'intervento (OP-FIS-04, oggi sempre FONTE_NON_ATTIVA): assente in tutte le campagne,
 * la sua assenza una volta; altrimenti campagna per campagna, dalla piu' recente.
 */
function notaPremio(riga: InterventoSuperficie): string {
  const campagne = [...riga.campagne].sort((a, b) => b.anno - a.anno);
  const [prima] = campagne;
  if (!prima) return '';
  if (campagne.every((c) => c.quantitaRichiestaPremio.valore == null)) return `Quantità richiesta a premio: ${testoQuantitaPremio(prima.quantitaRichiestaPremio)}.`;
  return `Quantità richiesta a premio: ${campagne.map((c) => `${c.anno} ${testoQuantitaPremio(c.quantitaRichiestaPremio)}`).join('; ')}.`;
}

export function fonteSuperficiIntervento(riga: InterventoSuperficie): string {
  const codice = riga.codiceIntervento;
  return `Fonte: TX-0018 con intervento = ${codice}, tutte le campagne. ${notaPremio(riga)} PNG: l'immagine del grafico; CSV e XLSX: l'export di TX-0018 con intervento = ${codice} (una riga per campagna), registrato in AUDIT_ESPORTAZIONE.`;
}

/** La scheda Superfici di un intervento senza superfici (NON_VALORIZZATO), o senza riga nel report di TX-0018. */
export const SENZA_SUPERFICI_INTERVENTO = 'Intervento senza superfici (non a superficie o non SIGC, per esempio un intervento strutturale): nessuna superficie in nessuna campagna (non valorizzato).';

/** I file CSV e XLSX della scheda Unit Amount: l'export di TX-0030 dell'intervento. */
export function oggettoFileUnitAmount(codice: string): string {
  return `le Unit Amount dell'intervento ${codice}`;
}

export function captionUnitAmountIntervento(codice: string): string {
  return `Unit Amount dell'intervento ${codice} per esercizio e codice: importo unitario, output previsto, pagato e base storica`;
}

export function fonteUnitAmountIntervento(codice: string): string {
  return `Fonte: TX-0030 con intervento = ${codice}. CSV e XLSX: l'export di TX-0030 con intervento = ${codice}, registrato in AUDIT_ESPORTAZIONE. Il grafico della percentuale pagata è nella pagina Unit Amount, quando la fonte del pagato sarà attiva.`;
}

/** La scheda Unit Amount di un intervento senza Unit Amount (SC-FS_OUTPUT_STRUTTURALE). */
export const SENZA_UNIT_AMOUNT = 'Intervento senza Unit Amount (per esempio un intervento strutturale): nessuna Unit Amount; il programmato per anno è non valorizzato e vale il solo target.';
