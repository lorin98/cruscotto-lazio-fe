// PaginaReport — l'impaginazione comune dei due report istituzionali, la verifica SMP non SIGC e l'output regionale
// (wireframe approvati del 22/10/2026; review H6: prima scritta in tutte e due le pagine), sull'impaginazione delle pagine
// con la barra dei filtri del kit (PaginaConFiltri, nata qui e portata nel kit col procedurale). La pagina tiene i filtri
// con useFiltriDellaPagina, legge il suo report e passa qui solo cio' che cambia: i testi della testata, la pill della
// risposta, cosa sta sopra al report (il selettore dell'anno della verifica) e il report della risposta. Qui: i chip e le
// pill del perimetro regionale, della risposta e "Dati al" (ultimiDatiSincronizzati, G3); il percorso; lo stato dei
// valori dei filtri non disponibili; il corpo (l'attesa del legame con le azioni, la lettura, il vuoto con "Modifica i
// filtri": coi criteri cambiati dal pannello il focus va sull'h1); il pannello dei filtri. Classi bootstrap-italia e del
// kit v2; react-aria solo dentro il pannello e il popover della pill del kit.
import type { ReactNode } from 'react';
import { ValoriFiltriNonDisponibili } from '../../../entities/filtri';
import { Caricamento, PaginaConFiltri, PillDatiAl, VistaQuery, VuotoConFiltri } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import type { UltimoDato } from '../../../shared/lib';
import { conFiltri } from '../lib/criteri';
import { PILL_PERIMETRO, testoVuoto } from '../lib/formato';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriIstituzionale } from './PannelloFiltriIstituzionale';
import type { FiltriDellaPagina } from './useFiltriNellIndirizzo';

/** La risposta di un report istituzionale, per quanto serve all'impaginazione: le righe per intervento e l'ultimo dato. */
export interface RispostaReport {
  righe: readonly { codiceIntervento: string }[];
  ultimiDatiSincronizzati: readonly UltimoDato[];
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
  /** Sotto il sottotitolo (la frase verso la verifica SMP SIGC, G4). */
  nota?: ReactNode;
  /** Il testo della pill della risposta nella barra, fra il perimetro e "Dati al" (anno del file, periodo). */
  pill: (d: D) => string;
  /** Fra lo stato dei valori dei filtri e il report (il selettore dell'anno della verifica). */
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

type PropsCorpo<D extends RispostaReport> = Pick<PropsPagina<D>, 'stato' | 'children'> & { inAttesa: boolean; vuoto: ReactNode };

/** Il corpo (nell'avviso unico della pagina): l'attesa del legame con le azioni, la lettura e il report della risposta. */
function CorpoReport<D extends RispostaReport>({ stato, inAttesa, vuoto, children }: PropsCorpo<D>) {
  // finche' non si sa se il filtro per azione si applica, il report non si legge (come nel finanziario, X-03)
  if (inAttesa) return <Caricamento testo="Verifica dei filtri in corso…" />;
  return (
    <VistaQuery stato={stato} eVuoto={(d) => d.righe.length === 0} vuoto={vuoto}>
      {children}
    </VistaQuery>
  );
}

export function PaginaReport<D extends RispostaReport>({ pagina, stato, briciola, titolo, titoloDocumento, sottotitolo, nota, pill, sopra, children }: PropsPagina<D>) {
  const { filtri, inAttesa, chip, togliTutti, valori, h1, pannello, apri, chiudi, onApplica } = pagina;
  const briciole = [{ etichetta: 'Istituzionale', a: useIngressoArea() }, { etichetta: briciola }];
  const vuoto = <VuotoConFiltri onModifica={() => apri('vuoto')}>{testoVuoto(conFiltri(filtri))}</VuotoConFiltri>;
  const barra = { chip, onApri: () => apri('barra'), onTogliTutti: togliTutti, vuoto: 'Nessun filtro: tutti gli interventi', destra: <PillDellaBarra d={stato.data} inErrore={stato.isError} pill={pill} /> };
  const pannelloFiltri = <PannelloFiltriIstituzionale aperto={pannello !== null} filtri={filtri} valori={valori} codiciRisposta={(stato.data?.righe ?? []).map((r) => r.codiceIntervento)} onApplica={onApplica} onChiudi={chiudi} />;
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
      <CorpoReport stato={stato} inAttesa={inAttesa} vuoto={vuoto}>
        {children}
      </CorpoReport>
    </PaginaConFiltri>
  );
}
