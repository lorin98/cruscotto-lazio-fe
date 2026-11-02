// NonPertinente — lo stato "non pertinente" delle card di un solo tipo (revisioni del 31/10/2026, F3): con il filtro SIGC
// opposto la card resta al suo posto, col titolo, il badge "Non pertinente al filtro NO SIGC" (o SIGC) e il motivo in
// testo; il corpo e' in grigio e non interattivo, senza interruttore Grafico | Tabella e senza Scarica, e mostra il dato
// SENZA filtro (la pagina lo legge senza `sigc`). La pagina avvolge le card in <NonPertinente np={...}>: le card del kit
// (CardGrafico, Sezione, Kpi) e VistaQuery (vuoto) leggono il contesto.
// Corpo leggibile ma non attivabile (review step9 delle revisioni, J-01, J-02 e passata 2): niente `inert` (toglieva le
// tabelle agli strumenti assistivi). Dentro il corpo i link perdono l'href (restano "link disattivati": niente clic
// centrale, menu contestuale o trascinamento), bottoni e campi diventano `disabled`, gli altri elementi focalizzabili
// escono dalla tabulazione; clic e tasti di attivazione si fermano, i gesti del puntatore e la rotella non arrivano ai
// grafici (ma il testo si seleziona e la pagina scorre). Restano attive le zone di lettura: lo scorrimento dei riquadri
// delle tabelle e la paginazione. Il motivo si dice una volta: le card annidate in un corpo non pertinente (es. i grafici
// dentro la Sezione delle superfici) non lo ripetono.
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
/**
 * Le zone di lettura che restano attive: la paginazione delle tabelle (leggere le righe oltre la prima pagina non e'
 * un'azione sul dato, review X-05) e le voci omesse dei grafici, anche delle card annidate (review M-01).
 */
const LETTURA = '.ui-paginazione, .ui-omessi';
/** Il riquadro scorrevole di una tabella: resta focalizzabile per scorrere da tastiera (axe scrollable-region-focusable). */
const RIQUADRO = '.ui-tabella-contenitore';

function imposta(el: HTMLElement, nome: string, valore: string): void {
  if (el.getAttribute(nome) !== valore) el.setAttribute(nome, valore);
}

/** Un campo o un bottone nativo: si disattiva con `disabled` (niente tasti ne' modalita' focus dei lettori di schermo). */
function nativo(el: HTMLElement): el is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
}

/** Le zone di lettura restano: la paginazione; il riquadro scorrevole a vista (nascosto alla vista non prende il focus). */
function restaDiLettura(el: HTMLElement): boolean {
  if (el.closest(LETTURA)) return true;
  if (!el.matches(RIQUADRO)) return false;
  if (el.closest('.visually-hidden')) imposta(el, 'tabindex', '-1');
  return true;
}

/** Un controllo del corpo reso non attivabile, secondo il suo tipo. */
function disattivaUno(el: HTMLElement): void {
  if (restaDiLettura(el)) return;
  if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
    // un link senza href non si apre in nessun modo; role e aria-disabled lo dicono "link disattivato"
    el.removeAttribute('href');
    imposta(el, 'role', 'link');
  }
  if (nativo(el)) {
    if (!el.disabled) el.disabled = true;
  } else {
    imposta(el, 'tabindex', '-1');
  }
  imposta(el, 'aria-disabled', 'true');
}

/** Rende non attivabili i controlli dentro il corpo, anche quelli montati o cambiati dopo (MutationObserver). */
function disattiva(radice: HTMLElement): void {
  for (const el of radice.querySelectorAll<HTMLElement>(ATTIVABILI)) disattivaUno(el);
}

/** Vero se l'evento nasce in una zona di lettura (la paginazione), che resta attiva. */
function diLettura(e: SyntheticEvent): boolean {
  return e.target instanceof Element && e.target.closest(LETTURA) !== null;
}

/** Clic e tasti di attivazione: niente azione ne' propagazione, fuori dalle zone di lettura. */
function ferma(e: SyntheticEvent): void {
  if (diLettura(e)) return;
  e.preventDefault();
  e.stopPropagation();
}

/** Puntatore e rotella: non arrivano ai controlli (es. lo zoom dei grafici), ma il testo si seleziona e la pagina scorre. */
function nonPropagare(e: SyntheticEvent): void {
  if (!diLettura(e)) e.stopPropagation();
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
    // anche gli attributi: un href o un tabindex rimessi da un nuovo render tornano disattivati (review passata 2)
    const osservatore = new MutationObserver(() => disattiva(el));
    osservatore.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'tabindex', 'disabled'] });
    return () => osservatore.disconnect();
  }, []);
  return (
    <div
      ref={corpo}
      className="ui-non-pertinente__corpo"
      onClickCapture={ferma}
      onAuxClickCapture={ferma}
      onPointerDownCapture={nonPropagare}
      onMouseDownCapture={nonPropagare}
      onWheelCapture={nonPropagare}
      // al tocco i grafici (zrender) ascoltano touchstart, touchmove e touchend: niente legenda ne' zoom (review M-03)
      onTouchStartCapture={nonPropagare}
      onTouchMoveCapture={nonPropagare}
      onTouchEndCapture={nonPropagare}
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' || e.key === ' ') ferma(e);
      }}
    >
      <ContestoMotivoDetto.Provider value={true}>{children}</ContestoMotivoDetto.Provider>
    </div>
  );
}

/** Il badge e il motivo dove nessuna card intorno li ha gia' detti (es. sopra l'errore di una lettura non pertinente). */
export function MotivoSeNonPertinente() {
  const np = useNonPertinenza();
  const detto = useMotivoGiaDetto();
  return np && !detto ? <MotivoNonPertinente np={np} /> : null;
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
