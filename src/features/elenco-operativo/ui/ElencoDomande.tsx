// ElencoDomande — pagina /elenco-operativo/domande (flusso domande approvato, pattern interrogazione ADR 0029): barra dei
// filtri a chip con perimetro e data dell'ultimo dato, viste per ambito (colonne di partenza e indicatori, mai le righe:
// D-1, OP-EO-02; la vista resta tornando dalla scheda), sinottico sopra (TX-0057), tabella paginata e ordinata dal server
// (TX-0056) con la scelta delle colonne e i totali del sinottico nel piede, anteprima della riga e link alla scheda, file
// CSV e XLSX, link ai pagamenti delle stesse domande. I filtri si applicano dal vivo (debounce in useCriteri); durante
// l'aggiornamento restano i dati precedenti, dichiarati (aria-busy, avviso). Ordinamento e righe per pagina non spostano
// il focus; l'ordinamento attivo e' sempre detto in testo. Stati: caricamento, vuoto con "Modifica i filtri", pagina
// oltre l'ultima, errore dal problem-type (VistaQuery), accesso non disponibile senza il grant di TX-0056.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { plurale } from '../../../shared/lib';
import { AvvisoPagina, ContestoIntestazione, Paginazione, PulsantiScarica, TabellaServer, VistaQuery } from '../../../shared/ui';
import { useDomande, useSinottico } from '../api';
import type { DomandaElenco, PaginaDomande, SinotticoElenco } from '../api';
import { ETICHETTE_FILTRI, valoreLeggibile } from '../lib/chip';
import { percorsoPagamentiDelleDomande } from '../lib/collegamenti';
import {
  conDimensione,
  conPagina,
  conValore,
  criteriSinottico,
  dimensioneDi,
  ordinaPer,
  ordinamentoDi,
  ordinamentoPredefinito,
  paginaDi,
  senzaOrdinamento,
  testoOrdinamento,
  ultimaPagina,
} from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { testoAggregato, testoConteggio, testoSomma } from '../lib/formato';
import { TESTI_RIPARTIZIONE } from '../lib/grafici';
import type { Ripartizione } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { VISTE, vistaDi } from '../lib/viste';
import type { IdVista, Vista } from '../lib/viste';
import { AnteprimaDomanda } from './anteprime';
import { colonneDomande, titoloDelCampo } from './colonne';
import { AccessoNonDisponibile, AvvisoAggiornamento, BarraInterrogazione, OrdinamentoAttivo, PaginaOltreLUltima, VuotoFiltri } from './comuni';
import { avvisoLimite, scaricamentiElenco } from './esportazioni';
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
      <p className="form-text">La vista cambia le colonne di partenza e gli indicatori, non le domande.</p>
    </>
  );
}

/** La vista per ambito nello state della voce di history: resta cambiando i filtri e tornando dalla scheda (review v1
 *  X-04); non sta nell'indirizzo (OP-EO-02: un link condiviso apre la vista generale). */
function useVista(): [Vista, (v: IdVista) => void] {
  const { pathname, search, state } = useLocation();
  const naviga = useNavigate();
  const salvata = typeof state === 'object' && state !== null ? (state as { vista?: unknown }).vista : undefined;
  const vista = vistaDi(typeof salvata === 'string' ? salvata : null);
  const scegli = (v: IdVista) => void naviga({ pathname, search }, { replace: true, state: { ...((state ?? {}) as object), vista: v } });
  return [vista, scegli];
}

/**
 * Piede della tabella: totali del sinottico (intero insieme filtrato, dal server), mai somme delle righe della pagina. Con
 * il sinottico dei criteri precedenti le somme non si mostrano: il totale delle domande e' gia' quello nuovo (V-03).
 */
function piedeDomande(s: SinotticoElenco | undefined, totaleRighe: number, sinotticoAttuale: boolean): Partial<Record<string, ReactNode>> {
  const totale = `Totale dell'insieme filtrato: ${plurale(totaleRighe, 'domanda', 'domande')}`;
  if (!s) return { codiceABarre: totale };
  const testo = (valore: () => string) => (sinotticoAttuale ? valore() : 'in aggiornamento');
  return {
    codiceABarre: totale,
    richiesto: testo(() => testoSomma(s.richiesto).valore),
    ammesso: testo(() => testoSomma(s.ammesso).valore),
    pagato: testo(() => testoSomma(s.pagato).valore),
    ancoraDaPagare: testo(() => testoSomma(s.ancoraDaPagare).valore),
    liquidato: testo(() => testoAggregato(s.liquidato, 'liquidato').valore),
    recuperato: testo(() => testoAggregato(s.recuperato, 'recuperato').valore),
  };
}

interface PropsRisultati {
  pagina: PaginaDomande;
  criteri: Criteri;
  applica: (c: Criteri) => void;
  vista: Vista;
  sinottico: SinotticoElenco | undefined;
  sinotticoAttuale: boolean;
  aggiornando: boolean;
  conScheda: boolean;
}

function Risultati({ pagina, criteri, applica, vista, sinottico, sinotticoAttuale, aggiornando, conScheda }: PropsRisultati) {
  const [anteprima, setAnteprima] = useState<DomandaElenco | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const ordinamento = ordinamentoDi(criteri, 'domande');
  const totale = pagina.totaleRighe ?? 0;
  const ultima = ultimaPagina(totale, dimensioneDi(criteri));
  const limite = avvisoLimite('domande', totale);
  return (
    <section className="ui-card ui-risultati" aria-labelledby="t-elenco" aria-busy={aggiornando}>
      <div className="ui-card__testa">
        <h2 id="t-elenco" ref={titolo} tabIndex={-1}>
          Elenco delle domande
        </h2>
      </div>
      <AvvisoAggiornamento attivo={aggiornando} />
      <OrdinamentoAttivo
        testo={testoOrdinamento(titoloDelCampo('domande', ordinamento.campo), ordinamento)}
        predefinito={ordinamentoPredefinito(ordinamento, 'domande')}
        onPredefinito={() => applica(senzaOrdinamento(criteri))}
      />
      {paginaDi(criteri) > ultima && totale > 0 ? (
        <PaginaOltreLUltima pagina={paginaDi(criteri)} ultima={ultima} onUltima={() => applica(conPagina(criteri, ultima))} />
      ) : (
        <TabellaServer
          key={vista.id}
          caption={`Elenco operativo delle domande, vista ${vista.etichetta.toLowerCase()}: ordinabile dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima.`}
          colonne={colonneDomande(vista.colonne)}
          righe={pagina.righe ?? []}
          chiaveRiga={(d) => `${d.tipo ?? ''}-${d.codiceABarre ?? ''}`}
          ordinamento={ordinamento}
          // ordinare non sposta il focus: resta sull'intestazione, e il nuovo ordinamento lo dice OrdinamentoAttivo (X-02)
          onOrdina={(campo) => applica(ordinaPer(criteri, 'domande', campo))}
          onRiga={setAnteprima}
          etichettaRiga={(d) => `Apri l'anteprima della domanda ${d.codiceABarre ?? ''}`}
          piede={piedeDomande(sinottico, totale, sinotticoAttuale)}
          strumenti={
            <>
              <PulsantiScarica oggetto="l'elenco delle domande" scaricamenti={scaricamentiElenco('domande', criteri, totale)} />
              {limite && <p className="ui-nota w-100 mb-0">{limite}</p>}
            </>
          }
        />
      )}
      <Paginazione
        pagina={paginaDi(criteri)}
        dimensione={dimensioneDi(criteri)}
        totale={totale}
        oggetto="domande"
        onPagina={(p) => {
          applica(conPagina(criteri, p));
          titolo.current?.focus();
        }}
        // la dimensione cambia senza spostare il focus dalla select (WCAG 3.2.2)
        onDimensione={(d) => applica(conDimensione(criteri, d))}
      />
      <AnteprimaDomanda domanda={anteprima} onChiudi={() => setAnteprima(null)} conScheda={conScheda} />
    </section>
  );
}

/** Le letture della pagina, ognuna col suo grant (review v1 A-06): elenco (TX-0056) e sinottico (TX-0057). */
function useLettureDomande(criteri: Criteri, auth: ReturnType<typeof useInterrogazione>['auth']) {
  const conDomande = puoLeggere(auth, 'domande');
  const conSinottico = puoLeggere(auth, 'sinottico');
  const stato = useDomande(criteri, { abilitato: conDomande });
  const sinottico = useSinottico(criteriSinottico(criteri), { abilitato: conSinottico });
  return {
    stato,
    sinottico,
    conDomande,
    conSinottico,
    aggiornando: stato.isPlaceholderData && stato.isFetching,
    sinotticoInAggiornamento: sinottico.isPlaceholderData && sinottico.isFetching,
    // il perimetro dalla lettura sempre presente (TX-0056), il sinottico solo come ripiego (review v1 A-08)
    perimetro: stato.data?.perimetro ?? sinottico.data?.perimetro,
  };
}

/** Il filtro aggiunto dal grafico, detto in una regione role=status sempre presente (review v1 V-18). */
function useFiltroDalGrafico(i: ReturnType<typeof useInterrogazione>) {
  const [annuncio, setAnnuncio] = useState('');
  const filtra = (r: Ripartizione, valore: string) => {
    const nome = TESTI_RIPARTIZIONE[r].filtro;
    i.applicaRitardato(conValore(i.criteriVisti, nome, valore));
    setAnnuncio(`Filtro aggiunto: ${ETICHETTE_FILTRI[nome]} ${valoreLeggibile(nome, valore, i.valori?.data)}.`);
  };
  return { annuncio, filtra };
}

function Contenuto({ i, l, vista, onFiltra }: { i: ReturnType<typeof useInterrogazione>; l: ReturnType<typeof useLettureDomande>; vista: Vista; onFiltra: (r: Ripartizione, valore: string) => void }) {
  return (
    <AvvisoPagina>
      {l.conSinottico && (
        <VistaQuery stato={l.sinottico}>{(s) => <SinotticoDomande sinottico={s} vista={vista} inAggiornamento={l.sinotticoInAggiornamento} onFiltra={onFiltra} />}</VistaQuery>
      )}
      {l.conDomande ? (
        <VistaQuery stato={l.stato} eVuoto={(d) => (d.totaleRighe ?? 0) === 0} vuoto={<VuotoFiltri testo="Nessuna domanda per questi filtri." onApriFiltri={i.pannello.apri} />}>
          {(pagina) => (
            <Risultati
              pagina={pagina}
              criteri={i.criteri}
              applica={i.applica}
              vista={vista}
              sinottico={l.sinottico.data}
              sinotticoAttuale={!l.sinotticoInAggiornamento}
              aggiornando={l.aggiornando}
              conScheda={puoLeggere(i.auth, 'dettaglio')}
            />
          )}
        </VistaQuery>
      ) : (
        <AccessoNonDisponibile cosa="l'elenco delle domande" />
      )}
    </AvvisoPagina>
  );
}

function Pannello({ i, l }: { i: ReturnType<typeof useInterrogazione>; l: ReturnType<typeof useLettureDomande> }) {
  const { stato } = l;
  return (
    <PannelloFiltriElenco
      aperto={i.pannello.aperto}
      onChiudi={i.pannello.chiudi}
      elenco="domande"
      criteri={i.criteriVisti}
      applica={i.applicaRitardato}
      valori={i.valori}
      errori={[l.sinottico.error, stato.error].filter((e) => e != null)}
      conteggio={testoConteggio(stato.data?.totaleRighe, ['domanda', 'domande'], {
        inAggiornamento: i.inAttesa || l.aggiornando || (stato.isFetching && !stato.data),
        inErrore: stato.isError,
      })}
      onAzzera={i.togliTutti}
    />
  );
}

export function ElencoDomande() {
  const [vista, setVista] = useVista();
  const i = useInterrogazione('domande');
  const l = useLettureDomande(i.criteri, i.auth);
  const righe = useRigheContesto(i.filtriApplicati, i.auth?.user?.profile, l.sinottico.data?.ultimiDatiSincronizzati, l.perimetro);
  const grafico = useFiltroDalGrafico(i);
  return (
    <>
      <BarraInterrogazione
        chip={i.chip}
        onApri={i.pannello.apri}
        onTogliTutti={i.togliTutti}
        vuoto="Nessun filtro: tutte le domande del perimetro"
        perimetro={l.perimetro}
        ultimi={l.sinottico.data?.ultimiDatiSincronizzati}
        ultimiInErrore={l.sinottico.isError}
      />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Domande' }]} />
        <TestaPagina
          titolo="Elenco operativo delle domande"
          titoloDocumento="Domande"
          sottotitolo="Interroga le domande di sostegno e di pagamento: ogni filtro cambia subito risultati, sinottico e totali. L'indirizzo della pagina conserva la ricerca e si può condividere."
          azioni={
            puoLeggere(i.auth, 'pagamenti') ? (
              <Link className="btn btn-outline-primary" to={percorsoPagamentiDelleDomande(i.criteri)}>
                Vedi i pagamenti di queste domande
              </Link>
            ) : undefined
          }
        />
        <SceltaVista vista={vista} onVista={setVista} />
        <p className="visually-hidden" role="status">
          {grafico.annuncio}
        </p>
        <ContestoIntestazione.Provider value={righe}>
          <Contenuto i={i} l={l} vista={vista} onFiltra={grafico.filtra} />
        </ContestoIntestazione.Provider>
      </main>
      <Pannello i={i} l={l} />
    </>
  );
}
