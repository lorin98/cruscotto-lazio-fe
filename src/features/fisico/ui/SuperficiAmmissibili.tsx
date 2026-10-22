// SuperficiAmmissibili — pagina /fisico/superfici (flusso superfici approvato, report v2 come il riepilogo del finanziario,
// RF018): barra dei filtri a chip col pannello (voci da TX-0060, G2), la pill del perimetro regionale e la pill "Dati al"
// (ultimiDatiSincronizzati di TX-0018, G3); percorso e un solo h1 col focus; KPI della campagna di riferimento (quella del
// filtro Campagna o la piu' recente della risposta: le campagne non si sommano, D-01); card "Superfici per intervento e
// campagna" con l'interruttore di pagina Grafico | Tabella (vista iniziale Grafico): tre card grafico (barre DS e DP per
// intervento, linea per campagna, verifica incrociata DP - DS), ognuna con Grafico | Tabella e i download PNG, CSV, XLSX
// (CSV e XLSX della campagna della card nelle card della campagna di riferimento: scelta approvata il 22/10/2026), oppure
// la tabella interattiva coi totali per campagna; anteprima dell'intervento nel drawer. UNA lettura di TX-0018 per pagina,
// coi criteri dell'indirizzo. Stati: caricamento (scheletro), errore (un solo avviso della pagina, problem-type), vuoto
// (nessun intervento; nessuna superficie, mai una pagina di zeri) e valori dei filtri non disponibili (nel pannello).
// Nessun link verso altre pagine (OP-FIS-05): il clic apre l'anteprima o mette un filtro della stessa pagina.
// Design system: classi bootstrap-italia e del kit v2 (card, KPI, bottoni, interruttore con aria-pressed); i primitivi
// react-aria stanno solo dentro i componenti del kit che li richiedono (pannello e drawer modali, popover della pill).
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { codiceDalClic, formatNumber, righeContesto } from '../../../shared/lib';
import {
  AvvisoPagina,
  BarraFiltri,
  Briciole,
  Caricamento,
  CardGrafico,
  ContestoIntestazione,
  Griglia,
  InterruttoreVista,
  Kpi,
  PillDatiAl,
  Sezione,
  TestaPagina,
  VistaQuery,
  Vuoto,
} from '../../../shared/ui';
import type { ClicGrafico, VistaGrafico } from '../../../shared/ui';
import { useSuperfici } from '../api';
import type { SuperficieAmmissibile } from '../api';
import type { InterventoSuperficie } from '../lib/dto';
import { campagnaDaTesto, conCampagna, ricercaDaCriteri, soloIntervento, testiCriteri } from '../lib/criteri';
import type { Criteri } from '../lib/criteri';
import { testoDifferenza, testoPerimetro, testoQuantitaPremio, testoQuotaOltreDs, testoSuperficie } from '../lib/formato';
import { graficoPerCampagna, graficoPerIntervento, graficoVerifica } from '../lib/grafici';
import { PERCORSI } from '../lib/pagine';
import { campagnaDi, campagnePresenti, esitoSuperfici, quotaDpOltreDs, totaliCampagna, totaliPerCampagna } from '../lib/superfici';
import { AnteprimaIntervento } from './AnteprimaIntervento';
import { PannelloFiltriSuperfici } from './PannelloFiltriSuperfici';
import { TITOLO_TABELLA, TabellaSuperfici } from './TabellaSuperfici';
import { scaricamentiSuperfici } from './esportazioni';
import { useCriteriNellIndirizzo } from './useCriteriNellIndirizzo';

const SOTTOTITOLO =
  "Superficie ammissibile delle domande di sostegno (DS) e delle domande di pagamento (DP) per intervento e campagna, con la verifica incrociata fra le due. Clic su una barra per l'anteprima dell'intervento; nella vista Tabella cerca, ordina e scegli le colonne.";

/** Stato vuoto con "Modifica i filtri", che apre il pannello. */
function VuotoConFiltri({ children, onModifica }: { children: ReactNode; onModifica: () => void }) {
  return (
    <>
      <span>{children}</span>
      <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={onModifica}>
        Modifica i filtri
      </button>
    </>
  );
}

/** I quattro KPI della campagna di riferimento (somme delle righe della campagna: il report e' completo). */
function KpiCampagna({ righe, campagna }: { righe: readonly InterventoSuperficie[]; campagna: number }) {
  const t = totaliCampagna(righe, campagna);
  if (!t) return null;
  const quota = quotaDpOltreDs(t);
  const domande = (n: number, tipo: string) => `${formatNumber(n)} ${n === 1 ? 'domanda' : 'domande'} di ${tipo}`;
  return (
    <section className="my-3" aria-labelledby="t-totali-campagna">
      <h2 id="t-totali-campagna">{`Totali della campagna ${campagna}`}</h2>
      <Griglia colonne={4}>
        <Kpi
          etichetta="Superficie ammissibile DS"
          nomeAccessibile={`Superficie ammissibile DS: superficie delle domande di sostegno, campagna ${campagna}`}
          valore={testoSuperficie(t.superficieDs)}
          nota={`${domande(t.domandeSostegno, 'sostegno')} (la DS si conta una volta per domanda di sostegno)`}
          icona="it-map-marker"
          tono="scuro"
        />
        <Kpi
          etichetta="Superficie ammissibile DP"
          nomeAccessibile={`Superficie ammissibile DP: superficie delle domande di pagamento, campagna ${campagna}`}
          valore={testoSuperficie(t.superficieDp)}
          nota={domande(t.domandePagamento, 'pagamento')}
          icona="it-card"
        />
        <Kpi
          etichetta="Differenza DP - DS"
          nomeAccessibile={`Differenza DP - DS: superficie di pagamento meno superficie di sostegno, campagna ${campagna}`}
          valore={testoDifferenza(t.differenzaDpDs)}
          nota="negativa se la DP è minore della DS"
          icona="it-chart-line"
          tono="ambra"
        />
        <Kpi
          etichetta="Domande con DP oltre la DS"
          nomeAccessibile={`Domande con DP oltre la DS: domande di pagamento con superficie oltre quella di sostegno, campagna ${campagna}`}
          valore={formatNumber(t.domandeDpOltreDs)}
          nota={testoQuotaOltreDs(t.domandePagamento, quota)}
          quota={quota === null ? null : quota / 100}
          icona="it-warning-circle"
          tono="verde"
        />
      </Griglia>
    </section>
  );
}

/** Nota della verifica incrociata sulla quantita' richiesta a premio (OP-FIS-04): oggi sempre assente. */
function notaPremio(righe: readonly InterventoSuperficie[], campagna: number): string {
  const campagne = righe.flatMap((r) => {
    const c = campagnaDi(r, campagna);
    return c ? [c] : [];
  });
  const assenti = campagne.filter((c) => c.quantitaRichiestaPremio.valore == null);
  if (assenti.length === campagne.length && assenti[0]) return `Quantità richiesta a premio: ${testoQuantitaPremio(assenti[0].quantitaRichiestaPremio)}.`;
  return 'Quantità richiesta a premio nella tabella equivalente.';
}

interface PropsGrafici {
  d: SuperficieAmmissibile;
  criteri: Criteri;
  campagna: number;
  onIntervento: (codice: string) => void;
  onCampagna: (anno: number) => void;
}

/** Le tre card grafico della vista Grafico. */
function Grafici({ d, criteri, campagna, onIntervento, onCampagna }: PropsGrafici) {
  const perIntervento = useMemo(() => graficoPerIntervento(d.righe, campagna), [d.righe, campagna]);
  const perCampagna = useMemo(() => graficoPerCampagna(totaliPerCampagna(d.righe), criteri.campagna), [d.righe, criteri.campagna]);
  const verifica = useMemo(() => graficoVerifica(d.righe, campagna), [d.righe, campagna]);
  const dellaCampagna = conCampagna(criteri, campagna);
  const titoloIntervento = `Superficie DS e DP per intervento, campagna ${campagna}`;
  const titoloVerifica = `Verifica incrociata: differenza DP - DS per intervento, campagna ${campagna}`;
  const titoloCampagna = 'Superficie DS e DP per campagna';
  const intervento = (p: ClicGrafico) => {
    const codice = codiceDalClic(p);
    if (codice) onIntervento(codice);
  };
  const conFiltroCampagna = criteri.campagna !== undefined;
  return (
    <>
      <Griglia colonne={2}>
        <CardGrafico
          titolo={titoloIntervento}
          sottotitolo="Clic su una barra per l'anteprima dell'intervento"
          livello={3}
          dati={perIntervento}
          fonte={`Fonte: TX-0018, campagna ${campagna}. CSV e XLSX: la tabella di TX-0018 della campagna ${campagna} con i filtri della pagina, come il grafico.`}
          onClic={intervento}
          scaricamenti={scaricamentiSuperfici(titoloIntervento, dellaCampagna)}
        />
        <CardGrafico
          titolo={titoloCampagna}
          sottotitolo="Somma degli interventi dentro ogni campagna, mai fra campagne; clic su un punto per scegliere la campagna"
          livello={3}
          dati={perCampagna}
          fonte={
            conFiltroCampagna
              ? `Fonte: TX-0018 con il filtro Campagna ${criteri.campagna}. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina.`
              : 'Fonte: TX-0018, tutte le campagne della risposta. CSV e XLSX: la tabella di TX-0018 coi filtri della pagina, tutte le campagne.'
          }
          onClic={(p) => {
            const anno = campagnaDaTesto(codiceDalClic(p));
            if (anno !== undefined) onCampagna(anno);
          }}
          scaricamenti={scaricamentiSuperfici(titoloCampagna, criteri)}
        />
      </Griglia>
      <CardGrafico
        titolo={titoloVerifica}
        sottotitolo="A destra dello zero la DP supera la DS, a sinistra è minore; clic su una barra per l'anteprima"
        livello={3}
        dati={verifica}
        fonte={`Fonte: TX-0018 (differenza DP - DS, domande con DP oltre la DS). ${notaPremio(d.righe, campagna)} CSV e XLSX: come il grafico per intervento, campagna ${campagna}.`}
        onClic={intervento}
        scaricamenti={scaricamentiSuperfici(titoloVerifica, dellaCampagna)}
      />
    </>
  );
}

interface PropsReport {
  d: SuperficieAmmissibile;
  criteri: Criteri;
  vista: VistaGrafico;
  onVista: (v: VistaGrafico) => void;
  applica: (c: Criteri) => void;
  onModificaFiltri: () => void;
  descrizioneDi: (codice: string) => string | undefined;
}

/** Il report della campagna di riferimento: KPI, card con le due viste, anteprima. */
function Report({ d, criteri, vista, onVista, applica, onModificaFiltri, descrizioneDi }: PropsReport) {
  const [aperto, setAperto] = useState<string | null>(null);
  const esito = esitoSuperfici(d.righe, criteri.campagna);
  if (esito.tipo !== 'dati') {
    const dove = esito.tipo === 'senza-superfici' && esito.campagna !== null ? ` nella campagna ${esito.campagna}` : '';
    return (
      <Vuoto>
        <VuotoConFiltri onModifica={onModificaFiltri}>{`Nessuna superficie per gli interventi scelti${dove}: gli interventi non sono a superficie o non sono SIGC (non valorizzato).`}</VuotoConFiltri>
      </Vuoto>
    );
  }
  const riga = aperto === null ? null : (d.righe.find((r) => r.codiceIntervento === aperto) ?? null);
  return (
    <>
      <KpiCampagna righe={d.righe} campagna={esito.campagna} />
      <Sezione titolo={TITOLO_TABELLA}>
        {/* interruttore di pagina: quello del kit, nello stesso ordine Grafico | Tabella di ogni card */}
        <InterruttoreVista etichetta="Vista delle superfici" vista={vista} onVista={onVista} className="mb-3" />
        {vista === 'tabella' ? (
          <TabellaSuperfici righe={d.righe} criteri={criteri} onRiga={setAperto} />
        ) : (
          <Grafici d={d} criteri={criteri} campagna={esito.campagna} onIntervento={setAperto} onCampagna={(anno) => applica(conCampagna(criteri, anno))} />
        )}
      </Sezione>
      <AnteprimaIntervento
        riga={riga}
        campagna={esito.campagna}
        descrizione={riga ? descrizioneDi(riga.codiceIntervento) : undefined}
        onChiudi={() => setAperto(null)}
        onMostraSolo={(codice) => {
          setAperto(null);
          applica(soloIntervento(criteri, codice));
        }}
      />
    </>
  );
}

/** Perimetro (sempre regionale) e ultimo dato sincronizzato della risposta, a destra nella barra dei filtri. */
function PillDellaBarra({ d, inErrore }: { d: SuperficieAmmissibile | undefined; inErrore: boolean }) {
  return (
    <>
      {d && <span className="ui-pill">{`Perimetro: ${testoPerimetro(d.perimetro)}`}</span>}
      <PillDatiAl voci={d?.ultimiDatiSincronizzati} inErrore={inErrore} />
    </>
  );
}

/** Righe di contesto del PNG dei grafici (NFR-50): criteri applicati, perimetro, profilo, ultimo dato di TX-0018. */
function useContesto(criteri: Criteri, d: SuperficieAmmissibile | undefined, profilo: string | undefined): readonly string[] {
  const filtri = testiCriteri(criteri).join('\n');
  return useMemo(
    () => righeContesto({ filtri: filtri ? filtri.split('\n') : [], profilo, ultimi: d?.ultimiDatiSincronizzati, perimetro: d ? testoPerimetro(d.perimetro) : null }),
    [filtri, profilo, d],
  );
}

export function SuperficiAmmissibili() {
  const { criteri, inAttesa, chip, applica, togliTutti, valori } = useCriteriNellIndirizzo();
  const stato = useSuperfici(criteri, { abilitato: !inAttesa });
  const auth = useAuthStatus();
  const [pannello, setPannello] = useState(false);
  const [vista, setVista] = useState<VistaGrafico>('grafico');
  const contesto = useContesto(criteri, stato.data, auth.data?.user?.profile);
  const apriPannello = () => setPannello(true);
  const righe = stato.data?.righe ?? [];
  const campagne = campagnePresenti(righe);
  const descrizioneDi = (codice: string) => valori?.data?.interventi?.find((v) => v.chiave === codice)?.descrizione ?? undefined;
  return (
    <>
      <BarraFiltri chip={chip} onApri={apriPannello} onTogliTutti={togliTutti} vuoto="Nessun filtro: tutti gli interventi e tutte le campagne" destra={<PillDellaBarra d={stato.data} inErrore={stato.isError} />} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Fisico', a: PERCORSI.superfici }, { etichetta: 'Superfici ammissibili' }]} />
        <TestaPagina titolo="Fisico: superfici ammissibili per intervento" titoloDocumento="Superfici ammissibili - Fisico" sottotitolo={SOTTOTITOLO} />
        <ContestoIntestazione.Provider value={contesto}>
          <AvvisoPagina>
            {/* finche' non si sa se il filtro per azione si applica, TX-0018 non si legge (come nel finanziario, X-03) */}
            {inAttesa ? (
              <Caricamento testo="Verifica dei filtri in corso…" />
            ) : (
              <VistaQuery stato={stato} eVuoto={(d) => d.righe.length === 0} vuoto={<VuotoConFiltri onModifica={apriPannello}>Nessun intervento per i filtri scelti.</VuotoConFiltri>}>
                {/* criteri nuovi = contenuto nuovo: l'anteprima aperta non resta quella di prima */}
                {(d) => <Report key={ricercaDaCriteri(criteri)} d={d} criteri={criteri} vista={vista} onVista={setVista} applica={applica} onModificaFiltri={apriPannello} descrizioneDi={descrizioneDi} />}
              </VistaQuery>
            )}
          </AvvisoPagina>
        </ContestoIntestazione.Provider>
      </main>
      <PannelloFiltriSuperfici
        aperto={pannello}
        criteri={criteri}
        valori={valori}
        campagne={campagne}
        codiciRisposta={righe.map((r) => r.codiceIntervento)}
        onChiudi={() => setPannello(false)}
        onApplica={(c) => {
          setPannello(false);
          applica(c);
        }}
      />
    </>
  );
}
