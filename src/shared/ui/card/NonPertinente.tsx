// NonPertinente — lo stato "non pertinente" delle card di un solo tipo (revisioni del 31/10/2026, F3): con il filtro SIGC
// opposto la card resta al suo posto, col titolo, il badge "Non pertinente al filtro NO SIGC" (o SIGC) e il motivo in
// testo; il corpo e' in grigio e non interattivo (inert), senza interruttore Grafico | Tabella e senza Scarica, e mostra il
// dato SENZA filtro (la pagina lo legge senza `sigc`). La pagina avvolge le card in <NonPertinente np={...}>: le card del
// kit (CardGrafico, Sezione, Kpi) leggono il contesto. La tabella equivalente di un grafico resta leggibile dagli strumenti
// assistivi (fuori dal corpo inerte, nascosta alla vista).
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { NonPertinenza } from '../../lib';

const ContestoNonPertinenza = createContext<NonPertinenza | null>(null);

/** La non pertinenza delle card intorno (null = card normali). */
export function useNonPertinenza(): NonPertinenza | null {
  return useContext(ContestoNonPertinenza);
}

/** Le card dentro sono non pertinenti quando `np` c'e'; con null restano normali (stesso albero: niente rimontaggi). */
export function NonPertinente({ np, children }: { np: NonPertinenza | null; children: ReactNode }) {
  return <ContestoNonPertinenza.Provider value={np}>{children}</ContestoNonPertinenza.Provider>;
}

/** Il badge e il motivo, sotto il titolo della card. */
export function MotivoNonPertinente({ np }: { np: NonPertinenza }) {
  return (
    <p className="ui-non-pertinente__motivo">
      <span className="badge ui-badge-np">{`Non pertinente al filtro ${np.filtro}`}</span>
      <span>{`${np.motivo}: con il filtro ${np.filtro} non si applica. I dati sono quelli senza filtro.`}</span>
    </p>
  );
}

/** Il corpo di una card non pertinente: in grigio e inerte (niente focus, clic, selezione). */
export function CorpoNonPertinente({ children }: { children: ReactNode }) {
  return (
    <div className="ui-non-pertinente__corpo" inert>
      {children}
    </div>
  );
}

/**
 * Un contenuto fuori dalle card del kit (es. la tabella delle voci con i link all'elenco sotto un grafico): dentro
 * <NonPertinente> diventa grigio e inerte come il corpo delle card, altrimenti resta com'e'.
 */
export function InerteSeNonPertinente({ children }: { children: ReactNode }) {
  const np = useNonPertinenza();
  return np ? <CorpoNonPertinente>{children}</CorpoNonPertinente> : <>{children}</>;
}
