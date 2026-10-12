// DotazioneReport — report RF002 e RF003 (route /finanziario/dotazione, TX-0002 e TX-0003, flusso dotazione-avanzamento v2):
// dotazione e pagamenti per intervento (barre con zoom) accanto alla quota FEASR e non FEASR (ciambella, con la dotazione
// del contratto), poi contributo ambientale per intervento e tabella interattiva di RF002, nell'ordine del wireframe. Ogni sezione ha il suo grant e il suo perimetro; con il
// perimetro ADA la dotazione regionale non sta sullo stesso grafico dei pagamenti dell'area. Lo stato vuoto di RF003 si
// ricava dalle righe di RF002. Tutte le colonne si vedono, con il motivo di ogni assenza (wireframe dotazione). Clic su
// un intervento: il suo dettaglio.
import { CardGrafico, Griglia, PulsantiScarica, Sezione, TabellaInterattiva, VistaQuery } from '../../../shared/ui';
import type { ColonnaTabella } from '../../../shared/ui';
import { useDistribuzioneDotazione, useSpesaPerIntervento } from '../api';
import type { SpesaPerIntervento, SpesaPerInterventoRiga } from '../api';
import { datiDelReport } from './esportazioni';
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

const senzaRighe = (d: SpesaPerIntervento) => (d.righe ?? []).length === 0;

/** Card della dotazione e dei pagamenti (TX-0002): dichiara lo stato vuoto della pagina, una volta sola. */
function CardDotazione({ filtri }: { filtri: Filtri }) {
  const { dalClic } = useApriIntervento(filtri);
  return (
    <VistaQuery stato={useSpesaPerIntervento(filtri)} eVuoto={senzaRighe} vuoto={VUOTO}>
      {(d) => (
        <CardGrafico
          titolo="Dotazione e pagamenti per intervento"
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio"
          dati={graficoDotazionePagamenti((d.righe ?? []).map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, pagato: r.pagamentiTotali })), d.perimetro, 'Pagamenti totali')}
          fonte={`Fonte: TX-0002 · Perimetro ${d.perimetro ?? 'non indicato'}`}
          altezza="alto"
          onClic={dalClic}
          scaricamenti={datiDelReport('Dotazione e pagamenti per intervento', 'spesaPerIntervento', filtri)}
        />
      )}
    </VistaQuery>
  );
}

/** Contributo ambientale e tabella di RF002, dalla stessa lettura in cache di TX-0002; il vuoto lo dice CardDotazione. */
function ContributoETabella({ d, filtri }: { d: SpesaPerIntervento; filtri: Filtri }) {
  const righe = d.righe ?? [];
  const { apri: onIntervento, dalClic } = useApriIntervento(filtri);
  return (
    <>
      <CardGrafico
        titolo="Contributo ambientale per intervento"
        sottotitolo="Clic su una barra per il dettaglio"
        dati={graficoContributo(righe)}
        fonte="Fonte: TX-0002"
        altezza="alto"
        onClic={dalClic}
        scaricamenti={datiDelReport('Contributo ambientale per intervento', 'spesaPerIntervento', filtri)}
      />
      <Sezione titolo={TITOLO_SPESA} strumenti={<PulsantiScarica oggetto={`la tabella ${TITOLO_SPESA}`} scaricamenti={datiDelReport(TITOLO_SPESA, 'spesaPerIntervento', filtri)} />}>
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
          notaRicerca="I file CSV e XLSX contengono tutti gli interventi dei filtri, non solo quelli trovati dalla ricerca."
          etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
          onRiga={(r) => r.codiceIntervento && onIntervento(r.codiceIntervento)}
          ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
        />
      </Sezione>
    </>
  );
}

function Spesa({ filtri }: { filtri: Filtri }) {
  return <VistaQuery stato={useSpesaPerIntervento(filtri)}>{(d) => (senzaRighe(d) ? null : <ContributoETabella d={d} filtri={filtri} />)}</VistaQuery>;
}

function Distribuzione({ filtri }: { filtri: Filtri }) {
  const stato = useDistribuzioneDotazione(filtri);
  const segnale = useSelezioneSenzaInterventi(filtri);
  return (
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => <CardGrafico titolo={TITOLO_QUOTE} sottotitolo="Ripartizione della dotazione di spesa pubblica" dati={graficoQuotaFeasr(d)} fonte={`Fonte: TX-0003 · Perimetro ${d.perimetro ?? 'non indicato'}`} scaricamenti={datiDelReport(TITOLO_QUOTE, 'distribuzioneDotazione', filtri)} />}
    </VistaQuery>
  );
}

// ordine del wireframe dotazione approvato (review v3 V-06): dotazione e quota FEASR affiancate, poi il contributo
// ambientale e la tabella di RF002
export function DotazioneReport({ filtri }: { filtri: Filtri }) {
  return (
    <>
      <Griglia>
        <ConGrant grant={GRANT.spesaPerIntervento} titolo="Dotazione e pagamenti per intervento">
          <CardDotazione filtri={filtri} />
        </ConGrant>
        <ConGrant grant={GRANT.distribuzioneDotazione} titolo={TITOLO_QUOTE}>
          <Distribuzione filtri={filtri} />
        </ConGrant>
      </Griglia>
      <ConGrant grant={GRANT.spesaPerIntervento} titolo={TITOLO_SPESA}>
        <Spesa filtri={filtri} />
      </ConGrant>
    </>
  );
}
