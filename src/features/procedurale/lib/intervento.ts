// intervento.ts — il dettaglio procedurale dell'intervento come DATI (PURO, zero React; flusso panoramica, scelta 1
// approvata il 22/10/2026): titolo e sopratitolo della testata (descrizione da TX-0024), badge in testo (perimetro
// dell'intervento e attivato, da TX-0026), le schede visibili per grant nell'ordine del wireframe (Stati delle domande |
// Area programmazione | Sottofasi, scelta 6 | Unit Amount) e gli esiti "senza dati" e "nessuna domanda" (per lo stato
// scelto, nella propria ADA). Nessuna transazione nuova: gli stessi report filtrati sull'intervento (lo stato tranne che
// per TX-0030).
import type { Distribuzione, Perimetro, RigaAmmesse } from './dto';
import { nellaTuaArea, siNo } from './formato';
import type { Lettura } from './grant';

/** Il titolo della testata (h1): "SRD01 - descrizione" da TX-0024, altrimenti "Intervento SRD01". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ? `${codice} - ${descrizione}` : `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Intervento SRD01 - procedurale". */
export function sopratitoloIntervento(codice: string): string {
  return `Intervento ${codice} - procedurale`;
}

/** Il titolo del documento, come nel wireframe approvato: "Intervento SRD01 - Procedurale". */
export function titoloDocumentoIntervento(codice: string): string {
  return `Intervento ${codice} - Procedurale`;
}

/** I badge della testata: il perimetro dell'intervento (INTERVENTO.PERIMETRO) e se e' attivato, con la riga di TX-0026. */
export function badgeIntervento(riga: RigaAmmesse | undefined): string[] {
  return riga ? [`Perimetro: ${riga.perimetroIntervento ?? 'non valorizzato'}`, `Attivato: ${siNo(riga.attivato)}`] : [];
}

export type IdScheda = 'stati' | 'area' | 'sottofasi' | 'unitAmount';

/** I titoli delle schede, nell'ordine del wireframe. */
export const TITOLI_SCHEDE: Readonly<Record<IdScheda, string>> = { stati: 'Stati delle domande', area: 'Area programmazione', sottofasi: 'Sottofasi', unitAmount: 'Unit Amount' };

const LETTURE_SCHEDE: Readonly<Record<IdScheda, readonly Lettura[]>> = {
  stati: ['statiSostegno', 'statiPagamento'],
  area: ['riepilogo'],
  sottofasi: ['sottofasiSostegno', 'sottofasiPagamento'],
  unitAmount: ['unitAmount'],
};

/** Le schede che il profilo vede: ognuna con almeno una delle sue letture. */
export function schedeVisibili(puo: (l: Lettura) => boolean): IdScheda[] {
  return (Object.keys(LETTURE_SCHEDE) as IdScheda[]).filter((s) => LETTURE_SCHEDE[s].some(puo));
}

/** La scheda attiva: la scelta dell'utente se ancora visibile, altrimenti la prima. */
export function schedaAttiva(schede: readonly IdScheda[], scelta: IdScheda | null): IdScheda | undefined {
  return scelta !== null && schede.includes(scelta) ? scelta : schede[0];
}

/** Nessuna domanda dell'intervento nelle letture fatte (con lo stato scelto): ammesse, sostegno e pagamento a 0. */
export function senzaDomande(ammesse: RigaAmmesse | undefined, sostegno: Distribuzione | undefined, pagamento: Distribuzione | undefined): boolean {
  const conti = [ammesse?.domandeAmmesse, sostegno?.totale, pagamento?.totale].filter((n) => n !== undefined);
  return conti.length > 0 && conti.every((n) => n === 0);
}

/**
 * Il vuoto del dettaglio senza domande, con la regola di testoVuoto: col perimetro ADA dice la propria area (il P4 vede
 * le sole domande della sua ADA), altrimenti "nei report procedurali"; con lo stato scelto lo dice.
 */
export function testoNessunaDomanda(codice: string, conStato: boolean, perimetro: Perimetro | undefined): string {
  const dove = nellaTuaArea(perimetro) || (conStato ? '' : ' nei report procedurali');
  return `Nessuna domanda di ${codice}${dove}${conStato ? ' per lo stato area programmazione scelto' : ''}.`;
}

/** Il chip della barra senza filtro per stato: tutte le domande dell'intervento, col perimetro ADA quelle della propria ADA. */
export function testoSenzaStato(perimetro: Perimetro | undefined): string {
  return `Nessun filtro per stato: tutte le domande dell'intervento${perimetro === 'ADA' ? ' nella tua ADA' : ''}`;
}

/** Lo stato vuoto del dettaglio: l'intervento non ha righe nei report letti. */
export const SENZA_DATI = "Nessun dato per questo intervento nei report procedurali (l'Assistenza tecnica AT001 non è nei report).";
