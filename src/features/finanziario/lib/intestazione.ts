// intestazione.ts — righe di contesto della pagina per l'intestazione dei file generati nel browser (il PNG dei grafici,
// NFR-50, review v3 V-01): i filtri applicati come nella barra, il profilo dell'utente, l'ultimo dato sincronizzato per
// flusso (TX-0001) con lo stesso testo dei file del backend. Puro.
import { testoUltimiDati } from './aggiornamento';
import type { UltimoDato } from './aggiornamento';

/** `filtri`: "Etichetta: valore" di ogni filtro applicato; `ultimi` assente = non letto (grant mancante, errore, attesa). */
export function righeContesto({ filtri, profilo, ultimi }: { filtri: readonly string[]; profilo: string | undefined; ultimi: readonly UltimoDato[] | undefined }): string[] {
  return [
    `Filtri applicati: ${filtri.length > 0 ? filtri.join('; ') : 'nessuno'}`,
    `Profilo: ${profilo ?? 'non indicato'}`,
    `Ultimo dato sincronizzato: ${ultimi ? testoUltimiDati(ultimi) : 'non disponibile'}`,
  ];
}
