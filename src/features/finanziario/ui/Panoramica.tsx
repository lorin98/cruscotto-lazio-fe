// Panoramica — cruscotto del finanziario (route /finanziario, flusso panoramica v2): KPI e grafici interattivi sui dati
// che esistono davvero (dotazione e pagamenti per intervento TX-0002, domande TX-0009, SIGC TX-0012 e TX-0013). Ogni
// card legge solo con il grant della sua transazione (le letture stanno nei figli di ConGrant, R-09). I KPI vengono
// dagli aggregati di lib (mai somme parziali, la quota e' la media ponderata del grafico). Il clic su un intervento apre
// il suo dettaglio; raggruppamento per famiglia finche' manca la gerarchia degli obiettivi (OP-FE-07). Revisioni del
// 31/10/2026: sei box in griglia 3 x 2 a coppie per colonna con l'impegnato e la sua quota dalla stessa lettura di TX-0002
// (R03), importi SIGC in due barre impilate (R13 forma B); le card SIGC sono di soli interventi SIGC: col filtro NO SIGC non
// pertinenti, lette senza filtro (F3).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApriNellElenco } from '../../../entities/domanda';
import { formatNumber, formatPercentuale, importoKpi, letturaDelTipo } from '../../../shared/lib';
import { Caricamento, CardGrafico, Griglia, Kpi, NonPertinente, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico } from '../../../shared/ui';
import { useSigcDomande, useSigcImporti, useSpesaPerIntervento, useTotaleDomande } from '../api';
import { datiDelReport } from './esportazioni';
import type { SpesaPerIntervento } from '../api';
import { kpiSpesa } from '../lib/aggregati';
import type { Aggregato } from '../lib/aggregati';
import type { Filtri } from '../lib/filtri';
import { PAGAMENTI_LORDI, PAGATO_LORDO_SULLA_DOTAZIONE, graficoAvanzamento, graficoDomandeSigc, graficoFamiglie, graficoImportiSigc } from '../lib/grafici';
import { notaDiCuiStimato } from '../lib/stima';
import { MOTIVO_SOLO_SIGC } from '../lib/natura';
import { GRANT, PERCORSI, conFiltri } from '../lib/report';
import { ConGrant, NotaPerimetroMisto, PerimetroSezione, ScaricaKpi, diProgramma, erroreGiaMostrato, vuotoConPerimetro } from './comuni';
import { useSelezioneSenzaDomandeSigc, useSelezioneSenzaInterventi } from './selezione';
import { useApriIntervento } from './useApriIntervento';
import { useLinkElenco } from './LinkElenco';

const VUOTO_INTERVENTI = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });
const VUOTO_SIGC = vuotoConPerimetro('Nessuna domanda SIGC per i filtri scelti.');

const assente = (a: Aggregato) => (a.valore === null ? a.motivo : undefined);

/** Le tessere della spesa (TX-0002): la dotazione, oppure le quattro dell'impegnato e del pagato (R03). */
type TessereSpesa = 'dotazione' | 'impegnato-e-pagato';

function KpiSpesa({ d, tessere }: { d: SpesaPerIntervento; tessere: TessereSpesa }) {
  return tessere === 'dotazione' ? <KpiDotazione d={d} /> : <KpiImpegnatoEPagato d={d} />;
}

function KpiDotazione({ d }: { d: SpesaPerIntervento }) {
  const k = kpiSpesa(d.righe ?? [], d.perimetro);
  const n = (d.righe ?? []).length;
  return (
    <Kpi
      etichetta={diProgramma('Dotazione spesa pubblica', d.perimetro)}
      icona="it-card"
      tono="scuro"
      {...importoKpi(k.dotazione.valore)}
      assente={assente(k.dotazione)}
      nota={n === 1 ? '1 intervento nella selezione' : `${n} interventi nella selezione`}
    />
  );
}

function KpiImpegnatoEPagato({ d }: { d: SpesaPerIntervento }) {
  const k = kpiSpesa(d.righe ?? [], d.perimetro);
  // ordine del DOM a coppie per colonna (griglia 3 x 2 in colonna): impegnato e la sua quota, pagato e la sua quota
  return (
    <>
      <Kpi
        etichetta="Totale impegnato"
        icona="it-files"
        tono="blu"
        {...importoKpi(k.impegnato.valore)}
        assente={assente(k.impegnato)}
        nota={notaDiCuiStimato(k.stimato.valore === null ? null : { valore: k.stimato.valore })}
      />
      <Kpi
        etichetta="Impegnato sulla dotazione"
        icona="it-presentation"
        tono="blu"
        valore={k.quotaImpegnata.valore === null ? undefined : formatPercentuale(k.quotaImpegnata.valore)}
        assente={assente(k.quotaImpegnata)}
        quota={k.quotaImpegnata.valore === null ? null : k.quotaImpegnata.valore / 100}
      />
      <Kpi etichetta={PAGAMENTI_LORDI} icona="it-chart-line" tono="verde" {...importoKpi(k.pagato.valore)} assente={assente(k.pagato)} />
      <Kpi
        etichetta={PAGATO_LORDO_SULLA_DOTAZIONE}
        icona="it-presentation"
        tono="blu"
        valore={k.quota.valore === null ? undefined : formatPercentuale(k.quota.valore)}
        assente={assente(k.quota)}
        quota={k.quota.valore === null ? null : k.quota.valore / 100}
        nota={k.quota.nota}
      />
    </>
  );
}

// le tessere della spesa compaiono con i dati; caricamento, errore e vuoto li dice la sezione dei grafici. Le due parti
// leggono la stessa lettura in cache di TX-0002
function KpiSpesaSezione({ filtri, tessere }: { filtri: Filtri; tessere: TessereSpesa }) {
  return (
    <VistaQuery stato={useSpesaPerIntervento(filtri)} errorePersonalizzato={erroreGiaMostrato}>
      {(d) => ((d.righe ?? []).length === 0 ? null : <KpiSpesa d={d} tessere={tessere} />)}
    </VistaQuery>
  );
}

function KpiDomandeDati({ filtri }: { filtri: Filtri }) {
  const link = useLinkElenco(filtri);
  return (
    <VistaQuery stato={useTotaleDomande(filtri)}>
      {(d) => (
        <Kpi
          etichetta="Domande presentate"
          icona="it-files"
          tono="ambra"
          valore={formatNumber(d.presentate)}
          nota={`di cui prima annualità ${formatNumber(d.primaAnnualita)}`}
          azione={<ApriNellElenco indirizzo={link('elenco-presentate-panoramica', { presentata: true })} descrizione="le domande presentate" />}
        />
      )}
    </VistaQuery>
  );
}

// le domande non dipendono dalla spesa: hanno il loro grant e la loro lettura (senza il grant di TX-0002 il segnale non
// afferma nulla e la tessera c'e'); con la selezione vuota non si mostrano e non si leggono
function KpiDomande({ filtri }: { filtri: Filtri }) {
  const segnale = useSelezioneSenzaInterventi(filtri);
  if (segnale === 'vuota') return null;
  return segnale === 'in-attesa' ? <Caricamento /> : <KpiDomandeDati filtri={filtri} />;
}

// i file delle domande (TX-0009) solo quando la loro tessera c'e': non con la selezione vuota (review v3 N-04)
function ScaricaDomande({ filtri }: { filtri: Filtri }) {
  const segnale = useSelezioneSenzaInterventi(filtri);
  if (segnale !== 'non-vuota') return null;
  return <ScaricaKpi grant={GRANT.totaleDomande} titolo="Domande presentate (RF009)" report="totaleDomande" filtri={filtri} />;
}

// il clic su un intervento (barra o foglia) apre il dettaglio; su una famiglia il treemap entra nel gruppo
function GraficiSpesa({ filtri, clic }: { filtri: Filtri; clic: (p: ClicGrafico) => void }) {
  const stato = useSpesaPerIntervento(filtri);
  const [forma, setForma] = useState<'treemap' | 'sunburst'>('treemap');
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO_INTERVENTI}>
      {(d) => (
        <>
          <PerimetroSezione perimetro={d.perimetro} />
          <NotaPerimetroMisto perimetro={d.perimetro} />
          <Griglia>
            <CardGrafico
              titolo="Avanzamento per intervento"
              sottotitolo="Pagamenti totali (lordi, elenchi di liquidazione) sulla dotazione; la linea tratteggiata è la media. Clic su una barra: dettaglio dell'intervento."
              dati={graficoAvanzamento(d.righe ?? [], d.perimetro)}
              fonte={`Fonte: TX-0002, dotazione e spesa per intervento · Perimetro ${d.perimetro ?? 'non indicato'}`}
              altezza="alto"
              onClic={clic}
              scaricamenti={datiDelReport('Avanzamento per intervento', 'spesaPerIntervento', filtri)}
            />
            <CardGrafico
              titolo="Dotazione per famiglia di intervento"
              sottotitolo="Clic su una famiglia per entrare, su un intervento per il dettaglio. Per obiettivo quando il backend esporrà la gerarchia (OP-FE-07)."
              dati={graficoFamiglie(d.righe ?? [], forma)}
              fonte="Fonte: TX-0002 · famiglia = prefisso del codice dell'intervento"
              altezza="alto"
              onClic={clic}
              scaricamenti={datiDelReport('Dotazione per famiglia di intervento', 'spesaPerIntervento', filtri)}
              strumenti={
                <div className="ui-seg" role="group" aria-label="Forma del grafico della dotazione">
                  <button type="button" aria-pressed={forma === 'treemap'} onClick={() => setForma('treemap')}>
                    Riquadri
                  </button>
                  <button type="button" aria-pressed={forma === 'sunburst'} onClick={() => setForma('sunburst')}>
                    Anelli
                  </button>
                </div>
              }
            />
          </Griglia>
        </>
      )}
    </VistaQuery>
  );
}

// le letture SIGC stanno nei figli di ConGrant: senza il grant non partono (R-09)
function DomandeSigc({ filtri, onSigc }: { filtri: Filtri; onSigc: () => void }) {
  const stato = useSigcDomande(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => d.presentate === 0} vuoto={VUOTO_SIGC}>
      {(d) => (
        <CardGrafico
          titolo="Domande SIGC: presentate, pagate e da pagare"
          sottotitolo="Pagate e da pagare si sovrappongono (domande pagate in parte). Clic su una barra: pagina SIGC"
          dati={graficoDomandeSigc(d)}
          fonte="Fonte: TX-0012 · pagate e da pagare dagli importi della domanda, come l'importo pagato"
          onClic={onSigc}
          scaricamenti={datiDelReport('Domande SIGC', 'sigcDomande', filtri)}
        />
      )}
    </VistaQuery>
  );
}

// come in SigcReport: il vuoto viene dal conteggio delle domande SIGC (TX-0012), mai dagli importi a zero
function ImportiSigc({ filtri }: { filtri: Filtri }) {
  const stato = useSigcImporti(filtri);
  const segnale = useSelezioneSenzaDomandeSigc(filtri);
  return (
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO_SIGC}>
      {(d) => (
        <CardGrafico
          titolo="Importi SIGC: richiesto, ammesso, pagato e ancora da pagare"
          sottotitolo="Richiesto = ammesso + non ammesso; ammesso = pagato + ancora da pagare"
          dati={graficoImportiSigc(d)}
          fonte="Fonte: TX-0013 · importi della domanda"
          scaricamenti={datiDelReport('Importi SIGC', 'sigcImporti', filtri)}
        />
      )}
    </VistaQuery>
  );
}

export function Panoramica({ filtri }: { filtri: Filtri }) {
  const naviga = useNavigate();
  const { dalClic } = useApriIntervento(filtri);
  // le card SIGC col filtro NO SIGC: non pertinenti, col dato senza filtro (F3)
  const { np, criteri: sigc } = letturaDelTipo(filtri, 'sigc', MOTIVO_SOLO_SIGC);
  return (
    <>
      {/* i dati di TX-0002 si scaricano dalle card dei grafici; quelli delle domande (TX-0009) qui (NFR-75, review v3 V-04) */}
      <ScaricaDomande filtri={filtri} />
      {/* sei box 3 x 2 a coppie per colonna (R03): dotazione e domande, impegnato e quota, pagato e quota */}
      <Griglia colonne={3}>
        <ConGrant grant={GRANT.spesaPerIntervento} titolo="Dotazione">
          <KpiSpesaSezione filtri={filtri} tessere="dotazione" />
        </ConGrant>
        <ConGrant grant={GRANT.totaleDomande} titolo="Domande presentate">
          <KpiDomande filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.spesaPerIntervento} titolo="Impegnato e pagamenti">
          <KpiSpesaSezione filtri={filtri} tessere="impegnato-e-pagato" />
        </ConGrant>
      </Griglia>
      <ConGrant grant={GRANT.spesaPerIntervento} titolo="Dotazione e pagamenti per intervento">
        <GraficiSpesa filtri={filtri} clic={dalClic} />
      </ConGrant>
      <NonPertinente np={np}>
        <Griglia>
          <ConGrant grant={GRANT.sigcDomande} titolo="Domande SIGC">
            <DomandeSigc filtri={sigc} onSigc={() => void naviga(conFiltri(PERCORSI.sigc, filtri))} />
          </ConGrant>
          <ConGrant grant={GRANT.sigcImporti} titolo="Importi SIGC">
            <ImportiSigc filtri={sigc} />
          </ConGrant>
        </Griglia>
      </NonPertinente>
    </>
  );
}
