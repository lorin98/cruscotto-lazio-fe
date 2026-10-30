// PaginaReport — l'impaginazione comune delle due pagine del fisico venute col riallineamento degli ambiti del 29/10/2026,
// l'output regionale (dall'istituzionale) e le Unit Amount (dal procedurale), sull'impaginazione delle pagine con la barra
// dei filtri del kit (PaginaConFiltri). La pagina tiene i filtri con useFiltriDellaPagina, legge il suo report e passa qui
// solo cio' che cambia: i testi della testata, la pill della risposta, il testo dello stato vuoto, i codici degli
// interventi della risposta e il report. Qui: i chip e le pill del perimetro della risposta (sempre regionale), della
// risposta e "Dati al" (ultimiDatiSincronizzati della risposta, G3); il percorso; lo stato dei valori dei filtri non
// disponibili; le righe di contesto dei PNG (NFR-50); il corpo (l'attesa del legame con le azioni, la lettura, il vuoto
// con "Modifica i filtri": coi criteri cambiati dal pannello il focus va sull'h1); il pannello dei filtri del programma con le voci di TX-0060 (senza l'azione
// portante per le Unit Amount). Le superfici hanno la loro impaginazione (con la campagna). Classi bootstrap-italia e del
// kit v2; react-aria solo dentro il pannello e il popover della pill del kit.
import type { ReactNode } from 'react';
import { PannelloFiltriProgramma, ValoriFiltriNonDisponibili } from '../../../entities/filtri';
import type { Filtri } from '../../../entities/filtri';
import { testoPerimetro } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import { Caricamento, ContestoIntestazione, PaginaConFiltri, PillDatiAl, VistaQuery, VuotoConFiltri, useRigheContesto } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { conFiltriDelProgramma, testiCriteri } from '../lib/criteri';
import { PERCORSI } from '../lib/pagine';
import type { FiltriDellaPagina } from './useFiltriNellIndirizzo';

const NOTA_PANNELLO = "Voci di Intervento, obiettivi e azioni portanti da TX-0060 dell'elenco operativo (valori regionali).";
const NOTA_PANNELLO_SENZA_AZIONE = "Voci di Intervento e obiettivi da TX-0060 dell'elenco operativo (valori regionali); le Unit Amount non si filtrano per azione portante.";

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

/** Perimetro (sempre regionale), la pill della risposta e l'ultimo dato sincronizzato, a destra nella barra. */
function PillDellaBarra<D extends RispostaReport>({ d, inErrore, pill }: { d: D | undefined; inErrore: boolean; pill?: (d: D) => string }) {
  return (
    <>
      {d?.perimetro && <span className="ui-pill">{`Perimetro: ${testoPerimetro(d.perimetro)}`}</span>}
      {d && pill && <span className="ui-pill">{pill(d)}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

export function PaginaReport<D extends RispostaReport>({ pagina, stato, briciola, titolo, titoloDocumento, sottotitolo, titoloPannello, pill, testoVuoto, codiciRisposta, children }: PropsPagina<D>) {
  const { filtri, inAttesa, chip, togliTutti, valori, senzaAzione, h1, pannello, apri, chiudi, onApplica } = pagina;
  // righe di contesto del PNG dei grafici (NFR-50, hook del kit): filtri applicati, perimetro, profilo, ultimo dato
  const d = stato.data;
  const contesto = useRigheContesto(testiCriteri(filtri), d?.ultimiDatiSincronizzati, d?.perimetro ? testoPerimetro(d.perimetro) : null);
  const vuoto = <VuotoConFiltri onModifica={() => apri('vuoto')}>{testoVuoto(conFiltriDelProgramma(filtri))}</VuotoConFiltri>;
  const barra = { chip, onApri: () => apri('barra'), onTogliTutti: togliTutti, vuoto: 'Nessun filtro: tutti gli interventi', destra: <PillDellaBarra d={stato.data} inErrore={stato.isError} pill={pill} /> };
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
      nota={senzaAzione ? NOTA_PANNELLO_SENZA_AZIONE : NOTA_PANNELLO}
      senzaAzione={senzaAzione}
    />
  );
  return (
    <PaginaConFiltri
      barra={barra}
      briciole={[{ etichetta: 'Fisico', a: PERCORSI.superfici }, { etichetta: briciola }]}
      testa={{ titolo, titoloDocumento, sottotitolo, refTitolo: h1 }}
      sopra={<ValoriFiltriNonDisponibili letture={[valori]} h1={h1} />}
      pannello={pannelloFiltri}
    >
      <ContestoIntestazione.Provider value={contesto}>
        {/* finche' non si sa se il filtro per azione si applica, il report non si legge (come nel finanziario, X-03) */}
        {inAttesa ? (
          <Caricamento testo="Verifica dei filtri in corso…" />
        ) : (
          <VistaQuery stato={stato} eVuoto={(r) => (r.righe ?? []).length === 0} vuoto={vuoto}>
            {children}
          </VistaQuery>
        )}
      </ContestoIntestazione.Provider>
    </PaginaConFiltri>
  );
}
