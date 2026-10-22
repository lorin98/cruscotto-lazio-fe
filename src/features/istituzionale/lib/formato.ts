// formato.ts — testi PURI dell'istituzionale (zero React): perimetro, anno di riferimento del file e periodo della barra,
// quantita' con la loro unita' di misura (mai un numero senza unita', note WCAG dello uiplan), si'/no, target di fine
// periodo, assenze con la resa unica dell'entity importo (mai uno zero ne' un "no": motivi della slice compresi,
// OP-IS-08), stati vuoti e note sulle definizioni del backend (OP-IS-07: note fisse, non un dato). I testi sono quelli
// dei wireframe approvati del 22/10/2026, con le lettere accentate.
import { descriviAssenza, testoConNota } from '../../../entities/importo';
import type { DatoMotivatoLike, ImportoResa } from '../../../entities/importo';
import { formatNumber, maiuscolaIniziale } from '../../../shared/lib';

/** Pill della barra: i report istituzionali hanno sempre il perimetro regionale (spec: enum REGIONALE). */
export const PILL_PERIMETRO = 'Perimetro: regionale (i report istituzionali non hanno perimetro ADA)';

/** Perimetro della risposta in parole (sempre REGIONALE: "regionale"). */
export function testoPerimetro(perimetro: string): string {
  return perimetro === 'REGIONALE' ? 'regionale' : perimetro.toLowerCase();
}

/** Pill dell'anno di riferimento del file della verifica (annoRiferimento della risposta; null = nessun file). */
export function pillAnnoDelFile(anno: number | null): string {
  return `Anno di riferimento del file SMP non SIGC: ${anno ?? 'nessun file'}`;
}

/** Pill del periodo dell'output regionale (annoInizio..annoFine della risposta). */
export function pillPeriodo(inizio: number, fine: number): string {
  return `Periodo: ${inizio} - ${fine}`;
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

/** Un dato motivato in testo: il valore reso, oppure l'assenza col motivo fra parentesi (forma unica, testoConNota). */
export function testoMotivato<T>(dato: DatoMotivatoLike<T> | null | undefined, resa: (v: T) => string): string {
  return dato?.valore != null ? resa(dato.valore) : testoConNota(descriviAssenza(dato));
}

/** L'assenza in una frase, per i KPI: "Non valorizzato: il dato non è presente nella fonte". */
export function assenzaInFrase(dato: Pick<DatoMotivatoLike<unknown>, 'motivo' | 'fonte'> | null | undefined): string {
  const r = descriviAssenza(dato);
  return `${maiuscolaIniziale(r.testo)}${r.nota ? `: ${r.nota}` : ''}`;
}

/** Il target di fine periodo: "1.500 ettari al 2029", oppure la sua assenza col motivo. */
export function testoTarget(target: DatoMotivatoLike<number>, annoTarget: number | null, unita: string | null): string {
  return testoMotivato(target, (v) => `${quantita(v, unita)}${annoTarget === null ? '' : ` al ${annoTarget}`}`);
}

/** L'anno del target assente (TX-0017: null se il target manca), in badge come le altre assenze. */
export const ANNO_TARGET_ASSENTE: ImportoResa = { disponibile: false, testo: 'non valorizzato', nota: 'nessun target' };

/** Un testo del contratto che puo' mancare (indicatore, unita' di misura di TX-0017): l'assenza come NON_VALORIZZATO. */
export const TESTO_ASSENTE = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } as const;

/** Definizioni del backend accanto alla tabella della verifica (D-02, D-04, D-05; da confermare: OP-IS-07). */
export const DEFINIZIONI_VERIFICA =
  'Definizioni del backend: domande ricevute = domande di sostegno correnti (non SIGC per costruzione), contate anche senza importo richiesto ma escluse dal valore; finanziate = importo ammesso maggiore di zero; pagate = pratiche con un saldo pagato, solo saldate al 100% (definizione da confermare con ARSIAL); spesa erogata = righe pagate non SIGC, anticipi inclusi, al lordo dei recuperi; output erogato = valore del file non SIGC, cumulativo per anno di riferimento (da confermare con ARSIAL e AGEA).';

/** Definizioni del backend sotto la tabella dell'output regionale (D-03, D-04; da confermare: OP-IS-07). */
export const DEFINIZIONI_OUTPUT =
  'Fonte: TX-0017. Programmato per anno = somma dell\'output previsto delle Unit Amount dell\'esercizio (D-03): gli interventi senza Unit Amount valorizzate hanno il solo target di fine periodo. Realizzato SIGC = output erogato dell\'anno campagna; realizzato non SIGC = valore del file non SIGC per anno di riferimento, cumulativo (da confermare con ARSIAL e AGEA). Una riga presente in entrambi i monitoraggi è "non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)".';
