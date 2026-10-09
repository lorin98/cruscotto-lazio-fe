// AvvisoPagina — un solo avviso d'errore per pagina (review v2 A-07). Le viste dati dentro <AvvisoPagina> non mostrano
// ognuna il suo alert con "Riprova": registrano qui l'errore e nella sezione resta un testo statico. La pagina dice una
// volta i messaggi distinti e quante sezioni non si sono caricate, con un "Riprova" che rilegge tutte le sezioni in
// errore. Fuori da AvvisoPagina VistaQuery mostra l'errore nella sezione, come prima.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getErrorMessage } from '../../lib';

interface ErroreSezione {
  messaggio: string;
  riprova: () => void;
}

type Segnala = (id: string, errore: ErroreSezione | null) => void;

const ContestoAvviso = createContext<Segnala | null>(null);

export function AvvisoPagina({ children }: { children: ReactNode }) {
  const [errori, setErrori] = useState<ReadonlyMap<string, ErroreSezione>>(new Map());
  const segnala = useCallback<Segnala>((id, errore) => {
    setErrori((prima) => {
      if (errore === null && !prima.has(id)) return prima;
      const dopo = new Map(prima);
      if (errore === null) dopo.delete(id);
      else dopo.set(id, errore);
      return dopo;
    });
  }, []);
  const messaggi = [...new Set([...errori.values()].map((e) => e.messaggio))];
  return (
    <ContestoAvviso.Provider value={segnala}>
      {errori.size > 0 && (
        <div className="alert alert-danger my-3" role="alert">
          {messaggi.map((m) => (
            <p key={m} className="mb-1">
              {m}
            </p>
          ))}
          <p className="mb-2">{errori.size === 1 ? 'Una sezione della pagina non si è caricata.' : `${errori.size} sezioni della pagina non si sono caricate.`}</p>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => errori.forEach((e) => e.riprova())}>
            Riprova
          </button>
        </div>
      )}
      {children}
    </ContestoAvviso.Provider>
  );
}

/**
 * Registra nell'avviso della pagina l'errore di una vista (`inErrore`), finche' dura; true se la vista sta dentro
 * <AvvisoPagina> e deve mostrare solo il testo statico. La registrazione cambia solo col messaggio; "Riprova" chiama
 * l'ultimo `riprova` ricevuto.
 */
export function useErroreNellaPagina(inErrore: boolean, errore: unknown, riprova: () => unknown): boolean {
  const segnala = useContext(ContestoAvviso);
  const id = useId();
  const ultimoRiprova = useRef(riprova);
  const messaggio = inErrore ? getErrorMessage(errore) : null;
  useEffect(() => {
    ultimoRiprova.current = riprova;
  });
  useEffect(() => {
    if (!segnala) return undefined;
    segnala(id, messaggio === null ? null : { messaggio, riprova: () => void ultimoRiprova.current() });
    return () => segnala(id, null);
  }, [segnala, id, messaggio]);
  return segnala !== null;
}

/** Il posto dell'errore nella sezione, quando l'avviso e' della pagina: testo statico, niente role=alert. */
export function ErroreNellaPagina() {
  return <p className="small mb-0">{"Dati non caricati: l'avviso in cima alla pagina dice il motivo e permette di riprovare."}</p>;
}
