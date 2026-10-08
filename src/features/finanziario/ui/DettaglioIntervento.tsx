// DettaglioIntervento — pagina di dettaglio di un intervento (route /finanziario/interventi/:codice, flusso panoramica v2):
// le transazioni dei report filtrate sull'intervento (nessuna transazione nuova). Testata con codice e descrizione (TX-0001),
// KPI dalla riga del riepilogo (TX-0011), schede: Sintesi (gauge, cascata), Domande (TX-0008, TX-0010), SIGC (TX-0012,
// TX-0013), Tutte le voci (con il motivo dei valori assenti). Le schede leggono solo quando si aprono.
import { Link } from 'react-router';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatNumber, formatPercentuale } from '../../../shared/lib';
import { CardGrafico, Kpi, TabellaDati, VistaQuery, Vuoto, useFocusTitolo } from '../../../shared/ui';
import { useDomandePerAnno, useFiltri, useImportiPerAnno, useRiepilogo, useSigcDomande, useSigcImporti, useSpesaPerIntervento } from '../api';
import type { RiepilogoFinanziarioRiga } from '../api';
import type { Filtri, Perimetro } from '../lib/filtri';
import {
  graficoCascataIntervento,
  graficoCascataSigc,
  graficoDomandePerAnno,
  graficoGauge,
  graficoImbutoSigc,
  graficoImportiPerAnno,
  milioni,
} from '../lib/grafici';
import { ConGrant, Griglia, PerimetroSezione } from './comuni';

function Testata({ codice, descrizione, perimetro, contributo }: { codice: string; descrizione?: string | null; perimetro?: Perimetro; contributo?: number | null }) {
  const h1 = useFocusTitolo<HTMLHeadingElement>(`${codice} - Finanziario`);
  return (
    <section className="ui-hero ui-dissolvenza">
      <span className="ui-eyebrow">{`Intervento ${codice}`}</span>
      <h1 ref={h1} tabIndex={-1}>
        {descrizione ?? codice}
      </h1>
      {perimetro && <span className="ui-hero__badge">{`Perimetro ${perimetro}`}</span>}
      {contributo != null && <span className="ui-hero__badge">{`Contributo ambientale ${formatPercentuale(contributo)}`}</span>}
      <div className="ui-hero__azioni">
        <Link className="btn btn-light btn-sm" to={`/finanziario?intervento=${encodeURIComponent(codice)}`}>
          Filtra i report su questo intervento
        </Link>
        <Link className="btn btn-outline-light btn-sm" to="/finanziario/riepilogo">
          Torna al riepilogo
        </Link>
      </div>
    </section>
  );
}

function Kpis({ r }: { r: RiepilogoFinanziarioRiga }) {
  const kpiImporto = (etichetta: string, valore: number | null | undefined, icona: 'it-card' | 'it-chart-line' | 'it-presentation', tono: 'scuro' | 'verde' | 'blu') => (
    <Kpi etichetta={etichetta} icona={icona} tono={tono} valore={valore == null ? undefined : milioni(valore)} assente={valore == null ? 'Non disponibile nel riepilogo' : undefined} />
  );
  return (
    <Griglia colonne={4}>
      {kpiImporto('Dotazione spesa pubblica', r.dotazioneSpesaPubblica?.valore, 'it-card', 'scuro')}
      {kpiImporto('Risorse quota FEASR', r.risorseQuotaFeasr?.valore, 'it-presentation', 'blu')}
      {kpiImporto('Pagamenti al netto delle rettifiche', r.pagamentiNettoRettifiche?.valore, 'it-chart-line', 'verde')}
      <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(r.domandePresentate)} />
    </Griglia>
  );
}

function Sintesi({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  const spesa = useSpesaPerIntervento(filtri, hasGrant(useAuthStatus().data, 'csr.tx-0002.read'));
  const pagati = spesa.data?.righe?.[0]?.pagamentiTotali?.valore;
  return (
    <Griglia>
      <CardGrafico
        titolo="Pagato sulla dotazione"
        dati={graficoGauge(pagati, r.dotazioneSpesaPubblica?.valore, 'della dotazione pagato', perimetro)}
        fonte="Fonte: TX-0002 (pagamenti totali) e TX-0011 (dotazione)"
      />
      <CardGrafico titolo="Dalla dotazione al residuo" dati={graficoCascataIntervento(r)} fonte="Fonte: TX-0011, riepilogo per intervento" />
    </Griglia>
  );
}

// le letture delle schede stanno nei figli di ConGrant: senza il grant non partono (R-09)
function DomandePerAnno({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useDomandePerAnno(filtri)}>
      {(d) => <CardGrafico titolo="Domande per anno di raccolta" dati={graficoDomandePerAnno(d.righe ?? [])} fonte="Fonte: TX-0008" />}
    </VistaQuery>
  );
}

function ImportiPerAnno({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useImportiPerAnno(filtri)}>
      {(d) => <CardGrafico titolo="Importi ammessi e decretati per anno" dati={graficoImportiPerAnno(d.righe ?? [])} fonte="Fonte: TX-0010" />}
    </VistaQuery>
  );
}

function Domande({ filtri }: { filtri: Filtri }) {
  return (
    <Griglia>
      <ConGrant grant="csr.tx-0008.read" titolo="Domande per anno di raccolta">
        <DomandePerAnno filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0010.read" titolo="Importi ammessi e decretati per anno">
        <ImportiPerAnno filtri={filtri} />
      </ConGrant>
    </Griglia>
  );
}

function DomandeSigc({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useSigcDomande(filtri)}>{(d) => <CardGrafico titolo="Domande SIGC" dati={graficoImbutoSigc(d)} fonte="Fonte: TX-0012" />}</VistaQuery>;
}

function ImportiSigc({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useSigcImporti(filtri)}>
      {(d) => <CardGrafico titolo="Importi SIGC" dati={graficoCascataSigc(d)} fonte="Fonte: TX-0013 · pagato dal flusso ASR2-20" />}
    </VistaQuery>
  );
}

function Sigc({ filtri }: { filtri: Filtri }) {
  return (
    <Griglia>
      <ConGrant grant="csr.tx-0012.read" titolo="Domande SIGC">
        <DomandeSigc filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0013.read" titolo="Importi SIGC">
        <ImportiSigc filtri={filtri} />
      </ConGrant>
    </Griglia>
  );
}

function Corpo({ codice, descrizione }: { codice: string; descrizione?: string | null }) {
  const filtri: Filtri = { intervento: [codice] };
  const riepilogo = useRiepilogo(filtri);
  const spesa = useSpesaPerIntervento(filtri, hasGrant(useAuthStatus().data, 'csr.tx-0002.read'));
  return (
    <VistaQuery stato={riepilogo}>
      {(d) => {
        const r = d.righe?.[0];
        if (!r) {
          return (
            <>
              <Testata codice={codice} descrizione={descrizione} perimetro={d.perimetro} />
              <Vuoto>
                {"Nessun dato per questo intervento nel tuo perimetro. "}
                <Link to="/finanziario/riepilogo">Torna al riepilogo</Link>
              </Vuoto>
            </>
          );
        }
        return (
          <>
            <Testata codice={codice} descrizione={descrizione} perimetro={d.perimetro} contributo={spesa.data?.righe?.[0]?.percentualeContributoAmbientale} />
            <PerimetroSezione perimetro={d.perimetro} />
            <Kpis r={r} />
            <Tabs>
              <TabList aria-label="Sezioni dell'intervento" className="ui-tabs">
                <Tab id="sintesi" className="ui-tab">
                  Sintesi
                </Tab>
                <Tab id="domande" className="ui-tab">
                  Domande
                </Tab>
                <Tab id="sigc" className="ui-tab">
                  SIGC
                </Tab>
                <Tab id="voci" className="ui-tab">
                  Tutte le voci
                </Tab>
              </TabList>
              <TabPanel id="sintesi">
                <Sintesi filtri={filtri} r={r} perimetro={d.perimetro} />
              </TabPanel>
              <TabPanel id="domande">
                <Domande filtri={filtri} />
              </TabPanel>
              <TabPanel id="sigc">
                <Sigc filtri={filtri} />
              </TabPanel>
              <TabPanel id="voci">
                <TabellaDati tabella={graficoCascataIntervento(r).tabella} />
              </TabPanel>
            </Tabs>
          </>
        );
      }}
    </VistaQuery>
  );
}

/** Dettaglio dell'intervento; il codice viene dalla route ed e' gia' validato dalla pagina. */
export function DettaglioIntervento({ codice }: { codice: string }) {
  const conFiltri = hasGrant(useAuthStatus().data, 'csr.tx-0001.read');
  const { data } = useFiltri(conFiltri);
  const descrizione = data?.interventi?.find((v) => v.chiave === codice)?.descrizione;
  return (
    <ConGrant grant="csr.tx-0011.read" titolo="Dettaglio dell'intervento">
      <Corpo codice={codice} descrizione={descrizione} />
    </ConGrant>
  );
}
