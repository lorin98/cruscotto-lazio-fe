// PaginaReport — l'impaginazione dei due report istituzionali, le verifiche SMP non SIGC e SIGC (wireframe approvati del
// 22/10/2026; review H6: prima scritta in tutte e due le pagine, allora la verifica e l'output regionale, passato al
// fisico il 29/10/2026): l'adattatore dell'istituzionale sull'impaginazione comune dei report coi filtri del programma
// (PaginaReportProgramma di entities/filtri, nata qui e portata nell'entity quando il fisico ne ha ricopiato lo
// scheletro: review del riallineamento FIS-05). La pagina tiene i filtri con useFiltriDellaPagina, legge il suo report e
// passa qui solo cio' che cambia: i testi della testata, la pill della risposta, cosa sta sopra al report (il selettore
// dell'anno o dell'esercizio), cosa sta al posto del report quando la pagina non legge (la verifica SIGC senza
// l'esercizio) e il report della risposta. Qui cio' che e' dell'istituzionale: la pill del perimetro regionale (sempre,
// anche prima della risposta) e quella della risposta prima di "Dati al"; la voce "Istituzionale" del percorso; il testo
// del vuoto; il pannello dei filtri. Classi bootstrap-italia e del kit v2; react-aria solo dentro il pannello e il popover
// della pill del kit.
import type { ReactNode } from 'react';
import { PaginaReportProgramma } from '../../../entities/filtri';
import type { StatoQuery } from '../../../shared/ui';
import type { UltimoDato } from '../../../shared/lib';
import { conFiltri } from '../lib/criteri';
import { PILL_PERIMETRO, testoVuoto } from '../lib/formato';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriIstituzionale } from './PannelloFiltriIstituzionale';
import type { FiltriDellaPagina } from './useFiltriNellIndirizzo';

/**
 * La risposta di un report istituzionale, per quanto serve all'impaginazione: le righe per intervento e l'ultimo dato (in
 * TX-0015, venuta dal finanziario, i campi sono facoltativi come nella sua spec).
 */
export interface RispostaReport {
  righe?: readonly { codiceIntervento?: string }[];
  ultimiDatiSincronizzati?: readonly UltimoDato[];
}

/** I codici degli interventi della risposta (le voci di Intervento del pannello senza TX-0060). */
function codiciDi(d: RispostaReport | undefined): string[] {
  return (d?.righe ?? []).flatMap((r) => (r.codiceIntervento ? [r.codiceIntervento] : []));
}

interface PropsPagina<D extends RispostaReport> {
  pagina: FiltriDellaPagina;
  /** La lettura del report coi filtri della pagina. */
  stato: StatoQuery<D>;
  /** La voce del percorso dopo "Istituzionale". */
  briciola: string;
  titolo: string;
  titoloDocumento: string;
  sottotitolo: string;
  /** Sotto il sottotitolo (la frase verso l'altra verifica dell'area, coi filtri comuni). */
  nota?: ReactNode;
  /** Al posto del report quando la pagina non legge (la verifica SMP SIGC senza l'esercizio): un testo, nessuna lettura. */
  senzaLettura?: ReactNode;
  /** Il testo dello stato vuoto al posto di quello comune dei report (la verifica SIGC lo dice dell'esercizio scelto). */
  testoDelVuoto?: string;
  /** Il testo della pill della risposta nella barra, fra il perimetro e "Dati al" (anno del file, esercizio). */
  pill: (d: D) => string;
  /** Fra lo stato dei valori dei filtri e il report (il selettore dell'anno o dell'esercizio). */
  sopra?: ReactNode;
  /** Il report della risposta (nuovo coi criteri nuovi: la chiave la da' la pagina). */
  children: (d: D) => ReactNode;
}

/** Perimetro (sempre regionale) e la pill della risposta, a destra nella barra prima di "Dati al". */
function PillDellaRisposta<D extends RispostaReport>({ d, pill }: { d: D | undefined; pill: (d: D) => string }) {
  return (
    <>
      <span className="ui-pill">{PILL_PERIMETRO}</span>
      {d && <span className="ui-pill">{pill(d)}</span>}
    </>
  );
}

export function PaginaReport<D extends RispostaReport>({ pagina, stato, briciola, titolo, titoloDocumento, sottotitolo, nota, senzaLettura, testoDelVuoto, pill, sopra, children }: PropsPagina<D>) {
  const { filtri, valori, pannello, chiudi, onApplica } = pagina;
  const pannelloFiltri = <PannelloFiltriIstituzionale aperto={pannello !== null} filtri={filtri} valori={valori} codiciRisposta={codiciDi(stato.data)} onApplica={onApplica} onChiudi={chiudi} />;
  return (
    <PaginaReportProgramma
      pagina={pagina}
      stato={stato}
      briciole={[{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: briciola }]}
      testa={{ titolo, titoloDocumento, sottotitolo, nota }}
      pillDellaBarra={(d) => <PillDellaRisposta d={d} pill={pill} />}
      testoVuoto={testoDelVuoto ?? testoVuoto(conFiltri(filtri))}
      senzaLettura={senzaLettura}
      sopra={sopra}
      pannello={pannelloFiltri}
    >
      {children}
    </PaginaReportProgramma>
  );
}
