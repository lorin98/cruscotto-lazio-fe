// perimetro.ts — perimetro dei dati del finanziario, funzioni PURE (zero React): regionale, oppure l'area decentrata
// (ADA) del profilo per le misure per domanda. I dati di programma (dotazione, quote) restano regionali anche per un P4.

/** Perimetro delle misure per domanda (enum della spec: il controllo di allineamento e' in ui/contratto.ts). */
export type Perimetro = 'REGIONALE' | 'ADA';

const PERIMETRI: Record<Perimetro, string> = {
  REGIONALE: 'Regionale: tutte le domande della regione',
  ADA: 'Area decentrata (ADA): solo le domande della propria area',
};

export function etichettaPerimetro(perimetro: Perimetro | null | undefined): string {
  return perimetro ? PERIMETRI[perimetro] : 'non indicato';
}

/** Testo breve del perimetro per la barra dei filtri. */
export function perimetroBreve(perimetro: Perimetro): string {
  return perimetro === 'ADA' ? 'la tua area (ADA)' : 'regionale';
}
