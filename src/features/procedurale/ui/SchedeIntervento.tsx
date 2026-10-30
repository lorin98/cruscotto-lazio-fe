// SchedeIntervento — le schede del dettaglio procedurale dell'intervento (flusso panoramica approvato, wireframe
// intervento): "Stati delle domande" (le card degli stati di sostegno e di pagamento della riga dell'intervento: clic su
// una barra, o "Apri nell'elenco" nella tabella equivalente, la parte rilasciata della voce nell'elenco), "Area
// programmazione" (TX-0029 dell'intervento: clic o tabella, le domande di quello stato nell'elenco), "Sottofasi" (TX-0031 e
// TX-0032 dell'intervento, scelta 6 approvata, senza link); la scheda "Unit Amount" e' uscita col riallineamento degli
// ambiti del 29/10/2026 (TX-0030 al fisico). Ogni scheda c'e' solo col grant di una delle sue letture; le schede Area e
// Sottofasi leggono solo quando si aprono (react-aria monta il solo pannello scelto). La scheda attiva e' stato della pagina (in DettaglioIntervento).
// L'errore delle letture della pagina (TX-0026..TX-0028) lo dice l'avviso della pagina: qui il testo statico; quello delle
// letture delle schede lo registra la scheda. Tabs di react-aria-components; dentro, classi bootstrap-italia e del kit.
import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { rigaDellIntervento } from '../../../entities/filtri';
import { ErroreNellaPagina, Griglia, VistaQuery, Vuoto } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { useRiepilogo, useSottofasiPagamento, useSottofasiSostegno } from '../api';
import { LINK_STATO, apreLaVoce, apreLaVoceDellArea, puntoDelloStato, testiLinkArea, testiLinkStato } from '../lib/collegamenti';
import type { IdLinkElenco, PuntoElenco, TestiLink } from '../lib/collegamenti';
import type { CriteriProcedurali } from '../lib/criteri';
import type { Distribuzione, Stati, TipoDomanda } from '../lib/dto';
import { TITOLI_SCHEDE, schedaAttiva, schedeVisibili } from '../lib/intervento';
import type { IdScheda } from '../lib/intervento';
import { codiceDellaRiga } from '../lib/riepilogo';
import { diTipo, vociDegliStati, vociDellArea } from '../lib/stati';
import type { VoceDistribuzione } from '../lib/stati';
import { CardArea, CardStati } from './CardDistribuzioni';
import { CardSottofasi } from './CardSottofasi';
import { OGGETTO_FILE, fileReport } from './esportazioni';
import { useLettureColGrant, useLinkElenco, usePuoAprireElenco } from './navigazione';

/** L'errore delle letture della pagina nella scheda: il solo testo statico (lo registra l'avviso della pagina). */
const nellaPagina = () => <ErroreNellaPagina />;

interface PropsScheda {
  codice: string;
  /** I criteri del dettaglio: l'intervento della route e lo stato dell'indirizzo. */
  criteri: CriteriProcedurali;
  onModifica: () => void;
}

/** Come una voce di una distribuzione apre l'elenco: il link dello uiplan, il punto, i testi e quando si apre. */
interface VersoLElenco {
  id: IdLinkElenco;
  voci: readonly VoceDistribuzione[];
  punto: (v: VoceDistribuzione) => PuntoElenco;
  testi: (v: VoceDistribuzione) => TestiLink;
  criteri: CriteriProcedurali;
  apre: (v: VoceDistribuzione) => boolean;
}

/** Il link di una voce verso l'elenco e il clic su una barra che lo apre, col grant dell'elenco (se no, niente). */
function useVociVersoLElenco({ id, voci, punto, testi, criteri, apre }: VersoLElenco) {
  const naviga = useNavigate();
  const conElenco = usePuoAprireElenco();
  const link = useLinkElenco(criteri);
  const indirizzo = (v: VoceDistribuzione) => (apre(v) ? link(id, punto(v)) : null);
  const onVoce = (chiave: string) => {
    const v = voci.find((x) => x.chiave === chiave);
    const a = v ? indirizzo(v) : null;
    if (a) void naviga(a);
  };
  return conElenco ? { link: (v: VoceDistribuzione) => ({ indirizzo: indirizzo(v), testi: testi(v) }), onVoce } : { link: undefined, onVoce: undefined };
}

/** Gli stati delle domande di un tipo della riga dell'intervento (la lettura della pagina, gia' in cache). */
function StatiDellIntervento({ tipo, stato, codice, criteri }: PropsScheda & { tipo: TipoDomanda; stato: StatoQuery<Stati> }) {
  const d: Distribuzione | undefined = rigaDellIntervento(stato.data?.righe, codice)?.stati;
  const voci = vociDegliStati(d);
  const elenco = useVociVersoLElenco({ id: LINK_STATO[tipo].intervento, voci, punto: (v) => puntoDelloStato(tipo, v.chiave, codice), testi: (v) => testiLinkStato(v, tipo, codice), criteri, apre: apreLaVoce });
  const titolo = `Domande ${diTipo(tipo)} per stato`;
  const report = tipo === 'SOSTEGNO' ? 'statiSostegno' : 'statiPagamento';
  return (
    <VistaQuery stato={stato} errorePersonalizzato={nellaPagina}>
      {() => (d ? <CardStati tipo={tipo} d={d} titolo={titolo} sottotitolo="Clic su una barra: le domande rilasciate di quella voce nell'elenco operativo." fonte={`Fonte: ${tipo === 'SOSTEGNO' ? 'TX-0027' : 'TX-0028'} (riga dell'intervento). CSV e XLSX: l'export del report con l'intervento e lo stato della pagina.`} {...elenco} scaricamenti={fileReport(report, `${titolo} ${codice}`, criteri)} oggettoDati={`${OGGETTO_FILE[report]} di ${codice}`} oggettoPng={`il grafico ${titolo} di ${codice}`} /> : <Vuoto>{`Nessuna domanda ${diTipo(tipo)} di ${codice} nel report.`}</Vuoto>)}
    </VistaQuery>
  );
}

/** Lo stato area programmazione dell'intervento: legge TX-0029 quando la scheda si apre. */
function AreaDellIntervento({ codice, criteri }: PropsScheda) {
  const stato = useRiepilogo(criteri);
  const riga = (stato.data?.righe ?? []).find((r) => codiceDellaRiga(r) === codice);
  const voci = vociDellArea(riga?.statiAreaProgrammazione);
  const elenco = useVociVersoLElenco({ id: 'elenco-area-programmazione-intervento', voci, punto: (v) => ({ voceProgrammazione: v.chiave, intervento: codice }), testi: (v) => testiLinkArea(v, codice), criteri, apre: apreLaVoceDellArea });
  const titolo = 'Domande per stato area programmazione';
  return (
    <VistaQuery stato={stato}>
      {() => (riga ? <CardArea d={riga.statiAreaProgrammazione} titolo={titolo} sottotitolo="Clic su una barra: le domande di quello stato nell'elenco operativo." fonte="Fonte: TX-0029 (riga dell'intervento). CSV e XLSX: l'export del riepilogo con l'intervento e lo stato della pagina." {...elenco} scaricamenti={fileReport('riepilogo', `${titolo} ${codice}`, criteri)} oggettoDati={`${OGGETTO_FILE.riepilogo} di ${codice}`} oggettoPng={`il grafico ${titolo} di ${codice}`} /> : <Vuoto>{`Nessun dato di ${codice} nel riepilogo.`}</Vuoto>)}
    </VistaQuery>
  );
}

/** Le sottofasi delle domande dell'intervento: legge TX-0031 e TX-0032 (col loro grant) quando la scheda si apre. */
function SottofasiDellIntervento({ codice, criteri, onModifica }: PropsScheda) {
  const { puo, conGrant } = useLettureColGrant();
  const sostegno = conGrant('sottofasiSostegno', useSottofasiSostegno(criteri, { abilitato: puo('sottofasiSostegno') }));
  const pagamento = conGrant('sottofasiPagamento', useSottofasiPagamento(criteri, { abilitato: puo('sottofasiPagamento') }));
  const conStato = (criteri.stato ?? []).length > 0;
  return (
    <Griglia>
      {sostegno && <VistaQuery stato={sostegno}>{(s) => <CardSottofasi tipo="SOSTEGNO" s={s} criteri={criteri} codice={codice} onModifica={onModifica} conFiltri={conStato} />}</VistaQuery>}
      {pagamento && <VistaQuery stato={pagamento}>{(s) => <CardSottofasi tipo="PAGAMENTO" s={s} criteri={criteri} codice={codice} onModifica={onModifica} conFiltri={conStato} />}</VistaQuery>}
    </Griglia>
  );
}

export interface PropsSchede extends PropsScheda {
  sostegno: StatoQuery<Stati> | null;
  pagamento: StatoQuery<Stati> | null;
  /** La scheda scelta dall'utente (stato della pagina: resta mentre una lettura riparte); null = la prima. */
  scheda: IdScheda | null;
  onScheda: (s: IdScheda) => void;
}

/** La tablist con le schede visibili per grant, nell'ordine del wireframe. */
function ListaSchede({ schede }: { schede: readonly IdScheda[] }) {
  return (
    <TabList aria-label="Sezioni del dettaglio" className="ui-tabs">
      {schede.map((s) => (
        <Tab key={s} id={s} className="ui-tab">
          {TITOLI_SCHEDE[s]}
        </Tab>
      ))}
    </TabList>
  );
}

/** Quanto riceve una scheda: i criteri del dettaglio e, per la scheda Stati, le letture della pagina (gia' in cache). */
type PropsPannello = Omit<PropsSchede, 'scheda' | 'onScheda'>;

/** Il contenuto di ogni scheda, per id (una scheda sola: react-aria monta il solo pannello scelto). */
const PANNELLI: Readonly<Record<IdScheda, (p: PropsPannello) => ReactNode>> = {
  stati: ({ sostegno, pagamento, ...p }) => (
    <Griglia>
      {sostegno && <StatiDellIntervento tipo="SOSTEGNO" stato={sostegno} {...p} />}
      {pagamento && <StatiDellIntervento tipo="PAGAMENTO" stato={pagamento} {...p} />}
    </Griglia>
  ),
  area: (p) => <AreaDellIntervento {...p} />,
  sottofasi: (p) => <SottofasiDellIntervento {...p} />,
};

export function SchedeIntervento({ scheda, onScheda, ...p }: PropsSchede) {
  const schede = schedeVisibili(useLettureColGrant().puo);
  return (
    <Tabs selectedKey={schedaAttiva(schede, scheda)} onSelectionChange={(k) => onScheda(String(k) as IdScheda)}>
      <ListaSchede schede={schede} />
      {schede.map((s) => (
        <TabPanel key={s} id={s}>
          {PANNELLI[s](p)}
        </TabPanel>
      ))}
    </Tabs>
  );
}
