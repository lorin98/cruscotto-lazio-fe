// formato.ts — testi PURI dell'istituzionale (zero React): perimetro, anno di riferimento del file ed esercizio della
// barra (l'esercizio coi suoi estremi), quantita' di output col codice dell'indicatore accanto (l'unita' di misura veniva
// da TX-0017, ora del fisico: OP-IS-12), si'/no, stati vuoti e note sulle definizioni del backend (OP-IS-07: note fisse,
// non un dato). I testi sono quelli dei wireframe approvati (22/10/2026 e, per le due verifiche e il dettaglio, 30/10/2026),
// con le lettere accentate. Il perimetro in parole e' di shared/lib (review H7), come i campi facoltativi della verifica
// SMP SIGC (numeroOpzionale, testoOpzionale, annoOpzionale: review del riallineamento IST-06). I testi dell'output
// regionale sono del fisico dal 29/10/2026.
import { formatNumber, testoPerimetro } from '../../../shared/lib';

/** Pill della barra: i report istituzionali hanno sempre il perimetro regionale (spec: enum REGIONALE). */
export const PILL_PERIMETRO = 'Perimetro: regionale (i report istituzionali non hanno perimetro ADA)';

/** Il perimetro dei report istituzionali in parole (sempre REGIONALE), nelle righe di contesto del PNG. */
export const PERIMETRO_IN_PAROLE = testoPerimetro('REGIONALE');

/** Pill dell'anno di riferimento del file della verifica (annoRiferimento della risposta; null = nessun file). */
export function pillAnnoDelFile(anno: number | null): string {
  return `Anno di riferimento del file SMP non SIGC: ${anno ?? 'nessun file'}`;
}

/** Gli estremi dell'esercizio finanziario n: "dal 16/10/2024 al 15/10/2025" (esercizio 2025). */
export function periodoEsercizio(esercizio: number): string {
  return `dal 16/10/${esercizio - 1} al 15/10/${esercizio}`;
}

/** Pill dell'esercizio della verifica SMP SIGC (esercizio della risposta), coi suoi estremi. */
export function pillEsercizio(esercizio: number | undefined): string {
  return `Esercizio finanziario: ${esercizio === undefined ? 'non indicato' : `${esercizio} (${periodoEsercizio(esercizio)})`}`;
}

/** L'anno di riferimento nei riferimenti della risposta: quello scelto, oppure l'ultimo con un file; null = nessun file. */
export function testoAnnoDiRiferimento(risposta: number | null, scelto: number | undefined): string {
  if (risposta === null) return 'nessun file SMP non SIGC presente';
  return scelto === undefined ? `${risposta} (ultimo anno con un file SMP non SIGC presente)` : String(risposta);
}

/** Come si legge l'output erogato della verifica (outputCumulativo della risposta, D-04 del backend). */
export function testoOutputErogato(cumulativo: boolean): string {
  return cumulativo ? 'valore del file, cumulativo per anno di riferimento' : 'valore del file per anno di riferimento';
}

/** Nessun file SMP non SIGC (annoRiferimento null): lo stato dichiarato accanto ai dati, che restano (SC-IS_SMP_NESSUN_FILE). */
export const NESSUN_FILE = "Nessun file SMP non SIGC acquisito: gli indicatori, gli output e i dati dell'avviso sono non valorizzati; domande e spesa sono calcolate dalle pratiche.";

/** Lo stato vuoto di un report: coi filtri dice di cambiarli; senza filtri non parla di filtri. */
export function testoVuoto(conFiltri: boolean): string {
  return conFiltri ? "Nessun intervento per i filtri scelti (per esempio un'azione portante senza interventi collegati)." : 'Nessun intervento nei report istituzionali.';
}

/** "sì" / "no" di un valore presente (l'assenza la dice la resa delle assenze, mai un "no" inventato). */
export function siNo(v: boolean): string {
  return v ? 'sì' : 'no';
}

/**
 * Una quantita' di output col codice dell'indicatore accanto (OP-IS-12, wireframe intervento approvato): "40 (indicatore
 * O.20)"; senza indicatore il solo numero. L'unita' di misura non c'e' nelle due verifiche e non si ricava dal codice.
 */
export function quantitaConIndicatore(v: number, indicatore: string | null | undefined): string {
  return indicatore?.trim() ? `${formatNumber(v)} (indicatore ${indicatore.trim()})` : formatNumber(v);
}

/** Definizioni del backend accanto alla tabella della verifica (D-02, D-04, D-05; da confermare: OP-IS-07). */
export const DEFINIZIONI_VERIFICA =
  'Definizioni del backend: domande ricevute = domande di sostegno correnti (non SIGC per costruzione), contate anche senza importo richiesto ma escluse dal valore; finanziate = importo ammesso maggiore di zero; pagate = pratiche con un saldo pagato, solo saldate al 100% (definizione da confermare con ARSIAL); spesa erogata = righe pagate non SIGC, anticipi inclusi, al lordo dei recuperi; output erogato = valore del file non SIGC, cumulativo per anno di riferimento (da confermare con ARSIAL e AGEA).';

/** La verifica SMP SIGC senza l'esercizio: la pagina non legge e chiede di sceglierlo (TX-0015, esercizio obbligatorio). */
export const SCEGLI_ESERCIZIO = "Scegli l'esercizio finanziario da consultare.";

/** La verifica SMP SIGC senza righe per l'esercizio e i filtri scelti: segue il pulsante "Modifica i filtri" (wireframe). */
export const NESSUN_DATO_SIGC = "Nessun dato SIGC per l'esercizio e i filtri scelti. Scegli un altro esercizio oppure";

/**
 * Definizioni del backend accanto alla tabella della verifica SMP SIGC (decisioni di finanziario richiamate da
 * istituzionale: D-05 Rev. 4, D-09 Rev. 1, D-11; da confermare: OP-IS-07), dal wireframe verifica-smp-sigc approvato.
 */
export const DEFINIZIONI_VERIFICA_SIGC =
  "Definizioni del backend (decisioni di finanziario richiamate da istituzionale): esercizio n = dal 16/10/n-1 al 15/10/n, estremi compresi; domande ricevute e finanziate = domande SIGC della campagna n-1 (finanziate: importo ammesso maggiore di zero), quelle senza importo richiesto contate ma escluse dal valore; domande pagate e spesa erogata = pagamenti SIGC autorizzati nell'esercizio, la spesa divisa fra la campagna n-1 e le campagne anteriori (D-05 Rev. 4); i pagamenti senza data di autorizzazione sono esclusi e contati nei riferimenti; avvisi attivati = numero del report SMP, mai ricavato dallo stato (D-09 Rev. 1); output erogato = solo SIGC (RF015); previsione di pagamento = sì/no del monitoraggio SMP (D-11).";
