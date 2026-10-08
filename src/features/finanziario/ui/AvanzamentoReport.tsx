// AvanzamentoReport — pattern DS "report" (route /finanziario/avanzamento, TX-0004..TX-0007/RF004-RF007, wireframe
// avanzamento.html): quattro sezioni dichiarative, ciascuna con il suo grant, il suo perimetro (RF004 e RF006 sono dati
// di programma regionali, RF005 e RF007 seguono il perimetro ADA del P4), una ciambella (le due parti del totale: non
// disegnata se una parte manca) e le voci in tabella come canale primario. I valori sono totali sulla selezione
// (NON_VALORIZZATO = "non calcolabile"); lo stato vuoto viene dalle righe per intervento di TX-0002, mai da importi a
// zero. Classi bootstrap-italia, nessun react-aria.
import type { ReactNode } from 'react';
import { ValoreImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { formatEuro } from '../../../shared/lib';
import { GraficoCiambella, VistaQuery } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import { usePagamentiSuImpegnato, useResiduoImpegni, useResiduoPagamenti, useStanziato } from '../api';
import type { Filtri, Perimetro } from '../lib/filtri';
import { ConGrant, NotaPerimetroMisto, PerimetroSezione, Sezione, TabellaVoci, diProgramma, vuotoConPerimetro } from './comuni';
import { inAttesaDelSegnale, useSelezioneSenzaInterventi } from './selezione';
import type { Segnale } from './selezione';

type Coppia = [string, ImportoLike | undefined];
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.');

function Parti<T extends { perimetro?: Perimetro }>(props: {
  titolo: string;
  grafico: string;
  stato: StatoQuery<T>;
  segnale: Segnale;
  parti: (d: T) => Coppia[];
  voci: (d: T) => Coppia[];
  misto?: boolean;
}) {
  const { titolo, grafico, stato, segnale, parti, voci, misto = false } = props;
  return (
    <Sezione titolo={titolo}>
      <VistaQuery stato={inAttesaDelSegnale(stato, segnale)} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
        {(d) => (
          <>
            <PerimetroSezione perimetro={d.perimetro} />
            {misto && <NotaPerimetroMisto perimetro={d.perimetro} />}
            <GraficoCiambella titolo={grafico} voci={parti(d).map(([etichetta, i]) => ({ etichetta, valore: i?.valore ?? null }))} formatta={formatEuro} />
            <TabellaVoci caption={grafico} voci={voci(d).map(([etichetta, i]) => ({ etichetta, valore: <ValoreImporto importo={i} aggregato /> }))} />
          </>
        )}
      </VistaQuery>
    </Sezione>
  );
}

type PropsSezione = { filtri: Filtri; titolo: string };

function Stanziato({ filtri, titolo }: PropsSezione) {
  const parti = (d: { importoStanziato?: ImportoLike; importoDaStanziare?: ImportoLike }): Coppia[] => [['Importo stanziato', d.importoStanziato], ['Importo da stanziare', d.importoDaStanziare]];
  return <Parti titolo={titolo} grafico="Stanziato e da stanziare" stato={useStanziato(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} parti={parti} voci={parti} />;
}

function PagamentiSuImpegnato({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Impegnato tra pagamenti e ancora da pagare" stato={usePagamentiSuImpegnato(filtri)} segnale={useSelezioneSenzaInterventi(filtri)}
      parti={(d) => [['Pagamenti totali (elenchi di liquidazione)', d.pagamentiTotali], ['Impegnato ancora da pagare', d.impegnatoDaPagare]]}
      voci={(d) => [['Totale impegnato', d.totaleImpegnato], ['Pagamenti totali (elenchi di liquidazione)', d.pagamentiTotali], ['Impegnato ancora da pagare', d.impegnatoDaPagare]]} />
  );
}

function ResiduoImpegni({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Dotazione tra impegnato e residuo" stato={useResiduoImpegni(filtri)} segnale={useSelezioneSenzaInterventi(filtri)}
      parti={(d) => [['Importo impegnato', d.importoImpegnato], ['Dotazione residua', d.dotazioneResidua]]}
      voci={(d) => [['Dotazione spesa pubblica', d.dotazioneSpesaPubblica], ['Importo impegnato', d.importoImpegnato], ['Dotazione residua', d.dotazioneResidua]]} />
  );
}

function ResiduoPagamenti({ filtri, titolo }: PropsSezione) {
  return (
    <Parti titolo={titolo} grafico="Dotazione tra pagato e residuo" stato={useResiduoPagamenti(filtri)} segnale={useSelezioneSenzaInterventi(filtri)} misto
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
      {SEZIONI.map(({ titolo, grant, Componente }) => (
        <ConGrant key={grant} grant={grant} titolo={titolo}>
          <Componente filtri={filtri} titolo={titolo} />
        </ConGrant>
      ))}
    </>
  );
}
