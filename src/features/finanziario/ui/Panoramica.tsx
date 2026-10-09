// Panoramica — cruscotto del finanziario (route /finanziario, flusso panoramica v2): KPI e grafici interattivi sui dati
// che esistono davvero (dotazione e pagamenti per intervento TX-0002, domande TX-0009, SIGC TX-0012 e TX-0013). Ogni
// card legge solo con il grant della sua transazione (le letture stanno nei figli di ConGrant, R-09). I KPI vengono
// dagli aggregati di lib (mai somme parziali, la quota e' la media ponderata del grafico). Il clic su un intervento apre
// il suo dettaglio; raggruppamento per famiglia finche' manca la gerarchia degli obiettivi (OP-FE-07).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { formatNumber, formatPercentuale, importoKpi } from '../../../shared/lib';
import { Caricamento, CardGrafico, Griglia, Kpi, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico } from '../../../shared/ui';
import { useSigcDomande, useSigcImporti, useSpesaPerIntervento, useTotaleDomande } from '../api';
import type { SpesaPerIntervento } from '../api';
import { kpiSpesa } from '../lib/aggregati';
import type { Aggregato } from '../lib/aggregati';
import type { Filtri } from '../lib/filtri';
import { graficoAvanzamento, graficoCascataSigc, graficoFamiglie, graficoImbutoSigc } from '../lib/grafici';
import { GRANT, PERCORSI, conFiltri } from '../lib/report';
import { ConGrant, NotaPerimetroMisto, PerimetroSezione, diProgramma, erroreGiaMostrato, vuotoConPerimetro } from './comuni';
import { useSelezioneSenzaDomandeSigc, useSelezioneSenzaInterventi } from './selezione';
import { useApriIntervento } from './useApriIntervento';

const VUOTO_INTERVENTI = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });
const VUOTO_SIGC = vuotoConPerimetro('Nessuna domanda SIGC per i filtri scelti.');

const assente = (a: Aggregato) => (a.valore === null ? a.motivo : undefined);

function KpiSpesa({ d }: { d: SpesaPerIntervento }) {
  const k = kpiSpesa(d.righe ?? [], d.perimetro);
  const n = (d.righe ?? []).length;
  return (
    <>
      <Kpi
        etichetta={diProgramma('Dotazione spesa pubblica', d.perimetro)}
        icona="it-card"
        tono="scuro"
        valore={k.dotazione.valore === null ? undefined : importoKpi(k.dotazione.valore)}
        assente={assente(k.dotazione)}
        nota={n === 1 ? '1 intervento nella selezione' : `${n} interventi nella selezione`}
      />
      <Kpi etichetta="Pagamenti totali" icona="it-chart-line" tono="verde" valore={k.pagato.valore === null ? undefined : importoKpi(k.pagato.valore)} assente={assente(k.pagato)} />
      <Kpi
        etichetta="Pagato sulla dotazione"
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

// le tessere della spesa compaiono con i dati; caricamento, errore e vuoto li dice la sezione dei grafici
function KpiSpesaSezione({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useSpesaPerIntervento(filtri)} errorePersonalizzato={erroreGiaMostrato}>
      {(d) => ((d.righe ?? []).length === 0 ? null : <KpiSpesa d={d} />)}
    </VistaQuery>
  );
}

function KpiDomandeDati({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useTotaleDomande(filtri)}>
      {(d) => <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(d.presentate)} nota={`di cui prima annualità ${formatNumber(d.primaAnnualita)}`} />}
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
              sottotitolo="Pagamenti totali sulla dotazione; la linea tratteggiata è la media. Clic su una barra: dettaglio dell'intervento."
              dati={graficoAvanzamento(d.righe ?? [], d.perimetro)}
              fonte={`Fonte: TX-0002, dotazione e spesa per intervento · Perimetro ${d.perimetro ?? 'non indicato'}`}
              altezza="alto"
              onClic={clic}
            />
            <CardGrafico
              titolo="Dotazione per famiglia di intervento"
              sottotitolo="Clic su una famiglia per entrare, su un intervento per il dettaglio. Per obiettivo quando il backend esporrà la gerarchia (OP-FE-07)."
              dati={graficoFamiglie(d.righe ?? [], forma)}
              fonte="Fonte: TX-0002 · famiglia = prefisso del codice dell'intervento"
              altezza="alto"
              onClic={clic}
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
          titolo="Domande SIGC: dalla presentazione al pagamento"
          sottotitolo="Clic su una fase: pagina SIGC"
          dati={graficoImbutoSigc(d)}
          fonte="Fonte: TX-0012 · domande pagate dagli elenchi di liquidazione"
          onClic={onSigc}
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
          titolo="Importi SIGC"
          sottotitolo="Dal richiesto al pagato"
          dati={graficoCascataSigc(d)}
          fonte="Fonte: TX-0013 · importo pagato dal flusso ASR2-20: può non coincidere con le domande pagate"
        />
      )}
    </VistaQuery>
  );
}

export function Panoramica({ filtri }: { filtri: Filtri }) {
  const naviga = useNavigate();
  const { dalClic } = useApriIntervento(filtri);
  return (
    <>
      <Griglia colonne={4}>
        <ConGrant grant={GRANT.spesaPerIntervento} titolo="Dotazione e pagamenti">
          <KpiSpesaSezione filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.totaleDomande} titolo="Domande presentate">
          <KpiDomande filtri={filtri} />
        </ConGrant>
      </Griglia>
      <ConGrant grant={GRANT.spesaPerIntervento} titolo="Dotazione e pagamenti per intervento">
        <GraficiSpesa filtri={filtri} clic={dalClic} />
      </ConGrant>
      <Griglia>
        <ConGrant grant={GRANT.sigcDomande} titolo="Domande SIGC">
          <DomandeSigc filtri={filtri} onSigc={() => void naviga(conFiltri(PERCORSI.sigc, filtri))} />
        </ConGrant>
        <ConGrant grant={GRANT.sigcImporti} titolo="Importi SIGC">
          <ImportiSigc filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
