// ControlloSigc — il controllo "Tutti | SIGC | NO SIGC" della barra dei filtri (revisioni del 31/10/2026, R01, F1-F3): un
// gruppo di tre bottoni con aria-pressed (l'interruttore del kit) che legge e scrive il parametro `sigc` dell'indirizzo,
// lasciando gli altri (i filtri della pagina) e riportando la tabella alla prima pagina. Ogni report lo legge dal suo
// indirizzo insieme agli altri criteri; il menu lo porta da una pagina e da un'area all'altra. Il cambio non sposta il
// focus (il bottone premuto resta al suo posto).
import { useLocation, useNavigate } from 'react-router';
import { ricercaConSigc, sigcDaRicerca } from '../../lib';
import type { ValoreSigc } from '../../lib';
import { Interruttore } from '../card/Interruttore';

type Scelta = 'tutti' | 'sigc' | 'nosigc';

const OPZIONI = [
  { valore: 'tutti', etichetta: 'Tutti' },
  { valore: 'sigc', etichetta: 'SIGC' },
  { valore: 'nosigc', etichetta: 'NO SIGC' },
] as const;

const DA_VALORE = (v: ValoreSigc | undefined): Scelta => (v === undefined ? 'tutti' : v === 'true' ? 'sigc' : 'nosigc');
const A_VALORE: Record<Scelta, ValoreSigc | undefined> = { tutti: undefined, sigc: 'true', nosigc: 'false' };

export function ControlloSigc() {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const scelta = DA_VALORE(sigcDaRicerca(search));
  const scegli = (s: Scelta) => {
    if (s === scelta) return;
    const query = ricercaConSigc(search, A_VALORE[s]);
    void naviga(query ? `${pathname}?${query}` : pathname);
  };
  return <Interruttore etichetta="Interventi SIGC o NO SIGC" opzioni={OPZIONI} scelta={scelta} onScelta={scegli} className="ui-filtri__sigc" />;
}
