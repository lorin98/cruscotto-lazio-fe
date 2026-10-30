// comuni.tsx — mattoni di DOMINIO delle pagine procedurali (UI v2, wireframe approvati del 22/10/2026): la pill del
// perimetro della risposta (ADA in evidenza, non rimovibile), le tessere dei KPI di lib/kpi col link verso l'elenco (solo
// col grant di arrivo), un numero col suo link "Apri nell'elenco" nelle celle e nelle voci, e la tabella equivalente di
// una distribuzione per stato col link di ogni voce (la parte rilasciata, OP-PR-08) e, nelle pagine degli stati, il
// filtro della tabella per intervento sulla voce, l'assenza della voce senza fonte e il totale del backend, le celle
// delle domande ammesse e con atto di un intervento (tabella, tabella equivalente,
// anteprima). Classi bootstrap-italia e del kit; nessun react-aria.
import { ApriNellElenco } from '../../../entities/domanda';
import { AssenzaMotivata, BadgeAssenza, NON_DISPONIBILE_BREVE } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { Griglia, Kpi, TabellaStatica } from '../../../shared/ui';
import type { ColonnaStatica, NomeIcona, TonoKpi } from '../../../shared/ui';
import { VOCE_AMMESSA, apreConAtto, apreLeAmmesse, motivoSenzaLink, testiLinkAmmesse, testiLinkConAtto } from '../lib/collegamenti';
import type { IdLinkElenco, TestiLink } from '../lib/collegamenti';
import type { CriteriProcedurali } from '../lib/criteri';
import type { Perimetro, RigaAmmesse } from '../lib/dto';
import { pillPerimetro } from '../lib/formato';
import type { TipoPerimetro } from '../lib/formato';
import type { ChiaveKpi, KpiProcedurale } from '../lib/kpi';
import type { VoceDistribuzione } from '../lib/stati';
import { useLinkElenco } from './navigazione';

/** La pill del perimetro della barra, dalla risposta; niente finche' non e' arrivata. */
export function PillPerimetro({ perimetro, tipo }: { perimetro: Perimetro | undefined; tipo: TipoPerimetro }) {
  const testo = pillPerimetro(perimetro, tipo);
  if (!testo) return null;
  return <span className={perimetro === 'ADA' ? 'ui-pill ui-pill--evidenza' : 'ui-pill'}>{testo}</span>;
}

const ASPETTO: Readonly<Record<ChiaveKpi, { icona: NomeIcona; tono: TonoKpi }>> = {
  ammesse: { icona: 'it-check-circle', tono: 'verde' },
  conAtto: { icona: 'it-file-signed', tono: 'blu' },
  contributo: { icona: 'it-card', tono: 'scuro' },
  interventi: { icona: 'it-chart-line', tono: 'ambra' },
  domande: { icona: 'it-files', tono: 'blu' },
  nonRilasciate: { icona: 'it-clock', tono: 'ambra' },
};

/** Le tessere dei KPI, col link verso l'elenco del KPI che lo ha (solo col grant di TX-0056). */
export function TessereKpi({ kpi, criteri, colonne = 4 }: { kpi: readonly KpiProcedurale[]; criteri: CriteriProcedurali; colonne?: 2 | 4 }) {
  const link = useLinkElenco(criteri);
  return (
    <Griglia colonne={colonne}>
      {kpi.map((k) => (
        <Kpi key={k.chiave} etichetta={k.etichetta} valore={k.valore} assente={k.assente} nota={k.nota} {...ASPETTO[k.chiave]} azione={k.elenco && <ApriNellElenco indirizzo={link(k.elenco.id, k.elenco.punto)} descrizione={k.elenco.descrizione} />} />
      ))}
    </Griglia>
  );
}

/**
 * Un numero di domande in una cella, oppure "non disponibile" in breve se manca (voce senza fonte, distribuzione assente:
 * mai 0 ne' "-"). Una sola regola per le tabelle del procedurale (review H10).
 */
export function NumeroONonDisponibile({ n }: { n: number | null | undefined }) {
  return n == null ? <BadgeAssenza resa={NON_DISPONIBILE_BREVE} /> : <span className="font-monospace">{formatNumber(n)}</span>;
}

/** Un numero di domande col link verso l'elenco accanto (cella o voce), se c'e' l'indirizzo. */
function NumeroConLink({ n, indirizzo, testi }: { n: number; indirizzo: string | null; testi: TestiLink }) {
  return (
    <>
      <span className="font-monospace">{formatNumber(n)}</span>
      <ApriNellElenco variante="testo" indirizzo={indirizzo} {...testi} />
    </>
  );
}

/** Una riga della tabella di una distribuzione: una voce, oppure il totale del backend in fondo. */
type RigaVoci = { voce: VoceDistribuzione } | { totale: { domande: number; nonRilasciate?: number } };

/** Le domande della voce: il numero, oppure l'assenza col motivo (mai 0 per la voce senza fonte). */
function Domande({ r }: { r: RigaVoci }) {
  if ('totale' in r) return <span className="font-monospace">{formatNumber(r.totale.domande)}</span>;
  return r.voce.domande === null ? <AssenzaMotivata dato={r.voce.assenza} /> : <span className="font-monospace">{formatNumber(r.voce.domande)}</span>;
}

/** Il di cui non rilasciate: "non disponibile" in breve per la voce senza fonte (scelta 5 approvata). */
function NonRilasciate({ r }: { r: RigaVoci }) {
  return <NumeroONonDisponibile n={'totale' in r ? (r.totale.nonRilasciate ?? 0) : r.voce.nonRilasciate} />;
}

/** L'indirizzo della voce verso l'elenco (null = nessun link) e i testi del link. */
export type LinkDellaVoce = (v: VoceDistribuzione) => { indirizzo: string | null; testi: TestiLink };

interface PropsTabellaVoci {
  caption: string;
  intestazione: string;
  voci: readonly VoceDistribuzione[];
  /** La colonna "Di cui non rilasciate" (gli stati delle domande; l'area programmazione non ne ha). */
  conNonRilasciate: boolean;
  /** La colonna "Elenco operativo" col link di ogni voce; assente (senza il grant dell'elenco) la colonna non c'e'. */
  link?: LinkDellaVoce;
  /** La colonna col filtro della tabella per intervento sulla voce, il percorso da tastiera del clic su una barra. */
  onFiltra?: (chiave: string) => void;
  totale?: { domande: number; nonRilasciate?: number };
}

/** La cella dell'elenco operativo: il link della voce, oppure perche' non c'e' (il motivo di lib/collegamenti). */
function Elenco({ r, link, conNonRilasciate }: { r: RigaVoci; link: LinkDellaVoce; conNonRilasciate: boolean }) {
  if ('totale' in r) return null;
  const { indirizzo, testi } = link(r.voce);
  if (indirizzo) return <ApriNellElenco variante="testo" indirizzo={indirizzo} {...testi} />;
  return <span className="small">{motivoSenzaLink(r.voce, conNonRilasciate)}</span>;
}

/**
 * Il filtro della tabella per intervento sulla voce con domande (scelta 4 approvata, come il clic sulla sua barra); il
 * nome accessibile comincia col testo visibile e dice la voce (WCAG 2.5.3).
 */
function Filtra({ r, onFiltra }: { r: RigaVoci; onFiltra: (chiave: string) => void }) {
  if ('totale' in r || (r.voce.domande ?? 0) === 0) return null;
  const { chiave, etichetta } = r.voce;
  return (
    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onFiltra(chiave)} aria-label={`Filtra la tabella su ${etichetta}`}>
      Filtra la tabella
    </button>
  );
}

/** La tabella equivalente di una distribuzione con le azioni del clic su una barra: Apri nell'elenco, Filtra la tabella. */
export function TabellaVoci({ caption, intestazione, voci, conNonRilasciate, link, onFiltra, totale }: PropsTabellaVoci) {
  const colonne: ColonnaStatica<RigaVoci>[] = [
    { chiave: 'voce', titolo: intestazione, resa: (r) => ('totale' in r ? 'Totale' : r.voce.etichetta) },
    { chiave: 'domande', titolo: 'Domande', resa: (r) => <Domande r={r} />, numerica: true },
    ...(conNonRilasciate ? [{ chiave: 'nonRilasciate', titolo: 'Di cui non rilasciate', resa: (r: RigaVoci) => <NonRilasciate r={r} />, numerica: true }] : []),
    ...(onFiltra ? [{ chiave: 'filtra', titolo: 'Tabella per intervento', resa: (r: RigaVoci) => <Filtra r={r} onFiltra={onFiltra} /> }] : []),
    ...(link ? [{ chiave: 'elenco', titolo: 'Elenco operativo', resa: (r: RigaVoci) => <Elenco r={r} link={link} conNonRilasciate={conNonRilasciate} /> }] : []),
  ];
  const righe: RigaVoci[] = [...voci.map((voce) => ({ voce })), ...(totale ? [{ totale }] : [])];
  return <TabellaStatica caption={caption} colonne={colonne} righe={righe} chiaveRiga={(r) => ('totale' in r ? 'totale' : r.voce.chiave)} />;
}

export type LinkElenco = ReturnType<typeof useLinkElenco>;

/** Le domande ammesse della riga col link `id` verso l'elenco (stato che ammette AMMESSA, numero maggiore di 0). */
export function CellaAmmesse({ r, criteri, link, id = 'elenco-ammesse-riga' }: { r: RigaAmmesse; criteri: CriteriProcedurali; link: LinkElenco; id?: IdLinkElenco }) {
  const indirizzo = apreLeAmmesse(criteri, r.domandeAmmesse) ? link(id, { voceProgrammazione: VOCE_AMMESSA, intervento: r.codiceIntervento }) : null;
  return <NumeroConLink n={r.domandeAmmesse} indirizzo={indirizzo} testi={testiLinkAmmesse(r.domandeAmmesse, r.codiceIntervento)} />;
}

/** Le domande con atto della riga: il numero col link `id` con la fonte attiva, altrimenti l'assenza col motivo (mai 0). */
export function CellaConAtto({ r, link, id = 'elenco-con-atto-riga' }: { r: RigaAmmesse; link: LinkElenco; id?: IdLinkElenco }) {
  const n = r.conAttoConcessione.valore;
  if (n == null) return <AssenzaMotivata dato={r.conAttoConcessione} />;
  return <NumeroConLink n={n} indirizzo={apreConAtto(r.conAttoConcessione) ? link(id, { concessione: true, intervento: r.codiceIntervento }) : null} testi={testiLinkConAtto(n, r.codiceIntervento)} />;
}
