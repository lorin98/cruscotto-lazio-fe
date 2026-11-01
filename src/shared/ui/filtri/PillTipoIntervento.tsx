// PillTipoIntervento — la pill della barra dei dettagli degli interventi (revisioni del 31/10/2026, F5): i dettagli non hanno
// il filtro SIGC, dicono il tipo dell'intervento dalla programmazione (VoceFiltro.perimetro dei valori dei filtri), in testo e
// non solo col colore. Niente pill se il tipo non si conosce (intervento non classificato o valori non letti).
import type { FiltroSigc } from '../../lib';

export function PillTipoIntervento({ tipo }: { tipo: FiltroSigc | null | undefined }) {
  if (!tipo) return null;
  return <span className="ui-pill">{`Tipo di intervento: ${tipo} (dalla programmazione; il filtro SIGC non si applica al dettaglio)`}</span>;
}
