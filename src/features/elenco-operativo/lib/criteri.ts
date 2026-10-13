// criteri.ts — funzioni PURE della feature elenco-operativo (zero React): i criteri dell'interrogazione nell'indirizzo
// della pagina (url_params dello uiplan, D-02 del backend), pagina, dimensione e ordinamento lato server (D-04), i criteri
// che passano da un elenco all'altro e quelli del sinottico e dell'esportazione.
// Nel contratto ogni parametro e' testuale e ripetibile: i criteri hanno la stessa forma (Record<nome, string[]>).
import { MAX_VALORI_PARAMETRO, leggiRipetuti, scriviRipetuti } from '../../../shared/lib';

/** Filtri della domanda comuni ai due elenchi (i link "pagamenti di queste domande" e ritorno li portano tutti). */
export const FILTRI_DOMANDA = [
  'tipo',
  'anno',
  'annualita',
  'intervento',
  'os',
  'og',
  'op',
  'azione',
  'stato',
  'statoProgrammazione',
  // drill-down dai report procedurali per stato (D-02 Rev. 2 del backend): chiavi dei report, non controlli del pannello
  'statoSostegno',
  'statoPagamento',
  'voceProgrammazione',
  'provincia',
  'ente',
  'pagamento',
  'presentata',
  'sigc',
  'concessione',
  'anomalie',
  'richiestoDa',
  'richiestoA',
  'ammessoDa',
  'ammessoA',
  'pagatoDa',
  'pagatoA',
  'testo',
] as const;
/** Filtri dei soli pagamenti (TX-0059). */
export const FILTRI_PAGAMENTO = ['decreto', 'esito'] as const;
/** Pagina, dimensione e ordinamento: non sono filtri (non contano, non passano fra elenchi, non vanno al sinottico). */
export const PARAMETRI_PAGINA = ['pagina', 'dimensione', 'ordina'] as const;

export type FiltroDomanda = (typeof FILTRI_DOMANDA)[number];
export type FiltroPagamento = (typeof FILTRI_PAGAMENTO)[number];
export type NomeFiltro = FiltroDomanda | FiltroPagamento;
export type NomeParametro = NomeFiltro | (typeof PARAMETRI_PAGINA)[number];

/** Stessa forma dei parametri di TX-0056/TX-0059 (wrapper api): ogni parametro e' una lista di testi. */
export type Criteri = Partial<Record<NomeParametro, string[]>>;

export type Elenco = 'domande' | 'pagamenti';

/** Parametri ammessi nell'indirizzo di ciascun elenco (gli url_params dello uiplan, nell'ordine del contratto). */
export const PARAMETRI: Record<Elenco, readonly NomeParametro[]> = {
  domande: [...FILTRI_DOMANDA, ...PARAMETRI_PAGINA],
  pagamenti: [...FILTRI_PAGAMENTO, ...FILTRI_DOMANDA, ...PARAMETRI_PAGINA],
};

/** Filtri a valore singolo (gli altri sono ripetibili): booleani, estremi degli importi, testo libero. */
const SINGOLI: ReadonlySet<NomeParametro> = new Set([
  'presentata',
  'sigc',
  'concessione',
  'anomalie',
  'richiestoDa',
  'richiestoA',
  'ammessoDa',
  'ammessoA',
  'pagatoDa',
  'pagatoA',
  'testo',
  'pagina',
  'dimensione',
  'ordina',
]);

/** Tetto dei valori ripetuti (shared/lib, ParametriGrezzi del backend) e della lunghezza di un valore. */
export const MAX_VALORI = MAX_VALORI_PARAMETRO;
export const MAX_LUNGHEZZA = 255;
/** Testo libero: da 3 a 100 caratteri (D-02); sotto i 3 non si manda (il backend risponderebbe 400). */
export const TESTO_MIN = 3;
export const TESTO_MAX = 100;
export const DIMENSIONE_PREDEFINITA = 25;
export const DIMENSIONE_MASSIMA = 100;

// caratteri di controllo o di formato: il backend li rifiuta (400, D-02 Rev. 1); dall'indirizzo non arrivano in pagina.
// Classe costruita dai codici (C0, DEL e C1, spazi a larghezza zero, separatori e controlli bidirezionali, BOM).
const INTERVALLI_CONTROLLO: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x1f],
  [0x7f, 0x9f],
  [0x200b, 0x200f],
  [0x2028, 0x202e],
  [0x2060, 0x206f],
  [0xfeff, 0xfeff],
];
const CONTROLLO = new RegExp(`[${INTERVALLI_CONTROLLO.map(([a, b]) => `${String.fromCharCode(a)}-${String.fromCharCode(b)}`).join('')}]`, 'u');

/** Valore utilizzabile in un parametro: non vuoto dopo il trim, senza caratteri di controllo, al piu' 255 caratteri. */
export function valoreAccettabile(valore: string): boolean {
  const v = valore.trim();
  return v.length > 0 && v.length <= MAX_LUNGHEZZA && !CONTROLLO.test(v);
}

/** Criteri dalla query string: solo i parametri dell'elenco, valori ripuliti e senza doppioni, al piu' MAX_VALORI. */
export function criteriDaRicerca(ricerca: string | URLSearchParams, elenco: Elenco): Criteri {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const criteri: Criteri = {};
  for (const nome of PARAMETRI[elenco]) {
    const valori = leggiRipetuti(p, nome, valoreAccettabile, SINGOLI.has(nome) ? 1 : MAX_VALORI);
    if (valori.length === 0) continue;
    criteri[nome] = valori;
  }
  return criteri;
}

/** Query string dei criteri, nell'ordine del contratto (stabile: lo stesso insieme da' lo stesso indirizzo). */
export function ricercaDaCriteri(criteri: Criteri, elenco: Elenco): string {
  const s = scriviRipetuti(PARAMETRI[elenco], (nome) => criteri[nome as NomeParametro]);
  return s ? `?${s}` : '';
}

function senza(criteri: Criteri, nomi: readonly NomeParametro[]): Criteri {
  const out: Criteri = { ...criteri };
  for (const n of nomi) delete out[n];
  return out;
}

/** Criteri con un filtro sostituito (lista vuota = filtro tolto); si torna alla prima pagina. */
export function conFiltro(criteri: Criteri, nome: NomeFiltro, valori: readonly string[]): Criteri {
  const out = senza(criteri, ['pagina']);
  const puliti = [...new Set(valori.map((v) => v.trim()).filter(valoreAccettabile))];
  if (puliti.length === 0) delete out[nome];
  else out[nome] = SINGOLI.has(nome) ? puliti.slice(0, 1) : puliti.slice(0, MAX_VALORI);
  return out;
}

/** Aggiunge un valore a un filtro ripetibile (clic su un grafico); si torna alla prima pagina. */
export function conValore(criteri: Criteri, nome: NomeFiltro, valore: string): Criteri {
  return conFiltro(criteri, nome, [...(criteri[nome] ?? []), valore]);
}

/** Toglie un valore (chip rimosso); senza valore toglie l'intero filtro. Si torna alla prima pagina. */
export function senzaValore(criteri: Criteri, nome: NomeFiltro, valore?: string): Criteri {
  return conFiltro(criteri, nome, valore === undefined ? [] : (criteri[nome] ?? []).filter((v) => v !== valore));
}

/** Tutti i filtri tolti; restano dimensione e ordinamento. */
export function senzaFiltri(criteri: Criteri): Criteri {
  const out: Criteri = {};
  if (criteri.dimensione) out.dimensione = criteri.dimensione;
  if (criteri.ordina) out.ordina = criteri.ordina;
  return out;
}

const DI_PAGINA: ReadonlySet<string> = new Set(PARAMETRI_PAGINA);

/** Numero di filtri attivi (un filtro ripetibile conta per ciascun valore): il conteggio del bottone dei filtri. */
export function numeroFiltri(criteri: Criteri): number {
  return Object.entries(criteri).reduce((n, [nome, valori]) => (DI_PAGINA.has(nome) ? n : n + (valori?.length ?? 0)), 0);
}

function intero(testo: string | undefined): number | null {
  if (testo === undefined || !/^\d{1,9}$/.test(testo)) return null;
  return Number(testo);
}

/** Pagina corrente, da 0 (valore assente o non numerico = 0). */
export function paginaDi(criteri: Criteri): number {
  return intero(criteri.pagina?.[0]) ?? 0;
}

/** Righe per pagina, fra 1 e 100 (assente o fuori dai limiti = 25). */
export function dimensioneDi(criteri: Criteri): number {
  const d = intero(criteri.dimensione?.[0]);
  return d !== null && d >= 1 && d <= DIMENSIONE_MASSIMA ? d : DIMENSIONE_PREDEFINITA;
}

export function conPagina(criteri: Criteri, pagina: number): Criteri {
  const out = senza(criteri, ['pagina']);
  if (pagina > 0) out.pagina = [String(Math.floor(pagina))];
  return out;
}

/** Cambio della dimensione: si torna alla prima pagina (la pagina corrente non avrebbe piu' le stesse righe). */
export function conDimensione(criteri: Criteri, dimensione: number): Criteri {
  const out = senza(criteri, ['pagina', 'dimensione']);
  if (dimensione !== DIMENSIONE_PREDEFINITA) out.dimensione = [String(dimensione)];
  return out;
}

export type VersoOrdinamento = 'asc' | 'desc';
export interface Ordinamento {
  campo: string;
  verso: VersoOrdinamento;
}

/** Campi ordinabili dal server (D-04, elenco chiuso del contratto); il primo e' il predefinito. */
export const CAMPI_ORDINABILI: Record<Elenco, readonly string[]> = {
  domande: ['codiceABarre', 'tipo', 'cuaa', 'denominazione', 'intervento', 'anno', 'stato', 'provincia', 'ente', 'richiesto', 'ammesso', 'pagato', 'ancoraDaPagare', 'liquidato'],
  pagamenti: ['decreto', 'dataAutorizzazione', 'codiceABarre', 'denominazione', 'intervento', 'importoPagato', 'importoDecretato'],
};

/** Ordinamento richiesto (campo dell'elenco chiuso, verso asc o desc), oppure quello predefinito (primo campo, asc). */
export function ordinamentoDi(criteri: Criteri, elenco: Elenco): Ordinamento {
  const m = /^([A-Za-z]+):(asc|desc)$/.exec(criteri.ordina?.[0] ?? '');
  if (m && CAMPI_ORDINABILI[elenco].includes(m[1])) return { campo: m[1], verso: m[2] as VersoOrdinamento };
  return { campo: CAMPI_ORDINABILI[elenco][0], verso: 'asc' };
}

/** Clic sull'intestazione di una colonna: stesso campo -> verso opposto, campo nuovo -> crescente; prima pagina. */
export function ordinaPer(criteri: Criteri, elenco: Elenco, campo: string): Criteri {
  if (!CAMPI_ORDINABILI[elenco].includes(campo)) return criteri;
  const attuale = ordinamentoDi(criteri, elenco);
  const verso: VersoOrdinamento = attuale.campo === campo && attuale.verso === 'asc' ? 'desc' : 'asc';
  const out = senza(criteri, ['pagina', 'ordina']);
  if (!(campo === CAMPI_ORDINABILI[elenco][0] && verso === 'asc')) out.ordina = [`${campo}:${verso}`];
  return out;
}

/** Criteri del sinottico (TX-0057): gli stessi filtri dell'elenco, senza pagina, dimensione e ordinamento. */
export function criteriSinottico(criteri: Criteri): Criteri {
  return senza(criteri, PARAMETRI_PAGINA);
}

/** Criteri dell'esportazione: filtri e ordinamento della consultazione, senza pagina e dimensione (tutte le righe). */
export function criteriEsportazione(criteri: Criteri): Criteri {
  return senza(criteri, ['pagina', 'dimensione']);
}

/** Filtri della domanda da portare nell'altro elenco (link fra domande e pagamenti): niente pagina ne' ordinamento. */
export function filtriDellaDomanda(criteri: Criteri): Criteri {
  const out: Criteri = {};
  for (const n of FILTRI_DOMANDA) if (criteri[n]?.length) out[n] = criteri[n];
  return out;
}

/** Il testo libero si manda solo da TESTO_MIN caratteri (sotto il backend risponderebbe 400). */
export function testoInviabile(testo: string): boolean {
  const t = testo.trim();
  return t.length === 0 || (t.length >= TESTO_MIN && t.length <= TESTO_MAX);
}

/**
 * Estremo di un importo nel formato del contratto (punto decimale), null se non e' un importo. Si scrive all'italiana
 * ("1.234,56": punti delle migliaia, virgola decimale); senza virgola un solo punto seguito da una o due cifre e'
 * decimale ("1234.5"), altrimenti i punti sono delle migliaia ("12.000").
 */
export function importoDaTesto(testo: string): string | null {
  const s = testo.trim();
  let t: string;
  if (s.includes(',')) t = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d+\.\d{1,2}$/.test(s)) t = s;
  else t = s.replace(/\./g, '');
  return /^\d{1,13}(\.\d{1,2})?$/.test(t) ? t : null;
}
