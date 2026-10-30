// AnteprimaIntervento — drawer di anteprima di un intervento delle superfici (flusso superfici approvato): descrizione dalle
// voci di TX-0060 (senza, il solo codice), superfici della campagna di riferimento con la verifica incrociata, superfici
// delle altre campagne, quantita' richiesta a premio (assente: la resa unica, OP-FIS-04), mini linea per campagna con la
// tabella equivalente (con il filtro Campagna la risposta ha la sola campagna filtrata: la linea non si disegna e lo dice,
// e un intervento senza superfici e' "nessuna superficie nella campagna N", mai "in nessuna campagna"), "Mostra solo
// <intervento>" (il filtro Intervento sull'intervento, stessa pagina) e "Apri il dettaglio dell'intervento" (link
// dettaglio-intervento-superfici verso il dettaglio del fisico, flusso intervento del 30/10/2026, solo col grant di una delle
// sue letture: un link vero, il focus va sul titolo del dettaglio dopo il cambio di route). Nessun link verso l'elenco
// operativo (OP-FIS-05). PannelloLaterale di react-aria (dialogo: focus trap, Esc, ritorno del focus a cio' che l'ha aperto
// se si chiude senza navigare); dentro, lista di definizioni, pulsante e link bootstrap-italia.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ValoreMotivato } from '../../../entities/importo';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { ettari, formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
import { percorsoIntervento } from '../lib/collegamenti';
import type { CampagnaSuperficie, InterventoSuperficie } from '../lib/dto';
import { fonteLineaIntervento, testoDifferenza, testoSenzaSuperfici } from '../lib/formato';
import { graficoInterventoPerCampagna } from '../lib/grafici';
import { puoAprireIntervento } from '../lib/grant';
import { campagneDellAnteprima } from '../lib/superfici';

function Voce({ termine, children }: { termine: string; children: ReactNode }) {
  return (
    <div>
      <dt>{termine}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Le superfici della campagna di riferimento con la verifica incrociata. */
function VociRiferimento({ c }: { c: CampagnaSuperficie }) {
  return (
    <>
      <Voce termine={`Superficie DS, campagna ${c.anno}`}>{ettari(c.superficieDs)}</Voce>
      <Voce termine={`Superficie DP, campagna ${c.anno}`}>{ettari(c.superficieDp)}</Voce>
      <Voce termine="Differenza DP - DS">{testoDifferenza(c.differenzaDpDs)}</Voce>
      <Voce termine="Domande con DP oltre la DS">{`${formatNumber(c.domandeDpOltreDs)} su ${formatNumber(c.domandePagamento)}`}</Voce>
    </>
  );
}

/** Superfici della campagna di riferimento con la verifica incrociata, poi le altre campagne dalla piu' recente. */
function Superfici({ riga, campagna, campagnaRisposta }: { riga: InterventoSuperficie; campagna: number | null; campagnaRisposta: number | null }) {
  if (riga.campagne.length === 0) {
    return (
      <dl className="ui-dl">
        <Voce termine="Superfici">{testoSenzaSuperfici(campagnaRisposta)}</Voce>
      </dl>
    );
  }
  const { riferimento, altre, premio } = campagneDellAnteprima(riga, campagna);
  return (
    <dl className="ui-dl">
      {riferimento && <VociRiferimento c={riferimento} />}
      {altre.flatMap((c) => [
        <Voce key={`${c.anno}-ds`} termine={`Superficie DS, campagna ${c.anno}`}>
          {ettari(c.superficieDs)}
        </Voce>,
        <Voce key={`${c.anno}-dp`} termine={`Superficie DP, campagna ${c.anno}`}>
          {ettari(c.superficieDp)}
        </Voce>,
      ])}
      {premio && (
        <Voce termine="Quantità richiesta a premio">
          <ValoreMotivato dato={premio.quantitaRichiestaPremio} resa={(v) => formatNumber(v)} />
        </Voce>
      )}
    </dl>
  );
}

interface PropsAnteprima {
  riga: InterventoSuperficie | null;
  /** Campagna di riferimento della pagina (filtro o la piu' recente). */
  campagna: number | null;
  /** La campagna della risposta di TX-0018 (null = letta senza il filtro Campagna). */
  campagnaRisposta: number | null;
  /** Descrizione dell'intervento dalle voci di TX-0060, se lette. */
  descrizione: string | undefined;
  onMostraSolo: (codice: string) => void;
  onChiudi: () => void;
}

export function AnteprimaIntervento({ riga, campagna, campagnaRisposta, descrizione, onMostraSolo, onChiudi }: PropsAnteprima) {
  const codice = riga?.codiceIntervento ?? '';
  const conDettaglio = puoAprireIntervento(useAuthStatus().data);
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={codice} sopratitolo="Anteprima dell'intervento" stretto>
      {riga && (
        <>
          <p>{descrizione ? `${codice} - ${descrizione}` : codice}</p>
          <Superfici riga={riga} campagna={campagna} campagnaRisposta={campagnaRisposta} />
          {riga.campagne.length > 0 && (
            <CardGrafico
              titolo={`Superficie DS e DP di ${codice} per campagna`}
              livello={3}
              altezza="mini"
              dati={graficoInterventoPerCampagna(riga, campagnaRisposta)}
              fonte={fonteLineaIntervento(campagnaRisposta)}
              nomeFile={`Superfici di ${codice} per campagna`}
            />
          )}
          <button type="button" className="btn btn-primary mt-3 w-100" onClick={() => onMostraSolo(codice)}>
            {`Mostra solo ${codice}`}
          </button>
          {conDettaglio && (
            <Link className="btn btn-outline-primary mt-2 w-100" to={percorsoIntervento(codice)}>
              {"Apri il dettaglio dell'intervento"}
            </Link>
          )}
        </>
      )}
    </PannelloLaterale>
  );
}
