// Panoramica — pagina /procedurale (flusso panoramica approvato, pattern cruscotto v2, RF024..RF029): barra dei filtri a
// chip col pannello (TX-0024, TX-0025), le pill del perimetro e "Dati al"; quattro KPI delle domande ammesse (TX-0026,
// coi link verso l'elenco delle ammesse e, con la fonte attiva, di quelle con atto), le card degli stati delle domande di
// sostegno e di pagamento (TX-0027, TX-0028: clic su una barra o sul link della card, la pagina degli stati coi filtri),
// dello stato area programmazione (TX-0029, scelta 3 approvata: clic su una barra, il filtro della pagina per quello
// stato; nella tabella equivalente "Apri nell'elenco") e degli importi per intervento (TX-0026: clic, il dettaglio). Ogni
// sezione legge solo col grant della sua transazione; le letture le fa la pagina (il perimetro della barra viene da
// loro) e il mutator ne tiene al piu' due in corso. Stati: caricamento (scheletro della sezione), errore (un solo avviso
// della pagina per lettura: TX-0026 lo registra la card degli importi, i KPI mostrano il testo statico), vuoto con
// "Modifica i filtri". Classi bootstrap-italia e del kit v2; react-aria solo nel pannello e nella pill.
import { Link, useNavigate } from 'react-router';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { ErroreNellaPagina, Griglia, VistaQuery, VuotoConFiltri } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { useDomandeAmmesse, useRiepilogo, useStatiPagamento, useStatiSostegno } from '../api';
import { indirizzoElenco, paginaDegliStati, testiLinkArea } from '../lib/collegamenti';
import { conFiltri, criteriDelReport } from '../lib/criteri';
import type { CriteriProcedurali } from '../lib/criteri';
import type { Ammesse, Riepilogo, Stati, TipoDomanda } from '../lib/dto';
import { perimetroDelle, testoVuoto } from '../lib/formato';
import { puoLeggere } from '../lib/grant';
import { kpiDelleAmmesse, kpiInterventi } from '../lib/kpi';
import { diTipo, senzaDomande } from '../lib/stati';
import type { VoceDistribuzione } from '../lib/stati';
import { CardImporti } from './CardAmmesse';
import { CardArea, CardStati } from './CardDistribuzioni';
import { TessereKpi } from './comuni';
import { OGGETTO_FILE, fileReport } from './esportazioni';
import { usePuoAprireElenco } from './navigazione';
import { PaginaProcedurale } from './PaginaProcedurale';
import { useCriteriDellaPagina } from './useCriteriNellIndirizzo';
import type { PaginaDeiCriteri } from './useCriteriNellIndirizzo';

const SOTTOTITOLO = 'Domande ammesse, stati delle domande di sostegno e di pagamento e stato area programmazione degli interventi selezionati.';

/** Le letture della pagina, ognuna solo col grant della sua transazione (null senza: la sezione non c'e'). */
function useLetture(c: CriteriProcedurali) {
  const auth = useAuthStatus().data;
  const criteri = criteriDelReport(c);
  const conGrant = <T,>(lettura: Parameters<typeof puoLeggere>[1], stato: T) => (puoLeggere(auth, lettura) ? stato : null);
  return {
    ammesse: conGrant('ammesse', useDomandeAmmesse(criteri, { abilitato: puoLeggere(auth, 'ammesse') })),
    sostegno: conGrant('statiSostegno', useStatiSostegno(criteri, { abilitato: puoLeggere(auth, 'statiSostegno') })),
    pagamento: conGrant('statiPagamento', useStatiPagamento(criteri, { abilitato: puoLeggere(auth, 'statiPagamento') })),
    riepilogo: conGrant('riepilogo', useRiepilogo(criteri, { abilitato: puoLeggere(auth, 'riepilogo') })),
  };
}

type Letture = ReturnType<typeof useLetture>;

/** Il vuoto che dipende dai filtri: "Modifica i filtri" apre il pannello della pagina. */
function vuoto(pagina: PaginaDeiCriteri, soggetto: string) {
  return (d: { perimetro?: 'REGIONALE' | 'ADA' }) => <VuotoConFiltri onModifica={() => pagina.apri('vuoto')}>{testoVuoto(soggetto, conFiltri(pagina.filtri), d.perimetro)}</VuotoConFiltri>;
}

/** I quattro KPI delle ammesse; l'errore lo dice l'avviso della pagina (lo registra la card degli importi). */
function KpiPanoramica({ stato, criteri }: { stato: StatoQuery<Ammesse>; criteri: CriteriProcedurali }) {
  const link = { ammesse: 'elenco-ammesse-panoramica', conAtto: 'elenco-con-atto-panoramica' } as const;
  return (
    <VistaQuery stato={stato} errorePersonalizzato={() => <ErroreNellaPagina />}>
      {(d) => ((d.righe ?? []).length === 0 || !d.totale ? null : <TessereKpi kpi={[...kpiDelleAmmesse(d.totale, { criteri, link }), kpiInterventi(d.totale)]} criteri={criteri} />)}
    </VistaQuery>
  );
}

/** Gli stati delle domande di un tipo nel loro totale: il clic, o il link della card, apre la pagina degli stati. */
function StatiPanoramica({ tipo, stato, pagina }: { tipo: TipoDomanda; stato: StatoQuery<Stati>; pagina: PaginaDeiCriteri }) {
  const naviga = useNavigate();
  const report = tipo === 'SOSTEGNO' ? 'statiSostegno' : 'statiPagamento';
  const titolo = `Domande ${diTipo(tipo)} per stato`;
  const pagine = paginaDegliStati(report, pagina.filtri);
  return (
    <VistaQuery stato={stato} eVuoto={senzaDomande} vuoto={vuoto(pagina, `Nessuna domanda ${diTipo(tipo)}${tipo === 'PAGAMENTO' ? ' CSR-DP' : ''}`)}>
      {(d) => (
        <CardStati
          tipo={tipo}
          d={d.totale}
          titolo={titolo}
          sottotitolo={tipo === 'SOSTEGNO' ? 'Le undici voci di SR-01, poi gli altri stati; ogni barra divide le domande rilasciate da quelle non ancora rilasciate. Clic su una barra: la pagina degli stati.' : 'I cinque stati CSR-DP, poi gli altri stati, col di cui non rilasciate; le domande SIGC non hanno questi stati. Clic su una barra: la pagina degli stati.'}
          fonte={`Fonte: ${tipo === 'SOSTEGNO' ? 'TX-0027' : 'TX-0028'} (totale). PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: l'export del report coi filtri della pagina, una riga per intervento e stato, poi il totale.`}
          onVoce={() => void naviga(pagine)}
          scaricamenti={fileReport(report, titolo, pagina.filtri)}
          oggettoDati={OGGETTO_FILE[report]}
          strumenti={<Link className="btn btn-outline-primary btn-sm" to={pagine}>{`Apri gli stati delle domande ${diTipo(tipo)}`}</Link>}
        />
      )}
    </VistaQuery>
  );
}

/** Lo stato area programmazione nel totale del riepilogo (scelta 3): il clic filtra la pagina per quello stato. */
function AreaPanoramica({ stato, pagina }: { stato: StatoQuery<Riepilogo>; pagina: PaginaDeiCriteri }) {
  const conElenco = usePuoAprireElenco();
  const link = conElenco ? (v: VoceDistribuzione) => ({ indirizzo: (v.domande ?? 0) > 0 ? indirizzoElenco('elenco-area-programmazione-panoramica', pagina.filtri, { voceProgrammazione: v.chiave }) : null, testi: testiLinkArea(v) }) : undefined;
  const titolo = 'Domande per stato area programmazione';
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.totale?.statiAreaProgrammazione?.totale ?? 0) === 0} vuoto={vuoto(pagina, 'Nessuna domanda')}>
      {(d) => (
        <CardArea
          d={d.totale?.statiAreaProgrammazione}
          titolo={titolo}
          sottotitolo="Le dieci voci di RF025, gli stati osservati fuori catalogo e le domande senza stato. Clic su una barra: filtra la pagina per quello stato."
          fonte="Fonte: TX-0029 (totale). L'area programmazione non ha domande non rilasciate: il numero coincide con l'elenco. PNG: l'immagine del grafico; CSV e XLSX: l'export del riepilogo coi filtri della pagina."
          onVoce={(chiave) => pagina.applica({ ...pagina.filtri, stato: [chiave] })}
          link={link}
          scaricamenti={fileReport('riepilogo', titolo, pagina.filtri)}
          oggettoDati={OGGETTO_FILE.riepilogo}
        />
      )}
    </VistaQuery>
  );
}

/** Gli importi per intervento; e' la sezione che registra l'errore di TX-0026 nell'avviso della pagina. */
function ImportiPanoramica({ stato, pagina }: { stato: StatoQuery<Ammesse>; pagina: PaginaDeiCriteri }) {
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={vuoto(pagina, 'Nessun intervento')}>
      {(d) => <CardImporti righe={d.righe ?? []} criteri={pagina.filtri} />}
    </VistaQuery>
  );
}

function Contenuto({ letture, pagina }: { letture: Letture; pagina: PaginaDeiCriteri }) {
  return (
    <>
      {letture.ammesse && <KpiPanoramica stato={letture.ammesse} criteri={pagina.filtri} />}
      <Griglia>
        {letture.sostegno && <StatiPanoramica tipo="SOSTEGNO" stato={letture.sostegno} pagina={pagina} />}
        {letture.pagamento && <StatiPanoramica tipo="PAGAMENTO" stato={letture.pagamento} pagina={pagina} />}
      </Griglia>
      <Griglia>
        {letture.riepilogo && <AreaPanoramica stato={letture.riepilogo} pagina={pagina} />}
        {letture.ammesse && <ImportiPanoramica stato={letture.ammesse} pagina={pagina} />}
      </Griglia>
    </>
  );
}

/** Il perimetro della prima risposta arrivata e i codici degli interventi di TX-0026 (le voci del pannello senza TX-0024). */
function riferimenti(l: Letture) {
  const perimetro = perimetroDelle([l.ammesse, l.sostegno, l.pagamento, l.riepilogo].map((x) => x?.data?.perimetro));
  return { perimetro, codici: (l.ammesse?.data?.righe ?? []).map((r) => r.codiceIntervento) };
}

export function Panoramica() {
  const pagina = useCriteriDellaPagina('tutti');
  const letture = useLetture(pagina.filtri);
  const { perimetro, codici } = riferimenti(letture);
  return (
    <PaginaProcedurale pagina={pagina} titolo="Procedurale: panoramica" titoloDocumento="Panoramica - Procedurale" sottotitolo={SOTTOTITOLO} perimetro={perimetro} tipoPerimetro="domande" codiciRisposta={codici}>
      <Contenuto letture={letture} pagina={pagina} />
    </PaginaProcedurale>
  );
}
