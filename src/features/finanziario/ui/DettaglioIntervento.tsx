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
import { CardGrafico, Griglia, Kpi, TabellaDati, TabellaRighe, VistaQuery, Vuoto } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useRiepilogo, useSigcDomande, useSigcImporti, useSpesaPerIntervento } from '../api';
import type { RiepilogoFinanziarioRiga } from '../api';
import { datiDelReport } from './esportazioni';
import type { Filtri } from '../lib/filtri';
import { VOCI_DOMANDE_SIGC, graficoCascataIntervento, graficoCascataSigc, graficoDomandePerAnno, graficoDomandeSigc, graficoImportiPerAnno, graficoPagatoNetto, vociIntervento } from '../lib/grafici';
import { perAnno } from '../lib/importi';
import { annoDiRaccolta } from '../lib/formato';
import { criteriAnnoAnnualita, criteriDomandePerAnno, criteriVoceSigc } from '../lib/link-elenco';
import type { CriteriLink } from '../lib/link-elenco';
import type { Perimetro } from '../lib/perimetro';
import { GRANT, PERCORSI, conFiltri } from '../lib/report';
import { ConGrant, KpiImporto, NotaPerimetroMisto, PerimetroSezione, diProgramma } from './comuni';
import { useSelezioneSenzaDomandeSigc } from './selezione';
import { ApriNellElenco, useApriNellElenco, useLinkElenco } from './LinkElenco';
import { colonneDomandePerAnno } from './colonneAnno';

/** I link verso l'elenco portano la selezione da cui si e' arrivati, con l'intervento del dettaglio al posto del filtro. */
interface Provenienza {
  codice: string;
  selezione: Filtri;
}

const conIntervento = (criteri: CriteriLink | null, codice: string): CriteriLink | null => (criteri === null ? null : { ...criteri, intervento: codice });

// titolo del wireframe intervento (scheda Domande)
const IMPORTI_PER_ANNO = 'Importi ammessi e decretati per anno';
// nel dettaglio i filtri sono fissi (il solo intervento): il vuoto non invita a modificarli (review v3 N-03)
const SENZA_SIGC = (d: { perimetro?: Perimetro | null }) => (
  <>
    <PerimetroSezione perimetro={d.perimetro} />
    Nessuna domanda SIGC per questo intervento.
  </>
);

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

function Kpis({ r, perimetro, da }: { r: RiepilogoFinanziarioRiga; perimetro?: Perimetro; da: Provenienza }) {
  const link = useLinkElenco(da.selezione);
  return (
    <Griglia colonne={4}>
      <KpiImporto etichetta={diProgramma('Dotazione spesa pubblica', perimetro)} importo={r.dotazioneSpesaPubblica} icona="it-card" tono="scuro" aggregato={false} />
      <KpiImporto etichetta={diProgramma('Risorse quota FEASR', perimetro)} importo={r.risorseQuotaFeasr} icona="it-presentation" tono="blu" aggregato={false} />
      <KpiImporto etichetta="Pagamenti al netto delle rettifiche" importo={r.pagamentiNettoRettifiche} icona="it-chart-line" tono="verde" aggregato={false} />
      <Kpi
        etichetta="Domande presentate"
        icona="it-files"
        tono="ambra"
        valore={formatNumber(r.domandePresentate)}
        azione={<ApriNellElenco indirizzo={link('elenco-presentate-intervento', { presentata: true, intervento: da.codice })} descrizione={`le domande presentate dell'intervento ${da.codice}`} />}
      />
    </Griglia>
  );
}

// il gauge usa i pagamenti al netto delle rettifiche della riga (TX-0011), come il KPI e la cascata accanto: mai il
// pagato lordo degli elenchi di liquidazione (TX-0002) su una dotazione il cui residuo e' calcolato sul netto
function Sintesi({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  return (
    <Griglia>
      <CardGrafico
        titolo="Pagato netto sulla dotazione"
        sottotitolo="Pagamenti al netto delle rettifiche sulla dotazione, come il residuo sui pagamenti"
        dati={graficoPagatoNetto(r.pagamentiNettoRettifiche, r.dotazioneSpesaPubblica, perimetro, false)}
        fonte="Fonte: TX-0011, riepilogo per intervento"
        scaricamenti={datiDelReport('Pagato netto sulla dotazione', 'riepilogo', filtri)}
      />
      <CardGrafico
        titolo="Dalla dotazione al residuo"
        dati={graficoCascataIntervento(r, perimetro)}
        fonte="Fonte: TX-0011, riepilogo per intervento"
        scaricamenti={datiDelReport(`Riepilogo ${r.codiceIntervento ?? 'intervento'}`, 'riepilogo', filtri)}
      />
    </Griglia>
  );
}

function DomandePerAnno({ filtri, da }: { filtri: Filtri; da: Provenienza }) {
  const apri = useApriNellElenco(da.selezione);
  const link = useLinkElenco(da.selezione);
  // la tabella equivalente del grafico porta in ogni cella lo stesso link del segmento: il percorso da tastiera del clic
  // (solo col grant dell'elenco; senza, resta la tabella generata dai dati)
  const conLink = link('elenco-anno-intervento', { presentata: true, intervento: da.codice }) !== null;
  return (
    <VistaQuery stato={useDomandePerAnno(filtri)}>
      {(d) => (
        <CardGrafico
          titolo="Domande per anno di raccolta"
          sottotitolo="Clic su un segmento, o sulla cella della vista Tabella: le domande dell'anno e dell'annualità nell'elenco operativo"
          dati={graficoDomandePerAnno(d.righe ?? [])}
          fonte="Fonte: TX-0008"
          onClic={(p) => apri('elenco-anno-intervento', conIntervento(criteriDomandePerAnno(perAnno(d.righe ?? []), p), da.codice))}
          scaricamenti={datiDelReport('Domande per anno di raccolta', 'domandePerAnno', filtri)}
          tabella={
            conLink ? (
              <TabellaRighe
                caption="Domande per anno di raccolta"
                intestazione="Anno di raccolta"
                chiave={(r) => annoDiRaccolta(r.annoRaccolta)}
                colonne={colonneDomandePerAnno((r, annualita) => link('elenco-anno-intervento', { ...criteriAnnoAnnualita(r.annoRaccolta, annualita), intervento: da.codice }), ` dell'intervento ${da.codice}`)}
                righe={perAnno(d.righe ?? [])}
              />
            ) : undefined
          }
        />
      )}
    </VistaQuery>
  );
}

function ImportiPerAnno({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useImportiPerAnno(filtri)}>{(d) => <CardGrafico titolo={IMPORTI_PER_ANNO} dati={graficoImportiPerAnno(d.righe ?? [])} fonte="Fonte: TX-0010" scaricamenti={datiDelReport(IMPORTI_PER_ANNO, 'importiPerAnno', filtri)} />}</VistaQuery>;
}

/** Le voci delle domande SIGC nell'elenco operativo, anche da tastiera (il clic sul grafico porta agli stessi indirizzi). */
function VociSigcNellElenco({ da }: { da: Provenienza }) {
  const link = useLinkElenco(da.selezione);
  const voci = VOCI_DOMANDE_SIGC.map((v) => ({ nome: v.nome, indirizzo: link('elenco-sigc-intervento', conIntervento(criteriVoceSigc(v.nome), da.codice) ?? undefined) }));
  if (voci.every((x) => x.indirizzo === null)) return null;
  return (
    <p className="ui-link-elenco--riga">
      <span>Nell&apos;elenco operativo:</span>
      {voci.map(({ nome, indirizzo }) => (
        <ApriNellElenco key={nome} variante="testo" indirizzo={indirizzo} testo={nome.toLowerCase()} descrizione={`le domande SIGC ${nome.toLowerCase()} dell'intervento ${da.codice}`} />
      ))}
    </p>
  );
}

function DomandeSigc({ filtri, da }: { filtri: Filtri; da: Provenienza }) {
  const apri = useApriNellElenco(da.selezione);
  return (
    <VistaQuery stato={useSigcDomande(filtri)}>
      {(d) => (
        <div>
          <CardGrafico
            titolo="Domande SIGC"
            sottotitolo="Pagate e da pagare si sovrappongono (domande pagate in parte); senza importi: non classificabili. Clic su una barra: le domande nell'elenco operativo"
            dati={graficoDomandeSigc(d)}
            fonte="Fonte: TX-0012 · pagate e da pagare dagli importi della domanda (flusso ASR2-20), come l'importo pagato"
            onClic={(p) => apri('elenco-sigc-intervento', conIntervento(criteriVoceSigc(p.name), da.codice))}
            scaricamenti={datiDelReport('Domande SIGC', 'sigcDomande', filtri)}
          />
          <VociSigcNellElenco da={da} />
        </div>
      )}
    </VistaQuery>
  );
}

/**
 * Per un intervento senza domande SIGC il backend restituisce importi a zero: come in SigcReport, il segnale delle domande
 * presentate (stessa lettura in cache di RF012) dichiara il vuoto invece di una cascata di zeri (NFR-15 e, review v3 X-01).
 */
function ImportiSigc({ filtri, da }: { filtri: Filtri; da: Provenienza }) {
  const segnale = useSelezioneSenzaDomandeSigc(filtri);
  const apri = useApriNellElenco(da.selezione);
  return (
    <VistaQuery stato={useSigcImporti(filtri)} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={SENZA_SIGC}>
      {(d) => (
        <CardGrafico
          titolo="Importi SIGC"
          sottotitolo="Clic sulla cascata: le domande SIGC dell'intervento nell'elenco operativo"
          dati={graficoCascataSigc(d)}
          fonte="Fonte: TX-0013 · importi della domanda (flusso ASR2-20)"
          onClic={() => apri('elenco-sigc-intervento', { sigc: true, intervento: da.codice })}
          scaricamenti={datiDelReport('Importi SIGC', 'sigcImporti', filtri)}
        />
      )}
    </VistaQuery>
  );
}

function Schede({ filtri, r, perimetro, da }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro; da: Provenienza }) {
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
            <DomandePerAnno filtri={filtri} da={da} />
          </ConGrant>
          <ConGrant grant={GRANT.importiPerAnno} titolo={IMPORTI_PER_ANNO}>
            <ImportiPerAnno filtri={filtri} />
          </ConGrant>
        </Griglia>
      </TabPanel>
      <TabPanel id="sigc">
        <Griglia>
          <ConGrant grant={GRANT.sigcDomande} titolo="Domande SIGC">
            <DomandeSigc filtri={filtri} da={da} />
          </ConGrant>
          <ConGrant grant={GRANT.sigcImporti} titolo="Importi SIGC">
            <ImportiSigc filtri={filtri} da={da} />
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
            <Kpis r={r} perimetro={d.perimetro} da={{ codice, selezione }} />
            <Schede filtri={filtri} r={r} perimetro={d.perimetro} da={{ codice, selezione }} />
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
