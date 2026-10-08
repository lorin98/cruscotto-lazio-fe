// AvanzamentoReport — report RF004-RF007 (route /finanziario/avanzamento, TX-0004..TX-0007, flusso dotazione-avanzamento v2):
// KPI con l'assenza dichiarata (stanziato e impegnato oggi da fonte non attiva), sankey della dotazione (disegnato solo con
// gli impegni), gauge del pagato, e le quattro sezioni come card con ciambella e tabella equivalente. Ogni sezione ha il
// suo grant e il suo perimetro (RF004 e RF006 regionali, RF005 e RF007 seguono il perimetro ADA); lo stato vuoto viene
// dalle righe di TX-0002 (segnale), mai da importi a zero.
import type { ReactNode } from 'react';
import { descriviImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { Caricamento, CardGrafico, Kpi, VistaQuery } from '../../../shared/ui';
import type { NomeIcona, StatoQuery, TonoKpi } from '../../../shared/ui';
import { usePagamentiSuImpegnato, useResiduoImpegni, useResiduoPagamenti, useStanziato } from '../api';
import { graficoDueParti } from '../lib/due-parti';
import type { Filtri, Perimetro } from '../lib/filtri';
import { graficoGauge, graficoSankey, milioni } from '../lib/grafici';
import { ConGrant, Griglia, diProgramma, vuotoConPerimetro } from './comuni';
import { inAttesaDelSegnale, useSelezioneSenzaInterventi } from './selezione';
import type { Segnale } from './selezione';

type Voce = [string, ImportoLike | undefined];
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.');

/** KPI di un Importo aggregato: il valore in milioni, oppure l'assenza col suo motivo. */
function KpiImporto({ etichetta, importo, icona, tono, nota }: { etichetta: string; importo: ImportoLike | undefined; icona: NomeIcona; tono: TonoKpi; nota?: string }) {
  const r = descriviImporto(importo, true);
  return (
    <Kpi
      etichetta={etichetta}
      icona={icona}
      tono={tono}
      valore={importo?.valore != null ? milioni(importo.valore) : undefined}
      assente={r.disponibile ? undefined : `${r.testo.charAt(0).toUpperCase()}${r.testo.slice(1)}${r.nota ? `: ${r.nota}` : ''}`}
      nota={nota}
    />
  );
}

// Ogni KPI e ogni flusso legge nel figlio del suo ConGrant: senza il grant la lettura non parte (R-09).
function KpiStanziato({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useStanziato(filtri)}>{(d) => <KpiImporto etichetta="Importo stanziato" importo={d.importoStanziato} icona="it-card" tono="scuro" nota="dato di programma (regionale)" />}</VistaQuery>;
}

function KpiImpegnato({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={usePagamentiSuImpegnato(filtri)}>{(d) => <KpiImporto etichetta="Totale impegnato" importo={d.totaleImpegnato} icona="it-files" tono="blu" />}</VistaQuery>;
}

function KpiResiduo({ filtri, voce }: { filtri: Filtri; voce: 'pagato' | 'residuo' }) {
  return (
    <VistaQuery stato={useResiduoPagamenti(filtri)}>
      {(d) =>
        voce === 'pagato' ? (
          <KpiImporto etichetta="Importo pagato" importo={d.importoPagato} icona="it-chart-line" tono="verde" />
        ) : (
          <KpiImporto etichetta="Dotazione residua sui pagamenti" importo={d.dotazioneResidua} icona="it-presentation" tono="ambra" />
        )
      }
    </VistaQuery>
  );
}

function Indicatori({ filtri }: { filtri: Filtri }) {
  return (
    <Griglia colonne={4}>
      <ConGrant grant="csr.tx-0004.read" titolo="Importo stanziato">
        <KpiStanziato filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0005.read" titolo="Totale impegnato">
        <KpiImpegnato filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0007.read" titolo="Importo pagato">
        <KpiResiduo filtri={filtri} voce="pagato" />
      </ConGrant>
      <ConGrant grant="csr.tx-0007.read" titolo="Dotazione residua sui pagamenti">
        <KpiResiduo filtri={filtri} voce="residuo" />
      </ConGrant>
    </Griglia>
  );
}

function FlussoDotazione({ filtri }: { filtri: Filtri }) {
  const impegni = useResiduoImpegni(filtri);
  const pagamenti = usePagamentiSuImpegnato(filtri);
  return (
    <VistaQuery stato={impegni}>
      {(i) => (
        <VistaQuery stato={pagamenti}>
          {(p) => (
            <CardGrafico
              titolo="Dove va la dotazione"
              sottotitolo="Dalla dotazione all'impegnato e al pagato"
              dati={graficoSankey(i, p)}
              fonte="Fonte: TX-0006 (impegni) e TX-0005 (pagamenti sull'impegnato)"
              altezza="alto"
            />
          )}
        </VistaQuery>
      )}
    </VistaQuery>
  );
}

function PagatoSullaDotazione({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useResiduoPagamenti(filtri)}>
      {(d) => (
        <CardGrafico
          titolo="Pagato sulla dotazione"
          dati={graficoGauge(d.importoPagato?.valore, d.dotazioneSpesaPubblica?.valore, 'della dotazione pagato', d.perimetro)}
          fonte={`Fonte: TX-0007 · Perimetro ${d.perimetro ?? 'non indicato'}`}
          altezza="alto"
        />
      )}
    </VistaQuery>
  );
}

function Flussi({ filtri }: { filtri: Filtri }) {
  return (
    <Griglia>
      {/* il flusso combina impegni (TX-0006) e pagamenti sull'impegnato (TX-0005): servono entrambi i grant */}
      <ConGrant grant={['csr.tx-0006.read', 'csr.tx-0005.read']} titolo="Dove va la dotazione">
        <FlussoDotazione filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0007.read" titolo="Pagato sulla dotazione">
        <PagatoSullaDotazione filtri={filtri} />
      </ConGrant>
    </Griglia>
  );
}

/**
 * KPI e flussi seguono il segnale di TX-0002 come le quattro sezioni: in attesa un solo caricamento, con la selezione
 * vuota niente (lo stato vuoto lo dicono le sezioni), mai gli zeri del backend (R-15). Le loro letture sono le stesse
 * delle sezioni (stessa chiave di cache): montarle dopo il segnale non aggiunge richieste.
 */
function IndicatoriEFlussi({ filtri }: { filtri: Filtri }) {
  const segnale = useSelezioneSenzaInterventi(filtri);
  if (segnale === 'vuota') return null;
  if (segnale === 'in-attesa') return <Caricamento />;
  return (
    <>
      <Indicatori filtri={filtri} />
      <Flussi filtri={filtri} />
    </>
  );
}

function Parti<T extends { perimetro?: Perimetro }>(props: {
  titolo: string;
  grafico: string;
  stato: StatoQuery<T>;
  segnale: Segnale;
  parti: (d: T) => [Voce, Voce];
  voci: (d: T) => Voce[];
  fonte: string;
  misto?: boolean;
}) {
  const { titolo, grafico, stato, segnale, parti, voci, fonte, misto = false } = props;
  return (
    <VistaQuery stato={inAttesaDelSegnale(stato, segnale)} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => (
        <CardGrafico
          titolo={titolo}
          sottotitolo={misto && d.perimetro === 'ADA' ? `${grafico}. La dotazione è regionale, i pagamenti sono della tua area: non confrontabili.` : grafico}
          dati={graficoDueParti(grafico, parti(d), voci(d))}
          fonte={`${fonte} · Perimetro ${d.perimetro ?? 'non indicato'}`}
        />
      )}
    </VistaQuery>
  );
}

type PropsSezione = { filtri: Filtri; titolo: string };

function Stanziato({ filtri, titolo }: PropsSezione) {
  const parti = (d: { importoStanziato?: ImportoLike; importoDaStanziare?: ImportoLike }): [Voce, Voce] => [['Importo stanziato', d.importoStanziato], ['Importo da stanziare', d.importoDaStanziare]];
  return <Parti titolo={titolo} grafico="Stanziato e da stanziare" stato={useStanziato(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} parti={parti} voci={parti} fonte="Fonte: TX-0004" />;
}

function PagamentiSuImpegnato({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Impegnato tra pagamenti e ancora da pagare" stato={usePagamentiSuImpegnato(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} fonte="Fonte: TX-0005"
      parti={(d) => [['Pagamenti totali (elenchi di liquidazione)', d.pagamentiTotali], ['Impegnato ancora da pagare', d.impegnatoDaPagare]]}
      voci={(d) => [['Totale impegnato', d.totaleImpegnato], ['Pagamenti totali (elenchi di liquidazione)', d.pagamentiTotali], ['Impegnato ancora da pagare', d.impegnatoDaPagare]]} />
  );
}

function ResiduoImpegni({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Dotazione tra impegnato e residuo" stato={useResiduoImpegni(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} fonte="Fonte: TX-0006"
      parti={(d) => [['Importo impegnato', d.importoImpegnato], ['Dotazione residua', d.dotazioneResidua]]}
      voci={(d) => [['Dotazione spesa pubblica', d.dotazioneSpesaPubblica], ['Importo impegnato', d.importoImpegnato], ['Dotazione residua', d.dotazioneResidua]]} />
  );
}

function ResiduoPagamenti({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Dotazione tra pagato e residuo" stato={useResiduoPagamenti(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} misto fonte="Fonte: TX-0007"
      parti={(d) => [['Pagamenti al netto di rettifiche', d.pagamentiNettoRettifiche], ['Dotazione residua', d.dotazioneResidua]]}
      voci={(d) => [
        [diProgramma('Dotazione spesa pubblica', d.perimetro), d.dotazioneSpesaPubblica], ['Importo pagato', d.importoPagato], ['Importo recuperato', d.importoRecuperato],
        ['Pagamenti al netto di rettifiche', d.pagamentiNettoRettifiche], ['Dotazione residua', d.dotazioneResidua],
      ]} />
  );
}

const SEZIONI: { titolo: string; grant: string; Componente: (p: PropsSezione) => ReactNode }[] = [
  { titolo: 'Importo stanziato e da stanziare (RF004)', grant: 'csr.tx-0004.read', Componente: Stanziato },
  { titolo: "Pagamenti sull'impegnato (RF005)", grant: 'csr.tx-0005.read', Componente: PagamentiSuImpegnato },
  { titolo: 'Dotazione residua sugli impegni (RF006)', grant: 'csr.tx-0006.read', Componente: ResiduoImpegni },
  { titolo: 'Dotazione residua sui pagamenti (RF007)', grant: 'csr.tx-0007.read', Componente: ResiduoPagamenti },
];

export function AvanzamentoReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <IndicatoriEFlussi filtri={filtri} />
      <Griglia>
        {SEZIONI.map(({ titolo, grant, Componente }) => (
          <ConGrant key={grant} grant={grant} titolo={titolo}>
            <Componente filtri={filtri} titolo={titolo} />
          </ConGrant>
        ))}
      </Griglia>
    </>
  );
}
