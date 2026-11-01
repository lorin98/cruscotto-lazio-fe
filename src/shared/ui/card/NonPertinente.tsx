// NonPertinente — lo stato "non pertinente" delle card di un solo tipo (revisioni del 31/10/2026, F3): con il filtro SIGC
// opposto la card resta al suo posto, col titolo, il badge "Non pertinente al filtro NO SIGC" (o SIGC) e il motivo in
// testo; il corpo e' in grigio e non interattivo, senza interruttore Grafico | Tabella e senza Scarica, e mostra il dato
// SENZA filtro (la pagina lo legge senza `sigc`). La pagina avvolge le card in <NonPertinente np={...}>: le card del kit
// (CardGrafico, Sezione, Kpi) e VistaQuery (vuoto) leggono il contesto.
// Corpo leggibile ma non attivabile (review step9 delle revisioni, J-01 e J-02): niente `inert` (toglieva le tabelle agli
// strumenti assistivi), i controlli dentro escono dalla tabulazione e diventano aria-disabled, e clic, pressioni e
// attivazioni da tastiera si fermano sul corpo. Il motivo si dice una volta: le card annidate in un corpo non pertinente
// (es. i grafici dentro la Sezione delle superfici) non lo ripetono.
import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import type { NonPertinenza } from '../../lib';

const ContestoNonPertinenza = createContext<NonPertinenza | null>(null);
/** Vero dentro un corpo non pertinente: il motivo e' gia' stato detto dalla card che lo contiene. */
const ContestoMotivoDetto = createContext(false);

/** La non pertinenza delle card intorno (null = card normali). */
export function useNonPertinenza(): NonPertinenza | null {
  return useContext(ContestoNonPertinenza);
}

/** Vero se una card che contiene questa ha gia' detto il motivo (niente badge ripetuti). */
export function useMotivoGiaDetto(): boolean {
  return useContext(ContestoMotivoDetto);
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

const ATTIVABILI = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

/** Toglie dalla tabulazione e dichiara disattivati i controlli dentro il corpo (anche quelli montati dopo). */
function disattiva(radice: HTMLElement): void {
  for (const el of radice.querySelectorAll<HTMLElement>(ATTIVABILI)) {
    if (el.getAttribute('tabindex') !== '-1') el.setAttribute('tabindex', '-1');
    if (el.getAttribute('aria-disabled') !== 'true') el.setAttribute('aria-disabled', 'true');
  }
}

/** Ferma l'evento sul corpo: clic, pressioni e attivazioni da tastiera non arrivano ai controlli. */
function ferma(e: SyntheticEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Il corpo di una card non pertinente: in grigio, leggibile dagli strumenti assistivi, non attivabile (nessun controllo
 * nella tabulazione, nessun clic o tasto che arrivi a un controllo).
 */
export function CorpoNonPertinente({ children }: { children: ReactNode }) {
  const corpo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = corpo.current;
    if (!el) return undefined;
    disattiva(el);
    const osservatore = new MutationObserver(() => disattiva(el));
    osservatore.observe(el, { childList: true, subtree: true });
    return () => osservatore.disconnect();
  }, []);
  return (
    <div
      ref={corpo}
      className="ui-non-pertinente__corpo"
      onClickCapture={ferma}
      onMouseDownCapture={ferma}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' || e.key === ' ') ferma(e);
      }}
    >
      <ContestoMotivoDetto.Provider value={true}>{children}</ContestoMotivoDetto.Provider>
    </div>
  );
}

/**
 * Un contenuto fuori dalle card del kit (es. la tabella delle voci con i link all'elenco sotto un grafico): dentro
 * <NonPertinente> diventa grigio e non attivabile come il corpo delle card, altrimenti resta com'e'.
 */
export function InerteSeNonPertinente({ children }: { children: ReactNode }) {
  const np = useNonPertinenza();
  return np ? <CorpoNonPertinente>{children}</CorpoNonPertinente> : <>{children}</>;
}

/**
 * Lo stato vuoto (o un contenuto fuori dalle card) di una lettura non pertinente: il motivo, se nessuna card intorno lo ha
 * gia' detto, e il contenuto non attivabile (es. "Modifica i filtri" non apre nulla: il filtro non c'entra). X-10 della review.
 */
export function ConMotivoSeNonPertinente({ children }: { children: ReactNode }) {
  const np = useNonPertinenza();
  const detto = useMotivoGiaDetto();
  if (!np) return <>{children}</>;
  return (
    <>
      {!detto && <MotivoNonPertinente np={np} />}
      <CorpoNonPertinente>{children}</CorpoNonPertinente>
    </>
  );
}
