// useDescrizioneIntervento — descrizione di un intervento dai valori dei filtri (TX-0001, la stessa lettura in cache del
// pannello): per il titolo della pagina di dettaglio. Senza il grant di TX-0001 non legge e restituisce undefined.
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { useFiltri } from '../api';
import { GRANT } from '../lib/report';

export function useDescrizioneIntervento(codice: string | undefined): string | undefined {
  const abilitato = hasGrant(useAuthStatus().data, GRANT.filtri);
  const { data } = useFiltri(abilitato);
  return data?.interventi?.find((v) => v.chiave === codice)?.descrizione ?? undefined;
}
