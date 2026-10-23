// PaginaProcedurale — l'impaginazione comune delle pagine di report del procedurale (wireframe approvati del 22/10/2026),
// sull'impaginazione del kit (PaginaConFiltri): la barra dei filtri a chip col pannello (voci da TX-0024 e TX-0025), le
// pill del perimetro della risposta (REGIONALE o ADA del P4), del filtro per stato che non si applica (Unit Amount) e
// "Dati al" (ultimiDatiSincronizzati di TX-0024, G3: senza il suo grant la pill non c'e', in errore e' "non
// disponibile"); il percorso Home > Procedurale > pagina; un solo h1 col focus e il titolo del documento; lo stato dei
// valori dei filtri non disponibili (TX-0024 o TX-0025 in errore, Riprova); il corpo nell'avviso unico della pagina; le
// righe di contesto del PNG dei grafici (NFR-50) coi criteri che la pagina applica alle sue letture. Classi
// bootstrap-italia e del kit v2; react-aria solo dentro il pannello e il popover della pill del kit.
import type { ReactNode } from 'react';
import { ValoriFiltriNonDisponibili } from '../../../entities/filtri';
import { testoPerimetro } from '../../../shared/lib';
import { ContestoIntestazione, PaginaConFiltri, PillDatiAl, useRigheContesto } from '../../../shared/ui';
import { testiCriteri } from '../lib/criteri';
import type { Perimetro } from '../lib/dto';
import { STATO_NON_APPLICATO } from '../lib/formato';
import type { TipoPerimetro } from '../lib/formato';
import { PillPerimetro } from './comuni';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriProcedurale } from './PannelloFiltriProcedurale';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

interface PropsPaginaProcedurale {
  pagina: PaginaDeiCriteri;
  /** La voce del percorso dopo "Procedurale"; assente nella panoramica, che e' l'ingresso dell'area. */
  briciola?: string;
  titolo: string;
  titoloDocumento: string;
  sottotitolo: string;
  nota?: ReactNode;
  /** Il perimetro delle risposte della pagina (assente finche' non ne arriva una). */
  perimetro: Perimetro | undefined;
  tipoPerimetro: TipoPerimetro;
  /** I codici degli interventi della risposta: le voci di Intervento del pannello senza TX-0024. */
  codiciRisposta: readonly string[];
  children: ReactNode;
}

/** Perimetro, filtro per stato non applicato (Unit Amount) e "Dati al", a destra nella barra. */
function PillDellaBarra({ pagina, perimetro, tipoPerimetro }: Pick<PropsPaginaProcedurale, 'pagina' | 'perimetro' | 'tipoPerimetro'>) {
  const valori = pagina.valori;
  return (
    <>
      <PillPerimetro perimetro={perimetro} tipo={tipoPerimetro} />
      {pagina.forma === 'senzaStato' && <span className="ui-pill">{STATO_NON_APPLICATO}</span>}
      {valori && <PillDatiAl voci={valori.data?.ultimiDatiSincronizzati} inErrore={valori.isError} />}
    </>
  );
}

/** Le righe di contesto del PNG: i criteri applicati alle letture (senza lo stato per le Unit Amount), perimetro, ultimo dato. */
function useContesto(pagina: PaginaDeiCriteri, perimetro: Perimetro | undefined): readonly string[] {
  const criteri = testiCriteri(pagina.filtri, pagina.statiArea?.data?.valori, pagina.forma !== 'senzaStato');
  return useRigheContesto(criteri, pagina.valori?.data?.ultimiDatiSincronizzati, perimetro ? testoPerimetro(perimetro) : null);
}

export function PaginaProcedurale({ pagina, briciola, titolo, titoloDocumento, sottotitolo, nota, perimetro, tipoPerimetro, codiciRisposta, children }: PropsPaginaProcedurale) {
  const { filtri, chip, togliTutti, h1, pannello, apri, chiudi, onApplica } = pagina;
  const ingresso = useIngressoArea(filtri);
  const briciole = briciola === undefined ? [{ etichetta: 'Procedurale' }] : [{ etichetta: 'Procedurale', a: ingresso }, { etichetta: briciola }];
  const barra = { chip, onApri: () => apri('barra'), onTogliTutti: togliTutti, vuoto: 'Nessun filtro: tutti gli interventi', destra: <PillDellaBarra pagina={pagina} perimetro={perimetro} tipoPerimetro={tipoPerimetro} /> };
  const contesto = useContesto(pagina, perimetro);
  const pannelloFiltri = <PannelloFiltriProcedurale aperto={pannello !== null} forma={pagina.forma} criteri={filtri} valori={pagina.valori} statiArea={pagina.statiArea} codiciRisposta={codiciRisposta} onApplica={onApplica} onChiudi={chiudi} />;
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <PaginaConFiltri barra={barra} briciole={briciole} testa={{ titolo, titoloDocumento, sottotitolo, nota, refTitolo: h1 }} sopra={<ValoriFiltriNonDisponibili letture={[pagina.valori, pagina.statiArea]} h1={h1} />} pannello={pannelloFiltri}>
        {children}
      </PaginaConFiltri>
    </ContestoIntestazione.Provider>
  );
}
