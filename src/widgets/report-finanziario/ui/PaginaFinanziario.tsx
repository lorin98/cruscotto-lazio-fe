// PaginaFinanziario — impaginazione comune delle pagine del finanziario (UI v2, wireframe v2 approvati): barra dei filtri
// a chip con il pannello laterale, il perimetro e la data dell'ultimo dato, breadcrumb, titolo (h1 SEMPRE presente, che
// riceve il focus e da' il titolo al documento), un solo avviso d'errore per la pagina, contenuto. La semantica dei filtri
// e' della feature (useFiltriNellIndirizzo); qui solo l'impaginazione, il contesto che apre il pannello dallo stato vuoto e
// le righe della pagina nell'intestazione dei PNG dei grafici (filtri della barra, profilo, ultimo dato: NFR-50, V-01).
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ContestoFiltri, PANORAMICA, PannelloFiltri, PerimetroPill, UltimoAggiornamento, conFiltri, titoloH1, useFiltriNellIndirizzo, useRigheIntestazione, voceDi } from '../../../features/finanziario';
import type { Filtri } from '../../../features/finanziario';
import { AvvisoPagina, BarraFiltri, Briciole as BricioleKit, Caricamento, ContestoIntestazione, TestaPagina } from '../../../shared/ui';
import type { Briciola, ChipFiltro } from '../../../shared/ui';

/**
 * Home > Finanziario > voci della pagina, sulla testata comune del kit: i link conservano la selezione dell'indirizzo,
 * anche dal dettaglio (N-03); lo state di una voce (es. lo stato del riepilogo da ritrovare, review v4 X-04) resta.
 */
function Briciole({ voci, filtri }: { voci: Briciola[]; filtri: Filtri }) {
  const area: Briciola = { etichetta: 'Finanziario', a: voci.length === 0 ? undefined : conFiltri(PANORAMICA.percorso, filtri) };
  return <BricioleKit voci={[area, ...voci.map((v) => ({ ...v, a: v.a ? conFiltri(v.a, filtri) : undefined }))]} />;
}

interface PropsPagina {
  percorso: string;
  /** Falso dove i filtri del finanziario non si applicano (riserva, OP-FE-03). */
  conBarraFiltri?: boolean;
  /** Chip non rimovibili al posto dei filtri dell'indirizzo (es. l'intervento della pagina di dettaglio). */
  chipFissi?: ChipFiltro[];
  /** Parametri di pagina fuori dalla barra (es. "Anno: 2025"), fra i filtri applicati dell'intestazione dei PNG (N-02). */
  parametri?: readonly string[];
  /** Voci intermedie del percorso (dopo Home e Finanziario). */
  briciole?: Briciola[];
  /** Testo dell'h1 al posto di quello del catalogo (es. la descrizione dell'intervento). */
  titolo?: string;
  /** Prima parte del titolo del documento, al posto del titolo del catalogo. */
  titoloDocumento?: string;
  sottotitolo?: string;
  azioni?: ReactNode;
  children: (filtri: Filtri) => ReactNode;
}

/** Briciole e titolo dal catalogo dei report, con le sostituzioni della pagina. */
function Testata({ percorso, briciole, titolo, titoloDocumento, sottotitolo, azioni, filtri }: Omit<PropsPagina, 'children' | 'conBarraFiltri' | 'chipFissi' | 'parametri'> & { filtri: Filtri }) {
  const voce = voceDi(percorso);
  const catalogo = voce?.titolo ?? 'Finanziario';
  return (
    <>
      <Briciole voci={briciole ?? (percorso === PANORAMICA.percorso ? [] : [{ etichetta: catalogo }])} filtri={filtri} />
      <TestaPagina titolo={titolo ?? titoloH1(catalogo)} titoloDocumento={`${titoloDocumento ?? catalogo} - Finanziario`} sottotitolo={sottotitolo ?? voce?.sottotitolo} azioni={azioni} />
    </>
  );
}

/**
 * La modalita' della barra si decide una volta: i chip fissi (dettaglio), oppure i filtri dell'indirizzo con il pannello.
 * Restituisce anche le righe della pagina per l'intestazione dei PNG: i filtri della barra e i parametri della pagina
 * (anno della riserva), come i filtri applicati dei file del backend (NFR-50, V-01, N-02).
 */
function useBarraFiltri(conBarraFiltri: boolean, chipFissi: ChipFiltro[] | undefined, parametri: readonly string[]) {
  const { filtri, inAttesa, chip, applica, togliTutti, conPannello } = useFiltriNellIndirizzo();
  const [aperto, setAperto] = useState(false);
  const pannelloAttivo = conBarraFiltri && conPannello && !chipFissi;
  const apriPannello = pannelloAttivo ? () => setAperto(true) : undefined;
  const barra = chipFissi ? { chip: chipFissi } : { chip, onApri: apriPannello, onTogliTutti: togliTutti };
  const righe = useRigheIntestazione([...(conBarraFiltri ? barra.chip : []).map((c) => `${c.etichetta}: ${c.valore}`), ...parametri]);
  const pannello = pannelloAttivo ? { aperto, chiudi: () => setAperto(false), applica } : null;
  return { filtri, inAttesa: conBarraFiltri && inAttesa, barra, apriPannello, righe, pannello };
}

export function PaginaFinanziario({ conBarraFiltri = true, chipFissi, parametri = [], children, ...testata }: PropsPagina) {
  const { filtri, inAttesa, barra, apriPannello, righe, pannello } = useBarraFiltri(conBarraFiltri, chipFissi, parametri);
  return (
    <ContestoFiltri.Provider value={apriPannello ?? null}>
      {conBarraFiltri && <BarraFiltri {...barra} vuoto="Nessun filtro: tutti gli interventi del perimetro" destra={<PillDellaBarra />} />}
      <main className="ui-pagina" id="contenuto">
        <Testata {...testata} filtri={filtri} />
        <ContestoIntestazione.Provider value={righe}>
          {/* finche' non si sa se il filtro per azione si applica, i report non leggono (X-03) */}
          <AvvisoPagina>{inAttesa ? <Caricamento testo="Verifica dei filtri in corso…" /> : children(filtri)}</AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      {pannello && (
        <PannelloFiltri
          aperto={pannello.aperto}
          valori={filtri}
          onChiudi={pannello.chiudi}
          onApplica={(f) => {
            pannello.chiudi();
            pannello.applica(f);
          }}
        />
      )}
    </ContestoFiltri.Provider>
  );
}

function PillDellaBarra() {
  return (
    <>
      <PerimetroPill />
      <UltimoAggiornamento />
    </>
  );
}
