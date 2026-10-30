// intervento.ts — il dettaglio dell'intervento come DATI (PURO, zero React; flusso intervento approvato, ricomposto il
// 30/10/2026): titolo e sopratitolo della testata (descrizione da TX-0060, senza il codice), il badge del perimetro, le due
// schede "Verifica SMP non SIGC" (TX-0016) e "Verifica SMP SIGC" (TX-0015) con la scheda iniziale, i tre KPI di ogni scheda
// col periodo nel testo (non SIGC: cumulative; SIGC: campagna n-1, esercizio n; nessuna quota calcolata), l'ultimo dato
// sincronizzato della prima risposta arrivata, lo stato della pagina dalle letture partite e i testi degli stati. Nessun
// KPI in testa: i numeri dipendono dalla scheda (periodi diversi). L'output per anno, il target e gli importi unitari di
// TX-0017 sono del fisico dal riallineamento degli ambiti del 29/10/2026.
import { assenzaInFrase } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { formatNumber, importoBreve } from '../../../shared/lib';
import type { LetturaDettaglio, StatoDettaglio, UltimoDato } from '../../../shared/lib';
import type { RigaVerifica, RigaVerificaSigc } from './dto';

/** Il titolo della testata (h1): la descrizione dell'intervento da TX-0060, altrimenti "Intervento <codice>". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ?? `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Istituzionale - intervento SRA01". */
export function sopratitoloIntervento(codice: string): string {
  return `Istituzionale - intervento ${codice}`;
}

/**
 * Il badge della testata: il solo perimetro (sempre regionale). Gli indicatori stanno nelle voci di ogni scheda, perche'
 * dipendono dall'anno o dall'esercizio (wireframe intervento del 30/10/2026).
 */
export const BADGE_INTERVENTO: readonly string[] = ['Perimetro regionale'];

export type ChiaveKpi = 'ricevute' | 'finanziate' | 'spesa';

/** Un KPI del dettaglio: etichetta, valore oppure l'assenza in una frase, la transazione e il periodo da cui viene. */
export interface KpiIntervento {
  chiave: ChiaveKpi;
  etichetta: string;
  valore?: string;
  assente?: string;
  nota: string;
}

/** Il valore di un importo in breve, oppure la sua assenza in una frase (mai uno zero). */
function importoOAssenza(importo: DatoMotivatoLike<number> | undefined): Pick<KpiIntervento, 'valore' | 'assente'> {
  return importo?.valore != null ? { valore: importoBreve(importo.valore) } : { assente: assenzaInFrase(importo) };
}

/** I KPI della scheda Verifica SMP non SIGC (TX-0016): domande e spesa cumulative, nell'ordine del wireframe. */
export function kpiVerifica(r: RigaVerifica): KpiIntervento[] {
  return [
    { chiave: 'ricevute', etichetta: 'Domande ricevute non SIGC', valore: formatNumber(r.domandeRicevute), nota: 'TX-0016, cumulative' },
    { chiave: 'finanziate', etichetta: 'Domande finanziate non SIGC', valore: formatNumber(r.domandeFinanziate), nota: 'TX-0016, cumulative' },
    { chiave: 'spesa', etichetta: 'Spesa pubblica erogata non SIGC', ...importoOAssenza(r.spesaErogata), nota: 'TX-0016, anticipi inclusi, cumulativa' },
  ];
}

/** Un conteggio facoltativo di TX-0015: il numero, oppure "Non disponibile" (il backend non lo rende null). */
function conteggioOAssenza(v: number | undefined): Pick<KpiIntervento, 'valore' | 'assente'> {
  return v === undefined ? { assente: assenzaInFrase(undefined) } : { valore: formatNumber(v) };
}

/**
 * I KPI della scheda Verifica SMP SIGC (TX-0015): domande ricevute e finanziate della campagna n-1, spesa erogata
 * nell'esercizio n per la campagna precedente; il periodo nell'etichetta e nella nota (note WCAG del flusso).
 */
export function kpiVerificaSigc(r: RigaVerificaSigc, esercizio: number, annoDomande: number): KpiIntervento[] {
  const nota = `TX-0015, esercizio ${esercizio}`;
  return [
    { chiave: 'ricevute', etichetta: `Domande ricevute SIGC (campagna ${annoDomande})`, ...conteggioOAssenza(r.domandeRicevute), nota },
    { chiave: 'finanziate', etichetta: `Domande finanziate SIGC (campagna ${annoDomande})`, ...conteggioOAssenza(r.domandeFinanziate), nota },
    { chiave: 'spesa', etichetta: `Spesa erogata SIGC, campagna ${annoDomande}`, ...importoOAssenza(r.spesaErogataCampagnaPrecedente), nota: `TX-0015, pagata nell'esercizio ${esercizio}` },
  ];
}

/** Una lettura del dettaglio per l'ultimo dato sincronizzato: la risposta e quando e' arrivata. */
export interface LetturaConUltimi {
  data?: { ultimiDatiSincronizzati?: UltimoDato[] } | undefined;
  dataUpdatedAt?: number;
}

/**
 * L'ultimo dato sincronizzato del dettaglio: quello della prima risposta arrivata fra TX-0016 e TX-0015 (lo stesso elenco,
 * SC-IS_ULTIMO_DATO); undefined prima. Le letture null (senza il grant o non partite) non contano.
 */
export function ultimiDelDettaglio(letture: readonly (LetturaConUltimi | null)[]): UltimoDato[] | undefined {
  const arrivate = letture.filter((l): l is LetturaConUltimi => l?.data?.ultimiDatiSincronizzati !== undefined);
  const prima = arrivate.reduce<LetturaConUltimi | undefined>((p, l) => (p === undefined || (l.dataUpdatedAt ?? 0) < (p.dataUpdatedAt ?? 0) ? l : p), undefined);
  return prima?.data?.ultimiDatiSincronizzati;
}

/**
 * L'ultimo dato sincronizzato non si conosce: tutte le letture fatte sono in errore. Nessuna lettura abilitata (il profilo
 * in caricamento) non e' un errore: la pill semplicemente non c'e' ancora.
 */
export function ultimoDatoInErrore(letture: ReadonlyArray<{ isError: boolean }>): boolean {
  return letture.length > 0 && letture.every((l) => l.isError);
}

/**
 * Le letture che decidono lo stato della pagina (statoDelDettaglio del kit): quelle partite (null = senza il grant o non
 * ancora partita). La verifica SIGC e' di un esercizio: senza la riga dell'intervento lo dice la sua scheda, che resta
 * col selettore per sceglierne un altro; il vuoto della pagina ("Nessun dato per questo intervento", es. AT001) lo decide
 * la sola verifica non SIGC. Per lo stato la risposta SIGC conta quindi solo come risposta, non per le sue righe.
 */
export function lettureDelloStato(verifica: LetturaDettaglio | null, sigc: LetturaDettaglio | null): LetturaDettaglio[] {
  const rispostaSigc = sigc && { isError: sigc.isError, data: sigc.data === undefined ? undefined : { righe: [sigc.data] } };
  return [verifica, rispostaSigc].filter((l): l is LetturaDettaglio => l !== null);
}

/**
 * Lo stato della pagina: quello delle letture partite; senza nessuna lettura partita ma con una scheda visibile (la scheda
 * SIGC aperta senza esercizio, che non legge) le schede, non lo scheletro.
 */
export function statoDellaPagina(stato: StatoDettaglio, lettureFatte: number, schede: number): StatoDettaglio {
  return lettureFatte === 0 && schede > 0 ? 'dati' : stato;
}

export type IdScheda = 'verifica' | 'verificaSigc';

/** I titoli delle schede, nell'ordine del wireframe. */
export const TITOLI_SCHEDE: Readonly<Record<IdScheda, string>> = { verifica: 'Verifica SMP non SIGC', verificaSigc: 'Verifica SMP SIGC' };

/** Le schede che il profilo vede, ognuna col grant della sua transazione: non SIGC con TX-0016, SIGC con TX-0015. */
export function schedeVisibili(conVerifica: boolean, conVerificaSigc: boolean): IdScheda[] {
  return [conVerifica ? 'verifica' : null, conVerificaSigc ? 'verificaSigc' : null].filter((s): s is IdScheda => s !== null);
}

/**
 * La scheda iniziale: quella della pagina di partenza. Con l'esercizio nell'indirizzo e senza l'anno (arrivo dalla
 * verifica SIGC, link dettaglio-intervento-smp-sigc) la SIGC; altrimenti la non SIGC.
 */
export function schedaIniziale(anno: number | undefined, esercizio: number | undefined): IdScheda {
  return esercizio !== undefined && anno === undefined ? 'verificaSigc' : 'verifica';
}

/** La scheda attiva: la scelta (o quella iniziale) se il profilo la vede, altrimenti la prima visibile. */
export function schedaAttiva(schede: readonly IdScheda[], scelta: IdScheda): IdScheda | undefined {
  return schede.includes(scelta) ? scelta : schede[0];
}

/** La didascalia delle voci della verifica non SIGC nel dettaglio, con l'anno di riferimento della risposta. */
export function captionVociVerifica(anno: number | null): string {
  return `I dati ASR non SIGC dell'intervento da confrontare con SMP (anno di riferimento ${anno ?? 'nessun file'}), con i valori assenti e il loro motivo`;
}

/** La didascalia delle voci della verifica SIGC nel dettaglio: esercizio e campagna delle domande. */
export function captionVociVerificaSigc(esercizio: number, annoDomande: number): string {
  return `I dati SIGC dell'intervento da confrontare con SMP (esercizio ${esercizio}, domande della campagna ${annoDomande}), con i valori assenti e il loro motivo`;
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

/** Lo stato della scheda SIGC mentre si legge un altro esercizio: i dati dell'esercizio mostrato restano, detto in role=status. */
export function testoAggiornamentoEsercizio(esercizio: number, mostrato: number | undefined): string {
  return `Lettura dell'esercizio ${esercizio} in corso: restano ${mostrato === undefined ? 'i dati di prima' : `i dati dell'esercizio ${mostrato}`}.`;
}

/** Lo stato vuoto del dettaglio: l'intervento non ha righe nella verifica SMP (es. AT001, che i report escludono). */
export const SENZA_DATI = "Nessun dato per questo intervento nella verifica SMP (l'Assistenza tecnica AT001 non è nei report).";

/** La scheda SIGC senza la riga dell'intervento per l'esercizio scelto. */
export const SENZA_DATI_SIGC = "Nessun dato SIGC per questo intervento nell'esercizio scelto. Scegli un altro esercizio.";
