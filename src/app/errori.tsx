// errori.tsx — indirizzo inesistente ed errori delle pagine, resi DENTRO la shell (review step9 A-01). Senza un
// ErrorBoundary React Router mostra la sua pagina d'errore predefinita: in inglese, senza testata, menu ne' piede, con il
// messaggio e lo stack dell'errore. Qui l'utente legge sempre un testo in italiano, MAI la stringa tecnica:
//  - indirizzo inesistente (route '*' o risposta 404 del router) -> "Pagina non trovata";
//  - modulo della pagina non caricato (di solito dopo un rilascio: i chunk vecchi non ci sono piu') -> ricaricare;
//  - ogni altro errore -> messaggio generico. Il dettaglio resta nella console del browser, non nella pagina.
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Esito } from './esito';

// Chrome "Failed to fetch dynamically imported module", Firefox "error loading dynamically imported module", Safari
// "Importing a module script failed", Vite "Unable to preload CSS".
const MODULO_NON_CARICATO = /dynamically imported module|module script failed|unable to preload css/i;

function moduloNonCaricato(errore: unknown): boolean {
  return errore instanceof Error && MODULO_NON_CARICATO.test(errore.message);
}

export function PaginaNonTrovata() {
  return (
    <Esito titolo="Pagina non trovata">
      <p>{"L'indirizzo richiesto non corrisponde a nessuna pagina del cruscotto: controlla di averlo scritto bene."}</p>
      <p>
        <Link className="btn btn-primary" to="/">
          Vai alla Home
        </Link>
      </p>
    </Esito>
  );
}

/** ErrorBoundary delle route: mai il messaggio ne' lo stack dell'errore nella pagina. */
export function ErroreDiPagina() {
  const errore = useRouteError();
  if (isRouteErrorResponse(errore) && errore.status === 404) return <PaginaNonTrovata />;
  if (moduloNonCaricato(errore)) {
    return (
      <Esito titolo="Pagina non disponibile">
        <p role="alert">
          {"Non è stato possibile caricare la pagina, probabilmente perché il cruscotto è stato aggiornato. Ricarica la pagina per continuare."}
        </p>
        <p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Ricarica la pagina
          </button>
        </p>
      </Esito>
    );
  }
  return (
    <Esito titolo="Errore nella pagina">
      <p role="alert">Si è verificato un errore inatteso nella pagina. Riprova più tardi o torna alla Home.</p>
      <p>
        <Link className="btn btn-primary" to="/">
          Vai alla Home
        </Link>
      </p>
    </Esito>
  );
}
