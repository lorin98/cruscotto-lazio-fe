// determine.ts — funzioni PURE della pagina delle determine (TX-0020, zero React; dal fisico col riallineamento degli ambiti
// del 29/10/2026): il codice a barre del percorso e del
// modulo di ricerca (sole cifre, al piu' 30: descrizione del parametro nella spec, la stessa della scheda dell'elenco), gli
// indirizzi dei due link dichiarati nello uiplan (cerca-domanda verso la stessa route, scheda-domanda verso l'elenco
// operativo) e i testi della testata, dei riquadri e della tabella. I si'/no (siNo di lib/formato) e la determina corrente
// sono in testo. Dal
// wireframe del procedurale approvato il 30/10/2026: il perimetro della risposta in un badge di testo e un solo messaggio
// per la domanda non trovata, inesistente o fuori dal perimetro ADA del P4 (scelte 2 e 3 del dossier). Dalla decisione D1
// dell'utente del 30/10/2026 (review step9 EO-01, flusso riapprovato): l'avviso "domanda dell'altro tipo" e il link
// scheda-di-partenza, in arrivo dalla scheda dell'elenco con un tipo diverso da quello della risposta.
import { PERCORSO_DETERMINE_DELLA_DOMANDA, arrivoSullaScheda, codiceABarreValido, etichettaTipoDomanda, percorsoSchedaDomanda } from '../../../entities/domanda';
import type { TipoDellaDomanda } from '../../../entities/domanda';
import type { Determina, Determine, Perimetro } from './dto';

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

/**
 * Link cerca-domanda (stessa route /procedurale/determine/:codice?): senza codice l'ingresso dal menu. L'indirizzo e' del
 * contratto condiviso (entities/domanda), lo stesso della voce di menu e del link dell'elenco operativo.
 */
export function percorsoDetermine(codice?: string): string {
  return codice ? `${PERCORSO_DETERMINE_DELLA_DOMANDA}/${encodeURIComponent(codice)}` : PERCORSO_DETERMINE_DELLA_DOMANDA;
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

/** Il tipo in parole, minuscolo: "pagamento", "sostegno". */
const tipoInParole = (tipo: string) => etichettaTipoDomanda(tipo).toLowerCase();

/** "Domanda di pagamento", "Domanda di sostegno". */
export function testoTipoDomanda(tipo: string): string {
  return `Domanda di ${tipoInParole(tipo)}`;
}

/**
 * Domanda dell'altro tipo (decisione D1 dell'utente del 30/10/2026, review step9 EO-01): TX-0020 sceglie fra le domande
 * del codice con la regola dell'aggancio (SC-PC_DETERMINA_TIPO), quindi in arrivo dalla scheda dell'elenco (il tipo della
 * scheda nello state della navigazione) la risposta puo' essere dell'altro tipo. Il tipo della scheda di partenza se e'
 * diverso da tipoDomanda della risposta; null (nessun avviso) senza tipo di partenza, senza risposta o con lo stesso tipo.
 */
export function tipoDiPartenzaDiverso(partenza: TipoDellaDomanda | null, d: Pick<Determine, 'tipoDomanda'> | undefined): TipoDellaDomanda | null {
  return partenza !== null && d !== undefined && d.tipoDomanda !== partenza ? partenza : null;
}

/**
 * L'avviso "domanda dell'altro tipo", col codice cercato, il tipo della risposta e quello della scheda di partenza. Testo
 * neutro, vero in ogni caso (decisione D4 dell'utente del 30/10/2026, review step9 PRO2-03): TX-0020 sceglie per prima la
 * domanda con determine aperte, quindi la domanda di partenza puo' non averne (34810063735 e 34810063736 di
 * SC-PC_DETERMINA_TIPO), e l'avviso non dice dove sono le sue.
 */
export function messaggioAltroTipo(codice: string, tipoDellaRisposta: string, tipoDellaScheda: TipoDellaDomanda): string {
  return `Il codice a barre ${codice} è anche di una domanda di ${tipoInParole(tipoDellaRisposta)}: questa pagina mostra quella domanda, non la domanda di ${tipoInParole(tipoDellaScheda)} da cui arrivi.`;
}

/** Testo del link scheda-di-partenza: "Apri la scheda della domanda di sostegno, scheda Determine". */
export function testoSchedaDiPartenza(tipoDellaScheda: TipoDellaDomanda): string {
  return `Apri la scheda della domanda di ${tipoInParole(tipoDellaScheda)}, scheda Determine`;
}

/**
 * Link scheda-di-partenza verso l'elenco operativo (/elenco-operativo/domande/:tipo/:codiceABarre: tipo portato dal link
 * della scheda, codice cercato): solo con il grant della scheda (csr.tx-0058.read). Gate di UX. null = nessun link.
 */
export function percorsoSchedaDiPartenza(tipoDellaScheda: TipoDellaDomanda, codice: string, conGrantScheda: boolean): string | null {
  return conGrantScheda ? percorsoSchedaDomanda(tipoDellaScheda, codice) : null;
}

/**
 * State del link scheda-di-partenza: la scheda della domanda si apre sulla scheda Determine, come promette il testo del
 * link (contratto condiviso di entities/domanda, mai nell'indirizzo).
 */
export const ARRIVO_SU_DETERMINE = arrivoSullaScheda('determine');

/**
 * Il perimetro della risposta in testo (WCAG 1.4.1, non solo un colore): regionale per P1, P2 e il P3 dell'area procedurale
 * (e per chi ha anche uno di questi profili, OP-PR-06), ADA per il solo P4, che trova solo le domande della sua area.
 */
export function badgePerimetro(perimetro: Perimetro): string {
  return perimetro === 'ADA' ? 'Perimetro: ADA, domande della tua area' : 'Perimetro: regionale';
}

/** Badge della testata, in testo: tipo, corrente o chiusa, quante determine con riga aperta, perimetro. */
export function badgeDetermine(d: Determine): string[] {
  const n = d.elenco.length;
  return [
    testoTipoDomanda(d.tipoDomanda),
    d.domandaChiusa ? "Domanda chiusa: non è più nelle fonti SIAN" : 'Domanda corrente',
    n === 1 ? '1 determina con riga aperta' : `${n} determine con riga aperta`,
    badgePerimetro(d.perimetro),
  ];
}

/**
 * Il 404 NOT_FOUND di TX-0020: lo stesso messaggio per la domanda inesistente e per quella fuori dal perimetro del P4 (il
 * backend risponde con lo stesso corpo), cosi' la pagina non rivela l'esistenza di domande di altre aree.
 */
export function messaggioDomandaNonTrovata(codice: string): string {
  return `Domanda non trovata: nessuna domanda con il codice a barre ${codice} fra quelle che puoi consultare.`;
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
