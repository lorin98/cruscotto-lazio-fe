// ControlloSigc — il controllo "Tutti | SIGC | NO SIGC" della barra dei filtri (revisioni del 31/10/2026, R01, F1-F3): un
// gruppo di tre bottoni con aria-pressed (l'interruttore del kit) che legge e scrive il parametro `sigc` dell'indirizzo,
// lasciando gli altri (i filtri della pagina) (la prima pagina delle tabelle la garantiscono le pagine con la chiave dei criteri). Ogni report lo legge dal suo
// indirizzo insieme agli altri criteri; il menu lo porta da una pagina e da un'area all'altra. Il cambio non sposta il
// focus (il bottone premuto resta al suo posto). Una pagina che scrive i criteri a modo suo (l'elenco operativo: replace, state
// della vista, bozza del debounce) lo controlla con valore e onCambia (review J-04): allora l'indirizzo non lo tocca qui.
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

/** Il controllo guidato dalla pagina: il valore e cosa fare alla scelta. */
export interface ControlloSigcGuidato {
  valore: ValoreSigc | undefined;
  onCambia: (valore: ValoreSigc | undefined) => void;
}

export function ControlloSigc({ guidato }: { guidato?: ControlloSigcGuidato }) {
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const scelta = DA_VALORE(guidato ? guidato.valore : sigcDaRicerca(search));
  const scegli = (s: Scelta) => {
    if (s === scelta) return;
    if (guidato) {
      guidato.onCambia(A_VALORE[s]);
      return;
    }
    const query = ricercaConSigc(search, A_VALORE[s]);
    void naviga(query ? `${pathname}?${query}` : pathname);
  };
  return <Interruttore etichetta="Interventi SIGC o NO SIGC" opzioni={OPZIONI} scelta={scelta} onScelta={scegli} className="ui-filtri__sigc" />;
}
