// Pagina /finanziario/dotazione (green-fe step6): compone dal barrel della feature dentro l'impaginazione comune.
import { DotazioneReport } from '../../../features/finanziario';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  return <PaginaFinanziario percorso="/finanziario/dotazione">{(filtri) => <DotazioneReport filtri={filtri} />}</PaginaFinanziario>;
}
