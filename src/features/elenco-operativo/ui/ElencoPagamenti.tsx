// ElencoPagamenti — pagina /elenco-operativo/pagamenti (flusso pagamenti approvato, pattern interrogazione ADR 0029): una
// riga per riga corrente degli elenchi di liquidazione (D-07), anche di domande chiuse (lo dice in testo). Sinottico di
// quattro indicatori e totali nel piede da TotaliPagamenti dell'intero insieme filtrato (TX-0059, mai somme della
// pagina), tabella paginata e ordinata dal server con le colonne a scelta (restano tornando dalla scheda), anteprima
// della riga con il link alla scheda solo per le domande correnti, file CSV e XLSX, link alle domande degli stessi
// filtri. Lo scheletro dei risultati e del pannello e' quello delle domande (interrogazione.tsx): filtri dal vivo con
// debounce, aggiornamento dichiarato anche sul sinottico (review v2 V-05), ordinamento detto in testo, pagina oltre
// l'ultima, accesso non disponibile senza il grant di TX-0059.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatNumber, plurale } from '../../../shared/lib';
import { AvvisoAggiornamento, AvvisoPagina, ContestoIntestazione, Griglia, Kpi, VistaQuery, useRigheContesto } from '../../../shared/ui';
import { usePagamenti } from '../api';
import type { PagamentoElenco, TotaliPagamenti } from '../api';
import { percorsoDomandeDeiPagamenti } from '../lib/collegamenti';
import { cellaImporto, testoPerimetro, testoSomma } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { AnteprimaPagamento } from './anteprime';
import { colonnePagamenti } from './colonne';
import { AccessoNonDisponibile, BarraInterrogazione, VuotoFiltri } from './comuni';
import { PannelloInterrogazione, RisultatiInterrogazione, useScelteElenco } from './interrogazione';
import type { Interrogazione } from './interrogazione';
import { Briciole, TestaPagina } from './testata';
import { useInterrogazione } from './useInterrogazione';

/** I totali vengono dalla stessa lettura delle righe: mentre arrivano quelli nuovi restano i precedenti, dichiarati. */
function SinotticoPagamenti({ totali, inAggiornamento }: { totali: TotaliPagamenti | undefined; inAggiornamento: boolean }) {
  const decretato = testoSomma(totali?.importoDecretato, ['riga', 'righe']);
  return (
    <section className="ui-sinottico ui-risultati" aria-labelledby="t-sinottico-pagamenti" aria-busy={inAggiornamento}>
      <h2 id="t-sinottico-pagamenti">Sinottico dell’insieme filtrato</h2>
      <AvvisoAggiornamento attivo={inAggiornamento} testo="Aggiornamento del sinottico: restano visibili i numeri precedenti finché arrivano i nuovi." />
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

/** La lettura della pagina col suo grant (review v1 A-06): l'elenco dei pagamenti con i totali (TX-0059). */
function useLetturaPagamenti(i: Interrogazione) {
  const conPagamenti = puoLeggere(i.auth, 'pagamenti');
  const stato = usePagamenti(i.criteri, { abilitato: conPagamenti });
  return { stato, conPagamenti, aggiornando: stato.isPlaceholderData && stato.isFetching };
}

function Contenuto({ i, l, nascoste, onNascoste }: { i: Interrogazione; l: ReturnType<typeof useLetturaPagamenti>; nascoste: string[] | undefined; onNascoste: (n: string[]) => void }) {
  if (!l.conPagamenti) return <AccessoNonDisponibile cosa="l'elenco dei pagamenti" profiloLetto={i.auth !== undefined} />;
  return (
    <VistaQuery stato={l.stato} eVuoto={(d) => (d.totaleRighe ?? 0) === 0} vuoto={<VuotoFiltri testo="Nessuna riga di pagamento per questi filtri." onApriFiltri={i.pannello.apri} />}>
      {(pagina) => (
        <>
          <SinotticoPagamenti totali={pagina.totali} inAggiornamento={l.aggiornando} />
          <RisultatiInterrogazione
            elenco="pagamenti"
            idTitolo="t-pagamenti"
            titolo="Righe di pagamento"
            oggetto="righe"
            oggettoFile="l'elenco dei pagamenti"
            totale={pagina.totaleRighe ?? 0}
            righe={pagina.righe ?? []}
            criteri={i.criteriScritti}
            applica={i.applica}
            aggiornando={l.aggiornando}
            tabella={{
              caption: "Elenco operativo dei pagamenti: righe correnti degli elenchi di liquidazione, ordinabili dal server con un clic sull'intestazione. Clic o Invio su una riga per l'anteprima.",
              colonne: colonnePagamenti(),
              chiaveRiga,
              etichettaRiga: (p) => `Apri l'anteprima del pagamento ${p.decreto ?? ''} della domanda ${p.codiceABarre ?? ''}`,
              piede: piedePagamenti(pagina.totali, pagina.totaleRighe ?? 0),
            }}
            nascoste={nascoste}
            onNascoste={onNascoste}
            anteprima={(p, chiudi) => <AnteprimaPagamento pagamento={p} onChiudi={chiudi} conScheda={puoLeggere(i.auth, 'dettaglio')} />}
          />
        </>
      )}
    </VistaQuery>
  );
}

export function ElencoPagamenti() {
  const [scelte, setScelte] = useScelteElenco();
  const i = useInterrogazione('pagamenti');
  const l = useLetturaPagamenti(i);
  const dati = l.stato.data;
  const righe = useRigheContesto(i.filtriApplicati, dati?.ultimiDatiSincronizzati, testoPerimetro(dati?.perimetro));
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
            <Contenuto i={i} l={l} nascoste={scelte.nascoste} onNascoste={(n) => setScelte({ ...scelte, nascoste: n })} />
          </AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      <PannelloInterrogazione i={i} elenco="pagamenti" lettura={l.stato} aggiornando={l.aggiornando} unita={['riga di pagamento', 'righe di pagamento']} />
    </>
  );
}
