// Panoramica — cruscotto del finanziario (route /finanziario, flusso panoramica v2): KPI e grafici interattivi sui dati
// che esistono davvero (dotazione e pagamenti per intervento TX-0002, domande TX-0009, SIGC TX-0012 e TX-0013). Ogni
// card legge solo con il grant della sua transazione; il clic su un intervento apre il suo dettaglio. Raggruppamento per
// famiglia di intervento finche' manca la gerarchia degli obiettivi (OP-FE-07).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { formatNumber, formatPercentuale } from '../../../shared/lib';
import { CardGrafico, Kpi, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico } from '../../../shared/ui';
import { useSigcDomande, useSigcImporti, useSpesaPerIntervento, useTotaleDomande } from '../api';
import type { SpesaPerIntervento } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { graficoAvanzamento, graficoCascataSigc, graficoFamiglie, graficoImbutoSigc, milioni } from '../lib/grafici';
import { codiceInterventoValido, percorsoIntervento } from '../lib/report';
import { ConGrant, Griglia, NotaPerimetroMisto, PerimetroSezione, diProgramma, vuotoConPerimetro } from './comuni';
import { inAttesaDelSegnale, useSelezioneSenzaDomandeSigc } from './selezione';

const somma = (vv: Array<number | null | undefined>) => {
  const valori = vv.filter((v): v is number => v != null);
  return valori.length ? valori.reduce((a, b) => a + b, 0) : null;
};

function KpiSpesa({ d }: { d: SpesaPerIntervento }) {
  const righe = d.righe ?? [];
  const dotazione = somma(righe.map((r) => r.dotazioneSpesaPubblica?.valore));
  const pagato = somma(righe.map((r) => r.pagamentiTotali?.valore));
  const conEntrambi = righe.filter((r) => r.dotazioneSpesaPubblica?.valore != null && r.pagamentiTotali?.valore != null);
  const quota =
    d.perimetro === 'ADA' || conEntrambi.length === 0
      ? null
      : (somma(conEntrambi.map((r) => r.pagamentiTotali?.valore)) ?? 0) / Math.max(1, somma(conEntrambi.map((r) => r.dotazioneSpesaPubblica?.valore)) ?? 1);
  return (
    <>
      <Kpi
        etichetta={diProgramma('Dotazione spesa pubblica', d.perimetro)}
        icona="it-card"
        tono="scuro"
        valore={dotazione === null ? undefined : milioni(dotazione)}
        assente={dotazione === null ? 'Non disponibile: nessun intervento con dotazione valorizzata' : undefined}
        nota={righe.length === 1 ? '1 intervento nella selezione' : `${righe.length} interventi nella selezione`}
      />
      <Kpi etichetta="Pagamenti totali" icona="it-chart-line" tono="verde" valore={pagato === null ? undefined : milioni(pagato)} assente={pagato === null ? 'Non disponibile: nessun pagamento valorizzato' : undefined} />
      <Kpi
        etichetta="Pagato sulla dotazione"
        icona="it-presentation"
        tono="blu"
        valore={quota === null ? undefined : formatPercentuale(Math.round(quota * 1000) / 10)}
        assente={quota === null ? (d.perimetro === 'ADA' ? 'Non confrontabile: dotazione regionale e pagamenti dell’area (perimetro ADA)' : 'Non calcolabile: dati insufficienti') : undefined}
        quota={quota}
        nota={quota === null ? undefined : 'sugli interventi con entrambi i valori'}
      />
    </>
  );
}

function KpiDomande({ filtri }: { filtri: Filtri }) {
  const stato = useTotaleDomande(filtri);
  return (
    <VistaQuery stato={stato}>
      {(d) => <Kpi etichetta="Domande presentate" icona="it-files" tono="ambra" valore={formatNumber(d.presentate)} nota={`di cui prima annualità ${formatNumber(d.primaAnnualita)}`} />}
    </VistaQuery>
  );
}

function Spesa({ filtri, onIntervento }: { filtri: Filtri; onIntervento: (codice: string) => void }) {
  const stato = useSpesaPerIntervento(filtri);
  const [forma, setForma] = useState<'treemap' | 'sunburst'>('treemap');
  // il clic su un intervento (barra o foglia) apre il dettaglio; su una famiglia il treemap entra nel gruppo
  const clic = (p: ClicGrafico) => {
    const codice = (p.data as { codice?: string } | undefined)?.codice ?? p.name;
    if (codiceInterventoValido(codice)) onIntervento(codice);
  };
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto="Nessun intervento per i filtri scelti. Modifica i filtri.">
      {(d) => (
        <>
          <PerimetroSezione perimetro={d.perimetro} />
          <NotaPerimetroMisto perimetro={d.perimetro} />
          <Griglia colonne={4}>
            <KpiSpesa d={d} />
            <ConGrant grant="csr.tx-0009.read" titolo="Domande presentate">
              <KpiDomande filtri={filtri} />
            </ConGrant>
          </Griglia>
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

const VUOTO_SIGC = vuotoConPerimetro('Nessuna domanda SIGC per i filtri scelti. Modifica i filtri.');

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
    <VistaQuery stato={inAttesaDelSegnale(stato, segnale)} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO_SIGC}>
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

function Sigc({ filtri, onSigc }: { filtri: Filtri; onSigc: () => void }) {
  return (
    <Griglia>
      <ConGrant grant="csr.tx-0012.read" titolo="Domande SIGC">
        <DomandeSigc filtri={filtri} onSigc={onSigc} />
      </ConGrant>
      <ConGrant grant="csr.tx-0013.read" titolo="Importi SIGC">
        <ImportiSigc filtri={filtri} />
      </ConGrant>
    </Griglia>
  );
}

export function Panoramica({ filtri }: { filtri: Filtri }) {
  const naviga = useNavigate();
  const query = ricercaDaFiltri(filtri);
  const conQuery = (p: string) => (query ? `${p}?${query}` : p);
  return (
    <>
      <ConGrant grant="csr.tx-0002.read" titolo="Dotazione e pagamenti">
        <Spesa filtri={filtri} onIntervento={(c) => void naviga(conQuery(percorsoIntervento(c)))} />
      </ConGrant>
      <Sigc filtri={filtri} onSigc={() => void naviga(conQuery('/finanziario/sigc'))} />
    </>
  );
}
