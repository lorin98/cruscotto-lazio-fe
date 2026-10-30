// comuni.tsx — mattoni di DOMINIO dei report istituzionali (UI v2, wireframe approvati del 22/10 e del 30/10/2026): la
// resa di un dato della verifica SMP non SIGC (il valore, oppure l'assenza col motivo in badge: mai uno 0 o un "no"
// inventati) col suo link verso l'elenco operativo, e quella di un dato della verifica SMP SIGC (tabella della pagina e
// scheda SIGC del dettaglio, stesse regole). Lo stato "valori dei filtri non disponibili" della pagina e' quello comune di
// entities/filtri (ValoriFiltriNonDisponibili, nato qui), le righe di contesto del PNG dei grafici (NFR-50) quelle del kit
// (useRigheContesto). Classi bootstrap-italia e del kit; nessun react-aria.
import { ApriNellElenco } from '../../../entities/domanda';
import { ValoreImporto, ValoreMotivato } from '../../../entities/importo';
import type { DatoMotivatoLike } from '../../../entities/importo';
import { NON_DISPONIBILE, formatNumber, numeroOpzionale, testoOpzionale } from '../../../shared/lib';
import type { RigaVerifica, RigaVerificaSigc } from '../lib/dto';
import { quantitaConIndicatore, siNo } from '../lib/formato';
import { TESTI_LINK, indirizzoDelDato, testoValore } from '../lib/verifica';
import type { DatoVerifica, LinkDato } from '../lib/verifica';
import type { DatoVerificaSigc } from '../lib/verificaSigc';

const monospace = (testo: string) => <span className="font-monospace">{testo}</span>;

/** Conteggio (numero di domande): il backend non lo rende null; un assente resta "-" del formattatore. */
export function Numero({ valore }: { valore: number | null | undefined }) {
  return monospace(formatNumber(valore));
}

const numero = (v: number) => <Numero valore={v} />;

/**
 * Il valore di un dato della verifica SMP SIGC (TX-0015): conteggi e importi, i dati col motivo dell'assenza
 * (ConteggioFinanziario, SiNoFinanziario: D3, D15, D-11 del backend) resi come quella di un importo, i campi facoltativi
 * senza motivo "non disponibile"; una quantita' di output col codice dell'indicatore accanto quando chi la rende lo da'
 * (voci del dettaglio, OP-IS-12). Mai uno 0 o un "no" inventati. Le conversioni del valore per tipo sono garantite dalla
 * tabella DATI_VERIFICA_SIGC, tipizzata per campo: un tipo che non e' quello del campo non compila (review IST-05).
 */
export function ValoreDelDatoSigc({ r, d, indicatore }: { r: RigaVerificaSigc; d: DatoVerificaSigc; indicatore?: string | null }) {
  const v = r[d.campo];
  switch (d.tipo) {
    case 'conteggioMotivato':
      return <ValoreMotivato dato={v as DatoMotivatoLike<number> | undefined} resa={numero} />;
    case 'conteggio':
      return <Numero valore={v as number | undefined} />;
    case 'importo':
      return <ValoreImporto importo={v as DatoMotivatoLike<number> | undefined} />;
    case 'siNo':
      return <ValoreMotivato dato={v as DatoMotivatoLike<boolean> | undefined} resa={siNo} />;
    case 'quantita':
      return <>{typeof v === 'number' ? quantitaConIndicatore(v, indicatore) : NON_DISPONIBILE}</>;
    case 'numero':
      return <>{numeroOpzionale(v as number | null | undefined)}</>;
    default:
      return <>{testoOpzionale(v as string | null | undefined)}</>;
  }
}

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
