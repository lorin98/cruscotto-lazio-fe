// StatiVista — i rami DISTINTI di ogni vista dati (green-fe step5, invariante #4): caricamento (role=status), attesa
// della connessione (role=status), errore (role=alert, messaggio da getErrorMessage, mai la stringa tecnica) e vuoto
// (role=status: e' informativo, non un errore, come nei wireframe approvati). Classi bootstrap-italia, niente react-aria.
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../lib';

// UI v2 (ADR 0027): il caricamento e' uno scheletro della card, con il testo per i lettori di schermo.
export function Caricamento({ testo = 'Caricamento in corso…', alto = false }: { testo?: string; alto?: boolean }) {
  return (
    <div className={alto ? 'ui-skeleton ui-skeleton--alto' : 'ui-skeleton'} role="status" aria-live="polite">
      <span className="visually-hidden">{testo}</span>
    </div>
  );
}

export function ErroreVista({ errore, onRiprova, contesto }: { errore: unknown; onRiprova?: () => void; contesto?: string }) {
  return (
    <div className="alert alert-danger my-3" role="alert">
      {contesto && <p className="mb-1">{contesto}</p>}
      <p className="mb-2">{getErrorMessage(errore)}</p>
      {onRiprova && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRiprova}>
          Riprova
        </button>
      )}
    </div>
  );
}

export function Vuoto({ children }: { children: ReactNode }) {
  return (
    <div className="alert alert-info my-3" role="status">
      {children}
    </div>
  );
}

/** Stato di una query React Query nella forma minima che serve a scegliere il ramo. */
export interface StatoQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  fetchStatus: 'fetching' | 'paused' | 'idle';
  error: unknown;
  refetch: () => unknown;
}

/** Avviso non bloccante: dati gia' mostrati ma l'ultimo aggiornamento e' fallito. */
function AggiornamentoFallito({ errore, onRiprova }: { errore: unknown; onRiprova: () => void }) {
  return (
    <div className="alert alert-warning my-2" role="status">
      <span className="me-2">{`Dati non aggiornati: ${getErrorMessage(errore)}`}</span>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={onRiprova}>
        Riprova
      </button>
    </div>
  );
}

/**
 * Sceglie il ramo della vista. Senza dati: caricamento, attesa della connessione (fetch in pausa offline), errore
 * (`errorePersonalizzato` puo' trasformare un errore atteso in un contenuto, es. il 404 della riserva) o niente se la
 * query e' disabilitata. Con dati: vuoto (se `eVuoto`) oppure i dati; un refetch fallito NON cancella i dati gia'
 * mostrati, aggiunge un avviso con "Riprova".
 */
export function VistaQuery<T>(props: {
  stato: StatoQuery<T>;
  eVuoto?: (dati: T) => boolean;
  /** Contenuto dello stato vuoto; una funzione lo calcola dai dati (es. per dire il perimetro). */
  vuoto?: ReactNode | ((dati: T) => ReactNode);
  errorePersonalizzato?: (errore: unknown) => ReactNode | null;
  children: (dati: T) => ReactNode;
}) {
  const { stato, eVuoto, vuoto, errorePersonalizzato, children } = props;
  const riprova = () => void stato.refetch();
  if (stato.data === undefined) {
    if (stato.isError) return <>{errorePersonalizzato?.(stato.error) ?? <ErroreVista errore={stato.error} onRiprova={riprova} />}</>;
    if (stato.fetchStatus === 'paused') return <Caricamento testo="In attesa della connessione…" />;
    if (stato.isPending && stato.fetchStatus === 'fetching') return <Caricamento />;
    return null;
  }
  return (
    <>
      {stato.isError && <AggiornamentoFallito errore={stato.error} onRiprova={riprova} />}
      {eVuoto?.(stato.data) ? <Vuoto>{(typeof vuoto === 'function' ? vuoto(stato.data) : vuoto) ?? 'Nessun dato per i filtri scelti. Modifica i filtri.'}</Vuoto> : children(stato.data)}
    </>
  );
}
