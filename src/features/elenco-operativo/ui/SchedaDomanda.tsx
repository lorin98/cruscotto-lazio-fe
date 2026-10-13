// SchedaDomanda — pagina /elenco-operativo/domande/:tipo/:codiceABarre (flusso dettaglio-domanda approvato): un solo h1
// (denominazione, o il codice a barre se manca), testata con i badge, quattro indicatori, schede Sintesi | Domande
// collegate | Determine | Pagamenti | Recuperi | Anomalie da UNA lettura (TX-0058). Le schede sono Tabs di react-aria
// (frecce da tastiera, aria-selected); tabelle native con caption e th scope (TabelleScheda). Un 404 ha lo stesso
// messaggio per domanda inesistente, chiusa o fuori perimetro (D-06). Link dichiarati: domanda collegata, altre domande
// del beneficiario, torna all'elenco.
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { formatNumber, formatPercentuale } from '../../../shared/lib';
import { AvvisoPagina, CardGrafico, Griglia, Kpi, Sezione, VistaQuery, useFocusTitolo } from '../../../shared/ui';
import { rispostaDomandaAssente, useDettaglioDomanda } from '../api';
import type { DettaglioDomanda, DomandaElenco } from '../api';
import { PERCORSO_DOMANDE, percorsoDettaglio, percorsoDomandeDelBeneficiario } from '../lib/collegamenti';
import { cellaImporto, quotaSu } from '../lib/formato';
import { graficoAmmessoPagato } from '../lib/grafici';
import { badgeDellaDomanda, sopratitoloDomanda, vociSintesi } from '../lib/voci';
import { ElencoVoci } from './anteprime';
import { TabellaAnomalie, TabellaCollegate, TabellaDetermine, TabellaPagamentiDomanda, TabellaRecuperi } from './TabelleScheda';
import { Briciole } from './testata';

const ASSENTE = 'La domanda non è disponibile: non esiste, è chiusa oppure è fuori dal tuo perimetro.';

function Testata({ d, scheda }: { d: DomandaElenco; scheda: DettaglioDomanda }) {
  const naviga = useNavigate();
  const beneficiario = percorsoDomandeDelBeneficiario(d.cuaa);
  // "torna all'elenco" ritorna alla ricerca di partenza se la scheda e' stata aperta dall'applicazione
  const torna = () => void (window.history.length > 1 ? naviga(-1) : naviga(PERCORSO_DOMANDE));
  return (
    <section className="ui-hero ui-dissolvenza" aria-label={`Domanda ${d.codiceABarre ?? ''}`}>
      <span className="ui-eyebrow">{sopratitoloDomanda(d, scheda.descrizioneIntervento)}</span>
      <ul className="ui-hero__badge-elenco" aria-label="Dati principali">
        {badgeDellaDomanda(d, scheda.perimetro).map((b) => (
          <li key={b} className="ui-hero__badge">
            {b}
          </li>
        ))}
      </ul>
      <div className="ui-hero__azioni">
        {beneficiario && (
          <Link className="btn btn-light btn-sm" to={beneficiario}>
            Altre domande del beneficiario
          </Link>
        )}
        <button type="button" className="btn btn-outline-light btn-sm" onClick={torna}>
          {"Torna all'elenco"}
        </button>
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

function DomandaDiSostegno({ codice }: { codice: string | null | undefined }) {
  const percorso = codice ? percorsoDettaglio('SOSTEGNO', codice) : null;
  return (
    <dl className="ui-dl">
      <div>
        <dt>Domanda di sostegno</dt>
        <dd>{percorso ? <Link to={percorso}>{codice}</Link> : (codice ?? 'non indicata')}</dd>
      </div>
    </dl>
  );
}

function Sintesi({ d, scheda }: { d: DomandaElenco; scheda: DettaglioDomanda }) {
  const grafico = useMemo(() => graficoAmmessoPagato(d), [d]);
  return (
    <Griglia colonne={2}>
      <Sezione titolo="Dati della domanda">
        <ElencoVoci voci={vociSintesi(d, scheda)} />
        {d.tipo === 'PAGAMENTO' && <DomandaDiSostegno codice={scheda.codiceDomandaSostegno} />}
        <p className="ui-fonte">Fonte: TX-0058. Valori assenti: indicato il motivo, mai zero.</p>
      </Sezione>
      <CardGrafico titolo="Dall'ammesso al pagato" dati={grafico} fonte="Fonte: TX-0058 (ammesso, pagato, ancora da pagare della domanda)." />
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

function Schede({ d, scheda }: { d: DomandaElenco; scheda: DettaglioDomanda }) {
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
        <Sintesi d={d} scheda={scheda} />
      </TabPanel>
      <TabPanel id="collegate">
        <TabellaCollegate collegate={l.collegate} />
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
function titoloDi(scheda: DettaglioDomanda | undefined, assente: boolean, codice: string | undefined): string {
  if (assente) return 'Domanda non disponibile';
  return scheda?.domanda?.denominazione ?? `Domanda ${codice ?? ''}`;
}

function Assente() {
  return (
    <div className="alert alert-warning" role="alert">
      {ASSENTE} <Link to={PERCORSO_DOMANDE}>{"Torna all'elenco"}</Link>
    </div>
  );
}

function Contenuto({ scheda }: { scheda: DettaglioDomanda }) {
  if (!scheda.domanda) return <Assente />;
  return (
    <>
      <Testata d={scheda.domanda} scheda={scheda} />
      <Kpis d={scheda.domanda} />
      <Schede d={scheda.domanda} scheda={scheda} />
    </>
  );
}

export function SchedaDomanda({ tipo, codiceABarre }: { tipo: string | undefined; codiceABarre: string | undefined }) {
  const stato = useDettaglioDomanda(tipo, codiceABarre);
  const assente = stato.isError && rispostaDomandaAssente(stato.error);
  const h1 = useFocusTitolo<HTMLHeadingElement>(`Domanda ${codiceABarre ?? ''}`);
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: 'Domande', a: PERCORSO_DOMANDE }, { etichetta: `Domanda ${codiceABarre ?? ''}` }]} />
      <h1 ref={h1} tabIndex={-1} className="ui-titolo-scheda">
        {titoloDi(stato.data, assente, codiceABarre)}
      </h1>
      <AvvisoPagina>
        <VistaQuery stato={stato} errorePersonalizzato={(e) => (rispostaDomandaAssente(e) ? <Assente /> : null)}>
          {(scheda) => <Contenuto scheda={scheda} />}
        </VistaQuery>
      </AvvisoPagina>
    </main>
  );
}
