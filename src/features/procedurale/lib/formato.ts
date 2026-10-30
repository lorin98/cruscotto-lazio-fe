// formato.ts — testi PURI del procedurale (zero React): pill del perimetro, stati
// vuoti (coi filtri dicono di cambiarli, senza non parlano di filtri; col perimetro ADA dicono la propria area), note
// fisse dei wireframe approvati del 22/10/2026 (regole del dato del backend, D-03, D-04, D-06). Le assenze hanno la resa
// unica dell'entity importo, mai uno zero al posto di un dato senza fonte (anche quella breve, NON_DISPONIBILE_BREVE e
// resaAssenza, prima qui: review del riallineamento FIS-07). Il perimetro in parole e' di shared/lib.
import { testoPerimetro } from '../../../shared/lib';
import type { Perimetro } from './dto';

/** Cosa dichiara la pill del perimetro: domande per report (TX-0026..TX-0029), sottofasi (TX-0031, TX-0032). */
export type TipoPerimetro = 'domande' | 'sottofasi';

/** La pill del perimetro della barra, dal perimetro della risposta (REGIONALE o ADA del P4); null finche' non e' arrivata. */
export function pillPerimetro(perimetro: Perimetro | undefined, tipo: TipoPerimetro): string | null {
  if (perimetro === undefined) return null;
  if (perimetro === 'REGIONALE') return `Perimetro: ${testoPerimetro(perimetro)}`;
  return tipo === 'sottofasi'
    ? `Perimetro: ${testoPerimetro(perimetro)} per le domande; anagrafica delle sottofasi regionale`
    : `Perimetro: ${testoPerimetro(perimetro)} (solo le domande della tua ADA)`;
}

/** Il perimetro di una pagina con piu' letture per domanda: quello della prima risposta arrivata (lo stesso per tutte). */
export function perimetroDelle(perimetri: ReadonlyArray<Perimetro | undefined>): Perimetro | undefined {
  return perimetri.find((p) => p !== undefined);
}

/**
 * " nella tua area (perimetro ADA)" col perimetro ADA, altrimenti niente: lo dicono solo i testi delle domande, perche' il
 * perimetro ADA restringe le domande e non gli interventi, che il P4 vede tutti (SC-PC_SCOPE_P4).
 */
export function nellaTuaArea(perimetro: Perimetro | undefined): string {
  return perimetro === 'ADA' ? ' nella tua area (perimetro ADA)' : '';
}

/** Lo stato vuoto di un soggetto che conta domande: "<soggetto> [nella tua area (perimetro ADA)] [per i filtri scelti]." */
export function testoVuoto(soggetto: string, conFiltri: boolean, perimetro?: Perimetro): string {
  return `${soggetto}${nellaTuaArea(perimetro)}${conFiltri ? ' per i filtri scelti' : ''}.`;
}

/**
 * Lo stato vuoto degli interventi, come nei wireframe approvati: "Nessun intervento [per i filtri scelti]." Gli interventi
 * sono dati di programma: le righe mancano solo per i filtri, mai per il perimetro ADA (SC-PC_SCOPE_P4).
 */
export function testoNessunIntervento(conFiltri: boolean): string {
  return `Nessun intervento${conFiltri ? ' per i filtri scelti' : ''}.`;
}

/** "sì" / "no" di un valore presente (attivato). */
export function siNo(v: boolean): string {
  return v ? 'sì' : 'no';
}

// ---------------------------------------------------------------- note fisse (regole del dato del backend)

/** Sotto il KPI "di cui non rilasciate" (D-04 Rev. 4). */
export const NOTA_NON_RILASCIATE = 'Con il filtro per stato area programmazione le domande non rilasciate (che non hanno quello stato) contano solo se il filtro chiede le domande senza stato.';

/** Sotto il titolo degli stati di pagamento (D-04). */
export const NOTA_SOLO_CSR_DP = 'Le domande SIGC (ASR2-08, ASR2-20) e le domande minime dei decreti non hanno questi stati e restano fuori.';

/** Regole delle domande ammesse e degli importi (D-03 Rev. 1-4). */
export const NOTA_AMMESSE =
  "Domanda ammessa = domanda corrente di qualunque tipo con stato area programmazione Ammessa. Importo richiesto e contributo ammesso: della determina corrente, altrimenti della domanda negli scarichi SIAN; un importo non valorizzato non entra nella somma.";

/** Regole delle sottofasi (D-06 Rev. 5 e 6). */
export const NOTA_SOTTOFASI =
  "La voce conta le domande distinte di tutte le sottofasi che la abbinano (una domanda in due sottofasi equivalenti conta una volta), la sottofase censita le sue sole domande: la voce può essere minore della somma, e la pagina non somma. I filtri restringono le domande contate; l'elenco delle sottofasi resta intero e regionale.";

/** I file CSV e XLSX sono l'export dell'intero report della card o della tabella (scelta 7 approvata). */
export const NOTA_FILE = 'I file CSV e XLSX contengono tutto il report coi filtri della pagina (tutte le righe e tutte le colonne), non solo quelle trovate dalla ricerca o scelte con Colonne.';

/** Lo stato vuoto delle sottofasi: anagrafica vuota, nessun errore (SC-PC_SOTTOFASI). */
export const ANAGRAFICA_VUOTA = "Anagrafica delle sottofasi vuota: tutte le voci risultano non censite (nessun errore). Le sottofasi si censiscono dall'amministrazione (TX-1008).";
