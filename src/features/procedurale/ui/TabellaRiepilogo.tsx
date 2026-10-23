// TabellaRiepilogo — la tabella del riepilogo per intervento (flusso riepilogo approvato, RF029, vista Tabella) e il drawer
// di anteprima della riga: TabellaInterattiva del kit a quattro sezioni di colonne con le intestazioni di gruppo (scope
// colgroup): Domande ammesse (ammesse e con atto col loro "Apri nell'elenco", richiesto, ammesso; a scelta perimetro e
// attivato), Area programmazione, Sostegno e Pagamento (visibili i totali di ogni sezione, a scelta le voci e gli altri
// stati); le celle degli stati non hanno link (sarebbero decine per riga: il drill-down per stato e' nelle pagine degli
// stati e nel dettaglio); la voce senza fonte dice il motivo, nelle celle e nel piede. Il piede e' il totale del backend;
// la riga apre l'anteprima. CSV e XLSX dell'intero riepilogo.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AssenzaMotivata, BadgeAssenza, ValoreImporto } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { PannelloLaterale, PulsantiScarica, TabellaInterattiva } from '../../../shared/ui';
import type { ColonnaTabella, RigaPiede, Scaricamento } from '../../../shared/ui';
import { percorsoIntervento } from '../lib/collegamenti';
import type { CriteriProcedurali } from '../lib/criteri';
import type { RigaAmmesse, RigaRiepilogo, TotaleRiepilogo, VoceStato } from '../lib/dto';
import { NON_DISPONIBILE_BREVE, NOTA_FILE, siNo } from '../lib/formato';
import { TITOLI_SEZIONI, codiceDellaRiga, colonneVoci, distribuzioneDi, domandeDellaVoce, senzaStatoDi, testoConNonRilasciate, voceDellaColonna } from '../lib/riepilogo';
import type { SezioneRiepilogo } from '../lib/riepilogo';
import { testoAltriStati } from '../lib/stati';
import { CellaAmmesse, CellaConAtto } from './comuni';
import type { LinkElenco } from './comuni';
import { useLinkElenco } from './navigazione';

type Stati = Exclude<SezioneRiepilogo, 'ammesse'>;

const numero = (n: number | null | undefined) => (n == null ? <BadgeAssenza resa={NON_DISPONIBILE_BREVE} /> : <span className="font-monospace">{formatNumber(n)}</span>);

/** Le domande di una voce di stato: il numero, la voce senza fonte col motivo (mai solo "non disponibile"), senza voce breve. */
function DomandeDellaVoce({ v }: { v: VoceStato | undefined }) {
  if (v && v.domande === null) return <AssenzaMotivata dato={v} />;
  return numero(v?.domande);
}

/** La sezione delle domande ammesse: le quattro misure visibili, perimetro e attivato a scelta. */
function colonneAmmesse(criteri: CriteriProcedurali, link: LinkElenco): ColonnaTabella<RigaRiepilogo>[] {
  const gruppo = TITOLI_SEZIONI.ammesse;
  const conA = (resa: (a: RigaAmmesse) => ReactNode) => (r: RigaRiepilogo) => (r.ammesse ? resa(r.ammesse) : null);
  return [
    { chiave: 'ammesse', titolo: 'Ammesse', gruppo, valore: (r) => r.ammesse?.domandeAmmesse ?? null, resa: conA((a) => <CellaAmmesse r={a} criteri={criteri} link={link} id="elenco-ammesse-riepilogo" />), numerica: true },
    { chiave: 'atto', titolo: 'Con atto', gruppo, nomeEsteso: 'Con atto di concessione', valore: (r) => r.ammesse?.conAttoConcessione.valore ?? null, resa: conA((a) => <CellaConAtto r={a} link={link} id="elenco-con-atto-riepilogo" />), numerica: true },
    { chiave: 'richiesto', titolo: 'Richiesto', gruppo, nomeEsteso: 'Importo richiesto', valore: (r) => r.ammesse?.importoRichiesto.valore ?? null, resa: conA((a) => <ValoreImporto importo={a.importoRichiesto} />), numerica: true },
    { chiave: 'ammesso', titolo: 'Ammesso', gruppo, nomeEsteso: 'Contributo ammesso', valore: (r) => r.ammesse?.contributoAmmesso.valore ?? null, resa: conA((a) => <ValoreImporto importo={a.contributoAmmesso} />), numerica: true },
    { chiave: 'perimetro', titolo: 'Perimetro', gruppo, valore: (r) => r.ammesse?.perimetroIntervento ?? null, nascosta: true },
    { chiave: 'attivato', titolo: 'Attivato', gruppo, valore: (r) => (r.ammesse ? siNo(r.ammesse.attivato) : null), nascosta: true },
  ];
}

/** Una sezione per stato: totale (e senza stato o di cui non rilasciate) visibili, voci e altri stati a scelta. */
function colonneStati(sezione: Stati, totale: TotaleRiepilogo | undefined): ColonnaTabella<RigaRiepilogo>[] {
  const gruppo = TITOLI_SEZIONI[sezione];
  const d = (r: RigaRiepilogo) => distribuzioneDi(r, sezione);
  const seconda: ColonnaTabella<RigaRiepilogo> =
    sezione === 'area'
      ? { chiave: `${sezione}:senza`, titolo: 'Senza stato', gruppo, nomeEsteso: 'Senza stato (Area programmazione)', valore: senzaStatoDi, resa: (r) => numero(senzaStatoDi(r)), numerica: true }
      : { chiave: `${sezione}:nonRilasciate`, titolo: 'Di cui non rilasciate', gruppo, nomeEsteso: `Di cui non rilasciate (${gruppo})`, valore: (r) => d(r)?.domandeNonRilasciate ?? null, resa: (r) => numero(d(r)?.domandeNonRilasciate), numerica: true };
  return [
    { chiave: `${sezione}:totale`, titolo: 'Totale', gruppo, nomeEsteso: `Totale (${gruppo})`, valore: (r) => d(r)?.totale ?? null, resa: (r) => numero(d(r)?.totale), numerica: true },
    seconda,
    ...colonneVoci(totale, sezione).map((c) => ({ chiave: c.chiave, titolo: c.titolo, gruppo, nomeEsteso: c.nomeEsteso, valore: (r: RigaRiepilogo) => domandeDellaVoce(d(r), c.stato), resa: (r: RigaRiepilogo) => <DomandeDellaVoce v={voceDellaColonna(r, sezione, c.stato)} />, numerica: true, nascosta: true })),
    { chiave: `${sezione}:altri`, titolo: 'Altri stati', gruppo, nomeEsteso: `Altri stati (${gruppo})`, valore: (r) => testoAltriStati(d(r)), nascosta: true },
  ];
}

/** Il piede: le colonne dei totali del backend (le voci a scelta col loro totale). */
function piede(t: TotaleRiepilogo | undefined, colonne: readonly ColonnaTabella<RigaRiepilogo>[]): RigaPiede[] {
  if (!t) return [];
  // le colonne delle sezioni per stato leggono le distribuzioni: quelle del totale hanno la stessa forma di una riga
  const riga: RigaRiepilogo = { statiAreaProgrammazione: t.statiAreaProgrammazione, statiSostegno: t.statiSostegno, statiPagamento: t.statiPagamento };
  const celle = Object.fromEntries(colonne.filter((c) => c.chiave.includes(':')).map((c) => [c.chiave, c.resa?.(riga) ?? String(c.valore(riga) ?? '')]));
  const a = t.ammesse;
  return [{ codice: 'Totale (dal backend)', ...celle, ammesse: numero(a?.domandeAmmesse), atto: a?.conAttoConcessione?.valore == null ? <AssenzaMotivata dato={a?.conAttoConcessione} /> : numero(a.conAttoConcessione.valore), richiesto: <ValoreImporto importo={a?.importoRichiesto} />, ammesso: <ValoreImporto importo={a?.contributoAmmesso} /> }];
}

interface PropsTabella {
  righe: readonly RigaRiepilogo[];
  totale: TotaleRiepilogo | undefined;
  criteri: CriteriProcedurali;
  scaricamenti: readonly Scaricamento[];
  onRiga: (codice: string) => void;
}

export function TabellaRiepilogo({ righe, totale, criteri, scaricamenti, onRiga }: PropsTabella) {
  const link = useLinkElenco(criteri);
  const colonne: ColonnaTabella<RigaRiepilogo>[] = [
    { chiave: 'codice', titolo: 'Codice', nomeEsteso: "Codice dell'intervento", valore: codiceDellaRiga, fissa: true },
    ...colonneAmmesse(criteri, link),
    ...(['area', 'sostegno', 'pagamento'] as const).flatMap((s) => colonneStati(s, totale)),
  ];
  return (
    <TabellaInterattiva
      caption="Riepilogo per intervento: tutte le misure procedurali dei grafici (RF029); l'intervento è l'intestazione di riga; Colonne sceglie le voci di ogni sezione"
      righe={righe}
      colonne={colonne}
      chiaveRiga={codiceDellaRiga}
      testoRicerca={codiceDellaRiga}
      segnapostoRicerca="Cerca per codice dell'intervento"
      notaRicerca={NOTA_FILE}
      etichettaRiga={(r) => `Apri l'anteprima dell'intervento ${codiceDellaRiga(r)}`}
      onRiga={(r) => onRiga(codiceDellaRiga(r))}
      righePiede={piede(totale, colonne)}
      strumenti={<PulsantiScarica oggetto="la tabella Riepilogo per intervento" scaricamenti={scaricamenti} />}
    />
  );
}

/** Il drawer di anteprima di una riga: le misure della riga coi link delle ammesse e il dettaglio dell'intervento. */
export function AnteprimaRiepilogo({ riga, criteri, onChiudi }: { riga: RigaRiepilogo | null; criteri: CriteriProcedurali; onChiudi: () => void }) {
  const link = useLinkElenco(criteri);
  const a = riga?.ammesse;
  return (
    <PannelloLaterale aperto={riga !== null} onChiudi={onChiudi} titolo={`Anteprima: ${riga ? codiceDellaRiga(riga) : ''}`} stretto>
      {riga && a && (
        <>
          <dl className="ui-dl">
            <div><dt>Domande ammesse</dt><dd><CellaAmmesse r={a} criteri={criteri} link={link} id="elenco-ammesse-riepilogo" /></dd></div>
            <div><dt>Con atto di concessione</dt><dd><CellaConAtto r={a} link={link} id="elenco-con-atto-riepilogo" /></dd></div>
            <div><dt>Contributo ammesso</dt><dd><ValoreImporto importo={a.contributoAmmesso} />{' su richiesto '}<ValoreImporto importo={a.importoRichiesto} /></dd></div>
            <div><dt>Domande di sostegno</dt><dd>{testoConNonRilasciate(riga.statiSostegno)}</dd></div>
            <div><dt>Domande di pagamento</dt><dd>{testoConNonRilasciate(riga.statiPagamento)}</dd></div>
            <div><dt>Senza stato area programmazione</dt><dd>{numero(senzaStatoDi(riga))}</dd></div>
          </dl>
          <Link className="btn btn-primary mt-3 w-100" to={percorsoIntervento(a.codiceIntervento, criteri.stato)}>
            {"Apri il dettaglio dell'intervento"}
          </Link>
        </>
      )}
    </PannelloLaterale>
  );
}
