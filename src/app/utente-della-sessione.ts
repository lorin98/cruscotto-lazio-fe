// utente-della-sessione.ts — identita' della sessione fra le letture di /auth/status e fra le schede (review X-06,
// N-05, N-15). I dati in cache e i grant valgono per l'identita' che li ha letti: se una nuova lettura di /auth/status
// trova un'altra identita' (nuovo accesso in un'altra scheda senza un 401 qui, o lo stesso utente con un altro profilo
// o altri ruoli), i dati della precedente lasciano la cache, tutto tranne lo stato della sessione. Succede nella stessa
// notifica della lettura, prima che le pagine si ridisegnino: le pagine montate rileggono i propri dati come nuova
// identita'. L'impronta (improntaIdentita) decide solo lo svuotamento: l'accesso lo decide il backend.
// Fra le schede (BroadcastChannel CANALE_UTENTE): la scheda che conosce per la prima volta l'identita' (si e' appena
// collegata), o la vede cambiare, manda "utente"; le altre rileggono /auth/status e, se l'identita' e' cambiata anche
// per loro, fanno lo stesso. Nessun ciclo: si annuncia solo un cambio. L'inattivita' ha il suo canale (inattivita.tsx).
import { useEffect, useRef } from 'react';
import { hashKey, useQueryClient } from '@tanstack/react-query';
import { AUTH_STATUS_QUERY_KEY } from '../shared/api/auth/auth-status';
import type { AuthStatus } from '../shared/api/auth/auth-status';
import { improntaIdentita } from '../shared/api/auth/use-auth-status';

export const CANALE_UTENTE = 'cruscotto-csr-utente';
const MESSAGGIO_UTENTE = 'utente';
const HASH_STATO_SESSIONE = hashKey(AUTH_STATUS_QUERY_KEY);

/** `attivo` falso (sessione scaduta): nessun ascolto e nessun annuncio, la cache resta vuota. */
export function useUtenteDellaSessione(attivo = true): void {
  const queryClient = useQueryClient();
  // ultima identita' vista da questa scheda: resta fra un montaggio dell'effetto e l'altro (StrictMode)
  const impronta = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!attivo) return;
    const canale = typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CANALE_UTENTE);
    const confronta = () => {
      const nuova = improntaIdentita(queryClient.getQueryData<AuthStatus>(AUTH_STATUS_QUERY_KEY));
      const precedente = impronta.current;
      if (nuova === precedente) return;
      impronta.current = nuova;
      if (precedente !== undefined) queryClient.removeQueries({ predicate: (q) => q.queryHash !== HASH_STATO_SESSIONE });
      canale?.postMessage(MESSAGGIO_UTENTE);
    };
    // lo stato gia' in cache (questa scheda si e' appena collegata), poi ogni lettura riuscita
    confronta();
    const smetti = queryClient.getQueryCache().subscribe((evento) => {
      if (evento.type === 'updated' && evento.action.type === 'success' && evento.query.queryHash === HASH_STATO_SESSIONE) confronta();
    });
    const daAltraScheda = (e: MessageEvent<unknown>) => {
      if (e.data === MESSAGGIO_UTENTE) void queryClient.invalidateQueries({ queryKey: AUTH_STATUS_QUERY_KEY });
    };
    canale?.addEventListener('message', daAltraScheda);
    return () => {
      smetti();
      canale?.removeEventListener('message', daAltraScheda);
      canale?.close();
    };
  }, [attivo, queryClient]);
}
