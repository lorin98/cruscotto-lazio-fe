// TabellaStatiInterventi — la tabella "Domande di sostegno (di pagamento) per intervento e stato" (flusso stati approvato,
// RF027, RF028): TabellaInterattiva del kit (cerca, ordina, colonne, paginazione) con l'intervento come intestazione di
// riga (codice e descrizione di TX-0024), il totale e il di cui non rilasciate, una colonna per voce di SR-01 con
// l'intestazione breve e la descrizione completa nel nome accessibile, gli altri stati in breve e, a scelta da "Colonne",
// una colonna per codice; la voce senza fonte e' "non disponibile", mai 0. Il piede e' il totale del backend (mai sommato
// nel browser). Riga apribile (clic o Invio) verso l'anteprima; CSV e XLSX dell'intero report negli strumenti.
import type { ReactNode } from 'react';
import { descrizioneIntervento } from '../../../entities/filtri';
import { BadgeAssenza } from '../../../entities/importo';
import { formatNumber, maiuscolaIniziale } from '../../../shared/lib';
import { PulsantiScarica, Sezione, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede, Scaricamento } from '../../../shared/ui';
import type { Distribuzione, RigaStati, ValoriFiltri, VoceStato } from '../lib/dto';
import { NON_DISPONIBILE_BREVE, NOTA_FILE } from '../lib/formato';
import { codiciAltriStati, domandeAltroStato, testoAltriStati, titoloBreve, voceDi } from '../lib/stati';

type Riga = RigaStati & { codiceIntervento: string };

const numero = (n: number | null | undefined) => (n === null ? <BadgeAssenza resa={NON_DISPONIBILE_BREVE} /> : <span className="font-monospace">{formatNumber(n)}</span>);

/** La colonna di una voce di SR-01: le domande dell'intervento nella voce (null = senza fonte). */
function colonnaVoce(v: VoceStato): ColonnaTabella<Riga> {
  const domande = (r: Riga) => voceDi(r.stati, v.stato)?.domande ?? null;
  const breve = titoloBreve(v);
  const esteso = maiuscolaIniziale(v.descrizione);
  return { chiave: `voce:${v.stato}`, titolo: breve, nomeEsteso: esteso === breve ? undefined : esteso, valore: domande, resa: (r) => numero(domande(r)), numerica: true };
}

/** Le colonne: intervento, totale, di cui non rilasciate, le voci del totale, gli altri stati in breve e per codice. */
function colonne(totale: Distribuzione | undefined, valori: ValoriFiltri | undefined): ColonnaTabella<Riga>[] {
  return [
    { chiave: 'intervento', titolo: 'Intervento', valore: (r) => r.codiceIntervento, resa: (r) => [r.codiceIntervento, descrizioneIntervento(valori?.interventi, r.codiceIntervento)].filter(Boolean).join(' - '), fissa: true },
    { chiave: 'totale', titolo: 'Totale', valore: (r) => r.stati?.totale ?? null, resa: (r) => numero(r.stati?.totale), numerica: true },
    { chiave: 'nonRilasciate', titolo: 'Di cui non rilasciate', valore: (r) => r.stati?.domandeNonRilasciate ?? null, resa: (r) => numero(r.stati?.domandeNonRilasciate), numerica: true },
    ...(totale?.voci ?? []).map(colonnaVoce),
    { chiave: 'altri', titolo: 'Altri stati', valore: (r) => testoAltriStati(r.stati), resa: (r) => testoAltriStati(r.stati) },
    ...codiciAltriStati(totale).map((codice) => ({ chiave: `altro:${codice}`, titolo: codice, valore: (r: Riga) => domandeAltroStato(r.stati, codice), numerica: true, nascosta: true })),
  ];
}

/** Il piede: il totale del backend, con la voce senza fonte "non disponibile". */
function piede(totale: Distribuzione | undefined): RigaPiede[] {
  if (!totale) return [];
  const voci = Object.fromEntries(totale.voci.map((v) => [`voce:${v.stato}`, numero(v.domande)]));
  const altri = Object.fromEntries(totale.altriStati.map((a) => [`altro:${a.codice}`, numero(a.domande)]));
  return [{ intervento: 'Totale (dal backend, tutti gli interventi dei filtri)', totale: numero(totale.totale), nonRilasciate: numero(totale.domandeNonRilasciate), ...voci, altri: testoAltriStati(totale), ...altri }];
}

interface PropsTabella {
  titolo: string;
  righe: readonly Riga[];
  totale: Distribuzione | undefined;
  valori: ValoriFiltri | undefined;
  scaricamenti: readonly Scaricamento[];
  onRiga: (codice: string) => void;
  /** Sopra la tabella: il filtro della voce scelta dal grafico. */
  sopra?: ReactNode;
}

export function TabellaStatiInterventi({ titolo, righe, totale, valori, scaricamenti, onRiga, sopra }: PropsTabella) {
  return (
    <Sezione titolo={titolo}>
      {sopra}
      <TabellaInterattiva
        caption={`${titolo}: l'intervento è l'intestazione di riga, le voci di SR-01 e gli altri stati le colonne (scegli quali con Colonne)`}
        righe={righe}
        colonne={colonne(totale, valori)}
        chiaveRiga={(r) => r.codiceIntervento}
        testoRicerca={(r) => `${r.codiceIntervento} ${descrizioneIntervento(valori?.interventi, r.codiceIntervento) ?? ''}`}
        segnapostoRicerca="Cerca per codice o descrizione dell'intervento"
        notaRicerca={NOTA_FILE}
        etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${r.codiceIntervento}`}
        onRiga={(r) => onRiga(r.codiceIntervento)}
        righePiede={piede(totale)}
        strumenti={<PulsantiScarica oggetto={`la tabella ${titolo}`} scaricamenti={scaricamenti} />}
      />
    </Sezione>
  );
}
