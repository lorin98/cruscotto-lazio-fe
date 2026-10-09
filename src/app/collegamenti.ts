// collegamenti.ts — link del piede e della fascia dell'ente. Gli indirizzi di accessibilita', privacy e note legali li
// fornisce ARSIAL: finche' mancano il piede li dichiara "da definire" invece di puntare a una pagina inesistente.

export interface Collegamento {
  etichetta: string;
  url: string | null;
}

export const SITO_REGIONE: Collegamento = { etichetta: 'Regione Lazio', url: 'https://www.regione.lazio.it' };
export const SITO_ARSIAL: Collegamento = { etichetta: 'ARSIAL', url: 'https://www.arsial.it' };

export const COLLEGAMENTI_LEGALI: Collegamento[] = [
  { etichetta: "Dichiarazione di accessibilità", url: null },
  { etichetta: 'Privacy', url: null },
  { etichetta: 'Note legali', url: null },
];
