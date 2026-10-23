// DettaglioIntervento — pagina /procedurale/interventi/:codice (flusso panoramica approvato, dettaglio v2, scelta 1
// approvata: accanto a quello del finanziario; nessuna transazione nuova, gli stessi report filtrati sull'intervento della
// route e sullo stato dell'indirizzo, TX-0030 senza lo stato). Il codice del percorso si convalida prima di leggere: un
// valore fuori formato (anche con '/') non manda richieste e la pagina lo dice. Barra dei filtri col solo stato area
// programmazione (chip e pannello), le pill del perimetro e "Dati al" (TX-0024); percorso; testata con un solo h1 (codice e
// descrizione da TX-0024; focus a ogni cambio di route), badge in testo (perimetro dell'intervento e attivato, da TX-0026)
// e i link verso la panoramica filtrata sull'intervento; i quattro KPI (TX-0026 della riga; domande di sostegno e di
// pagamento da TX-0027 e TX-0028); le schede. All'apertura leggono TX-0026, TX-0027 e TX-0028 (KPI, badge e la prima
// scheda), ognuna col suo grant; le altre schede leggono quando si aprono. Stati: caricamento (scheletro, solo alla prima
// apertura: cambiando lo stato restano i dati di prima con l'avviso dell'aggiornamento, e una scheda che rilegge mostra
// lo scheletro nella sua parte), errore (un solo avviso della pagina per lettura, registrato una volta qui), intervento
// senza dati, nessuna domanda per lo stato scelto ("Modifica i filtri").
// La scheda attiva e' stato della pagina. Classi bootstrap-italia e del kit v2; react-aria nelle schede, nel pannello e
// nel popover della pill.
import { useState } from 'react';
import { Link } from 'react-router';
import type { Ref } from 'react';
import { codiceDelPercorso, descrizioneIntervento, rigaDellIntervento, ValoriFiltriNonDisponibili } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { testoPerimetro } from '../../../shared/lib';
import type { StatoDettaglio } from '../../../shared/lib';
import { AvvisoAggiornamento, AvvisoPagina, BarraFiltri, Briciole, Caricamento, ContestoIntestazione, ErroreNellaPagina, PillDatiAl, TestataDettaglio, Vuoto, VuotoConFiltri, useErroreNellaPagina, useFocusTitolo, useRigheContesto, useStatoDelDettaglio } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { useDomandeAmmesse, useStatiPagamento, useStatiSostegno } from '../api';
import { panoramicaDellIntervento } from '../lib/collegamenti';
import { conCriteri, criteriDellIntervento, testiCriteri } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';
import type { Perimetro } from '../lib/dto';
import { perimetroDelle } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import type { Lettura } from '../lib/grant';
import { SENZA_DATI, badgeIntervento, senzaDomande, sopratitoloIntervento, testoNessunaDomanda, testoSenzaStato, titoloDocumentoIntervento, titoloIntervento } from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { kpiDelleAmmesse, kpiDomandeDellIntervento } from '../lib/kpi';
import { PERCORSI, pagineVisibili } from '../lib/pagine';
import { PillPerimetro, TessereKpi } from './comuni';
import { useIngressoArea } from './navigazione';
import { PannelloFiltriProcedurale } from './PannelloFiltriProcedurale';
import { SchedeIntervento } from './SchedeIntervento';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const ID_TITOLO = 't-intervento';
const LINK_KPI = { ammesse: 'elenco-ammesse-intervento', conAtto: 'elenco-con-atto-intervento' } as const;

/** Le letture della pagina, ognuna solo col grant della sua transazione (null senza). */
function useLetture(criteri: CriteriProcedurali) {
  const auth = useAuthStatus().data;
  const puo = (l: Lettura) => puoLeggere(auth, l);
  // cambiando lo stato restano i dati di prima finche' arrivano i nuovi (la pagina non torna allo scheletro)
  const ammesse = useDomandeAmmesse(criteri, { abilitato: puo('ammesse'), mantieniDati: true });
  const sostegno = useStatiSostegno(criteri, { abilitato: puo('statiSostegno'), mantieniDati: true });
  const pagamento = useStatiPagamento(criteri, { abilitato: puo('statiPagamento'), mantieniDati: true });
  return { ammesse: puo('ammesse') ? ammesse : null, sostegno: puo('statiSostegno') ? sostegno : null, pagamento: puo('statiPagamento') ? pagamento : null };
}

type Letture = ReturnType<typeof useLetture>;

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina. */
function InterventoNonValido() {
  const h1 = useFocusTitolo<HTMLHeadingElement>('Intervento non valido - Procedurale');
  const ingresso = useIngressoArea({});
  return (
    <main className="ui-pagina" id="contenuto">
      <Briciole voci={[{ etichetta: 'Procedurale', a: ingresso }, { etichetta: 'Intervento' }]} />
      <TestataDettaglio idTitolo={ID_TITOLO} titolo="Intervento non valido" h1={h1} />
      <p className="alert alert-danger" role="alert">
        {"Il codice nell'indirizzo non è un codice di intervento: nessun dato richiesto. Scegli l'intervento dalla panoramica o dai report procedurali."}
      </p>
    </main>
  );
}

/** La testata: sopratitolo, h1, badge in testo e i link verso la panoramica (solo se il profilo la apre). */
function TestataIntervento({ h1, codice, titolo, badge, stato }: { h1: Ref<HTMLHeadingElement>; codice: string; titolo: string; badge: string[]; stato: readonly string[] | undefined }) {
  const auth = useAuthStatus().data;
  const conPanoramica = pagineVisibili((g) => hasGrant(auth, g)).some((p) => p.percorso === PERCORSI.panoramica);
  const azioni = conPanoramica && (
    <>
      <Link className="btn btn-light btn-sm" to={panoramicaDellIntervento(codice, stato)}>
        Filtra i report procedurali su questo intervento
      </Link>
      <Link className="btn btn-outline-light btn-sm" to={conCriteri(PERCORSI.panoramica, stato ? { stato: [...stato] } : {})}>
        Torna alla panoramica
      </Link>
    </>
  );
  return <TestataDettaglio idTitolo={ID_TITOLO} titolo={titolo} h1={h1} sopratitolo={sopratitoloIntervento(codice)} badge={badge} azioni={azioni || undefined} />;
}

const senzaRisposta = (s: StatoQuery<unknown> | null): boolean => s !== null && s.isError && s.data === undefined;

/** Le letture della pagina che non hanno risposto: l'errore lo dice una volta l'avviso della pagina (le parti tacciono). */
function ErroriDelleLetture({ letture }: { letture: Letture }) {
  useErroreNellaPagina(senzaRisposta(letture.ammesse), letture.ammesse?.error, () => letture.ammesse?.refetch());
  useErroreNellaPagina(senzaRisposta(letture.sostegno), letture.sostegno?.error, () => letture.sostegno?.refetch());
  useErroreNellaPagina(senzaRisposta(letture.pagamento), letture.pagamento?.error, () => letture.pagamento?.refetch());
  return null;
}

/** Le righe dell'intervento nelle letture della pagina. */
function righe(codice: string, l: Letture) {
  return {
    ammesse: rigaDellIntervento(l.ammesse?.data?.righe, codice),
    sostegno: rigaDellIntervento(l.sostegno?.data?.righe, codice)?.stati,
    pagamento: rigaDellIntervento(l.pagamento?.data?.righe, codice)?.stati,
  };
}

/** I KPI dell'intervento: le tre misure delle ammesse dalla riga di TX-0026 e le domande da TX-0027 e TX-0028. */
function KpiDettaglio({ codice, letture, criteri }: { codice: string; letture: Letture; criteri: CriteriProcedurali }) {
  const r = righe(codice, letture);
  const domande = kpiDomandeDellIntervento(r.sostegno, r.pagamento);
  const kpi = [...(r.ammesse ? kpiDelleAmmesse(r.ammesse, { criteri, link: LINK_KPI, intervento: codice }) : []), ...(domande ? [domande] : [])];
  return kpi.length > 0 ? <TessereKpi kpi={kpi} criteri={criteri} /> : null;
}

/**
 * Nessuna domanda dell'intervento nelle letture: con lo stato scelto l'invito a cambiarlo (le schede restano). Lo dice
 * solo se tutte le letture fatte hanno risposto: una lettura in errore non conta come zero (mai un vuoto dedotto da un
 * errore, che lo dice l'avviso della pagina). Col perimetro ADA dice la propria area, come le pagine dei report.
 */
function NessunaDomanda({ codice, letture, pagina, perimetro }: { codice: string; letture: Letture; pagina: PaginaDeiCriteri; perimetro: Perimetro | undefined }) {
  if ([letture.ammesse, letture.sostegno, letture.pagamento].some(senzaRisposta)) return null;
  const r = righe(codice, letture);
  if (!senzaDomande(r.ammesse, r.sostegno, r.pagamento)) return null;
  const conStato = (pagina.filtri.stato ?? []).length > 0;
  const testo = testoNessunaDomanda(codice, conStato, perimetro);
  if (!conStato) return <Vuoto>{testo}</Vuoto>;
  return (
    <Vuoto>
      <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{testo}</VuotoConFiltri>
    </Vuoto>
  );
}

interface PropsCorpo {
  stato: StatoDettaglio;
  codice: string;
  letture: Letture;
  pagina: PaginaDeiCriteri;
  criteri: CriteriProcedurali;
  perimetro: Perimetro | undefined;
  scheda: IdScheda | null;
  onScheda: (s: IdScheda) => void;
}

/** Una lettura della pagina mostra ancora i dati dello stato di prima, mentre arrivano quelli nuovi. */
const inAggiornamento = (l: Letture) => [l.ammesse, l.sostegno, l.pagamento].some((x) => x?.isPlaceholderData === true);

/**
 * Il corpo secondo lo stato delle letture: scheletro (solo alla prima apertura), errore (detto dall'avviso della pagina),
 * senza dati, KPI e schede; mentre una lettura riparte coi criteri nuovi i dati di prima restano e l'avviso lo dice.
 */
function CorpoDettaglio({ stato, codice, letture, pagina, criteri, perimetro, scheda, onScheda }: PropsCorpo) {
  if (stato === 'caricamento') return <Caricamento alto />;
  if (stato === 'errore') return <ErroreNellaPagina />;
  if (stato === 'vuoto') return <Vuoto>{SENZA_DATI}</Vuoto>;
  const aggiorna = inAggiornamento(letture);
  return (
    <>
      <AvvisoAggiornamento attivo={aggiorna} />
      <div className="ui-risultati" aria-busy={aggiorna || undefined}>
        <NessunaDomanda codice={codice} letture={letture} pagina={pagina} perimetro={perimetro} />
        <KpiDettaglio codice={codice} letture={letture} criteri={criteri} />
        <SchedeIntervento codice={codice} criteri={criteri} onModifica={() => pagina.apri('vuoto')} sostegno={letture.sostegno} pagamento={letture.pagamento} scheda={scheda} onScheda={onScheda} />
      </div>
    </>
  );
}

/**
 * Lo stato del corpo dalle letture della pagina (TX-0026..TX-0028). Senza nessuno dei loro grant (un profilo che ha solo
 * le letture delle schede, per esempio le sottofasi) la pagina non ha nulla da attendere: le schede leggono da se'.
 */
function useStatoDelCorpo(letture: Letture): StatoDettaglio {
  const fatte = [letture.ammesse, letture.sostegno, letture.pagamento].filter((l) => l !== null);
  const stato = useStatoDelDettaglio(fatte);
  return fatte.length === 0 ? 'dati' : stato;
}

/** La barra: il chip dello stato col pannello, il perimetro della prima risposta e "Dati al" di TX-0024. */
function BarraDelDettaglio({ pagina, perimetro }: { pagina: PaginaDeiCriteri; perimetro: Perimetro | undefined }) {
  const destra = (
    <>
      <PillPerimetro perimetro={perimetro} tipo="domande" />
      {pagina.valori && <PillDatiAl voci={pagina.valori.data?.ultimiDatiSincronizzati} inErrore={pagina.valori.isError} />}
    </>
  );
  return <BarraFiltri chip={pagina.chip} onApri={() => pagina.apri('barra')} onTogliTutti={pagina.togliTutti} vuoto={testoSenzaStato(perimetro)} destra={destra} />;
}

function Dettaglio({ codice }: { codice: string }) {
  const pagina = useCriteriDellaPagina('soloStato');
  const criteri = criteriDellIntervento(codice, pagina.filtri.stato);
  const letture = useLetture(criteri);
  const stato = useStatoDelCorpo(letture);
  const [scheda, setScheda] = useState<IdScheda | null>(null);
  useFocusTitolo(titoloDocumentoIntervento(codice), pagina.h1);
  const perimetro = perimetroDelle([letture.ammesse, letture.sostegno, letture.pagamento].map((l) => l?.data?.perimetro));
  const contesto = useRigheContesto(testiCriteri(criteri, pagina.statiArea?.data?.valori), pagina.valori?.data?.ultimiDatiSincronizzati, perimetro ? testoPerimetro(perimetro) : null);
  const titolo = titoloIntervento(codice, descrizioneIntervento(pagina.valori?.data?.interventi, codice));
  const ingresso = useIngressoArea(pagina.filtri);
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <BarraDelDettaglio pagina={pagina} perimetro={perimetro} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Procedurale', a: ingresso }, { etichetta: `Intervento ${codice}` }]} />
        <TestataIntervento h1={pagina.h1} codice={codice} titolo={titolo} badge={badgeIntervento(righe(codice, letture).ammesse)} stato={pagina.filtri.stato} />
        <ValoriFiltriNonDisponibili letture={[pagina.valori, pagina.statiArea]} h1={pagina.h1} />
        <AvvisoPagina>
          <ErroriDelleLetture letture={letture} />
          <CorpoDettaglio stato={stato} codice={codice} letture={letture} pagina={pagina} criteri={criteri} perimetro={perimetro} scheda={scheda} onScheda={setScheda} />
        </AvvisoPagina>
      </main>
      <PannelloFiltriProcedurale aperto={pagina.pannello !== null} forma="soloStato" criteri={pagina.filtri} valori={pagina.valori} statiArea={pagina.statiArea} codiciRisposta={[codice]} onApplica={pagina.onApplica} onChiudi={pagina.chiudi} />
    </ContestoIntestazione.Provider>
  );
}

/** Il codice viene dalla route (react-router lo decodifica): fuori formato, nessuna lettura. */
export function DettaglioIntervento({ codice: parametro }: { codice: string | undefined }) {
  const codice = codiceDelPercorso(parametro);
  // codice nuovo = pagina nuova: la scheda scelta non resta quella dell'intervento di prima
  return codice === null ? <InterventoNonValido /> : <Dettaglio key={codice} codice={codice} />;
}
