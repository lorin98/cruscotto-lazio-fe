// CercaIntervento — ricerca di un intervento nella barra dell'applicazione (UI v2): suggerimenti dai valori di TX-0001,
// Invio su un codice valido apre il dettaglio dell'intervento. Senza il grant di TX-0001 non legge e non si mostra.
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { Icona } from '../../../shared/ui';
import { useFiltri } from '../api';
import { GRANT, codiceInterventoValido, percorsoIntervento } from '../lib/report';

export function CercaIntervento() {
  const id = useId();
  const naviga = useNavigate();
  const abilitato = hasGrant(useAuthStatus().data, GRANT.filtri);
  const { data } = useFiltri(abilitato);
  const [testo, setTesto] = useState('');
  const [errore, setErrore] = useState(false);
  if (!abilitato) return null;
  const voci = (data?.interventi ?? []).filter((v) => v.chiave);
  return (
    <form
      className="ui-cerca"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const scelto = testo.trim().toUpperCase().split(/\s/)[0];
        if (codiceInterventoValido(scelto) && voci.some((v) => v.chiave === scelto)) {
          setTesto('');
          setErrore(false);
          void naviga(percorsoIntervento(scelto));
        } else {
          setErrore(true);
        }
      }}
    >
      <Icona nome="it-search" />
      <label className="visually-hidden" htmlFor={`${id}-q`}>
        Cerca un intervento per codice
      </label>
      <input
        id={`${id}-q`}
        list={`${id}-elenco`}
        placeholder="Cerca un intervento (es. SRD01)"
        autoComplete="off"
        value={testo}
        aria-invalid={errore || undefined}
        aria-describedby={errore ? `${id}-errore` : undefined}
        onChange={(e) => {
          setTesto(e.target.value);
          setErrore(false);
        }}
      />
      <datalist id={`${id}-elenco`}>
        {voci.map((v) => (
          <option key={v.chiave} value={v.chiave ?? ''}>
            {v.descrizione ?? ''}
          </option>
        ))}
      </datalist>
      {errore && (
        <span id={`${id}-errore`} className="ui-cerca__errore" role="alert">
          Codice non trovato
        </span>
      )}
    </form>
  );
}
