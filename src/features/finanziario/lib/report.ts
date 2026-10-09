// report.ts — catalogo delle pagine del finanziario (PURO, UI v2): unica fonte di percorsi, titoli, voci di menu,
// sottotitoli e grant per il menu, l'impaginazione, la navigazione e il gating delle sezioni. Percorsi e grant sono
// quelli di src/app/route-table.json (un test li confronta); titoli e sottotitoli quelli dei wireframe approvati. La
// visibilita' per grant e' solo UX (hide-by-role): l'enforcement resta del backend.
import { minuscolaIniziale } from '../../../shared/lib';
import { ricercaDaFiltri, valoreFiltroValido } from './filtri';
import type { Filtri } from './filtri';

/** Grant VERBATIM dall'authz-catalog, uno per transazione del finanziario. */
export const GRANT = {
  filtri: 'csr.tx-0001.read',
  spesaPerIntervento: 'csr.tx-0002.read',
  distribuzioneDotazione: 'csr.tx-0003.read',
  stanziato: 'csr.tx-0004.read',
  pagamentiSuImpegnato: 'csr.tx-0005.read',
  residuoImpegni: 'csr.tx-0006.read',
  residuoPagamenti: 'csr.tx-0007.read',
  domandePerAnno: 'csr.tx-0008.read',
  totaleDomande: 'csr.tx-0009.read',
  importiPerAnno: 'csr.tx-0010.read',
  riepilogo: 'csr.tx-0011.read',
  sigcDomande: 'csr.tx-0012.read',
  sigcImporti: 'csr.tx-0013.read',
  riserva: 'csr.tx-0014.read',
  verificaSmp: 'csr.tx-0015.read',
} as const;

export const PERCORSI = {
  panoramica: '/finanziario',
  dettaglio: '/finanziario/interventi/:codice',
  riepilogo: '/finanziario/riepilogo',
  dotazione: '/finanziario/dotazione',
  avanzamento: '/finanziario/avanzamento',
  domande: '/finanziario/domande',
  sigc: '/finanziario/sigc',
  riserva: '/finanziario/sigc/riserva',
  verificaSmp: '/finanziario/sigc/verifica-smp',
} as const;

export interface VoceReport {
  percorso: string;
  titolo: string;
  /** Voce breve del menu laterale (wireframe approvati). */
  voceMenu: string;
  /** Riga sotto il titolo della pagina. */
  sottotitolo?: string;
  /** Grant VERBATIM dall'authz-catalog: basta uno dei grant per vedere la pagina (fine || coarse). */
  grant: string[];
}

const G = GRANT;

/** Panoramica (cruscotto): ospita anche il pannello dei filtri (TX-0001) e l'ultimo dato sincronizzato. */
export const PANORAMICA: VoceReport = {
  percorso: PERCORSI.panoramica,
  titolo: 'Panoramica',
  voceMenu: 'Panoramica',
  sottotitolo: "Dotazione, pagamenti e domande degli interventi selezionati. I grafici portano al dettaglio dell'intervento.",
  grant: [G.filtri, G.spesaPerIntervento, G.totaleDomande, G.sigcDomande, G.sigcImporti],
};

/** Dettaglio dell'intervento: le transazioni dei report filtrate sull'intervento della route. */
export const DETTAGLIO_INTERVENTO: VoceReport = {
  percorso: PERCORSI.dettaglio,
  titolo: "Dettaglio dell'intervento",
  voceMenu: "Dettaglio dell'intervento",
  grant: [G.riepilogo, G.spesaPerIntervento, G.domandePerAnno, G.importiPerAnno, G.sigcDomande, G.sigcImporti],
};

export const REPORT_FINANZIARIO: VoceReport[] = [
  {
    percorso: PERCORSI.riepilogo,
    titolo: 'Riepilogo per intervento',
    voceMenu: 'Riepilogo per intervento',
    sottotitolo: "Cerca, ordina, scegli le colonne; clic su una riga per l'anteprima, poi il dettaglio.",
    grant: [G.riepilogo],
  },
  {
    percorso: PERCORSI.dotazione,
    titolo: 'Dotazione e spesa per intervento',
    voceMenu: 'Dotazione e spesa',
    sottotitolo: 'Dotazione, pagamenti e quota FEASR per intervento.',
    grant: [G.spesaPerIntervento, G.distribuzioneDotazione],
  },
  {
    percorso: PERCORSI.avanzamento,
    titolo: 'Avanzamento finanziario',
    voceMenu: 'Avanzamento',
    sottotitolo: "Stanziato, impegnato, pagato e residui. Dove una fonte non è attiva, il grafico lo dice invece di inventare proporzioni.",
    grant: [G.stanziato, G.pagamentiSuImpegnato, G.residuoImpegni, G.residuoPagamenti],
  },
  {
    percorso: PERCORSI.domande,
    titolo: 'Domande e importi per anno',
    voceMenu: 'Domande e importi',
    sottotitolo: 'Domande per anno di raccolta e importi ammessi e decretati.',
    grant: [G.domandePerAnno, G.totaleDomande, G.importiPerAnno],
  },
  {
    percorso: PERCORSI.sigc,
    titolo: 'Domande e importi SIGC',
    voceMenu: 'SIGC: domande e importi',
    sottotitolo: 'Domande dalla presentazione al pagamento e importi SIGC.',
    grant: [G.sigcDomande, G.sigcImporti],
  },
  {
    percorso: PERCORSI.riserva,
    titolo: 'Riserva di efficacia (5%)',
    voceMenu: 'Riserva di efficacia',
    sottotitolo: "Accumulato, congelato, utilizzato e residuo della riserva per l'anno scelto.",
    grant: [G.riserva],
  },
  {
    percorso: PERCORSI.verificaSmp,
    titolo: 'Verifica SMP',
    voceMenu: 'Verifica SMP',
    sottotitolo: "Venti dati per intervento per l'esercizio scelto.",
    grant: [G.verificaSmp],
  },
];

/** Tutte le pagine del finanziario nell'ordine del menu (la panoramica per prima). */
export const PAGINE_FINANZIARIO: VoceReport[] = [PANORAMICA, ...REPORT_FINANZIARIO];

export function voceDi(percorso: string): VoceReport | undefined {
  return [...PAGINE_FINANZIARIO, DETTAGLIO_INTERVENTO].find((r) => r.percorso === percorso);
}

/** Pagine visibili per i grant dell'utente (gate di UX). */
export function pagineVisibili(haGrant: (grant: string) => boolean): VoceReport[] {
  return PAGINE_FINANZIARIO.filter((r) => r.grant.some(haGrant));
}

/** Titolo dell'h1: "Finanziario: " + titolo con la sola iniziale minuscola (le sigle restano maiuscole). */
export function titoloH1(titolo: string): string {
  return `Finanziario: ${minuscolaIniziale(titolo)}`;
}

/** Il codice della route di dettaglio e' un codice intervento valido (stesso formato del filtro). */
export function codiceInterventoValido(codice: string | null | undefined): codice is string {
  return !!codice && valoreFiltroValido('intervento', codice);
}

/** Codice cercato nella barra ("sra01 Intervento A" -> "SRA01"): la prima parola in maiuscolo, se e' un codice valido. */
export function codiceDaRicerca(testo: string): string | undefined {
  const codice = testo.trim().toUpperCase().split(/\s/)[0];
  return codiceInterventoValido(codice) ? codice : undefined;
}

/** Percorso del dettaglio dell'intervento. */
export function percorsoIntervento(codice: string): string {
  return PERCORSI.dettaglio.replace(':codice', encodeURIComponent(codice));
}

/** Percorso con i filtri nella query string (gli stessi in tutte le pagine del finanziario). */
export function conFiltri(percorso: string, filtri: Filtri): string {
  const query = ricercaDaFiltri(filtri);
  return query ? `${percorso}?${query}` : percorso;
}
