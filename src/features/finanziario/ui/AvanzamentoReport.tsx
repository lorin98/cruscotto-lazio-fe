// AvanzamentoReport — report RF004-RF007 (route /finanziario/avanzamento, TX-0004..TX-0007, flusso dotazione-avanzamento v2):
// KPI con l'assenza dichiarata (stanziato e impegnato oggi da fonte non attiva), flusso della dotazione (sankey: con gli
// impegni fino al pagato, senza impegni dalla dotazione al pagato di TX-0007), gauge del pagato, e le quattro sezioni
// come card con ciambella e tabella equivalente. Ogni sezione ha il suo grant e il suo perimetro (RF004 e RF006
// regionali, RF005 e RF007 seguono il perimetro ADA); lo stato vuoto viene dalle righe di TX-0002 (segnale), mai da
// importi a zero. Le letture stanno nei figli di ConGrant (R-09).
import type { ReactNode } from 'react';
import type { ImportoLike } from '../../../entities/importo';
import { Caricamento, CardGrafico, Griglia, VistaQuery } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { usePagamentiSuImpegnato, useResiduoImpegni, useResiduoPagamenti, useStanziato } from '../api';
import type { Filtri } from '../lib/filtri';
import { graficoGauge, graficoPartiImporto, graficoSankey } from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import { GRANT } from '../lib/report';
import { ConGrant, KpiImporto, diProgramma, erroreGiaMostrato, vuotoConPerimetro } from './comuni';
import { useSelezioneSenzaInterventi } from './selezione';
import type { Segnale } from './selezione';

type Voce = [string, ImportoLike | undefined];
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });

// ---------------------------------------------------------------- KPI e flussi

// KPI e flussi rileggono (dalla cache) le transazioni delle quattro sezioni: in errore tacciono, l'errore con "Riprova"
// lo dice una volta la sezione della sua transazione (A-07: niente raffica di avvisi uguali)
const silenzioso = erroreGiaMostrato;

function KpiStanziato({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useStanziato(filtri)} errorePersonalizzato={silenzioso}>{(d) => <KpiImporto etichetta="Importo stanziato" importo={d.importoStanziato} icona="it-card" tono="scuro" nota="dato di programma (regionale)" />}</VistaQuery>;
}

function KpiImpegnato({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={usePagamentiSuImpegnato(filtri)} errorePersonalizzato={silenzioso}>{(d) => <KpiImporto etichetta="Totale impegnato" importo={d.totaleImpegnato} icona="it-files" tono="blu" />}</VistaQuery>;
}

function KpiResiduo({ filtri, voce }: { filtri: Filtri; voce: 'pagato' | 'residuo' }) {
  return (
    <VistaQuery stato={useResiduoPagamenti(filtri)} errorePersonalizzato={silenzioso}>
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
      <ConGrant grant={GRANT.stanziato} titolo="Importo stanziato">
        <KpiStanziato filtri={filtri} />
      </ConGrant>
      <ConGrant grant={GRANT.pagamentiSuImpegnato} titolo="Totale impegnato">
        <KpiImpegnato filtri={filtri} />
      </ConGrant>
      <ConGrant grant={GRANT.residuoPagamenti} titolo="Importo pagato">
        <KpiResiduo filtri={filtri} voce="pagato" />
      </ConGrant>
      <ConGrant grant={GRANT.residuoPagamenti} titolo="Dotazione residua sui pagamenti">
        <KpiResiduo filtri={filtri} voce="residuo" />
      </ConGrant>
    </Griglia>
  );
}

function FlussoDotazione({ filtri }: { filtri: Filtri }) {
  const impegni = useResiduoImpegni(filtri);
  const pagamenti = usePagamentiSuImpegnato(filtri);
  const residuo = useResiduoPagamenti(filtri);
  return (
    <VistaQuery stato={impegni} errorePersonalizzato={silenzioso}>
      {(i) => (
        <VistaQuery stato={pagamenti} errorePersonalizzato={silenzioso}>
          {(p) => (
            <VistaQuery stato={residuo} errorePersonalizzato={silenzioso}>
              {(r) => (
                <CardGrafico
                  titolo="Dove va la dotazione"
                  sottotitolo="Dalla dotazione all'impegnato e al pagato"
                  dati={graficoSankey(i, p, r, i.perimetro === 'ADA' || p.perimetro === 'ADA' || r.perimetro === 'ADA' ? 'ADA' : i.perimetro)}
                  fonte="Fonte: TX-0006 (impegni), TX-0005 (pagamenti sull'impegnato), TX-0007 (residuo sui pagamenti)"
                  altezza="alto"
                />
              )}
            </VistaQuery>
          )}
        </VistaQuery>
      )}
    </VistaQuery>
  );
}

function PagatoSullaDotazione({ filtri }: { filtri: Filtri }) {
  return (
    <VistaQuery stato={useResiduoPagamenti(filtri)} errorePersonalizzato={silenzioso}>
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
      {/* il flusso combina impegni (TX-0006), pagamenti sull'impegnato (TX-0005) e residuo sui pagamenti (TX-0007) */}
      <ConGrant grant={[GRANT.residuoImpegni, GRANT.pagamentiSuImpegnato, GRANT.residuoPagamenti]} titolo="Dove va la dotazione">
        <FlussoDotazione filtri={filtri} />
      </ConGrant>
      <ConGrant grant={GRANT.residuoPagamenti} titolo="Pagato sulla dotazione">
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

// ---------------------------------------------------------------- le quattro sezioni

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
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => (
        <CardGrafico
          titolo={titolo}
          sottotitolo={misto && d.perimetro === 'ADA' ? `${grafico}. La dotazione è regionale, i pagamenti sono della tua area: non confrontabili.` : grafico}
          dati={graficoPartiImporto(grafico, parti(d), voci(d))}
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
  { titolo: 'Importo stanziato e da stanziare (RF004)', grant: GRANT.stanziato, Componente: Stanziato },
  { titolo: "Pagamenti sull'impegnato (RF005)", grant: GRANT.pagamentiSuImpegnato, Componente: PagamentiSuImpegnato },
  { titolo: 'Dotazione residua sugli impegni (RF006)', grant: GRANT.residuoImpegni, Componente: ResiduoImpegni },
  { titolo: 'Dotazione residua sui pagamenti (RF007)', grant: GRANT.residuoPagamenti, Componente: ResiduoPagamenti },
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
