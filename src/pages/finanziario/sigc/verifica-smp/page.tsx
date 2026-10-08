// Pagina /finanziario/sigc/verifica-smp (green-fe step6): dati SIGC per il confronto con SMP (TX-0015). L'esercizio
// sta nell'indirizzo (?esercizio=) insieme ai filtri.
import { VerificaSmpReport, useAnnoNellIndirizzo } from '../../../../features/finanziario';
import { PaginaFinanziario } from '../../../../widgets/report-finanziario';

export default function Pagina() {
  const [esercizio, impostaEsercizio] = useAnnoNellIndirizzo('esercizio');
  return (
    <PaginaFinanziario percorso="/finanziario/sigc/verifica-smp">
      {(filtri) => <VerificaSmpReport filtri={filtri} esercizio={esercizio} onCambiaEsercizio={impostaEsercizio} />}
    </PaginaFinanziario>
  );
}
