// CardDistribuzioni — le card a barre orizzontali delle distribuzioni per stato (UI v2, wireframe panoramica e stati
// approvati), riusate da panoramica, pagine degli stati e dettaglio dell'intervento: CardStati (gli stati della domanda di
// sostegno o di pagamento, barre impilate delle rilasciate e delle non ancora rilasciate) e CardArea (lo stato area
// programmazione). Cosa fa il clic su una barra lo decide la pagina (la pagina degli stati, il filtro della tabella o
// della pagina, l'elenco operativo); col grant dell'elenco la vista Tabella e' la tabella equivalente con "Apri
// nell'elenco" per ogni voce che si apre e, nelle pagine degli stati, "Filtra la tabella": il percorso da tastiera del
// clic. PNG, CSV e XLSX: il PNG e' il grafico, CSV e
// XLSX l'export dell'intero report (scelta 7 approvata). CardGrafico del kit; nessun react-aria.
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { codiceDalClic } from '../../../shared/lib';
import { CardGrafico } from '../../../shared/ui';
import type { ClicGrafico, Scaricamento } from '../../../shared/ui';
import type { TestiLink } from '../lib/collegamenti';
import type { Distribuzione, TipoDomanda } from '../lib/dto';
import { graficoArea, graficoStati } from '../lib/grafici';
import { diTipo, vociDegliStati, vociDellArea } from '../lib/stati';
import type { VoceDistribuzione } from '../lib/stati';
import { TabellaVoci } from './comuni';

interface PropsCardDistribuzione {
  d: Distribuzione | undefined;
  titolo: string;
  sottotitolo?: string;
  fonte: string;
  /** Il clic su una barra, con la chiave della voce; assente = nessun clic. */
  onVoce?: (chiave: string) => void;
  /** Il link di ogni voce verso l'elenco; assente (senza il grant dell'elenco) la tabella equivalente generata. */
  link?: (v: VoceDistribuzione) => { indirizzo: string | null; testi: TestiLink };
  scaricamenti: Scaricamento[];
  oggettoDati: string;
  /** Il nome del PNG quando il titolo non dice l'intervento (le schede del dettaglio: "il grafico <titolo> di SRD01"). */
  oggettoPng?: string;
  strumenti?: ReactNode;
  livello?: 2 | 3;
}

/** Il clic su una barra con la chiave della voce (il codice del dato); fuori dai dati, niente. */
function daClic(onVoce: PropsCardDistribuzione['onVoce']): ((p: ClicGrafico) => void) | undefined {
  if (!onVoce) return undefined;
  return (p) => {
    const chiave = codiceDalClic(p);
    if (chiave) onVoce(chiave);
  };
}

/** La didascalia della tabella equivalente degli stati: cosa fanno le sue azioni. */
function captionStati(titolo: string, conLink: boolean, conFiltro: boolean): string {
  const azioni = [conFiltro && 'Filtra la tabella lascia nella tabella per intervento gli interventi con domande nella voce', conLink && "Apri nell'elenco apre le sole domande rilasciate della voce"].filter(Boolean);
  return [`${titolo}: la voce di SR-01 è l'intestazione di riga`, ...azioni].join('; ');
}

/**
 * Gli stati delle domande di sostegno o di pagamento: le voci di SR-01 e gli altri stati, col totale del backend. Con
 * `onFiltra` (le pagine degli stati) la tabella equivalente ha il filtro della tabella per intervento sulla voce, il
 * percorso da tastiera del clic, anche senza il grant dell'elenco.
 */
export function CardStati({ tipo, d, link, onVoce, onFiltra, ...card }: PropsCardDistribuzione & { tipo: TipoDomanda; onFiltra?: (chiave: string) => void }) {
  const intestazione = `Stato della domanda ${diTipo(tipo)}`;
  const voci = useMemo(() => vociDegliStati(d), [d]);
  const totale = useMemo(() => (d ? { domande: d.totale, nonRilasciate: d.domandeNonRilasciate } : undefined), [d]);
  const dati = useMemo(() => graficoStati(voci, { titolo: card.titolo, caption: card.titolo, voce: intestazione }, totale), [voci, card.titolo, intestazione, totale]);
  const caption = captionStati(card.titolo, !!link, !!onFiltra);
  const tabella = link || onFiltra ? <TabellaVoci caption={caption} intestazione={intestazione} voci={voci} conNonRilasciate link={link} onFiltra={onFiltra} totale={totale} /> : undefined;
  return <CardGrafico {...card} dati={dati} onClic={daClic(onVoce)} tabella={tabella} />;
}

/** Lo stato area programmazione: le dieci voci di RF025, gli stati osservati, le domande senza stato, col totale. */
export function CardArea({ d, link, onVoce, ...card }: PropsCardDistribuzione) {
  const voci = useMemo(() => vociDellArea(d), [d]);
  const dati = useMemo(() => graficoArea(voci, card.titolo, d?.totale), [voci, card.titolo, d]);
  const caption = `${card.titolo}: la voce è l'intestazione di riga; Apri nell'elenco apre le domande di quello stato`;
  const tabella = link ? <TabellaVoci caption={caption} intestazione="Stato area programmazione" voci={voci} conNonRilasciate={false} link={link} totale={d ? { domande: d.totale } : undefined} /> : undefined;
  return <CardGrafico {...card} dati={dati} onClic={daClic(onVoce)} tabella={tabella} />;
}
