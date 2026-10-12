// PaginaFinanziario — impaginazione comune delle pagine del finanziario (UI v2, wireframe v2 approvati): barra dei filtri
// a chip con il pannello laterale, il perimetro e la data dell'ultimo dato, breadcrumb, titolo (h1 SEMPRE presente, che
// riceve il focus e da' il titolo al documento), un solo avviso d'errore per la pagina, contenuto. La semantica dei filtri
// e' della feature (useFiltriNellIndirizzo); qui solo l'impaginazione, il contesto che apre il pannello dallo stato vuoto e
// le righe della pagina nell'intestazione dei PNG dei grafici (filtri della barra, profilo, ultimo dato: NFR-50, V-01).
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ContestoFiltri, PANORAMICA, PannelloFiltri, PerimetroPill, UltimoAggiornamento, conFiltri, titoloH1, useFiltriNellIndirizzo, useRigheIntestazione, voceDi } from '../../../features/finanziario';
import type { Filtri } from '../../../features/finanziario';
import { AvvisoPagina, BarraFiltri, Caricamento, ContestoIntestazione, useFocusTitolo } from '../../../shared/ui';
import type { ChipFiltro } from '../../../shared/ui';

interface Briciola {
  etichetta: string;
  a?: string;
}

/** Home > Finanziario > voci della pagina: i link conservano la selezione dell'indirizzo, anche dal dettaglio (N-03). */
function Briciole({ voci, filtri }: { voci: Briciola[]; filtri: Filtri }) {
  return (
    <nav className="ui-briciole" aria-label="Percorso">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li aria-current={voci.length === 0 ? 'page' : undefined}>{voci.length === 0 ? 'Finanziario' : <Link to={conFiltri(PANORAMICA.percorso, filtri)}>Finanziario</Link>}</li>
        {voci.map((v, i) => (
          <li key={v.etichetta} aria-current={i === voci.length - 1 ? 'page' : undefined}>
            {v.a ? <Link to={conFiltri(v.a, filtri)}>{v.etichetta}</Link> : v.etichetta}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Titolo della pagina: l'h1 riceve il focus a ogni cambio di pagina e da' il titolo al documento. */
function TestaPagina({ titolo, titoloDocumento, sottotitolo, azioni }: { titolo: string; titoloDocumento: string; sottotitolo?: string; azioni?: ReactNode }) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${titoloDocumento} - Finanziario`);
  return (
    <div className="ui-titolo">
      <div>
        <h1 ref={h1} tabIndex={-1}>
          {titolo}
        </h1>
        {sottotitolo && <p>{sottotitolo}</p>}
      </div>
      {azioni && <div className="ui-titolo__azioni">{azioni}</div>}
    </div>
  );
}

interface PropsPagina {
  percorso: string;
  /** Falso dove i filtri del finanziario non si applicano (riserva, OP-FE-03). */
  conBarraFiltri?: boolean;
  /** Chip non rimovibili al posto dei filtri dell'indirizzo (es. l'intervento della pagina di dettaglio). */
  chipFissi?: ChipFiltro[];
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
function Testata({ percorso, briciole, titolo, titoloDocumento, sottotitolo, azioni, filtri }: Omit<PropsPagina, 'children' | 'conBarraFiltri' | 'chipFissi'> & { filtri: Filtri }) {
  const voce = voceDi(percorso);
  const catalogo = voce?.titolo ?? 'Finanziario';
  return (
    <>
      <Briciole voci={briciole ?? (percorso === PANORAMICA.percorso ? [] : [{ etichetta: catalogo }])} filtri={filtri} />
      <TestaPagina titolo={titolo ?? titoloH1(catalogo)} titoloDocumento={titoloDocumento ?? catalogo} sottotitolo={sottotitolo ?? voce?.sottotitolo} azioni={azioni} />
    </>
  );
}

/**
 * La modalita' della barra si decide una volta: i chip fissi (dettaglio), oppure i filtri dell'indirizzo con il pannello.
 * Restituisce anche le righe della pagina per l'intestazione dei PNG (i filtri della barra, NFR-50, review v3 V-01).
 */
function useBarraFiltri(conBarraFiltri: boolean, chipFissi: ChipFiltro[] | undefined) {
  const { filtri, inAttesa, chip, applica, togliTutti, conPannello } = useFiltriNellIndirizzo();
  const [aperto, setAperto] = useState(false);
  const pannelloAttivo = conBarraFiltri && conPannello && !chipFissi;
  const apriPannello = pannelloAttivo ? () => setAperto(true) : undefined;
  const barra = chipFissi ? { chip: chipFissi } : { chip, onApri: apriPannello, onTogliTutti: togliTutti };
  const righe = useRigheIntestazione((conBarraFiltri ? barra.chip : []).map((c) => `${c.etichetta}: ${c.valore}`));
  const pannello = pannelloAttivo ? { aperto, chiudi: () => setAperto(false), applica } : null;
  return { filtri, inAttesa: conBarraFiltri && inAttesa, barra, apriPannello, righe, pannello };
}

export function PaginaFinanziario({ conBarraFiltri = true, chipFissi, children, ...testata }: PropsPagina) {
  const { filtri, inAttesa, barra, apriPannello, righe, pannello } = useBarraFiltri(conBarraFiltri, chipFissi);
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
