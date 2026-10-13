// anteprime — drawer di anteprima di una riga (pattern interrogazione: riga -> anteprima -> dettaglio, ADR 0029). Pannello
// laterale stretto di react-aria (focus trap, Esc, ritorno del focus alla riga); il passaggio alla scheda e' il link
// dichiarato nello uiplan (dettaglio-domanda, dettaglio-domanda-del-pagamento), costruito da lib/collegamenti. Una riga
// di pagamento di una domanda chiusa non offre il link (la scheda risponderebbe 404) e lo dice in testo. Il link c'e' solo
// col grant della scheda (TX-0058, hide-by-role del route-manifest: review v1 A-05) e porta la ricerca di partenza, cosi'
// "Torna all'elenco" della scheda riporta qui (V-12).
import { Link, useLocation } from 'react-router';
import { PannelloLaterale } from '../../../shared/ui';
import type { DomandaElenco, PagamentoElenco } from '../api';
import { percorsoDettaglio, statoDiRitorno } from '../lib/collegamenti';
import type { StatoScheda } from '../lib/collegamenti';
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

function LinkScheda({ percorso, testo, conScheda }: { percorso: string | null; testo: string; conScheda: boolean }) {
  const { pathname, search, state } = useLocation();
  const stato: StatoScheda = { ricerca: `${pathname}${search}`, ...statoDiRitorno(state) };
  return percorso && conScheda ? (
    <Link className="btn btn-primary" to={percorso} state={stato}>
      {testo}
    </Link>
  ) : null;
}

export function AnteprimaDomanda({ domanda, onChiudi, conScheda }: { domanda: DomandaElenco | null; onChiudi: () => void; conScheda: boolean }) {
  return (
    <PannelloLaterale
      aperto={domanda !== null}
      onChiudi={onChiudi}
      stretto
      sopratitolo="Anteprima della domanda"
      titolo={domanda?.codiceABarre ?? ''}
      azioni={<LinkScheda percorso={domanda ? percorsoDettaglio(domanda.tipo, domanda.codiceABarre) : null} testo="Apri il dettaglio" conScheda={conScheda} />}
    >
      {domanda && <ElencoVoci voci={vociAnteprimaDomanda(domanda)} />}
    </PannelloLaterale>
  );
}

export function AnteprimaPagamento({ pagamento, onChiudi, conScheda }: { pagamento: PagamentoElenco | null; onChiudi: () => void; conScheda: boolean }) {
  const corrente = pagamento?.domandaCorrente !== false;
  const percorso = pagamento && corrente ? percorsoDettaglio(pagamento.tipoDomanda, pagamento.codiceABarre) : null;
  return (
    <PannelloLaterale
      aperto={pagamento !== null}
      onChiudi={onChiudi}
      stretto
      sopratitolo="Anteprima del pagamento"
      titolo={pagamento ? `${pagamento.decreto ?? ''} - ${pagamento.codiceABarre ?? ''}` : ''}
      azioni={<LinkScheda percorso={percorso} testo="Apri la domanda" conScheda={conScheda} />}
    >
      {pagamento && <ElencoVoci voci={vociAnteprimaPagamento(pagamento)} />}
      {pagamento && !corrente && <p className="ui-nota">La domanda è chiusa: la sua scheda non è più consultabile.</p>}
    </PannelloLaterale>
  );
}
