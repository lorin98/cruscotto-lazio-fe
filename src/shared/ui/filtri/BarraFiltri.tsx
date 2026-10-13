// BarraFiltri — barra fissa dei filtri attivi (ADR 0027): bottone che apre il pannello, chip rimovibili, "Togli tutti",
// e a destra le informazioni sempre visibili (perimetro, ultimo dato). Generica: chip e contenuti li decide la feature.
// Togliere un chip non lascia il focus sul nulla (review v1 X-02, WCAG 2.4.3): passa al chip successivo (o al precedente
// se era l'ultimo), e senza chip al bottone dei filtri; "Togli tutti" lo porta al bottone dei filtri.
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icona } from '../icona';

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

export function BarraFiltri({
  chip,
  onApri,
  onTogliTutti,
  vuoto = 'Nessun filtro: tutti i dati del perimetro',
  destra,
}: {
  chip: ChipFiltro[];
  /** Apre il pannello dei filtri; assente (es. senza il grant dei filtri) = niente bottone. */
  onApri?: () => void;
  onTogliTutti?: () => void;
  vuoto?: string;
  destra?: ReactNode;
}) {
  const { barra, daRifocalizzare } = useFocusDopoLaRimozione(chip);
  const rimovibili = chip.filter((c) => c.onTogli);
  return (
    <div className="ui-filtri" role="region" aria-label="Filtri attivi" ref={barra}>
      {onApri && (
        <button type="button" className="btn btn-primary btn-sm ui-filtri__bottone" onClick={onApri} aria-haspopup="dialog">
          <Icona nome="it-funnel" />
          Filtri
          {chip.length > 0 && <span className="badge bg-white text-primary">{chip.length}</span>}
        </button>
      )}
      <div className="ui-filtri__chips">
        {chip.length === 0 ? (
          <span className="ui-chip ui-chip--tutti">{vuoto}</span>
        ) : (
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
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-1"
                onClick={() => {
                  daRifocalizzare.current = Number.MAX_SAFE_INTEGER;
                  onTogliTutti();
                }}
              >
                Togli tutti
              </button>
            )}
          </>
        )}
      </div>
      {destra && <div className="ui-filtri__destra">{destra}</div>}
    </div>
  );
}
