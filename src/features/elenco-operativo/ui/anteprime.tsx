// anteprime — drawer di anteprima di una riga (pattern interrogazione: riga -> anteprima -> dettaglio, ADR 0029). Pannello
// laterale stretto di react-aria (focus trap, Esc, ritorno del focus alla riga); il passaggio alla scheda e' il link
// dichiarato nello uiplan (dettaglio-domanda, dettaglio-domanda-del-pagamento), costruito da lib/collegamenti. Una riga
// di pagamento di una domanda chiusa non offre il link (la scheda risponderebbe 404) e lo dice in testo.
import { Link } from 'react-router';
import { PannelloLaterale } from '../../../shared/ui';
import type { DomandaElenco, PagamentoElenco } from '../api';
import { percorsoDettaglio } from '../lib/collegamenti';
import { vociAnteprimaDomanda, vociAnteprimaPagamento } from '../lib/voci';
import type { VoceTesto } from '../lib/voci';

export function ElencoVoci({ voci }: { voci: readonly VoceTesto[] }) {
  return (
    <dl className="ui-dl">
      {voci.map(([termine, valore]) => (
        <div key={termine}>
          <dt>{termine}</dt>
          <dd>{valore}</dd>
        </div>
      ))}
    </dl>
  );
}

function LinkScheda({ percorso, testo }: { percorso: string | null; testo: string }) {
  return percorso ? (
    <Link className="btn btn-primary" to={percorso}>
      {testo}
    </Link>
  ) : null;
}

export function AnteprimaDomanda({ domanda, onChiudi }: { domanda: DomandaElenco | null; onChiudi: () => void }) {
  return (
    <PannelloLaterale
      aperto={domanda !== null}
      onChiudi={onChiudi}
      stretto
      sopratitolo="Anteprima della domanda"
      titolo={domanda?.codiceABarre ?? ''}
      azioni={<LinkScheda percorso={domanda ? percorsoDettaglio(domanda.tipo, domanda.codiceABarre) : null} testo="Apri il dettaglio" />}
    >
      {domanda && <ElencoVoci voci={vociAnteprimaDomanda(domanda)} />}
    </PannelloLaterale>
  );
}

export function AnteprimaPagamento({ pagamento, onChiudi }: { pagamento: PagamentoElenco | null; onChiudi: () => void }) {
  const corrente = pagamento?.domandaCorrente !== false;
  const percorso = pagamento && corrente ? percorsoDettaglio(pagamento.tipoDomanda, pagamento.codiceABarre) : null;
  return (
    <PannelloLaterale
      aperto={pagamento !== null}
      onChiudi={onChiudi}
      stretto
      sopratitolo="Anteprima del pagamento"
      titolo={pagamento ? `${pagamento.decreto ?? ''} - ${pagamento.codiceABarre ?? ''}` : ''}
      azioni={<LinkScheda percorso={percorso} testo="Apri la domanda" />}
    >
      {pagamento && <ElencoVoci voci={vociAnteprimaPagamento(pagamento)} />}
      {pagamento && !corrente && <p className="ui-nota">La domanda è chiusa: la sua scheda non è più consultabile.</p>}
    </PannelloLaterale>
  );
}
