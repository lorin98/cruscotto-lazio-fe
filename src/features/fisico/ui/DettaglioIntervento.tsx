// DettaglioIntervento — pagina /fisico/interventi/:codice (flusso intervento approvato il 30/10/2026, dettaglio v2, RF017,
// RF018 e RF030; scelta di disegno 1 del dossier): compone TX-0017, TX-0018 e TX-0030 filtrate sull'intervento della route
// (nessuna transazione nuova). Il codice del percorso si convalida prima di leggere: un valore fuori formato (anche con
// '/') non manda richieste e la pagina lo dice. Barra dei riferimenti (perimetro e "Dati al" della prima risposta arrivata,
// nessun filtro), percorso, testata con un solo h1 (la descrizione dell'intervento da TX-0060, se no "Intervento
// <codice>"; focus a ogni cambio di route), badge in testo (perimetro, indicatore di output di TX-0017) e i pulsanti verso
// i tre report filtrati sull'intervento (links dello uiplan, ognuno solo col grant della destinazione), i quattro KPI
// (target da TX-0017; superfici della campagna piu' recente da TX-0018), le schede. TX-0017 e TX-0018 si leggono
// all'apertura (KPI e badge), TX-0030 quando si apre la sua scheda (le schede leggono solo quando si aprono), o subito se
// e' la sola lettura del profilo; ogni lettura parte solo col grant della sua transazione. Stati: caricamento (scheletro,
// alla prima apertura finche' non hanno risposto le letture della pagina), errore (un solo avviso della pagina,
// problem-type, Riprova: ogni lettura vi registra il suo errore una volta, le schede il testo statico e le altre schede
// restano), intervento senza dati (es. AT001) col ritorno a un report. La scheda attiva e' stato della pagina (il link
// dal drawer delle Unit Amount apre la scheda Unit Amount con lo state della navigazione, mai coi parametri dell'indirizzo).
// Design system: classi bootstrap-italia e del kit v2 (hero, badge, KPI); react-aria solo nelle schede (tablist) e nel
// popover della pill.
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import type { Ref } from 'react';
import { ID_TITOLO_INTERVENTO, InterventoNonValido, codiceDelPercorso, descrizioneIntervento, rigaDellIntervento } from '../../../entities/filtri';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { testoPerimetro } from '../../../shared/lib';
import type { StatoDettaglio, UltimoDato } from '../../../shared/lib';
import { AvvisoPagina, Briciole, ContestoIntestazione, CorpoDelDettaglio, ErroriDelleLetture, Griglia, Kpi, PillDatiAl, TestataDettaglio, Vuoto, useFocusTitolo, useRigheContesto, useStatoDelDettaglio } from '../../../shared/ui';
import type { NomeIcona, TonoKpi } from '../../../shared/ui';
import { useOutputRegionale, useSuperfici, useUnitAmount, useValoriFiltri } from '../api';
import { outputDellIntervento, superficiDellIntervento, unitAmountDellIntervento } from '../lib/collegamenti';
import { criteriDellIntervento, testiCriteri } from '../lib/criteri';
import type { InterventoSuperficie, RigaOutput } from '../lib/dto';
import { puoLeggere } from '../lib/grant';
import type { Lettura } from '../lib/grant';
import { NOTA_CAMPAGNA_KPI, SENZA_DATI, badgeIntervento, eIdScheda, kpiIntervento, perimetroDelDettaglio, ritornoSenzaDati, schedaAttiva, schedeVisibili, sopratitoloIntervento, titoloIntervento, ultimiDelDettaglio, ultimoDatoInErrore } from '../lib/intervento';
import type { ChiaveKpi, IdScheda } from '../lib/intervento';
import { pagineVisibili } from '../lib/pagine';
import { SchedeIntervento } from './SchedeIntervento';
import type { PropsSchede } from './SchedeIntervento';

/** L'indirizzo della voce "Fisico" del percorso: la prima pagina dell'area che il profilo puo' aprire. */
function useIngressoArea(): string | undefined {
  const auth = useAuthStatus().data;
  return pagineVisibili((g) => hasGrant(auth, g))[0]?.percorso;
}

/** Il predicato delle letture del profilo (gate di UX: il backend ridecide). */
function usePuoLeggere(): (l: Lettura) => boolean {
  const auth = useAuthStatus().data;
  return (l) => puoLeggere(auth, l);
}

/**
 * Le letture del dettaglio, ognuna solo col grant della sua transazione (null senza: la scheda non c'e'). TX-0030 parte
 * quando la sua scheda e' stata aperta (`unitAmountAperta`), o subito se il profilo non legge ne' TX-0017 ne' TX-0018.
 */
function useLettureDelDettaglio(codice: string, unitAmountAperta: boolean) {
  const puo = usePuoLeggere();
  const criteri = criteriDellIntervento(codice);
  const soloUnitAmount = !puo('output') && !puo('superfici');
  const output = useOutputRegionale(criteri, { abilitato: puo('output') });
  const superfici = useSuperfici(criteri, { abilitato: puo('superfici') });
  const unitAmount = useUnitAmount(criteri, { abilitato: puo('unitAmount') && (unitAmountAperta || soloUnitAmount) });
  const valori = useValoriFiltri(puo('filtri'));
  return {
    output: puo('output') ? output : null,
    superfici: puo('superfici') ? superfici : null,
    unitAmount: puo('unitAmount') ? unitAmount : null,
    soloUnitAmount,
    descrizione: descrizioneIntervento(valori.data?.interventi, codice),
  };
}

/** Il codice dell'indirizzo non e' un codice di intervento: nessuna richiesta, lo dice la pagina (InterventoNonValido dell'entity). */
function CodiceNonValido() {
  return <InterventoNonValido area="Fisico" ingresso={useIngressoArea()} suggerimento="Scegli l'intervento dalle superfici ammissibili, dall'output regionale o dalle Unit Amount." titoloDocumento="Intervento non valido - Fisico" />;
}

/** Perimetro (sempre regionale) e ultimo dato sincronizzato, nella barra dei riferimenti (il dettaglio non ha filtri). */
function BarraRiferimenti({ perimetro, ultimi, inErrore }: { perimetro: string | undefined; ultimi: readonly UltimoDato[] | undefined; inErrore: boolean }) {
  return (
    <div className="ui-filtri" role="region" aria-label="Riferimenti dei dati">
      <div className="ui-filtri__destra">
        {perimetro && <span className="ui-pill">{`Perimetro: ${testoPerimetro(perimetro)}`}</span>}
        <PillDatiAl voci={ultimi} inErrore={inErrore} />
      </div>
    </div>
  );
}

/** La testata: sopratitolo, h1, badge in testo e i pulsanti verso i tre report filtrati (links dello uiplan). */
function TestataIntervento({ h1, codice, titolo, badge }: { h1: Ref<HTMLHeadingElement>; codice: string; titolo: string; badge: string[] }) {
  const puo = usePuoLeggere();
  const azioni = (
    <>
      {puo('output') && (
        <Link className="btn btn-light btn-sm" to={outputDellIntervento(codice)}>
          Output regionale filtrato su questo intervento
        </Link>
      )}
      {puo('superfici') && (
        <Link className="btn btn-outline-light btn-sm" to={superficiDellIntervento(codice)}>
          Superfici ammissibili filtrate su questo intervento
        </Link>
      )}
      {puo('unitAmount') && (
        <Link className="btn btn-outline-light btn-sm" to={unitAmountDellIntervento(codice)}>
          Unit Amount di questo intervento
        </Link>
      )}
    </>
  );
  return <TestataDettaglio idTitolo={ID_TITOLO_INTERVENTO} titolo={titolo} h1={h1} sopratitolo={sopratitoloIntervento(codice)} badge={badge} azioni={azioni} />;
}

const ASPETTO_KPI: Record<ChiaveKpi, { icona: NomeIcona; tono: TonoKpi }> = {
  target: { icona: 'it-chart-line', tono: 'scuro' },
  ds: { icona: 'it-map-marker', tono: 'blu' },
  dp: { icona: 'it-card', tono: 'blu' },
  oltre: { icona: 'it-warning-circle', tono: 'verde' },
};

/** I KPI del dettaglio (lib/intervento): quelli delle righe lette; la campagna di riferimento detta sotto. */
function KpiDettaglio({ output, superfici }: { output: RigaOutput | undefined; superfici: InterventoSuperficie | undefined }) {
  const kpi = kpiIntervento(output, superfici);
  if (kpi.length === 0) return null;
  return (
    <>
      <Griglia colonne={4}>
        {kpi.map((k) => (
          <Kpi key={k.chiave} etichetta={k.etichetta} nomeAccessibile={k.nomeAccessibile} valore={k.valore} assente={k.assente} nota={k.nota} {...ASPETTO_KPI[k.chiave]} />
        ))}
      </Griglia>
      {superfici && superfici.campagne.length > 0 && <p className="form-text">{NOTA_CAMPAGNA_KPI}</p>}
    </>
  );
}

/** Intervento senza righe nei report letti: lo stato col ritorno all'output regionale (o al report che il profilo apre). */
function SenzaDati() {
  const ritorno = ritornoSenzaDati(usePuoLeggere());
  return (
    <Vuoto>
      <span className="me-2">{SENZA_DATI}</span>
      {ritorno && (
        <Link className="btn btn-primary btn-sm" to={ritorno.percorso}>
          {ritorno.testo}
        </Link>
      )}
    </Vuoto>
  );
}

/** I KPI delle righe dell'intervento e le schede. */
function DatiDelDettaglio(props: PropsSchede) {
  const { codice, output, superfici } = props;
  return (
    <>
      <KpiDettaglio output={rigaDellIntervento(output?.data?.righe, codice)} superfici={rigaDellIntervento(superfici?.data?.righe, codice)} />
      <SchedeIntervento {...props} />
    </>
  );
}

/** Il corpo secondo lo stato delle letture della pagina (CorpoDelDettaglio del kit): scheletro, errore, senza dati, KPI e schede. */
function CorpoDettaglio({ stato, ...props }: PropsSchede & { stato: StatoDettaglio }) {
  return (
    <CorpoDelDettaglio stato={stato} vuoto={<SenzaDati />}>
      <DatiDelDettaglio {...props} />
    </CorpoDelDettaglio>
  );
}

/** La scheda da cui partire: quella che porta il link d'arrivo nello state della navigazione (le Unit Amount), se valida. */
function useSchedaDArrivo(): IdScheda | null {
  const stato: unknown = useLocation().state;
  const scheda = typeof stato === 'object' && stato !== null && 'scheda' in stato ? stato.scheda : undefined;
  return eIdScheda(scheda) ? scheda : null;
}

function Dettaglio({ codice }: { codice: string }) {
  const puo = usePuoLeggere();
  const [scheda, setScheda] = useState<IdScheda | null>(useSchedaDArrivo());
  const schede = schedeVisibili(puo);
  const attiva = schedaAttiva(schede, scheda);
  // TX-0030 si legge dalla prima apertura della sua scheda, poi resta (cambiare scheda non la rilegge)
  const [unitAmountAperta, setUnitAmountAperta] = useState(attiva === 'unitAmount');
  if (attiva === 'unitAmount' && !unitAmountAperta) setUnitAmountAperta(true);
  const { output, superfici, unitAmount, soloUnitAmount, descrizione } = useLettureDelDettaglio(codice, unitAmountAperta);
  const letture = (soloUnitAmount ? [unitAmount] : [output, superfici]).filter((s) => s !== null);
  const stato = useStatoDelDettaglio(letture);
  // il titolo del documento dal codice, come nel wireframe approvato: la descrizione che arriva dopo non riporta il focus sull'h1
  const h1 = useFocusTitolo<HTMLHeadingElement>(`Intervento ${codice} - Fisico`);
  const risposte = [output?.data, superfici?.data, unitAmount?.data];
  const ultimi = ultimiDelDettaglio(...risposte);
  const perimetro = perimetroDelDettaglio(...risposte);
  // l'intestazione dei PNG (NFR-50): il solo filtro Intervento, il perimetro e l'ultimo dato della barra
  const contesto = useRigheContesto(testiCriteri(criteriDellIntervento(codice)), ultimi, perimetro ? testoPerimetro(perimetro) : null);
  const badge = badgeIntervento(rigaDellIntervento(output?.data?.righe, codice));
  return (
    <ContestoIntestazione.Provider value={contesto}>
      <BarraRiferimenti perimetro={perimetro} ultimi={ultimi} inErrore={ultimoDatoInErrore(letture)} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={[{ etichetta: 'Fisico', a: useIngressoArea() }, { etichetta: codice }]} />
        <TestataIntervento h1={h1} codice={codice} titolo={titoloIntervento(codice, descrizione)} badge={badge} />
        <AvvisoPagina>
          {/* l'errore di ogni lettura lo registra l'avviso della pagina, una volta: le schede il testo statico */}
          <ErroriDelleLetture letture={[output, superfici, unitAmount]} />
          <CorpoDettaglio stato={stato} codice={codice} output={output} superfici={superfici} unitAmount={unitAmount} schede={schede} scheda={attiva} onScheda={setScheda} />
        </AvvisoPagina>
      </main>
    </ContestoIntestazione.Provider>
  );
}

/** Il codice viene dalla route (react-router lo decodifica): fuori formato, nessuna lettura. */
export function DettaglioIntervento({ codice: parametro }: { codice: string | undefined }) {
  const codice = codiceDelPercorso(parametro);
  // codice nuovo = pagina nuova: la scheda scelta non resta quella dell'intervento di prima
  return codice === null ? <CodiceNonValido /> : <Dettaglio key={codice} codice={codice} />;
}
