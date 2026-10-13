// chip.ts — i filtri attivi come chip (PURO, zero React): etichetta del filtro e valore leggibile, con le descrizioni dei
// valori di TX-0060 quando ci sono (intervento, stato SIAN). La barra dei filtri li mostra e li toglie uno per uno.
import { formatEuro } from '../../../shared/lib';
import type { Criteri, NomeFiltro } from './criteri';
import { FILTRI_DOMANDA, FILTRI_PAGAMENTO } from './criteri';
import type { Valori } from './dto';
import { ETICHETTE_VALORI } from './formato';

/** Etichetta di ogni filtro nel pannello e nei chip. */
export const ETICHETTE_FILTRI: Record<NomeFiltro, string> = {
  tipo: 'Tipo di domanda',
  anno: 'Anno di raccolta',
  annualita: 'Annualità',
  intervento: 'Intervento',
  os: 'Obiettivo specifico',
  og: 'Obiettivo generale',
  op: 'Obiettivo di policy',
  azione: 'Azione portante',
  stato: 'Stato SIAN',
  statoProgrammazione: 'Stato area programmazione',
  statoSostegno: 'Stato della domanda di sostegno (report procedurale)',
  statoPagamento: 'Stato della domanda di pagamento (report procedurale)',
  voceProgrammazione: 'Stato area programmazione (report procedurale)',
  provincia: 'Provincia',
  ente: 'Ente delegato',
  pagamento: 'Pagamento',
  presentata: 'Presentate',
  sigc: 'SIGC',
  concessione: 'Atto di concessione',
  anomalie: 'Anomalie',
  richiestoDa: 'Richiesto da',
  richiestoA: 'Richiesto fino a',
  ammessoDa: 'Ammesso da',
  ammessoA: 'Ammesso fino a',
  pagatoDa: 'Pagato da',
  pagatoA: 'Pagato fino a',
  testo: 'Ricerca',
  decreto: 'Decreto',
  esito: 'Esito',
};

const IMPORTI: ReadonlySet<NomeFiltro> = new Set(['richiestoDa', 'richiestoA', 'ammessoDa', 'ammessoA', 'pagatoDa', 'pagatoA']);
const BOOLEANI: Partial<Record<NomeFiltro, [string, string]>> = {
  presentata: ['solo le presentate', ''],
  sigc: ['solo SIGC', 'non SIGC'],
  concessione: ["con l'atto", "senza l'atto"],
  anomalie: ['con anomalie', 'senza anomalie'],
};

function descrizioneDa(voci: Valori['interventi'], valore: string): string | null {
  return voci?.find((x) => (x.chiave ?? x.codice) === valore)?.descrizione ?? null;
}

function testoBooleano(nome: NomeFiltro, valore: string): string | null {
  const testi = BOOLEANI[nome];
  if (!testi || (valore !== 'true' && valore !== 'false')) return null;
  return (valore === 'true' ? testi[0] : testi[1]) || valore;
}

function testoImporto(valore: string): string {
  return Number.isFinite(Number(valore)) ? formatEuro(Number(valore)) : valore;
}

// Valori resi con le descrizioni di TX-0060 (o in forma propria): gli altri restano come sono.
const DESCRITTI: Partial<Record<NomeFiltro, (valore: string, valori?: Valori) => string>> = {
  testo: (valore) => `“${valore}”`,
  intervento: (valore, valori) => {
    const d = descrizioneDa(valori?.interventi, valore);
    return d ? `${valore} ${d}` : valore;
  },
  stato: (valore, valori) => valori?.stati?.find((s) => s.codice === valore)?.descrizione ?? valore,
  azione: (valore, valori) => descrizioneDa(valori?.azioniPortanti, valore) ?? valore,
  // chiavi dei report procedurali (DECADENZA_TOTALE, IN_ISTRUTTORIA_ENTE_COMPETENTE): leggibili senza i trattini bassi
  statoSostegno: (valore) => chiaveDelReport(valore),
  statoPagamento: (valore) => chiaveDelReport(valore),
  voceProgrammazione: (valore) => chiaveDelReport(valore),
};

function chiaveDelReport(valore: string): string {
  return valore.replaceAll('_', ' ');
}

/** Valore del chip: "SRA01 Produzione integrata", "1.000,00 €", "solo SIGC", "Prima annualità". */
export function valoreLeggibile(nome: NomeFiltro, valore: string, valori?: Valori): string {
  const fisso = ETICHETTE_VALORI[nome]?.[valore];
  if (fisso) return fisso;
  const booleano = testoBooleano(nome, valore);
  if (booleano !== null) return booleano;
  if (IMPORTI.has(nome)) return testoImporto(valore);
  const descritto = DESCRITTI[nome];
  return descritto ? descritto(valore, valori) : valore;
}

export interface Chip {
  nome: NomeFiltro;
  valore: string;
  etichetta: string;
  testo: string;
}

/**
 * Filtri in alternativa fra loro (O) e non insieme (E), come dice il contratto (D-02 Rev. 1 e Rev. 2 del backend): lo
 * stato SIAN e gli stati dei report procedurali per tipo di domanda; lo stato area programmazione e la voce del report.
 */
export const GRUPPI_IN_ALTERNATIVA: readonly (readonly NomeFiltro[])[] = [
  ['stato', 'statoSostegno', 'statoPagamento'],
  ['statoProgrammazione', 'voceProgrammazione'],
];

/** Con due o piu' filtri dello stesso gruppo attivi, la loro etichetta dice che valgono in alternativa (review v1 V-07). */
function etichettaNelGruppo(criteri: Criteri, nome: NomeFiltro): string {
  const gruppo = GRUPPI_IN_ALTERNATIVA.find((g) => g.includes(nome));
  const attivi = gruppo ? gruppo.filter((n) => (criteri[n]?.length ?? 0) > 0).length : 0;
  return attivi > 1 ? `${ETICHETTE_FILTRI[nome]} (in alternativa agli altri stati)` : ETICHETTE_FILTRI[nome];
}

/** Un chip per ogni valore di ogni filtro attivo, nell'ordine dei filtri (pagina e ordinamento non sono chip). */
export function chipDeiCriteri(criteri: Criteri, valori?: Valori): Chip[] {
  const out: Chip[] = [];
  for (const nome of [...FILTRI_PAGAMENTO, ...FILTRI_DOMANDA]) {
    for (const valore of criteri[nome] ?? []) {
      out.push({ nome, valore, etichetta: etichettaNelGruppo(criteri, nome), testo: valoreLeggibile(nome, valore, valori) });
    }
  }
  return out;
}
