// comuni.tsx — mattoni di DOMINIO dei report istituzionali (UI v2, wireframe approvati del 22/10/2026): la resa di un dato
// della verifica SMP non SIGC (il valore, oppure l'assenza col motivo in badge: mai uno 0 o un "no" inventati) col suo
// link verso l'elenco operativo. Lo stato "valori dei filtri non disponibili" della pagina e' quello comune di
// entities/filtri (ValoriFiltriNonDisponibili, nato qui), le righe di contesto del PNG dei grafici (NFR-50) quelle del kit
// (useRigheContesto). Classi bootstrap-italia e del kit; nessun react-aria.
import { ApriNellElenco } from '../../../entities/domanda';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import type { RigaVerifica } from '../lib/dto';
import { TESTI_LINK, indirizzoDelDato, testoValore } from '../lib/verifica';
import type { DatoVerifica, LinkDato } from '../lib/verifica';

const monospace = (testo: string) => <span className="font-monospace">{testo}</span>;

/**
 * Il valore di un dato della verifica: un conteggio sempre valorizzato, un importo, o un dato col motivo dell'assenza; una
 * quantita' col codice dell'indicatore accanto quando chi la rende lo da' (voci del dettaglio, OP-IS-12).
 */
export function ValoreDelDato({ r, d, indicatore }: { r: RigaVerifica; d: DatoVerifica; indicatore?: string | null }) {
  const v = r[d.campo];
  if (typeof v === 'number') return monospace(formatNumber(v));
  if (d.tipo === 'importo') return <ValoreImporto importo={v as DatoMotivatoLike<number>} />;
  return <ValoreMotivato dato={v} resa={(x: number | string | boolean) => testoValore(d.tipo, x, indicatore)} />;
}

/** La cella (o la voce) di un dato: il valore e, per domande ricevute e spesa erogata, il link verso l'elenco (OP-IS-09). */
export function CellaDato({ r, d, indicatore, puo }: { r: RigaVerifica; d: DatoVerifica; indicatore?: string | null; puo: (l: LinkDato) => boolean }) {
  const indirizzo = indirizzoDelDato(r, d, puo);
  return (
    <>
      <ValoreDelDato r={r} d={d} indicatore={indicatore} />
      {indirizzo && d.link && <ApriNellElenco variante="testo" indirizzo={indirizzo} {...TESTI_LINK[d.link](r.codiceIntervento)} />}
    </>
  );
}
