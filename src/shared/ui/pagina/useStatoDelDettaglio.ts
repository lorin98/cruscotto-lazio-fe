// useStatoDelDettaglio — lo stato di una pagina di dettaglio con piu' letture (statoDelDettaglio di shared/lib): finita
// la prima apertura (tutte le letture hanno risposto) la pagina non torna allo scheletro, che resta nella parte della
// lettura che riparte. Prima nel dettaglio dell'istituzionale; lo usa anche quello del procedurale.
import { useState } from 'react';
import { statoDelDettaglio, tutteRisposte } from '../../lib/dettaglio';
import type { LetturaDettaglio, StatoDettaglio } from '../../lib/dettaglio';

export function useStatoDelDettaglio(letture: readonly LetturaDettaglio[]): StatoDettaglio {
  const [giaRisposte, setGiaRisposte] = useState(false);
  const risposte = tutteRisposte(letture);
  if (risposte && !giaRisposte) setGiaRisposte(true);
  return statoDelDettaglio(letture, giaRisposte || risposte);
}
