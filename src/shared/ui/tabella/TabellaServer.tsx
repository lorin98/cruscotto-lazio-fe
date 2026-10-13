// TabellaServer — tabella del pattern interrogazione (ADR 0029): righe, ordinamento e pagina li decide il SERVER (la
// tabella non filtra, non ordina e non somma: mostra la pagina ricevuta e chiede l'ordinamento col clic
// sull'intestazione). Tabella HTML nativa come TabellaInterattiva (caption, th scope, intestazione di riga, aria-sort sui
// soli campi ordinabili), riga apribile con clic o Invio, piede con i totali del DTO di sintesi. Le righe nuove entrano
// con una dissolvenza (classe CSS, spenta da prefers-reduced-motion); le righe gia' presenti non si rianimano.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { conColonna } from '../../lib/tabella';
import { gestoriRigaApribile } from './rigaApribile';

export interface ColonnaServer<T> {
  chiave: string;
  titolo: string;
  resa: (r: T) => ReactNode;
  numerica?: boolean;
  /** Campo dell'ordinamento lato server; assente = colonna non ordinabile (niente bottone). */
  ordinamento?: string;
  /** Sempre visibile (non compare nella scelta delle colonne). */
  fissa?: boolean;
  /** Parte nascosta (l'utente la mostra da "Colonne"). */
  nascosta?: boolean;
}

export interface OrdinamentoServer {
  campo: string;
  verso: 'asc' | 'desc';
}

const GLIFO = { ascending: '▲', descending: '▼', none: '↕' } as const;

function ariaSort(ordinamento: OrdinamentoServer, campo: string | undefined): 'ascending' | 'descending' | 'none' | undefined {
  if (!campo) return undefined;
  if (ordinamento.campo !== campo) return 'none';
  return ordinamento.verso === 'asc' ? 'ascending' : 'descending';
}

/** Chiavi delle righe nuove rispetto alla pagina precedente (vuoto alla prima pagina: entra tutta la sezione). */
function useRigheNuove(chiavi: readonly string[]): ReadonlySet<string> {
  const firma = chiavi.join('|');
  const [stato, setStato] = useState<{ firma: string | null; nuove: ReadonlySet<string> }>({ firma: null, nuove: new Set() });
  if (stato.firma !== firma) {
    const vecchie = new Set(stato.firma ? stato.firma.split('|') : []);
    setStato({ firma, nuove: stato.firma === null ? new Set() : new Set(chiavi.filter((k) => !vecchie.has(k))) });
  }
  return stato.nuove;
}

function SceltaColonne<T>({ colonne, nascoste, onCambia }: { colonne: ColonnaServer<T>[]; nascoste: ReadonlySet<string>; onCambia: (chiave: string, visibile: boolean) => void }) {
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

function Intestazione<T>({ c, ordinamento, onOrdina }: { c: ColonnaServer<T>; ordinamento: OrdinamentoServer; onOrdina: (campo: string) => void }) {
  const sort = ariaSort(ordinamento, c.ordinamento);
  const campo = c.ordinamento;
  return (
    <th scope="col" className={c.numerica ? 'ui-num' : undefined} aria-sort={sort}>
      {campo && sort ? (
        <button type="button" onClick={() => onOrdina(campo)}>
          {c.titolo}
          <span aria-hidden="true">{GLIFO[sort]}</span>
        </button>
      ) : (
        c.titolo
      )}
    </th>
  );
}

function Riga<T>({ riga, colonne, nuova, onRiga, etichetta }: { riga: T; colonne: ColonnaServer<T>[]; nuova: boolean; onRiga?: (r: T) => void; etichetta?: string }) {
  const apri = onRiga ? () => onRiga(riga) : undefined;
  const classi = [apri ? 'ui-riga' : '', nuova ? 'ui-riga--nuova' : ''].filter(Boolean).join(' ') || undefined;
  return (
    <tr
      className={classi}
      tabIndex={apri ? 0 : undefined}
      aria-label={apri ? etichetta : undefined}
      {...gestoriRigaApribile(apri)}
    >
      {colonne.map((c, k) =>
        k === 0 ? (
          <th key={c.chiave} scope="row" className={c.numerica ? 'ui-num' : undefined}>
            {c.resa(riga)}
          </th>
        ) : (
          <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
            {c.resa(riga)}
          </td>
        ),
      )}
    </tr>
  );
}

function Piede<T>({ colonne, piede }: { colonne: ColonnaServer<T>[]; piede: Partial<Record<string, ReactNode>> }) {
  return (
    <tfoot>
      <tr className="ui-totali">
        {colonne.map((c, k) =>
          k === 0 ? (
            <th key={c.chiave} scope="row">
              {piede[c.chiave]}
            </th>
          ) : (
            <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
              {piede[c.chiave]}
            </td>
          ),
        )}
      </tr>
    </tfoot>
  );
}

export function TabellaServer<T>({
  caption,
  colonne,
  righe,
  chiaveRiga,
  ordinamento,
  onOrdina,
  onRiga,
  etichettaRiga,
  piede,
  strumenti,
}: {
  caption: string;
  colonne: ColonnaServer<T>[];
  righe: readonly T[];
  chiaveRiga: (r: T) => string;
  ordinamento: OrdinamentoServer;
  onOrdina: (campo: string) => void;
  onRiga?: (r: T) => void;
  etichettaRiga?: (r: T) => string;
  /** Riga dei totali dal server: un contenuto per chiave di colonna (la prima colonna e' l'intestazione di riga). */
  piede?: Partial<Record<string, ReactNode>>;
  strumenti?: ReactNode;
}) {
  const [nascoste, setNascoste] = useState<ReadonlySet<string>>(() => new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave)));
  const visibili = colonne.filter((c) => !nascoste.has(c.chiave));
  const nuove = useRigheNuove(righe.map(chiaveRiga));
  const conScelta = colonne.some((c) => !c.fissa && c.nascosta !== undefined);
  return (
    <>
      <div className="ui-strumenti">
        {strumenti}
        {conScelta && <SceltaColonne colonne={colonne} nascoste={nascoste} onCambia={(k, v) => setNascoste((n) => conColonna(n, k, v))} />}
      </div>
      <div className="ui-tabella-contenitore">
        <table className="ui-tabella">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {visibili.map((c) => (
                <Intestazione key={c.chiave} c={c} ordinamento={ordinamento} onOrdina={onOrdina} />
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => {
              const k = chiaveRiga(r);
              return <Riga key={k} riga={r} colonne={visibili} nuova={nuove.has(k)} onRiga={onRiga} etichetta={etichettaRiga?.(r)} />;
            })}
          </tbody>
          {piede && <Piede colonne={visibili} piede={piede} />}
        </table>
      </div>
    </>
  );
}
