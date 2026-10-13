// Paginazione — pagine di un elenco paginato dal SERVER (pattern interrogazione, ADR 0029): pagina corrente da 0, totale
// delle righe dell'insieme e dimensione dalla risposta. Bottoni con aria-current sulla pagina corrente, una finestra di
// pagine attorno a quella corrente, prima e ultima sempre raggiungibili; scelta delle righe per pagina.
import { useId } from 'react';
import { DIMENSIONI_PAGINA, finestraPagine, formatNumber } from '../../lib';

export function Paginazione({
  pagina,
  dimensione,
  totale,
  onPagina,
  onDimensione,
  oggetto,
}: {
  pagina: number;
  dimensione: number;
  totale: number;
  onPagina: (p: number) => void;
  onDimensione: (d: number) => void;
  /** "domande", "righe di pagamento": cosa si conta. */
  oggetto: string;
}) {
  const id = useId();
  const pagine = Math.max(1, Math.ceil(totale / Math.max(1, dimensione)));
  const corrente = Math.min(pagina, pagine - 1);
  return (
    <nav className="ui-paginazione" aria-label="Pagine dei risultati">
      <span>{`Pagina ${formatNumber(corrente + 1)} di ${formatNumber(pagine)} - ${formatNumber(totale)} ${oggetto}`}</span>
      <button type="button" disabled={corrente === 0} onClick={() => onPagina(corrente - 1)} aria-label="Pagina precedente">
        ‹
      </button>
      {finestraPagine(corrente, pagine).map((p, k) =>
        p === null ? (
          <span key={`salto-${k}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button key={p} type="button" aria-current={p === corrente ? 'page' : undefined} aria-label={`Pagina ${p + 1}`} onClick={() => onPagina(p)}>
            {p + 1}
          </button>
        ),
      )}
      <button type="button" disabled={corrente >= pagine - 1} onClick={() => onPagina(corrente + 1)} aria-label="Pagina successiva">
        ›
      </button>
      <label htmlFor={`${id}-dim`}>Righe per pagina</label>
      <select id={`${id}-dim`} className="form-select form-select-sm w-auto" value={dimensione} onChange={(e) => onDimensione(Number(e.target.value))}>
        {DIMENSIONI_PAGINA.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </nav>
  );
}
