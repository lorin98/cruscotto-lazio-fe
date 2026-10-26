// anteprima.ts — i numeri della card Procedurale della Home come DATI (PURO, zero React; flusso panoramica approvato,
// home.html, OP-PR-10): quelli della panoramica senza filtri. Da TX-0026 le domande ammesse, il contributo ammesso (dato
// motivato: assente, la sua frase, mai uno 0; con interventi con domande ammesse senza contributo, la nota che lo dice
// come nella panoramica, decisione D1 del 26/10/2026) e gli interventi attivati sul perimetro ufficiale con la quota (nessuna
// quota se il perimetro e' vuoto); da TX-0027 il totale delle domande di sostegno (voci, altri stati e non rilasciate
// comprese, come la pagina degli stati). Col perimetro ADA le etichette sono dell'area del profilo; il perimetro ufficiale
// degli interventi resta quello del programma.
import { assenzaInFrase } from '../../../entities/importo';
import { etichettaDellArea, formatNumber, formatPercentuale, maiuscolaIniziale, percentuale } from '../../../shared/lib';
import type { Ammesse, Perimetro, Stati } from './dto';
import { ETICHETTE_KPI, interventiSenzaContributo, testoSenzaContributo } from './kpi';
import { diTipo } from './stati';

export interface InterventiAttivati {
  attivati: number;
  perimetroUfficiale: number;
  /** Attivati sul perimetro ufficiale (0-100); null con il perimetro vuoto. */
  quota: number | null;
}

export interface AnteprimaAmmesse {
  domandeAmmesse: number;
  /** Il contributo, oppure null col motivo in una frase; `nota`: gli interventi che il totale non comprende (D1). */
  contributo: { valore: number | null; motivo?: string; nota?: string };
  interventi: InterventiAttivati;
}

/** I numeri di TX-0026; null se la risposta non ha i totali (la card lo dice come un errore). */
export function anteprimaAmmesse(d: Ammesse): AnteprimaAmmesse | null {
  const t = d.totale;
  if (t?.domandeAmmesse == null || t.interventiAttivati == null || t.interventiPerimetroUfficiale == null) return null;
  const c = t.contributoAmmesso;
  const perimetroUfficiale = t.interventiPerimetroUfficiale;
  const senza = testoSenzaContributo(interventiSenzaContributo(d.righe ?? []));
  return {
    domandeAmmesse: t.domandeAmmesse,
    contributo: c?.valore != null ? { valore: c.valore, ...(senza ? { nota: `${maiuscolaIniziale(senza)}.` } : {}) } : { valore: null, motivo: assenzaInFrase(c) },
    interventi: { attivati: t.interventiAttivati, perimetroUfficiale, quota: perimetroUfficiale > 0 ? percentuale(t.interventiAttivati, perimetroUfficiale) : null },
  };
}

/** Le domande di sostegno di TX-0027 (il totale della distribuzione); null se la risposta non lo porta. */
export function domandeDiSostegno(d: Stati): number | null {
  return d.totale?.totale ?? null;
}

/** Le etichette della card, col perimetro della risposta (ADA: "della tua area"). */
export function etichetteAnteprima(perimetro: Perimetro | undefined) {
  return {
    ammesse: etichettaDellArea(ETICHETTE_KPI.ammesse, perimetro),
    contributo: etichettaDellArea(ETICHETTE_KPI.contributo, perimetro),
    interventi: perimetro === 'ADA' ? `${ETICHETTE_KPI.interventi} con domande della tua area` : ETICHETTE_KPI.interventi,
    sostegno: etichettaDellArea(`Domande ${diTipo('SOSTEGNO')}`, perimetro),
  };
}

/** "10 su 36 (27,8 %)"; senza quota il solo "0 su 0". */
export function testoInterventi(i: InterventiAttivati): string {
  const su = `${formatNumber(i.attivati)} su ${formatNumber(i.perimetroUfficiale)}`;
  return i.quota === null ? su : `${su} (${formatPercentuale(i.quota)})`;
}
