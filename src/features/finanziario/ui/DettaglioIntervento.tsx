// DettaglioIntervento — contenuto della pagina di dettaglio di un intervento (route /finanziario/interventi/:codice,
// flusso panoramica v2): le transazioni dei report filtrate sull'intervento (nessuna transazione nuova). Il titolo (h1)
// e' della pagina; qui la testata con i badge e le azioni, i KPI dalla riga del riepilogo (TX-0011), le schede: Sintesi
// (gauge, due barre impilate), Domande (TX-0008, TX-0010), SIGC (TX-0012, TX-0013), Tutte le voci (con il motivo dei valori
// assenti). Le schede leggono solo quando si aprono e solo con il grant (letture nei figli di ConGrant, R-09). I dati
// sono del solo intervento; i link di ritorno conservano la selezione della pagina (filtri dell'indirizzo, N-03).
// Revisioni del 31/10/2026: testata col tipo dell'intervento al posto del contributo ambientale (R14, F5: niente lettura di
// TX-0002), gauge "Avanzamento rispetto ai pagamenti effettuati" (R15), cascata con lordi e rettifiche e le righe delle
// rettifiche (R08), importi SIGC in due barre impilate (R13 forma B), nessun "flusso ASR2-20" nei testi (R16). Note di
// Leonardo del 10/11/2026: gauge "Avanzamento dei pagamenti rispetto alla dotazione" (dotazione al centro, importo netto alla
// fine dell'arco) e "Dalla dotazione al residuo" in due barre impilate al posto della cascata.
import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { ApriNellElenco } from '../../../entities/domanda';
import { codiceDalClic, formatNumber, importoBreve, senzaSigc } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi, Sezione, TabellaDati, TabellaRighe, VistaQuery, Vuoto, eVistaGrafico } from '../../../shared/ui';
import type { ClicGrafico, VistaGrafico } from '../../../shared/ui';
import { useDomandePerAnno, useImportiPerAnno, useRiepilogo, useSigcDomande, useSigcImporti } from '../api';
import type { DomandePerAnno as DomandePerAnnoDto, RiepilogoFinanziarioRiga } from '../api';
import { datiDelReport } from './esportazioni';
import { conParametroDiPagina } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { VOCI_DOMANDE_SIGC, graficoBarreIntervento, graficoDomandePerAnno, graficoDomandeSigc, graficoImportiPerAnno, graficoImportiSigc, graficoPagatoNetto, vociIntervento } from '../lib/grafici';
import { perAnno } from '../lib/importi';
import { annoDiRaccolta } from '../lib/formato';
import { criteriAnnoAnnualita, criteriDomandePerAnno, criteriVoceSigc } from '../lib/link-elenco';
import type { CriteriLink } from '../lib/link-elenco';
import type { Perimetro } from '../lib/perimetro';
import { GRANT, PERCORSI, conFiltri } from '../lib/report';
import { ConGrant, KpiImporto, NotaPerimetroMisto, PerimetroSezione, diProgramma } from './comuni';
import { useSelezioneSenzaDomandeSigc } from './selezione';
import { useApriNellElenco, useLinkElenco } from './LinkElenco';
import { colonneDomandePerAnno } from './colonneAnno';
import { useStatoDelRiepilogo } from './ritornoAlRiepilogo';
import { useStatoNellaHistory } from './useStatoNellaHistory';
import { useTipoIntervento } from './useDescrizioneIntervento';
import { TabellaRettifiche } from './rettifiche';
import { conRigheDiRettifiche, testoSenzaRighe } from '../lib/rettifiche';
import { notaDiCuiStimato } from '../lib/stima';
import type { FiltroSigc } from '../../../shared/lib';

// R15: il titolo del gauge dei pagamenti netti sulla dotazione
const AVANZAMENTO_PAGAMENTI = 'Avanzamento dei pagamenti rispetto alla dotazione';
// le due barre di "Dalla dotazione al residuo": cosa somma ciascuna
const BARRE_INTERVENTO = 'Dotazione: pagamenti netti e residuo sui pagamenti; pagamenti lordi: pagamenti netti e rettifiche';

/** I link verso l'elenco portano la selezione da cui si e' arrivati, con l'intervento del dettaglio al posto del filtro. */
interface Provenienza {
  codice: string;
  selezione: Filtri;
  /**
   * L'intervento e' classificato SIGC: solo allora i link verso le domande SIGC dell'elenco (sigc=true, per intervento)
   * riproducono le domande SIGC di TX-0012/TX-0013 (per presenza nella domanda); altrimenti l'elenco sarebbe vuoto (X-02).
   */
  sigc: boolean;
}

/** I link verso le domande SIGC dell'intervento nell'elenco: solo per un intervento classificato SIGC (review X-02). */
function useLinkSigc(da: Provenienza) {
  const link = useLinkElenco(da.selezione);
  const apri = useApriNellElenco(da.selezione);
  return {
    link: (id: 'elenco-sigc-intervento', p: Parameters<typeof link>[1]) => (da.sigc ? link(id, p) : null),
    apri: (id: 'elenco-sigc-intervento', p: Parameters<typeof apri>[1]) => {
      if (da.sigc) apri(id, p);
    },
  };
}

const SOTTOTITOLO_DOMANDE_SIGC = 'Pagate e da pagare si sovrappongono (domande pagate in parte); senza importi: non classificabili.';
const CLIC_BARRA = " Clic su una barra: le domande nell'elenco operativo";
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

/** "Torna al riepilogo": con lo stato del riepilogo da cui si e' arrivati ritrova ricerca, ordine e pagina (review v4 X-04). */
function TornaAlRiepilogo({ selezione, className }: { selezione: Filtri; className?: string }) {
  return (
    <Link className={className} to={conFiltri(PERCORSI.riepilogo, selezione)} state={useStatoDelRiepilogo()}>
      Torna al riepilogo
    </Link>
  );
}

function Testata({ codice, selezione, perimetro, tipo }: { codice: string; selezione: Filtri; perimetro?: Perimetro; tipo?: FiltroSigc | null }) {
  return (
    <section className="ui-hero ui-dissolvenza" aria-label={`Intervento ${codice}`}>
      <span className="ui-eyebrow">{`Intervento ${codice}`}</span>
      {perimetro && <span className="ui-hero__badge">{`Perimetro ${perimetro}`}</span>}
      {tipo && <span className="ui-hero__badge">{`Intervento ${tipo} (dalla programmazione)`}</span>}
      <div className="ui-hero__azioni">
        <Link className="btn btn-light btn-sm" to={conFiltri(PERCORSI.panoramica, { intervento: [codice] })}>
          Filtra i report su questo intervento
        </Link>
        <TornaAlRiepilogo className="btn btn-outline-light btn-sm" selezione={selezione} />
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
      <KpiImporto etichetta="Pagamenti al netto delle rettifiche" importo={r.pagamentiNettoRettifiche} icona="it-chart-line" tono="verde" aggregato={false} nota={notaLordiERettifiche(r)} />
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

/** "lordi 1,2 M€, rettifiche 0,1 M€" sotto i pagamenti netti (R08); niente se manca uno dei due. */
function notaLordiERettifiche(r: RiepilogoFinanziarioRiga): string | undefined {
  const [lordi, rettifiche] = [r.pagamentiLordi?.valore, r.importoRettifiche?.valore];
  return lordi == null || rettifiche == null ? undefined : `lordi ${importoBreve(lordi)}, rettifiche ${importoBreve(rettifiche)}`;
}

/** Le righe delle rettifiche dell'intervento (R08): con il badge, "Nessuna rettifica", o la fonte non attiva. */
function RettificheIntervento({ r }: { r: RiepilogoFinanziarioRiga }) {
  const righe = r.rettifiche ?? [];
  const codice = r.codiceIntervento ?? '';
  // la regola unica delle rettifiche (lib/rettifiche, review H-07): la tabella solo con conRettifiche true e le righe
  let corpo;
  if (!conRigheDiRettifiche(r.conRettifiche, righe.length)) corpo = <p className="mb-0">{testoSenzaRighe(r.conRettifiche)}</p>;
  else
    corpo = (
      <>
        <p className="mb-2">
          <span className="badge ui-badge-testo">Con rettifiche</span>
        </p>
        <TabellaRettifiche codice={codice} rettifiche={righe} />
      </>
    );
  return (
    <Sezione titolo="Rettifiche dell'intervento" sottotitolo="Recuperi e variazioni certificati (foglio recuperi e variazioni del report FEASR)">
      {corpo}
      <p className="ui-fonte">Fonte: TX-0011 (rettifiche della riga). Le rettifiche dei trascinamenti PSR sono nel dettaglio ma fuori dal netto.</p>
    </Sezione>
  );
}

// il gauge usa i pagamenti al netto delle rettifiche della riga (TX-0011), come il KPI e le barre accanto: mai il
// pagato lordo degli elenchi di liquidazione su una dotazione il cui residuo e' calcolato sul netto
function Sintesi({ filtri, r, perimetro }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro }) {
  const stimato = notaDiCuiStimato(r.impegnatoStimato);
  return (
    <>
      <Griglia>
        <CardGrafico
          titolo={AVANZAMENTO_PAGAMENTI}
          sottotitolo="Percentuale di pagamenti al netto di rettifiche sulla dotazione spesa pubblica"
          dati={graficoPagatoNetto(r.pagamentiNettoRettifiche, r.dotazioneSpesaPubblica, perimetro, false)}
          fonte="Fonte: TX-0011, riepilogo per intervento"
          scaricamenti={datiDelReport(AVANZAMENTO_PAGAMENTI, 'riepilogo', filtri)}
        />
        <CardGrafico
          titolo="Dalla dotazione al residuo"
          sottotitolo={stimato ? `${BARRE_INTERVENTO}. Impegnato e residuo sugli impegni nella tabella; impegnato ${stimato}` : BARRE_INTERVENTO}
          dati={graficoBarreIntervento(r, perimetro)}
          fonte="Fonte: TX-0011, riepilogo per intervento"
          scaricamenti={datiDelReport(`Riepilogo ${r.codiceIntervento ?? 'intervento'}`, 'riepilogo', filtri)}
        />
      </Griglia>
      <RettificheIntervento r={r} />
    </>
  );
}

function DomandePerAnno({ filtri, da }: { filtri: Filtri; da: Provenienza }) {
  // la vista scelta (la Tabella e' il percorso da tastiera del clic) si ritrova tornando dall'elenco (review v4 V-05)
  const [vista, conservaVista] = useStatoNellaHistory<VistaGrafico>('vistaDomandePerAnno', da.selezione, eVistaGrafico);
  return <VistaQuery stato={useDomandePerAnno(filtri)}>{(d) => <CardDomandePerAnno d={d} filtri={filtri} da={da} vista={vista} onVista={conservaVista} />}</VistaQuery>;
}

function CardDomandePerAnno({ d, filtri, da, vista, onVista }: { d: DomandePerAnnoDto; filtri: Filtri; da: Provenienza; vista?: VistaGrafico; onVista: (v: VistaGrafico) => void }) {
  const apri = useApriNellElenco(da.selezione);
  const link = useLinkElenco(da.selezione);
  // la tabella equivalente del grafico porta in ogni cella lo stesso link del segmento: il percorso da tastiera del clic
  // (solo col grant dell'elenco; senza, resta la tabella generata dai dati)
  const conLink = link('elenco-anno-intervento', { presentata: true, intervento: da.codice }) !== null;
  const dati = graficoDomandePerAnno(d.righe ?? []);
  return (
    <CardGrafico
      titolo="Domande per anno di raccolta"
      // il clic si promette solo su un grafico disegnato (review v4 V-04)
      sottotitolo={conLink && dati.opzioni !== null ? "Clic su un segmento, o sulla cella della vista Tabella: le domande dell'anno e dell'annualità nell'elenco operativo" : undefined}
      dati={dati}
      vistaIniziale={vista}
      onVista={onVista}
      fonte="Fonte: TX-0008"
      onClic={(p) => apri('elenco-anno-intervento', conIntervento(criteriDomandePerAnno(p), da.codice))}
      scaricamenti={datiDelReport('Domande per anno di raccolta', 'domandePerAnno', filtri)}
      tabella={
        conLink ? (
          <TabellaRighe
            caption={dati.tabella.caption}
            intestazione={dati.tabella.colonne[0]}
            chiave={(r) => annoDiRaccolta(r.annoRaccolta)}
            colonne={colonneDomandePerAnno((r, annualita) => link('elenco-anno-intervento', { ...criteriAnnoAnnualita(r.annoRaccolta, annualita), intervento: da.codice }), ` dell'intervento ${da.codice}`)}
            righe={perAnno(d.righe ?? [])}
          />
        ) : undefined
      }
    />
  );
}

function ImportiPerAnno({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useImportiPerAnno(filtri)}>{(d) => <CardGrafico titolo={IMPORTI_PER_ANNO} dati={graficoImportiPerAnno(d.righe ?? [])} fonte="Fonte: TX-0010" scaricamenti={datiDelReport(IMPORTI_PER_ANNO, 'importiPerAnno', filtri)} />}</VistaQuery>;
}

/** Le voci delle domande SIGC nell'elenco operativo, anche da tastiera (il clic sul grafico porta agli stessi indirizzi). */
function VociSigcNellElenco({ da }: { da: Provenienza }) {
  const { link } = useLinkSigc(da);
  const voci = VOCI_DOMANDE_SIGC.map((v) => ({ nome: v.nome, indirizzo: link('elenco-sigc-intervento', conIntervento(criteriVoceSigc(v.codice), da.codice)) }));
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
  const { link, apri } = useLinkSigc(da);
  const conLink = link('elenco-sigc-intervento', { sigc: true, intervento: da.codice }) !== null;
  return (
    // senza domande SIGC il vuoto si dichiara, come per gli importi: ne' grafico ne' link verso un elenco vuoto (review v4 V-04)
    <VistaQuery stato={useSigcDomande(filtri)} eVuoto={(d) => d.presentate === 0} vuoto={SENZA_SIGC}>
      {(d) => (
        <div>
          <CardDomandeSigc d={d} filtri={filtri} conLink={conLink} onClic={(p) => apri('elenco-sigc-intervento', conIntervento(criteriVoceSigc(codiceDalClic(p)), da.codice))} />
          <VociSigcNellElenco da={da} />
        </div>
      )}
    </VistaQuery>
  );
}

/** Il grafico delle domande SIGC dell'intervento; il clic si promette solo su un grafico disegnato (review v4 V-04). */
function CardDomandeSigc({ d, filtri, conLink, onClic }: { d: Parameters<typeof graficoDomandeSigc>[0]; filtri: Filtri; conLink: boolean; onClic: (p: ClicGrafico) => void }) {
  const dati = graficoDomandeSigc(d);
  return (
    <CardGrafico
      titolo="Domande SIGC"
      sottotitolo={SOTTOTITOLO_DOMANDE_SIGC + (conLink && dati.opzioni !== null ? CLIC_BARRA : '')}
      dati={dati}
      fonte="Fonte: TX-0012 · pagate e da pagare dagli importi della domanda, come l'importo pagato"
      onClic={onClic}
      scaricamenti={datiDelReport('Domande SIGC', 'sigcDomande', filtri)}
    />
  );
}

/**
 * Per un intervento senza domande SIGC il backend restituisce importi a zero: come in SigcReport, il segnale delle domande
 * presentate (stessa lettura in cache di RF012) dichiara il vuoto invece di una cascata di zeri (NFR-15 e, review v3 X-01).
 */
function ImportiSigc({ filtri, da }: { filtri: Filtri; da: Provenienza }) {
  const segnale = useSelezioneSenzaDomandeSigc(filtri);
  const { link, apri } = useLinkSigc(da);
  const indirizzo = link('elenco-sigc-intervento', { sigc: true, intervento: da.codice });
  return (
    <VistaQuery stato={useSigcImporti(filtri)} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={SENZA_SIGC}>
      {(d) => (
        <BarreImportiSigc dati={graficoImportiSigc(d)} indirizzo={indirizzo} filtri={filtri} onClic={() => apri('elenco-sigc-intervento', { sigc: true, intervento: da.codice })} />
      )}
    </VistaQuery>
  );
}

/** Gli importi SIGC dell'intervento in due barre impilate (R13 B) e, sotto, lo stesso link da tastiera, anche senza grafico. */
function BarreImportiSigc({ dati, indirizzo, filtri, onClic }: { dati: ReturnType<typeof graficoImportiSigc>; indirizzo: string | null; filtri: Filtri; onClic: () => void }) {
  const clic = indirizzo && dati.opzioni !== null ? " Clic sul grafico: le domande SIGC dell'intervento nell'elenco operativo" : '';
  return (
    <div>
      <CardGrafico
        titolo="Importi SIGC"
        sottotitolo={`Richiesto = ammesso + non ammesso; ammesso = pagato + ancora da pagare.${clic}`}
        dati={dati}
        fonte="Fonte: TX-0013 · importi della domanda"
        onClic={onClic}
        scaricamenti={datiDelReport('Importi SIGC', 'sigcImporti', filtri)}
      />
      <ApriNellElenco variante="testo" indirizzo={indirizzo} testo="Le domande SIGC dell'intervento nell'elenco operativo" descrizione="(sinottico con richiesto, ammesso, pagato e ancora da pagare)" />
    </div>
  );
}

const SCHEDE = ['sintesi', 'domande', 'sigc', 'voci'] as const;
type Scheda = (typeof SCHEDE)[number];
const eScheda = (v: string | null): v is Scheda => v !== null && (SCHEDE as readonly string[]).includes(v);

/**
 * Scheda selezionata nell'indirizzo (?scheda=), con replace: tornando indietro dall'elenco operativo si ritrova. La scelta e'
 * subito quella mostrata (stato locale) e l'indirizzo la segue: la navigazione e' asincrona e la scheda selezionata non torna
 * per un istante a quella di prima (review v4 A-01). Lo state della navigazione (lo stato del riepilogo, X-04) resta.
 */
function useScheda(): [Scheda, (s: Scheda) => void] {
  const [ricerca, setRicerca] = useSearchParams();
  const { state } = useLocation();
  const valore = ricerca.get('scheda');
  const dallIndirizzo: Scheda = eScheda(valore) ? valore : 'sintesi';
  const [inAttesa, setInAttesa] = useState<Scheda | null>(null);
  // l'indirizzo ha raggiunto la scelta: da qui vale di nuovo l'indirizzo (anche se poi cambia da fuori)
  if (inAttesa !== null && inAttesa === dallIndirizzo) setInAttesa(null);
  const scegli = (s: Scheda) => {
    setInAttesa(s);
    setRicerca((p) => conParametroDiPagina(p, 'scheda', s === 'sintesi' ? null : s), { replace: true, state });
  };
  return [inAttesa ?? dallIndirizzo, scegli];
}

function Schede({ filtri, r, perimetro, da }: { filtri: Filtri; r: RiepilogoFinanziarioRiga; perimetro?: Perimetro; da: Provenienza }) {
  const [scheda, scegli] = useScheda();
  return (
    <Tabs selectedKey={scheda} onSelectionChange={(k) => eScheda(String(k)) && scegli(String(k) as Scheda)}>
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
  // il tipo dell'intervento della testata dai valori dei filtri (TX-0001, la stessa lettura in cache del titolo)
  const tipo = useTipoIntervento(codice);
  return (
    <VistaQuery stato={riepilogo}>
      {(d) => {
        const r = d.righe?.[0];
        if (!r) {
          return (
            <>
              <Testata codice={codice} selezione={selezione} perimetro={d.perimetro} tipo={tipo} />
              <Vuoto>
                {'Nessun dato per questo intervento nel riepilogo. '}
                <TornaAlRiepilogo selezione={selezione} />
              </Vuoto>
            </>
          );
        }
        return (
          <>
            <Testata codice={codice} selezione={selezione} perimetro={d.perimetro} tipo={tipo} />
            <PerimetroSezione perimetro={d.perimetro} />
            <NotaPerimetroMisto perimetro={d.perimetro} />
            {/* i link verso l'elenco senza il filtro SIGC della provenienza: il dettaglio non lo applica (F5, review A-08) */}
            <Kpis r={r} perimetro={d.perimetro} da={{ codice, selezione: senzaSigc(selezione), sigc: tipo === 'SIGC' }} />
            <Schede filtri={filtri} r={r} perimetro={d.perimetro} da={{ codice, selezione: senzaSigc(selezione), sigc: tipo === 'SIGC' }} />
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
