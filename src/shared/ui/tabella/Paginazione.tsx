// Paginazione — pagine di un elenco paginato dal SERVER (pattern interrogazione, ADR 0029): pagina corrente da 0, totale
// delle righe dell'insieme e dimensione dalla risposta. Bottoni con aria-current sulla pagina corrente, una finestra di
// pagine attorno a quella corrente, prima e ultima sempre raggiungibili; scelta di quante voci per pagina, dette col loro
// nome ("Domande per pagina", "Pagamenti per pagina": revisione del 04/11/2026, non "righe"); il totale al singolare o al
// plurale ("1 pagamento", "62.370 pagamenti": review step9 del 04/11/2026, J-17).
import { useId } from 'react';
import { DIMENSIONI_PAGINA, finestraPagine, formatNumber, maiuscolaIniziale, plurale } from '../../lib';

export function Paginazione({
  pagina,
  dimensione,
  totale,
  onPagina,
  onDimensione,
  unita,
}: {
  pagina: number;
  dimensione: number;
  totale: number;
  onPagina: (p: number) => void;
  onDimensione: (d: number) => void;
  /** ['pagamento', 'pagamenti']: cosa si conta, al singolare e al plurale (anche nell'etichetta della scelta per pagina). */
  unita: readonly [string, string];
}) {
  const id = useId();
  const pagine = Math.max(1, Math.ceil(totale / Math.max(1, dimensione)));
  const corrente = Math.min(pagina, pagine - 1);
  return (
    <nav className="ui-paginazione" aria-label="Pagine dei risultati">
      <span>{`Pagina ${formatNumber(corrente + 1)} di ${formatNumber(pagine)} - ${plurale(totale, unita[0], unita[1])}`}</span>
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
      <label htmlFor={`${id}-dim`}>{`${maiuscolaIniziale(unita[1])} per pagina`}</label>
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
