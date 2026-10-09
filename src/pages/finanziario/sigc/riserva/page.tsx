// Pagina /finanziario/sigc/riserva (green-fe step6): riserva al 5% (TX-0014). L'anno sta nell'indirizzo (?anno=);
// i filtri del finanziario non si applicano (dato regionale, OP-FE-03).
import { RiservaReport, useAnnoNellIndirizzo } from '../../../../features/finanziario';
import { PaginaFinanziario } from '../../../../widgets/report-finanziario';

export default function Pagina() {
  const [anno, impostaAnno] = useAnnoNellIndirizzo('anno');
  return (
    <PaginaFinanziario percorso="/finanziario/sigc/riserva" conBarraFiltri={false}>
      {() => <RiservaReport anno={anno} onCambiaAnno={impostaAnno} />}
    </PaginaFinanziario>
  );
}
