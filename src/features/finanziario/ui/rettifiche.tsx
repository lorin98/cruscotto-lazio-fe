// rettifiche.tsx — le rettifiche dei pagamenti (revisioni del 31/10/2026, R08, R1): il pagato netto e' il lordo degli
// elenchi di liquidazione meno le rettifiche del report "recuperi e variazioni" (FEASR 23.27); le rettifiche dei
// trascinamenti PSR si vedono nel dettaglio ma restano fuori dal netto. Qui: la fonte (documento e data di riferimento), la
// tabella delle righe di un intervento, l'indicatore "Si': n righe" che le apre e la tabella del residuo sui pagamenti per
// intervento (RF007, TX-0007 interventi[]) con il pannello laterale del dettaglio. Senza righe nel database il backend
// risponde "fonte non attiva: rettifiche" sugli importi (ValoreImporto lo dice).
import { useState } from 'react';
import { ValoreImporto } from '../../../entities/importo';
import { formatEuro, formatGiorno } from '../../../shared/lib';
import { PannelloLaterale, PulsantiScarica, Sezione, TabellaInterattiva, TabellaStatica } from '../../../shared/ui';
import type { ColonnaStatica, ColonnaTabella } from '../../../shared/ui';
import type { FonteRettifiche, Rettifica, ResiduoSuPagamenti, ResiduoSuPagamentiIntervento } from '../api';
import { ricercaDaFiltri } from '../lib/filtri';
import type { Filtri } from '../lib/filtri';
import { datiDelReport } from './esportazioni';
import { NotaPerimetroMisto, PerimetroSezione } from './comuni';

/** Le programmazioni delle rettifiche come le legge l'utente: solo quelle del CSR entrano nel netto. */
const PROGRAMMAZIONI: Record<string, string> = {
  CSR_2023_2027: 'CSR 2023-2027 (nel netto)',
  TRASCINAMENTI_PSR: 'Trascinamenti PSR (fuori dal netto)',
};

const COLONNE_RETTIFICHE: ColonnaStatica<Rettifica>[] = [
  { chiave: 'azione', titolo: 'Azione', resa: (r) => r.codiceAzione ?? '-' },
  { chiave: 'progressivo', titolo: 'Progressivo', resa: (r) => String(r.progressivo ?? '-'), numerica: true },
  { chiave: 'importo', titolo: 'Importo', resa: (r) => formatEuro(r.importo), numerica: true },
  { chiave: 'programmazione', titolo: 'Programmazione', resa: (r) => PROGRAMMAZIONI[r.programmazione ?? ''] ?? r.programmazione ?? '-' },
  { chiave: 'riferimento', titolo: 'Riferimento', resa: (r) => r.riferimento ?? '-' },
];

/** Le righe delle rettifiche di un intervento (importi col segno del foglio: negativo = riduzione del pagato). */
export function TabellaRettifiche({ codice, rettifiche }: { codice: string; rettifiche: readonly Rettifica[] }) {
  return <TabellaStatica caption={`Rettifiche dell'intervento ${codice}`} colonne={COLONNE_RETTIFICHE} righe={rettifiche} chiaveRiga={(r, k) => `${r.progressivo ?? k}-${r.programmazione ?? ''}-${k}`} />;
}

/** La fonte delle rettifiche lette: documento e data di riferimento; niente senza fonte. */
export function FonteDelleRettifiche({ fonte }: { fonte: FonteRettifiche | null | undefined }) {
  if (!fonte) return null;
  const documento = fonte.documento ? `documento "${fonte.documento}"` : 'documento non indicato';
  return <p className="ui-pill mb-2">{`Rettifiche: ${documento}, data di riferimento ${formatGiorno(fonte.dataRiferimento)}`}</p>;
}

/** "Si': n righe" (apre il dettaglio), "No", o il dato assente (nessuna rettifica nel database). */
function Rettificato({ r, onApri }: { r: ResiduoSuPagamentiIntervento; onApri: () => void }) {
  const n = (r.rettifiche ?? []).length;
  if (r.conRettifiche == null) return <>fonte non attiva: rettifiche</>;
  if (!r.conRettifiche || n === 0) return <>No</>;
  return (
    <button type="button" className="btn btn-link btn-sm p-0" onClick={onApri} aria-label={`Apri le ${n === 1 ? 'una riga' : `${n} righe`} di rettifiche dell'intervento ${r.codiceIntervento}`}>
      {n === 1 ? "Si': 1 riga" : `Si': ${n} righe`}
    </button>
  );
}

const TITOLO_RF007 = 'Dotazione residua sui pagamenti per intervento (RF007)';

const importo = (chiave: keyof ResiduoSuPagamentiIntervento, titolo: string): ColonnaTabella<ResiduoSuPagamentiIntervento> => ({
  chiave,
  titolo,
  valore: (r) => (r[chiave] as { valore?: number | null } | undefined)?.valore ?? null,
  resa: (r) => <ValoreImporto importo={r[chiave] as ResiduoSuPagamentiIntervento['pagatoLordo']} />,
  numerica: true,
});

/**
 * Residuo sui pagamenti per intervento (RF007, R08): dotazione, pagato lordo, rettifiche, pagato netto, dotazione residua e
 * l'indicatore delle rettifiche, che apre le righe nel pannello laterale. Dalla stessa lettura in cache di TX-0007.
 */
export function ResiduoPerIntervento({ d, filtri }: { d: ResiduoSuPagamenti; filtri: Filtri }) {
  const [aperta, setAperta] = useState<ResiduoSuPagamentiIntervento | null>(null);
  const colonne: ColonnaTabella<ResiduoSuPagamentiIntervento>[] = [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codiceIntervento ?? null, fissa: true },
    importo('dotazioneSpesaPubblica', 'Dotazione'),
    importo('pagatoLordo', 'Pagato lordo'),
    importo('importoRettifiche', 'Rettifiche'),
    importo('pagamentiNettoRettifiche', 'Pagato netto'),
    importo('dotazioneResidua', 'Dotazione residua'),
    { chiave: 'rettificato', titolo: 'Rettificato', valore: (r) => (r.rettifiche ?? []).length, resa: (r) => <Rettificato r={r} onApri={() => setAperta(r)} /> },
  ];
  return (
    <Sezione titolo={TITOLO_RF007} strumenti={<PulsantiScarica oggetto={`la tabella ${TITOLO_RF007}`} scaricamenti={datiDelReport(TITOLO_RF007, 'residuoPagamenti', filtri)} />}>
      <FonteDelleRettifiche fonte={d.fonteRettifiche} />
      <PerimetroSezione perimetro={d.perimetro} />
      <NotaPerimetroMisto perimetro={d.perimetro} />
      <TabellaInterattiva
        key={ricercaDaFiltri(filtri)}
        caption="Per intervento: pagato lordo, rettifiche, pagamenti al netto delle rettifiche e dotazione residua"
        righe={d.interventi ?? []}
        colonne={colonne}
        chiaveRiga={(r) => r.codiceIntervento ?? ''}
        testoRicerca={(r) => r.codiceIntervento ?? ''}
        segnapostoRicerca="Cerca per codice dell'intervento"
      />
      <p className="ui-fonte">
        {"Fonte: TX-0007 (interventi). Le rettifiche dei trascinamenti PSR sono nel dettaglio ma fuori dal netto."}
      </p>
      <PannelloLaterale aperto={aperta !== null} onChiudi={() => setAperta(null)} titolo={aperta?.codiceIntervento ?? ''} sopratitolo="Rettifiche dell'intervento" stretto>
        {aperta && <TabellaRettifiche codice={aperta.codiceIntervento ?? ''} rettifiche={aperta.rettifiche ?? []} />}
      </PannelloLaterale>
    </Sezione>
  );
}
