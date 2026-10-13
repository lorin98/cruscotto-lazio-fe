// pill — informazioni sempre visibili nella barra dei filtri dell'elenco (wireframe domande e pagamenti): il perimetro
// dichiarato dalla risposta (non rimovibile: per un P4 la propria area) e la data dell'ultimo dato sincronizzato
// (OP-EO-01: ultimiDatiSincronizzati del sinottico o della pagina dei pagamenti), come la pill del finanziario.
import type { UltimoDato } from '../../../shared/lib';
import { PillDatiAl } from '../../../shared/ui';
import { testoPerimetro } from '../lib/formato';

export function PerimetroElenco({ perimetro }: { perimetro: string | null | undefined }) {
  const testo = testoPerimetro(perimetro);
  if (!testo) return null;
  return <span className={perimetro === 'ADA' ? 'ui-pill ui-pill--evidenza' : 'ui-pill'}>{`Perimetro: ${testo}`}</span>;
}

/** "Dati al gg/mm/aaaa": la pill del kit (PillDatiAl), con le voci del sinottico o della pagina dei pagamenti. */
export function DatiAl({ voci, inErrore = false }: { voci: readonly UltimoDato[] | undefined; inErrore?: boolean }) {
  return <PillDatiAl voci={voci} inErrore={inErrore} />;
}
