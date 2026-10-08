// selezione.ts — segnale POSITIVO di "selezione senza interventi" per le sezioni che non hanno righe per intervento:
// le righe di TX-0002 (spesa per intervento) per gli stessi filtri, condivise in cache con la pagina Dotazione; per gli
// importi SIGC il conteggio delle domande presentate (TX-0012). Uno stato vuoto non si deduce mai da importi a zero: un
// intervento reale puo' avere dotazione 0,00 (review step9 X-03). Il segnale ha tre stati: finche' e' in attesa la
// sezione resta in caricamento, cosi' non mostra prima gli zeri e poi il vuoto (R-15). Senza il grant del segnale (o
// con il segnale in errore) non si legge e non si afferma nulla: la sezione mostra i suoi dati (R-09).
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { StatoQuery } from '../../../shared/ui';
import { useSigcDomande, useSpesaPerIntervento } from '../api';
import type { Filtri } from '../lib/filtri';

export type Segnale = 'in-attesa' | 'vuota' | 'non-vuota';

function segnale<T>(abilitato: boolean, q: { data: T | undefined; isError: boolean }, vuota: (d: T) => boolean): Segnale {
  if (!abilitato || q.isError) return 'non-vuota';
  if (q.data === undefined) return 'in-attesa';
  return vuota(q.data) ? 'vuota' : 'non-vuota';
}

export function useSelezioneSenzaInterventi(filtri: Filtri): Segnale {
  const abilitato = hasGrant(useAuthStatus().data, 'csr.tx-0002.read');
  return segnale(abilitato, useSpesaPerIntervento(filtri, abilitato), (d) => (d.righe ?? []).length === 0);
}

export function useSelezioneSenzaDomandeSigc(filtri: Filtri): Segnale {
  const abilitato = hasGrant(useAuthStatus().data, 'csr.tx-0012.read');
  return segnale(abilitato, useSigcDomande(filtri, abilitato), (d) => d.presentate === 0);
}

/** Finche' il segnale e' in attesa i dati della sezione restano nascosti dietro il caricamento. */
export function inAttesaDelSegnale<T>(stato: StatoQuery<T>, s: Segnale): StatoQuery<T> {
  if (s !== 'in-attesa' || stato.data === undefined) return stato;
  return { ...stato, data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' };
}
