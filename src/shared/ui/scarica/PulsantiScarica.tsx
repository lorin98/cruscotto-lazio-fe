// PulsantiScarica — i download di una card o di una tabella (richiesta dell'utente del 09/10/2026): un pulsante per
// formato, con icona e sigla visibili (PNG, CSV, XLSX) e il nome accessibile completo ("Scarica il grafico X in PNG",
// che contiene la sigla visibile: WCAG 2.5.3). Un file alla volta: mentre si prepara i pulsanti sono disabilitati;
// l'esito si annuncia in role=status, l'errore resta visibile in un alert col motivo. CSV e XLSX vengono dal backend
// (D-08 e NFR-50: ogni esportazione registrata), il PNG e' l'immagine del grafico disegnata nel browser.
import { useState } from 'react';
import { getErrorMessage } from '../../lib';
import { Icona } from '../icona';
import type { NomeIcona } from '../icona';

export type FormatoScaricabile = 'PNG' | 'CSV' | 'XLSX';

export interface Scaricamento {
  formato: FormatoScaricabile;
  /** Prepara e salva il file; un errore (anche una Promise rifiutata) diventa l'avviso col motivo. */
  scarica: () => void | Promise<void>;
}

const ICONA: Record<FormatoScaricabile, NomeIcona> = { PNG: 'it-file-image', CSV: 'it-file-csv', XLSX: 'it-file-xlsx' };
// i messaggi per esteso: "Immagine" e' femminile, "File" maschile
const FILE: Record<FormatoScaricabile, { nome: string; fatto: string; mancato: string }> = {
  PNG: { nome: 'Immagine PNG', fatto: 'Immagine PNG scaricata.', mancato: 'Immagine PNG non scaricata.' },
  CSV: { nome: 'File CSV', fatto: 'File CSV scaricato.', mancato: 'File CSV non scaricato.' },
  XLSX: { nome: 'File XLSX', fatto: 'File XLSX scaricato.', mancato: 'File XLSX non scaricato.' },
};

type Stato = { formato: FormatoScaricabile; esito: 'in-corso' | 'fatto' } | { formato: FormatoScaricabile; esito: 'errore'; errore: unknown };

function testoStato(stato: Stato | null): string {
  if (stato?.esito === 'in-corso') return `${FILE[stato.formato].nome} in preparazione…`;
  if (stato?.esito === 'fatto') return FILE[stato.formato].fatto;
  return '';
}

/** `oggetto` completa "Scarica …": es. "il grafico Domande SIGC", "la tabella Riepilogo per intervento". */
export function PulsantiScarica({ oggetto, scaricamenti }: { oggetto: string; scaricamenti: readonly Scaricamento[] }) {
  const [stato, setStato] = useState<Stato | null>(null);
  if (scaricamenti.length === 0) return null;
  const avvia = async (s: Scaricamento) => {
    setStato({ formato: s.formato, esito: 'in-corso' });
    try {
      await s.scarica();
      setStato({ formato: s.formato, esito: 'fatto' });
    } catch (errore) {
      setStato({ formato: s.formato, esito: 'errore', errore });
    }
  };
  return (
    <>
      <div className="ui-scarica" role="group" aria-label={`Scarica ${oggetto}`}>
        {scaricamenti.map((s) => (
          <button
            key={s.formato}
            type="button"
            className="ui-scarica__pulsante"
            onClick={() => void avvia(s)}
            disabled={stato?.esito === 'in-corso'}
            aria-label={`Scarica ${oggetto} in ${s.formato}`}
            title={`Scarica in ${s.formato}`}
          >
            <Icona nome={ICONA[s.formato]} />
            <span aria-hidden="true">{s.formato}</span>
          </button>
        ))}
        <span role="status" aria-live="polite" className="visually-hidden">
          {testoStato(stato)}
        </span>
      </div>
      {stato?.esito === 'errore' && (
        <div className="alert alert-danger w-100 mb-0 py-2 small" role="alert">
          {`${FILE[stato.formato].mancato} ${getErrorMessage(stato.errore)}`}
        </div>
      )}
    </>
  );
}
