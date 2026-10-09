// Pagina /finanziario (UI v2, flusso panoramica): cruscotto del finanziario con il pannello dei filtri (TX-0001).
import { PANORAMICA, Panoramica } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return (
    <PaginaFinanziario percorso={PANORAMICA.percorso}>
      {(filtri) => <Panoramica filtri={filtri} />}
    </PaginaFinanziario>
  );
}
