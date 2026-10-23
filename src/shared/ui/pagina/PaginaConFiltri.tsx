// PaginaConFiltri — l'impaginazione di una pagina di report con la barra dei filtri (UI v2): la barra a chip con le pill a
// destra, poi nel main il percorso, un solo h1 col focus e il titolo del documento, cio' che sta sopra al corpo (lo stato
// dei valori dei filtri non disponibili, un selettore della pagina), il corpo dentro un solo avviso d'errore della pagina,
// e il pannello dei filtri. Prima scritta nell'istituzionale (PaginaReport, review H6); la usa anche il procedurale. Chip,
// pill, pannello e corpo li decide la feature: qui solo l'ordine e i landmark. Nessun react-aria.
import type { ComponentProps, ReactNode } from 'react';
import { BarraFiltri } from '../filtri/BarraFiltri';
import { AvvisoPagina } from '../stati/AvvisoPagina';
import { Briciole, TestaPagina } from './Testata';
import type { Briciola } from './Testata';

interface PropsPaginaConFiltri {
  barra: ComponentProps<typeof BarraFiltri>;
  /** Le voci del percorso dopo Home. */
  briciole: readonly Briciola[];
  testa: ComponentProps<typeof TestaPagina>;
  /** Fra il titolo e il corpo, fuori dall'avviso della pagina (es. lo stato dei valori dei filtri, il selettore dell'anno). */
  sopra?: ReactNode;
  /** Il pannello dei filtri (dialogo laterale), dopo il main. */
  pannello?: ReactNode;
  children: ReactNode;
}

export function PaginaConFiltri({ barra, briciole, testa, sopra, pannello, children }: PropsPaginaConFiltri) {
  return (
    <>
      <BarraFiltri {...barra} />
      <main className="ui-pagina" id="contenuto">
        <Briciole voci={briciole} />
        <TestaPagina {...testa} />
        {sopra}
        <AvvisoPagina>{children}</AvvisoPagina>
      </main>
      {pannello}
    </>
  );
}
