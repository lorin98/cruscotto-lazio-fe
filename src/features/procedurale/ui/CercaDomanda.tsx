// CercaDomanda — modulo di ricerca delle determine per codice a barre (flusso determine approvato, link cerca-domanda):
// form nativo bootstrap-italia con role=search, label esplicita, aiuto e messaggio d'errore collegati al campo
// (aria-describedby, aria-invalid, invalid-feedback in role=alert) e focus sul campo all'errore. Il codice si riduce alle
// sole cifre (lib/determine) e la ricerca porta alla stessa route col codice nel percorso; nessuna lettura da qui. Un
// errore che arriva da fuori (codice dell'indirizzo non valido, 400 DATO_NON_VALIDO del backend) si dice sotto il campo.
// Nessun primitivo react-aria: un campo e un bottone nativi bastano (niente combobox ne' autocompletamento).
import { useId, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { useNavigate } from 'react-router';
import { codiceDaCercare, percorsoDetermine } from '../lib/determine';

interface PropsCampo {
  id: string;
  campo: RefObject<HTMLInputElement | null>;
  testo: string;
  onTesto: (t: string) => void;
  /** Il messaggio d'errore sotto il campo, oppure null. */
  messaggio: string | null;
}

/** Il campo del codice con l'aiuto e, se c'e', l'errore collegati (aria-describedby, aria-invalid). */
function CampoCodice({ id, campo, testo, onTesto, messaggio }: PropsCampo) {
  return (
    <>
      <label className="form-label" htmlFor={id}>
        Codice a barre della domanda
      </label>
      <input
        ref={campo}
        id={id}
        className={messaggio ? 'form-control is-invalid' : 'form-control'}
        type="search"
        inputMode="numeric"
        value={testo}
        onChange={(e) => onTesto(e.target.value)}
        aria-describedby={messaggio ? `${id}-aiuto ${id}-errore` : `${id}-aiuto`}
        aria-invalid={messaggio ? true : undefined}
      />
      <p className="form-text" id={`${id}-aiuto`}>
        Contano solo le cifre, fino a 30: spazi e separatori si tolgono.
      </p>
      {messaggio && (
        <div className="invalid-feedback d-block" id={`${id}-errore`} role="alert">
          {messaggio}
        </div>
      )}
    </>
  );
}

/** `idCampo`: id del campo, per un link "Cerca un altro codice" della pagina che ci porta il focus. */
export function CercaDomanda({ codiceIniziale = '', erroreEsterno, idCampo }: { codiceIniziale?: string; erroreEsterno?: string; idCampo?: string }) {
  const generato = useId();
  const campo = useRef<HTMLInputElement>(null);
  const naviga = useNavigate();
  const [testo, setTesto] = useState(codiceIniziale);
  const [errore, setErrore] = useState<string | null>(null);
  const cerca = (e: FormEvent) => {
    e.preventDefault();
    const esito = codiceDaCercare(testo);
    if ('errore' in esito) {
      setErrore(esito.errore);
      campo.current?.focus();
      return;
    }
    setErrore(null);
    void naviga(percorsoDetermine(esito.codice));
  };
  return (
    <form role="search" aria-label="Cerca le determine di una domanda" onSubmit={cerca} noValidate>
      <CampoCodice id={idCampo ?? generato} campo={campo} testo={testo} onTesto={setTesto} messaggio={errore ?? erroreEsterno ?? null} />
      <button type="submit" className="btn btn-primary mt-2">
        Cerca
      </button>
    </form>
  );
}
