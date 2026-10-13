// TabelleScheda — le tabelle delle schede della scheda della domanda (TX-0058): tabelle native di sola lettura con caption
// e th scope (Bootstrap Italia via le classi del kit), stato vuoto per scheda, importi assenti col motivo (mai zero). Le
// colonne sono quelle del wireframe approvato: visibili di partenza e "a scelta" dal bottone Colonne del kit (review v1
// V-02). La colonna del responsabile del procedimento dice perche' manca (OP-008: NON_ESPOSTO ai profili senza l'area
// procedurale). Il codice di una domanda collegata apre la sua scheda portando la ricerca di partenza (torna all'elenco).
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { conColonna, formatDate } from '../../../shared/lib';
import { SceltaColonne, Vuoto } from '../../../shared/ui';
import type { AnomaliaDellaDomanda, DeterminaDellaDomandaElenco, DomandaCollegata, PagamentoElenco, RecuperoDellaDomanda } from '../api';
import { percorsoDettaglio } from '../lib/collegamenti';
import type { StatoScheda } from '../lib/collegamenti';
import { cellaImporto, etichettaEsito, etichettaTipo, testoResponsabile } from '../lib/formato';

interface ColonnaScheda<T> {
  chiave: string;
  titolo: string;
  resa: (r: T) => ReactNode;
  /** Colonna a scelta: parte nascosta, l'utente la mostra da "Colonne". */
  nascosta?: boolean;
}

function Tabella<T>({ caption, colonne, righe, vuoto }: { caption: string; colonne: readonly ColonnaScheda<T>[]; righe: readonly T[]; vuoto: string }) {
  const [nascoste, setNascoste] = useState<ReadonlySet<string>>(() => new Set(colonne.filter((c) => c.nascosta).map((c) => c.chiave)));
  if (righe.length === 0) return <Vuoto>{vuoto}</Vuoto>;
  const visibili = colonne.filter((c) => !nascoste.has(c.chiave));
  const conScelta = colonne.some((c) => c.nascosta !== undefined);
  return (
    <>
      {conScelta && (
        <div className="ui-strumenti">
          <SceltaColonne
            colonne={colonne.map((c, k) => ({ chiave: c.chiave, titolo: c.titolo, fissa: k === 0 }))}
            nascoste={nascoste}
            onCambia={(k, v) => setNascoste((n) => conColonna(n, k, v))}
          />
        </div>
      )}
      <div className="ui-tabella-contenitore">
        <table className="ui-tabella">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {visibili.map((c) => (
                <th key={c.chiave} scope="col">
                  {c.titolo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {righe.map((r, k) => (
              // le liste della scheda non hanno un identificativo unico garantito: la posizione e' stabile (una lettura sola)
              <tr key={k}>
                {visibili.map((c, j) =>
                  j === 0 ? (
                    <th key={c.chiave} scope="row">
                      {c.resa(r)}
                    </th>
                  ) : (
                    <td key={c.chiave}>{c.resa(r)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
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

const COLONNE_DETERMINE: readonly ColonnaScheda<DeterminaDellaDomandaElenco>[] = [
  { chiave: 'codice', titolo: 'Determina', resa: (t) => t.codice ?? '' },
  { chiave: 'data', titolo: 'Data', resa: (t) => formatDate(t.data) },
  { chiave: 'stato', titolo: 'Stato area programmazione', resa: (t) => t.statoProgrammazione ?? 'senza stato' },
  { chiave: 'responsabile', titolo: 'Responsabile del procedimento', resa: (t) => testoResponsabile(t.responsabile) },
  { chiave: 'richiesto', titolo: 'Contributo richiesto', resa: (t) => cellaImporto(t.contributoRichiesto) },
  { chiave: 'ammesso', titolo: 'Contributo ammesso', resa: (t) => cellaImporto(t.contributoAmmesso) },
  { chiave: 'differenza', titolo: 'Differenza', resa: (t) => cellaImporto(t.deltaRichiestoAmmesso) },
  { chiave: 'ada', titolo: 'ADA', resa: (t) => t.ada ?? 'non indicata', nascosta: true },
  { chiave: 'provincia', titolo: 'Provincia', resa: (t) => t.provincia ?? 'non indicata', nascosta: true },
  { chiave: 'comparto', titolo: 'Comparto', resa: (t) => t.comparto ?? 'non indicato', nascosta: true },
  { chiave: 'spesa', titolo: 'Spesa imponibile', resa: (t) => cellaImporto(t.spesaImponibile), nascosta: true },
  { chiave: 'spesaAmmessa', titolo: 'Spesa imponibile ammessa', resa: (t) => cellaImporto(t.spesaImponibileAmmessa), nascosta: true },
];

export function TabellaDetermine({ determine }: { determine: DeterminaDellaDomandaElenco[] }) {
  return <Tabella caption="Determine della domanda (righe aperte, dalla più recente)" colonne={COLONNE_DETERMINE} righe={determine} vuoto="Nessuna determina per questa domanda." />;
}

/** Riga esclusa: i motivi di esclusione al posto degli importi (wireframe approvato); gli altri importi non si mostrano. */
const esclusa = (p: PagamentoElenco) => p.esito === 'ESCLUSA';
const importoDellaRiga = (valore: (p: PagamentoElenco) => PagamentoElenco['importoPagato']) => (p: PagamentoElenco) => (esclusa(p) ? '-' : cellaImporto(valore(p)));
const decretatoOMotivi = (p: PagamentoElenco) =>
  esclusa(p) ? `Motivi di esclusione: ${(p.motiviEsclusione ?? []).join(', ') || 'non indicati'}` : cellaImporto(p.importoDecretato);

const COLONNE_PAGAMENTI: readonly ColonnaScheda<PagamentoElenco>[] = [
  { chiave: 'decreto', titolo: 'Decreto', resa: (p) => p.decreto ?? '' },
  { chiave: 'data', titolo: 'Data di autorizzazione', resa: (p) => formatDate(p.dataAutorizzazione) },
  { chiave: 'esito', titolo: 'Esito', resa: (p) => etichettaEsito(p.esito) },
  { chiave: 'decretato', titolo: 'Decretato', resa: decretatoOMotivi },
  { chiave: 'pagato', titolo: 'Pagato', resa: importoDellaRiga((p) => p.importoPagato) },
  { chiave: 'feasr', titolo: 'Quota FEASR', resa: importoDellaRiga((p) => p.quotaFeasr) },
  { chiave: 'nazionale', titolo: 'Quota nazionale', resa: importoDellaRiga((p) => p.quotaNazionale) },
  { chiave: 'regionale', titolo: 'Quota regionale', resa: importoDellaRiga((p) => p.quotaRegionale) },
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
        { chiave: 'lordo', titolo: 'Importo lordo', resa: (r) => cellaImporto(r.importoLordo) },
        { chiave: 'liquidato', titolo: 'Importo liquidato', resa: (r) => cellaImporto(r.importoLiquidato) },
        { chiave: 'recuperato', titolo: 'Importo recuperato', resa: (r) => cellaImporto(r.importoRecuperato) },
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
