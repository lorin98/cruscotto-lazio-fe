// useAnnoNellIndirizzo — un anno della pagina nell'indirizzo (?anno=, ?esercizio=): l'anno della riserva e l'esercizio
// della verifica SMP del finanziario, l'anno di riferimento del file della verifica SMP non SIGC e del dettaglio
// dell'intervento dell'istituzionale. Un valore non valido (non un intero 2000-2100) vale "non scelto"; la scelta
// sostituisce la voce di cronologia (niente una voce per anno) e lascia gli altri parametri (i filtri). Prima stava nel
// finanziario.
import { useSearchParams } from 'react-router';
import { isAnnoValido } from '../lib';

export function useAnnoNellIndirizzo(chiave: string): [number | undefined, (anno: number | undefined) => void] {
  const [parametri, impostaParametri] = useSearchParams();
  const n = Number(parametri.get(chiave));
  const anno = isAnnoValido(n) ? n : undefined;
  const imposta = (nuovo: number | undefined) => {
    const p = new URLSearchParams(parametri);
    if (nuovo === undefined) p.delete(chiave);
    else p.set(chiave, String(nuovo));
    impostaParametri(p, { replace: true });
  };
  return [anno, imposta];
}
