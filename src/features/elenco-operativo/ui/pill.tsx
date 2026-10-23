// pill — il perimetro dichiarato dalla risposta, sempre visibile nella barra dei filtri dell'elenco (wireframe domande e
// pagamenti; non rimovibile: per un P4 la propria area). La data dell'ultimo dato e' la pill del kit (PillDatiAl).
import { perimetroDellaRisposta } from '../lib/formato';

export function PerimetroElenco({ perimetro }: { perimetro: string | null | undefined }) {
  const testo = perimetroDellaRisposta(perimetro);
  if (!testo) return null;
  return <span className={perimetro === 'ADA' ? 'ui-pill ui-pill--evidenza' : 'ui-pill'}>{`Perimetro: ${testo}`}</span>;
}
