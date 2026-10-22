// testata — percorso (Home > Elenco operativo > pagina) e titolo delle pagine dell'elenco operativo, sulla testata comune
// del kit (shared/ui: Briciole e TestaPagina, le stesse del finanziario e del fisico): l'h1 riceve il focus al cambio di
// pagina e da' il titolo al documento (WCAG 2.4.2 e 2.4.3).
import type { ReactNode } from 'react';
import { Briciole as BricioleKit, TestaPagina as TestaPaginaKit } from '../../../shared/ui';
import type { Briciola } from '../../../shared/ui';
import { PERCORSO_DOMANDE } from '../lib/collegamenti';

export type { Briciola };

export function Briciole({ voci }: { voci: Briciola[] }) {
  return <BricioleKit voci={[{ etichetta: 'Elenco operativo', a: PERCORSO_DOMANDE }, ...voci]} />;
}

export function TestaPagina({ titolo, titoloDocumento, sottotitolo, azioni }: { titolo: string; titoloDocumento: string; sottotitolo?: string; azioni?: ReactNode }) {
  return <TestaPaginaKit titolo={titolo} titoloDocumento={`${titoloDocumento} - Elenco operativo`} sottotitolo={sottotitolo} azioni={azioni} />;
}
