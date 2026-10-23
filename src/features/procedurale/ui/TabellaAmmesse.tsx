// TabellaAmmesse — la tabella "Domande ammesse per intervento" e il drawer di anteprima della riga (flusso ammesse
// approvato, RF026): TabellaInterattiva del kit con l'intervento (codice e descrizione di TX-0024) come intestazione di
// riga, perimetro dell'intervento, attivato, domande ammesse e con atto di concessione col loro "Apri nell'elenco" (link
// elenco-ammesse-riga, elenco-con-atto-riga: solo con un numero maggiore di 0, l'atto solo con la fonte attiva e col
// grant dell'elenco), importo richiesto e contributo ammesso col motivo dell'assenza; il piede e' il totale del backend.
// Riga apribile verso l'anteprima, che ha gli stessi link e "Apri il dettaglio dell'intervento". CSV e XLSX dell'intero
// report negli strumenti.
import { Link } from 'react-router';
import { descrizioneIntervento } from '../../../entities/filtri';
import { AssenzaMotivata, ValoreImporto } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { PannelloLaterale, PulsantiScarica, Sezione, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede, Scaricamento } from '../../../shared/ui';
import { percorsoIntervento } from '../lib/collegamenti';
import type { CriteriProcedurali } from '../lib/criteri';
import type { RigaAmmesse, TotaleAmmesse, ValoriFiltri } from '../lib/dto';
import { NOTA_FILE, siNo } from '../lib/formato';
import { CellaAmmesse, CellaConAtto } from './comuni';
import type { LinkElenco } from './comuni';
import { useLinkElenco } from './navigazione';

const testoIntervento = (r: RigaAmmesse, valori: ValoriFiltri | undefined) => [r.codiceIntervento, descrizioneIntervento(valori?.interventi, r.codiceIntervento)].filter(Boolean).join(' - ');

function colonne(criteri: CriteriProcedurali, link: LinkElenco, valori: ValoriFiltri | undefined): ColonnaTabella<RigaAmmesse>[] {
  return [
    { chiave: 'intervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento, resa: (r) => testoIntervento(r, valori), fissa: true },
    { chiave: 'perimetro', titolo: 'Perimetro', valore: (r) => r.perimetroIntervento, resa: (r) => r.perimetroIntervento ?? <AssenzaMotivata dato={{ motivo: 'NON_VALORIZZATO' }} /> },
    { chiave: 'attivato', titolo: 'Attivato', valore: (r) => siNo(r.attivato) },
    { chiave: 'ammesse', titolo: 'Domande ammesse', valore: (r) => r.domandeAmmesse, resa: (r) => <CellaAmmesse r={r} criteri={criteri} link={link} />, numerica: true },
    { chiave: 'atto', titolo: 'Con atto di concessione', valore: (r) => r.conAttoConcessione.valore ?? null, resa: (r) => <CellaConAtto r={r} link={link} />, numerica: true },
    { chiave: 'richiesto', titolo: 'Importo richiesto', valore: (r) => r.importoRichiesto.valore ?? null, resa: (r) => <ValoreImporto importo={r.importoRichiesto} />, numerica: true },
    { chiave: 'contributo', titolo: 'Contributo ammesso', valore: (r) => r.contributoAmmesso.valore ?? null, resa: (r) => <ValoreImporto importo={r.contributoAmmesso} />, numerica: true },
  ];
}

/** Il piede: il totale del backend, con gli interventi del perimetro ufficiale e quelli attivati. */
function piede(t: TotaleAmmesse | undefined): RigaPiede[] {
  if (!t) return [];
  return [
    {
      intervento: `Totale (${formatNumber(t.interventiPerimetroUfficiale)} interventi del perimetro ufficiale, ${formatNumber(t.interventiAttivati)} attivati)`,
      ammesse: <span className="font-monospace">{formatNumber(t.domandeAmmesse)}</span>,
      atto: t.conAttoConcessione?.valore == null ? <AssenzaMotivata dato={t.conAttoConcessione} /> : <span className="font-monospace">{formatNumber(t.conAttoConcessione.valore)}</span>,
      richiesto: <ValoreImporto importo={t.importoRichiesto} />,
      contributo: <ValoreImporto importo={t.contributoAmmesso} />,
    },
  ];
}

interface PropsTabella {
  righe: readonly RigaAmmesse[];
  totale: TotaleAmmesse | undefined;
  criteri: CriteriProcedurali;
  valori: ValoriFiltri | undefined;
  scaricamenti: readonly Scaricamento[];
  onRiga: (codice: string) => void;
}

const TITOLO = 'Domande ammesse per intervento';

export function TabellaAmmesse({ righe, totale, criteri, valori, scaricamenti, onRiga }: PropsTabella) {
  const link = useLinkElenco(criteri);
  return (
    <Sezione titolo={TITOLO}>
      <TabellaInterattiva
        caption={`${TITOLO}: l'intervento è l'intestazione di riga; ordinabile con le intestazioni`}
        righe={righe}
        colonne={colonne(criteri, link, valori)}
        chiaveRiga={(r) => r.codiceIntervento}
        testoRicerca={(r) => testoIntervento(r, valori)}
        segnapostoRicerca="Cerca per codice o descrizione dell'intervento"
        notaRicerca={NOTA_FILE}
        etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento}`}
        onRiga={(r) => onRiga(r.codiceIntervento)}
        righePiede={piede(totale)}
        strumenti={<PulsantiScarica oggetto={`la tabella ${TITOLO}`} scaricamenti={scaricamenti} />}
      />
    </Sezione>
  );
}

/** Il drawer di anteprima di una riga: i quattro dati coi loro link e il dettaglio dell'intervento. */
export function AnteprimaAmmesse({ riga, criteri, onChiudi }: { riga: RigaAmmesse | null; criteri: CriteriProcedurali; onChiudi: () => void }) {
  const link = useLinkElenco(criteri);
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${riga?.codiceIntervento ?? ''}`} stretto>
      {riga && (
        <>
          <dl className="ui-dl">
            <div><dt>Domande ammesse</dt><dd><CellaAmmesse r={riga} criteri={criteri} link={link} /></dd></div>
            <div><dt>Con atto di concessione</dt><dd><CellaConAtto r={riga} link={link} /></dd></div>
            <div><dt>Importo richiesto</dt><dd><ValoreImporto importo={riga.importoRichiesto} /></dd></div>
            <div><dt>Contributo ammesso</dt><dd><ValoreImporto importo={riga.contributoAmmesso} /></dd></div>
          </dl>
          <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(riga.codiceIntervento, criteri.stato)}>
            {"Apri il dettaglio dell'intervento"}
          </Link>
        </>
      )}
    </PannelloLaterale>
  );
}
