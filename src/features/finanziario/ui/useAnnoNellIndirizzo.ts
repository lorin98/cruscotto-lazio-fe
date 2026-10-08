// useAnnoNellIndirizzo — anno della riserva (?anno=) o esercizio della verifica SMP (?esercizio=) nell'indirizzo della
// pagina: un valore non valido vale "non scelto"; la scelta sostituisce la voce di cronologia (niente una voce per anno).
import { useSearchParams } from 'react-router';
import { isAnnoValido } from '../lib/filtri';

export function useAnnoNellIndirizzo(chiave: 'anno' | 'esercizio'): [number | undefined, (anno: number | undefined) => void] {
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
