// comuni.tsx — mattoni condivisi dai report del finanziario (pattern DS "dettaglio in sola lettura", wireframe
// approvati): sezione a card con il SUO perimetro, tabella per righe e tabella voce/valore, numeri, gating per grant
// della sezione. Solo classi bootstrap-italia (card, table, badge); nessun comportamento ARIA complesso, niente react-aria.
import { useId } from 'react';
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { ValoreImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { Caricamento } from '../../../shared/ui';
import { etichettaPerimetro } from '../lib/filtri';
import type { Perimetro } from '../lib/filtri';

/** Badge del perimetro della singola sezione: ogni DTO dichiara il suo (misure per domanda ADA, dati di programma regionali). */
export function PerimetroSezione({ perimetro }: { perimetro: Perimetro | null | undefined }) {
  if (!perimetro) return null;
  return (
    <p className="small mb-2">
      Perimetro: <span className="badge bg-primary me-1">{perimetro}</span>
      {etichettaPerimetro(perimetro)}
    </p>
  );
}

/**
 * Stato vuoto con il perimetro: per un P4 (perimetro ADA) il motivo puo' essere la sua area, non i filtri.
 * Uso: vuoto={vuotoConPerimetro('Nessuna domanda per i filtri scelti. Modifica i filtri.')}.
 */
export function vuotoConPerimetro(testo: string) {
  return function MessaggioVuoto(d: { perimetro?: Perimetro | null }) {
    return (
      <>
        <PerimetroSezione perimetro={d.perimetro} />
        <span>
          {d.perimetro === 'ADA'
            ? 'Nessun dato nella tua area (perimetro ADA) per i filtri scelti: le domande delle altre aree non rientrano nel tuo profilo.'
            : testo}
        </span>
      </>
    );
  };
}

/** Etichetta di un dato di programma (dotazione, quote): con il perimetro ADA resta regionale e lo si dichiara. */
export function diProgramma(etichetta: string, perimetro: Perimetro | null | undefined): string {
  return perimetro === 'ADA' ? `${etichetta} (regionale)` : etichetta;
}

/** Nota per le sezioni che, con il perimetro ADA, affiancano dati di programma regionali e misure della sola area. */
export function NotaPerimetroMisto({ perimetro }: { perimetro: Perimetro | null | undefined }) {
  if (perimetro !== 'ADA') return null;
  return (
    <p className="small mb-2">
      La dotazione e le quote sono regionali (dati di programma), domande, impegni e pagamenti sono della tua area: i due valori non sono confrontabili.
    </p>
  );
}

export function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="card my-3" aria-labelledby={id}>
      <div className="card-body">
        <h2 className="card-title h5" id={id}>
          {titolo}
        </h2>
        {children}
      </div>
    </section>
  );
}

/**
 * Monta la sezione (e quindi la sua lettura) solo con il grant della sua transazione; altrimenti lo dice. Finche' lo
 * stato di autenticazione e' in caricamento non afferma nulla sul profilo: mostra il caricamento. Gate di UX:
 * l'enforcement e' del backend.
 */
export function ConGrant({ grant, titolo, children }: { grant: string; titolo: string; children: ReactNode }) {
  const auth = useAuthStatus();
  if (hasGrant(auth.data, grant)) return <>{children}</>;
  return (
    <Sezione titolo={titolo}>
      {auth.data === undefined && !auth.isError ? <Caricamento /> : <p className="small mb-0">Sezione non disponibile per il tuo profilo.</p>}
    </Sezione>
  );
}

export interface Voce {
  etichetta: string;
  valore: ReactNode;
}

export function TabellaVoci({ caption, voci }: { caption: string; voci: Voce[] }) {
  return (
    <table className="table table-sm">
      <caption>{caption}</caption>
      <tbody>
        {voci.map((v) => (
          <tr key={v.etichetta}>
            <th scope="row">{v.etichetta}</th>
            <td className="text-end">{v.valore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Colonna di TabellaRighe: intestazione e cella dalla stessa voce, cosi' non si possono disallineare. */
export type Colonna<T> = [string, (riga: T) => ReactNode];

/** Tabella per righe: prima colonna come intestazione di riga (th scope=row), le altre numeriche a destra. */
export function TabellaRighe<T>(props: {
  caption: string;
  intestazione: string;
  chiave: (riga: T) => string;
  colonne: Colonna<T>[];
  righe: T[];
}) {
  const { caption, intestazione, chiave, colonne, righe } = props;
  return (
    <div className="table-responsive">
      <table className="table table-sm">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{intestazione}</th>
            {colonne.map(([c]) => (
              <th key={c} scope="col" className="text-end">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r) => (
            <tr key={chiave(r)}>
              <th scope="row">{chiave(r)}</th>
              {colonne.map(([c, cella]) => (
                <td key={c} className="text-end">
                  {cella(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Conteggio (numero di domande): il backend non lo rende null; un assente resta "-" del formattatore. */
export function Numero({ valore }: { valore: number | null | undefined }) {
  return <span className="font-monospace">{formatNumber(valore)}</span>;
}

/** Colonna con un Importo della spec (valore, oppure l'assenza dichiarata: mai uno zero). */
export function colonnaImporto<T>(etichetta: string, leggi: (riga: T) => ImportoLike | undefined): Colonna<T> {
  return [etichetta, (r) => <ValoreImporto importo={leggi(r)} />];
}
