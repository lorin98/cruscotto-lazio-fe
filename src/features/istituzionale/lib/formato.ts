// formato.ts — testi PURI dell'istituzionale (zero React): perimetro, anno di riferimento del file ed esercizio della
// barra, quantita' con la loro unita' di misura (mai un numero senza unita', note WCAG dello uiplan), si'/no, stati vuoti e
// note sulle definizioni del backend (OP-IS-07: note fisse, non un dato). I testi sono quelli dei wireframe approvati del
// 22/10/2026, con le lettere accentate; quelli della verifica SMP SIGC vengono dalla pagina del finanziario (29/10/2026).
// Il perimetro in parole e' di shared/lib (review H7). I testi dell'output regionale sono del fisico dal 29/10/2026.
import { NON_DISPONIBILE, formatNumber, testoPerimetro } from '../../../shared/lib';

/** Pill della barra: i report istituzionali hanno sempre il perimetro regionale (spec: enum REGIONALE). */
export const PILL_PERIMETRO = 'Perimetro: regionale (i report istituzionali non hanno perimetro ADA)';

/** Il perimetro dei report istituzionali in parole (sempre REGIONALE), nelle righe di contesto del PNG. */
export const PERIMETRO_IN_PAROLE = testoPerimetro('REGIONALE');

/** Pill dell'anno di riferimento del file della verifica (annoRiferimento della risposta; null = nessun file). */
export function pillAnnoDelFile(anno: number | null): string {
  return `Anno di riferimento del file SMP non SIGC: ${anno ?? 'nessun file'}`;
}

/** Pill dell'esercizio della verifica SMP SIGC (esercizio della risposta). */
export function pillEsercizio(esercizio: number | undefined): string {
  return `Esercizio finanziario: ${esercizio ?? 'non indicato'}`;
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

/** Una quantita' di output con l'unita' di misura dell'indicatore accanto: "1.500 ettari"; senza unita' il solo numero. */
export function quantita(v: number, unita: string | null | undefined): string {
  return unita ? `${formatNumber(v)} ${unita}` : formatNumber(v);
}

/** Definizioni del backend accanto alla tabella della verifica (D-02, D-04, D-05; da confermare: OP-IS-07). */
export const DEFINIZIONI_VERIFICA =
  'Definizioni del backend: domande ricevute = domande di sostegno correnti (non SIGC per costruzione), contate anche senza importo richiesto ma escluse dal valore; finanziate = importo ammesso maggiore di zero; pagate = pratiche con un saldo pagato, solo saldate al 100% (definizione da confermare con ARSIAL); spesa erogata = righe pagate non SIGC, anticipi inclusi, al lordo dei recuperi; output erogato = valore del file non SIGC, cumulativo per anno di riferimento (da confermare con ARSIAL e AGEA).';

/** La verifica SMP SIGC senza l'esercizio: la pagina non legge e chiede di sceglierlo (TX-0015, esercizio obbligatorio). */
export const SCEGLI_ESERCIZIO = "Scegli l'esercizio finanziario da consultare.";

/** La verifica SMP SIGC senza righe per l'esercizio scelto. */
export const NESSUN_DATO_SIGC = "Nessun dato SIGC per l'esercizio scelto. Scegli un altro esercizio.";

/** Un dato facoltativo della verifica SMP SIGC (TX-0015, campi facoltativi nella spec): assente = "non disponibile". */
export function numeroOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : formatNumber(v);
}

/** Un testo facoltativo della verifica SMP SIGC (indicatori): assente o vuoto = "non disponibile". */
export function testoOpzionale(v: string | null | undefined): string {
  return v == null || v.trim() === '' ? NON_DISPONIBILE : v;
}

/** Un anno facoltativo (anno delle domande della verifica SMP SIGC), senza separatore delle migliaia. */
export function annoOpzionale(v: number | null | undefined): string {
  return v == null ? NON_DISPONIBILE : String(v);
}
