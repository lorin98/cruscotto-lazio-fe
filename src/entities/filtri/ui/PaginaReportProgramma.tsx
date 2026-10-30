// PaginaReportProgramma — l'impaginazione comune dei report coi filtri del programma nella barra (UI v2): le verifiche SMP
// non SIGC e SIGC dell'istituzionale, l'output regionale e le Unit Amount del fisico. Prima scritta nell'istituzionale e
// ricopiata nel fisico col riallineamento degli ambiti del 29/10/2026 (review del riallineamento FIS-05): qui una volta,
// sull'impaginazione delle pagine con la barra dei filtri del kit (PaginaConFiltri), accanto al pannello comune
// (PannelloFiltriProgramma) e allo stato dei valori dei filtri non disponibili. La feature passa i testi della testata, il
// percorso, le pill della risposta, il testo dello stato vuoto, il pannello e il report; qui: i chip della barra con le
// pill della risposta e "Dati al" (ultimiDatiSincronizzati della risposta, G3), lo stato dei valori dei filtri non
// disponibili e cio' che la pagina mette sopra al report (il selettore dell'anno o dell'esercizio), il corpo (al posto
// del report quando la pagina non legge, l'attesa del legame con le azioni, X-03, la lettura, il vuoto con "Modifica i
// filtri": coi criteri cambiati dal pannello il focus va sull'h1) e il pannello dopo il main. Classi bootstrap-italia e
// del kit v2; react-aria solo dentro il pannello e il popover della pill del kit.
import type { ComponentProps, ReactNode, RefObject } from 'react';
import type { UltimoDato } from '../../../shared/lib';
import { Caricamento, PaginaConFiltri, PillDatiAl, TestaPagina, VistaQuery, Vuoto, VuotoConFiltri } from '../../../shared/ui';
import type { Briciola, ChipFiltro, StatoQuery } from '../../../shared/ui';
import type { PannelloAperto } from './usePannelloConFocus';
import { ValoriFiltriNonDisponibili } from './ValoriFiltriNonDisponibili';

/** La risposta di un report, per quanto serve all'impaginazione: le righe (il vuoto) e l'ultimo dato sincronizzato. */
export interface RispostaReportProgramma {
  righe?: readonly unknown[];
  ultimiDatiSincronizzati?: readonly UltimoDato[];
}

/**
 * Quanto serve della pagina: la regola dei filtri nell'indirizzo (useFiltriProgrammaNellIndirizzo), la lettura dei valori
 * dei filtri (null senza il suo grant) e il pannello col focus (usePannelloConFocus).
 */
export interface PaginaDelReport {
  inAttesa: boolean;
  chip: ChipFiltro[];
  togliTutti: () => void;
  valori: StatoQuery<unknown> | null;
  h1: RefObject<HTMLHeadingElement | null>;
  apri: (aperto: PannelloAperto) => void;
}

interface PropsPaginaReport<D extends RispostaReportProgramma> {
  pagina: PaginaDelReport;
  /** La lettura del report coi filtri della pagina. */
  stato: StatoQuery<D>;
  /** Le voci del percorso dopo Home. */
  briciole: readonly Briciola[];
  /** Titolo, titolo del documento, sottotitolo e la riga sotto (l'h1 col focus e' quello della pagina). */
  testa: Omit<ComponentProps<typeof TestaPagina>, 'refTitolo'>;
  /** Le pill a destra nella barra prima di "Dati al" (il perimetro, la pill della risposta), dalla risposta se c'e'. */
  pillDellaBarra: (d: D | undefined) => ReactNode;
  /** Il testo dello stato vuoto (coi filtri attivi o senza: lo sceglie la feature). */
  testoVuoto: string;
  /** Al posto del report quando la pagina non legge (es. la verifica SMP SIGC senza l'esercizio): un testo, nessuna lettura. */
  senzaLettura?: ReactNode;
  /** Fra lo stato dei valori dei filtri e il report (es. il selettore dell'anno o dell'esercizio). */
  sopra?: ReactNode;
  /** Il pannello dei filtri (dialogo laterale, dopo il main). */
  pannello: ReactNode;
  /** Il report della risposta (nuovo coi criteri nuovi: la chiave la da' la pagina). */
  children: (d: D) => ReactNode;
}

type PropsCorpo<D extends RispostaReportProgramma> = Pick<PropsPaginaReport<D>, 'stato' | 'senzaLettura' | 'children'> & { inAttesa: boolean; vuoto: ReactNode };

/** Il corpo (nell'avviso unico della pagina): il testo al posto del report, l'attesa del legame con le azioni, la lettura. */
function CorpoReport<D extends RispostaReportProgramma>({ stato, inAttesa, vuoto, senzaLettura, children }: PropsCorpo<D>) {
  if (senzaLettura !== undefined) return <Vuoto>{senzaLettura}</Vuoto>;
  // finche' non si sa se il filtro per azione si applica, il report non si legge (come nel finanziario, X-03)
  if (inAttesa) return <Caricamento testo="Verifica dei filtri in corso…" />;
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={vuoto}>
      {children}
    </VistaQuery>
  );
}

export function PaginaReportProgramma<D extends RispostaReportProgramma>({ pagina, stato, briciole, testa, pillDellaBarra, testoVuoto, senzaLettura, sopra, pannello, children }: PropsPaginaReport<D>) {
  const { inAttesa, chip, togliTutti, valori, h1, apri } = pagina;
  const destra = (
    <>
      {pillDellaBarra(stato.data)}
      <PillDatiAl voci={stato.data?.ultimiDatiSincronizzati} inErrore={stato.isError} />
    </>
  );
  const barra = { chip, onApri: () => apri('barra'), onTogliTutti: togliTutti, vuoto: 'Nessun filtro: tutti gli interventi', destra };
  const vuoto = <VuotoConFiltri onModifica={() => apri('vuoto')}>{testoVuoto}</VuotoConFiltri>;
  return (
    <PaginaConFiltri
      barra={barra}
      briciole={briciole}
      testa={{ ...testa, refTitolo: h1 }}
      sopra={
        <>
          <ValoriFiltriNonDisponibili letture={[valori]} h1={h1} />
          {sopra}
        </>
      }
      pannello={pannello}
    >
      <CorpoReport stato={stato} inAttesa={inAttesa} vuoto={vuoto} senzaLettura={senzaLettura}>
        {children}
      </CorpoReport>
    </PaginaConFiltri>
  );
}
