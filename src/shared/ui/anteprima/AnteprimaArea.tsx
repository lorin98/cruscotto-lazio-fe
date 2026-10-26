// AnteprimaArea — i pezzi della card di un'area nella Home (kit v2, senza dominio): il gruppo con nome dei numeri chiave,
// il riferimento dei numeri (campagna, file), i numeri come lista di definizioni col valore animato oppure "non
// disponibile" col motivo, la barra di avanzamento a passi del 5 % con il valore nel testo, lo scheletro di una lettura e
// la frase di un dato che manca. Prima dentro la card del finanziario; dal 26/10/2026 (decisione dell'utente) li usano
// anche le card di fisico, procedurale e istituzionale. Classi ui-ambito__* di tema.css, nessuno stile inline (CSP).
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
