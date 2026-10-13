// TabelleScheda — le tabelle delle schede della scheda della domanda (TX-0058): tabelle native di sola lettura con caption
// e th scope (Bootstrap Italia via le classi del kit), stato vuoto per scheda, importi assenti col motivo (mai zero). La
// colonna del responsabile del procedimento dice perche' manca (OP-008: NON_ESPOSTO ai profili senza l'area procedurale).
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDate } from '../../../shared/lib';
import { Vuoto } from '../../../shared/ui';
import type { AnomaliaDellaDomanda, DeterminaDellaDomandaElenco, DomandaCollegata, PagamentoElenco, RecuperoDellaDomanda } from '../api';
import { percorsoDettaglio } from '../lib/collegamenti';
import { cellaImporto, etichettaEsito, etichettaTipo, testoResponsabile } from '../lib/formato';

function Tabella({ caption, intestazioni, righe, vuoto }: { caption: string; intestazioni: string[]; righe: ReactNode[][]; vuoto: string }) {
  if (righe.length === 0) return <Vuoto>{vuoto}</Vuoto>;
  return (
    <div className="ui-tabella-contenitore">
      <table className="ui-tabella">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {intestazioni.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, k) => (
            // le liste della scheda non hanno un identificativo unico garantito: la posizione e' stabile (una lettura sola)
            <tr key={k}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodiceCollegato({ c }: { c: DomandaCollegata }) {
  const percorso = percorsoDettaglio(c.tipo, c.codiceABarre);
  return percorso ? <Link to={percorso}>{c.codiceABarre}</Link> : <>{c.codiceABarre ?? ''}</>;
}

export function TabellaCollegate({ collegate }: { collegate: DomandaCollegata[] }) {
  return (
    <Tabella
      caption="Domande collegate (per una domanda di pagamento la sua domanda di sostegno, per una di sostegno le sue domande di pagamento)"
      intestazioni={['Codice a barre', 'Tipo', 'Stato SIAN']}
      vuoto="Nessuna domanda collegata a questa domanda."
      righe={collegate.map((c) => [<CodiceCollegato key="codice" c={c} />, etichettaTipo(c.tipo), c.statoDescrizione ?? 'senza stato'])}
    />
  );
}

export function TabellaDetermine({ determine }: { determine: DeterminaDellaDomandaElenco[] }) {
  return (
    <Tabella
      caption="Determine della domanda (righe aperte)"
      intestazioni={['Determina', 'Data', 'Stato area programmazione', 'Responsabile del procedimento', 'ADA e provincia', 'Contributo richiesto', 'Contributo ammesso', 'Spesa imponibile ammessa']}
      vuoto="Nessuna determina per questa domanda."
      righe={determine.map((t) => [
        t.codice ?? '',
        formatDate(t.data),
        t.statoProgrammazione ?? 'senza stato',
        testoResponsabile(t.responsabile),
        [t.ada, t.provincia ? `(${t.provincia})` : null].filter(Boolean).join(' '),
        cellaImporto(t.contributoRichiesto),
        cellaImporto(t.contributoAmmesso),
        cellaImporto(t.spesaImponibileAmmessa),
      ])}
    />
  );
}

export function TabellaPagamentiDomanda({ pagamenti }: { pagamenti: PagamentoElenco[] }) {
  return (
    <Tabella
      caption="Righe correnti degli elenchi di liquidazione della domanda"
      intestazioni={['Decreto', 'Data di autorizzazione', 'Esito', 'Decretato', 'Pagato', 'Quota FEASR', 'Motivi di esclusione']}
      vuoto="Nessuna riga negli elenchi di liquidazione per questa domanda."
      righe={pagamenti.map((p) => [
        p.decreto ?? '',
        formatDate(p.dataAutorizzazione),
        etichettaEsito(p.esito),
        cellaImporto(p.importoDecretato),
        cellaImporto(p.importoPagato),
        cellaImporto(p.quotaFeasr),
        (p.motiviEsclusione ?? []).join(', '),
      ])}
    />
  );
}

export function TabellaRecuperi({ recuperi }: { recuperi: RecuperoDellaDomanda[] }) {
  return (
    <Tabella
      caption="Recuperi correnti della domanda"
      intestazioni={['Decreto', 'Importo lordo', 'Importo liquidato', 'Importo recuperato']}
      vuoto="Nessun recupero per questa domanda."
      righe={recuperi.map((r) => [r.decreto ?? '', cellaImporto(r.importoLordo), cellaImporto(r.importoLiquidato), cellaImporto(r.importoRecuperato)])}
    />
  );
}

export function TabellaAnomalie({ anomalie }: { anomalie: AnomaliaDellaDomanda[] }) {
  return (
    <Tabella
      caption="Anomalie presenti sulla domanda"
      intestazioni={['Codice', 'Descrizione']}
      vuoto="Nessuna anomalia presente per questa domanda."
      righe={anomalie.map((a) => [a.codice ?? '', a.descrizione ?? 'descrizione non disponibile'])}
    />
  );
}
