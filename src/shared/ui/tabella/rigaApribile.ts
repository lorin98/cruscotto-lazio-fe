// rigaApribile.ts — gestori della riga apribile (clic o Invio/Spazio) di TabellaInterattiva e TabellaServer. Un link o un
// pulsante dentro la riga vive di vita propria: la riga ignora i clic e i tasti che nascono da un suo controllo interno, cosi'
// il controllo non deve fermare la propagazione (fermarla romperebbe Esc e il focus trap dei pannelli che la contengono).
import type { KeyboardEvent, MouseEvent } from 'react';

const CONTROLLI = 'a,button,input,select,textarea,[role="button"],[role="link"]';

/** Vero se l'evento e' nato da un controllo interattivo DENTRO la riga (non dalla riga stessa). */
function daControlloInterno(e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>): boolean {
  if (e.target === e.currentTarget) return false;
  const controllo = e.target instanceof Element ? e.target.closest(CONTROLLI) : null;
  return controllo !== null && e.currentTarget.contains(controllo);
}

export function gestoriRigaApribile(apri: (() => void) | undefined) {
  if (!apri) return { onClick: undefined, onKeyDown: undefined };
  return {
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (!daControlloInterno(e)) apri();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      // i tasti dei controlli interni (Invio su un link, Esc, Tab) non riguardano la riga
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        apri();
      }
    },
  };
}
