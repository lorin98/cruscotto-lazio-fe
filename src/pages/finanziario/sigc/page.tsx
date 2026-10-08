// Pagina /finanziario/sigc (green-fe step6): compone dal barrel della feature dentro l'impaginazione comune.
import { SigcReport } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return <PaginaFinanziario percorso="/finanziario/sigc">{(filtri) => <SigcReport filtri={filtri} />}</PaginaFinanziario>;
}
