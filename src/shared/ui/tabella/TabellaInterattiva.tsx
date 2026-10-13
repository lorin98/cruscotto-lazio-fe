// TabellaInterattiva — tabella del kit UI v2 (ADR 0027): ricerca, ordinamento per colonna (aria-sort), scelta delle
// colonne, paginazione, riga dei totali e righe di piede, riga apribile con clic o Invio. Tabella HTML NATIVA (caption,
// th scope, intestazioni di riga) invece della Table di react-aria: stessa semantica senza la griglia ARIA, che qui non
// serve (nessuna selezione ne' modifica di celle). La logica sta nelle funzioni pure di shared/lib/tabella.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ariaSort, conColonna, didascalia, filtraRighe, ordinaRighe, paginaDi, versoSuccessivo } from '../../lib/tabella';
import type { Ordine, ValoreOrdinabile } from '../../lib/tabella';
import { gestoriRigaApribile } from './rigaApribile';

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
  /** Parte nascosta (l'utente la mostra da "Colonne"). */
  nascosta?: boolean;
}

/** Riga di piede: un contenuto per chiave di colonna (la prima colonna e' l'intestazione di riga). */
export type RigaPiede = Partial<Record<string, ReactNode>>;

const GLIFO = { ascending: '▲', descending: '▼', none: '↕' } as const;

function SceltaColonne<T>({ colonne, nascoste, onCambia }: { colonne: ColonnaTabella<T>[]; nascoste: ReadonlySet<string>; onCambia: (chiave: string, visibile: boolean) => void }) {
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

function Intestazioni<T>({ colonne, ordine, onOrdina }: { colonne: ColonnaTabella<T>[]; ordine: Ordine; onOrdina: (chiave: string) => void }) {
  return (
    <thead>
      <tr>
        {colonne.map((c) => {
          const sort = ariaSort(ordine, c.chiave);
          return (
            <th key={c.chiave} scope="col" className={c.numerica ? 'ui-num' : undefined} aria-sort={sort}>
              <button type="button" onClick={() => onOrdina(c.chiave)}>
                {c.titolo}
                <span aria-hidden="true">{GLIFO[sort]}</span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function Riga<T>({ riga, colonne, onRiga, etichetta }: { riga: T; colonne: ColonnaTabella<T>[]; onRiga?: (r: T) => void; etichetta?: string }) {
  const apri = onRiga ? () => onRiga(riga) : undefined;
  return (
    <tr
      className={apri ? 'ui-riga' : undefined}
      tabIndex={apri ? 0 : undefined}
      aria-label={apri ? etichetta : undefined}
      {...gestoriRigaApribile(apri)}
    >
      {colonne.map((c, i) => {
        const contenuto = c.resa ? c.resa(riga) : String(c.valore(riga) ?? '');
        return i === 0 ? (
          <th key={c.chiave} scope="row">
            {contenuto}
          </th>
        ) : (
          <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
            {contenuto}
          </td>
        );
      })}
    </tr>
  );
}

function Piede<T>({ colonne, righe }: { colonne: ColonnaTabella<T>[]; righe: RigaPiede[] }) {
  if (righe.length === 0) return null;
  return (
    <tfoot>
      {righe.map((r, n) => (
        <tr key={n}>
          {colonne.map((c, i) =>
            i === 0 ? (
              <th key={c.chiave} scope="row">
                {r[c.chiave] ?? 'Totale'}
              </th>
            ) : (
              <td key={c.chiave} className={c.numerica ? 'ui-num' : undefined}>
                {r[c.chiave] ?? ''}
              </td>
            ),
          )}
        </tr>
      ))}
    </tfoot>
  );
}

function Paginazione({ pagina, pagine, onPagina }: { pagina: number; pagine: number; onPagina: (n: number) => void }) {
  if (pagine <= 1) return null;
  return (
    <nav className="ui-paginazione" aria-label="Pagine della tabella">
      <span>{`Pagina ${pagina + 1} di ${pagine}`}</span>
      {Array.from({ length: pagine }, (_, n) => (
        <button key={n} type="button" aria-current={n === pagina ? 'page' : undefined} aria-label={`Pagina ${n + 1}`} onClick={() => onPagina(n)}>
          {n + 1}
        </button>
      ))}
    </nav>
  );
}

/** Ricerca, strumenti del chiamante, scelta delle colonne; con una ricerca attiva, la nota del chiamante (X-04). */
function Strumenti<T>({
  id,
  cercato,
  onCerca,
  segnaposto,
  strumenti,
  notaRicerca,
  colonne,
  nascoste,
  onColonna,
}: {
  id: string;
  cercato: string;
  onCerca: (testo: string) => void;
  segnaposto: string;
  strumenti?: ReactNode;
  notaRicerca?: string;
  colonne: ColonnaTabella<T>[];
  nascoste: ReadonlySet<string>;
  onColonna: (chiave: string, visibile: boolean) => void;
}) {
  return (
    <>
      <div className="ui-strumenti">
        <label className="visually-hidden" htmlFor={`${id}-cerca`}>
          Cerca nella tabella
        </label>
        <input id={`${id}-cerca`} type="search" placeholder={segnaposto} value={cercato} onChange={(e) => onCerca(e.target.value)} />
        {strumenti}
        {colonne.some((c) => !c.fissa) && <SceltaColonne colonne={colonne} nascoste={nascoste} onCambia={onColonna} />}
      </div>
      {notaRicerca && cercato.trim() !== '' && <p className="ui-nota">{notaRicerca}</p>}
    </>
  );
}

interface PropsTabellaInterattiva<T> {
  caption: string;
  righe: readonly T[];
  colonne: ColonnaTabella<T>[];
  chiaveRiga: (r: T) => string;
  /** Testo su cui cerca la ricerca (es. codice e descrizione). */
  testoRicerca: (r: T) => string;
  /** Segnaposto del campo di ricerca: dice su cosa si cerca. */
  segnapostoRicerca?: string;
  /** Nota mostrata mentre la ricerca e' attiva (es. i file scaricati non la applicano: review v3 X-04). */
  notaRicerca?: string;
  onRiga?: (r: T) => void;
  etichettaRiga?: (r: T) => string;
  /** Riga dei totali, calcolata sulle righe filtrate. */
  totali?: (righe: readonly T[]) => RigaPiede;
  /** Righe di piede indipendenti dalla ricerca (es. un valore fuori tabella). */
  righePiede?: RigaPiede[];
  ordineIniziale?: Ordine;
  /** Ordine e pagina da cui ripartire (es. tornando indietro alla pagina): vince su ordineIniziale. */
  statoIniziale?: StatoTabella;
  /** Notifica di ordine e pagina a ogni loro cambio (es. per conservarli nello state della history). */
  onStato?: (stato: StatoTabella) => void;
  perPagina?: number;
  strumenti?: ReactNode;
}

/** Ordine e pagina della tabella: cio' che vale la pena ritrovare tornando alla pagina. */
export interface StatoTabella {
  ordine: Ordine;
  pagina: number;
}

export function TabellaInterattiva<T>(props: PropsTabellaInterattiva<T>) {
  const { caption, righe, colonne, chiaveRiga, testoRicerca, onRiga, etichettaRiga, totali, righePiede = [], perPagina = 10 } = props;
  const id = useId();
  const [cercato, setCercato] = useState('');
  const [ordine, setOrdine] = useState<Ordine>(props.statoIniziale?.ordine ?? props.ordineIniziale ?? { chiave: colonne[0].chiave, verso: 'crescente' });
  const [pagina, setPagina] = useState(props.statoIniziale?.pagina ?? 0);
  const notifica = useRef(props.onStato);
  notifica.current = props.onStato;
  const primo = useRef(true);
  useEffect(() => {
    // al montaggio non c'e' nulla da notificare: lo stato e' quello ricevuto
    if (primo.current) {
      primo.current = false;
      return;
    }
    notifica.current?.({ ordine, pagina });
  }, [ordine, pagina]);
  const [nascoste, setNascoste] = useState<Set<string>>(() => new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave)));

  const visibili = colonne.filter((c) => c.fissa || !nascoste.has(c.chiave));
  const filtrate = useMemo(() => filtraRighe(righe, cercato, testoRicerca), [righe, cercato, testoRicerca]);
  const ordinate = useMemo(() => ordinaRighe(filtrate, (colonne.find((c) => c.chiave === ordine.chiave) ?? colonne[0]).valore, ordine.verso), [filtrate, colonne, ordine]);
  const corrente = paginaDi(ordinate, pagina, perPagina);
  const piede = [...(totali ? [totali(filtrate)] : []), ...righePiede];
  const cerca = (testo: string) => {
    setCercato(testo);
    setPagina(0);
  };
  const ordina = (chiave: string) => {
    setOrdine((o) => versoSuccessivo(o, chiave));
    setPagina(0);
  };

  return (
    <div>
      <Strumenti
        id={id}
        cercato={cercato}
        onCerca={cerca}
        segnaposto={props.segnapostoRicerca ?? 'Cerca nella tabella'}
        strumenti={props.strumenti}
        notaRicerca={props.notaRicerca}
        colonne={colonne}
        nascoste={nascoste}
        onColonna={(chiave, visibile) => setNascoste((s) => conColonna(s, chiave, visibile))}
      />
      <div className="ui-tabella-contenitore">
        <table className="ui-tabella">
          <caption>{didascalia(caption, filtrate.length, cercato, !!onRiga)}</caption>
          <Intestazioni colonne={visibili} ordine={ordine} onOrdina={ordina} />
          <tbody>
            {corrente.righe.map((r) => (
              <Riga key={chiaveRiga(r)} riga={r} colonne={visibili} onRiga={onRiga} etichetta={etichettaRiga?.(r)} />
            ))}
          </tbody>
          <Piede colonne={visibili} righe={piede} />
        </table>
      </div>
      <Paginazione pagina={corrente.pagina} pagine={corrente.pagine} onPagina={setPagina} />
    </div>
  );
}
