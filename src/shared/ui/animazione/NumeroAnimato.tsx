// NumeroAnimato — un numero che scorre fino al valore nuovo (card della Home, sinottici): l'animazione e' solo per gli
// occhi, i lettori di schermo leggono il valore finale e non ogni passo. Con prefers-reduced-motion, o dove il browser
// non lo dichiara (jsdom), il valore e' subito quello finale. Solo testo: nessuno stile inline (CSP style-src 'self').
import { useEffect, useRef, useState } from 'react';

const DURATA_MS = 700;

/** Vero se l'utente chiede meno movimento, o se il browser non sa dirlo: allora niente animazioni. */
export function movimentoRidotto(): boolean {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Il valore da mostrare istante per istante: dal precedente (0 alla prima resa) al nuovo, con un'uscita morbida. */
export function useValoreAnimato(valore: number, durata = DURATA_MS): number {
  const ridotto = movimentoRidotto();
  const [mostrato, setMostrato] = useState(0);
  const ultimo = useRef(0);
  useEffect(() => {
    if (ridotto || typeof requestAnimationFrame !== 'function') {
      ultimo.current = valore;
      return;
    }
    const inizio = ultimo.current;
    const delta = valore - inizio;
    if (delta === 0) return;
    const t0 = performance.now();
    let id = 0;
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / durata);
      const v = inizio + delta * (1 - (1 - p) ** 3);
      ultimo.current = v;
      setMostrato(v);
      if (p < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [valore, durata, ridotto]);
  return ridotto ? valore : mostrato;
}

export function NumeroAnimato({ valore, formato }: { valore: number; formato: (v: number) => string }) {
  const mostrato = useValoreAnimato(valore);
  if (mostrato === valore) return <>{formato(valore)}</>;
  return (
    <>
      <span aria-hidden="true">{formato(mostrato)}</span>
      <span className="visually-hidden">{formato(valore)}</span>
    </>
  );
}
