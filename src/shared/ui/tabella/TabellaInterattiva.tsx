// TabellaInterattiva — tabella del kit UI v2 (ADR 0027): ricerca, ordinamento per colonna (aria-sort), scelta delle
// colonne, paginazione, riga dei totali e righe di piede, riga apribile con clic o Invio. Tabella HTML NATIVA (caption,
// th scope, intestazioni di riga) invece della Table di react-aria: stessa semantica senza la griglia ARIA, che qui non
// serve (nessuna selezione ne' modifica di celle). La logica sta nelle funzioni pure di shared/lib/tabella. Per le
// tabelle larghe del procedurale (estensioni facoltative): intestazioni di gruppo con scope colgroup sopra le colonne
// dello stesso gruppo, nome esteso del bottone di un'intestazione breve, intestazione di riga in una colonna diversa
// dalla prima.
import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ariaSort, conColonna, didascalia, filtraRighe, ordinaRighe, paginaDi, versoSuccessivo } from '../../lib/tabella';
import type { Ordine, ValoreOrdinabile } from '../../lib/tabella';
import { gestoriRigaApribile } from './rigaApribile';
import { GLIFO_ORDINE, SceltaColonne } from './SceltaColonne';

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
  /** Il gruppo: le colonne consecutive dello stesso gruppo hanno sopra un'intestazione comune (scope colgroup). */
  gruppo?: string;
  /** Nome accessibile del bottone dell'intestazione quando il titolo e' breve; contiene il titolo (WCAG 2.5.3). */
  nomeEsteso?: string;
}

/** Riga di piede: un contenuto per chiave di colonna (la prima colonna e' l'intestazione di riga). */
export type RigaPiede = Partial<Record<string, ReactNode>>;

/** Le colonne visibili consecutive dello stesso gruppo: il gruppo (assente = nessuno) e quante colonne copre. */
function gruppiConsecutivi<T>(colonne: ColonnaTabella<T>[]): { gruppo?: string; colonne: number; chiave: string }[] {
  const gruppi: { gruppo?: string; colonne: number; chiave: string }[] = [];
  for (const c of colonne) {
    const ultimo = gruppi.at(-1);
    if (ultimo && ultimo.gruppo === c.gruppo) ultimo.colonne += 1;
    else gruppi.push({ gruppo: c.gruppo, colonne: 1, chiave: c.chiave });
  }
  return gruppi;
}

/** La riga delle intestazioni di gruppo (solo se una colonna visibile ha un gruppo); sopra le colonne senza gruppo, vuota. */
function RigaDeiGruppi<T>({ colonne }: { colonne: ColonnaTabella<T>[] }) {
  if (!colonne.some((c) => c.gruppo)) return null;
  return (
    <tr>
      {gruppiConsecutivi(colonne).map((g) =>
        g.gruppo ? (
          <th key={g.chiave} scope="colgroup" colSpan={g.colonne}>
            {g.gruppo}
          </th>
        ) : (
          <td key={g.chiave} colSpan={g.colonne} />
        ),
      )}
    </tr>
  );
}

function Intestazioni<T>({ colonne, ordine, onOrdina }: { colonne: ColonnaTabella<T>[]; ordine: Ordine; onOrdina: (chiave: string) => void }) {
  return (
    <thead>
      <RigaDeiGruppi colonne={colonne} />
      <tr>
        {colonne.map((c) => {
          const sort = ariaSort(ordine, c.chiave);
          return (
            <th key={c.chiave} scope="col" className={c.numerica ? 'ui-num' : undefined} aria-sort={sort}>
              <button type="button" onClick={() => onOrdina(c.chiave)} aria-label={c.nomeEsteso}>
                {c.titolo}
                <span aria-hidden="true">{GLIFO_ORDINE[sort]}</span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

/** Una cella: l'intestazione di riga (th scope=row) nella colonna `intestazione`, altrimenti un dato. */
function Cella<T>({ riga, c, intestazione }: { riga: T; c: ColonnaTabella<T>; intestazione: boolean }) {
  const contenuto = c.resa ? c.resa(riga) : String(c.valore(riga) ?? '');
  if (intestazione) return <th scope="row">{contenuto}</th>;
  return <td className={c.numerica ? 'ui-num' : undefined}>{contenuto}</td>;
}

function Riga<T>({ riga, colonne, onRiga, etichetta, intestazione }: { riga: T; colonne: ColonnaTabella<T>[]; onRiga?: (r: T) => void; etichetta?: string; intestazione: string }) {
  const apri = onRiga ? () => onRiga(riga) : undefined;
  return (
    <tr
      className={apri ? 'ui-riga' : undefined}
      tabIndex={apri ? 0 : undefined}
      aria-label={apri ? etichetta : undefined}
      {...gestoriRigaApribile(apri)}
    >
      {colonne.map((c) => (
        <Cella key={c.chiave} riga={riga} c={c} intestazione={c.chiave === intestazione} />
      ))}
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
  /** Riga dei totali (o piu' righe, es. un totale per campagna), calcolata sulle righe filtrate. */
  totali?: (righe: readonly T[]) => RigaPiede | RigaPiede[];
  /** Righe di piede indipendenti dalla ricerca (es. un valore fuori tabella). */
  righePiede?: RigaPiede[];
  ordineIniziale?: Ordine;
  /** Ricerca, ordine e pagina da cui ripartire (es. tornando indietro alla pagina): vince su ordineIniziale. */
  statoIniziale?: StatoTabella;
  /** Notifica di ricerca, ordine e pagina a ogni loro cambio fatto dall'utente (mai al montaggio). */
  onStato?: (stato: StatoTabella) => void;
  perPagina?: number;
  strumenti?: ReactNode;
  /** La chiave della colonna che fa da intestazione di riga (th scope=row); assente = la prima colonna visibile. */
  intestazioneRiga?: string;
}

/**
 * Ricerca, ordine e pagina della tabella: cio' che vale la pena ritrovare tornando alla pagina. La pagina vale per la sua
 * ricerca: ritrovarla senza la ricerca mostrerebbe altre righe (review v4 V-03).
 */
export interface StatoTabella {
  ordine: Ordine;
  pagina: number;
  /** Testo della ricerca (assente in uno stato salvato prima della ricerca: nessuna ricerca). */
  cercato?: string;
}

/**
 * Convalida di uno stato salvato fuori dal componente (es. nello state della history, che e' `unknown`): pagina intera non
 * negativa, ordine su una delle colonne `chiavi` con un verso noto, ricerca testuale se presente.
 */
export function statoTabellaValido(chiavi: readonly string[]): (v: unknown) => v is StatoTabella {
  return (v: unknown): v is StatoTabella => {
    if (typeof v !== 'object' || v === null) return false;
    const { ordine, pagina, cercato } = v as Record<string, unknown>;
    return paginaValida(pagina) && (cercato === undefined || typeof cercato === 'string') && ordineValido(ordine, chiavi);
  };
}

const paginaValida = (p: unknown) => typeof p === 'number' && Number.isInteger(p) && p >= 0;

function ordineValido(o: unknown, chiavi: readonly string[]): boolean {
  if (typeof o !== 'object' || o === null) return false;
  const { chiave, verso } = o as Record<string, unknown>;
  return typeof chiave === 'string' && chiavi.includes(chiave) && (verso === 'crescente' || verso === 'decrescente');
}

/** Ricerca, ordine e pagina di partenza: lo stato ricevuto, altrimenti l'ordine iniziale sulla prima colonna. */
function partenza<T>(props: PropsTabellaInterattiva<T>): Required<StatoTabella> {
  const s = props.statoIniziale;
  return { cercato: s?.cercato ?? '', ordine: s?.ordine ?? props.ordineIniziale ?? { chiave: props.colonne[0].chiave, verso: 'crescente' }, pagina: s?.pagina ?? 0 };
}

export function TabellaInterattiva<T>(props: PropsTabellaInterattiva<T>) {
  const { caption, righe, colonne, chiaveRiga, testoRicerca, onRiga, etichettaRiga, totali, righePiede = [], perPagina = 10, onStato } = props;
  const id = useId();
  const [iniziale] = useState(() => partenza(props));
  const [cercato, setCercato] = useState(iniziale.cercato);
  const [ordine, setOrdine] = useState<Ordine>(iniziale.ordine);
  const [pagina, setPagina] = useState(iniziale.pagina);
  const [nascoste, setNascoste] = useState<Set<string>>(() => new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave)));

  const visibili = colonne.filter((c) => c.fissa || !nascoste.has(c.chiave));
  const filtrate = useMemo(() => filtraRighe(righe, cercato, testoRicerca), [righe, cercato, testoRicerca]);
  const ordinate = useMemo(() => ordinaRighe(filtrate, (colonne.find((c) => c.chiave === ordine.chiave) ?? colonne[0]).valore, ordine.verso), [filtrate, colonne, ordine]);
  const corrente = paginaDi(ordinate, pagina, perPagina);
  const piede = [...(totali ? [totali(filtrate)].flat() : []), ...righePiede];
  // un solo punto per i cambi dell'utente: aggiorna lo stato e lo notifica (review v4 H-05: niente effetto al montaggio)
  const cambia = (prossimo: StatoTabella) => {
    setCercato(prossimo.cercato ?? '');
    setOrdine(prossimo.ordine);
    setPagina(prossimo.pagina);
    onStato?.(prossimo);
  };
  const cerca = (testo: string) => cambia({ ordine, pagina: 0, cercato: testo });
  const ordina = (chiave: string) => cambia({ ordine: versoSuccessivo(ordine, chiave), pagina: 0, cercato });
  const vaiAllaPagina = (p: number) => cambia({ ordine, pagina: p, cercato });

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
              <Riga key={chiaveRiga(r)} riga={r} colonne={visibili} onRiga={onRiga} etichetta={etichettaRiga?.(r)} intestazione={props.intestazioneRiga ?? visibili[0].chiave} />
            ))}
          </tbody>
          <Piede colonne={visibili} righe={piede} />
        </table>
      </div>
      <Paginazione pagina={corrente.pagina} pagine={corrente.pagine} onPagina={vaiAllaPagina} />
    </div>
  );
}
