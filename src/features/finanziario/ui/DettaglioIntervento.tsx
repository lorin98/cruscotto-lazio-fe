// DettaglioIntervento — contenuto della pagina di dettaglio di un intervento (route /finanziario/interventi/:codice,
// flusso panoramica v2): le transazioni dei report filtrate sull'intervento (nessuna transazione nuova). Il titolo (h1)
// e' della pagina; qui la testata con i badge e le azioni, i KPI dalla riga del riepilogo (TX-0011), le schede: Sintesi
// (gauge, cascata), Domande (TX-0008, TX-0010), SIGC (TX-0012, TX-0013), Tutte le voci (con il motivo dei valori
// assenti). Le schede leggono solo quando si aprono e solo con il grant (letture nei figli di ConGrant, R-09). I dati
// sono del solo intervento; i link di ritorno conservano la selezione della pagina (filtri dell'indirizzo, N-03).
import { Link } from 'react-router';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { formatNumber, formatPercentuale } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, TabellaDati, VistaQuery, Vuoto } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useRiepilogo, useSigcDomande, useSigcImporti, useSpesaPerIntervento } from '../api';
import type { RiepilogoFinanziarioRiga } from '../api';
import type { Filtri } from '../lib/filtri';
import { graficoCascataIntervento, graficoCascataSigc, graficoDomandePerAnno, graficoGauge, graficoImbutoSigc, graficoImportiPerAnno, vociIntervento } from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import { GRANT, PERCORSI, conFiltri } from '../lib/report';
import { ConGrant, KpiImporto, NotaPerimetroMisto, PerimetroSezione, diProgramma } from './comuni';

// titolo del wireframe intervento (scheda Domande)
const IMPORTI_PER_ANNO = 'Importi ammessi e decretati per anno';

function Testata({ codice, selezione, perimetro, contributo }: { codice: string; selezione: Filtri; perimetro?: Perimetro; contributo?: number | null }) {
  return (
    <section className="ui-hero ui-dissolvenza" aria-label={`Intervento ${codice}`}>
      <span className="ui-eyebrow">{`Intervento ${codice}`}</span>
      {perimetro && <span className="ui-hero__badge">{`Perimetro ${perimetro}`}</span>}
      {contributo != null && <span className="ui-hero__badge">{`Contributo ambientale ${formatPercentuale(contributo)}`}</span>}
      <div className="ui-hero__azioni">
        <Link className="btn btn-light btn-sm" to={conFiltri(PERCORSI.panoramica, { intervento: [codice] })}>
          Filtra i report su questo intervento
        </Link>
        <Link className="btn btn-outline-light btn-sm" to={conFiltri(PERCORSI.riepilogo, selezione)}>
          Torna al riepilogo
        </Link>
      </div>
    </section>
  );
}

function Kpis({ r, perimetro }: { r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  return (
    <Griglia colonne={4}>
      <KpiImporto etichetta={diProgramma('Dotazione spesa pubblica', perimetro)} importo={r.dotazioneSpesaPubblica} icona="it-card" tono="scuro" aggregato={false} />
      <KpiImporto etichetta={diProgramma('Risorse quota FEASR', perimetro)} importo={r.risorseQuotaFeasr} icona="it-presentation" tono="blu" aggregato={false} />
      <KpiImporto etichetta="Pagamenti al netto delle rettifiche" importo={r.pagamentiNettoRettifiche} icona="it-chart-line" tono="verde" aggregato={false} />
      <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(r.domandePresentate)} />
    </Griglia>
  );
}

// il gauge legge i pagamenti totali di TX-0002: caricamento ed errore sono rami suoi, mai "valore non disponibile"
function PagatoSullaDotazione({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  return (
    <VistaQuery stato={useSpesaPerIntervento(filtri)}>
      {(d) => (
        <CardGrafico
          titolo="Pagato sulla dotazione"
          dati={graficoGauge(d.righe?.[0]?.pagamentiTotali?.valore, r.dotazioneSpesaPubblica?.valore, 'della dotazione pagato', perimetro)}
          fonte="Fonte: TX-0002 (pagamenti totali) e TX-0011 (dotazione)"
        />
      )}
    </VistaQuery>
  );
}

function Sintesi({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  return (
    <Griglia>
      <ConGrant grant={GRANT.spesaPerIntervento} titolo="Pagato sulla dotazione">
        <PagatoSullaDotazione filtri={filtri} r={r} perimetro={perimetro} />
      </ConGrant>
      <CardGrafico titolo="Dalla dotazione al residuo" dati={graficoCascataIntervento(r, perimetro)} fonte="Fonte: TX-0011, riepilogo per intervento" />
    </Griglia>
  );
}

function DomandePerAnno({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useDomandePerAnno(filtri)}>{(d) => <CardGrafico titolo="Domande per anno di raccolta" dati={graficoDomandePerAnno(d.righe ?? [])} fonte="Fonte: TX-0008" />}</VistaQuery>;
}

function ImportiPerAnno({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useImportiPerAnno(filtri)}>{(d) => <CardGrafico titolo={IMPORTI_PER_ANNO} dati={graficoImportiPerAnno(d.righe ?? [])} fonte="Fonte: TX-0010" />}</VistaQuery>;
}

function DomandeSigc({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useSigcDomande(filtri)}>{(d) => <CardGrafico titolo="Domande SIGC" dati={graficoImbutoSigc(d)} fonte="Fonte: TX-0012" />}</VistaQuery>;
}

function ImportiSigc({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useSigcImporti(filtri)}>{(d) => <CardGrafico titolo="Importi SIGC" dati={graficoCascataSigc(d)} fonte="Fonte: TX-0013 · pagato dal flusso ASR2-20" />}</VistaQuery>;
}

function Schede({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  return (
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
        <Sintesi filtri={filtri} r={r} perimetro={perimetro} />
      </TabPanel>
      <TabPanel id="domande">
        <Griglia>
          <ConGrant grant={GRANT.domandePerAnno} titolo="Domande per anno di raccolta">
            <DomandePerAnno filtri={filtri} />
          </ConGrant>
          <ConGrant grant={GRANT.importiPerAnno} titolo={IMPORTI_PER_ANNO}>
            <ImportiPerAnno filtri={filtri} />
          </ConGrant>
        </Griglia>
      </TabPanel>
      <TabPanel id="sigc">
        <Griglia>
          <ConGrant grant={GRANT.sigcDomande} titolo="Domande SIGC">
            <DomandeSigc filtri={filtri} />
          </ConGrant>
          <ConGrant grant={GRANT.sigcImporti} titolo="Importi SIGC">
            <ImportiSigc filtri={filtri} />
          </ConGrant>
        </Griglia>
      </TabPanel>
      <TabPanel id="voci">
        <TabellaDati tabella={vociIntervento(r, perimetro)} />
      </TabPanel>
    </Tabs>
  );
}

function Contenuto({ codice, selezione }: { codice: string; selezione: Filtri }) {
  const filtri: Filtri = { intervento: [codice] };
  const riepilogo = useRiepilogo(filtri);
  // il contributo ambientale della testata viene da TX-0002: si legge solo con il suo grant (R-09)
  const spesa = useSpesaPerIntervento(filtri, hasGrant(useAuthStatus().data, GRANT.spesaPerIntervento));
  return (
    <VistaQuery stato={riepilogo}>
      {(d) => {
        const r = d.righe?.[0];
        if (!r) {
          return (
            <>
              <Testata codice={codice} selezione={selezione} perimetro={d.perimetro} />
              <Vuoto>
                {'Nessun dato per questo intervento nel riepilogo. '}
                <Link to={conFiltri(PERCORSI.riepilogo, selezione)}>Torna al riepilogo</Link>
              </Vuoto>
            </>
          );
        }
        return (
          <>
            <Testata codice={codice} selezione={selezione} perimetro={d.perimetro} contributo={spesa.data?.righe?.[0]?.percentualeContributoAmbientale} />
            <PerimetroSezione perimetro={d.perimetro} />
            <NotaPerimetroMisto perimetro={d.perimetro} />
            <Kpis r={r} perimetro={d.perimetro} />
            <Schede filtri={filtri} r={r} perimetro={d.perimetro} />
          </>
        );
      }}
    </VistaQuery>
  );
}

/**
 * Dettaglio dell'intervento; il codice viene dalla route ed e' gia' validato dalla pagina. `selezione`: i filtri
 * dell'indirizzo, da cui l'utente e' arrivato e a cui tornano i link (le letture usano solo l'intervento).
 */
export function DettaglioIntervento({ codice, selezione = {} }: { codice: string; selezione?: Filtri }) {
  return (
    <ConGrant grant={GRANT.riepilogo} titolo="Dettaglio dell'intervento">
      <Contenuto codice={codice} selezione={selezione} />
    </ConGrant>
  );
}
