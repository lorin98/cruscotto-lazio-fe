// famiglie.ts — famiglia di un intervento del CSR, funzione PURA (zero React): e' il prefisso alfabetico del codice
// intervento (SRA01 -> SRA, SRD13 -> SRD). Un codice che non inizia con lettere seguite da cifre finisce in 'Altro'.

export const FAMIGLIA_ALTRO = 'Altro';

const PREFISSO_FAMIGLIA = /^([A-Za-z]+)\d/;

export function famigliaDi(codice: string): string {
  const trovato = PREFISSO_FAMIGLIA.exec(codice.trim());
  return trovato ? trovato[1].toUpperCase() : FAMIGLIA_ALTRO;
}
