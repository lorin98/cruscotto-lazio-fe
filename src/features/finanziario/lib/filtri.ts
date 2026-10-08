// filtri.ts — funzioni PURE della feature finanziario (zero React): filtri di RF001 nell'indirizzo della pagina,
// etichette di perimetro e fase della riserva, anni consultabili.
// I filtri vivono nella query string (uiplan: la pagina dei filtri li applica, ogni report li legge e li mostra).

export const CHIAVI_FILTRO = ['intervento', 'os', 'og', 'op', 'azione'] as const;
export type ChiaveFiltro = (typeof CHIAVI_FILTRO)[number];
/** Stessa forma dei parametri dei report (FiltriReport dei wrapper api): ogni filtro e' ripetibile. */
export type Filtri = Partial<Record<ChiaveFiltro, string[]>>;

// Formato ammesso per ogni filtro (valori reali: SRA01, OS-AKIS, OG1, OP2, azione 3) e tetto di
// valori per chiave del backend (ParametriGrezzi.MAX_VALORI). Un valore fuori formato viene scartato: dall'indirizzo
// non arriva in pagina testo arbitrario (A-11), e il backend lo rifiuterebbe comunque.
const FORMATI: Record<ChiaveFiltro, RegExp> = {
  intervento: /^[A-Z]{2,4}[0-9]{2,3}$/,
  os: /^[A-Z0-9][A-Z0-9-]{0,15}$/,
  // il backend espone OG e OP atomici (OG1..OG3, OG-AKIS, OP1..OP5): solo codici, niente testo libero (R-12)
  og: /^OG[0-9A-Z-]{1,10}$/,
  op: /^OP[0-9A-Z-]{1,10}$/,
  azione: /^[0-9]{1,6}$/,
};
export const MAX_VALORI_FILTRO = 100;

export function valoreFiltroValido(chiave: ChiaveFiltro, valore: string): boolean {
  return FORMATI[chiave].test(valore);
}

/** Filtri dalla query string: chiavi note, valori nel formato ammesso, senza doppioni, al piu' MAX_VALORI_FILTRO. */
export function filtriDaRicerca(ricerca: string | URLSearchParams): Filtri {
  const p = typeof ricerca === 'string' ? new URLSearchParams(ricerca) : ricerca;
  const filtri: Filtri = {};
  for (const chiave of CHIAVI_FILTRO) {
    const valori = p
      .getAll(chiave)
      .map((v) => v.trim())
      .filter((v) => valoreFiltroValido(chiave, v));
    if (valori.length > 0) filtri[chiave] = Array.from(new Set(valori)).slice(0, MAX_VALORI_FILTRO);
  }
  return filtri;
}

/** Query string dei filtri (senza "?"), nel formato atteso dal backend: chiave ripetuta per ogni valore. */
export function ricercaDaFiltri(filtri: Filtri): string {
  const p = new URLSearchParams();
  for (const chiave of CHIAVI_FILTRO) for (const v of filtri[chiave] ?? []) p.append(chiave, v);
  return p.toString();
}

/** Toglie il filtro per azione portante quando il backend dichiara che il legame non c'e' (OP-002). */
export function senzaAzioneSeNonDisponibile(filtri: Filtri, legameDisponibile: boolean): Filtri {
  if (legameDisponibile || !filtri.azione) return filtri;
  const resto: Filtri = { ...filtri };
  delete resto.azione;
  return resto;
}

/** Perimetro delle misure per domanda (enum della spec: il controllo di allineamento e' in ui/contratto.ts). */
export type Perimetro = 'REGIONALE' | 'ADA';
const PERIMETRI: Record<Perimetro, string> = {
  REGIONALE: 'Regionale: tutte le domande della regione',
  ADA: 'Area decentrata (ADA): solo le domande della propria area',
};
export function etichettaPerimetro(perimetro: Perimetro | null | undefined): string {
  return perimetro ? PERIMETRI[perimetro] : 'non indicato';
}

/** Fasi della riserva al 5% (enum della spec, RF014). */
export type FaseRiserva = 'NON_INIZIATA' | 'ACCUMULO' | 'UTILIZZO' | 'RESIDUO';
const FASI_RISERVA: Record<FaseRiserva, (n: number) => string> = {
  NON_INIZIATA: (n) => `non iniziata (l'accumulo parte il 1/10/${n})`,
  ACCUMULO: (n) => `accumulo (dal 1/10/${n} al 30/6/${n + 1})`,
  UTILIZZO: (n) => `utilizzo (fino al 31/12/${n + 1})`,
  RESIDUO: (n) => `residuo (2% del montante, dal 1/1/${n + 2})`,
};
/** Etichetta della fase con le date dell'anno n della riserva. */
export function etichettaFaseRiserva(fase: FaseRiserva | null | undefined, anno: number): string {
  return fase ? FASI_RISERVA[fase](anno) : 'non disponibile';
}

/** Anno della riserva ed esercizio della verifica SMP: intero 2000-2100 (descrizione dei parametri nella spec). */
export function isAnnoValido(anno: number | null | undefined): anno is number {
  return typeof anno === 'number' && Number.isInteger(anno) && anno >= 2000 && anno <= 2100;
}

// Periodo di programmazione CSR 2023-2027 con la regola n+2: la riserva riguarda gli anni 2023-2029; l'esercizio n va
// dal 16/10/n-1 al 15/10/n, quindi i pagamenti ammessi fino al 31/12/2029 cadono nell'esercizio 2030.
const PRIMO_ANNO_CSR = 2023;
const ULTIMO_ANNO: Record<'riserva' | 'esercizio', number> = { riserva: 2029, esercizio: 2030 };

/** Anni da proporre nel selettore; un anno valido gia' scelto (es. dall'indirizzo) resta sempre selezionabile. */
export function anniSelezionabili(tipo: 'riserva' | 'esercizio', corrente?: number): number[] {
  const anni: number[] = [];
  for (let a = PRIMO_ANNO_CSR; a <= ULTIMO_ANNO[tipo]; a++) anni.push(a);
  if (isAnnoValido(corrente) && !anni.includes(corrente)) anni.push(corrente);
  return anni.sort((x, y) => x - y);
}
