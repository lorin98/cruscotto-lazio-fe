// comuni.tsx — mattoni di DOMINIO dei report istituzionali (UI v2, wireframe approvati del 22/10/2026): lo stato "valori
// dei filtri non disponibili" della pagina (TX-0060 in errore: role=status col motivo e Riprova, i chip dell'indirizzo
// restano e il report si legge lo stesso), la resa di un dato della verifica SMP non SIGC (il valore, oppure l'assenza
// col motivo in badge: mai uno 0 o un "no" inventati) col suo link verso l'elenco operativo. Le righe di contesto del PNG
// dei grafici (NFR-50) sono quelle del kit (useRigheContesto). Classi bootstrap-italia e del kit; nessun react-aria.
import type { RefObject } from 'react';
import { ApriNellElenco } from '../../../entities/domanda';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { formatNumber, getErrorMessage } from '../../../shared/lib';
import { useFocusSeSparisce } from '../../../shared/ui';
import type { StatoQuery } from '../../../shared/ui';
import type { ValoriFiltriElenco } from '../api';
import type { RigaVerifica } from '../lib/dto';
import { TESTI_LINK, indirizzoDelDato, testoValore } from '../lib/verifica';
import type { DatoVerifica, LinkDato } from '../lib/verifica';

/**
 * TX-0060 in errore (col grant): lo stato in role=status col messaggio del problem-type e "Riprova". Riuscito il nuovo
 * tentativo lo stato sparisce col suo bottone: il focus va sul titolo della pagina (WCAG 2.4.3, useFocusSeSparisce del kit).
 */
export function ValoriNonDisponibili({ valori, h1 }: { valori: StatoQuery<ValoriFiltriElenco> | null; h1: RefObject<HTMLHeadingElement | null> }) {
  const inErrore = valori !== null && valori.isError && valori.data === undefined;
  useFocusSeSparisce(inErrore, h1);
  if (!inErrore) return null;
  return (
    <div className="alert alert-warning my-3" role="status">
      <span className="me-2">{`Valori dei filtri non disponibili: ${getErrorMessage(valori.error)} I filtri dell'indirizzo restano applicati come chip rimovibili e il report si legge lo stesso.`}</span>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => void valori.refetch()}>
        Riprova
      </button>
    </div>
  );
}

const monospace = (testo: string) => <span className="font-monospace">{testo}</span>;

/** Il valore di un dato della verifica: un conteggio sempre valorizzato, un importo, o un dato col motivo dell'assenza. */
export function ValoreDelDato({ r, d, unita }: { r: RigaVerifica; d: DatoVerifica; unita?: string | null }) {
  const v = r[d.campo];
  if (typeof v === 'number') return monospace(formatNumber(v));
  if (d.tipo === 'importo') return <ValoreImporto importo={v as DatoMotivatoLike<number>} />;
  return <ValoreMotivato dato={v} resa={(x: number | string | boolean) => testoValore(d.tipo, x, unita)} />;
}

/** La cella (o la voce) di un dato: il valore e, per domande ricevute e spesa erogata, il link verso l'elenco (OP-IS-09). */
export function CellaDato({ r, d, unita, puo }: { r: RigaVerifica; d: DatoVerifica; unita?: string | null; puo: (l: LinkDato) => boolean }) {
  const indirizzo = indirizzoDelDato(r, d, puo);
  return (
    <>
      <ValoreDelDato r={r} d={d} unita={unita} />
      {indirizzo && d.link && <ApriNellElenco variante="testo" indirizzo={indirizzo} {...TESTI_LINK[d.link](r.codiceIntervento)} />}
    </>
  );
}
