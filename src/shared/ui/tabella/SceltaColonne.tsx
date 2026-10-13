// SceltaColonne — il bottone "Colonne" delle tabelle del kit (TabellaInterattiva, TabellaServer, tabelle delle schede):
// caselle delle colonne non fisse, nella stessa forma per tutte (review v1 H-08: una sola implementazione). Il glifo
// dell'ordinamento e' qui per lo stesso motivo: le due tabelle ordinabili lo leggono da aria-sort.
export interface ColonnaSceglibile {
  chiave: string;
  titolo: string;
  /** Sempre visibile (non compare nella scelta). */
  fissa?: boolean;
}

export const GLIFO_ORDINE = { ascending: '▲', descending: '▼', none: '↕' } as const;

export function SceltaColonne({ colonne, nascoste, onCambia }: { colonne: readonly ColonnaSceglibile[]; nascoste: ReadonlySet<string>; onCambia: (chiave: string, visibile: boolean) => void }) {
  return (
    <details className="ui-colonne">
      <summary className="btn btn-outline-secondary btn-sm">Colonne</summary>
      <fieldset className="ui-colonne__elenco">
        <legend className="visually-hidden">Colonne visibili</legend>
        {colonne
          .filter((c) => !c.fissa)
          .map((c) => (
            <label key={c.chiave} className="ui-opzione">
              <input type="checkbox" checked={!nascoste.has(c.chiave)} onChange={(e) => onCambia(c.chiave, e.target.checked)} />
              {c.titolo}
            </label>
          ))}
      </fieldset>
    </details>
  );
}
