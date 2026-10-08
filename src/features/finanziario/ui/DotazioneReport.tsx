// DotazioneReport — pattern DS "report" (route /finanziario/dotazione, TX-0002/RF002 e TX-0003/RF003, wireframe
// dotazione.html): per intervento dotazione, impegni e pagamenti (barre + tabella) e ripartizione della dotazione tra
// quota FEASR e non FEASR (ciambella + voci). Ogni sezione ha il suo grant e il suo perimetro; con il perimetro ADA la
// dotazione regionale non sta sullo stesso grafico dei pagamenti dell'area. Lo stato vuoto di RF003 si ricava dalle righe
// di RF002 (mai da importi a zero). Grafici SVG propri, tabella come canale primario; classi bootstrap-italia.
import { ValoreImporto } from '../../../entities/importo';
import { formatEuro } from '../../../shared/lib';
import { GraficoBarre, GraficoCiambella, VistaQuery } from '../../../shared/ui';
import { useDistribuzioneDotazione, useSpesaPerIntervento } from '../api';
import type { SpesaPerInterventoRiga } from '../api';
import type { Filtri, Perimetro } from '../lib/filtri';
import { percentualeOpzionale } from '../lib/formato';
import { ConGrant, NotaPerimetroMisto, PerimetroSezione, Sezione, TabellaRighe, TabellaVoci, colonnaImporto, diProgramma, vuotoConPerimetro } from './comuni';
import type { Colonna } from './comuni';
import { inAttesaDelSegnale, useSelezioneSenzaInterventi } from './selezione';

type Riga = SpesaPerInterventoRiga;
const colonne = (p: Perimetro | undefined): Colonna<Riga>[] => [
  colonnaImporto<Riga>(diProgramma('Dotazione spesa pubblica', p), (r) => r.dotazioneSpesaPubblica),
  colonnaImporto<Riga>('Impegnato cofinanziato FEASR e non', (r) => r.impegnatoCofinanziatoFeasrENon),
  colonnaImporto<Riga>('Impegnato spesa pubblica', (r) => r.impegnatoSpesaPubblica),
  colonnaImporto<Riga>('Pagamenti totali (elenchi di liquidazione)', (r) => r.pagamentiTotali),
  colonnaImporto<Riga>(diProgramma('Quota Stato', p), (r) => r.quotaStato),
  colonnaImporto<Riga>(diProgramma('Quota Regione', p), (r) => r.quotaRegione),
  colonnaImporto<Riga>(diProgramma('Vincolo dotazione LEADER', p), (r) => r.vincoloDotazioneLeader),
  [diProgramma('Contributo ambientale', p), (r) => percentualeOpzionale(r.percentualeContributoAmbientale)],
];

const TITOLO_SPESA = 'Spesa pubblica per intervento (RF002)';
const TITOLO_QUOTE = 'Dotazione tra quota FEASR e non FEASR (RF003)';
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.');

function serie(nome: string, righe: Riga[], leggi: (r: Riga) => number | null | undefined) {
  return { nome, valori: righe.map((r) => leggi(r) ?? null) };
}

function SpesaPerIntervento({ filtri }: { filtri: Filtri }) {
  const stato = useSpesaPerIntervento(filtri);
  return (
    <Sezione titolo={TITOLO_SPESA}>
      <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
        {(d) => {
          const righe = d.righe ?? [];
          const ada = d.perimetro === 'ADA';
          return (
            <>
              <PerimetroSezione perimetro={d.perimetro} />
              <NotaPerimetroMisto perimetro={d.perimetro} />
              <GraficoBarre
                titolo={ada ? 'Impegnato e pagamenti della tua area per intervento' : 'Dotazione, impegnato e pagamenti per intervento'}
                categorie={righe.map((r) => r.codiceIntervento ?? '')}
                serie={[
                  ...(ada ? [] : [serie('Dotazione spesa pubblica', righe, (r) => r.dotazioneSpesaPubblica?.valore)]),
                  serie('Impegnato cofinanziato FEASR e non', righe, (r) => r.impegnatoCofinanziatoFeasrENon?.valore),
                  serie('Impegnato spesa pubblica', righe, (r) => r.impegnatoSpesaPubblica?.valore),
                  serie('Pagamenti totali', righe, (r) => r.pagamentiTotali?.valore),
                ]}
                formatta={formatEuro}
              />
              <TabellaRighe caption="Dotazione, impegni e pagamenti per intervento" intestazione="Intervento" chiave={(r) => r.codiceIntervento ?? ''} colonne={colonne(d.perimetro)} righe={righe} />
            </>
          );
        }}
      </VistaQuery>
    </Sezione>
  );
}

function Distribuzione({ filtri }: { filtri: Filtri }) {
  const stato = useDistribuzioneDotazione(filtri);
  const segnale = useSelezioneSenzaInterventi(filtri);
  return (
    <Sezione titolo={TITOLO_QUOTE}>
      <VistaQuery stato={inAttesaDelSegnale(stato, segnale)} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
        {(d) => (
          <>
            <PerimetroSezione perimetro={d.perimetro} />
            <GraficoCiambella
              titolo="Ripartizione della dotazione di spesa pubblica"
              voci={[
                { etichetta: 'Quota FEASR', valore: d.quotaFeasr?.valore ?? null },
                { etichetta: 'Quota non FEASR', valore: d.quotaNonFeasr?.valore ?? null },
              ]}
              formatta={formatEuro}
            />
            <TabellaVoci
              caption="Ripartizione della dotazione di spesa pubblica"
              voci={[
                { etichetta: 'Dotazione spesa pubblica', valore: <ValoreImporto importo={d.dotazioneSpesaPubblica} aggregato /> },
                { etichetta: 'Quota FEASR', valore: <ValoreImporto importo={d.quotaFeasr} aggregato /> },
                { etichetta: 'Quota non FEASR', valore: <ValoreImporto importo={d.quotaNonFeasr} aggregato /> },
              ]}
            />
          </>
        )}
      </VistaQuery>
    </Sezione>
  );
}

export function DotazioneReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <ConGrant grant="csr.tx-0002.read" titolo={TITOLO_SPESA}>
        <SpesaPerIntervento filtri={filtri} />
      </ConGrant>
      <ConGrant grant="csr.tx-0003.read" titolo={TITOLO_QUOTE}>
        <Distribuzione filtri={filtri} />
      </ConGrant>
    </>
  );
}
