// ApriNellElenco — il link di drill-down verso l'elenco operativo (pagine delle domande e dei pagamenti), uguale da ogni
// report che ci porta: il finanziario (D-2 di MIN-20261012) e l'istituzionale (OP-IS-09, link tenuti dall'utente il
// 22/10/2026). Prima stava nel finanziario; l'indirizzo e la visibilita' per grant li decide chi lo usa (gate di UX: il
// backend ridecide). Dentro una riga apribile e' la riga a ignorare i clic e i tasti nati dal link
// (shared/ui/tabella/rigaApribile): il link non ferma la propagazione, cosi' Esc e il focus trap del pannello che lo
// contiene continuano a funzionare. Link di react-router con le classi del kit (bersaglio di almeno 24 px).
import { Link } from 'react-router';

/**
 * Link "Apri nell'elenco": `descrizione` completa il nome accessibile ("Apri nell'elenco operativo le domande ...");
 * `testo` sostituisce l'etichetta visibile (es. "Apri nei pagamenti") e apre il nome accessibile, che contiene sempre il
 * testo visibile (WCAG 2.5.3). Senza indirizzo non rende nulla.
 */
export function ApriNellElenco({ indirizzo, descrizione, testo, variante = 'pulsante' }: { indirizzo: string | null; descrizione: string; testo?: string; variante?: 'pulsante' | 'testo' }) {
  if (!indirizzo) return null;
  const nome = testo ? `${testo}: apri nell'elenco operativo ${descrizione}` : `Apri nell'elenco operativo ${descrizione}`;
  return (
    <Link className={variante === 'pulsante' ? 'btn btn-outline-primary btn-sm' : 'ui-link-elenco'} to={indirizzo} aria-label={nome}>
      {testo ?? "Apri nell'elenco"}
    </Link>
  );
}
