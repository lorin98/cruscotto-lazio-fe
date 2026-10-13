// ElencoDomande — pagina /elenco-operativo/domande (flusso domande approvato, pattern interrogazione ADR 0029): barra dei
// filtri a chip con perimetro e data dell'ultimo dato, viste per ambito (colonne di partenza e indicatori, mai le righe:
// D-1, OP-EO-02; vista e colonne scelte restano tornando dalla scheda), sinottico sopra (TX-0057), tabella paginata e
// ordinata dal server (TX-0056) con la scelta delle colonne e i totali del sinottico nel piede, anteprima della riga e
// link alla scheda, file CSV e XLSX, link ai pagamenti delle stesse domande. I filtri si applicano dal vivo (debounce in
// useCriteri); durante l'aggiornamento restano i dati precedenti, dichiarati (aria-busy, avviso). Lo scheletro dei
// risultati e del pannello e' comune ai pagamenti (interrogazione.tsx). Stati: caricamento, vuoto con "Modifica i
// filtri", pagina oltre l'ultima, errore dal problem-type (VistaQuery), accesso non disponibile senza il grant di TX-0056.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { plurale } from '../../../shared/lib';
import { AvvisoPagina, ContestoIntestazione, VistaQuery } from '../../../shared/ui';
import { useDomande, useSinottico } from '../api';
import type { SinotticoElenco } from '../api';
import { ETICHETTE_FILTRI, valoreLeggibile } from '../lib/chip';
import { percorsoPagamentiDelleDomande } from '../lib/collegamenti';
import { conValore, criteriSinottico } from '../lib/criteri';
import type { Criteri, NomeFiltro } from '../lib/criteri';
import { testoAggregato, testoSomma } from '../lib/formato';
import { TESTI_RIPARTIZIONE } from '../lib/grafici';
import type { Ripartizione } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { VISTE, vistaDi } from '../lib/viste';
import type { IdVista, Vista } from '../lib/viste';
import { AnteprimaDomanda } from './anteprime';
import { colonneDomande } from './colonne';
import { AccessoNonDisponibile, BarraInterrogazione, VuotoFiltri } from './comuni';
import { PannelloInterrogazione, RisultatiInterrogazione, useScelteElenco } from './interrogazione';
import type { Interrogazione } from './interrogazione';
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

/** Le letture della pagina, ognuna col suo grant (review v1 A-06): elenco (TX-0056) e sinottico (TX-0057). */
function useLettureDomande(criteri: Criteri, auth: Interrogazione['auth']) {
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

/**
 * Il filtro aggiunto dal grafico, detto in una regione role=status sempre presente (review v1 V-18). L'annuncio si
 * rimonta a ogni filtro (anche lo stesso di prima: si ripete, review v2 X-03) e si spegne quando il filtro si toglie.
 */
function useFiltroDalGrafico(i: Interrogazione) {
  const [annuncio, setAnnuncio] = useState<{ n: number; nome: NomeFiltro; valore: string; testo: string } | null>(null);
  const filtra = (r: Ripartizione, valore: string) => {
    const nome = TESTI_RIPARTIZIONE[r].filtro;
    i.applicaRitardato(conValore(i.criteriVisti, nome, valore));
    setAnnuncio((a) => ({ n: (a?.n ?? 0) + 1, nome, valore, testo: `Filtro aggiunto: ${ETICHETTE_FILTRI[nome]} ${valoreLeggibile(nome, valore, i.valori?.data)}.` }));
  };
  const attivo = annuncio !== null && (i.criteriVisti[annuncio.nome] ?? []).includes(annuncio.valore);
  const regione = (
    <p className="visually-hidden" role="status">
      {attivo && <span key={annuncio.n}>{annuncio.testo}</span>}
    </p>
  );
  return { regione, filtra };
}

/**
 * Con le chiavi dei report procedurali (statoSostegno, statoPagamento) lo stato SIAN vale in alternativa (OR, D-02 del
 * backend): un clic sul grafico per stato allargherebbe l'insieme. Il clic si spegne e lo si dice (review v2 X-04).
 */
const conChiaviDeiReport = (c: Criteri) => (c.statoSostegno?.length ?? 0) + (c.statoPagamento?.length ?? 0) > 0;

function Contenuto({ i, l, vista, nascoste, onNascoste, onFiltra }: { i: Interrogazione; l: ReturnType<typeof useLettureDomande>; vista: Vista; nascoste: string[] | undefined; onNascoste: (n: string[]) => void; onFiltra: (r: Ripartizione, valore: string) => void }) {
  return (
    <AvvisoPagina>
      {l.conSinottico && (
        <VistaQuery stato={l.sinottico}>
          {(s) => <SinotticoDomande sinottico={s} vista={vista} inAggiornamento={l.sinotticoInAggiornamento} onFiltra={onFiltra} statoSenzaClic={conChiaviDeiReport(i.criteriVisti)} />}
        </VistaQuery>
      )}
      {l.conDomande ? (
        <VistaQuery stato={l.stato} eVuoto={(d) => (d.totaleRighe ?? 0) === 0} vuoto={<VuotoFiltri testo="Nessuna domanda per questi filtri." onApriFiltri={i.pannello.apri} />}>
          {(pagina) => (
            <RisultatiInterrogazione
              elenco="domande"
              idTitolo="t-elenco"
              titolo="Elenco delle domande"
              oggetto="domande"
              oggettoFile="l'elenco delle domande"
              totale={pagina.totaleRighe ?? 0}
              righe={pagina.righe ?? []}
              criteri={i.criteriScritti}
              applica={i.applica}
              aggiornando={l.aggiornando}
              tabella={{
                chiave: vista.id,
                caption: `Elenco operativo delle domande, vista ${vista.etichetta.toLowerCase()}: ordinabile dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima.`,
                colonne: colonneDomande(vista.colonne),
                chiaveRiga: (d) => `${d.tipo ?? ''}-${d.codiceABarre ?? ''}`,
                etichettaRiga: (d) => `Apri l'anteprima della domanda ${d.codiceABarre ?? ''}`,
                piede: piedeDomande(l.sinottico.data, pagina.totaleRighe ?? 0, !l.sinotticoInAggiornamento),
              }}
              nascoste={nascoste}
              onNascoste={onNascoste}
              anteprima={(d, chiudi) => <AnteprimaDomanda domanda={d} onChiudi={chiudi} conScheda={puoLeggere(i.auth, 'dettaglio')} />}
            />
          )}
        </VistaQuery>
      ) : (
        <AccessoNonDisponibile cosa="l'elenco delle domande" profiloLetto={i.auth !== undefined} />
      )}
    </AvvisoPagina>
  );
}

export function ElencoDomande() {
  const [scelte, setScelte] = useScelteElenco();
  const vista = vistaDi(scelte.vista);
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
        {/* una vista nuova riparte dalle sue colonne di partenza */}
        <SceltaVista vista={vista} onVista={(v) => setScelte({ vista: v })} />
        {grafico.regione}
        <ContestoIntestazione.Provider value={righe}>
          <Contenuto i={i} l={l} vista={vista} nascoste={scelte.nascoste} onNascoste={(n) => setScelte({ ...scelte, nascoste: n })} onFiltra={grafico.filtra} />
        </ContestoIntestazione.Provider>
      </main>
      <PannelloInterrogazione i={i} elenco="domande" lettura={l.stato} aggiornando={l.aggiornando} altriErrori={[l.sinottico.error]} unita={['domanda', 'domande']} />
    </>
  );
}
