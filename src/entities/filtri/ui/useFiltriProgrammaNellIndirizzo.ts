// useFiltriProgrammaNellIndirizzo — la regola comune dei filtri del programma nell'indirizzo (report del finanziario,
// superfici del fisico): li legge dalla query string, li applica, li toglie uno per volta o tutti e prepara i chip della
// barra. Il filtro per azione portante senza il legame interventi - azioni (legameAzioniDisponibile falso: fonte non
// attiva, SC-FI_FILTRO_AZIONI_SENZA_LEGAME) non si applica e resta come chip con la spiegazione, cosi' il report non dice
// "nessun intervento" per un filtro che non puo' funzionare; finche' non si sa se il legame c'e' (profilo in caricamento,
// valori dei filtri in corso) un indirizzo con l'azione e' `inAttesa`: la pagina non legge con un filtro che forse non si
// applica (X-03). Senza il grant dei valori, o con la loro lettura in errore, il legame non si conosce e l'azione va al
// backend com'e'. Prima la regola era ricopiata nel finanziario e nel fisico (review del fisico H2): ogni feature passa la
// sua lettura dei valori (TX-0001, TX-0060) e la sua lettura e scrittura dell'indirizzo. Un report senza l'azione
// portante (il procedurale, RF024) lo dice con `senzaAzione`: la regola del legame non ha nulla da attendere ne' da
// togliere (review H3 del procedurale, prima un falso conValori). Poi la bozza del pannello.
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import type { ChipFiltro } from '../../../shared/ui';
import { AZIONE_NON_APPLICATA, senzaAzioneSeNonDisponibile } from '../lib/programma';
import type { ChiaveFiltro, Filtri, FiltroNellaBarra } from '../lib/programma';

/** La lettura dei valori dei filtri, quanto basta alla regola: il legame con le azioni portanti e l'errore. */
export interface LetturaValoriFiltri {
  data?: { legameAzioniDisponibile?: boolean } | undefined;
  isError: boolean;
}

interface ParametriComuni<C extends Filtri> {
  /** I criteri dalla query string corrente. */
  leggi: (search: string) => C;
  /** La query string dei criteri (senza "?"); riceve quella corrente (es. per conservare i parametri della pagina). */
  scrivi: (criteri: C, search: string) => string;
  /** I criteri attivi nell'ordine della barra. */
  attivi: (criteri: C) => FiltroNellaBarra<C>[];
  /** I criteri senza alcun filtro ("Togli tutti"). */
  nessuno: C;
}

/** Con l'azione portante: il grant e la lettura dei valori dei filtri della feature, che dicono il legame. */
interface ConAzione {
  senzaAzione?: false;
  /** Il profilo legge i valori dei filtri (il grant della lettura dei valori della feature). */
  conValori: boolean;
  valori: LetturaValoriFiltri;
}

/** Senza l'azione portante (il procedurale, RF024): nessun legame da conoscere, nessuna lettura dei valori da passare. */
interface SenzaAzione {
  senzaAzione: true;
  conValori?: never;
  valori?: never;
}

export type ParametriFiltriNellIndirizzo<C extends Filtri> = ParametriComuni<C> & (ConAzione | SenzaAzione);

/** Il legame non si conosce ancora (solo con l'azione portante): profilo in caricamento o valori dei filtri in corso. */
function legameIgnoto(profiloIgnoto: boolean, p: ConAzione): boolean {
  return profiloIgnoto || (p.conValori && p.valori.data === undefined && !p.valori.isError);
}

export function useFiltriProgrammaNellIndirizzo<C extends Filtri>(p: ParametriFiltriNellIndirizzo<C>) {
  const { leggi, scrivi, attivi, nessuno } = p;
  const { pathname, search } = useLocation();
  const naviga = useNavigate();
  const auth = useAuthStatus();
  // criteri stabili per indirizzo: chi li usa nei memo (es. i grafici descritti come dati) non ricalcola a ogni render
  const richiesti = useMemo(() => leggi(search), [leggi, search]);
  const legameAssente = !p.senzaAzione && p.valori.data?.legameAzioniDisponibile === false;
  // senza l'azione portante non si aspetta mai: i criteri non la portano
  const inAttesa = !p.senzaAzione && legameIgnoto(auth.data === undefined && !auth.isError, p) && (richiesti.azione ?? []).length > 0;
  const filtri: C = useMemo(() => (legameAssente ? senzaAzioneSeNonDisponibile(richiesti, false) : richiesti), [richiesti, legameAssente]);
  const applica = (c: C) => {
    const query = scrivi(c, search);
    void naviga(query ? `${pathname}?${query}` : pathname);
  };
  const chip: ChipFiltro[] = attivi(richiesti).map((a) => ({
    chiave: a.chiave,
    etichetta: a.etichetta,
    valore: legameAssente && a.dimensione === 'azione' ? `${a.valore} (${AZIONE_NON_APPLICATA})` : a.valore,
    onTogli: () => applica(a.senza),
  }));
  return { filtri, inAttesa, chip, applica, togliTutti: () => applica(nessuno) };
}

/**
 * La bozza del pannello dei filtri: all'apertura riparte dai criteri applicati (stato derivato dal prop, senza effetti);
 * `imposta` cambia una dimensione del programma (nessun valore = tolta). "Applica" la porta nell'indirizzo.
 */
export function useBozzaFiltri<C extends Filtri>(aperto: boolean, applicati: C) {
  const [bozza, setBozza] = useState<C>(applicati);
  const [apertoPrima, setApertoPrima] = useState(aperto);
  if (aperto !== apertoPrima) {
    setApertoPrima(aperto);
    if (aperto) setBozza(applicati);
  }
  const imposta = (k: ChiaveFiltro) => (v: string[]) => setBozza((b) => ({ ...b, [k]: v.length > 0 ? v : undefined }));
  return { bozza, setBozza, imposta };
}
