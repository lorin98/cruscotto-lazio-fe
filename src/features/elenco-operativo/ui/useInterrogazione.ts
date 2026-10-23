// useInterrogazione — la parte comune delle due pagine dell'interrogazione (domande e pagamenti): criteri nell'indirizzo con
// la bozza del debounce (useCriteri), chip della barra (con le descrizioni dei valori di TX-0060 se il profilo li legge),
// pannello dei filtri, i filtri applicati in parole per le righe di contesto dell'intestazione dei PNG dei grafici (NFR-50),
// che le pagine compongono con useRigheContesto del kit e il perimetro in parole dell'elenco (testoPerimetro: "ADA del
// tuo profilo"; prima una copia qui, review H1 dell'istituzionale v1 iter2). I valori dei filtri (TX-0060) si leggono UNA
// volta, qui, e solo col loro grant: il pannello li riceve e senza il grant resta apribile con la sola ricerca per testo
// (review v1 A-06).
import { useState } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { ChipFiltro } from '../../../shared/ui';
import { useValoriFiltri } from '../api';
import { chipDeiCriteri } from '../lib/chip';
import { senzaFiltri, senzaValore } from '../lib/criteri';
import type { Elenco } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import { useCriteri } from './useCriteri';

export function useInterrogazione(elenco: Elenco) {
  const { criteri, criteriScritti, criteriVisti, inAttesa, applica, applicaRitardato, ritira, scarica } = useCriteri(elenco);
  const auth = useAuthStatus();
  const conFiltri = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conFiltri);
  const [aperto, setAperto] = useState(false);
  const chipLib = chipDeiCriteri(criteriVisti, valori.data);
  const chip: ChipFiltro[] = chipLib.map((c) => ({
    chiave: `${c.nome}:${c.valore}`,
    etichetta: c.etichetta,
    valore: c.testo,
    onTogli: () => applica(senzaValore(criteriVisti, c.nome, c.valore)),
  }));
  return {
    criteri,
    criteriScritti,
    criteriVisti,
    inAttesa,
    applica,
    applicaRitardato,
    ritira,
    auth: auth.data,
    chip,
    filtriApplicati: chipDeiCriteri(criteri, valori.data).map((c) => `${c.etichetta}: ${c.testo}`),
    togliTutti: () => applica(senzaFiltri(criteriVisti)),
    valori: conFiltri ? valori : null,
    pannello: {
      aperto,
      apri: () => setAperto(true),
      // chiudere il pannello scrive subito la bozza in attesa (review v1 H-12)
      chiudi: () => {
        scarica();
        setAperto(false);
      },
    },
  };
}
