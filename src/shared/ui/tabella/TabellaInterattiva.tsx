// TabellaInterattiva — tabella del kit UI v2 (ADR 0027): ricerca, ordinamento per colonna (aria-sort), scelta delle
// colonne, paginazione, riga dei totali, riga apribile con clic o Invio. Tabella HTML nativa (caption, th scope,
// intestazioni di riga): la logica sta nelle funzioni pure di shared/lib/tabella.
import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe, ordinaRighe, paginaDi } from '../../lib/tabella';
import type { ValoreOrdinabile, Verso } from '../../lib/tabella';

export interface ColonnaTabella<T> {
  chiave: string;
  titolo: string;
  /** Valore per l'ordinamento (null in fondo). */
  valore: (r: T) => ValoreOrdinabile;
  /** Resa della cella; di default il valore come testo. */
  resa?: (r: T) => ReactNode;
  numerica?: boolean;
  /** Sempre visibile (non compare nella scelta delle colonne). */
  fissa?: boolean;
  nascosta?: boolean;
}

export function TabellaInterattiva<T>({
  caption,
  righe,
  colonne,
  chiaveRiga,
  testoRicerca,
  onRiga,
  etichettaRiga,
  totali,
  ordineIniziale,
  perPagina = 10,
  strumenti,
}: {
  caption: string;
  righe: readonly T[];
  colonne: ColonnaTabella<T>[];
  chiaveRiga: (r: T) => string;
  testoRicerca: (r: T) => string;
  onRiga?: (r: T) => void;
  etichettaRiga?: (r: T) => string;
  /** Riga dei totali (sulle righe filtrate): valore per chiave di colonna. */
  totali?: (righe: readonly T[]) => Partial<Record<string, ReactNode>>;
  ordineIniziale?: { chiave: string; verso: Verso };
  perPagina?: number;
  strumenti?: ReactNode;
}) {
  const id = useId();
  const [cercato, setCercato] = useState('');
  const [ordine, setOrdine] = useState(ordineIniziale ?? { chiave: colonne[0].chiave, verso: 'crescente' as Verso });
  const [pagina, setPagina] = useState(0);
  const [nascoste, setNascoste] = useState(() => new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave)));

  const visibili = colonne.filter((c) => c.fissa || !nascoste.has(c.chiave));
  const filtrate = useMemo(() => filtraRighe(righe, cercato, testoRicerca), [righe, cercato, testoRicerca]);
  const ordinate = useMemo(() => {
    const col = colonne.find((c) => c.chiave === ordine.chiave) ?? colonne[0];
    return ordinaRighe(filtrate, col.valore, ordine.verso);
  }, [filtrate, colonne, ordine]);
  const corrente = paginaDi(ordinate, pagina, perPagina);
  const somme = totali?.(filtrate);

  const ordinaPer = (chiave: string) => {
    setOrdine((o) => (o.chiave === chiave ? { chiave, verso: o.verso === 'crescente' ? 'decrescente' : 'crescente' } : { chiave, verso: 'decrescente' }));
    setPagina(0);
  };
  const cella = (c: ColonnaTabella<T>, r: T) => (c.resa ? c.resa(r) : String(c.valore(r) ?? ''));

  return (
    <div>
      <div className="ui-strumenti">
        <label className="visually-hidden" htmlFor={`${id}-cerca`}>
          Cerca nella tabella
        </label>
        <input
          id={`${id}-cerca`}
          type="search"
          placeholder="Cerca per codice o descrizione"
          value={cercato}
          onChange={(e) => {
            setCercato(e.target.value);
            setPagina(0);
          }}
        />
        {strumenti}
        {colonne.some((c) => !c.fissa) && (
          <details className="ui-colonne">
            <summary className="btn btn-outline-secondary btn-sm">Colonne</summary>
            <fieldset className="ui-colonne__elenco">
              <legend className="visually-hidden">Colonne visibili</legend>
              {colonne
                .filter((c) => !c.fissa)
                .map((c) => (
                  <label key={c.chiave} className="ui-opzione">
                    <input
                      type="checkbox"
                      checked={!nascoste.has(c.chiave)}
                      onChange={(e) =>
                        setNascoste((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.delete(c.chiave);
                          else n.add(c.chiave);
                          return n;
                        })
                      }
                    />
                    {c.titolo}
                  </label>
                ))}
            </fieldset>
          </details>
        )}
      </div>
      <div className="ui-tabella-contenitore">
        <table className="ui-tabella">
          <caption>{`${caption}: ${filtrate.length === 1 ? '1 riga' : `${filtrate.length} righe`}${cercato.trim() ? ` per «${cercato.trim()}»` : ''}.${onRiga ? ' Clic o Invio su una riga per aprirla.' : ''}`}</caption>
          <thead>
            <tr>
              {visibili.map((c) => {
                const attiva = ordine.chiave === c.chiave;
                return (
                  <th key={c.chiave} scope="col" className={c.numerica ? 'ui-num' : undefined} aria-sort={attiva ? (ordine.verso === 'crescente' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => ordinaPer(c.chiave)}>
                      {c.titolo}
                      <span aria-hidden="true">{attiva ? (ordine.verso === 'crescente' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {corrente.righe.map((r) => (
              <tr
                key={chiaveRiga(r)}
                className={onRiga ? 'ui-riga' : undefined}
                tabIndex={onRiga ? 0 : undefined}
                aria-label={onRiga && etichettaRiga ? etichettaRiga(r) : undefined}
                onClick={onRiga ? () => onRiga(r) : undefined}
                onKeyDown={
                  onRiga
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRiga(r);
                        }
                      }
                    : undefined
                }
              >
                {visibili.map((c, i) =>
                  i === 0 ? (
                    <th key={c.chiave} scope="row">
                      {cella(c, r)}
                    </th>
                  ) : (
                    <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
                      {cella(c, r)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
          {somme && (
            <tfoot>
              <tr>
                {visibili.map((c, i) =>
                  i === 0 ? (
                    <th key={c.chiave} scope="row">
                      {somme[c.chiave] ?? 'Totale'}
                    </th>
                  ) : (
                    <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
                      {somme[c.chiave] ?? ''}
                    </td>
                  ),
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {corrente.pagine > 1 && (
        <nav className="ui-paginazione" aria-label="Pagine della tabella">
          <span>{`Pagina ${corrente.pagina + 1} di ${corrente.pagine}`}</span>
          {Array.from({ length: corrente.pagine }, (_, n) => (
            <button key={n} type="button" aria-current={n === corrente.pagina ? 'page' : undefined} aria-label={`Pagina ${n + 1}`} onClick={() => setPagina(n)}>
              {n + 1}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
