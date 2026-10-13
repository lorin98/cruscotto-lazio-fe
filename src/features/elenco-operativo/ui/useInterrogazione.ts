// useInterrogazione — la parte comune delle due pagine dell'interrogazione (domande e pagamenti): criteri nell'indirizzo,
// chip della barra (con le descrizioni dei valori di TX-0060 se il profilo li legge), pannello dei filtri, righe di
// contesto per l'intestazione dei PNG dei grafici (useRigheContesto: filtri, profilo, ultimo dato, NFR-50).
import { useMemo, useState } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { righeContesto } from '../../../shared/lib';
import type { UltimoDato } from '../../../shared/lib';
import type { ChipFiltro } from '../../../shared/ui';
import { useValoriFiltri } from '../api';
import { chipDeiCriteri } from '../lib/chip';
import { senzaFiltri, senzaValore } from '../lib/criteri';
import type { Elenco } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import { useCriteri } from './useCriteri';

export function useInterrogazione(elenco: Elenco) {
  const { criteri, applica } = useCriteri(elenco);
  const auth = useAuthStatus();
  const conFiltri = puoLeggere(auth.data, 'filtri');
  const valori = useValoriFiltri(conFiltri);
  const [aperto, setAperto] = useState(false);
  const chipLib = chipDeiCriteri(criteri, valori.data);
  const chip: ChipFiltro[] = chipLib.map((c) => ({
    chiave: `${c.nome}:${c.valore}`,
    etichetta: c.etichetta,
    valore: c.testo,
    onTogli: () => applica(senzaValore(criteri, c.nome, c.valore)),
  }));
  return {
    criteri,
    applica,
    auth: auth.data,
    chip,
    filtriApplicati: chipLib.map((c) => `${c.etichetta}: ${c.testo}`),
    togliTutti: () => applica(senzaFiltri(criteri)),
    pannello: { aperto, apri: conFiltri ? () => setAperto(true) : undefined, chiudi: () => setAperto(false) },
  };
}

/** Righe di contesto dei PNG: filtri applicati, profilo, ultimo dato della risposta che lo porta (sinottico, pagamenti). */
export function useRigheContesto(filtri: readonly string[], profilo: string | undefined, ultimi: readonly UltimoDato[] | undefined): readonly string[] {
  // chiave stabile per useMemo: i filtri cambiano identita' a ogni render
  const chiave = JSON.stringify(filtri);
  return useMemo(() => righeContesto({ filtri: JSON.parse(chiave) as string[], profilo, ultimi }), [chiave, profilo, ultimi]);
}
