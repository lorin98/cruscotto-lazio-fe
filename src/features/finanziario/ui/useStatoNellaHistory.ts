// useStatoNellaHistory — stato di una pagina del finanziario da ritrovare tornando indietro (dall'elenco operativo o dal
// dettaglio): il hook generico del kit (shared/ui) con la firma dei filtri. Vale solo per gli stessi filtri: una selezione
// nuova e' un dettaglio nuovo (N-01, review v2), quindi con filtri diversi lo stato salvato si ignora.
import { useStatoNellaHistory as useStatoGenerico } from '../../../shared/ui';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';

export function useStatoNellaHistory<T>(chiave: string, filtri: Filtri, valido: (v: unknown) => v is T): [T | undefined, (valore: T) => void] {
  return useStatoGenerico<T>(chiave, ricercaDaFiltri(filtri), valido);
}
