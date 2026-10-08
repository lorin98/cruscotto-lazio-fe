// inattivita.tsx — scadenza per inattivita' (NFR-41: scadenza a 30 minuti con avviso 2 minuti prima).
// La sessione vera e' quella del BFF: regge almeno 30 minuti di inattivita' (token di 15 minuti piu' 30 di estensione
// dall'ultimo rinnovo, application.properties del backend). La SPA misura l'inattivita' dell'utente e, a 2 minuti dal
// limite, apre una finestra modale (react-aria-components: focus trap e ritorno del focus) con "Resta collegato", che
// rilegge /auth/status e cosi' rinnova la sessione, ed "Esci". Al limite chiude davvero la sessione con una navigazione
// a /auth/logout del BFF (Z-03): la finestra "Sessione scaduta" non deve lasciare viva la sessione del backend.
// Le schede della stessa origine condividono la sessione: l'attivita' e la scadenza passano fra le schede con un
// BroadcastChannel, cosi' una scheda ferma non chiude la sessione su cui l'utente lavora in un'altra.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_STATUS_QUERY_KEY } from '../shared/api/auth/auth-status';
import { resolveLoginPath, resolveLogoutPath } from '../shared/config/base-path';

export const LIMITE_INATTIVITA_MS = 30 * 60 * 1000;
export const PREAVVISO_MS = 2 * 60 * 1000;
export const CANALE_INATTIVITA = 'cruscotto-csr-inattivita';
// l'attivita' locale si annuncia alle altre schede al massimo una volta in questo intervallo
const ANNUNCIO_ATTIVITA_MS = 10_000;
const EVENTI_ATTIVITA = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

type Stato = 'attivo' | 'preavviso' | 'scaduta';
type Messaggio = 'attivita' | 'scaduta';

const chiudiSessione = () => window.location.assign(resolveLogoutPath());

function apriCanale(): BroadcastChannel | undefined {
  return typeof BroadcastChannel === 'undefined' ? undefined : new BroadcastChannel(CANALE_INATTIVITA);
}

/** Stato dell'inattivita' e azione "resta collegato" (riparte il conteggio e rilegge lo stato della sessione). */
export function useInattivita(limite: number, preavviso: number, alloScadere: () => void = chiudiSessione): [Stato, () => void] {
  const [stato, setStato] = useState<Stato>('attivo');
  const statoCorrente = useRef<Stato>('attivo');
  const timer = useRef<ReturnType<typeof setTimeout>[]>([]);
  const canale = useRef<BroadcastChannel | undefined>(undefined);
  const ultimoAnnuncio = useRef(0);
  const scadere = useRef(alloScadere);
  useEffect(() => {
    scadere.current = alloScadere;
  }, [alloScadere]);
  const queryClient = useQueryClient();
  const imposta = useCallback((s: Stato) => {
    statoCorrente.current = s;
    setStato(s);
  }, []);
  const annuncia = useCallback((m: Messaggio) => canale.current?.postMessage(m), []);
  const riparti = useCallback(() => {
    timer.current.forEach(clearTimeout);
    timer.current = [
      setTimeout(() => imposta('preavviso'), limite - preavviso),
      setTimeout(() => {
        imposta('scaduta');
        annuncia('scaduta');
        scadere.current();
      }, limite),
    ];
  }, [annuncia, imposta, limite, preavviso]);
  useEffect(() => {
    canale.current = apriCanale();
    riparti();
    // l'attivita' rimanda la scadenza solo finche' l'avviso non e' aperto: da li' decide l'utente
    const attivita = () => {
      if (statoCorrente.current !== 'attivo') return;
      riparti();
      if (Date.now() - ultimoAnnuncio.current >= ANNUNCIO_ATTIVITA_MS) {
        ultimoAnnuncio.current = Date.now();
        annuncia('attivita');
      }
    };
    // un'altra scheda attiva tiene viva la sessione anche qui; se scade altrove, la sessione e' gia' chiusa
    const daAltraScheda = (e: MessageEvent<Messaggio>) => {
      if (statoCorrente.current === 'scaduta') return;
      if (e.data === 'scaduta') {
        timer.current.forEach(clearTimeout);
        imposta('scaduta');
      } else if (e.data === 'attivita') {
        imposta('attivo');
        riparti();
      }
    };
    canale.current?.addEventListener('message', daAltraScheda);
    EVENTI_ATTIVITA.forEach((e) => window.addEventListener(e, attivita, { passive: true }));
    return () => {
      timer.current.forEach(clearTimeout);
      EVENTI_ATTIVITA.forEach((e) => window.removeEventListener(e, attivita));
      canale.current?.removeEventListener('message', daAltraScheda);
      canale.current?.close();
      canale.current = undefined;
    };
  }, [annuncia, imposta, riparti]);
  const resta = () => {
    void queryClient.invalidateQueries({ queryKey: AUTH_STATUS_QUERY_KEY });
    imposta('attivo');
    riparti();
    ultimoAnnuncio.current = Date.now();
    annuncia('attivita');
  };
  return [stato, resta];
}

function minuti(ms: number): string {
  const n = Math.max(1, Math.round(ms / 60_000));
  return n === 1 ? '1 minuto' : `${n} minuti`;
}

function Preavviso({ onResta, preavviso }: { onResta: () => void; preavviso: number }) {
  return (
    <>
      <Heading slot="title" className="h5">
        La sessione sta per scadere
      </Heading>
      <p>
        Per inattività la sessione scadrà tra {minuti(preavviso)}. Vuoi restare collegato?
      </p>
      <div>
        <button type="button" className="btn btn-primary me-2" onClick={onResta} autoFocus>
          Resta collegato
        </button>
        <a className="btn btn-outline-primary" href={resolveLogoutPath()}>
          Esci
        </a>
      </div>
    </>
  );
}

function Scaduta() {
  return (
    <>
      <Heading slot="title" className="h5">
        Sessione scaduta
      </Heading>
      <p>La sessione è scaduta per inattività ed è stata chiusa: accedi di nuovo per continuare.</p>
      <a className="btn btn-primary" href={resolveLoginPath()} autoFocus>
        Accedi
      </a>
    </>
  );
}

export function AvvisoInattivita({
  limite = LIMITE_INATTIVITA_MS,
  preavviso = PREAVVISO_MS,
  alloScadere,
}: {
  limite?: number;
  preavviso?: number;
  alloScadere?: () => void;
}) {
  const [stato, resta] = useInattivita(limite, preavviso, alloScadere);
  return (
    <ModalOverlay
      isOpen={stato !== 'attivo'}
      isDismissable={false}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
      style={{ zIndex: 1050 }}
    >
      <Modal className="bg-white rounded shadow p-4 m-3" style={{ maxWidth: '32rem' }}>
        <Dialog role="alertdialog">{stato === 'preavviso' ? <Preavviso onResta={resta} preavviso={preavviso} /> : <Scaduta />}</Dialog>
      </Modal>
    </ModalOverlay>
  );
}
