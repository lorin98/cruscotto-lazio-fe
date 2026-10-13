// ElencoPagamenti — pagina /elenco-operativo/pagamenti (flusso pagamenti approvato, pattern interrogazione ADR 0029): una
// riga per riga corrente degli elenchi di liquidazione (D-07), anche di domande chiuse (lo dice in testo). Sinottico di
// quattro indicatori e totali nel piede da TotaliPagamenti dell'intero insieme filtrato (TX-0059, mai somme della
// pagina), tabella paginata e ordinata dal server con le colonne a scelta, anteprima della riga con il link alla scheda
// solo per le domande correnti, file CSV e XLSX, link alle domande degli stessi filtri.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatNumber, plurale } from '../../../shared/lib';
import { AvvisoPagina, ContestoIntestazione, Griglia, Kpi, Paginazione, PulsantiScarica, TabellaServer, VistaQuery } from '../../../shared/ui';
import { usePagamenti } from '../api';
import type { PagamentoElenco, PaginaPagamenti, TotaliPagamenti } from '../api';
import { percorsoDomandeDeiPagamenti } from '../lib/collegamenti';
import { conDimensione, conPagina, dimensioneDi, ordinaPer, ordinamentoDi, paginaDi } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { cellaImporto, testoSomma } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { AnteprimaPagamento } from './anteprime';
import { colonnePagamenti } from './colonne';
import { AvvisoAggiornamento, BarraInterrogazione, VuotoFiltri } from './comuni';
import { scaricamentiElenco } from './esportazioni';
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

function Righe({ pagina, criteri, applica, aggiornando }: { pagina: PaginaPagamenti; criteri: Criteri; applica: (c: Criteri) => void; aggiornando: boolean }) {
  const [anteprima, setAnteprima] = useState<PagamentoElenco | null>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const vaiA = (c: Criteri) => {
    applica(c);
    titolo.current?.focus();
  };
  return (
    <section className="ui-card ui-risultati" aria-labelledby="t-pagamenti" aria-busy={aggiornando}>
      <div className="ui-card__testa">
        <h2 id="t-pagamenti" ref={titolo} tabIndex={-1}>
          Righe di pagamento
        </h2>
      </div>
      <AvvisoAggiornamento attivo={aggiornando} />
      <TabellaServer
        caption="Elenco operativo dei pagamenti: righe correnti degli elenchi di liquidazione, ordinabili dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima."
        colonne={colonnePagamenti()}
        righe={pagina.righe ?? []}
        chiaveRiga={(p) => `${p.decreto ?? ''}-${p.tipoDomanda ?? ''}-${p.codiceABarre ?? ''}-${p.esito ?? ''}`}
        ordinamento={ordinamentoDi(criteri, 'pagamenti')}
        onOrdina={(campo) => vaiA(ordinaPer(criteri, 'pagamenti', campo))}
        onRiga={setAnteprima}
        etichettaRiga={(p) => `Apri l'anteprima del pagamento ${p.decreto ?? ''} della domanda ${p.codiceABarre ?? ''}`}
        piede={piedePagamenti(pagina.totali, pagina.totaleRighe ?? 0)}
        strumenti={<PulsantiScarica oggetto="l'elenco dei pagamenti" scaricamenti={scaricamentiElenco('pagamenti', criteri)} />}
      />
      <Paginazione
        pagina={paginaDi(criteri)}
        dimensione={dimensioneDi(criteri)}
        totale={pagina.totaleRighe ?? 0}
        oggetto="righe"
        onPagina={(p) => vaiA(conPagina(criteri, p))}
        onDimensione={(d) => vaiA(conDimensione(criteri, d))}
      />
      <AnteprimaPagamento pagamento={anteprima} onChiudi={() => setAnteprima(null)} />
    </section>
  );
}

function conteggioDal(pagina: PaginaPagamenti | undefined, inCorso: boolean): string {
  if (pagina?.totaleRighe === undefined) return inCorso ? 'Conteggio in corso…' : 'Conteggio non disponibile';
  return `${formatNumber(pagina.totaleRighe)} ${pagina.totaleRighe === 1 ? 'riga di pagamento' : 'righe di pagamento'} con questi filtri`;
}

export function ElencoPagamenti() {
  const { criteri, applica, chip, filtriApplicati, togliTutti, pannello, auth } = useInterrogazione('pagamenti');
  const stato = usePagamenti(criteri);
  const righe = useRigheContesto(filtriApplicati, auth?.user?.profile, stato.data?.ultimiDatiSincronizzati);
  const conDomande = puoLeggere(auth, 'domande');
  const aggiornando = stato.isPlaceholderData && stato.isFetching;
  return (
    <>
      <BarraInterrogazione
        chip={chip}
        onApri={pannello.apri}
        onTogliTutti={togliTutti}
        vuoto="Nessun filtro: tutte le righe di pagamento del perimetro"
        perimetro={stato.data?.perimetro}
        ultimi={stato.data?.ultimiDatiSincronizzati}
      />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Pagamenti' }]} />
        <TestaPagina
          titolo="Elenco operativo dei pagamenti"
          titoloDocumento="Pagamenti"
          sottotitolo="Le righe correnti degli elenchi di liquidazione (pagate o escluse) delle domande del tuo perimetro: ogni filtro cambia subito righe e totali."
          azioni={
            conDomande ? (
              <Link className="btn btn-outline-primary" to={percorsoDomandeDeiPagamenti(criteri)}>
                Vedi le domande di questi pagamenti
              </Link>
            ) : undefined
          }
        />
        <ContestoIntestazione.Provider value={righe}>
          <AvvisoPagina>
            <VistaQuery
              stato={stato}
              eVuoto={(d) => (d.totaleRighe ?? 0) === 0}
              vuoto={<VuotoFiltri testo="Nessuna riga di pagamento per questi filtri." onApriFiltri={pannello.apri} />}
            >
              {(pagina) => (
                <>
                  <SinotticoPagamenti totali={pagina.totali} />
                  <Righe pagina={pagina} criteri={criteri} applica={applica} aggiornando={aggiornando} />
                </>
              )}
            </VistaQuery>
          </AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      <PannelloFiltriElenco
        aperto={pannello.aperto}
        onChiudi={pannello.chiudi}
        elenco="pagamenti"
        criteri={criteri}
        applica={applica}
        conteggio={conteggioDal(stato.data, stato.isFetching)}
        onAzzera={togliTutti}
      />
    </>
  );
}
