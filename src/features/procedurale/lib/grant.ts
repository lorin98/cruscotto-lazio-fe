// grant.ts — grant VERBATIM dell'authz-catalog per le letture del procedurale e i predicati di visibilita' (PURO). Sono
// GATE DI UX (hide-by-role), MAI enforcement: il backend ridecide su ogni lettura (403 ACCESSO_NEGATO). Il predicato e'
// hasGrant: il grant e' fra i roles[] di /auth/status (come nel fisico, nell'istituzionale e nell'elenco operativo).
// Gli export hanno il grant della loro lettura (D-10 del backend).
import { GRANT_ELENCO } from '../../../entities/domanda';
import { hasGrant } from '../../../shared/api/auth/stato';
import type { AuthStatus } from '../../../shared/api/auth/stato';

export const GRANT = {
  /** TX-0024 (RF024): valori dei filtri del programma e pill "Dati al" di ogni pagina. */
  filtri: 'csr.tx-0024.read',
  /** TX-0025 (RF025): valori del filtro sullo stato area programmazione (pannello e chip). */
  statiArea: 'csr.tx-0025.read',
  /** TX-0026 (RF026): domande ammesse, con atto di concessione, importi, interventi attivati. */
  ammesse: 'csr.tx-0026.read',
  /** TX-0027 (RF027): stati delle domande di sostegno. */
  statiSostegno: 'csr.tx-0027.read',
  /** TX-0028 (RF028): stati delle domande di pagamento CSR-DP. */
  statiPagamento: 'csr.tx-0028.read',
  /** TX-0029 (RF029): riepilogo per intervento e stato area programmazione. */
  riepilogo: 'csr.tx-0029.read',
  /** TX-0030 (RF030): pagamenti per Unit Amount. */
  unitAmount: 'csr.tx-0030.read',
  /** TX-0031 (RF031): sottofasi di ammissibilita' della domanda di sostegno. */
  sottofasiSostegno: 'csr.tx-0031.read',
  /** TX-0032 (RF032): sottofasi di ammissibilita' della domanda di pagamento. */
  sottofasiPagamento: 'csr.tx-0032.read',
  /** TX-0056 dell'elenco operativo: destinazione dei link "Apri nell'elenco" (drill-down, OP-PR-08). */
  elencoDomande: GRANT_ELENCO.domande,
} as const;

export type Lettura = keyof typeof GRANT;

/** Il profilo puo' fare la lettura (stato assente = no: in caricamento non si mostra un link che porterebbe a un 403). */
export function puoLeggere(status: AuthStatus | undefined, lettura: Lettura): boolean {
  return hasGrant(status, GRANT[lettura]);
}
