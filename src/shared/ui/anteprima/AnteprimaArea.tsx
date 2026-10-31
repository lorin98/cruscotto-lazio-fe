// AnteprimaArea — i pezzi della card di un'area nella Home (kit v2, senza dominio): il gruppo con nome dei numeri chiave,
// il riferimento dei numeri (campagna, file), i numeri come lista di definizioni col valore animato oppure "non
// disponibile" col motivo, la barra di avanzamento a passi del 5 % con il valore nel testo, lo scheletro di una lettura e
// la frase di un dato che manca. Prima dentro la card del finanziario; dal 26/10/2026 (decisione dell'utente) li usano
// anche le card di fisico, procedurale e istituzionale. Dal 31/10/2026 (rework 2 della card istituzionale, scelta
// dell'utente) anche la tabella a confronto: le stesse righe lette da piu' fonti indipendenti, una colonna per fonte.
// Classi ui-ambito__* di tema.css, nessuno stile inline (CSP).
import type { ReactNode } from 'react';
import { NON_DISPONIBILE, formatPercentuale, numeroDi } from '../../lib';
import { NumeroAnimato } from '../animazione/NumeroAnimato';

/** Il gruppo dei numeri chiave dell'area, col nome accessibile ("Il fisico in cifre"). */
export function AnteprimaArea({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="ui-ambito__anteprima" aria-label={nome} role="group">
      {children}
    </div>
  );
}

/** A cosa si riferiscono i numeri che seguono (la campagna, il file da cui vengono). */
export function RiferimentoArea({ children }: { children: ReactNode }) {
  return <p className="ui-ambito__riferimento">{children}</p>;
}

export function NumeriArea({ children }: { children: ReactNode }) {
  return <dl className="ui-ambito__numeri">{children}</dl>;
}

interface PropsNumero {
  etichetta: string;
  /** Cosa vuol dire l'etichetta, per i lettori di schermo (le sigle sciolte). */
  spiegazione?: string;
  /** Il valore; null o assente = non disponibile. */
  valore: number | null | undefined;
  formato: (v: number) => string;
  /** Perche' il valore manca, sotto "non disponibile". */
  motivo?: string;
  /** Una precisazione sul valore presente (per esempio cosa non comprende), sotto il numero. */
  nota?: string;
}

/** Un numero chiave: l'etichetta e il valore animato (con la sua nota), oppure "non disponibile" col motivo (mai uno zero). */
export function NumeroArea({ etichetta, spiegazione, valore, formato, motivo, nota }: PropsNumero) {
  const presente = numeroDi(valore);
  const sotto = presente === null ? motivo : nota;
  return (
    <div>
      <dt>
        {etichetta}
        {spiegazione && <span className="visually-hidden">{`: ${spiegazione}`}</span>}
      </dt>
      <dd>{presente === null ? NON_DISPONIBILE : <NumeroAnimato valore={presente} formato={formato} />}</dd>
      {sotto && <dd className="ui-ambito__nota">{sotto}</dd>}
    </div>
  );
}

interface PropsAvanzamento {
  etichetta: string;
  spiegazione?: string;
  /** Quota in percentuale (0-100; oltre 100 la barra si ferma piena, il testo resta quello vero). */
  percentuale: number;
  /** Il valore nel testo; di norma la percentuale. */
  testo?: string;
}

/** Una quota come barra a passi del 5 % che si riempie entrando: decorativa, etichetta e valore sono nel testo. */
export function AvanzamentoArea({ etichetta, spiegazione, percentuale, testo }: PropsAvanzamento) {
  const passo = Math.round(Math.min(100, Math.max(0, percentuale)) / 5) * 5;
  return (
    <div className="ui-ambito__avanzamento">
      <p>
        <span>
          {etichetta}
          {spiegazione && <span className="visually-hidden">{`: ${spiegazione}`}</span>}
        </span>
        <b>{testo ?? formatPercentuale(percentuale)}</b>
      </p>
      <div className="ui-barra ui-barra--entra" aria-hidden="true">
        <span className={`ui-barra__${passo}`} />
      </div>
    </div>
  );
}

/** Una riga della tabella a confronto: l'etichetta e il formato dei suoi valori. */
export interface RigaConfronto {
  chiave: string;
  etichetta: string;
  formato: (v: number) => string;
}

/** Una cella: il valore (null o assente = non disponibile) e perche' manca. */
export interface CellaConfronto {
  valore: number | null | undefined;
  motivo?: string;
}

/** Una colonna della tabella a confronto: una lettura indipendente dalle altre. */
export interface ColonnaConfronto {
  chiave: string;
  titolo: string;
  /** Sotto il titolo, tra parentesi: a cosa si riferiscono i valori della colonna. */
  dettaglio?: string;
  /**
   * Le celle per riga: undefined = lettura in corso (scheletro), null = lettura fallita (non disponibile in ogni riga; la
   * frase dell'errore la scrive chi usa la tabella). Una riga senza cella e' non disponibile.
   */
  celle: Readonly<Partial<Record<string, CellaConfronto>>> | null | undefined;
  /** Le righe che la colonna non ha (un trattino) e cosa ne sentono i lettori di schermo. */
  senzaDato?: { righe: readonly string[]; testo: string };
}

function CellaDelConfronto({ riga, colonna }: { riga: RigaConfronto; colonna: ColonnaConfronto }) {
  if (colonna.senzaDato?.righe.includes(riga.chiave)) {
    return (
      <span className="ui-ambito__confronto-assente">
        <span aria-hidden="true">—</span>
        <span className="visually-hidden">{colonna.senzaDato.testo}</span>
      </span>
    );
  }
  if (colonna.celle === undefined) return <span className="ui-skeleton ui-ambito__confronto-attesa" aria-hidden="true" />;
  const presente = numeroDi(colonna.celle?.[riga.chiave]?.valore);
  if (presente === null) return <span className="ui-ambito__confronto-assente">{NON_DISPONIBILE}</span>;
  return <NumeroAnimato valore={presente} formato={riga.formato} />;
}

/**
 * Le stesse righe lette da piu' fonti, una colonna per fonte, in una tabella con intestazioni di riga e di colonna. Ogni
 * colonna ha il suo stato (scheletro, non disponibile, valori); sotto la tabella il motivo di ogni cella che manca, con
 * riga e colonna. Le colonne si affiancano, non si sommano. Il contenitore stringe i numeri nelle card strette.
 */
export function ConfrontoArea({ titolo, righe, colonne }: { titolo: string; righe: readonly RigaConfronto[]; colonne: readonly ColonnaConfronto[] }) {
  const motivi = righe.flatMap((r) =>
    colonne.flatMap((c) => {
      const cella = c.celle?.[r.chiave];
      return cella?.motivo && numeroDi(cella.valore) === null ? [{ chiave: `${r.chiave}-${c.chiave}`, testo: `${r.etichetta}, ${c.titolo}: ${cella.motivo}` }] : [];
    }),
  );
  return (
    <>
      <div className="ui-ambito__confronto-contenitore">
        <table className="ui-ambito__confronto">
          <caption className="visually-hidden">{titolo}</caption>
          <thead>
            <tr>
              <td />
              {colonne.map((c) => (
                <th key={c.chiave} scope="col">
                  {c.titolo}
                  {/* lo spazio fuori dallo span: il nome accessibile e' "SIGC (esercizio 2026)", non "SIGC(esercizio 2026)" */}
                  {c.dettaglio && (
                    <>
                      {' '}
                      <span>{`(${c.dettaglio})`}</span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.chiave}>
                <th scope="row">{r.etichetta}</th>
                {colonne.map((c) => (
                  <td key={c.chiave}>
                    <CellaDelConfronto riga={r} colonna={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {colonne.some((c) => c.celle === undefined) && (
        <p className="visually-hidden" role="status" aria-live="polite">
          Caricamento in corso…
        </p>
      )}
      {motivi.map((m) => (
        <NotaArea key={m.chiave}>{m.testo}</NotaArea>
      ))}
    </>
  );
}

/** Lo scheletro di una lettura in corso, al posto dei suoi numeri; i lettori di schermo sentono "Caricamento in corso". */
export function AttesaArea() {
  return (
    <div className="ui-skeleton ui-ambito__attesa" role="status" aria-live="polite">
      <span className="visually-hidden">Caricamento in corso…</span>
    </div>
  );
}

/** Una frase al posto di un numero o di una lettura; `stato`: e' l'esito della lettura (nessun dato), annunciato. */
export function NotaArea({ children, stato = false }: { children: ReactNode; stato?: boolean }) {
  return (
    <p className="ui-ambito__nota" role={stato ? 'status' : undefined}>
      {children}
    </p>
  );
}
