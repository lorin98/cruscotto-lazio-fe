// StatiVista — i rami DISTINTI di ogni vista dati (green-fe step5, invariante #4): caricamento (role=status), attesa
// della connessione (role=status), errore (role=alert, messaggio da getErrorMessage, mai la stringa tecnica) e vuoto
// (role=status: e' informativo, non un errore, come nei wireframe approvati). Classi bootstrap-italia, niente react-aria.
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../lib';
import { ErroreNellaPagina, useErroreNellaPagina } from './AvvisoPagina';

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

const TESTO_AGGIORNAMENTO = 'Aggiornamento dei risultati: restano visibili quelli precedenti finché arrivano i nuovi.';

/**
 * I dati di prima restano mentre se ne leggono di nuovi (ADR 0029; prima nell'elenco operativo, ora anche nel dettaglio
 * dell'istituzionale): regione role=status sempre montata, cambia solo il testo (una regione live inserita gia' piena
 * non si annuncia: review v1 X-08 dell'elenco). Va accanto al contenitore `ui-risultati` con aria-busy.
 */
export function AvvisoAggiornamento({ attivo, testo = TESTO_AGGIORNAMENTO }: { attivo: boolean; testo?: string }) {
  return (
    <p className={attivo ? 'ui-aggiornamento' : 'visually-hidden'} role="status">
      {attivo ? testo : ''}
    </p>
  );
}

/**
 * Il contenuto di uno stato vuoto che dipende dai filtri: il testo e "Modifica i filtri", che apre il pannello della
 * pagina (prima nel fisico; lo usa anche l'istituzionale). Va dentro Vuoto (o nel `vuoto` di VistaQuery).
 */
export function VuotoConFiltri({ children, onModifica }: { children: ReactNode; onModifica: () => void }) {
  return (
    <>
      <span>{children}</span>
      <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={onModifica}>
        Modifica i filtri
      </button>
    </>
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

/** Senza dati: errore (personalizzato, nella pagina o qui), attesa della connessione, caricamento, o niente (disabilitata). */
function RamoSenzaDati({ stato, personalizzato, nellaPagina }: { stato: StatoQuery<unknown>; personalizzato: ReactNode; nellaPagina: boolean }) {
  if (stato.isError) return <>{personalizzato ?? (nellaPagina ? <ErroreNellaPagina /> : <ErroreVista errore={stato.error} onRiprova={() => void stato.refetch()} />)}</>;
  if (stato.fetchStatus === 'paused') return <Caricamento testo="In attesa della connessione…" />;
  if (stato.isPending && stato.fetchStatus === 'fetching') return <Caricamento />;
  return null;
}

/** Contenuto dello stato vuoto: quello del chiamante (anche calcolato dai dati), altrimenti il testo generico. */
function contenutoVuoto<T>(vuoto: ReactNode | ((dati: T) => ReactNode), dati: T): ReactNode {
  return (typeof vuoto === 'function' ? vuoto(dati) : vuoto) ?? 'Nessun dato da mostrare.';
}

interface PropsVistaQuery<T> {
  stato: StatoQuery<T>;
  eVuoto?: (dati: T) => boolean;
  /** Contenuto dello stato vuoto; una funzione lo calcola dai dati (es. per dire il perimetro). */
  vuoto?: ReactNode | ((dati: T) => ReactNode);
  errorePersonalizzato?: (errore: unknown) => ReactNode | null;
  /** In attesa di un'informazione esterna (es. il segnale di vuoto della selezione): si mostra il caricamento. */
  inAttesa?: boolean;
  children: (dati: T) => ReactNode;
}

/**
 * Sceglie il ramo della vista. Senza dati: caricamento, attesa della connessione (fetch in pausa offline), errore
 * (`errorePersonalizzato` puo' trasformare un errore atteso in un contenuto, es. il 404 della riserva) o niente se la
 * query e' disabilitata. Con dati: vuoto (se `eVuoto`) oppure i dati; un refetch fallito NON cancella i dati gia'
 * mostrati, aggiunge un avviso con "Riprova". Dentro <AvvisoPagina> l'errore senza dati lo dice la pagina, una volta.
 */
/** L'errore senza dati: il contenuto personalizzato del chiamante, oppure se lo dice la pagina (una volta per pagina). */
function useErroreSenzaDati<T>(stato: StatoQuery<T>, errorePersonalizzato: PropsVistaQuery<T>['errorePersonalizzato']) {
  const senzaDati = stato.data === undefined && stato.isError;
  const personalizzato = senzaDati ? errorePersonalizzato?.(stato.error) : undefined;
  const nellaPagina = useErroreNellaPagina(senzaDati && personalizzato == null, stato.error, stato.refetch);
  return { personalizzato, nellaPagina };
}

export function VistaQuery<T>({ stato, eVuoto, vuoto, errorePersonalizzato, inAttesa, children }: PropsVistaQuery<T>) {
  const { personalizzato, nellaPagina } = useErroreSenzaDati(stato, errorePersonalizzato);
  if (inAttesa && !stato.isError) return <Caricamento />;
  const dati = stato.data;
  if (dati === undefined) return <RamoSenzaDati stato={stato} personalizzato={personalizzato} nellaPagina={nellaPagina} />;
  return (
    <>
      {stato.isError && <AggiornamentoFallito errore={stato.error} onRiprova={() => void stato.refetch()} />}
      {eVuoto?.(dati) ? <Vuoto>{contenutoVuoto(vuoto, dati)}</Vuoto> : children(dati)}
    </>
  );
}
