// collegamenti.ts — gli indirizzi dei links[] dello uiplan del procedurale (PURO, ADR 0028 §8): il dettaglio
// dell'intervento dai report, la panoramica e le pagine degli stati coi criteri (stessa feature) e il drill-down verso le
// domande dell'elenco operativo (OP-PR-08: solo dove l'insieme del report si riproduce coi parametri dell'elenco). Ogni
// link porta solo i parametri della sua `query`, nell'ordine dello uiplan; verso un'altra feature e' solo URL, nessun
// import dalla feature di arrivo. Il filtro per stato area programmazione passa all'elenco come voceProgrammazione (stesse
// chiavi di TX-0025); i link per stato (statoSostegno, statoPagamento) aprono la parte rilasciata della voce. Fail-closed:
// un codice d'intervento o una chiave di stato della risposta che non si possono esprimere non danno un link (null),
// mai un elenco piu' largo di quello che il report conta. La visibilita' per grant la decide chi rende il link.
import { codiceDelPercorso } from '../../../entities/filtri';
import { PERCORSO_ELENCO_DOMANDE } from '../../../entities/domanda';
import { formatNumber, scriviRipetuti } from '../../../shared/lib';
import { PARAMETRO_STATO, chiaveStatoValida, conCriteri, statoAmmette } from './criteri';
import type { CriteriProcedurali } from './criteri';
import type { Dato, TipoDomanda } from './dto';
import { PERCORSI } from './pagine';
import { SENZA_STATO, diTipo, rilasciate } from './stati';
import type { VoceDistribuzione } from './stati';

/** La voce delle domande ammesse in voceProgrammazione (TX-0026: stato area programmazione Ammessa). */
export const VOCE_AMMESSA = 'AMMESSA';

/** Percorso con la query delle chiavi date, nell'ordine dato; senza valori il solo percorso. */
function conQuery(percorso: string, chiavi: readonly string[], valori: Readonly<Record<string, readonly string[] | undefined>>): string {
  const query = scriviRipetuti(chiavi, (k) => valori[k]);
  return query ? `${percorso}?${query}` : percorso;
}

/**
 * link:dettaglio-intervento-* : il dettaglio dell'intervento, col codice nel percorso CODIFICATO (un valore con '/' resta
 * un solo segmento della route) e lo stato area programmazione della pagina (le Unit Amount non lo passano).
 */
export function percorsoIntervento(codice: string, stato?: readonly string[]): string {
  return conQuery(`${PERCORSI.interventi}/${encodeURIComponent(codice)}`, [PARAMETRO_STATO], { [PARAMETRO_STATO]: stato });
}

/** link:panoramica-intervento: la panoramica filtrata sull'intervento, con lo stato del dettaglio. */
export function panoramicaDellIntervento(codice: string, stato?: readonly string[]): string {
  return conQuery(PERCORSI.panoramica, ['intervento', PARAMETRO_STATO], { intervento: [codice], [PARAMETRO_STATO]: stato });
}

/** link:stati-sostegno-panoramica e link:stati-pagamento-panoramica: la pagina degli stati coi criteri della panoramica. */
export function paginaDegliStati(tipo: 'statiSostegno' | 'statiPagamento', c: CriteriProcedurali): string {
  return conCriteri(PERCORSI[tipo], c);
}

// ---------------------------------------------------------------- drill-down verso l'elenco operativo

const PROGRAMMA = ['intervento', 'os', 'og', 'op'] as const;
const ATTO = ['concessione', 'tipo', 'voceProgrammazione'] as const;

/** I link dello uiplan verso /elenco-operativo/domande: la `query` copiata da `links[]`. */
export const LINK_ELENCO = {
  'elenco-ammesse-panoramica': ['voceProgrammazione', ...PROGRAMMA],
  'elenco-con-atto-panoramica': [...ATTO, ...PROGRAMMA],
  'elenco-area-programmazione-panoramica': ['voceProgrammazione', ...PROGRAMMA],
  'elenco-ammesse-intervento': ['voceProgrammazione', 'intervento'],
  'elenco-con-atto-intervento': [...ATTO, 'intervento'],
  'elenco-stato-sostegno-intervento': ['statoSostegno', 'voceProgrammazione', 'intervento'],
  'elenco-stato-pagamento-intervento': ['statoPagamento', 'voceProgrammazione', 'intervento'],
  'elenco-area-programmazione-intervento': ['voceProgrammazione', 'intervento'],
  'elenco-stato-sostegno': ['statoSostegno', 'voceProgrammazione', ...PROGRAMMA],
  'elenco-stato-sostegno-riga': ['statoSostegno', 'voceProgrammazione', 'intervento'],
  'elenco-stato-pagamento': ['statoPagamento', 'voceProgrammazione', ...PROGRAMMA],
  'elenco-stato-pagamento-riga': ['statoPagamento', 'voceProgrammazione', 'intervento'],
  'elenco-ammesse': ['voceProgrammazione', ...PROGRAMMA],
  'elenco-con-atto': [...ATTO, ...PROGRAMMA],
  'elenco-ammesse-riga': ['voceProgrammazione', 'intervento'],
  'elenco-con-atto-riga': [...ATTO, 'intervento'],
  'elenco-ammesse-riepilogo': ['voceProgrammazione', 'intervento'],
  'elenco-con-atto-riepilogo': [...ATTO, 'intervento'],
} as const satisfies Record<string, readonly string[]>;

export type IdLinkElenco = keyof typeof LINK_ELENCO;

/** Il punto del report che si apre: l'intervento della riga o del dettaglio, la voce dello stato area, lo stato SR-01. */
export interface PuntoElenco {
  intervento?: string;
  voceProgrammazione?: string;
  statoSostegno?: string;
  statoPagamento?: string;
  concessione?: boolean;
}

/** I valori dei parametri: i criteri della pagina, poi il punto (che sostituisce intervento e stato area). */
function parametri(c: CriteriProcedurali, p: PuntoElenco): Record<string, readonly string[] | undefined> {
  const voce = p.voceProgrammazione === undefined ? c.stato : [p.voceProgrammazione];
  return {
    intervento: p.intervento === undefined ? c.intervento : [p.intervento],
    os: c.os,
    og: c.og,
    op: c.op,
    voceProgrammazione: voce,
    statoSostegno: p.statoSostegno === undefined ? undefined : [p.statoSostegno],
    statoPagamento: p.statoPagamento === undefined ? undefined : [p.statoPagamento],
    concessione: p.concessione ? ['true'] : undefined,
    tipo: p.concessione ? ['SOSTEGNO'] : undefined,
  };
}

/** Il punto si puo' esprimere coi parametri dell'elenco: codice nel formato del filtro, chiavi di stato nel loro formato. */
function puntoValido(p: PuntoElenco): boolean {
  const stati = [p.voceProgrammazione, p.statoSostegno, p.statoPagamento].filter((s) => s !== undefined);
  return (p.intervento === undefined || codiceDelPercorso(p.intervento) !== null) && stati.every(chiaveStatoValida);
}

/** L'indirizzo del link `id` coi criteri della pagina e il punto del report; null se il punto non si puo' esprimere. */
export function indirizzoElenco(id: IdLinkElenco, c: CriteriProcedurali, p: PuntoElenco = {}): string | null {
  return puntoValido(p) ? conQuery(PERCORSO_ELENCO_DOMANDE, LINK_ELENCO[id], parametri(c, p)) : null;
}

/** I link per stato di un tipo di domanda: dalla pagina degli stati (coi filtri), dalla riga del drawer, dal dettaglio. */
export const LINK_STATO: Readonly<Record<TipoDomanda, Record<'pagina' | 'riga' | 'intervento', IdLinkElenco>>> = {
  SOSTEGNO: { pagina: 'elenco-stato-sostegno', riga: 'elenco-stato-sostegno-riga', intervento: 'elenco-stato-sostegno-intervento' },
  PAGAMENTO: { pagina: 'elenco-stato-pagamento', riga: 'elenco-stato-pagamento-riga', intervento: 'elenco-stato-pagamento-intervento' },
};

/** Il punto di una voce per stato: statoSostegno o statoPagamento secondo il tipo, e l'intervento della riga o del dettaglio. */
export function puntoDelloStato(tipo: TipoDomanda, chiave: string, intervento?: string): PuntoElenco {
  return { ...(tipo === 'SOSTEGNO' ? { statoSostegno: chiave } : { statoPagamento: chiave }), ...(intervento === undefined ? {} : { intervento }) };
}

/** Le domande ammesse si aprono con un numero maggiore di 0 e un filtro per stato che ammette AMMESSA. */
export function apreLeAmmesse(c: CriteriProcedurali, domande: number | null | undefined): boolean {
  return typeof domande === 'number' && domande > 0 && statoAmmette(c, VOCE_AMMESSA);
}

/** Le domande con atto si aprono solo con la fonte attiva e un numero maggiore di 0 (senza fonte l'elenco risponde 400). */
export function apreConAtto(conAtto: Dato | null | undefined): boolean {
  return typeof conAtto?.valore === 'number' && conAtto.valore > 0;
}

/** Una voce per stato si apre con una parte rilasciata maggiore di 0 (mai una voce senza fonte). */
export function apreLaVoce(v: VoceDistribuzione): boolean {
  return (rilasciate(v) ?? 0) > 0;
}

// ---------------------------------------------------------------- testi dei link (nome accessibile e testo visibile)

/** "la domanda [singolare]" o "le n domande [plurale]": quante domande apre il link. */
export function quanteDomande(n: number, singolare = '', plurale = singolare): string {
  const quante = n === 1 ? 'la domanda' : `le ${formatNumber(n)} domande`;
  const aggettivo = n === 1 ? singolare : plurale;
  return aggettivo ? `${quante} ${aggettivo}` : quante;
}

/** Il testo visibile e la descrizione del nome accessibile di un link "Apri nell'elenco" (ApriNellElenco di entities/domanda). */
export interface TestiLink {
  testo?: string;
  descrizione: string;
}

/**
 * Il link di una voce per stato (statoSostegno, statoPagamento): con domande non rilasciate il testo visibile dice quante
 * rilasciate apre, "Apri nell'elenco (n rilasciate)", e il nome accessibile lo ripete; altrimenti "Apri nell'elenco".
 */
export function testiLinkStato(v: VoceDistribuzione, tipo: TipoDomanda, codice?: string): TestiLink {
  const n = rilasciate(v) ?? 0;
  const parziale = (v.nonRilasciate ?? 0) > 0;
  const tipoDi = diTipo(tipo);
  const chi = parziale ? quanteDomande(n, `${tipoDi} rilasciata`, `${tipoDi} rilasciate`) : quanteDomande(n, tipoDi);
  const descrizione = `${chi}${codice ? ` di ${codice}` : ''} nello stato ${v.altro ? v.chiave : v.etichetta}`;
  return parziale ? { testo: `Apri nell'elenco (${formatNumber(n)} ${n === 1 ? 'rilasciata' : 'rilasciate'})`, descrizione } : { descrizione };
}

/** Il link di una voce dello stato area programmazione (voceProgrammazione): le domande di quello stato, o senza stato. */
export function testiLinkArea(v: VoceDistribuzione, codice?: string): TestiLink {
  const n = v.domande ?? 0;
  const di = codice ? ` di ${codice}` : '';
  if (v.chiave === SENZA_STATO) return { descrizione: `${quanteDomande(n)}${di} senza stato area programmazione` };
  return { descrizione: `${quanteDomande(n)}${di} con stato area programmazione ${v.etichetta}` };
}

/** Il link delle domande ammesse di una riga (cella o drawer). */
export function testiLinkAmmesse(n: number, codice: string): TestiLink {
  return { descrizione: `${quanteDomande(n, 'ammessa', 'ammesse')} di ${codice}` };
}

/** Il link delle domande con atto di concessione di una riga (cella o drawer), con la fonte attiva. */
export function testiLinkConAtto(n: number, codice: string): TestiLink {
  return { descrizione: `${quanteDomande(n, 'di sostegno con atto di concessione')} di ${codice}` };
}
