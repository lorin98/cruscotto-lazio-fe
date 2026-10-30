// CardSottofasi — la card delle sottofasi di ammissibilita' di un tipo di domanda (flusso sottofasi approvato, RF031 e
// RF032; scheda Sottofasi del dettaglio, scelta 6 approvata): barre orizzontali delle voci di SR-01 con le domande della
// voce, oppure, senza la fonte (nessuna domanda del tipo legata a una sottofase), il grafico non disponibile detto in
// testo e subito la tabella; la tabella delle voci (sottofase censita che la abbina, esito, domande della voce e della
// sottofase censita: la voce conta le domande distinte, la pagina non somma) e quella delle altre sottofasi
// dell'anagrafica. Nessun clic: l'elenco operativo non ha un filtro per sottofase (OP-PR-08). Sopra, gli stati
// dell'anagrafica vuota (nessun errore) e dell'insieme filtrato senza domande (voci a 0, "Modifica i filtri"). PNG solo col
// grafico disegnato; CSV e XLSX: l'export del report coi filtri. CardGrafico e tabelle statiche del kit.
import { useMemo } from 'react';
import { AssenzaMotivata, BadgeAssenza, ValoreMotivato, resaAssenza } from '../../../entities/importo';
import { formatNumber } from '../../../shared/lib';
import { CardGrafico, TabellaStatica, Vuoto, VuotoConFiltri } from '../../../shared/ui';
import type { ColonnaStatica } from '../../../shared/ui';
import type { CriteriProcedurali } from '../lib/criteri';
import type { Dato, SottofaseCensita, Sottofasi, TipoDomanda } from '../lib/dto';
import { ANAGRAFICA_VUOTA } from '../lib/formato';
import { graficoSottofasi } from '../lib/grafici';
import { altreSottofasi, anagraficaVuota, righeVoci, senzaDomandeNeiFiltri } from '../lib/sottofasi';
import type { RigaVoceSottofase } from '../lib/sottofasi';
import { diTipo } from '../lib/stati';
import { OGGETTO_FILE, fileReport } from './esportazioni';

const numero = (v: number) => <span className="font-monospace">{formatNumber(v)}</span>;
const NON_CENSITA = <span>non censita</span>;

/** Le domande della sottofase censita: "non censita" senza sottofase, in breve con la fonte non attiva (detta accanto). */
function DomandeCensita({ d }: { d: Dato | null }) {
  if (d === null) return NON_CENSITA;
  return d.valore == null ? <BadgeAssenza resa={resaAssenza(d, true)} /> : numero(d.valore);
}

const COLONNE_VOCI: readonly ColonnaStatica<RigaVoceSottofase>[] = [
  { chiave: 'voce', titolo: 'Sottofase (SR-01)', resa: (r) => r.voce },
  { chiave: 'censita', titolo: "Censita nell'anagrafica", resa: (r) => r.censita ?? NON_CENSITA },
  { chiave: 'esito', titolo: 'Esito', resa: (r) => (r.censita === null ? NON_CENSITA : (r.esito ?? <AssenzaMotivata dato={{ motivo: 'NON_VALORIZZATO' }} />)) },
  { chiave: 'voceDomande', titolo: 'Domande della voce', resa: (r) => <ValoreMotivato dato={r.domandeVoce} resa={numero} />, numerica: true },
  { chiave: 'censitaDomande', titolo: 'Domande della sottofase censita', resa: (r) => <DomandeCensita d={r.domandeCensita} />, numerica: true },
];

const COLONNE_ALTRE: readonly ColonnaStatica<SottofaseCensita>[] = [
  { chiave: 'codice', titolo: 'Codice', resa: (a) => a.codice },
  { chiave: 'descrizione', titolo: 'Descrizione', resa: (a) => a.descrizione },
  { chiave: 'esito', titolo: 'Esito', resa: (a) => a.esito ?? <AssenzaMotivata dato={{ motivo: 'NON_VALORIZZATO' }} /> },
  { chiave: 'domande', titolo: 'Domande', resa: (a) => <ValoreMotivato dato={a.domande} resa={numero} />, numerica: true },
];

/** Le tabelle della card: le voci di SR-01 e, se ci sono, le altre sottofasi dell'anagrafica. */
function TabelleSottofasi({ s, titolo }: { s: Sottofasi; titolo: string }) {
  const altre = altreSottofasi(s);
  return (
    <>
      <TabellaStatica caption={`${titolo}: la sottofase di SR-01 è l'intestazione di riga; la voce conta le domande distinte di tutte le sottofasi che la abbinano, la sottofase censita (la prima per codice) le sue sole domande`} colonne={COLONNE_VOCI} righe={righeVoci(s)} chiaveRiga={(r) => r.chiave} />
      {altre.length > 0 && <TabellaStatica caption="Altre sottofasi dell'anagrafica: nessuna voce di SR-01 le prende (codice libero), ciascuna con le sue domande" colonne={COLONNE_ALTRE} righe={altre} chiaveRiga={(a) => a.codice} />}
    </>
  );
}

interface PropsCard {
  tipo: TipoDomanda;
  s: Sottofasi;
  criteri: CriteriProcedurali;
  /** Il codice dell'intervento del dettaglio, nel nome dei file e dei dati. */
  codice?: string;
  /** "Modifica i filtri" dello stato senza domande nei filtri; assente (il dettaglio, filtri fissi) l'invito non c'e'. */
  onModifica?: () => void;
  conFiltri: boolean;
}

/** Gli stati dell'anagrafica vuota e dell'insieme filtrato senza domande, accanto alla card (le voci restano). */
function StatiDellAnagrafica({ s, onModifica, conFiltri }: Pick<PropsCard, 's' | 'onModifica' | 'conFiltri'>) {
  if (anagraficaVuota(s)) return <Vuoto>{ANAGRAFICA_VUOTA}</Vuoto>;
  if (!conFiltri || !senzaDomandeNeiFiltri(s)) return null;
  const testo = 'Nessuna domanda nelle sottofasi per i filtri scelti: le voci restano con 0.';
  return <Vuoto>{onModifica ? <VuotoConFiltri onModifica={onModifica}>{testo}</VuotoConFiltri> : testo}</Vuoto>;
}

export function CardSottofasi({ tipo, s, criteri, codice, onModifica, conFiltri }: PropsCard) {
  const titolo = `Domande ${diTipo(tipo)} per sottofase di ammissibilità`;
  const dati = useMemo(() => graficoSottofasi(s, tipo, titolo), [s, tipo, titolo]);
  const report = tipo === 'SOSTEGNO' ? 'sottofasiSostegno' : 'sottofasiPagamento';
  const di = codice ? ` di ${codice}` : '';
  return (
    <div>
      <StatiDellAnagrafica s={s} onModifica={onModifica} conFiltri={conFiltri} />
      <CardGrafico
        titolo={titolo}
        sottotitolo="Le voci di SR-01 con le domande della voce; nessun clic: l'elenco operativo non ha un filtro per sottofase."
        dati={dati}
        fonte={`Fonte: ${tipo === 'SOSTEGNO' ? 'TX-0031' : 'TX-0032'} (voci e altre sottofasi; perimetro della risposta). PNG: l'immagine del grafico, solo quando c'è; CSV e XLSX: l'export del report coi filtri, una riga per voce di SR-01 con la sottofase censita, poi le altre sottofasi.`}
        scaricamenti={fileReport(report, `${titolo}${di}`, criteri)}
        oggettoDati={`${OGGETTO_FILE[report]}${di}`}
        oggettoPng={`il grafico ${titolo}${di}`}
        tabella={<TabelleSottofasi s={s} titolo={titolo} />}
      />
    </div>
  );
}
