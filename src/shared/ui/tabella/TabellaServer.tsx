// TabellaServer — tabella del pattern interrogazione (ADR 0029): righe, ordinamento e pagina li decide il SERVER (la
// tabella non filtra, non ordina e non somma: mostra la pagina ricevuta e chiede l'ordinamento col clic
// sull'intestazione). Tabella HTML nativa come TabellaInterattiva (caption, th scope, intestazione di riga, aria-sort sui
// soli campi ordinabili), riga apribile con clic o Invio, piede con i totali del DTO di sintesi. Le righe nuove entrano
// con una dissolvenza (classe CSS, spenta da prefers-reduced-motion); le righe gia' presenti non si rianimano.
// Le colonne nascoste si possono tenere fuori (`nascoste`/`onNascoste`): la scelta sopravvive allo smontaggio della
// tabella (risultati vuoti, errore, pagina oltre l'ultima: review v2 V-03); senza, le tiene la tabella.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ariaSort, conColonna } from '../../lib/tabella';
import { gestoriRigaApribile } from './rigaApribile';
import { GLIFO_ORDINE, SceltaColonne } from './SceltaColonne';

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

/** Le colonne che partono nascoste (la scelta "Colonne" di partenza). */
export function colonneNascoste(colonne: readonly { chiave: string; nascosta?: boolean }[]): ReadonlySet<string> {
  return new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave));
}

/** aria-sort di una colonna: la funzione pura di shared/lib/tabella, con l'ordinamento del server nella sua forma. */
function ariaSortServer(ordinamento: OrdinamentoServer, campo: string | undefined): 'ascending' | 'descending' | 'none' | undefined {
  if (!campo) return undefined;
  return ariaSort({ chiave: ordinamento.campo, verso: ordinamento.verso === 'asc' ? 'crescente' : 'decrescente' }, campo);
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

function Intestazione<T>({ c, ordinamento, onOrdina }: { c: ColonnaServer<T>; ordinamento: OrdinamentoServer; onOrdina: (campo: string) => void }) {
  const sort = ariaSortServer(ordinamento, c.ordinamento);
  const campo = c.ordinamento;
  return (
    <th scope="col" className={c.numerica ? 'ui-num' : undefined} aria-sort={sort}>
      {campo && sort ? (
        <button type="button" onClick={() => onOrdina(campo)}>
          {c.titolo}
          <span aria-hidden="true">{GLIFO_ORDINE[sort]}</span>
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

/** Le colonne nascoste: proprie della tabella, oppure tenute dal chiamante (`fuori` con `onNascoste`). */
function useNascoste<T>(colonne: readonly ColonnaServer<T>[], fuori: ReadonlySet<string> | undefined, onNascoste: ((n: ReadonlySet<string>) => void) | undefined) {
  const [proprie, setProprie] = useState<ReadonlySet<string>>(() => colonneNascoste(colonne));
  const nascoste = fuori ?? proprie;
  const cambia = (chiave: string, visibile: boolean) => {
    const n = conColonna(nascoste, chiave, visibile);
    setProprie(n);
    onNascoste?.(n);
  };
  return [nascoste, cambia] as const;
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
  nascoste: nascosteFuori,
  onNascoste,
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
  /** Colonne nascoste tenute dal chiamante (con `onNascoste`); assenti = le colonne con `nascosta` della definizione. */
  nascoste?: ReadonlySet<string>;
  onNascoste?: (nascoste: ReadonlySet<string>) => void;
}) {
  const [nascoste, cambia] = useNascoste(colonne, nascosteFuori, onNascoste);
  const visibili = colonne.filter((c) => !nascoste.has(c.chiave));
  const nuove = useRigheNuove(righe.map(chiaveRiga));
  const conScelta = colonne.some((c) => !c.fissa && c.nascosta !== undefined);
  return (
    <>
      <div className="ui-strumenti">
        {strumenti}
        {conScelta && <SceltaColonne colonne={colonne} nascoste={nascoste} onCambia={cambia} />}
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
