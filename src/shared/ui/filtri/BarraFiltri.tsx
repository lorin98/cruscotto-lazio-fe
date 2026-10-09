// BarraFiltri — barra fissa dei filtri attivi (ADR 0027): bottone che apre il pannello, chip rimovibili, "Togli tutti",
// e a destra le informazioni sempre visibili (perimetro, ultimo dato). Generica: chip e contenuti li decide la feature.
import type { ReactNode } from 'react';
import { Icona } from '../icona';

export interface ChipFiltro {
  chiave: string;
  etichetta: string;
  valore: string;
  /** Assente = chip fisso (es. l'elemento della pagina di dettaglio): non si toglie. */
  onTogli?: () => void;
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
  return (
    <div className="ui-filtri" role="region" aria-label="Filtri attivi">
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
              <span key={c.chiave} className="ui-chip">
                <b>{c.etichetta}</b> {c.valore}
                {c.onTogli && (
                  <button type="button" onClick={c.onTogli} aria-label={`Togli il filtro ${c.etichetta} ${c.valore}`}>
                    <Icona nome="it-close" />
                  </button>
                )}
              </span>
            ))}
            {onTogliTutti && chip.some((c) => c.onTogli) && (
              <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={onTogliTutti}>
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
