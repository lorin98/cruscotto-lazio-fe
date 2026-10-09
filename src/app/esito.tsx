// esito.tsx — pagina d'esito della shell (accesso, sessione, indirizzo inesistente, errore della pagina): <main> con
// l'h1 che riceve il focus e da' il titolo alla scheda (useFocusTitolo), come le pagine delle feature.
import type { ReactNode } from 'react';
import { useFocusTitolo } from '../shared/ui';

export function Esito({ titolo, children }: { titolo: string; children: ReactNode }) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(titolo);
  return (
    <main className="ui-pagina" id="contenuto">
      <div className="ui-titolo">
        <h1 ref={h1} tabIndex={-1}>
          {titolo}
        </h1>
      </div>
      {children}
    </main>
  );
}
