// DotazioneReport — report RF002 e RF003 (route /finanziario/dotazione, TX-0002 e TX-0003, flusso dotazione-avanzamento v2):
// dotazione e pagamenti per intervento (barre con zoom e tabella interattiva), quota FEASR e non FEASR (ciambella, con la
// dotazione del contratto), contributo ambientale per intervento. Ogni sezione ha il suo grant e il suo perimetro; con il
// perimetro ADA la dotazione regionale non sta sullo stesso grafico dei pagamenti dell'area. Lo stato vuoto di RF003 si
// ricava dalle righe di RF002. Tutte le colonne si vedono, con il motivo di ogni assenza (wireframe dotazione). Clic su
// un intervento: il suo dettaglio.
import { CardGrafico, Griglia, Sezione, TabellaInterattiva, VistaQuery } from '../../../shared/ui';
import type { ColonnaTabella } from '../../../shared/ui';
import { useDistribuzioneDotazione, useSpesaPerIntervento } from '../api';
import type { SpesaPerIntervento, SpesaPerInterventoRiga } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { percentualeOpzionale } from '../lib/formato';
import { graficoContributo, graficoDotazionePagamenti, graficoQuotaFeasr } from '../lib/grafici';
import type { Perimetro } from '../lib/perimetro';
import { GRANT } from '../lib/report';
import { ConGrant, NotaPerimetroMisto, PerimetroSezione, colonneImporti, diProgramma, vuotoConPerimetro } from './comuni';
import type { CampoImporto } from './comuni';
import { useSelezioneSenzaInterventi } from './selezione';
import { useApriIntervento } from './useApriIntervento';

type Riga = SpesaPerInterventoRiga;

const CAMPI: CampoImporto<Riga>[] = [
  { chiave: 'dotazioneSpesaPubblica', titolo: 'Dotazione spesa pubblica', programma: true },
  { chiave: 'impegnatoCofinanziatoFeasrENon', titolo: 'Impegnato cofinanziato FEASR e non' },
  { chiave: 'impegnatoSpesaPubblica', titolo: 'Impegnato spesa pubblica' },
  { chiave: 'pagamentiTotali', titolo: 'Pagamenti totali (elenchi di liquidazione)' },
  { chiave: 'quotaStato', titolo: 'Quota Stato', programma: true },
  { chiave: 'quotaRegione', titolo: 'Quota Regione', programma: true },
  { chiave: 'vincoloDotazioneLeader', titolo: 'Vincolo dotazione LEADER', programma: true },
];

const TITOLO_SPESA = 'Spesa pubblica per intervento (RF002)';
const TITOLO_QUOTE = 'Dotazione tra quota FEASR e non FEASR (RF003)';
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti.', { programma: true });

function colonne(p: Perimetro | undefined): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    ...colonneImporti(CAMPI, p),
    { chiave: 'contributo', titolo: diProgramma('Contributo ambientale', p), valore: (r) => r.percentualeContributoAmbientale ?? null, resa: (r) => percentualeOpzionale(r.percentualeContributoAmbientale), numerica: true },
  ];
}

function SpesaPerInterventoSezione({ d, filtri }: { d: SpesaPerIntervento; filtri: Filtri }) {
  const righe = d.righe ?? [];
  const { apri: onIntervento, dalClic: clic } = useApriIntervento(filtri);
  return (
    <>
      <Griglia>
        <CardGrafico
          titolo="Dotazione e pagamenti per intervento"
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio"
          dati={graficoDotazionePagamenti(righe.map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, pagato: r.pagamentiTotali })), d.perimetro, 'Pagamenti totali')}
          fonte={`Fonte: TX-0002 · Perimetro ${d.perimetro ?? 'non indicato'}`}
          altezza="alto"
          onClic={clic}
        />
        <CardGrafico titolo="Contributo ambientale per intervento" sottotitolo="Clic su una barra per il dettaglio" dati={graficoContributo(righe)} fonte="Fonte: TX-0002" altezza="alto" onClic={clic} />
      </Griglia>
      <Sezione titolo={TITOLO_SPESA}>
        <PerimetroSezione perimetro={d.perimetro} />
        <NotaPerimetroMisto perimetro={d.perimetro} />
        <TabellaInterattiva
          // una selezione nuova e' una tabella nuova: ricerca, ordine e pagina non restano quelli della precedente
          key={ricercaDaFiltri(filtri)}
          caption="Dotazione, impegni e pagamenti per intervento"
          righe={righe}
          colonne={colonne(d.perimetro)}
          chiaveRiga={(r) => r.codiceIntervento ?? ''}
          testoRicerca={(r) => r.codiceIntervento ?? ''}
          segnapostoRicerca="Cerca per codice dell'intervento"
          etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
          onRiga={(r) => r.codiceIntervento && onIntervento(r.codiceIntervento)}
          ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
        />
      </Sezione>
    </>
  );
}

function Spesa({ filtri }: { filtri: Filtri }) {
  const stato = useSpesaPerIntervento(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => <SpesaPerInterventoSezione d={d} filtri={filtri} />}
    </VistaQuery>
  );
}

function Distribuzione({ filtri }: { filtri: Filtri }) {
  const stato = useDistribuzioneDotazione(filtri);
  const segnale = useSelezioneSenzaInterventi(filtri);
  return (
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => <CardGrafico titolo={TITOLO_QUOTE} sottotitolo="Ripartizione della dotazione di spesa pubblica" dati={graficoQuotaFeasr(d)} fonte={`Fonte: TX-0003 · Perimetro ${d.perimetro ?? 'non indicato'}`} />}
    </VistaQuery>
  );
}

export function DotazioneReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <ConGrant grant={GRANT.spesaPerIntervento} titolo={TITOLO_SPESA}>
        <Spesa filtri={filtri} />
      </ConGrant>
      <Griglia>
        <ConGrant grant={GRANT.distribuzioneDotazione} titolo={TITOLO_QUOTE}>
          <Distribuzione filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
