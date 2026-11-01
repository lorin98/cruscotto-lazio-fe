// BarraFiltri — barra fissa dei filtri attivi (ADR 0027): bottone che apre il pannello, chip rimovibili, "Togli tutti",
// e a destra le informazioni sempre visibili (perimetro, ultimo dato). Generica: chip e contenuti li decide la feature.
// Togliere un chip non lascia il focus sul nulla (review v1 X-02, WCAG 2.4.3): passa al chip successivo (o al precedente
// se era l'ultimo), e senza chip al bottone dei filtri; "Togli tutti" lo porta al bottone dei filtri. Nei report col filtro
// SIGC (revisioni del 31/10/2026, R01) il controllo "Tutti | SIGC | NO SIGC" sta subito dopo il bottone dei filtri, sempre
// visibile; non e' un chip ne' lo toglie "Togli tutti" ("Tutti" e' il valore senza filtro), e col solo filtro SIGC la barra
// non dice "Nessun filtro" (review X-07). L'altezza della barra va nella variabile CSS dello scroll-padding del documento:
// lo scorrimento del focus si ferma sotto la barra anche quando va a capo (WCAG 2.4.11, review A-11).
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { sigcDaRicerca } from '../../lib';
import { Icona } from '../icona';
import { ControlloSigc } from './ControlloSigc';
import type { ControlloSigcGuidato } from './ControlloSigc';

export interface ChipFiltro {
  chiave: string;
  etichetta: string;
  valore: string;
  /** Assente = chip fisso (es. l'elemento della pagina di dettaglio): non si toglie. */
  onTogli?: () => void;
}

/** Dopo la rimozione: il bottone del chip nella stessa posizione (o l'ultimo), altrimenti il bottone dei filtri. */
function focusDopoLaRimozione(barra: HTMLElement | null, posizione: number): void {
  if (!barra) return;
  const bottoni = Array.from(barra.querySelectorAll<HTMLButtonElement>('.ui-chip button'));
  const destinazione = bottoni[Math.min(posizione, bottoni.length - 1)] ?? barra.querySelector<HTMLButtonElement>('.ui-filtri__bottone');
  destinazione?.focus();
}

function Chip({ c, onTogli }: { c: ChipFiltro; onTogli: () => void }) {
  return (
    <span className="ui-chip">
      <b>{c.etichetta}</b> {c.valore}
      {c.onTogli && (
        <button type="button" onClick={onTogli} aria-label={`Togli il filtro ${c.etichetta} ${c.valore}`}>
          <Icona nome="it-close" />
        </button>
      )}
    </span>
  );
}

function TogliTutti({ onTogli }: { onTogli: () => void }) {
  return (
    <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={onTogli}>
      Togli tutti
    </button>
  );
}

/** Il testo senza chip quando il filtro SIGC (dell'indirizzo) e' attivo: e' l'unico filtro. */
function VuotoConSigcDellIndirizzo({ vuoto }: { vuoto: string }) {
  return <TestoSenzaChip vuoto={vuoto} sigcAttivo={sigcDaRicerca(useLocation().search) !== undefined} />;
}

function TestoSenzaChip({ vuoto, sigcAttivo }: { vuoto: string; sigcAttivo: boolean }) {
  return <span className="ui-chip ui-chip--tutti">{sigcAttivo ? 'Nessun altro filtro' : vuoto}</span>;
}

/** L'altezza della barra nella variabile --ui-altezza-barra-filtri del documento (scroll-padding-top, WCAG 2.4.11). */
function useAltezzaNelDocumento(barra: { current: HTMLDivElement | null }) {
  useEffect(() => {
    const el = barra.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const radice = document.documentElement;
    const osservatore = new ResizeObserver(() => radice.style.setProperty('--ui-altezza-barra-filtri', `${Math.ceil(el.getBoundingClientRect().height)}px`));
    osservatore.observe(el);
    return () => {
      osservatore.disconnect();
      radice.style.removeProperty('--ui-altezza-barra-filtri');
    };
  }, [barra]);
}

/** Ref della barra e posizione del bottone da rifocalizzare quando i chip cambiano (null = nessuna rimozione in corso). */
function useFocusDopoLaRimozione(chip: readonly ChipFiltro[]) {
  const barra = useRef<HTMLDivElement>(null);
  const daRifocalizzare = useRef<number | null>(null);
  const firma = chip.map((c) => c.chiave).join('|');
  useEffect(() => {
    if (daRifocalizzare.current === null) return;
    focusDopoLaRimozione(barra.current, daRifocalizzare.current);
    daRifocalizzare.current = null;
  }, [firma]);
  return { barra, daRifocalizzare };
}

interface PropsBarraFiltri {
  chip: ChipFiltro[];
  /** Apre il pannello dei filtri; assente (es. senza il grant dei filtri) = niente bottone. */
  onApri?: () => void;
  onTogliTutti?: () => void;
  vuoto?: string;
  destra?: ReactNode;
  /** Il controllo del filtro SIGC (parametro `sigc` dell'indirizzo): i report che lo prendono; non i dettagli (F5). */
  filtroSigc?: boolean;
  /** Il controllo SIGC guidato dalla pagina (valore e scrittura propri, es. l'elenco operativo): implica filtroSigc. */
  controlloSigc?: ControlloSigcGuidato;
}

/** Il testo senza chip: col filtro SIGC attivo "Nessun altro filtro" (il controllo guidato o l'indirizzo lo dicono). */
function SenzaChip({ vuoto, filtroSigc, controlloSigc }: Pick<PropsBarraFiltri, 'filtroSigc' | 'controlloSigc'> & { vuoto: string }) {
  if (controlloSigc) return <TestoSenzaChip vuoto={vuoto} sigcAttivo={controlloSigc.valore !== undefined} />;
  return filtroSigc ? <VuotoConSigcDellIndirizzo vuoto={vuoto} /> : <TestoSenzaChip vuoto={vuoto} sigcAttivo={false} />;
}

/** I chip rimovibili e "Togli tutti": dopo una rimozione il focus va al chip seguente (useFocusDopoLaRimozione). */
function ChipDellaBarra({ chip, onTogliTutti, daRifocalizzare }: { chip: ChipFiltro[]; onTogliTutti?: () => void; daRifocalizzare: { current: number | null } }) {
  const rimovibili = chip.filter((c) => c.onTogli);
  return (
    <>
      {chip.map((c) => (
        <Chip
          key={c.chiave}
          c={c}
          onTogli={() => {
            daRifocalizzare.current = rimovibili.indexOf(c);
            c.onTogli?.();
          }}
        />
      ))}
      {onTogliTutti && rimovibili.length > 0 && (
        <TogliTutti
          onTogli={() => {
            daRifocalizzare.current = Number.MAX_SAFE_INTEGER;
            onTogliTutti();
          }}
        />
      )}
    </>
  );
}

export function BarraFiltri({ chip, onApri, onTogliTutti, vuoto = 'Nessun filtro: tutti i dati del perimetro', destra, filtroSigc = false, controlloSigc }: PropsBarraFiltri) {
  const { barra, daRifocalizzare } = useFocusDopoLaRimozione(chip);
  useAltezzaNelDocumento(barra);
  return (
    <div className="ui-filtri" role="region" aria-label="Filtri attivi" ref={barra}>
      {onApri && (
        <button type="button" className="btn btn-primary btn-sm ui-filtri__bottone" onClick={onApri} aria-haspopup="dialog">
          <Icona nome="it-funnel" />
          Filtri
          {chip.length > 0 && <span className="badge bg-white text-primary">{chip.length}</span>}
        </button>
      )}
      {(filtroSigc || controlloSigc) && <ControlloSigc guidato={controlloSigc} />}
      <div className="ui-filtri__chips">
        {chip.length === 0 ? (
          <SenzaChip vuoto={vuoto} filtroSigc={filtroSigc} controlloSigc={controlloSigc} />
        ) : (
          <ChipDellaBarra chip={chip} onTogliTutti={onTogliTutti} daRifocalizzare={daRifocalizzare} />
        )}
      </div>
      {destra && <div className="ui-filtri__destra">{destra}</div>}
    </div>
  );
}
