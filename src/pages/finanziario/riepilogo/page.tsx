// Pagina /finanziario/riepilogo (green-fe step6): compone dal barrel della feature dentro l'impaginazione comune.
import { RiepilogoReport } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return <PaginaFinanziario percorso="/finanziario/riepilogo">{(filtri) => <RiepilogoReport filtri={filtri} />}</PaginaFinanziario>;
}
