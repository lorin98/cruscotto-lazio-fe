// TabelleScheda — le tabelle delle schede della scheda della domanda (TX-0058): tabelle di sola lettura del kit
// (TabellaStatica: caption, th scope, importi allineati a destra con ui-num; review v2 H-03), stato vuoto per scheda,
// importi assenti col motivo (mai zero). Le colonne sono quelle del wireframe approvato: visibili di partenza e "a
// scelta" dal bottone Colonne del kit (review v1 V-02). La colonna del responsabile del procedimento dice perche' manca
// (OP-008: NON_ESPOSTO ai profili senza l'area procedurale). Il codice di una domanda collegata apre la sua scheda
// portando la ricerca di partenza (torna all'elenco). Sotto la scheda Determine il link determine-della-domanda verso
// l'area Procedurale (scelta S-3 b del 30/10/2026, OP-EO-07), anche con la scheda vuota, col tipo della scheda nello
// state della navigazione (decisione D1 del 30/10/2026).
import { Link } from 'react-router';
import type { ArrivoDallaScheda } from '../../../entities/domanda';
import { formatDate } from '../../../shared/lib';
import { TabellaStatica, Vuoto } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import type { AnomaliaDellaDomanda, DeterminaDellaDomandaElenco, DomandaCollegata, PagamentoElenco, RecuperoDellaDomanda } from '../api';
import { percorsoDettaglio } from '../lib/collegamenti';
import type { StatoScheda } from '../lib/collegamenti';
import { cellaImporto, etichettaEsito, etichettaTipo, testoResponsabile } from '../lib/formato';

// le liste della scheda non hanno un identificativo unico garantito: la posizione e' stabile (una lettura sola)
const perPosizione = (_: unknown, k: number) => String(k);

function Tabella<T>({ caption, colonne, righe, vuoto }: { caption: string; colonne: readonly ColonnaStatica<T>[]; righe: readonly T[]; vuoto: string }) {
  if (righe.length === 0) return <Vuoto>{vuoto}</Vuoto>;
  return <TabellaStatica caption={caption} colonne={colonne} righe={righe} chiaveRiga={perPosizione} />;
}

function CodiceCollegato({ c, ricerca }: { c: DomandaCollegata; ricerca: StatoScheda | undefined }) {
  const percorso = percorsoDettaglio(c.tipo, c.codiceABarre);
  return percorso ? (
    <Link to={percorso} state={ricerca}>
      {c.codiceABarre}
    </Link>
  ) : (
    <>{c.codiceABarre ?? ''}</>
  );
}

export function TabellaCollegate({ collegate, ricerca }: { collegate: DomandaCollegata[]; ricerca: StatoScheda | undefined }) {
  return (
    <Tabella<DomandaCollegata>
      caption="Domande collegate (per una domanda di pagamento la sua domanda di sostegno, per una di sostegno le sue domande di pagamento)"
      vuoto="Nessuna domanda collegata a questa domanda."
      righe={collegate}
      colonne={[
        { chiave: 'codice', titolo: 'Codice a barre', resa: (c) => <CodiceCollegato c={c} ricerca={ricerca} /> },
        { chiave: 'tipo', titolo: 'Tipo', resa: (c) => etichettaTipo(c.tipo) },
        { chiave: 'stato', titolo: 'Stato SIAN', resa: (c) => c.statoDescrizione ?? 'senza stato' },
      ]}
    />
  );
}

const COLONNE_DETERMINE: readonly ColonnaStatica<DeterminaDellaDomandaElenco>[] = [
  { chiave: 'codice', titolo: 'Determina', resa: (t) => t.codice ?? '' },
  { chiave: 'data', titolo: 'Data', resa: (t) => formatDate(t.data) },
  { chiave: 'stato', titolo: 'Stato area programmazione', resa: (t) => t.statoProgrammazione ?? 'senza stato' },
  { chiave: 'responsabile', titolo: 'Responsabile del procedimento', resa: (t) => testoResponsabile(t.responsabile) },
  { chiave: 'richiesto', titolo: 'Contributo richiesto', resa: (t) => cellaImporto(t.contributoRichiesto), numerica: true },
  { chiave: 'ammesso', titolo: 'Contributo ammesso', resa: (t) => cellaImporto(t.contributoAmmesso), numerica: true },
  { chiave: 'differenza', titolo: 'Differenza', resa: (t) => cellaImporto(t.deltaRichiestoAmmesso), numerica: true },
  { chiave: 'ada', titolo: 'ADA', resa: (t) => t.ada ?? 'non indicata', nascosta: true },
  { chiave: 'provincia', titolo: 'Provincia', resa: (t) => t.provincia ?? 'non indicata', nascosta: true },
  { chiave: 'comparto', titolo: 'Comparto', resa: (t) => t.comparto ?? 'non indicato', nascosta: true },
  { chiave: 'spesa', titolo: 'Spesa imponibile', resa: (t) => cellaImporto(t.spesaImponibile), numerica: true, nascosta: true },
  { chiave: 'spesaAmmessa', titolo: 'Spesa imponibile ammessa', resa: (t) => cellaImporto(t.spesaImponibileAmmessa), numerica: true, nascosta: true },
];

/**
 * La scheda Determine: la tabella (o il suo stato vuoto) e sotto il link determine-della-domanda, le determine della
 * domanda nell'area Procedurale. `determineDellaDomanda` e' l'indirizzo costruito da lib (percorsoDetermine: null senza il
 * grant csr.tx-0020.read, e allora nessun link: gate di UX). Il link resta anche con la scheda vuota (la pagina del
 * procedurale dice il motivo, wireframe approvato); il testo dice dove porta, area compresa (WCAG 2.4.4). `statoDetermine`
 * porta il tipo della scheda nello state della navigazione, mai nell'indirizzo (statoDetermine di lib, decisione D1).
 */
export function TabellaDetermine({
  determine,
  determineDellaDomanda,
  statoDetermine,
}: {
  determine: DeterminaDellaDomandaElenco[];
  determineDellaDomanda: string | null;
  statoDetermine: ArrivoDallaScheda | undefined;
}) {
  return (
    <>
      <Tabella caption="Determine della domanda (righe aperte, dalla più recente)" colonne={COLONNE_DETERMINE} righe={determine} vuoto="Nessuna determina per questa domanda." />
      {determineDellaDomanda && (
        <p className="mt-3 mb-0">
          <Link to={determineDellaDomanda} state={statoDetermine}>
            {"Apri le determine della domanda nell'area Procedurale"}
          </Link>
          {': la determina corrente e quella da cui vengono stato area programmazione e comparto.'}
        </p>
      )}
    </>
  );
}

/** Riga esclusa: i motivi di esclusione al posto degli importi (wireframe approvato); gli altri importi non si mostrano. */
const esclusa = (p: PagamentoElenco) => p.esito === 'ESCLUSA';
const importoDellaRiga = (valore: (p: PagamentoElenco) => PagamentoElenco['importoPagato']) => (p: PagamentoElenco) => (esclusa(p) ? '-' : cellaImporto(valore(p)));
const decretatoOMotivi = (p: PagamentoElenco) =>
  esclusa(p) ? `Motivi di esclusione: ${(p.motiviEsclusione ?? []).join(', ') || 'non indicati'}` : cellaImporto(p.importoDecretato);

const COLONNE_PAGAMENTI: readonly ColonnaStatica<PagamentoElenco>[] = [
  { chiave: 'decreto', titolo: 'Decreto', resa: (p) => p.decreto ?? '' },
  { chiave: 'data', titolo: 'Data di autorizzazione', resa: (p) => formatDate(p.dataAutorizzazione) },
  { chiave: 'esito', titolo: 'Esito', resa: (p) => etichettaEsito(p.esito) },
  { chiave: 'decretato', titolo: 'Decretato', resa: decretatoOMotivi, numerica: true },
  { chiave: 'pagato', titolo: 'Pagato', resa: importoDellaRiga((p) => p.importoPagato), numerica: true },
  { chiave: 'feasr', titolo: 'Quota FEASR', resa: importoDellaRiga((p) => p.quotaFeasr), numerica: true },
  { chiave: 'nazionale', titolo: 'Quota nazionale', resa: importoDellaRiga((p) => p.quotaNazionale), numerica: true },
  { chiave: 'regionale', titolo: 'Quota regionale', resa: importoDellaRiga((p) => p.quotaRegionale), numerica: true },
  { chiave: 'protocollo', titolo: 'Protocollo', resa: (p) => p.protocollo ?? 'non indicato', nascosta: true },
  { chiave: 'tipologiaElenco', titolo: 'Tipologia di elenco', resa: (p) => p.tipologiaElenco ?? 'non indicata', nascosta: true },
  { chiave: 'tipologiaPagamento', titolo: 'Tipologia di pagamento', resa: (p) => p.tipologiaPagamento ?? 'non indicata', nascosta: true },
];

export function TabellaPagamentiDomanda({ pagamenti }: { pagamenti: PagamentoElenco[] }) {
  return <Tabella caption="Righe correnti degli elenchi di liquidazione della domanda" colonne={COLONNE_PAGAMENTI} righe={pagamenti} vuoto="Nessuna riga negli elenchi di liquidazione per questa domanda." />;
}

export function TabellaRecuperi({ recuperi }: { recuperi: RecuperoDellaDomanda[] }) {
  return (
    <Tabella<RecuperoDellaDomanda>
      caption="Recuperi correnti della domanda"
      vuoto="Nessun recupero per questa domanda."
      righe={recuperi}
      colonne={[
        { chiave: 'decreto', titolo: 'Decreto', resa: (r) => r.decreto ?? '' },
        { chiave: 'lordo', titolo: 'Importo lordo', resa: (r) => cellaImporto(r.importoLordo), numerica: true },
        { chiave: 'liquidato', titolo: 'Importo liquidato', resa: (r) => cellaImporto(r.importoLiquidato), numerica: true },
        { chiave: 'recuperato', titolo: 'Importo recuperato', resa: (r) => cellaImporto(r.importoRecuperato), numerica: true },
      ]}
    />
  );
}

export function TabellaAnomalie({ anomalie }: { anomalie: AnomaliaDellaDomanda[] }) {
  return (
    <Tabella<AnomaliaDellaDomanda>
      caption="Anomalie presenti sulla domanda"
      vuoto="Nessuna anomalia presente per questa domanda."
      righe={anomalie}
      colonne={[
        { chiave: 'codice', titolo: 'Codice', resa: (a) => a.codice ?? '' },
        { chiave: 'descrizione', titolo: 'Descrizione', resa: (a) => a.descrizione ?? 'descrizione non disponibile' },
      ]}
    />
  );
}
