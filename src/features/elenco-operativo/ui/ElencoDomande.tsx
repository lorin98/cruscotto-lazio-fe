// ElencoDomande — pagina /elenco-operativo/domande (flusso domande approvato, pattern interrogazione ADR 0029): barra dei
// filtri a chip con perimetro e data dell'ultimo dato, viste per ambito (colonne e indicatori, mai le righe: D-1,
// OP-EO-02), sinottico sopra (TX-0057), tabella paginata e ordinata dal server (TX-0056) con i totali del sinottico nel
// piede, anteprima della riga e link alla scheda, file CSV e XLSX, link ai pagamenti delle stesse domande. I filtri si
// applicano dal vivo; durante l'aggiornamento restano i dati precedenti (aria-busy). Stati: caricamento, vuoto con
// "Modifica i filtri", errore dal problem-type (VistaQuery).
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatNumber, plurale } from '../../../shared/lib';
import { AvvisoPagina, ContestoIntestazione, Paginazione, PulsantiScarica, TabellaServer, VistaQuery } from '../../../shared/ui';
import { useDomande, useSinottico } from '../api';
import type { DomandaElenco, SinotticoElenco } from '../api';
import { percorsoPagamentiDelleDomande } from '../lib/collegamenti';
import { conDimensione, conPagina, conValore, criteriSinottico, dimensioneDi, ordinaPer, ordinamentoDi, paginaDi } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { testoSomma } from '../lib/formato';
import { TESTI_RIPARTIZIONE } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { VISTE, vistaDi } from '../lib/viste';
import type { IdVista, Vista } from '../lib/viste';
import { AnteprimaDomanda } from './anteprime';
import { colonneDomande } from './colonne';
import { AvvisoAggiornamento, BarraInterrogazione, VuotoFiltri } from './comuni';
import { scaricamentiElenco } from './esportazioni';
import { PannelloFiltriElenco } from './PannelloFiltriElenco';
import { SinotticoDomande } from './SinotticoDomande';
import { Briciole, TestaPagina } from './testata';
import { useInterrogazione, useRigheContesto } from './useInterrogazione';

function SceltaVista({ vista, onVista }: { vista: Vista; onVista: (v: IdVista) => void }) {
  return (
    <>
      <div className="ui-viste" role="group" aria-label="Viste per ambito">
        {VISTE.map((v) => (
          <button key={v.id} type="button" className="ui-toggle-chip" aria-pressed={v.id === vista.id} onClick={() => onVista(v.id)}>
            {`Vista: ${v.etichetta.toLowerCase()}`}
          </button>
        ))}
      </div>
      <p className="form-text">La vista cambia colonne e indicatori, non le domande.</p>
    </>
  );
}

/** Piede della tabella: totali del sinottico (intero insieme filtrato, dal server), mai somme delle righe della pagina. */
function piedeDomande(s: SinotticoElenco | undefined, totaleRighe: number): Partial<Record<string, ReactNode>> {
  const somma = (x: SinotticoElenco['richiesto']) => (s ? testoSomma(x).valore : '');
  return {
    codiceABarre: `Totale dell'insieme filtrato: ${plurale(totaleRighe, 'domanda', 'domande')}`,
    richiesto: somma(s?.richiesto),
    ammesso: somma(s?.ammesso),
    pagato: somma(s?.pagato),
    ancoraDaPagare: somma(s?.ancoraDaPagare),
    liquidato: s ? testoSomma({ totale: s.liquidato }).valore : '',
    recuperato: s ? testoSomma({ totale: s.recuperato }).valore : '',
  };
}

function Risultati({ criteri, applica, vista, sinottico, onApriFiltri }: { criteri: Criteri; applica: (c: Criteri) => void; vista: Vista; sinottico: SinotticoElenco | undefined; onApriFiltri?: () => void }) {
  const stato = useDomande(criteri);
  const [anteprima, setAnteprima] = useState<DomandaElenco | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const aggiornando = stato.isPlaceholderData && stato.isFetching;
  const vaiA = (c: Criteri) => {
    applica(c);
    titolo.current?.focus();
  };
  return (
    <section className="ui-card ui-risultati" aria-labelledby="t-elenco" aria-busy={aggiornando}>
      <div className="ui-card__testa">
        <h2 id="t-elenco" ref={titolo} tabIndex={-1}>
          Elenco delle domande
        </h2>
      </div>
      <AvvisoAggiornamento attivo={aggiornando} />
      <VistaQuery
        stato={stato}
        eVuoto={(d) => (d.totaleRighe ?? 0) === 0}
        vuoto={<VuotoFiltri testo="Nessuna domanda per questi filtri." onApriFiltri={onApriFiltri} />}
      >
        {(pagina) => (
          <>
            <TabellaServer
              caption={`Elenco operativo delle domande, vista ${vista.etichetta.toLowerCase()}: ordinabile dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima.`}
              colonne={colonneDomande(vista.colonne)}
              righe={pagina.righe ?? []}
              chiaveRiga={(d) => `${d.tipo ?? ''}-${d.codiceABarre ?? ''}`}
              ordinamento={ordinamentoDi(criteri, 'domande')}
              onOrdina={(campo) => vaiA(ordinaPer(criteri, 'domande', campo))}
              onRiga={setAnteprima}
              etichettaRiga={(d) => `Apri l'anteprima della domanda ${d.codiceABarre ?? ''}`}
              piede={piedeDomande(sinottico, pagina.totaleRighe ?? 0)}
              strumenti={<PulsantiScarica oggetto="l'elenco delle domande" scaricamenti={scaricamentiElenco('domande', criteri)} />}
            />
            <Paginazione
              pagina={paginaDi(criteri)}
              dimensione={dimensioneDi(criteri)}
              totale={pagina.totaleRighe ?? 0}
              oggetto="domande"
              onPagina={(p) => vaiA(conPagina(criteri, p))}
              onDimensione={(d) => vaiA(conDimensione(criteri, d))}
            />
          </>
        )}
      </VistaQuery>
      <AnteprimaDomanda domanda={anteprima} onChiudi={() => setAnteprima(null)} />
    </section>
  );
}

function conteggioDal(sinottico: SinotticoElenco | undefined, inCorso: boolean): string {
  if (sinottico?.domande === undefined) return inCorso ? 'Conteggio in corso…' : 'Conteggio non disponibile';
  return `${formatNumber(sinottico.domande)} ${sinottico.domande === 1 ? 'domanda' : 'domande'} con questi filtri`;
}

export function ElencoDomande() {
  const [idVista, setIdVista] = useState<IdVista>('generale');
  const vista = vistaDi(idVista);
  const { criteri, applica, chip, filtriApplicati, togliTutti, pannello, auth } = useInterrogazione('domande');
  const conSinottico = puoLeggere(auth, 'sinottico');
  const sinottico = useSinottico(criteriSinottico(criteri), { abilitato: conSinottico });
  const righe = useRigheContesto(filtriApplicati, auth?.user?.profile, sinottico.data?.ultimiDatiSincronizzati);
  const conPagamenti = puoLeggere(auth, 'pagamenti');
  return (
    <>
      <BarraInterrogazione
        chip={chip}
        onApri={pannello.apri}
        onTogliTutti={togliTutti}
        vuoto="Nessun filtro: tutte le domande del perimetro"
        perimetro={sinottico.data?.perimetro}
        ultimi={sinottico.data?.ultimiDatiSincronizzati}
      />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Domande' }]} />
        <TestaPagina
          titolo="Elenco operativo delle domande"
          titoloDocumento="Domande"
          sottotitolo="Interroga le domande di sostegno e di pagamento: ogni filtro cambia subito risultati, sinottico e totali. L'indirizzo della pagina conserva la ricerca e si può condividere."
          azioni={
            conPagamenti ? (
              <Link className="btn btn-outline-primary" to={percorsoPagamentiDelleDomande(criteri)}>
                Vedi i pagamenti di queste domande
              </Link>
            ) : undefined
          }
        />
        <SceltaVista vista={vista} onVista={setIdVista} />
        <ContestoIntestazione.Provider value={righe}>
          <AvvisoPagina>
            {conSinottico && (
              <VistaQuery stato={sinottico}>
                {(s) => <SinotticoDomande sinottico={s} vista={vista} onFiltra={(r, valore) => applica(conValore(criteri, TESTI_RIPARTIZIONE[r].filtro, valore))} />}
              </VistaQuery>
            )}
            <Risultati criteri={criteri} applica={applica} vista={vista} sinottico={sinottico.data} onApriFiltri={pannello.apri} />
          </AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      <PannelloFiltriElenco
        aperto={pannello.aperto}
        onChiudi={pannello.chiudi}
        elenco="domande"
        criteri={criteri}
        applica={applica}
        conteggio={conteggioDal(sinottico.data, sinottico.isFetching)}
        onAzzera={togliTutti}
      />
    </>
  );
}
