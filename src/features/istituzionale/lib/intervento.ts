// intervento.ts — il dettaglio dell'intervento come DATI (PURO, zero React; flusso intervento approvato): titolo e
// sopratitolo della testata (descrizione da TX-0060, senza il codice), badge in testo, i quattro KPI (target di fine
// periodo da TX-0017; domande ricevute, finanziate e spesa erogata non SIGC da TX-0016: nessuna quota calcolata), l'ultimo
// dato sincronizzato della prima risposta arrivata e l'esito "senza dati" (nessuna riga nei report letti). Ogni KPI c'e'
// solo con la riga della sua transazione (cioe' col suo grant: le letture sono gated).
import { formatNumber, importoBreve } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import type { RigaOutput, RigaVerifica } from './dto';
import { assenzaInFrase, testoTarget } from './formato';

/** Il titolo della testata (h1): la descrizione dell'intervento da TX-0060, altrimenti "Intervento <codice>". */
export function titoloIntervento(codice: string, descrizione: string | undefined): string {
  return descrizione ?? `Intervento ${codice}`;
}

/** Il sopratitolo della testata: "Istituzionale - intervento SRA01". */
export function sopratitoloIntervento(codice: string): string {
  return `Istituzionale - intervento ${codice}`;
}

/** "Indicatore di output O.14 (ettari)": l'indicatore da TX-0017 con l'unita', se no da TX-0016; null senza indicatore. */
function badgeOutput(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): string | null {
  const indicatore = output?.indicatoreOutput ?? verifica?.indicatoreOutput.valore;
  if (!indicatore) return null;
  return output?.unitaMisura ? `Indicatore di output ${indicatore} (${output.unitaMisura})` : `Indicatore di output ${indicatore}`;
}

/** I badge della testata: perimetro e indicatori, quando le righe lette li hanno. */
export function badgeIntervento(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): string[] {
  const risultato = verifica?.indicatoreRisultato.valore;
  return ['Perimetro regionale', badgeOutput(output, verifica), risultato ? `Indicatore di risultato ${risultato}` : null].filter((b): b is string => b !== null);
}

export type ChiaveKpi = 'target' | 'ricevute' | 'finanziate' | 'spesa';

/** Un KPI del dettaglio: etichetta, valore oppure l'assenza in una frase, la transazione da cui viene. */
export interface KpiIntervento {
  chiave: ChiaveKpi;
  etichetta: string;
  valore?: string;
  assente?: string;
  nota: string;
}

function kpiTarget(r: RigaOutput): KpiIntervento {
  const presente = r.targetFinePeriodo.valore != null;
  return {
    chiave: 'target',
    etichetta: 'Target di fine periodo',
    ...(presente ? { valore: testoTarget(r.targetFinePeriodo, r.annoTarget, r.unitaMisura) } : { assente: assenzaInFrase(r.targetFinePeriodo) }),
    nota: 'TX-0017',
  };
}

function kpiVerifica(r: RigaVerifica): KpiIntervento[] {
  const spesa = r.spesaErogata;
  return [
    { chiave: 'ricevute', etichetta: 'Domande ricevute non SIGC', valore: formatNumber(r.domandeRicevute), nota: 'TX-0016' },
    { chiave: 'finanziate', etichetta: 'Domande finanziate non SIGC', valore: formatNumber(r.domandeFinanziate), nota: 'TX-0016' },
    {
      chiave: 'spesa',
      etichetta: 'Spesa pubblica erogata non SIGC',
      ...(spesa.valore != null ? { valore: importoBreve(spesa.valore) } : { assente: assenzaInFrase(spesa) }),
      nota: 'TX-0016, anticipi inclusi',
    },
  ];
}

/** I KPI del dettaglio, nell'ordine del wireframe: quelli di TX-0017 e di TX-0016 se la riga c'e'. */
export function kpiIntervento(output: RigaOutput | undefined, verifica: RigaVerifica | undefined): KpiIntervento[] {
  return [...(output ? [kpiTarget(output)] : []), ...(verifica ? kpiVerifica(verifica) : [])];
}

/**
 * L'ultimo dato sincronizzato del dettaglio: quello della prima risposta arrivata fra TX-0016 e TX-0017 (lo stesso
 * elenco, SC-IS_ULTIMO_DATO); undefined finche' nessuna e' arrivata.
 */
export function ultimiDelDettaglio(verifica: { ultimiDatiSincronizzati: UltimoDato[] } | undefined, output: { ultimiDatiSincronizzati: UltimoDato[] } | undefined): UltimoDato[] | undefined {
  return (verifica ?? output)?.ultimiDatiSincronizzati;
}

/**
 * Lo stato del dettaglio dalle letture fatte (quelle col grant): 'attesa' finche' una manca, 'vuoto' se nessuna ha la
 * riga dell'intervento (es. AT001, che i report escludono), altrimenti 'dati'.
 */
export function esitoDettaglio(letture: ReadonlyArray<{ righe: readonly unknown[] } | undefined>): 'attesa' | 'vuoto' | 'dati' {
  if (letture.some((l) => l === undefined)) return 'attesa';
  return letture.every((l) => (l?.righe.length ?? 0) === 0) ? 'vuoto' : 'dati';
}
