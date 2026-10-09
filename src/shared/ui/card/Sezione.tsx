// Sezione — card del kit (ADR 0027): testa con titolo (h2 o h3), sottotitolo e strumenti, poi il contenuto. La testa e'
// la stessa di CardGrafico. Regione con il nome del titolo (aria-labelledby): i lettori di schermo la trovano per nome.
import { useId } from 'react';
import type { ReactNode } from 'react';

export function TestaCard({ id, titolo, sottotitolo, livello = 2, strumenti }: { id: string; titolo: string; sottotitolo?: string; livello?: 2 | 3; strumenti?: ReactNode }) {
  const Titolo = livello === 2 ? 'h2' : 'h3';
  return (
    <div className="ui-card__testa">
      <div>
        <Titolo id={id}>{titolo}</Titolo>
        {sottotitolo && <p>{sottotitolo}</p>}
      </div>
      {strumenti && <div className="ui-card__strumenti">{strumenti}</div>}
    </div>
  );
}

export function Sezione({ titolo, sottotitolo, livello, strumenti, children }: { titolo: string; sottotitolo?: string; livello?: 2 | 3; strumenti?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section className="ui-card ui-dissolvenza" aria-labelledby={id}>
      <TestaCard id={id} titolo={titolo} sottotitolo={sottotitolo} livello={livello} strumenti={strumenti} />
      {children}
    </section>
  );
}

/** Griglia delle card (2 colonne su schermi larghi, 4 per i KPI; una su schermi piccoli). */
export function Griglia({ colonne = 2, children }: { colonne?: 2 | 4; children: ReactNode }) {
  return <div className={`ui-griglia ui-griglia--${colonne}`}>{children}</div>;
}
