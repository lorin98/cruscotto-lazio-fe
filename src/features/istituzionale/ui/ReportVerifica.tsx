// ReportVerifica — il report della verifica SMP non SIGC (flusso verifica-smp-non-sigc approvato, RF016; stessa resa della
// verifica SMP SIGC del finanziario): lo stato "nessun file SMP non SIGC" quando l'anno di riferimento manca (i dati
// restano: domande e spesa vengono dalle pratiche), i riferimenti della risposta (anno, come si legge l'output erogato,
// perimetro), la card a barre della spesa pubblica erogata per intervento (zoom oltre 12; clic su una barra: il dettaglio
// dell'intervento con l'anno scelto; PNG, CSV, XLSX) e la tabella dei ventuno dati. Nessun KPI: i dati sono per
// intervento. Classi bootstrap-italia e del kit v2; nessun react-aria.
import { useMemo } from 'react';
import type { Filtri } from '../../../entities/filtri';
import { CardGrafico, TabellaVoci, Vuoto } from '../../../shared/ui';
import { criteriVerifica } from '../lib/criteri';
import type { Verifica } from '../lib/dto';
import { NESSUN_FILE } from '../lib/formato';
import { TITOLO_SPESA, graficoSpesa } from '../lib/grafici';
import { vociRiferimenti } from '../lib/verifica';
import { OGGETTO_FILE_VERIFICA, fileVerifica } from './esportazioni';
import { useApriIntervento } from './navigazione';
import { TabellaVerifica } from './TabellaVerifica';

const SOTTOTITOLO = "Spesa non SIGC, anticipi inclusi, al lordo dei recuperi; trascina il cursore sotto il grafico per ingrandire, clic su una barra per il dettaglio dell'intervento";
const FONTE =
  "Fonte: TX-0016 (domande e spesa cumulative). La tabella equivalente mostra gli stessi valori, con i valori assenti dichiarati. PNG: l'immagine del grafico con l'intestazione, non registrata in audit come nel finanziario; CSV e XLSX: i dati del report scritti dal backend con gli stessi filtri e anno.";

export function ReportVerifica({ d, filtri, anno }: { d: Verifica; filtri: Filtri; anno: number | undefined }) {
  const { apri, dalClic } = useApriIntervento(anno);
  const dati = useMemo(() => graficoSpesa(d.righe), [d.righe]);
  const file = fileVerifica(anno === undefined ? 'Verifica SMP non SIGC' : `Verifica SMP non SIGC ${anno}`, criteriVerifica(filtri, anno));
  return (
    <>
      {d.annoRiferimento === null && <Vuoto>{NESSUN_FILE}</Vuoto>}
      <TabellaVoci caption="Riferimenti della risposta" voci={vociRiferimenti(d, anno)} />
      <CardGrafico titolo={TITOLO_SPESA} sottotitolo={SOTTOTITOLO} dati={dati} fonte={FONTE} livello={2} altezza="alto" onClic={dalClic} scaricamenti={file} oggettoDati={OGGETTO_FILE_VERIFICA} />
      <TabellaVerifica d={d} scaricamenti={file} onRiga={apri} />
    </>
  );
}
