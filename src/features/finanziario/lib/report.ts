// report.ts — catalogo delle pagine del finanziario (PURO, UI v2): unica fonte di percorsi, titoli e grant per il menu,
// l'impaginazione e la navigazione. Percorsi e grant sono quelli di src/app/route-table.json (un test li confronta). La
// visibilita' per grant e' solo UX (hide-by-role): l'enforcement resta del backend.
import { valoreFiltroValido } from './filtri';

export interface VoceReport {
  percorso: string;
  titolo: string;
  /** Grant VERBATIM dall'authz-catalog: basta uno dei grant per vedere la pagina (fine || coarse). */
  grant: string[];
}

/** Panoramica (cruscotto): ospita anche il pannello dei filtri (TX-0001) e l'ultimo dato sincronizzato. */
export const PANORAMICA: VoceReport = {
  percorso: '/finanziario',
  titolo: 'Panoramica',
  grant: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0009.read', 'csr.tx-0012.read', 'csr.tx-0013.read'],
};

/** Dettaglio dell'intervento: le transazioni dei report filtrate sull'intervento della route. */
export const DETTAGLIO_INTERVENTO: VoceReport = {
  percorso: '/finanziario/interventi/:codice',
  titolo: "Dettaglio dell'intervento",
  grant: ['csr.tx-0011.read', 'csr.tx-0002.read', 'csr.tx-0008.read', 'csr.tx-0010.read', 'csr.tx-0012.read', 'csr.tx-0013.read'],
};

export const REPORT_FINANZIARIO: VoceReport[] = [
  { percorso: '/finanziario/riepilogo', titolo: 'Riepilogo per intervento', grant: ['csr.tx-0011.read'] },
  { percorso: '/finanziario/dotazione', titolo: 'Dotazione e spesa per intervento', grant: ['csr.tx-0002.read', 'csr.tx-0003.read'] },
  {
    percorso: '/finanziario/avanzamento',
    titolo: 'Avanzamento finanziario',
    grant: ['csr.tx-0004.read', 'csr.tx-0005.read', 'csr.tx-0006.read', 'csr.tx-0007.read'],
  },
  {
    percorso: '/finanziario/domande',
    titolo: 'Domande e importi per anno',
    grant: ['csr.tx-0008.read', 'csr.tx-0009.read', 'csr.tx-0010.read'],
  },
  { percorso: '/finanziario/sigc', titolo: 'Domande e importi SIGC', grant: ['csr.tx-0012.read', 'csr.tx-0013.read'] },
  { percorso: '/finanziario/sigc/riserva', titolo: 'Riserva al 5% (SIGC)', grant: ['csr.tx-0014.read'] },
  { percorso: '/finanziario/sigc/verifica-smp', titolo: 'Verifica SMP (SIGC)', grant: ['csr.tx-0015.read'] },
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

/** Report (senza la panoramica) visibili per i grant dell'utente (gate di UX). */
export function reportVisibili(haGrant: (grant: string) => boolean): VoceReport[] {
  return REPORT_FINANZIARIO.filter((r) => r.grant.some(haGrant));
}

/** Titolo dell'h1: "Finanziario: " + titolo con la sola iniziale minuscola (le sigle restano maiuscole). */
export function titoloH1(titolo: string): string {
  return `Finanziario: ${titolo.charAt(0).toLowerCase()}${titolo.slice(1)}`;
}

/** Il codice della route di dettaglio e' un codice intervento valido (stesso formato del filtro). */
export function codiceInterventoValido(codice: string | null | undefined): codice is string {
  return !!codice && valoreFiltroValido('intervento', codice);
}

/** Percorso del dettaglio dell'intervento. */
export function percorsoIntervento(codice: string): string {
  return DETTAGLIO_INTERVENTO.percorso.replace(':codice', encodeURIComponent(codice));
}
