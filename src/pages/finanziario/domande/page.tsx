// Pagina /finanziario/domande (green-fe step6): compone dal barrel della feature dentro l'impaginazione comune.
import { DomandeReport } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return <PaginaFinanziario percorso="/finanziario/domande">{(filtri) => <DomandeReport filtri={filtri} />}</PaginaFinanziario>;
}
