// SchedaDomanda — pagina /elenco-operativo/domande/:tipo/:codiceABarre (flusso dettaglio-domanda approvato): testata con
// un solo h1 (denominazione, o il codice a barre se manca; sempre presente, anche in caricamento ed errore), i badge e le
// azioni; quattro indicatori; schede Sintesi | Domande collegate | Determine | Pagamenti | Recuperi | Anomalie da UNA
// lettura (TX-0058). Le schede sono Tabs di react-aria (frecce da tastiera, aria-selected); tabelle con caption e th scope
// (TabelleScheda). Tipo e codice del percorso si convalidano prima di leggere: con un riferimento non valido nessuna
// richiesta (review v1 A-01). Un 404 ha lo stesso messaggio per domanda inesistente, chiusa o fuori perimetro (D-06).
// Link dichiarati: domanda collegata, altre domande del beneficiario, torna all'elenco (alla ricerca di partenza).
// L'atto di concessione della sintesi legge attoConcessioneDisponibile di TX-0060 (stessa lettura e cache del pannello dei
// filtri, col suo grant), che parte insieme a TX-0058: una domanda senza l'atto dice "nessun atto" solo con la fonte attiva,
// l'assenza con la fonte senza la fonte (F1), "non disponibile" finche' TX-0060 non e' letto (review delta 21/10 passata 2 V1).
import { useMemo } from 'react';
import type { Ref } from 'react';
import { Link, useLocation } from 'react-router';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatNumber, formatPercentuale, righeContesto } from '../../../shared/lib';
import { AvvisoPagina, CardGrafico, ContestoIntestazione, Griglia, Kpi, Sezione, VistaQuery, useFocusTitolo } from '../../../shared/ui';
import { rispostaDomandaAssente, rispostaRiferimentoNonValido, useDettaglioDomanda, useValoriFiltri } from '../api';
import type { DettaglioDomanda, DomandaElenco } from '../api';
import { PERCORSO_DOMANDE, PERCORSO_PAGAMENTI, percorsoDettaglio, percorsoDomandeDelBeneficiario, riferimentoValido, ritornoAllElenco, statoDiRitorno } from '../lib/collegamenti';
import type { StatoRitorno, StatoScheda } from '../lib/collegamenti';
import { cellaImporto, etichettaTipo, quotaSu, testoPerimetro } from '../lib/formato';
import { graficoAmmessoPagato } from '../lib/grafici';
import { puoLeggere } from '../lib/grant';
import { badgeDellaDomanda, sopratitoloDomanda, vociSintesi } from '../lib/voci';
import { ElencoVoci } from './anteprime';
import { TabellaAnomalie, TabellaCollegate, TabellaDetermine, TabellaPagamentiDomanda, TabellaRecuperi } from './TabelleScheda';
import { Briciole } from './testata';

const ASSENTE = 'La domanda non è disponibile: non esiste, è chiusa oppure è fuori dal tuo perimetro.';
const NON_VALIDO = "Tipo o codice a barre non validi: l'indirizzo non indica una domanda.";

/** Testata (flusso approvato): sopratitolo, h1, badge e azioni; senza dati resta il solo h1. */
function Testata({
  h1,
  titolo,
  scheda,
  ritorno,
  statoRitorno,
  conBeneficiario,
}: {
  h1: Ref<HTMLHeadingElement>;
  titolo: string;
  scheda: DettaglioDomanda | undefined;
  ritorno: string;
  statoRitorno: StatoRitorno | undefined;
  conBeneficiario: boolean;
}) {
  const d = scheda?.domanda;
  const beneficiario = d && conBeneficiario ? percorsoDomandeDelBeneficiario(d.cuaa) : null;
  return (
    <section className="ui-hero ui-dissolvenza" aria-labelledby="t-scheda">
      {d && <span className="ui-eyebrow">{sopratitoloDomanda(d, scheda?.descrizioneIntervento)}</span>}
      <h1 id="t-scheda" ref={h1} tabIndex={-1}>
        {titolo}
      </h1>
      {d && (
        <ul className="ui-hero__badge-elenco" aria-label="Dati principali">
          {badgeDellaDomanda(d, scheda?.perimetro).map((b) => (
            <li key={b} className="ui-hero__badge">
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="ui-hero__azioni">
        {beneficiario && (
          <Link className="btn btn-light btn-sm" to={beneficiario}>
            Altre domande del beneficiario
          </Link>
        )}
        <Link className="btn btn-outline-light btn-sm" to={ritorno} state={statoRitorno}>
          {"Torna all'elenco"}
        </Link>
      </div>
    </section>
  );
}

const notaQuota = (quota: number | null, base: string) => (quota == null ? undefined : `quota ${base}: ${formatPercentuale(quota)}`);

function Kpis({ d }: { d: DomandaElenco }) {
  const quotaPagato = quotaSu(d.pagato, d.ammesso);
  return (
    <Griglia colonne={4}>
      <Kpi etichetta="Richiesto" valore={cellaImporto(d.richiesto)} icona="it-file-signed" tono="scuro" />
      <Kpi etichetta="Ammesso" valore={cellaImporto(d.ammesso)} nota={notaQuota(quotaSu(d.ammesso, d.richiesto), 'sul richiesto')} icona="it-check-circle" />
      <Kpi etichetta="Pagato" valore={cellaImporto(d.pagato)} nota={notaQuota(quotaPagato, "sull'ammesso")} quota={quotaPagato == null ? null : quotaPagato / 100} icona="it-card" tono="verde" />
      <Kpi etichetta="Ancora da pagare" valore={cellaImporto(d.ancoraDaPagare)} nota={`liquidato ${cellaImporto(d.liquidato)} - recuperato ${cellaImporto(d.recuperato)}`} icona="it-clock" tono="ambra" />
    </Griglia>
  );
}

/**
 * La domanda di sostegno di una domanda di pagamento: testo, come nel wireframe approvato; e' un link alla sua scheda solo
 * se e' fra le domande collegate della risposta (corrente e nel perimetro: altrimenti la scheda risponderebbe 404).
 */
function DomandaDiSostegno({ codice, scheda, ricerca }: { codice: string | null | undefined; scheda: DettaglioDomanda; ricerca: StatoScheda | undefined }) {
  const collegata = (scheda.collegate ?? []).some((c) => c.tipo === 'SOSTEGNO' && c.codiceABarre === codice);
  const percorso = collegata ? percorsoDettaglio('SOSTEGNO', codice) : null;
  return (
    <dl className="ui-dl">
      <div>
        <dt>Domanda di sostegno</dt>
        <dd>
          {percorso ? (
            <Link to={percorso} state={ricerca}>
              {codice}
            </Link>
          ) : (
            (codice ?? 'non indicata')
          )}
        </dd>
      </div>
    </dl>
  );
}

/**
 * attoConcessioneDisponibile di TX-0060 (review delta 21/10 X2, decisione F1 dell'utente): la stessa lettura (wrapper e
 * query-key) del pannello dei filtri, col suo grant (i profili di TX-0058 hanno tutti TX-0060) e solo con un riferimento
 * valido (nessuna richiesta altrimenti, review v1 A-01). Si legge nella pagina, accanto a TX-0058, e non nella sintesi
 * montata dopo la scheda: le due letture partono insieme (review delta 21/10 passata 2 V1). Finche' non e' letta (in
 * attesa, in errore, senza il grant) resta assente, e l'atto mancante dice "non disponibile", mai "nessun atto".
 */
function useAttoConcessioneDisponibile(valido: boolean): boolean | undefined {
  const auth = useAuthStatus();
  return useValoriFiltri(valido && puoLeggere(auth.data, 'filtri')).data?.attoConcessioneDisponibile;
}

/** Le parti della scheda che non vengono da TX-0058: la ricerca di partenza e la disponibilita' dell'atto (TX-0060). */
interface DaFuori {
  ricerca: StatoScheda | undefined;
  attoConcessioneDisponibile: boolean | undefined;
}

function Sintesi({ d, scheda, ricerca, attoConcessioneDisponibile }: { d: DomandaElenco; scheda: DettaglioDomanda } & DaFuori) {
  const grafico = useMemo(() => graficoAmmessoPagato(d), [d]);
  return (
    <Griglia colonne={2}>
      <Sezione titolo="Dati della domanda">
        <ElencoVoci voci={vociSintesi(d, scheda, { attoConcessioneDisponibile })} />
        {d.tipo === 'PAGAMENTO' && <DomandaDiSostegno codice={scheda.codiceDomandaSostegno} scheda={scheda} ricerca={ricerca} />}
        <p className="ui-fonte">Fonte: TX-0058. Valori assenti: indicato il motivo, mai zero.</p>
      </Sezione>
      <CardGrafico
        titolo="Dall'ammesso al pagato"
        dati={grafico}
        fonte="Fonte: TX-0058 (ammesso, pagato, ancora da pagare della domanda)."
        nomeFile={`Dall'ammesso al pagato ${etichettaTipo(d.tipo).toLowerCase()} ${d.codiceABarre ?? ''}`}
      />
    </Griglia>
  );
}

const conta = (etichetta: string, n: number) => `${etichetta} (${formatNumber(n)})`;

/** Le liste della scheda, vuote se il DTO non le porta. */
function listeDi(scheda: DettaglioDomanda) {
  return {
    collegate: scheda.collegate ?? [],
    determine: scheda.determine ?? [],
    pagamenti: scheda.pagamenti ?? [],
    recuperi: scheda.recuperi ?? [],
    anomalie: scheda.anomalie ?? [],
  };
}

function Schede({ d, scheda, ricerca, attoConcessioneDisponibile }: { d: DomandaElenco; scheda: DettaglioDomanda } & DaFuori) {
  const l = listeDi(scheda);
  return (
    <Tabs>
      <TabList aria-label="Sezioni della domanda" className="ui-tabs">
        <Tab id="sintesi" className="ui-tab">
          Sintesi
        </Tab>
        <Tab id="collegate" className="ui-tab">{conta('Domande collegate', l.collegate.length)}</Tab>
        <Tab id="determine" className="ui-tab">{conta('Determine', l.determine.length)}</Tab>
        <Tab id="pagamenti" className="ui-tab">{conta('Pagamenti', l.pagamenti.length)}</Tab>
        <Tab id="recuperi" className="ui-tab">{conta('Recuperi', l.recuperi.length)}</Tab>
        <Tab id="anomalie" className="ui-tab">{conta('Anomalie', l.anomalie.length)}</Tab>
      </TabList>
      <TabPanel id="sintesi">
        <Sintesi d={d} scheda={scheda} ricerca={ricerca} attoConcessioneDisponibile={attoConcessioneDisponibile} />
      </TabPanel>
      <TabPanel id="collegate">
        <TabellaCollegate collegate={l.collegate} ricerca={ricerca} />
      </TabPanel>
      <TabPanel id="determine">
        <TabellaDetermine determine={l.determine} />
      </TabPanel>
      <TabPanel id="pagamenti">
        <TabellaPagamentiDomanda pagamenti={l.pagamenti} />
      </TabPanel>
      <TabPanel id="recuperi">
        <TabellaRecuperi recuperi={l.recuperi} />
      </TabPanel>
      <TabPanel id="anomalie">
        <TabellaAnomalie anomalie={l.anomalie} />
      </TabPanel>
    </Tabs>
  );
}

/** Un solo h1, sempre presente (anche in caricamento ed errore): denominazione, oppure il codice a barre se manca. */
function titoloDi(scheda: DettaglioDomanda | undefined, esito: 'assente' | 'non-valido' | null, codice: string | undefined): string {
  if (esito === 'non-valido') return 'Domanda non valida';
  if (esito === 'assente') return 'Domanda non disponibile';
  return scheda?.domanda?.denominazione ?? `Domanda ${codice ?? ''}`;
}

/** Il ritorno all'elenco di partenza: indirizzo con i filtri e scelte della pagina (vista, colonne: review v2 V-02). */
interface Ritorno {
  ritorno: string;
  statoRitorno: StatoRitorno | undefined;
}

function Avviso({ testo, r }: { testo: string; r: Ritorno }) {
  return (
    <div className="alert alert-warning" role="alert">
      {testo}{' '}
      <Link to={r.ritorno} state={r.statoRitorno}>
        {"Torna all'elenco"}
      </Link>
    </div>
  );
}

function Contenuto({ scheda, r, ...daFuori }: { scheda: DettaglioDomanda; r: Ritorno } & DaFuori) {
  if (!scheda.domanda) return <Avviso testo={ASSENTE} r={r} />;
  return (
    <>
      <Kpis d={scheda.domanda} />
      <Schede d={scheda.domanda} scheda={scheda} {...daFuori} />
    </>
  );
}

/** Righe di contesto del PNG della scheda (NFR-50): la domanda, il profilo, il perimetro della risposta. */
function useContestoScheda(scheda: DettaglioDomanda | undefined, profilo: string | undefined): readonly string[] {
  const d = scheda?.domanda;
  const domanda = d ? `Domanda: ${etichettaTipo(d.tipo).toLowerCase()} ${d.codiceABarre ?? ''}` : null;
  const perimetro = scheda?.perimetro;
  return useMemo(() => [...(domanda ? [domanda] : []), ...righeContesto({ filtri: [], profilo, ultimi: undefined, perimetro: testoPerimetro(perimetro) })], [domanda, profilo, perimetro]);
}

type Esito = 'assente' | 'non-valido' | null;

/** L'esito della lettura: riferimento non valido (dal percorso o dal 400 del backend), domanda assente (404) o nessuno. */
function esitoDi(valido: boolean, stato: ReturnType<typeof useDettaglioDomanda>): Esito {
  if (!valido || (stato.isError && rispostaRiferimentoNonValido(stato.error))) return 'non-valido';
  return stato.isError && rispostaDomandaAssente(stato.error) ? 'assente' : null;
}

/** Ritorno all'elenco: la ricerca di partenza e le scelte della pagina dallo stato della navigazione (review v1 V-12, X-04). */
function useRitorno() {
  const { state } = useLocation();
  const ritorno = ritornoAllElenco(state);
  const statoRitorno = statoDiRitorno(state);
  // la ricerca di partenza (con le scelte) passa anche alle domande collegate: "Torna all'elenco" riporta sempre all'elenco
  const ricerca: StatoScheda | undefined = ritorno === PERCORSO_DOMANDE && !statoRitorno ? undefined : { ricerca: ritorno, ...statoRitorno };
  return { ritorno, statoRitorno, ricerca, briciola: ritorno.startsWith(PERCORSO_PAGAMENTI) ? 'Pagamenti' : 'Domande' };
}

function Corpo({ esito, stato, r, ...daFuori }: { esito: Esito; stato: ReturnType<typeof useDettaglioDomanda>; r: Ritorno } & DaFuori) {
  if (esito === 'non-valido') return <Avviso testo={NON_VALIDO} r={r} />;
  return (
    <VistaQuery stato={stato} errorePersonalizzato={(e) => (rispostaDomandaAssente(e) ? <Avviso testo={ASSENTE} r={r} /> : null)}>
      {(scheda) => <Contenuto scheda={scheda} r={r} {...daFuori} />}
    </VistaQuery>
  );
}

export function SchedaDomanda({ tipo, codiceABarre }: { tipo: string | undefined; codiceABarre: string | undefined }) {
  const valido = riferimentoValido(tipo, codiceABarre);
  const stato = useDettaglioDomanda(tipo, codiceABarre);
  const attoConcessioneDisponibile = useAttoConcessioneDisponibile(valido);
  const auth = useAuthStatus();
  const r = useRitorno();
  const esito = esitoDi(valido, stato);
  const etichetta = valido ? `Domanda ${codiceABarre ?? ''}` : 'Domanda non valida';
  const h1 = useFocusTitolo<HTMLHeadingElement>(etichetta);
  const contesto = useContestoScheda(stato.data, auth.data?.user?.profile);
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: r.briciola, a: r.ritorno, stato: r.statoRitorno }, { etichetta }]} />
      <Testata
        h1={h1}
        titolo={titoloDi(stato.data, esito, codiceABarre)}
        scheda={esito ? undefined : stato.data}
        ritorno={r.ritorno}
        statoRitorno={r.statoRitorno}
        conBeneficiario={puoLeggere(auth.data, 'domande')}
      />
      <ContestoIntestazione.Provider value={contesto}>
        <AvvisoPagina>
          <Corpo esito={esito} stato={stato} r={r} ricerca={r.ricerca} attoConcessioneDisponibile={attoConcessioneDisponibile} />
        </AvvisoPagina>
      </ContestoIntestazione.Provider>
    </main>
  );
}
