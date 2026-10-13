// ElencoPagamenti — pagina /elenco-operativo/pagamenti (flusso pagamenti approvato, pattern interrogazione ADR 0029): una
// riga per riga corrente degli elenchi di liquidazione (D-07), anche di domande chiuse (lo dice in testo). Sinottico di
// quattro indicatori e totali nel piede da TotaliPagamenti dell'intero insieme filtrato (TX-0059, mai somme della
// pagina), tabella paginata e ordinata dal server con le colonne a scelta, anteprima della riga con il link alla scheda
// solo per le domande correnti, file CSV e XLSX, link alle domande degli stessi filtri. Come l'elenco delle domande:
// filtri dal vivo con debounce, aggiornamento dichiarato, ordinamento detto in testo e senza spostare il focus, pagina
// oltre l'ultima, accesso non disponibile senza il grant di TX-0059.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatNumber, plurale } from '../../../shared/lib';
import { AvvisoPagina, ContestoIntestazione, Griglia, Kpi, Paginazione, PulsantiScarica, TabellaServer, VistaQuery } from '../../../shared/ui';
import { usePagamenti } from '../api';
import type { PagamentoElenco, PaginaPagamenti, TotaliPagamenti } from '../api';
import { percorsoDomandeDeiPagamenti } from '../lib/collegamenti';
import { conDimensione, conPagina, dimensioneDi, ordinaPer, ordinamentoDi, ordinamentoPredefinito, paginaDi, senzaOrdinamento, testoOrdinamento, ultimaPagina } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { cellaImporto, testoConteggio, testoSomma } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { AnteprimaPagamento } from './anteprime';
import { colonnePagamenti, titoloDelCampo } from './colonne';
import { AccessoNonDisponibile, AvvisoAggiornamento, BarraInterrogazione, OrdinamentoAttivo, PaginaOltreLUltima, VuotoFiltri } from './comuni';
import { avvisoLimite, scaricamentiElenco } from './esportazioni';
import { PannelloFiltriElenco } from './PannelloFiltriElenco';
import { Briciole, TestaPagina } from './testata';
import { useInterrogazione, useRigheContesto } from './useInterrogazione';

function SinotticoPagamenti({ totali }: { totali: TotaliPagamenti | undefined }) {
  const decretato = testoSomma(totali?.importoDecretato, ['riga', 'righe']);
  return (
    <section className="ui-sinottico" aria-labelledby="t-sinottico-pagamenti">
      <h2 id="t-sinottico-pagamenti">Sinottico dell’insieme filtrato</h2>
      <Griglia colonne={4}>
        <Kpi etichetta="Righe pagate / escluse" valore={`${formatNumber(totali?.pagate ?? 0)} / ${formatNumber(totali?.escluse ?? 0)}`} icona="it-list" />
        <Kpi etichetta="Decretato" valore={decretato.valore} nota={decretato.nota} icona="it-file-signed" tono="scuro" />
        <Kpi etichetta="Pagato" valore={cellaImporto(totali?.importoPagato)} icona="it-card" tono="verde" />
        <Kpi
          etichetta="Quote di finanziamento"
          valore={cellaImporto(totali?.quotaFeasr)}
          unita=" FEASR"
          nota={`nazionale ${cellaImporto(totali?.quotaNazionale)} - regionale ${cellaImporto(totali?.quotaRegionale)}`}
          icona="it-pa"
          tono="ambra"
        />
      </Griglia>
      <p className="ui-fonte">Fonte: totali dell’insieme filtrato (TX-0059), calcolati dal server sulle righe PAGATA di tutto l’insieme, non sulla pagina.</p>
    </section>
  );
}

function piedePagamenti(t: TotaliPagamenti | undefined, totaleRighe: number): Partial<Record<string, ReactNode>> {
  return {
    decreto: `Totale dell'insieme filtrato: ${plurale(totaleRighe, 'riga', 'righe')}`,
    importoDecretato: testoSomma(t?.importoDecretato).valore,
    importoPagato: cellaImporto(t?.importoPagato),
    quotaFeasr: cellaImporto(t?.quotaFeasr),
    quotaNazionale: cellaImporto(t?.quotaNazionale),
    quotaRegionale: cellaImporto(t?.quotaRegionale),
  };
}

/** Chiave della riga: il vincolo di unicita' della riga di elenco comprende il protocollo (review v1 X-05). */
const chiaveRiga = (p: PagamentoElenco) => `${p.decreto ?? ''}-${p.protocollo ?? ''}-${p.tipoDomanda ?? ''}-${p.codiceABarre ?? ''}-${p.esito ?? ''}`;

function Righe({ pagina, criteri, applica, aggiornando, conScheda }: { pagina: PaginaPagamenti; criteri: Criteri; applica: (c: Criteri) => void; aggiornando: boolean; conScheda: boolean }) {
  const [anteprima, setAnteprima] = useState<PagamentoElenco | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const ordinamento = ordinamentoDi(criteri, 'pagamenti');
  const totale = pagina.totaleRighe ?? 0;
  const ultima = ultimaPagina(totale, dimensioneDi(criteri));
  const limite = avvisoLimite('pagamenti', totale);
  return (
    <section className="ui-card ui-risultati" aria-labelledby="t-pagamenti" aria-busy={aggiornando}>
      <div className="ui-card__testa">
        <h2 id="t-pagamenti" ref={titolo} tabIndex={-1}>
          Righe di pagamento
        </h2>
      </div>
      <AvvisoAggiornamento attivo={aggiornando} />
      <OrdinamentoAttivo
        testo={testoOrdinamento(titoloDelCampo('pagamenti', ordinamento.campo), ordinamento)}
        predefinito={ordinamentoPredefinito(ordinamento, 'pagamenti')}
        onPredefinito={() => applica(senzaOrdinamento(criteri))}
      />
      {paginaDi(criteri) > ultima && totale > 0 ? (
        <PaginaOltreLUltima pagina={paginaDi(criteri)} ultima={ultima} onUltima={() => applica(conPagina(criteri, ultima))} />
      ) : (
        <TabellaServer
          caption="Elenco operativo dei pagamenti: righe correnti degli elenchi di liquidazione, ordinabili dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima."
          colonne={colonnePagamenti()}
          righe={pagina.righe ?? []}
          chiaveRiga={chiaveRiga}
          ordinamento={ordinamento}
          onOrdina={(campo) => applica(ordinaPer(criteri, 'pagamenti', campo))}
          onRiga={setAnteprima}
          etichettaRiga={(p) => `Apri l'anteprima del pagamento ${p.decreto ?? ''} della domanda ${p.codiceABarre ?? ''}`}
          piede={piedePagamenti(pagina.totali, totale)}
          strumenti={
            <>
              <PulsantiScarica oggetto="l'elenco dei pagamenti" scaricamenti={scaricamentiElenco('pagamenti', criteri, totale)} />
              {limite && <p className="ui-nota w-100 mb-0">{limite}</p>}
            </>
          }
        />
      )}
      <Paginazione
        pagina={paginaDi(criteri)}
        dimensione={dimensioneDi(criteri)}
        totale={totale}
        oggetto="righe"
        onPagina={(p) => {
          applica(conPagina(criteri, p));
          titolo.current?.focus();
        }}
        onDimensione={(d) => applica(conDimensione(criteri, d))}
      />
      <AnteprimaPagamento pagamento={anteprima} onChiudi={() => setAnteprima(null)} conScheda={conScheda} />
    </section>
  );
}

type Interrogazione = ReturnType<typeof useInterrogazione>;

/** La lettura della pagina col suo grant (review v1 A-06): l'elenco dei pagamenti con i totali (TX-0059). */
function useLetturaPagamenti(i: Interrogazione) {
  const conPagamenti = puoLeggere(i.auth, 'pagamenti');
  const stato = usePagamenti(i.criteri, { abilitato: conPagamenti });
  return { stato, conPagamenti, aggiornando: stato.isPlaceholderData && stato.isFetching };
}

function Contenuto({ i, l }: { i: Interrogazione; l: ReturnType<typeof useLetturaPagamenti> }) {
  if (!l.conPagamenti) return <AccessoNonDisponibile cosa="l'elenco dei pagamenti" profiloLetto={i.auth !== undefined} />;
  return (
    <VistaQuery stato={l.stato} eVuoto={(d) => (d.totaleRighe ?? 0) === 0} vuoto={<VuotoFiltri testo="Nessuna riga di pagamento per questi filtri." onApriFiltri={i.pannello.apri} />}>
      {(pagina) => (
        <>
          <SinotticoPagamenti totali={pagina.totali} />
          <Righe pagina={pagina} criteri={i.criteri} applica={i.applica} aggiornando={l.aggiornando} conScheda={puoLeggere(i.auth, 'dettaglio')} />
        </>
      )}
    </VistaQuery>
  );
}

function Pannello({ i, l }: { i: Interrogazione; l: ReturnType<typeof useLetturaPagamenti> }) {
  const { stato } = l;
  return (
    <PannelloFiltriElenco
      aperto={i.pannello.aperto}
      onChiudi={i.pannello.chiudi}
      elenco="pagamenti"
      criteri={i.criteriVisti}
      applica={i.applicaRitardato}
      valori={i.valori}
      errori={stato.error != null ? [stato.error] : []}
      conteggio={testoConteggio(stato.data?.totaleRighe, ['riga di pagamento', 'righe di pagamento'], {
        inAggiornamento: i.inAttesa || l.aggiornando || (stato.isFetching && !stato.data),
        inErrore: stato.isError,
      })}
      onAzzera={i.togliTutti}
    />
  );
}

export function ElencoPagamenti() {
  const i = useInterrogazione('pagamenti');
  const l = useLetturaPagamenti(i);
  const dati = l.stato.data;
  const righe = useRigheContesto(i.filtriApplicati, i.auth?.user?.profile, dati?.ultimiDatiSincronizzati, dati?.perimetro);
  return (
    <>
      <BarraInterrogazione
        chip={i.chip}
        onApri={i.pannello.apri}
        onTogliTutti={i.togliTutti}
        vuoto="Nessun filtro: tutte le righe di pagamento del perimetro"
        perimetro={dati?.perimetro}
        ultimi={dati?.ultimiDatiSincronizzati}
        ultimiInErrore={l.stato.isError}
      />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Pagamenti' }]} />
        <TestaPagina
          titolo="Elenco operativo dei pagamenti"
          titoloDocumento="Pagamenti"
          sottotitolo="Le righe correnti degli elenchi di liquidazione (pagate o escluse) delle domande del tuo perimetro: ogni filtro cambia subito righe e totali."
          azioni={
            puoLeggere(i.auth, 'domande') ? (
              <Link className="btn btn-outline-primary" to={percorsoDomandeDeiPagamenti(i.criteri)}>
                Vedi le domande di questi pagamenti
              </Link>
            ) : undefined
          }
        />
        <ContestoIntestazione.Provider value={righe}>
          <AvvisoPagina>
            <Contenuto i={i} l={l} />
          </AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      <Pannello i={i} l={l} />
    </>
  );
}
