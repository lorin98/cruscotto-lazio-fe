// perimetro.ts — perimetro dei dati del finanziario, funzioni PURE (zero React): regionale, oppure l'area decentrata
// (ADA) del profilo per le misure per domanda. I dati di programma (dotazione, quote) restano regionali anche per un P4.

/** Perimetro delle misure per domanda (enum della spec: il controllo di allineamento e' in ui/contratto.ts). */
export type Perimetro = 'REGIONALE' | 'ADA';

export const PERIMETRO_ADA: Perimetro = 'ADA';

const PERIMETRI: Record<Perimetro, string> = {
  REGIONALE: 'Regionale: tutte le domande della regione',
  ADA: 'Area decentrata (ADA): solo le domande della propria area',
};

export function etichettaPerimetro(perimetro: Perimetro | null | undefined): string {
  return perimetro ? PERIMETRI[perimetro] : 'non indicato';
}

/** Testo breve del perimetro per la barra dei filtri. */
export function perimetroBreve(perimetro: Perimetro): string {
  return perimetro === PERIMETRO_ADA ? 'la tua area (ADA)' : 'regionale';
}

/** Perimetro di piu' risposte insieme: ADA se anche una sola e' limitata all'area del profilo, regionale se ce n'e'. */
export function perimetroCombinato(perimetri: ReadonlyArray<string | null | undefined>): Perimetro | undefined {
  if (perimetri.includes(PERIMETRO_ADA)) return PERIMETRO_ADA;
  return perimetri.includes('REGIONALE') ? 'REGIONALE' : undefined;
}

/** Etichetta di un dato di programma (dotazione, quote): con il perimetro ADA resta regionale e lo si dichiara. */
export function etichettaDiProgramma(etichetta: string, perimetro: string | null | undefined): string {
  return perimetro === PERIMETRO_ADA ? `${etichetta} (regionale)` : etichetta;
}
