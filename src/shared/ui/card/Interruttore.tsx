// Interruttore — gruppo di bottoni a scelta singola con aria-pressed (ADR 0027): la vista Grafico | Tabella di ogni card e
// di una pagina (InterruttoreVista) e la misura mostrata negli anni dell'output regionale dell'istituzionale (Programmato |
// Realizzato SIGC | Realizzato non SIGC). Un solo componente per il controllo segmentato; il cambio non sposta il focus
// (il bottone premuto resta al suo posto). Bottoni HTML nativi, nessun react-aria.
export interface OpzioneInterruttore<T extends string> {
  valore: T;
  etichetta: string;
}

interface PropsInterruttore<T extends string> {
  /** Il nome del gruppo per i lettori di schermo. */
  etichetta: string;
  opzioni: readonly OpzioneInterruttore<T>[];
  scelta: T;
  onScelta: (v: T) => void;
  /** Classi in piu' (es. il margine). */
  className?: string;
}

export function Interruttore<T extends string>({ etichetta, opzioni, scelta, onScelta, className }: PropsInterruttore<T>) {
  return (
    <div className={className ? `ui-seg ${className}` : 'ui-seg'} role="group" aria-label={etichetta}>
      {opzioni.map((o) => (
        <button key={o.valore} type="button" aria-pressed={o.valore === scelta} onClick={() => onScelta(o.valore)}>
          {o.etichetta}
        </button>
      ))}
    </div>
  );
}
