// PaginaReport — l'impaginazione delle due pagine del fisico venute col riallineamento degli ambiti del 29/10/2026,
// l'output regionale (dall'istituzionale) e le Unit Amount (dal procedurale): l'adattatore del fisico sull'impaginazione
// comune dei report coi filtri del programma (PaginaReportProgramma di entities/filtri, la stessa dell'istituzionale:
// review del riallineamento FIS-05, prima ne ricopiava lo scheletro). La pagina tiene i filtri con useFiltriDellaPagina,
// legge il suo report e passa qui solo cio' che cambia: i testi della testata, la pill della risposta, il testo dello
// stato vuoto, i codici degli interventi della risposta e il report. Qui cio' che e' del fisico: la pill del perimetro
// della risposta (sempre regionale) e quella della risposta prima di "Dati al"; la voce "Fisico" del percorso (la prima
// pagina dell'area che il profilo apre, review FIS-02); il testo del vuoto coi filtri del programma; le righe di contesto
// dei PNG (NFR-50) intorno al report; il pannello dei filtri del programma con le voci di TX-0060, azione portante
// compresa in entrambe le pagine (dal 30/10/2026 anche le Unit Amount, SC-FS_UNIT_AMOUNT_AZIONE). Le superfici hanno la
// loro impaginazione (con la campagna). Classi bootstrap-italia e del kit v2; react-aria solo dentro il pannello e il
// popover della pill del kit.
import type { ReactNode } from 'react';
import { PaginaReportProgramma, PannelloFiltriProgramma } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { testoPerimetro } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import { ContestoIntestazione, useRigheContesto } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { conFiltriDelProgramma, testiCriteri } from '../lib/criteri';
import { useIngressoArea } from './navigazione';
import type { FiltriDellaPagina } from './useFiltriNellIndirizzo';

const NOTA_PANNELLO = "Voci di Intervento, obiettivi e azioni portanti da TX-0060 dell'elenco operativo (valori regionali).";

/** La risposta di un report del fisico, per quanto serve all'impaginazione: il perimetro, le righe e l'ultimo dato. */
export interface RispostaReport {
  perimetro?: string;
  righe?: readonly unknown[];
  ultimiDatiSincronizzati?: readonly UltimoDato[];
}

interface PropsPagina<D extends RispostaReport> {
  pagina: FiltriDellaPagina;
  /** La lettura del report coi filtri della pagina. */
  stato: StatoQuery<D>;
  /** La voce del percorso dopo "Fisico". */
  briciola: string;
  titolo: string;
  titoloDocumento: string;
  sottotitolo: string;
  /** Il titolo del pannello dei filtri. */
  titoloPannello: string;
  /** Il testo della pill della risposta nella barra, fra il perimetro e "Dati al" (il periodo dell'output); nessuna pill senza. */
  pill?: (d: D) => string;
  /** Il testo dello stato vuoto, coi filtri attivi o senza. */
  testoVuoto: (conFiltri: boolean) => string;
  /** I codici degli interventi della risposta: le voci di Intervento del pannello senza TX-0060. */
  codiciRisposta: readonly string[];
  /** Il report della risposta (nuovo coi criteri nuovi: la chiave la da' la pagina). */
  children: (d: D) => ReactNode;
}

/** Perimetro della risposta (sempre regionale) e la pill della risposta, a destra nella barra prima di "Dati al". */
function PillDellaRisposta<D extends RispostaReport>({ d, pill }: { d: D | undefined; pill?: (d: D) => string }) {
  return (
    <>
      {d?.perimetro && <span className="ui-pill">{`Perimetro: ${testoPerimetro(d.perimetro)}`}</span>}
      {d && pill && <span className="ui-pill">{pill(d)}</span>}
    </>
  );
}

export function PaginaReport<D extends RispostaReport>({ pagina, stato, briciola, titolo, titoloDocumento, sottotitolo, titoloPannello, pill, testoVuoto, codiciRisposta, children }: PropsPagina<D>) {
  const { filtri, valori, pannello, chiudi, onApplica } = pagina;
  // righe di contesto del PNG dei grafici (NFR-50, hook del kit): filtri applicati, perimetro, profilo, ultimo dato
  const d = stato.data;
  const contesto = useRigheContesto(testiCriteri(filtri), d?.ultimiDatiSincronizzati, d?.perimetro ? testoPerimetro(d.perimetro) : null);
  const pannelloFiltri = (
    <PannelloFiltriProgramma<Filtri>
      aperto={pannello !== null}
      titolo={titoloPannello}
      criteri={filtri}
      valori={valori}
      codiciRisposta={codiciRisposta}
      nessuno={{}}
      onApplica={onApplica}
      onChiudi={chiudi}
      nota={NOTA_PANNELLO}
    />
  );
  return (
    <PaginaReportProgramma
      pagina={pagina}
      stato={stato}
      briciole={[{ etichetta: 'Fisico', a: useIngressoArea() }, { etichetta: briciola }]}
      testa={{ titolo, titoloDocumento, sottotitolo }}
      pillDellaBarra={(r) => <PillDellaRisposta d={r} pill={pill} />}
      testoVuoto={testoVuoto(conFiltriDelProgramma(filtri))}
      pannello={pannelloFiltri}
    >
      {(r) => <ContestoIntestazione.Provider value={contesto}>{children(r)}</ContestoIntestazione.Provider>}
    </PaginaReportProgramma>
  );
}
