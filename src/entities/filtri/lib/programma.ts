// programma.ts — funzioni PURE dei filtri sulle dimensioni del programma (zero React): intervento, obiettivo specifico,
// generale e di policy, azione portante. Sono gli stessi cinque parametri ripetibili per i report del finanziario (RF001,
// TX-0002..TX-0015) e per le superfici del fisico (TX-0018: "filtri come nei report finanziari", SC-FS_FILTRI): formato
// ammesso, lettura e scrittura nell'indirizzo, etichette, chip. Prima stavano nel lib del finanziario; il fisico li usa
// uguali, quindi sono qui (il finanziario li riesporta dal suo lib/filtri).
import { MAX_VALORI_PARAMETRO, leggiRipetuti, scriviRipetuti } from '../../../shared/lib';

export const CHIAVI_FILTRO = ['intervento', 'os', 'og', 'op', 'azione'] as const;
export type ChiaveFiltro = (typeof CHIAVI_FILTRO)[number];
/** Stessa forma dei parametri dei report: ogni filtro e' ripetibile. */
export type Filtri = Partial<Record<ChiaveFiltro, string[]>>;

/** Una voce di un filtro: il valore da rimandare e la descrizione, se c'e' (forma di VoceFiltro di TX-0001 e TX-0060). */
export interface VoceLike {
  chiave?: string;
  descrizione?: string | null;
}

/** I valori dei gruppi del pannello, nella forma comune di FiltriFinanziari (TX-0001) e ValoriFiltriElenco (TX-0060). */
export interface ValoriProgramma {
  interventi?: VoceLike[];
  obiettiviSpecifici?: VoceLike[];
  obiettiviGenerali?: string[];
  obiettiviPolicy?: string[];
  azioniPortanti?: VoceLike[];
  legameAzioniDisponibile?: boolean;
}

// Formato ammesso per ogni filtro (valori reali: SRA01, OS-AKIS, OG1, OP2, azione 3) e tetto di valori per chiave del
// backend (ParametriGrezzi.MAX_VALORI). Un valore fuori formato viene scartato: dall'indirizzo non arriva in pagina testo
// arbitrario (A-11), e il backend lo rifiuterebbe comunque.
const FORMATI: Record<ChiaveFiltro, RegExp> = {
  intervento: /^[A-Z]{2,4}[0-9]{2,3}$/,
  os: /^[A-Z0-9][A-Z0-9-]{0,15}$/,
  // il backend espone OG e OP atomici (OG1..OG3, OG-AKIS, OP1..OP5): solo codici, niente testo libero (R-12)
  og: /^OG[0-9A-Z-]{1,10}$/,
  op: /^OP[0-9A-Z-]{1,10}$/,
  azione: /^[0-9]{1,6}$/,
};
export const MAX_VALORI_FILTRO = MAX_VALORI_PARAMETRO;

export function valoreFiltroValido(chiave: ChiaveFiltro, valore: string): boolean {
  return FORMATI[chiave].test(valore);
}

/** Filtri dalla query string: chiavi note, valori nel formato ammesso, senza doppioni, al piu' MAX_VALORI_FILTRO. */
export function filtriDaRicerca(ricerca: string | URLSearchParams): Filtri {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const filtri: Filtri = {};
  for (const chiave of CHIAVI_FILTRO) {
    const valori = leggiRipetuti(p, chiave, (v) => valoreFiltroValido(chiave, v));
    if (valori.length > 0) filtri[chiave] = valori;
  }
  return filtri;
}

/** Query string dei filtri (senza "?"), nel formato atteso dal backend: chiave ripetuta per ogni valore. */
export function ricercaDaFiltri(filtri: Filtri): string {
  return scriviRipetuti(CHIAVI_FILTRO, (chiave) => filtri[chiave as ChiaveFiltro]);
}

/**
 * I soli filtri del programma di una query string (senza "?"), validi e nell'ordine delle chiavi: la parte che resta
 * passando dal menu da un report all'altro di un'area (finanziario, istituzionale; review H7 dell'istituzionale).
 */
export function ricercaDeiSoliFiltri(ricerca: string): string {
  return ricercaDaFiltri(filtriDaRicerca(ricerca));
}

/** Toglie il filtro per azione portante quando il backend dichiara che il legame non c'e' (OP-002). */
export function senzaAzioneSeNonDisponibile<F extends Filtri>(filtri: F, legameDisponibile: boolean): F {
  if (legameDisponibile || !filtri.azione) return filtri;
  const resto: F = { ...filtri };
  delete resto.azione;
  return resto;
}

/** Etichette dei filtri, le stesse nella barra (forma breve) e nel pannello (forma estesa). */
export const ETICHETTE_FILTRO: Record<ChiaveFiltro, { breve: string; estesa: string }> = {
  intervento: { breve: 'Intervento', estesa: 'Intervento' },
  os: { breve: 'OS', estesa: 'Obiettivo specifico (OS)' },
  og: { breve: 'OG', estesa: 'Obiettivo generale (OG)' },
  op: { breve: 'OP', estesa: 'Obiettivo di policy (OP)' },
  azione: { breve: 'Azione portante', estesa: 'Azione portante' },
};

/** Un filtro attivo: chiave, valore ed etichetta breve. */
export interface FiltroAttivo {
  chiave: ChiaveFiltro;
  valore: string;
  etichetta: string;
}

/** I filtri attivi, nell'ordine delle chiavi. */
export function filtriAttivi(filtri: Filtri): FiltroAttivo[] {
  return CHIAVI_FILTRO.flatMap((chiave) => (filtri[chiave] ?? []).map((valore) => ({ chiave, valore, etichetta: ETICHETTE_FILTRO[chiave].breve })));
}

/** I filtri senza un valore (un chip tolto); una chiave rimasta senza valori sparisce. */
export function senzaValore<F extends Filtri>(filtri: F, chiave: ChiaveFiltro, valore: string): F {
  const resto = (filtri[chiave] ?? []).filter((v) => v !== valore);
  const nuovi: F = { ...filtri };
  if (resto.length > 0) nuovi[chiave] = resto;
  else delete nuovi[chiave];
  return nuovi;
}

/**
 * Un criterio attivo della barra dei filtri: chiave stabile, etichetta breve, valore, la dimensione del programma (null per
 * un criterio della pagina, es. la campagna del fisico) e i criteri senza di lui (il chip tolto).
 */
export interface FiltroNellaBarra<F> {
  chiave: string;
  etichetta: string;
  valore: string;
  dimensione: ChiaveFiltro | null;
  senza: F;
}

/** I filtri del programma attivi come voci della barra, nell'ordine delle chiavi: un chip per valore. */
export function filtriNellaBarra<F extends Filtri>(filtri: F): FiltroNellaBarra<F>[] {
  return filtriAttivi(filtri).map((f) => ({ chiave: `${f.chiave}:${f.valore}`, etichetta: f.etichetta, valore: f.valore, dimensione: f.chiave, senza: senzaValore(filtri, f.chiave, f.valore) }));
}

/** Testo del chip del filtro per azione portante quando il legame interventi - azioni non c'e' (non si applica). */
export const AZIONE_NON_APPLICATA = 'non applicato: il legame con le azioni portanti viene da una fonte non attiva';

/**
 * La descrizione dell'intervento fra le voci dei filtri (TX-0001, TX-0060), se lette e se c'e'. Prima nel lib del fisico;
 * la usano anche la testata e il drawer dell'istituzionale e il titolo del dettaglio del finanziario.
 */
export function descrizioneIntervento(voci: readonly VoceLike[] | undefined, codice: string): string | undefined {
  return voci?.find((v) => v.chiave === codice)?.descrizione ?? undefined;
}

/**
 * Le voci del pannello dei filtri: quelle lette (TX-0060, decisione G2), oppure, senza il grant o con la lettura in errore,
 * i soli codici degli interventi della risposta del report (gli obiettivi e le azioni non hanno voci). Prima nel lib del
 * fisico; il pannello comune (PannelloFiltriProgramma) la usa per il fisico e l'istituzionale.
 */
export function vociDelPannello(valori: ValoriProgramma | undefined, codiciRisposta: readonly string[]): ValoriProgramma {
  return valori ?? { interventi: codiciRisposta.map((chiave) => ({ chiave })) };
}
