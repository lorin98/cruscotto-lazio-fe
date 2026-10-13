// UltimoAggiornamento — la pill "Dati al ..." del finanziario (NFR-25 b, OP-FE-04, UI v2): le voci arrivano con TX-0001 (la
// stessa lettura, in cache, del pannello dei filtri); senza il suo grant la pill non c'e'. La pill e' quella del kit
// (PillDatiAl), condivisa con l'elenco operativo (review v1 H-07).
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { PillDatiAl } from '../../../shared/ui';
import { useFiltri } from '../api';
import { GRANT } from '../lib/report';

export function UltimoAggiornamento() {
  const abilitato = hasGrant(useAuthStatus().data, GRANT.filtri);
  const { data, isError } = useFiltri(abilitato);
  if (!abilitato) return null;
  return <PillDatiAl voci={data?.ultimiDatiSincronizzati} inErrore={isError} />;
}
