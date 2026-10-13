// collegamenti.ts — indirizzi dei link dichiarati nello uiplan della feature (PURO): scheda della domanda, elenco dei
// pagamenti delle domande filtrate e ritorno, altre domande del beneficiario. Solo i parametri dichiarati dal link.
import type { Criteri } from './criteri';
import { filtriDellaDomanda, ricercaDaCriteri } from './criteri';

export const PERCORSO_DOMANDE = '/elenco-operativo/domande';
export const PERCORSO_PAGAMENTI = '/elenco-operativo/pagamenti';

const TIPI = new Set(['SOSTEGNO', 'PAGAMENTO']);

/** Scheda della domanda (link dettaglio-domanda, domanda-collegata, dettaglio-domanda-del-pagamento); null se tipo o codice
 *  non sono utilizzabili (il backend risponderebbe 400). */
export function percorsoDettaglio(tipo: string | null | undefined, codiceABarre: string | null | undefined): string | null {
  if (!tipo || !TIPI.has(tipo) || !codiceABarre || !/^\d{1,30}$/.test(codiceABarre)) return null;
  return `${PERCORSO_DOMANDE}/${tipo}/${codiceABarre}`;
}

/** Link pagamenti-delle-domande: l'elenco dei pagamenti con i filtri della domanda (non pagina ne' ordinamento). */
export function percorsoPagamentiDelleDomande(criteri: Criteri): string {
  return `${PERCORSO_PAGAMENTI}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'pagamenti')}`;
}

/** Link domande-dei-pagamenti: l'elenco delle domande con i filtri della domanda (decreto ed esito restano ai pagamenti). */
export function percorsoDomandeDeiPagamenti(criteri: Criteri): string {
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri(filtriDellaDomanda(criteri), 'domande')}`;
}

/** Link domande-del-beneficiario: le domande col CUAA nel testo libero; null senza CUAA (o troppo corto per la ricerca). */
export function percorsoDomandeDelBeneficiario(cuaa: string | null | undefined): string | null {
  const c = cuaa?.trim();
  if (!c || c.length < 3) return null;
  return `${PERCORSO_DOMANDE}${ricercaDaCriteri({ testo: [c] }, 'domande')}`;
}
