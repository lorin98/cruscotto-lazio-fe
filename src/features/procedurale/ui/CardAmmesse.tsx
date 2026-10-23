// CardAmmesse — le card a barre raggruppate per intervento delle domande ammesse (TX-0026; wireframe panoramica e
// ammesse approvati): l'importo richiesto e il contributo ammesso (panoramica e pagina delle ammesse) e le domande ammesse
// con quelle con atto di concessione (pagina delle ammesse: con la fonte dell'atto non attiva la seconda serie e' omessa
// e dichiarata). Il clic su una barra apre il dettaglio procedurale dell'intervento con lo stato della pagina; col grant
// dell'elenco la tabella equivalente delle ammesse ha "Apri nell'elenco" per le domande ammesse e con atto di ogni
// intervento (link elenco-ammesse-riga, elenco-con-atto-riga). PNG, CSV e XLSX: il grafico e l'export di TX-0026.
import { useMemo } from 'react';
import { CardGrafico, TabellaStatica } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import type { CriteriProcedurali } from '../lib/criteri';
import type { RigaAmmesse } from '../lib/dto';
import { graficoAmmesseConAtto, graficoImporti } from '../lib/grafici';
import { CellaAmmesse, CellaConAtto } from './comuni';
import { OGGETTO_FILE, fileReport } from './esportazioni';
import { useApriIntervento, useLinkElenco, usePuoAprireElenco } from './navigazione';

const TITOLO_IMPORTI = 'Importo richiesto e contributo ammesso per intervento';
const TITOLO_CON_ATTO = 'Domande ammesse e con atto di concessione per intervento';

interface PropsCard {
  righe: readonly RigaAmmesse[];
  criteri: CriteriProcedurali;
}

/** Importo richiesto e contributo ammesso per intervento; clic su una barra: il dettaglio dell'intervento. */
export function CardImporti({ righe, criteri }: PropsCard) {
  const { dalClic } = useApriIntervento(criteri.stato);
  const dati = useMemo(() => graficoImporti(righe, TITOLO_IMPORTI), [righe]);
  return (
    <CardGrafico
      titolo={TITOLO_IMPORTI}
      sottotitolo="Importi delle domande ammesse; trascina il cursore sotto il grafico per ingrandire, clic su una barra per il dettaglio dell'intervento"
      dati={dati}
      fonte="Fonte: TX-0026. Importi della determina corrente, altrimenti della domanda negli scarichi SIAN (D-03). PNG: l'immagine del grafico con l'intestazione, non registrata in audit; CSV e XLSX: l'export di TX-0026 coi filtri della pagina (una riga per intervento e i totali)."
      altezza="alto"
      onClic={dalClic}
      scaricamenti={fileReport('domandeAmmesse', TITOLO_IMPORTI, criteri)}
      oggettoDati={OGGETTO_FILE.domandeAmmesse}
    />
  );
}

/** La tabella equivalente delle ammesse e con atto, coi link verso l'elenco delle domande dell'intervento. */
function TabellaConAtto({ righe, criteri }: PropsCard) {
  const link = useLinkElenco(criteri);
  const colonne: ColonnaStatica<RigaAmmesse>[] = [
    { chiave: 'intervento', titolo: 'Intervento', resa: (r) => r.codiceIntervento },
    { chiave: 'ammesse', titolo: 'Domande ammesse', resa: (r) => <CellaAmmesse r={r} criteri={criteri} link={link} />, numerica: true },
    { chiave: 'atto', titolo: 'Con atto di concessione', resa: (r) => <CellaConAtto r={r} link={link} />, numerica: true },
  ];
  return <TabellaStatica caption={`${TITOLO_CON_ATTO}: l'intervento è l'intestazione di riga`} colonne={colonne} righe={righe} chiaveRiga={(r) => r.codiceIntervento} />;
}

/** Domande ammesse e con atto di concessione per intervento; clic su una barra: il dettaglio dell'intervento. */
export function CardAmmesseConAtto({ righe, criteri }: PropsCard) {
  const { dalClic } = useApriIntervento(criteri.stato);
  const dati = useMemo(() => graficoAmmesseConAtto(righe, TITOLO_CON_ATTO), [righe]);
  const conLink = usePuoAprireElenco();
  return (
    <CardGrafico
      titolo={TITOLO_CON_ATTO}
      sottotitolo="Clic su una barra per il dettaglio dell'intervento; la vista Tabella apre le domande nell'elenco operativo"
      dati={dati}
      fonte="Fonte: TX-0026. Con atto di concessione = domande di sostegno con numero o data dell'atto nel report CSR-DS. PNG: l'immagine del grafico; CSV e XLSX: l'export di TX-0026 coi filtri della pagina."
      altezza="alto"
      onClic={dalClic}
      scaricamenti={fileReport('domandeAmmesse', TITOLO_CON_ATTO, criteri)}
      oggettoDati={OGGETTO_FILE.domandeAmmesse}
      tabella={conLink ? <TabellaConAtto righe={righe} criteri={criteri} /> : undefined}
    />
  );
}
