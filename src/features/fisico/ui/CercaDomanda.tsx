// CercaDomanda — modulo di ricerca delle determine per codice a barre (flusso determine approvato, link cerca-domanda):
// form nativo bootstrap-italia con role=search, label esplicita, aiuto e messaggio d'errore collegati al campo
// (aria-describedby, aria-invalid, invalid-feedback in role=alert) e focus sul campo all'errore. Il codice si riduce alle
// sole cifre (lib/determine) e la ricerca porta alla stessa route col codice nel percorso; nessuna lettura da qui. Un
// errore che arriva da fuori (codice dell'indirizzo non valido, 400 DATO_NON_VALIDO del backend) si dice sotto il campo.
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { codiceDaCercare, percorsoDetermine } from '../lib/determine';

/** `idCampo`: id del campo, per un link "Cerca un altro codice" della pagina che ci porta il focus. */
export function CercaDomanda({ codiceIniziale = '', erroreEsterno, idCampo }: { codiceIniziale?: string; erroreEsterno?: string; idCampo?: string }) {
  const generato = useId();
  const id = idCampo ?? generato;
  const campo = useRef<HTMLInputElement>(null);
  const naviga = useNavigate();
  const [testo, setTesto] = useState(codiceIniziale);
  const [errore, setErrore] = useState<string | null>(null);
  const messaggio = errore ?? erroreEsterno ?? null;
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
  const descrizione = messaggio ? `${id}-aiuto ${id}-errore` : `${id}-aiuto`;
  return (
    <form role="search" aria-label="Cerca le determine di una domanda" onSubmit={cerca} noValidate>
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
        onChange={(e) => setTesto(e.target.value)}
        aria-describedby={descrizione}
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
      <button type="submit" className="btn btn-primary mt-2">
        Cerca
      </button>
    </form>
  );
}
