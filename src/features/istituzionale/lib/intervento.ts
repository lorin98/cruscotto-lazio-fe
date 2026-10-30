// intervento.ts — il dettaglio dell'intervento come DATI (PURO, zero React; flusso intervento approvato): titolo e
// sopratitolo della testata (descrizione da TX-0060, senza il codice), badge in testo, i tre KPI (domande ricevute,
// finanziate e spesa erogata non SIGC da TX-0016: nessuna quota calcolata), l'ultimo dato sincronizzato della risposta e
// l'esito "senza dati" (nessuna riga nel report letto). I KPI ci sono solo con la riga della loro transazione (cioe' col
// suo grant: le letture sono gated). L'output per anno, il target e gli importi unitari di TX-0017 sono del fisico dal
// riallineamento degli ambiti del 29/10/2026.
import { assenzaInFrase } from '../../../entities/importo';
import { formatNumber, importoBreve } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import type { RigaVerifica } from './dto';

/** Il titolo della testata (h1): la descrizione dell'intervento da TX-0060, altrimenti "Intervento <codice>". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ?? `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Istituzionale - intervento SRA01". */
export function sopratitoloIntervento(codice: string): string {
  return `Istituzionale - intervento ${codice}`;
}

/** I badge della testata: perimetro e indicatori di TX-0016, quando la riga letta li ha. */
export function badgeIntervento(verifica: RigaVerifica | undefined): string[] {
  const output = verifica?.indicatoreOutput.valore;
  const risultato = verifica?.indicatoreRisultato.valore;
  return ['Perimetro regionale', output ? `Indicatore di output ${output}` : null, risultato ? `Indicatore di risultato ${risultato}` : null].filter((b): b is string => b !== null);
}

export type ChiaveKpi = 'ricevute' | 'finanziate' | 'spesa';

/** Un KPI del dettaglio: etichetta, valore oppure l'assenza in una frase, la transazione da cui viene. */
export interface KpiIntervento {
  chiave: ChiaveKpi;
  etichetta: string;
  valore?: string;
  assente?: string;
  nota: string;
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

/** I KPI del dettaglio, nell'ordine del wireframe: quelli di TX-0016 se la riga c'e'. */
export function kpiIntervento(verifica: RigaVerifica | undefined): KpiIntervento[] {
  return verifica ? kpiVerifica(verifica) : [];
}

/** L'ultimo dato sincronizzato del dettaglio: quello della risposta di TX-0016 (SC-IS_ULTIMO_DATO); undefined prima. */
export function ultimiDelDettaglio(verifica: { ultimiDatiSincronizzati: UltimoDato[] } | undefined): UltimoDato[] | undefined {
  return verifica?.ultimiDatiSincronizzati;
}

/**
 * L'ultimo dato sincronizzato non si conosce: tutte le letture fatte sono in errore. Nessuna lettura abilitata (il profilo
 * in caricamento) non e' un errore: la pill semplicemente non c'e' ancora.
 */
export function ultimoDatoInErrore(letture: ReadonlyArray<{ isError: boolean }>): boolean {
  return letture.length > 0 && letture.every((l) => l.isError);
}

export type IdScheda = 'verifica';

/** I titoli delle schede, nell'ordine del wireframe. */
export const TITOLI_SCHEDE: Readonly<Record<IdScheda, string>> = { verifica: 'Verifica SMP non SIGC' };

/** Le schede che il profilo vede: Verifica SMP non SIGC con TX-0016 (la scheda della verifica SIGC e' dei passi successivi). */
export function schedeVisibili(conVerifica: boolean): IdScheda[] {
  return conVerifica ? ['verifica'] : [];
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

/** Lo stato vuoto del dettaglio: l'intervento non ha righe nei report letti. */
export const SENZA_DATI = "Nessun dato per questo intervento nei report istituzionali (l'Assistenza tecnica AT001 non è nei report).";
