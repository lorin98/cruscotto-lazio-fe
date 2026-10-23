// AnteprimaStati — il drawer di anteprima di un intervento nelle pagine degli stati (flusso stati approvato): le domande
// del tipo col di cui non rilasciate, ogni voce con domande (o senza fonte, col motivo) e il suo "Apri nell'elenco" della
// parte rilasciata (link elenco-stato-sostegno-riga, elenco-stato-pagamento-riga: solo col grant dell'elenco), per il
// sostegno il mini grafico delle voci (anteprima senza scaricamenti, con la sua tabella equivalente) e "Apri il dettaglio
// dell'intervento" (link dettaglio-intervento-stati-*). PannelloLaterale di react-aria: focus trap, Esc, ritorno del focus.
import { useMemo } from 'react';
import { Link } from 'react-router';
import { AssenzaMotivata } from '../../../entities/importo';
import { ApriNellElenco } from '../../../entities/domanda';
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
import { LINK_STATO, apreLaVoce, percorsoIntervento, puntoDelloStato, testiLinkStato } from '../lib/collegamenti';
import type { CriteriProcedurali } from '../lib/criteri';
import type { RigaStati, TipoDomanda } from '../lib/dto';
import { graficoStati } from '../lib/grafici';
import { diTipo, vociDegliStati } from '../lib/stati';
import type { VoceDistribuzione } from '../lib/stati';
import { useLinkElenco } from './navigazione';

type Riga = RigaStati & { codiceIntervento: string };

interface PropsVoci {
  tipo: TipoDomanda;
  riga: Riga;
  voci: readonly VoceDistribuzione[];
  criteri: CriteriProcedurali;
}

/** Una voce: il numero col di cui non rilasciate e il link della parte rilasciata, oppure l'assenza col motivo. */
function Voce({ tipo, riga, v, criteri }: Omit<PropsVoci, 'voci'> & { v: VoceDistribuzione }) {
  const link = useLinkElenco(criteri);
  if (v.domande === null) return <AssenzaMotivata dato={v.assenza} />;
  const indirizzo = apreLaVoce(v) ? link(LINK_STATO[tipo].riga, puntoDelloStato(tipo, v.chiave, riga.codiceIntervento)) : null;
  return (
    <>
      {`${formatNumber(v.domande)}${(v.nonRilasciate ?? 0) > 0 ? `, di cui non rilasciate ${formatNumber(v.nonRilasciate)}` : ''} `}
      <ApriNellElenco indirizzo={indirizzo} {...testiLinkStato(v, tipo, riga.codiceIntervento)} />
    </>
  );
}

/** Le domande del tipo e le voci con domande (o senza fonte), nell'ordine della distribuzione. */
function VociDellIntervento({ tipo, riga, voci, criteri }: PropsVoci) {
  return (
    <dl className="ui-dl">
      <div>
        <dt>{`Domande ${diTipo(tipo)}`}</dt>
        <dd>{`${formatNumber(riga.stati?.totale)}, di cui non rilasciate ${formatNumber(riga.stati?.domandeNonRilasciate)}`}</dd>
      </div>
      {voci
        .filter((v) => v.domande === null || v.domande > 0)
        .map((v) => (
          <div key={v.chiave}>
            <dt>{v.etichetta}</dt>
            <dd>
              <Voce tipo={tipo} riga={riga} v={v} criteri={criteri} />
            </dd>
          </div>
        ))}
    </dl>
  );
}

/** Il mini grafico delle voci dell'intervento (sostegno), senza scaricamenti: un'anteprima. */
function MiniGrafico({ codice, voci }: { codice: string; voci: readonly VoceDistribuzione[] }) {
  const titolo = `Domande di sostegno di ${codice} per stato`;
  const dati = useMemo(() => graficoStati(voci, { titolo, caption: titolo, voce: 'Stato della domanda di sostegno' }), [voci, titolo]);
  return <CardGrafico titolo={titolo} dati={dati} fonte="Fonte: TX-0027 (riga dell'intervento)." livello={3} senzaPng />;
}

export function AnteprimaStati({ tipo, riga, criteri, onChiudi }: { tipo: TipoDomanda; riga: Riga | null; criteri: CriteriProcedurali; onChiudi: () => void }) {
  const voci = useMemo(() => vociDegliStati(riga?.stati), [riga]);
  const codice = riga?.codiceIntervento ?? '';
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${codice}`} stretto>
      {riga && (
        <>
          <VociDellIntervento tipo={tipo} riga={riga} voci={voci} criteri={criteri} />
          {tipo === 'SOSTEGNO' && <MiniGrafico codice={codice} voci={voci} />}
          <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(codice, criteri.stato)}>
            {"Apri il dettaglio dell'intervento"}
          </Link>
        </>
      )}
    </PannelloLaterale>
  );
}
