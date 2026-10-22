// AnteprimaIntervento — drawer di anteprima di un intervento delle superfici (flusso superfici approvato): descrizione dalle
// voci di TX-0060 (senza, il solo codice), superfici della campagna di riferimento con la verifica incrociata, superfici
// delle altre campagne, quantita' richiesta a premio (assente: la resa unica, OP-FIS-04), mini linea per campagna con la
// tabella equivalente, e "Mostra solo <intervento>": il filtro Intervento sull'intervento, stessa pagina (nessun link verso
// altre pagine: OP-FIS-05). PannelloLaterale di react-aria: focus trap, Esc, ritorno del focus a cio' che l'ha aperto.
import type { ReactNode } from 'react';
import { ValoreMotivato } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, PannelloLaterale } from '../../../shared/ui';
import type { CampagnaSuperficie, InterventoSuperficie } from '../lib/dto';
import { SENZA_SUPERFICI, testoDifferenza, testoSuperficie } from '../lib/formato';
import { graficoInterventoPerCampagna } from '../lib/grafici';
import { campagnaDi } from '../lib/superfici';

function Voce({ termine, children }: { termine: string; children: ReactNode }) {
  return (
    <div>
      <dt>{termine}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Superfici della campagna di riferimento con la verifica incrociata, poi le altre campagne dalla piu' recente. */
function Superfici({ riga, campagna }: { riga: InterventoSuperficie; campagna: number | null }) {
  const riferimento = campagna === null ? undefined : campagnaDi(riga, campagna);
  const altre = riga.campagne.filter((c) => c !== riferimento).sort((a, b) => b.anno - a.anno);
  const premio: CampagnaSuperficie | undefined = riferimento ?? altre[0];
  if (riga.campagne.length === 0) {
    return (
      <dl className="ui-dl">
        <Voce termine="Superfici">{SENZA_SUPERFICI}</Voce>
      </dl>
    );
  }
  return (
    <dl className="ui-dl">
      {riferimento && (
        <>
          <Voce termine={`Superficie DS, campagna ${riferimento.anno}`}>{testoSuperficie(riferimento.superficieDs)}</Voce>
          <Voce termine={`Superficie DP, campagna ${riferimento.anno}`}>{testoSuperficie(riferimento.superficieDp)}</Voce>
          <Voce termine="Differenza DP - DS">{testoDifferenza(riferimento.differenzaDpDs)}</Voce>
          <Voce termine="Domande con DP oltre la DS">{`${formatNumber(riferimento.domandeDpOltreDs)} su ${formatNumber(riferimento.domandePagamento)}`}</Voce>
        </>
      )}
      {altre.flatMap((c) => [
        <Voce key={`${c.anno}-ds`} termine={`Superficie DS, campagna ${c.anno}`}>
          {testoSuperficie(c.superficieDs)}
        </Voce>,
        <Voce key={`${c.anno}-dp`} termine={`Superficie DP, campagna ${c.anno}`}>
          {testoSuperficie(c.superficieDp)}
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
  /** Descrizione dell'intervento dalle voci di TX-0060, se lette. */
  descrizione: string | undefined;
  onMostraSolo: (codice: string) => void;
  onChiudi: () => void;
}

export function AnteprimaIntervento({ riga, campagna, descrizione, onMostraSolo, onChiudi }: PropsAnteprima) {
  const codice = riga?.codiceIntervento ?? '';
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={codice} sopratitolo="Anteprima dell'intervento" stretto>
      {riga && (
        <>
          <p>{descrizione ? `${codice} - ${descrizione}` : codice}</p>
          <Superfici riga={riga} campagna={campagna} />
          {riga.campagne.length > 0 && (
            <CardGrafico
              titolo={`Superficie DS e DP di ${codice} per campagna`}
              livello={3}
              altezza="mini"
              dati={graficoInterventoPerCampagna(riga)}
              fonte="Fonte: TX-0018, superfici dell'intervento campagna per campagna (le campagne non si sommano)."
              nomeFile={`Superfici di ${codice} per campagna`}
            />
          )}
          <button type="button" className="btn btn-primary mt-3 w-100" onClick={() => onMostraSolo(codice)}>
            {`Mostra solo ${codice}`}
          </button>
        </>
      )}
    </PannelloLaterale>
  );
}
