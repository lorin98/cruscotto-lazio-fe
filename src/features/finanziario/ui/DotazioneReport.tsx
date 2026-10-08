// DotazioneReport — report RF002 e RF003 (route /finanziario/dotazione, TX-0002 e TX-0003, flusso dotazione-avanzamento v2):
// dotazione e pagamenti per intervento (barre con zoom e tabella interattiva), quota FEASR e non FEASR (ciambella),
// contributo ambientale per intervento. Ogni sezione ha il suo grant e il suo perimetro; con il perimetro ADA la dotazione
// regionale non sta sullo stesso grafico dei pagamenti dell'area. Lo stato vuoto di RF003 si ricava dalle righe di RF002.
// Clic su un intervento: il suo dettaglio. Le colonne senza alcun valore partono nascoste e lo si dice.
import { useNavigate } from 'react-router';
import { ValoreImporto } from '../../../entities/importo';
import type { ImportoLike } from '../../../entities/importo';
import { CardGrafico, TabellaInterattiva, VistaQuery } from '../../../shared/ui';
import type { ClicGrafico, ColonnaTabella } from '../../../shared/ui';
import { useDistribuzioneDotazione, useSpesaPerIntervento } from '../api';
import type { SpesaPerIntervento, SpesaPerInterventoRiga } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri, Perimetro } from '../lib/filtri';
import { percentualeOpzionale } from '../lib/formato';
import { graficoContributo, graficoDotazionePagamenti, graficoQuotaFeasr } from '../lib/grafici';
import { codiceInterventoValido, percorsoIntervento } from '../lib/report';
import { ConGrant, Griglia, NotaPerimetroMisto, PerimetroSezione, Sezione, diProgramma, vuotoConPerimetro } from './comuni';
import { inAttesaDelSegnale, useSelezioneSenzaInterventi } from './selezione';

type Riga = SpesaPerInterventoRiga;
type CampoImporto = 'dotazioneSpesaPubblica' | 'impegnatoCofinanziatoFeasrENon' | 'impegnatoSpesaPubblica' | 'pagamentiTotali' | 'quotaStato' | 'quotaRegione' | 'vincoloDotazioneLeader';

const CAMPI: Array<{ chiave: CampoImporto; titolo: string; programma?: boolean }> = [
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
const VUOTO = vuotoConPerimetro('Nessun intervento per i filtri scelti. Modifica i filtri.');
const valore = (i: ImportoLike | undefined | null) => i?.valore ?? null;
const senzaValori = (righe: Riga[], c: CampoImporto) => righe.every((r) => valore(r[c]) === null);

function colonne(righe: Riga[], p: Perimetro | undefined): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    ...CAMPI.map((c) => ({
      chiave: c.chiave,
      titolo: c.programma ? diProgramma(c.titolo, p) : c.titolo,
      valore: (r: Riga) => valore(r[c.chiave]),
      resa: (r: Riga) => <ValoreImporto importo={r[c.chiave]} />,
      numerica: true,
      nascosta: senzaValori(righe, c.chiave),
    })),
    {
      chiave: 'contributo',
      titolo: diProgramma('Contributo ambientale', p),
      valore: (r) => r.percentualeContributoAmbientale ?? null,
      resa: (r) => percentualeOpzionale(r.percentualeContributoAmbientale),
      numerica: true,
    },
  ];
}

function SpesaPerInterventoSezione({ d, onIntervento }: { d: SpesaPerIntervento; onIntervento: (c: string) => void }) {
  const righe = d.righe ?? [];
  const nascoste = CAMPI.filter((c) => senzaValori(righe, c.chiave)).map((c) => (c.programma ? diProgramma(c.titolo, d.perimetro) : c.titolo));
  const clic = (p: ClicGrafico) => {
    if (codiceInterventoValido(p.name)) onIntervento(p.name);
  };
  return (
    <>
      <Griglia>
        <CardGrafico
          titolo="Dotazione e pagamenti per intervento"
          sottotitolo="Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio"
          dati={graficoDotazionePagamenti(righe.map((r) => ({ codiceIntervento: r.codiceIntervento, dotazione: r.dotazioneSpesaPubblica, pagato: r.pagamentiTotali })), d.perimetro)}
          fonte={`Fonte: TX-0002 · Perimetro ${d.perimetro ?? 'non indicato'}`}
          altezza="alto"
          onClic={clic}
        />
        <CardGrafico
          titolo="Contributo ambientale per intervento"
          sottotitolo="Clic su una barra per il dettaglio"
          dati={graficoContributo(righe)}
          fonte="Fonte: TX-0002"
          altezza="alto"
          onClic={clic}
        />
      </Griglia>
      <Sezione titolo={TITOLO_SPESA}>
        <PerimetroSezione perimetro={d.perimetro} />
        <NotaPerimetroMisto perimetro={d.perimetro} />
        {nascoste.length > 0 && (
          <p className="ui-nota">{`Colonne nascoste perché nessun intervento ha un valore (fonte non attiva): ${nascoste.join(', ')}. Si mostrano da "Colonne".`}</p>
        )}
        <TabellaInterattiva
          caption="Dotazione, impegni e pagamenti per intervento"
          righe={righe}
          colonne={colonne(righe, d.perimetro)}
          chiaveRiga={(r) => r.codiceIntervento ?? ''}
          testoRicerca={(r) => r.codiceIntervento ?? ''}
          etichettaRiga={(r) => `Apri il dettaglio dell'intervento ${r.codiceIntervento ?? ''}`}
          onRiga={(r) => r.codiceIntervento && onIntervento(r.codiceIntervento)}
          ordineIniziale={{ chiave: 'dotazioneSpesaPubblica', verso: 'decrescente' }}
        />
      </Sezione>
    </>
  );
}

function Spesa({ filtri, onIntervento }: { filtri: Filtri; onIntervento: (c: string) => void }) {
  const stato = useSpesaPerIntervento(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => (d.righe ?? []).length === 0} vuoto={VUOTO}>
      {(d) => <SpesaPerInterventoSezione d={d} onIntervento={onIntervento} />}
    </VistaQuery>
  );
}

function Distribuzione({ filtri }: { filtri: Filtri }) {
  const stato = useDistribuzioneDotazione(filtri);
  const segnale = useSelezioneSenzaInterventi(filtri);
  return (
    <VistaQuery stato={inAttesaDelSegnale(stato, segnale)} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico titolo={TITOLO_QUOTE} sottotitolo="Ripartizione della dotazione di spesa pubblica" dati={graficoQuotaFeasr(d)} fonte={`Fonte: TX-0003 · Perimetro ${d.perimetro ?? 'non indicato'}`} />
        </div>
      )}
    </VistaQuery>
  );
}

export function DotazioneReport({ filtri }: { filtri: Filtri }) {
  const naviga = useNavigate();
  const query = ricercaDaFiltri(filtri);
  const apri = (c: string) => void naviga(`${percorsoIntervento(c)}${query ? `?${query}` : ''}`);
  return (
    <>
      <ConGrant grant="csr.tx-0002.read" titolo={TITOLO_SPESA}>
        <Spesa filtri={filtri} onIntervento={apri} />
      </ConGrant>
      <Griglia>
        <ConGrant grant="csr.tx-0003.read" titolo={TITOLO_QUOTE}>
          <Distribuzione filtri={filtri} />
        </ConGrant>
      </Griglia>
    </>
  );
}
