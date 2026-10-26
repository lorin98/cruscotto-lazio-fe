// kpi.ts — i KPI del procedurale come DATI (PURO, zero React; al piu' quattro per pagina, solo totali dei DTO):
// domande ammesse, con atto di concessione, contributo ammesso col richiesto e interventi attivati (TX-0026: panoramica,
// pagina delle ammesse, dettaglio dell'intervento con la sua riga), domande e di cui non rilasciate (TX-0027, TX-0028:
// pagine degli stati, dettaglio). Un dato senza fonte e' l'assenza in una frase (mai uno 0); la quota del contributo
// sul richiesto c'e' solo se entrambi sono valorizzati. Ogni KPI che apre l'elenco porta il link dello uiplan: chi lo
// rende ne controlla il grant di arrivo.
import { assenzaInFrase, testoMotivato } from '../../../entities/importo';
import { formatNumber, formatPercentuale, importoBreve, percentuale } from '../../../shared/lib';
import { apreConAtto, apreLeAmmesse, VOCE_AMMESSA } from './collegamenti';
import type { IdLinkElenco, PuntoElenco } from './collegamenti';
import type { CriteriProcedurali } from './criteri';
import type { Dato, Distribuzione, TipoDomanda, TotaleAmmesse } from './dto';
import { NOTA_NON_RILASCIATE } from './formato';
import { diTipo } from './stati';

export type ChiaveKpi = 'ammesse' | 'conAtto' | 'contributo' | 'interventi' | 'domande' | 'nonRilasciate';

/** Etichette dei KPI di TX-0026: le stesse nella panoramica, nelle ammesse, nel dettaglio e nella card della Home. */
export const ETICHETTE_KPI = { ammesse: 'Domande ammesse', contributo: 'Contributo ammesso', interventi: 'Interventi attivati' } as const;

/** Il link verso l'elenco di un KPI: il link dello uiplan, il punto e la descrizione del nome accessibile. */
interface LinkKpi {
  id: IdLinkElenco;
  punto: PuntoElenco;
  descrizione: string;
}

export interface KpiProcedurale {
  chiave: ChiaveKpi;
  etichetta: string;
  valore?: string;
  assente?: string;
  nota?: string;
  elenco?: LinkKpi;
}

/** Il valore o l'assenza in una frase di un dato motivato. */
function valoreOAssenza(d: Dato | undefined, resa: (v: number) => string): Pick<KpiProcedurale, 'valore' | 'assente'> {
  return d?.valore != null ? { valore: resa(d.valore) } : { assente: assenzaInFrase(d) };
}

/** "su importo richiesto 1,5 M€: 53,3 %" con entrambi valorizzati; altrimenti il richiesto (o la sua assenza). */
export function notaContributo(richiesto: Dato | undefined, contributo: Dato | undefined): string {
  const r = richiesto?.valore;
  const c = contributo?.valore;
  if (r != null && c != null && r > 0) return `su importo richiesto ${importoBreve(r)}: ${formatPercentuale(percentuale(c, r))}`;
  return `importo richiesto: ${testoMotivato(richiesto, importoBreve)}`;
}

/** Dove aprono i KPI delle ammesse e dell'atto: la pagina (coi filtri) o il dettaglio (l'intervento della route). */
interface Contesto {
  criteri: CriteriProcedurali;
  /** I due link dello uiplan della pagina, ammesse e con atto. */
  link: { ammesse: IdLinkElenco; conAtto: IdLinkElenco };
  /** L'intervento del dettaglio, nel punto del link e nei nomi accessibili. */
  intervento?: string;
}

const dellIntervento = (codice: string | undefined) => (codice ? ` di ${codice}` : '');

function kpiAmmesse(t: TotaleAmmesse, x: Contesto): KpiProcedurale {
  const n = t.domandeAmmesse;
  return {
    chiave: 'ammesse',
    etichetta: ETICHETTE_KPI.ammesse,
    valore: formatNumber(n),
    nota: 'stato area programmazione Ammessa, domande di ogni tipo',
    ...(apreLeAmmesse(x.criteri, n) ? { elenco: { id: x.link.ammesse, punto: { voceProgrammazione: VOCE_AMMESSA, intervento: x.intervento }, descrizione: `le domande ammesse${dellIntervento(x.intervento)}` } } : {}),
  };
}

function kpiConAtto(t: TotaleAmmesse, x: Contesto): KpiProcedurale {
  return {
    chiave: 'conAtto',
    etichetta: 'Domande con atto di concessione',
    ...valoreOAssenza(t.conAttoConcessione, formatNumber),
    nota: "domande di sostegno con numero o data dell'atto nel report CSR-DS",
    ...(apreConAtto(t.conAttoConcessione) ? { elenco: { id: x.link.conAtto, punto: { concessione: true, intervento: x.intervento }, descrizione: `le domande di sostegno con atto di concessione${dellIntervento(x.intervento)}` } } : {}),
  };
}

/** I tre KPI delle domande ammesse (dal totale della pagina o dalla riga dell'intervento del dettaglio). */
export function kpiDelleAmmesse(t: TotaleAmmesse, x: Contesto): KpiProcedurale[] {
  return [
    kpiAmmesse(t, x),
    kpiConAtto(t, x),
    { chiave: 'contributo', etichetta: ETICHETTE_KPI.contributo, ...valoreOAssenza(t.contributoAmmesso, importoBreve), nota: notaContributo(t.importoRichiesto, t.contributoAmmesso) },
  ];
}

/** Interventi attivati sul perimetro ufficiale (gli interventi selezionati, AT001 esclusa). */
export function kpiInterventi(t: TotaleAmmesse): KpiProcedurale {
  return {
    chiave: 'interventi',
    etichetta: ETICHETTE_KPI.interventi,
    valore: `${formatNumber(t.interventiAttivati)} su ${formatNumber(t.interventiPerimetroUfficiale)}`,
    nota: 'con almeno una domanda di sostegno, sul perimetro ufficiale (interventi selezionati, AT001 esclusa)',
  };
}

/** I due KPI della pagina degli stati: le domande del tipo e il di cui non rilasciate, con la regola del filtro per stato. */
export function kpiDegliStati(totale: Distribuzione | undefined, tipo: TipoDomanda, conStato: boolean): KpiProcedurale[] {
  const nota = tipo === 'SOSTEGNO' ? "in compilazione o stampate, non ancora nell'elenco operativo" : "non ancora nell'elenco operativo";
  return [
    { chiave: 'domande', etichetta: `Domande ${diTipo(tipo)}`, valore: formatNumber(totale?.totale), nota: `${tipo === 'PAGAMENTO' ? 'CSR-DP: ' : ''}voci, altri stati e domande non rilasciate comprese` },
    { chiave: 'nonRilasciate', etichetta: 'Di cui non rilasciate', valore: formatNumber(totale?.domandeNonRilasciate), nota: conStato ? `${nota}. ${NOTA_NON_RILASCIATE}` : nota },
  ];
}

/**
 * Il quarto KPI del dettaglio: le domande di sostegno dell'intervento, col di cui non rilasciate e le domande di pagamento;
 * senza il grant degli stati di sostegno le sole domande di pagamento; senza nessuno dei due, nessun KPI.
 */
export function kpiDomandeDellIntervento(sostegno: Distribuzione | undefined, pagamento: Distribuzione | undefined): KpiProcedurale | null {
  const diCui = (d: Distribuzione) => `di cui non rilasciate ${formatNumber(d.domandeNonRilasciate)}`;
  if (sostegno) return { chiave: 'domande', etichetta: 'Domande di sostegno', valore: formatNumber(sostegno.totale), nota: pagamento ? `${diCui(sostegno)}; domande di pagamento ${formatNumber(pagamento.totale)}` : diCui(sostegno) };
  return pagamento ? { chiave: 'domande', etichetta: 'Domande di pagamento', valore: formatNumber(pagamento.totale), nota: diCui(pagamento) } : null;
}
