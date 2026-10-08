// report.ts — catalogo dei report del finanziario (PURO): unica fonte di percorsi, titoli e grant per la pagina dei
// filtri, il widget di impaginazione e la navigazione. Percorsi e grant sono quelli di src/app/route-table.json (un
// test li confronta). La visibilita' per grant e' solo UX (hide-by-role): l'enforcement resta del backend.

export interface VoceReport {
  percorso: string;
  titolo: string;
  /** Grant VERBATIM dall'authz-catalog: basta uno dei grant per vedere la pagina (fine || coarse). */
  grant: string[];
}

export const PAGINA_FILTRI: VoceReport = { percorso: '/finanziario', titolo: 'Filtri dei report', grant: ['csr.tx-0001.read'] };

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

export function voceDi(percorso: string): VoceReport | undefined {
  return percorso === PAGINA_FILTRI.percorso ? PAGINA_FILTRI : REPORT_FINANZIARIO.find((r) => r.percorso === percorso);
}

/** Report visibili per i grant dell'utente (gate di UX). */
export function reportVisibili(haGrant: (grant: string) => boolean): VoceReport[] {
  return REPORT_FINANZIARIO.filter((r) => r.grant.some(haGrant));
}

/** Titolo dell'h1: "Finanziario: " + titolo con la sola iniziale minuscola (le sigle restano maiuscole). */
export function titoloH1(titolo: string): string {
  return `Finanziario: ${titolo.charAt(0).toLowerCase()}${titolo.slice(1)}`;
}

// Parametri di pagina che, oltre ai filtri, un report porta nell'indirizzo e che vanno conservati tornandoci.
const PARAMETRI_DI_PAGINA = ['anno', 'esercizio'] as const;

/**
 * Indirizzo di ritorno al report d'origine dopo "Modifica filtri" (parametro `da`): solo un percorso del catalogo,
 * con i soli parametri di pagina anno/esercizio interi; tutto il resto e' scartato (niente open-redirect).
 */
export function ritornoValido(da: string | null | undefined): { percorso: string; parametri: URLSearchParams } | undefined {
  if (!da || !da.startsWith('/')) return undefined;
  const [percorso, query = ''] = da.split('?', 2);
  if (!REPORT_FINANZIARIO.some((r) => r.percorso === percorso)) return undefined;
  const sorgente = new URLSearchParams(query);
  const parametri = new URLSearchParams();
  for (const k of PARAMETRI_DI_PAGINA) {
    const v = sorgente.get(k);
    if (v && /^[0-9]{4}$/.test(v)) parametri.set(k, v);
  }
  return { percorso, parametri };
}

/** Valore del parametro `da` per tornare al percorso corrente con i suoi parametri di pagina. */
export function daPer(percorso: string, ricerca: string): string {
  const p = new URLSearchParams(ricerca);
  const tenuti = new URLSearchParams();
  for (const k of PARAMETRI_DI_PAGINA) {
    const v = p.get(k);
    if (v) tenuti.set(k, v);
  }
  const q = tenuti.toString();
  return q ? `${percorso}?${q}` : percorso;
}
