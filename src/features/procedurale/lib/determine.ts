// determine.ts — funzioni PURE della pagina delle determine (TX-0020, zero React; dal fisico col riallineamento degli ambiti
// del 29/10/2026): il codice a barre del percorso e del
// modulo di ricerca (sole cifre, al piu' 30: descrizione del parametro nella spec, la stessa della scheda dell'elenco), gli
// indirizzi dei due link dichiarati nello uiplan (cerca-domanda verso la stessa route, scheda-domanda verso l'elenco
// operativo) e i testi della testata, dei riquadri e della tabella. I si'/no e la determina corrente sono in testo.
import { codiceABarreValido, etichettaTipoDomanda, percorsoSchedaDomanda } from '../../../entities/domanda';
import type { Determina, Determine } from './dto';
import { PERCORSI } from './pagine';

/** Il codice del percorso: nessuno (ingresso dal menu), valido (si legge), oppure non valido (nessuna lettura). */
export type CodiceDelPercorso = { stato: 'assente' } | { stato: 'valido'; codice: string } | { stato: 'non-valido' };

export function codiceDalPercorso(parametro: string | undefined): CodiceDelPercorso {
  if (parametro === undefined || parametro === '') return { stato: 'assente' };
  return codiceABarreValido(parametro) ? { stato: 'valido', codice: parametro } : { stato: 'non-valido' };
}

/** Le sole cifre di un testo (spazi e separatori si tolgono, come dice l'aiuto del modulo). */
export function soloCifre(testo: string): string {
  return testo.replace(/\D/g, '');
}

/** Esito del modulo di ricerca: il codice da cercare, oppure il messaggio d'errore da collegare al campo. */
export type CodiceCercato = { codice: string } | { errore: string };

export const MAX_CIFRE = 30;

export function codiceDaCercare(testo: string): CodiceCercato {
  const cifre = soloCifre(testo);
  if (cifre === '') return { errore: 'Scrivi il codice a barre della domanda: contano solo le cifre.' };
  if (cifre.length > MAX_CIFRE) return { errore: `Il codice a barre ha al più ${MAX_CIFRE} cifre: ne hai scritte ${cifre.length}.` };
  return { codice: cifre };
}

/** Link cerca-domanda (stessa route /procedurale/determine/:codice?): senza codice l'ingresso dal menu. */
export function percorsoDetermine(codice?: string): string {
  return codice ? `${PERCORSI.determine}/${encodeURIComponent(codice)}` : PERCORSI.determine;
}

/**
 * Link scheda-domanda verso l'elenco operativo (/elenco-operativo/domande/:tipo/:codiceABarre, tipo e codice dalla
 * risposta): solo con il grant della scheda e con la domanda non chiusa (la scheda risponde 404 per le domande chiuse).
 * Gate di UX: l'enforcement e' del backend. null = nessun link.
 */
export function percorsoSchedaDellaDomanda(d: Pick<Determine, 'tipoDomanda' | 'codiceABarre' | 'domandaChiusa'>, conGrantScheda: boolean): string | null {
  if (!conGrantScheda || d.domandaChiusa) return null;
  return percorsoSchedaDomanda(d.tipoDomanda, d.codiceABarre);
}

/** "Domanda di pagamento", "Domanda di sostegno". */
export function testoTipoDomanda(tipo: string): string {
  return `Domanda di ${etichettaTipoDomanda(tipo).toLowerCase()}`;
}

/** Badge della testata, in testo: tipo, corrente o chiusa, quante determine con riga aperta. */
export function badgeDetermine(d: Determine): string[] {
  const n = d.elenco.length;
  return [testoTipoDomanda(d.tipoDomanda), d.domandaChiusa ? "Domanda chiusa: non è più nelle fonti SIAN" : 'Domanda corrente', n === 1 ? '1 determina con riga aperta' : `${n} determine con riga aperta`];
}

/** "Domanda di pagamento 54810769585 - fonte delle informazioni" (sopratitolo della testata). */
export function sopratitoloDetermine(d: Pick<Determine, 'tipoDomanda' | 'codiceABarre'>): string {
  return `${testoTipoDomanda(d.tipoDomanda)} ${d.codiceABarre} - fonte delle informazioni`;
}

export function titoloDetermine(codice: string): string {
  return `Determine della domanda ${codice}`;
}

/** La determina e' la corrente della risposta (stesso codice e stessa data). */
export function eCorrente(determina: Determina, corrente: Determine['corrente']): boolean {
  return corrente.valore !== null && corrente.valore.codice === determina.codice && corrente.valore.data === determina.data;
}

/** La determina da cui viene un campo della domanda: la piu' recente dell'elenco che lo valorizza (D-03 del backend). */
export function fonteDi(elenco: readonly Determina[], campo: 'fonteStatoAreaProgrammazione' | 'fonteComparto'): Determina | undefined {
  return elenco.find((d) => d[campo]);
}

/** Si'/no in testo, mai solo un'icona. La colonna della corrente dice "sì, corrente". */
export function siNo(v: boolean, siTesto = 'sì'): string {
  return v ? siTesto : 'no';
}
