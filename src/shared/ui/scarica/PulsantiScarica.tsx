// PulsantiScarica — i download di una card o di una tabella (richiesta dell'utente del 09/10/2026): un pulsante per
// formato, con icona e sigla visibili (PNG, CSV, XLSX) e il nome accessibile completo ("Scarica il grafico X in PNG",
// che contiene la sigla visibile: WCAG 2.5.3). Un file alla volta: mentre si prepara i pulsanti sono aria-disabled e
// ignorano il clic, ma restano focalizzabili, cosi' il pulsante attivato tiene il focus (con `disabled` il browser lo
// manderebbe su BODY: review v3 A-02, WCAG 2.4.3). L'esito si annuncia in role=status, l'errore resta visibile in un
// alert col motivo. CSV e XLSX vengono dal backend (D-08 e NFR-50: ogni esportazione registrata), il PNG e' l'immagine
// del grafico disegnata nel browser, con l'intestazione di NFR-50 (OP-FE-08: non registrata in audit).
import { useState } from 'react';
import { getErrorMessage } from '../../lib';
import { Icona } from '../icona';
import type { NomeIcona } from '../icona';

export type FormatoScaricabile = 'PNG' | 'CSV' | 'XLSX';

export interface Scaricamento {
  formato: FormatoScaricabile;
  /** Prepara e salva il file; un errore (anche una Promise rifiutata) diventa l'avviso col motivo. */
  scarica: () => void | Promise<void>;
  /** Nome del file salvato: la card del grafico ne prende la base per il PNG (stesso nome dei dati, review v3 H-06). */
  file?: string;
  /** Messaggio d'errore proprio di questo file (es. oltre il limite di righe); null o assente = quello del problem-type. */
  messaggioErrore?: (errore: unknown) => string | null;
  /** Completa "Scarica …" nel nome di questo pulsante quando il file non e' cio' che dice il gruppo (es. i dati del report accanto al PNG del grafico); assente = l'oggetto del gruppo. */
  oggetto?: string;
}

const ICONA: Record<FormatoScaricabile, NomeIcona> = { PNG: 'it-file-image', CSV: 'it-file-csv', XLSX: 'it-file-xlsx' };
// i messaggi per esteso: "Immagine" e' femminile, "File" maschile
const FILE: Record<FormatoScaricabile, { nome: string; fatto: string; mancato: string }> = {
  PNG: { nome: 'Immagine PNG', fatto: 'Immagine PNG scaricata.', mancato: 'Immagine PNG non scaricata.' },
  CSV: { nome: 'File CSV', fatto: 'File CSV scaricato.', mancato: 'File CSV non scaricato.' },
  XLSX: { nome: 'File XLSX', fatto: 'File XLSX scaricato.', mancato: 'File XLSX non scaricato.' },
};

type Stato = { formato: FormatoScaricabile; esito: 'in-corso' | 'fatto' } | { formato: FormatoScaricabile; esito: 'errore'; messaggio: string };

function testoStato(stato: Stato | null): string {
  if (stato?.esito === 'in-corso') return `${FILE[stato.formato].nome} in preparazione…`;
  if (stato?.esito === 'fatto') return FILE[stato.formato].fatto;
  return '';
}

/** `oggetto` completa "Scarica …": es. "il grafico Domande SIGC", "la tabella Riepilogo per intervento". */
export function PulsantiScarica({ oggetto, scaricamenti }: { oggetto: string; scaricamenti: readonly Scaricamento[] }) {
  const [stato, setStato] = useState<Stato | null>(null);
  if (scaricamenti.length === 0) return null;
  const occupato = stato?.esito === 'in-corso';
  const avvia = async (s: Scaricamento) => {
    setStato({ formato: s.formato, esito: 'in-corso' });
    try {
      await s.scarica();
      setStato({ formato: s.formato, esito: 'fatto' });
    } catch (errore) {
      setStato({ formato: s.formato, esito: 'errore', messaggio: s.messaggioErrore?.(errore) ?? getErrorMessage(errore) });
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
            onClick={() => {
              if (!occupato) void avvia(s);
            }}
            aria-disabled={occupato || undefined}
            aria-label={`Scarica ${s.oggetto ?? oggetto} in ${s.formato}`}

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
          {`${FILE[stato.formato].mancato} ${stato.messaggio}`}
        </div>
      )}
    </>
  );
}
