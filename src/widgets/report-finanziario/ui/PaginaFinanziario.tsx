// PaginaFinanziario — impaginazione comune delle pagine del finanziario (UI v2, wireframe v2 approvati): barra dei filtri
// a chip con il pannello laterale, il perimetro e la data dell'ultimo dato, breadcrumb, titolo (h1 SEMPRE presente, che
// riceve il focus e da' il titolo al documento), contenuto. La semantica dei filtri e' della feature
// (useFiltriNellIndirizzo); qui solo l'impaginazione e il contesto che apre il pannello dallo stato vuoto.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ContestoFiltri, PANORAMICA, PannelloFiltri, PerimetroPill, UltimoAggiornamento, conFiltri, titoloH1, useFiltriNellIndirizzo, voceDi } from '../../../features/finanziario';
import type { Filtri } from '../../../features/finanziario';
import { BarraFiltri, useFocusTitolo } from '../../../shared/ui';
import type { ChipFiltro } from '../../../shared/ui';

export function PaginaFinanziario({
  percorso,
  conBarraFiltri = true,
  chipFissi,
  briciole,
  titolo,
  titoloDocumento,
  sottotitolo,
  azioni,
  children,
}: {
  percorso: string;
  /** Falso dove i filtri del finanziario non si applicano (riserva, OP-FE-03). */
  conBarraFiltri?: boolean;
  /** Chip non rimovibili al posto dei filtri dell'indirizzo (es. l'intervento della pagina di dettaglio). */
  chipFissi?: ChipFiltro[];
  /** Voci intermedie del percorso (dopo Home e Finanziario). */
  briciole?: Array<{ etichetta: string; a?: string }>;
  /** Testo dell'h1 al posto di quello del catalogo (es. la descrizione dell'intervento). */
  titolo?: string;
  /** Prima parte del titolo del documento, al posto del titolo del catalogo. */
  titoloDocumento?: string;
  sottotitolo?: string;
  azioni?: ReactNode;
  children: (filtri: Filtri) => ReactNode;
}) {
  const { filtri, chip, applica, togliTutti, conPannello } = useFiltriNellIndirizzo();
  const [pannello, setPannello] = useState(false);
  const voce = voceDi(percorso);
  const titoloCatalogo = voce?.titolo ?? 'Finanziario';
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${titoloDocumento ?? titoloCatalogo} - Finanziario`);
  const pannelloAttivo = conBarraFiltri && conPannello && !chipFissi;
  const voci = briciole ?? (percorso === PANORAMICA.percorso ? [] : [{ etichetta: titoloCatalogo }]);

  return (
    <ContestoFiltri.Provider value={pannelloAttivo ? () => setPannello(true) : null}>
      {conBarraFiltri && (
        <BarraFiltri
          chip={chipFissi ?? chip}
          onApri={pannelloAttivo ? () => setPannello(true) : undefined}
          onTogliTutti={chipFissi ? undefined : togliTutti}
          vuoto="Nessun filtro: tutti gli interventi del perimetro"
          destra={
            <>
              <PerimetroPill />
              <UltimoAggiornamento />
            </>
          }
        />
      )}
      <main className="ui-pagina" id="contenuto">
        <nav className="ui-briciole" aria-label="Percorso">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current={voci.length === 0 ? 'page' : undefined}>
              {voci.length === 0 ? 'Finanziario' : <Link to={conFiltri(PANORAMICA.percorso, chipFissi ? {} : filtri)}>Finanziario</Link>}
            </li>
            {voci.map((v, i) => (
              <li key={v.etichetta} aria-current={i === voci.length - 1 ? 'page' : undefined}>
                {v.a ? <Link to={v.a}>{v.etichetta}</Link> : v.etichetta}
              </li>
            ))}
          </ol>
        </nav>
        <div className="ui-titolo">
          <div>
            <h1 ref={h1} tabIndex={-1}>
              {titolo ?? titoloH1(titoloCatalogo)}
            </h1>
            {(sottotitolo ?? voce?.sottotitolo) && <p>{sottotitolo ?? voce?.sottotitolo}</p>}
          </div>
          {azioni && <div className="ui-titolo__azioni">{azioni}</div>}
        </div>
        {children(filtri)}
      </main>
      {pannelloAttivo && (
        <PannelloFiltri
          aperto={pannello}
          valori={filtri}
          onChiudi={() => setPannello(false)}
          onApplica={(f) => {
            setPannello(false);
            applica(f);
          }}
        />
      )}
    </ContestoFiltri.Provider>
  );
}
