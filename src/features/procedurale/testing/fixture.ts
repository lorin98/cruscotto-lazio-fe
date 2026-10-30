// fixture.ts — risposte di prova del procedurale nella forma del contratto (TX-0024..TX-0032), per i test dei
// componenti e delle pagine e per il dev server. Le domande sono quelle degli scenari di accettazione del backend
// (handover/acceptance/procedurale-scenarios.json: SC-PC_FILTRI, SC-PC_AMMESSE, SC-PC_STATI_SOSTEGNO,
// SC-PC_STATI_PAGAMENTO, SC-PC_FILTRO_STATO, SC-PC_IN_COMPILAZIONE, SC-PC_SOTTOFASI, SC-PC_SOTTOFASI_FILTRI; per le
// determine di una domanda, dal fisico il 29/10/2026, quelli di SC-PC_DETERMINA, SC-PC_DETERMINA_NESSUNA e
// SC-PC_DETERMINA_TIPO; le Unit Amount sono del fisico): nessun dato reale. I report si calcolano da quelle domande coi
// parametri della query (intervento, os, og, op, stato), come il backend: righe per intervento selezionato in ordine di
// codice, voci di SR-01 nell'ordine del catalogo, altri stati per codice, totali del backend; cosi' i test di pagina
// non ricevono lo stesso corpo per ogni query (lezione della review del fisico). Le varianti (non rilasciate, atto di
// concessione) sono opzioni dei calcoli.
import type {
  DetermineDomanda,
  DistribuzioneStati,
  DomandeAmmesse,
  DomandeAmmesseRiga,
  FiltriProcedurali,
  RiepilogoProcedurale,
  SottofasiAmmissibilita,
  StatiAreaProgrammazione,
  StatiDomande,
  VoceStato,
} from '../api';

type Dato = { valore: number | null; motivo: string | null; fonte: string | null };
const v = (valore: number): Dato => ({ valore, motivo: null, fonte: null });
const NV: Dato = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
const senzaFonte = (fonte: string): Dato => ({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte });

export const ULTIMI = [
  { flusso: 'ASR2_DS20', conclusoIl: '2026-03-02T09:30:00Z' },
  { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
];

/** Gli interventi selezionabili (SC-PC_FILTRI, senza AT001) con i loro obiettivi e il perimetro INTERVENTO.PERIMETRO. */
const INTERVENTI = [
  { codice: 'SRA01', descrizione: 'Produzione integrata', os: 'OS4', og: 'OG2', op: 'OP1', perimetro: 'SIGC sì' },
  { codice: 'SRD01', descrizione: 'Investimenti produttivi agricoli per la competitività', os: 'OS4', og: 'OG2', op: 'OP1', perimetro: 'SIGC no' },
  { codice: 'SRD02', descrizione: 'Investimenti produttivi agricoli per ambiente, clima e benessere animale', os: 'OS5', og: 'OG3', op: 'OP2', perimetro: null },
] as const;

/** TX-0024: interventi, obiettivi e ultimo dato sincronizzato (SC-PC_FILTRI, SC-PC_ULTIMO_DATO). */
export const VALORI: FiltriProcedurali = {
  perimetro: 'REGIONALE',
  interventi: INTERVENTI.map((i) => ({ chiave: i.codice, descrizione: i.descrizione })),
  obiettiviSpecifici: [
    { chiave: 'OS4', descrizione: null },
    { chiave: 'OS5', descrizione: null },
  ],
  obiettiviGenerali: ['OG2', 'OG3'],
  obiettiviPolicy: ['OP1', 'OP2'],
  ultimiDatiSincronizzati: ULTIMI,
};

/** Le dieci voci di RF025 (TX-0025) col testo di SR-01, nell'ordine del catalogo. */
const VOCI_AREA = [
  ['PRESENTATA', 'presentata'],
  ['ISTRUTTORIA', 'istruttoria'],
  ['AMMESSA', 'ammessa'],
  ['AMMISSIBILE_NON_FINANZIABILE', 'ammissibile ma non finanziabile'],
  ['NON_AMMISSIBILE', 'non ammissibile'],
  ['DECADENZA_TOTALE', 'decadenza totale'],
  ['DECADENZA_PARZIALE', 'decadenza parziale'],
  ['RINUNCIATA', 'rinunciata'],
  ['ANNULLATA_SU_SIAN', 'annullata su SIAN'],
  ['RETTIFICATA_SOSTITUITA', 'rettificata/sostituita'],
] as const;

/** TX-0025 (SC-PC_STATI_AREA): le dieci voci, poi REVOCATA (osservata fuori catalogo), poi SENZA_STATO. */
export const STATI_AREA: StatiAreaProgrammazione = {
  perimetro: 'REGIONALE',
  valori: [
    ...VOCI_AREA.map(([chiave, descrizione]) => ({ chiave, descrizione, origine: 'CATALOGO' as const })),
    { chiave: 'REVOCATA', descrizione: 'Revocata', origine: 'OSSERVATO' },
    { chiave: 'SENZA_STATO', descrizione: 'senza stato area programmazione', origine: 'SENZA_STATO' },
  ],
};

/** Le undici voci di RF027 e le cinque di RF028 col testo di SR-01, nell'ordine del catalogo. */
const VOCI_SOSTEGNO = [
  ['IN_COMPILAZIONE', 'in compilazione'],
  ['STAMPATO', 'stampato'],
  ['FIRMATA', 'firmata'],
  ['RILASCIATO', 'rilasciato'],
  ['IN_ISTRUTTORIA_ENTE_COMPETENTE', 'in istruttoria presso ente competente'],
  ['PRESO_IN_CARICO', 'preso in carico'],
  ['NON_RICEVIBILE', 'non ricevibile'],
  ['ISTRUTTORIA_AMMISSIBILE', 'istruttoria atto ammissibile al finanziamento'],
  ['ISTRUTTORIA_NON_AMMISSIBILE', 'istruttoria atto non ammissibile al finanziamento'],
  ['RICEVIBILE', 'ricevibile'],
  ['ESITO_POSITIVO_TUTTE_LE_MISURE', 'istruttoria con esito positivo su tutte le misure'],
] as const;
const VOCI_PAGAMENTO = [
  ['IN_COMPILAZIONE', 'in compilazione'],
  ['RILASCIATO', 'rilasciato'],
  ['PROPOSTA_DA_REVISIONARE', 'proposta al pagamento - da revisionare'],
  ['PROPOSTA_AUTORIZZAZIONE_ENTE', 'proposta al pagamento - autorizzazione ente territoriale'],
  ['FINANZIATO', 'finanziato'],
] as const;

/** Una domanda corrente degli scenari: tipo, stato SIAN (voce o codice fuori catalogo), stato area, importi della determina. */
interface Domanda {
  id: string;
  intervento: string;
  tipo: 'SOSTEGNO' | 'PAGAMENTO';
  stato: string;
  area: string | null;
  richiesto?: number;
  ammesso?: number;
  atto?: boolean;
  rilasciata?: boolean;
}

/** SC-PC_FILTRI e SC-PC_STATI_PAGAMENTO: S1..S4 di sostegno, P1..P3 di pagamento CSR-DP (SRD02 senza domande). */
const DOMANDE: readonly Domanda[] = [
  { id: 'S1', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'RILASCIATO', area: 'AMMESSA', richiesto: 1000, ammesso: 800, atto: true },
  { id: 'S2', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'ESITO_POSITIVO_TUTTE_LE_MISURE', area: 'AMMESSA', richiesto: 500 },
  { id: 'S3', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'RILASCIATO', area: null },
  { id: 'P1', intervento: 'SRD01', tipo: 'PAGAMENTO', stato: 'PROPOSTA_DA_REVISIONARE', area: 'REVOCATA' },
  { id: 'P2', intervento: 'SRD01', tipo: 'PAGAMENTO', stato: 'PROPOSTA_AUTORIZZAZIONE_ENTE', area: null },
  { id: 'P3', intervento: 'SRD01', tipo: 'PAGAMENTO', stato: 'PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE', area: null },
  { id: 'S4', intervento: 'SRA01', tipo: 'SOSTEGNO', stato: 'SOSPESA', area: 'AMMESSA' },
];

/**
 * SC-PC_IN_COMPILAZIONE (variante): domande di sostegno di SRD01 non ancora rilasciate, senza stato area programmazione:
 * due in compilazione e tre stampate, e una stampata rilasciata (la parte che l'elenco apre: Stampato 4, di cui 3).
 */
const NON_RILASCIATE: readonly Domanda[] = [
  { id: 'N1', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'IN_COMPILAZIONE', area: null, rilasciata: false },
  { id: 'N2', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'IN_COMPILAZIONE', area: null, rilasciata: false },
  { id: 'N3', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'STAMPATO', area: null, rilasciata: false },
  { id: 'N4', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'STAMPATO', area: null, rilasciata: false },
  { id: 'N5', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'STAMPATO', area: null, rilasciata: false },
  { id: 'N6', intervento: 'SRD01', tipo: 'SOSTEGNO', stato: 'STAMPATO', area: null },
];

/** Le varianti dei calcoli: domande non rilasciate (SC-PC_IN_COMPILAZIONE), atto di concessione nel database (SC-PC_AMMESSE). */
export interface Varianti {
  nonRilasciate?: boolean;
  atto?: boolean;
}

const tutti = (p: URLSearchParams, k: string) => p.getAll(k);

/** Gli interventi selezionati dai filtri (intervento, os, og, op: in E fra filtri, in O nello stesso filtro), per codice. */
function interventiSelezionati(p: URLSearchParams): (typeof INTERVENTI)[number][] {
  const passa = (k: 'os' | 'og' | 'op', i: (typeof INTERVENTI)[number]) => tutti(p, k).length === 0 || tutti(p, k).includes(i[k]);
  return INTERVENTI.filter((i) => (tutti(p, 'intervento').length === 0 || tutti(p, 'intervento').includes(i.codice)) && passa('os', i) && passa('og', i) && passa('op', i));
}

/** Le domande dell'universo filtrato: degli interventi selezionati e dello stato area scelto (maiuscole indifferenti). */
function domandeDi(p: URLSearchParams, codice: string, x: Varianti): Domanda[] {
  const stato = tutti(p, 'stato').map((s) => s.toUpperCase());
  const conStato = (d: Domanda) => stato.length === 0 || stato.includes(d.area ?? 'SENZA_STATO');
  return [...DOMANDE, ...(x.nonRilasciate ? NON_RILASCIATE : [])].filter((d) => d.intervento === codice && conStato(d));
}

const conta = (ds: readonly Domanda[], f: (d: Domanda) => boolean) => ds.filter(f).length;

/** Una voce di SR-01: IN_COMPILAZIONE senza domande non rilasciate del tipo nel database e' null con FONTE_NON_ATTIVA. */
function voce(ds: readonly Domanda[], [stato, descrizione]: readonly [string, string], conFonte: boolean): VoceStato {
  if (stato === 'IN_COMPILAZIONE' && !conFonte) return { stato, descrizione, domande: null, domandeNonRilasciate: 0, motivo: 'FONTE_NON_ATTIVA', fonte: 'DOMANDE_IN_COMPILAZIONE' };
  const della = ds.filter((d) => d.stato === stato);
  return { stato, descrizione, domande: della.length, domandeNonRilasciate: conta(della, (d) => d.rilasciata === false), motivo: null, fonte: null };
}

/** La distribuzione degli stati di un tipo di domanda: voci di SR-01, altri stati per codice, totale e di cui non rilasciate. */
function distribuzioneStati(ds: readonly Domanda[], voci: readonly (readonly [string, string])[], conFonte: boolean): DistribuzioneStati {
  const catalogo = new Set(voci.map(([s]) => s));
  const codici = [...new Set(ds.filter((d) => !catalogo.has(d.stato)).map((d) => d.stato))].sort();
  const altriStati = codici.map((codice) => ({ codice, descrizione: codice, domande: conta(ds, (d) => d.stato === codice), domandeNonRilasciate: 0 }));
  const conVoce = voci.map((x) => voce(ds, x, conFonte));
  const contate = ds.filter((d) => conFonte || d.stato !== 'IN_COMPILAZIONE');
  return { voci: conVoce, altriStati, senzaStato: 0, totale: contate.length, domandeNonRilasciate: conta(contate, (d) => d.rilasciata === false) };
}

/** La distribuzione dello stato area programmazione: le dieci voci, gli stati osservati, le domande senza stato. */
function distribuzioneArea(ds: readonly Domanda[]): DistribuzioneStati {
  const rilasciate = ds.filter((d) => d.rilasciata !== false);
  const catalogo = new Set<string>(VOCI_AREA.map(([s]) => s));
  const osservati = [...new Set(rilasciate.filter((d) => d.area !== null && !catalogo.has(d.area)).map((d) => d.area as string))].sort();
  return {
    voci: VOCI_AREA.map(([stato, descrizione]) => ({ stato, descrizione, domande: conta(rilasciate, (d) => d.area === stato), domandeNonRilasciate: 0, motivo: null, fonte: null })),
    altriStati: osservati.map((codice) => ({ codice, descrizione: 'Revocata', domande: conta(rilasciate, (d) => d.area === codice), domandeNonRilasciate: 0 })),
    senzaStato: conta(rilasciate, (d) => d.area === null),
    totale: rilasciate.length,
    domandeNonRilasciate: 0,
  };
}

/** Somma di distribuzioni dello stesso catalogo (il totale del backend, calcolato qui solo per la fixture). */
function somma(ds: readonly DistribuzioneStati[], modello: DistribuzioneStati): DistribuzioneStati {
  const codici = [...new Set(ds.flatMap((d) => d.altriStati.map((a) => a.codice)))].sort();
  const n = (f: (d: DistribuzioneStati) => number) => ds.reduce((t, d) => t + f(d), 0);
  return {
    voci: modello.voci.map((m, k) => ({ ...m, domande: m.domande === null ? null : n((d) => d.voci[k].domande ?? 0), domandeNonRilasciate: n((d) => d.voci[k].domandeNonRilasciate) })),
    altriStati: codici.map((codice) => ({ codice, descrizione: codice === 'REVOCATA' ? 'Revocata' : codice, domande: n((d) => d.altriStati.find((a) => a.codice === codice)?.domande ?? 0), domandeNonRilasciate: 0 })),
    senzaStato: n((d) => d.senzaStato),
    totale: n((d) => d.totale),
    domandeNonRilasciate: n((d) => d.domandeNonRilasciate),
  };
}

/** TX-0027 o TX-0028 coi parametri della query. */
export function statiPer(tipo: 'SOSTEGNO' | 'PAGAMENTO', p: URLSearchParams, x: Varianti = {}): StatiDomande {
  const voci = tipo === 'SOSTEGNO' ? VOCI_SOSTEGNO : VOCI_PAGAMENTO;
  const conFonte = tipo === 'SOSTEGNO' && !!x.nonRilasciate;
  const righe = interventiSelezionati(p).map((i) => ({ codiceIntervento: i.codice, stati: distribuzioneStati(domandeDi(p, i.codice, x).filter((d) => d.tipo === tipo), voci, conFonte) }));
  const vuota = distribuzioneStati([], voci, conFonte);
  return { perimetro: 'REGIONALE', tipoDomanda: tipo, righe, totale: somma(righe.map((r) => r.stati), vuota) };
}

/** La somma di un importo delle ammesse: 0 senza ammesse, NON_VALORIZZATO se nessuna lo valorizza (D-03 Rev. 1-3). */
function importo(ammesse: readonly Domanda[], campo: 'richiesto' | 'ammesso'): Dato {
  const valori = ammesse.map((d) => d[campo]).filter((x): x is number => x !== undefined);
  if (ammesse.length > 0 && valori.length === 0) return NV;
  return v(valori.reduce((t, x) => t + x, 0));
}

function rigaAmmesse(i: (typeof INTERVENTI)[number], ds: readonly Domanda[], x: Varianti): DomandeAmmesseRiga {
  const ammesse = ds.filter((d) => d.area === 'AMMESSA');
  return {
    codiceIntervento: i.codice,
    perimetroIntervento: i.perimetro,
    attivato: ds.some((d) => d.tipo === 'SOSTEGNO' && d.rilasciata !== false),
    domandeAmmesse: ammesse.length,
    conAttoConcessione: x.atto ? v(conta(ds, (d) => d.tipo === 'SOSTEGNO' && d.atto === true)) : senzaFonte('ATTO_CONCESSIONE'),
    importoRichiesto: importo(ammesse, 'richiesto'),
    contributoAmmesso: importo(ammesse, 'ammesso'),
  };
}

const sommaImporti = (righe: readonly DomandeAmmesseRiga[], campo: 'importoRichiesto' | 'contributoAmmesso'): Dato => {
  const valori = righe.map((r) => r[campo].valore).filter((x): x is number => typeof x === 'number');
  return valori.length === 0 ? NV : v(valori.reduce((t, x) => t + x, 0));
};

/** TX-0026 coi parametri della query (SC-PC_AMMESSE: senza atto nel database la fonte dell'atto non e' attiva). */
export function ammessePer(p: URLSearchParams, x: Varianti = {}): DomandeAmmesse {
  const righe = interventiSelezionati(p).map((i) => rigaAmmesse(i, domandeDi(p, i.codice, x), x));
  const conAtto = x.atto ? v(righe.reduce((t, r) => t + (r.conAttoConcessione.valore ?? 0), 0)) : senzaFonte('ATTO_CONCESSIONE');
  return {
    perimetro: 'REGIONALE',
    righe,
    totale: {
      domandeAmmesse: righe.reduce((t, r) => t + r.domandeAmmesse, 0),
      conAttoConcessione: conAtto,
      importoRichiesto: sommaImporti(righe, 'importoRichiesto'),
      contributoAmmesso: sommaImporti(righe, 'contributoAmmesso'),
      interventiAttivati: righe.filter((r) => r.attivato).length,
      interventiPerimetroUfficiale: righe.length,
    },
  };
}

/** TX-0029 coi parametri della query: le misure di TX-0026 e le tre distribuzioni per intervento, poi i totali. */
export function riepilogoPer(p: URLSearchParams, x: Varianti = {}): RiepilogoProcedurale {
  const ammesse = ammessePer(p, x);
  const sostegno = statiPer('SOSTEGNO', p, x);
  const pagamento = statiPer('PAGAMENTO', p, x);
  const aree = interventiSelezionati(p).map((i) => distribuzioneArea(domandeDi(p, i.codice, x)));
  const righe = (ammesse.righe ?? []).map((r, k) => ({ ammesse: r, statiAreaProgrammazione: aree[k], statiSostegno: sostegno.righe?.[k]?.stati, statiPagamento: pagamento.righe?.[k]?.stati }));
  return { perimetro: 'REGIONALE', righe, totale: { ammesse: ammesse.totale, statiAreaProgrammazione: somma(aree, distribuzioneArea([])), statiSostegno: sostegno.totale, statiPagamento: pagamento.totale } };
}

/** Le sei voci di RF031 e le sette di RF032 col testo di SR-01. */
const VOCI_SOTTOFASI_SOSTEGNO = [
  ['DS_DOCUMENTI_ALLEGATI', "congruenza e conformita' documenti allegati"],
  ['DS_CRITERI_AMMISSIBILITA', "criteri di ammissibilita'"],
  ['DS_VOCI_DI_SPESA', "ammissibilita' voci di spesa"],
  ['DS_CRITERI_SELEZIONE', 'criteri di selezione'],
  ['DS_INDICATORI_RISULTATO', 'indicatori di risultato'],
  ['DS_PERSONALIZZAZIONI_REGIONALI', 'valutazioni personalizzazioni regionali'],
] as const;
const VOCI_SOTTOFASI_PAGAMENTO = [
  ['DP_DOCUMENTI_ALLEGATI', "congruenza e conformita' documenti allegati"],
  ['DP_CRITERI_AMMISSIBILITA', "criteri di ammissibilita'"],
  ['DP_CRITERI_SELEZIONE', 'criteri di selezione'],
  ['DP_INDICATORI_RISULTATO', 'indicatori di risultato'],
  ['DP_PERSONALIZZAZIONI_REGIONALI', 'valutazioni personalizzazioni regionali'],
  ['DP_GARANZIE_PAGAMENTI', 'garanzie e pagamenti'],
  ['DP_ANTIMAFIA', 'antimafia'],
] as const;

/** TX-0031 (SC-PC_SOTTOFASI): la prima voce censita per descrizione, nessuna domanda di sostegno legata a una sottofase. */
export function sottofasiSostegnoPer(): SottofasiAmmissibilita {
  const fonte = senzaFonte('SOTTOFASI_DOMANDA');
  return {
    perimetro: 'REGIONALE',
    tipoDomanda: 'SOSTEGNO',
    voci: VOCI_SOTTOFASI_SOSTEGNO.map(([fase, descrizione], k) => ({ fase, descrizione, domande: fonte, censita: k === 0 ? { codice: 'CONGRUENZA', descrizione: "Congruenza e conformita' documenti allegati", esito: null, domande: fonte } : null })),
    altre: [],
  };
}

/**
 * TX-0032 (SC-PC_SOTTOFASI con la seconda sottofase, SC-PC_SOTTOFASI_FILTRI): la voce Antimafia censita con ANTIMAFIA
 * (la prima per codice, P1 e P3) e conta le domande distinte delle due sottofasi (P1, P2, P3: 3); GAR (P4), GAR2 e la
 * verifica DURC fra le altre. Coi filtri le domande sono quelle dell'insieme: SRD01 come sopra, gli altri 0 (non
 * FONTE_NON_ATTIVA); stato SENZA_STATO = P2, REVOCATA = P1 (nella censita).
 */
export function sottofasiPagamentoPer(p: URLSearchParams): SottofasiAmmissibilita {
  const conSrd01 = interventiSelezionati(p).some((i) => i.codice === 'SRD01');
  const stato = tutti(p, 'stato').map((s) => s.toUpperCase());
  const dentro = (area: string | null) => conSrd01 && (stato.length === 0 || stato.includes(area ?? 'SENZA_STATO'));
  const domande = { P1: dentro('REVOCATA'), P2: dentro(null), P3: dentro(null), P4: dentro(null) };
  const n = (...ids: (keyof typeof domande)[]) => v(ids.filter((id) => domande[id]).length);
  return {
    perimetro: 'REGIONALE',
    tipoDomanda: 'PAGAMENTO',
    voci: VOCI_SOTTOFASI_PAGAMENTO.map(([fase, descrizione]) =>
      fase === 'DP_ANTIMAFIA' ? { fase, descrizione, domande: n('P1', 'P2', 'P3'), censita: { codice: 'ANTIMAFIA', descrizione: 'Verifica antimafia', esito: 'OK', domande: n('P1', 'P3') } } : { fase, descrizione, domande: NV, censita: null },
    ),
    altre: [
      { codice: 'DURC', descrizione: 'Verifica DURC', esito: null, domande: v(0) },
      { codice: 'GAR', descrizione: 'Garanzie e pagamenti', esito: null, domande: n('P4') },
      { codice: 'GAR2', descrizione: 'garanzie e pagamenti', esito: null, domande: v(0) },
    ],
  };
}

// ---------------------------------------------------------------- determine di una domanda (TX-0020, dal fisico il 29/10/2026)

/** SC-PC_DETERMINA: G00003 corrente, G00002 fonte del comparto, G00001 fonte dello stato area programmazione. */
export const DETERMINE: DetermineDomanda = {
  codiceABarre: '54810769585',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: false,
  perimetro: 'REGIONALE',
  corrente: { valore: { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false }, motivo: null },
  elenco: [
    { codice: 'G00003', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: false },
    { codice: 'G00002', data: '2025-06-30', fonteStatoAreaProgrammazione: false, fonteComparto: true },
    { codice: 'G00001', data: '2025-01-10', fonteStatoAreaProgrammazione: true, fonteComparto: false },
  ],
};

/** SC-PC_DETERMINA_NESSUNA: nessuna determina aperta. */
export const DETERMINE_NESSUNA: DetermineDomanda = {
  codiceABarre: '54810000001',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: false,
  perimetro: 'REGIONALE',
  corrente: { valore: null, motivo: 'NON_VALORIZZATO' },
  elenco: [],
};

/** SC-PC_DETERMINA_NESSUNA, seconda domanda: chiusa con la sua determina (la PAGAMENTO 34810063735 con G00016 di SC-PC_DETERMINA_TIPO). */
export const DETERMINE_CHIUSA: DetermineDomanda = {
  codiceABarre: '34810063735',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: true,
  perimetro: 'REGIONALE',
  corrente: { valore: { codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }, motivo: null },
  elenco: [{ codice: 'G00016', data: '2025-03-01', fonteStatoAreaProgrammazione: true, fonteComparto: true }],
};

/**
 * SC-PC_DETERMINA_TIPO: il codice 34810022870 e' di una domanda di SOSTEGNO (G00010) e di una di PAGAMENTO (G00011);
 * TX-0020 risponde con la PAGAMENTO (fra le aperte la PAGAMENTO). La data della determina non e' nello scenario.
 */
export const DETERMINE_TIPO: DetermineDomanda = {
  codiceABarre: '34810022870',
  tipoDomanda: 'PAGAMENTO',
  domandaChiusa: false,
  perimetro: 'REGIONALE',
  corrente: { valore: { codice: 'G00011', data: '2025-05-20', fonteStatoAreaProgrammazione: true, fonteComparto: true }, motivo: null },
  elenco: [{ codice: 'G00011', data: '2025-05-20', fonteStatoAreaProgrammazione: true, fonteComparto: true }],
};

/**
 * SC-PC_DETERMINA_TIPO: il codice 34810063736 e' di una SOSTEGNO con la determina G00017 e di una PAGAMENTO aperta arrivata
 * dopo, senza righe; TX-0020 risponde con la SOSTEGNO (prima la domanda con righe aperte). La data non e' nello scenario.
 */
export const DETERMINE_TIPO_SOSTEGNO: DetermineDomanda = {
  codiceABarre: '34810063736',
  tipoDomanda: 'SOSTEGNO',
  domandaChiusa: false,
  perimetro: 'REGIONALE',
  corrente: { valore: { codice: 'G00017', data: '2025-04-15', fonteStatoAreaProgrammazione: true, fonteComparto: true }, motivo: null },
  elenco: [{ codice: 'G00017', data: '2025-04-15', fonteStatoAreaProgrammazione: true, fonteComparto: true }],
};
