// comuni.tsx — mattoni di DOMINIO condivisi dai report del finanziario (UI v2, wireframe v2 approvati): gating per grant
// della sezione, perimetro della sezione, stato vuoto con "Modifica i filtri", etichette dei dati di programma, colonne
// degli Importo. I mattoni senza dominio (Sezione, Griglia, tabelle) stanno nel kit di shared/ui.
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { ValoreImporto, descriviImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatNumber, importoKpi, maiuscolaIniziale } from '../../../shared/lib';
import { Caricamento, Kpi, Sezione } from '../../../shared/ui';
import type { Colonna, ColonnaTabella, NomeIcona, TonoKpi } from '../../../shared/ui';
import { PERIMETRO_ADA, etichettaDiProgramma, etichettaPerimetro } from '../lib/perimetro';
import type { Perimetro } from '../lib/perimetro';

/** Badge del perimetro della singola sezione: ogni DTO dichiara il suo (misure per domanda ADA, dati di programma regionali). */
export function PerimetroSezione({ perimetro }: { perimetro: Perimetro | null | undefined }) {
  if (!perimetro) return null;
  return (
    <p className="small mb-2">
      <span className={perimetro === PERIMETRO_ADA ? 'ui-pill ui-pill--evidenza me-2' : 'ui-pill me-2'}>{`Perimetro ${perimetro}`}</span>
      {etichettaPerimetro(perimetro)}
    </p>
  );
}

/** Apre il pannello dei filtri della pagina; null fuori da una pagina con il pannello (es. senza il grant dei filtri). */
export const ContestoFiltri = createContext<(() => void) | null>(null);

function MessaggioVuoto({ testo, perimetro, programma }: { testo: string; perimetro?: Perimetro | null; programma: boolean }) {
  const apriFiltri = useContext(ContestoFiltri);
  // per le misure per domanda di un P4 il vuoto puo' dipendere dall'area; i dati di programma sono gli stessi per tutti
  const messaggio =
    perimetro === PERIMETRO_ADA && !programma ? 'Nessun dato nella tua area (perimetro ADA) per i filtri scelti: le domande delle altre aree non rientrano nel tuo profilo.' : testo;
  return (
    <>
      <PerimetroSezione perimetro={perimetro} />
      <span>{apriFiltri ? messaggio : `${messaggio} Modifica i filtri.`}</span>
      {apriFiltri && (
        <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={apriFiltri}>
          Modifica i filtri
        </button>
      )}
    </>
  );
}

/**
 * Stato vuoto azionabile, con il perimetro: per un P4 (perimetro ADA) il motivo delle misure per domanda puo' essere la
 * sua area, non i filtri; `programma` = il vuoto viene da dati di programma (righe per intervento di TX-0002/TX-0011),
 * uguali per ogni profilo. Nella pagina con il pannello dei filtri c'e' il bottone "Modifica i filtri", altrimenti
 * l'invito resta nel testo. Uso: vuoto={vuotoConPerimetro('Nessuna domanda per i filtri scelti.')}.
 */
export function vuotoConPerimetro(testo: string, { programma = false }: { programma?: boolean } = {}) {
  return function vuoto(d: { perimetro?: Perimetro | null }) {
    return <MessaggioVuoto testo={testo} perimetro={d.perimetro} programma={programma} />;
  };
}

/** Etichetta di un dato di programma (dotazione, quote): con il perimetro ADA resta regionale e lo si dichiara. */
export function diProgramma(etichetta: string, perimetro: Perimetro | null | undefined): string {
  return etichettaDiProgramma(etichetta, perimetro);
}

/** Nota per le sezioni che, con il perimetro ADA, affiancano dati di programma regionali e misure della sola area. */
export function NotaPerimetroMisto({ perimetro }: { perimetro: Perimetro | null | undefined }) {
  if (perimetro !== PERIMETRO_ADA) return null;
  return (
    <p className="small mb-2">
      La dotazione e le quote sono regionali (dati di programma), domande, impegni e pagamenti sono della tua area: i due valori non sono confrontabili.
    </p>
  );
}

/**
 * Monta la sezione (e quindi la sua lettura) solo con il grant della sua transazione; altrimenti lo dice. Una sezione che
 * combina piu' transazioni chiede tutti i loro grant. Finche' lo stato di autenticazione e' in caricamento non afferma
 * nulla sul profilo: mostra il caricamento. Gate di UX: l'enforcement e' del backend. Gli hook che leggono vanno chiamati
 * nei figli, mai nel componente che monta ConGrant (R-09).
 */
export function ConGrant({ grant, titolo, children }: { grant: string | string[]; titolo: string; children: ReactNode }) {
  const auth = useAuthStatus();
  if ((Array.isArray(grant) ? grant : [grant]).every((g) => hasGrant(auth.data, g))) return <>{children}</>;
  return (
    <Sezione titolo={titolo}>
      {auth.data === undefined && !auth.isError ? <Caricamento /> : <p className="small mb-0">Sezione non disponibile per il tuo profilo.</p>}
    </Sezione>
  );
}

/** Conteggio (numero di domande): il backend non lo rende null; un assente resta "-" del formattatore. */
export function Numero({ valore }: { valore: number | null | undefined }) {
  return <span className="font-monospace">{formatNumber(valore)}</span>;
}

/** Colonna di TabellaRighe con un Importo della spec (valore, oppure l'assenza dichiarata: mai uno zero). */
export function colonnaImporto<T>(etichetta: string, leggi: (riga: T) => ImportoLike | undefined): Colonna<T> {
  return [etichetta, (r) => <ValoreImporto importo={leggi(r)} />];
}

/** Un campo Importo di una riga per intervento: chiave, titolo, e se e' un dato di programma (regionale per un P4). */
export interface CampoImporto<T> {
  chiave: keyof T & string;
  titolo: string;
  programma?: boolean;
}

/**
 * Colonne di TabellaInterattiva per i campi Importo di una riga per intervento (Riepilogo, Dotazione): tutte visibili,
 * come nei wireframe approvati; l'assenza di ogni cella dice il suo motivo e la fonte attesa.
 */
export function colonneImporti<T>(campi: readonly CampoImporto<T>[], perimetro: Perimetro | null | undefined): ColonnaTabella<T>[] {
  const importo = (r: T, c: CampoImporto<T>) => r[c.chiave] as ImportoLike | undefined;
  return campi.map((c) => ({
    chiave: c.chiave,
    titolo: c.programma ? diProgramma(c.titolo, perimetro) : c.titolo,
    valore: (r: T) => importo(r, c)?.valore ?? null,
    resa: (r: T) => <ValoreImporto importo={importo(r, c)} />,
    numerica: true,
  }));
}

/**
 * KPI di un Importo: il valore in milioni, oppure l'assenza con il suo motivo e la fonte attesa ("Non disponibile: fonte
 * impegni non attiva", "Non calcolabile: manca per almeno un intervento ..."). `aggregato`: totale su piu' interventi.
 */
export function KpiImporto({ etichetta, importo, icona, tono, nota, aggregato = true }: { etichetta: string; importo: ImportoLike | null | undefined; icona: NomeIcona; tono: TonoKpi; nota?: string; aggregato?: boolean }) {
  const r = descriviImporto(importo, aggregato);
  const assente = r.disponibile ? undefined : `${maiuscolaIniziale(r.testo)}${r.nota ? `: ${r.nota}` : ''}`;
  return <Kpi etichetta={etichetta} icona={icona} tono={tono} valore={importo?.valore != null ? importoKpi(importo.valore) : undefined} assente={assente} nota={nota} />;
}

/**
 * Per VistaQuery.errorePersonalizzato: l'errore non si mostra qui perche' lo dice gia', una volta e con "Riprova", la
 * sezione della stessa transazione (A-07). Un frammento vuoto, non null: null vorrebbe dire "errore non gestito".
 */
export function erroreGiaMostrato() {
  return <></>;
}
