// SceltaColonne — il bottone "Colonne" delle tabelle del kit (TabellaInterattiva, TabellaServer, tabelle delle schede):
// caselle delle colonne non fisse, nella stessa forma per tutte (review v1 H-08: una sola implementazione); le colonne
// con un gruppo (le sezioni del riepilogo del procedurale) stanno in un fieldset per gruppo, con la legenda del gruppo.
// Il glifo dell'ordinamento e' qui per lo stesso motivo: le due tabelle ordinabili lo leggono da aria-sort.
export interface ColonnaSceglibile {
  chiave: string;
  titolo: string;
  /** Sempre visibile (non compare nella scelta). */
  fissa?: boolean;
  /** Il gruppo della colonna: la sua casella sta nel fieldset del gruppo. */
  gruppo?: string;
}

export const GLIFO_ORDINE = { ascending: '▲', descending: '▼', none: '↕' } as const;

interface PropsCaselle {
  colonne: readonly ColonnaSceglibile[];
  nascoste: ReadonlySet<string>;
  onCambia: (chiave: string, visibile: boolean) => void;
}

function CaselleColonne({ colonne, nascoste, onCambia }: PropsCaselle) {
  return colonne.map((c) => (
    <label key={c.chiave} className="ui-opzione">
      <input type="checkbox" checked={!nascoste.has(c.chiave)} onChange={(e) => onCambia(c.chiave, e.target.checked)} />
      {c.titolo}
    </label>
  ));
}

export function SceltaColonne({ colonne, nascoste, onCambia }: PropsCaselle) {
  const sceglibili = colonne.filter((c) => !c.fissa);
  const gruppi = [...new Set(sceglibili.map((c) => c.gruppo))];
  return (
    <details className="ui-colonne">
      <summary className="btn btn-outline-secondary btn-sm">Colonne</summary>
      <fieldset className="ui-colonne__elenco">
        <legend className="visually-hidden">Colonne visibili</legend>
        {gruppi.map((g) => {
          const delGruppo = sceglibili.filter((c) => c.gruppo === g);
          if (g === undefined) return <CaselleColonne key="" colonne={delGruppo} nascoste={nascoste} onCambia={onCambia} />;
          return (
            <fieldset key={g} className="ui-colonne__gruppo">
              <legend>{g}</legend>
              <CaselleColonne colonne={delGruppo} nascoste={nascoste} onCambia={onCambia} />
            </fieldset>
          );
        })}
      </fieldset>
    </details>
  );
}
