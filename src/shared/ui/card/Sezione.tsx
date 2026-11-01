// Sezione — card del kit (ADR 0027): testa con titolo (h2 o h3), sottotitolo e strumenti, poi il contenuto. La testa e'
// la stessa di CardGrafico. Regione con il nome del titolo (aria-labelledby): i lettori di schermo la trovano per nome.
// Dentro <NonPertinente> (filtro SIGC opposto, F3) la testa dice il motivo, gli strumenti spariscono e il contenuto e' in
// grigio e inerte.
import { useId } from 'react';
import type { ReactNode } from 'react';
import { CorpoNonPertinente, MotivoNonPertinente, useNonPertinenza } from './NonPertinente';

export function TestaCard({ id, titolo, sottotitolo, livello = 2, strumenti }: { id: string; titolo: string; sottotitolo?: string; livello?: 2 | 3; strumenti?: ReactNode }) {
  const Titolo = livello === 2 ? 'h2' : 'h3';
  const np = useNonPertinenza();
  return (
    <div className="ui-card__testa">
      <div>
        <Titolo id={id}>{titolo}</Titolo>
        {sottotitolo && <p>{sottotitolo}</p>}
        {np && <MotivoNonPertinente np={np} />}
      </div>
      {strumenti && !np && <div className="ui-card__strumenti">{strumenti}</div>}
    </div>
  );
}

export function Sezione({ titolo, sottotitolo, livello, strumenti, children }: { titolo: string; sottotitolo?: string; livello?: 2 | 3; strumenti?: ReactNode; children: ReactNode }) {
  const id = useId();
  const np = useNonPertinenza();
  return (
    <section className="ui-card ui-dissolvenza" aria-labelledby={id} data-non-pertinente={np ? '' : undefined}>
      <TestaCard id={id} titolo={titolo} sottotitolo={sottotitolo} livello={livello} strumenti={strumenti} />
      {np ? <CorpoNonPertinente>{children}</CorpoNonPertinente> : children}
    </section>
  );
}

/**
 * Griglia delle card (2 colonne su schermi larghi, 4 per i KPI; una su schermi piccoli). Con 3: sei tessere 3 x 2 a coppie
 * per colonna (l'ordine del DOM e' per colonna), 2 colonne a coppie per riga sotto 900 px, una sotto 576 px (R03).
 */
export function Griglia({ colonne = 2, children }: { colonne?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`ui-griglia ui-griglia--${colonne}`}>{children}</div>;
}
