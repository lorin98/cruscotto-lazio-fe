// Pagina /finanziario/avanzamento (green-fe step6): compone dal barrel della feature dentro l'impaginazione comune.
import { AvanzamentoReport } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return <PaginaFinanziario percorso="/finanziario/avanzamento">{(filtri) => <AvanzamentoReport filtri={filtri} />}</PaginaFinanziario>;
}
