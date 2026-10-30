// PaginaReport — l'impaginazione comune dei due report istituzionali, le verifiche SMP non SIGC e SIGC (wireframe
// approvati del 22/10/2026; review H6: prima scritta in tutte e due le pagine, allora la verifica e l'output regionale,
// passato al fisico il 29/10/2026), sull'impaginazione delle pagine con la barra dei filtri del kit (PaginaConFiltri, nata
// qui e portata nel kit col procedurale). La pagina tiene i filtri con useFiltriDellaPagina, legge il suo report e passa
// qui solo cio' che cambia: i testi della testata, la pill della risposta, cosa sta sopra al report (il selettore
// dell'anno o dell'esercizio), cosa sta al posto del report quando la pagina non legge (la verifica SIGC senza
// l'esercizio) e il report della risposta. Qui: i chip e le pill del perimetro regionale, della risposta e "Dati al"
// (ultimiDatiSincronizzati, G3); il percorso; lo stato dei valori dei filtri non disponibili; il corpo (l'attesa del
// legame con le azioni, la lettura, il vuoto con "Modifica i filtri": coi criteri cambiati dal pannello il focus va
// sull'h1); il pannello dei filtri. Classi bootstrap-italia e del kit v2; react-aria solo dentro il pannello e il popover
// della pill del kit.
import type { ReactNode } from 'react';
import { ValoriFiltriNonDisponibili } from '../../../entities/filtri';
import { Caricamento, PaginaConFiltri, PillDatiAl, VistaQuery, Vuoto, VuotoConFiltri } from '../../../shared/ui';
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

/** Perimetro (sempre regionale), la pill della risposta e l'ultimo dato sincronizzato, a destra nella barra. */
function PillDellaBarra<D extends RispostaReport>({ d, inErrore, pill }: { d: D | undefined; inErrore: boolean; pill: (d: D) => string }) {
  return (
    <>
      <span className="ui-pill">{PILL_PERIMETRO}</span>
      {d && <span className="ui-pill">{pill(d)}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

type PropsCorpo<D extends RispostaReport> = Pick<PropsPagina<D>, 'stato' | 'children' | 'senzaLettura'> & { inAttesa: boolean; vuoto: ReactNode };

/** Il corpo (nell'avviso unico della pagina): l'attesa del legame con le azioni, la lettura e il report della risposta. */
function CorpoReport<D extends RispostaReport>({ stato, inAttesa, vuoto, senzaLettura, children }: PropsCorpo<D>) {
  if (senzaLettura !== undefined) return <Vuoto>{senzaLettura}</Vuoto>;
  // finche' non si sa se il filtro per azione si applica, il report non si legge (come nel finanziario, X-03)
  if (inAttesa) return <Caricamento testo="Verifica dei filtri in corso…" />;
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={vuoto}>
      {children}
    </VistaQuery>
  );
}

export function PaginaReport<D extends RispostaReport>({ pagina, stato, briciola, titolo, titoloDocumento, sottotitolo, nota, senzaLettura, testoDelVuoto, pill, sopra, children }: PropsPagina<D>) {
  const { filtri, inAttesa, chip, togliTutti, valori, h1, pannello, apri, chiudi, onApplica } = pagina;
  const briciole = [{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: briciola }];
  const vuoto = <VuotoConFiltri onModifica={() => apri('vuoto')}>{testoDelVuoto ?? testoVuoto(conFiltri(filtri))}</VuotoConFiltri>;
  const barra = { chip, onApri: () => apri('barra'), onTogliTutti: togliTutti, vuoto: 'Nessun filtro: tutti gli interventi', destra: <PillDellaBarra d={stato.data} inErrore={stato.isError} pill={pill} /> };
  const pannelloFiltri = <PannelloFiltriIstituzionale aperto={pannello !== null} filtri={filtri} valori={valori} codiciRisposta={codiciDi(stato.data)} onApplica={onApplica} onChiudi={chiudi} />;
  return (
    <PaginaConFiltri
      barra={barra}
      briciole={briciole}
      testa={{ titolo, titoloDocumento, sottotitolo, nota, refTitolo: h1 }}
      sopra={
        <>
          <ValoriFiltriNonDisponibili letture={[valori]} h1={h1} />
          {sopra}
        </>
      }
      pannello={pannelloFiltri}
    >
      <CorpoReport stato={stato} inAttesa={inAttesa} vuoto={vuoto} senzaLettura={senzaLettura}>
        {children}
      </CorpoReport>
    </PaginaConFiltri>
  );
}
