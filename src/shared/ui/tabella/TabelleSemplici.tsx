// TabelleSemplici — tabelle statiche del kit (ADR 0027), sullo stesso markup accessibile: caption, intestazioni di
// colonna (th scope=col) e di riga (th scope=row), valori allineati a destra. TabellaRighe (una riga per elemento,
// colonne dichiarate), TabellaVoci (coppie voce/valore), TabellaDati (la tabella equivalente di un grafico). Le celle
// vanno a capo solo negli spazi (le assenze col motivo); gli importi non si spezzano (spazio indivisibile prima di €).
// Il contenitore scorre in orizzontale sugli schermi stretti: e' una regione con nome, raggiungibile da tastiera.
import { useId } from 'react';
import type { ReactNode } from 'react';
import type { TabellaEquivalente } from '../../lib/grafici';

/** Colonna di TabellaRighe: intestazione e cella dalla stessa voce, cosi' non si possono disallineare. */
export type Colonna<T> = [string, (riga: T) => ReactNode];

function Contenitore({ caption, children }: { caption: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="ui-tabella-contenitore" role="region" aria-labelledby={id} tabIndex={0}>
      <table className="ui-tabella ui-tabella--semplice">
        <caption id={id}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}

/** Una riga per elemento: la prima colonna (chiave) e' l'intestazione di riga, le altre sono valori a destra. */
export function TabellaRighe<T>({ caption, intestazione, chiave, colonne, righe }: { caption: string; intestazione: string; chiave: (riga: T) => string; colonne: Colonna<T>[]; righe: readonly T[] }) {
  return (
    <Contenitore caption={caption}>
      <thead>
        <tr>
          <th scope="col">{intestazione}</th>
          {colonne.map(([c]) => (
            <th key={c} scope="col" className="ui-num">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {righe.map((r, n) => (
          // la chiave della riga puo' ripetersi (stessa data, movimenti senza data): React la vuole unica
          <tr key={`${n}-${chiave(r)}`}>
            <th scope="row">{chiave(r)}</th>
            {colonne.map(([c, cella]) => (
              <td key={c} className="ui-num">
                {cella(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Contenitore>
  );
}

export interface Voce {
  etichetta: string;
  valore: ReactNode;
}

/** Coppie voce/valore (riepiloghi di un elemento). */
export function TabellaVoci({ caption, voci }: { caption: string; voci: readonly Voce[] }) {
  return (
    <Contenitore caption={caption}>
      <tbody>
        {voci.map((v) => (
          <tr key={v.etichetta}>
            <th scope="row">{v.etichetta}</th>
            <td className="ui-num">{v.valore}</td>
          </tr>
        ))}
      </tbody>
    </Contenitore>
  );
}

/** Tabella equivalente di un grafico: la prima colonna e' l'intestazione di riga, le altre sono valori. */
export function TabellaDati({ tabella }: { tabella: TabellaEquivalente }) {
  return (
    <Contenitore caption={tabella.caption}>
      <thead>
        <tr>
          {tabella.colonne.map((c, i) => (
            <th key={c} scope="col" className={i ? 'ui-num' : undefined}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tabella.righe.map((r, n) => (
          <tr key={`${n}-${r[0]}`}>
            {r.map((v, i) =>
              i === 0 ? (
                <th key={i} scope="row">
                  {v}
                </th>
              ) : (
                <td key={i} className="ui-num">
                  {v}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </Contenitore>
  );
}
