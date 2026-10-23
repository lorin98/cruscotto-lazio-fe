// Test L1 delle funzioni PURE del procedurale (lib/): grant e pagine, criteri nell'indirizzo, link dello uiplan, testi,
// distribuzioni per stato, KPI, sottofasi, Unit Amount, riepilogo, dettaglio dell'intervento e builder dei grafici.
// Chiamate dirette, niente render; i dati sono quelli degli scenari del backend (fixture del procedurale).
import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { GRANT, puoLeggere } from '../src/features/procedurale/lib/grant';
import { PAGINE_PROCEDURALE, PERCORSI, pagineVisibili, ricercaConservata } from '../src/features/procedurale/lib/pagine';
import {
  ETICHETTA_STATO,
  chiaveStatoValida,
  conCriteri,
  conFiltri,
  criteriDaRicerca,
  criteriDelReport,
  criteriDellIntervento,
  criteriNellaBarra,
  criteriUnitAmount,
  etichettaStatoArea,
  nessunFiltro,
  ricercaDaCriteri,
  ricercaDeiCriteri,
  statoAmmette,
  testiCriteri,
  testoStato,
} from '../src/features/procedurale/lib/criteri';
import {
  LINK_ELENCO,
  LINK_STATO,
  apreConAtto,
  apreLaVoce,
  apreLaVoceDellArea,
  apreLeAmmesse,
  indirizzoElenco,
  motivoSenzaLink,
  paginaDegliStati,
  panoramicaDellIntervento,
  percorsoIntervento,
  puntoDelloStato,
  quanteDomande,
  testiLinkAmmesse,
  testiLinkArea,
  testiLinkConAtto,
  testiLinkStato,
} from '../src/features/procedurale/lib/collegamenti';
import { NON_DISPONIBILE_BREVE, STATO_NON_APPLICATO, nellaTuaArea, perimetroDelle, pillPerimetro, resaAssenza, siNo, testoNessunIntervento, testoVuoto } from '../src/features/procedurale/lib/formato';
import {
  SENZA_STATO,
  codiciAltriStati,
  diTipo,
  domandeAltroStato,
  righeConLaVoce,
  righeStati,
  rilasciate,
  senzaDomande,
  testoAltriStati,
  titoloBreve,
  voceDi,
  vociDegliStati,
  vociDellArea,
} from '../src/features/procedurale/lib/stati';
import type { VoceDistribuzione } from '../src/features/procedurale/lib/stati';
import { kpiDegliStati, kpiDelleAmmesse, kpiDomandeDellIntervento, kpiInterventi, notaContributo } from '../src/features/procedurale/lib/kpi';
import { altreSottofasi, anagraficaVuota, etichettaVoce, righeVoci, senzaDomandeNeiFiltri, testoCensita } from '../src/features/procedurale/lib/sottofasi';
import { CAMPI_PAGATO, assenzaPagato, chiaveUnitAmount, etichettaUnitAmount, notaPagato, valoreDi } from '../src/features/procedurale/lib/unitAmount';
import { TITOLI_SEZIONI, codiceDellaRiga, colonneVoci, distribuzioneDi, domandeDellaVoce, righeRiepilogo, senzaStatoDi, testoConNonRilasciate } from '../src/features/procedurale/lib/riepilogo';
import {
  SENZA_DATI,
  TITOLI_SCHEDE,
  badgeIntervento,
  schedaAttiva,
  schedeVisibili,
  senzaDomande as senzaDomandeDellIntervento,
  sopratitoloIntervento,
  testoNessunaDomanda,
  testoSenzaStato,
  titoloDocumentoIntervento,
  titoloIntervento,
} from '../src/features/procedurale/lib/intervento';
import {
  MISURA_DOMANDE,
  attoSenzaFonte,
  graficoAmmesseConAtto,
  graficoArea,
  graficoImporti,
  graficoRiepilogo,
  graficoSottofasi,
  graficoStati,
  graficoUnitAmount,
  pagatoSenzaFonte,
  sottofasiSenzaFonte,
  tabellaStati,
  testoDomande,
  testoImporto,
  testoNonRilasciate,
} from '../src/features/procedurale/lib/grafici';
import { STATI_AREA, ammessePer, riepilogoPer, sottofasiPagamentoPer, sottofasiSostegnoPer, statiPer, unitAmountPer } from '../src/features/procedurale/testing/fixture';
import type { RigaAmmesse } from '../src/features/procedurale/lib/dto';

const q = (s = '') => new URLSearchParams(s);
const n = (s: string) => s.replace(/\s/g, ' ');
const SOSTEGNO = statiPer('SOSTEGNO', q());
const SOSTEGNO_NR = statiPer('SOSTEGNO', q(), { nonRilasciate: true });
const PAGAMENTO = statiPer('PAGAMENTO', q());
const AMMESSE = ammessePer(q());
const RIEPILOGO = riepilogoPer(q());
const RIGA = (codice: string) => (AMMESSE.righe ?? []).find((r) => r.codiceIntervento === codice) as RigaAmmesse;

describe('procedurale: grant e pagine (menu e Home, G1)', () => {
  it('grant verbatim del catalogo e predicato hasGrant; senza stato nessun grant', () => {
    expect(Object.values(GRANT)).toEqual([
      'csr.tx-0024.read',
      'csr.tx-0025.read',
      'csr.tx-0026.read',
      'csr.tx-0027.read',
      'csr.tx-0028.read',
      'csr.tx-0029.read',
      'csr.tx-0030.read',
      'csr.tx-0031.read',
      'csr.tx-0032.read',
      'csr.tx-0056.read',
    ]);
    const status = { authenticated: true, user: { username: 'u', profile: 'p', roles: ['csr.tx-0027.read'] } };
    expect([puoLeggere(status, 'statiSostegno'), puoLeggere(status, 'ammesse'), puoLeggere(undefined, 'statiSostegno')]).toEqual([true, false, false]);
  });

  it('pagine nell ordine del menu dei wireframe, visibili con almeno una delle letture; i filtri restano dal menu', () => {
    expect(PAGINE_PROCEDURALE.map((p) => [p.voceMenu, p.percorso])).toEqual([
      ['Panoramica', '/procedurale'],
      ['Stati delle domande di sostegno', '/procedurale/stati-sostegno'],
      ['Stati delle domande di pagamento', '/procedurale/stati-pagamento'],
      ['Domande ammesse', '/procedurale/ammesse'],
      ['Sottofasi di ammissibilità', '/procedurale/sottofasi'],
      ['Unit Amount', '/procedurale/unit-amount'],
      ['Riepilogo per intervento', '/procedurale/riepilogo'],
    ]);
    expect(pagineVisibili((g) => g === GRANT.statiPagamento).map((p) => p.percorso)).toEqual(['/procedurale', '/procedurale/stati-pagamento']);
    expect(pagineVisibili((g) => g === GRANT.sottofasiPagamento).map((p) => p.percorso)).toEqual(['/procedurale/sottofasi']);
    expect(pagineVisibili(() => false)).toEqual([]);
    expect(ricercaConservata('?intervento=SRD01&azione=3&stato=AMMESSA&campagna=2025')).toBe('intervento=SRD01&stato=AMMESSA');
    expect(PERCORSI.interventi).toBe('/procedurale/interventi');
  });
});

describe('procedurale: criteri nell indirizzo (RF024: intervento, OS, OG, OP e stato; mai l azione portante)', () => {
  it('lettura e scrittura: chiavi note, formato ammesso, senza azione; lo stato con le chiavi di TX-0025', () => {
    expect(criteriDaRicerca('?intervento=SRD01&os=OS4&azione=3&stato=AMMESSA&stato=senza_stato&stato=%20&stato=<b>')).toEqual({ intervento: ['SRD01'], os: ['OS4'], stato: ['AMMESSA', 'senza_stato'] });
    expect(criteriDaRicerca('')).toEqual({});
    expect(ricercaDaCriteri({ stato: ['REVOCATA'], op: ['OP1'], intervento: ['SRA01', 'SRD01'] })).toBe('intervento=SRA01&intervento=SRD01&op=OP1&stato=REVOCATA');
    expect(ricercaDeiCriteri('?stato=AMMESSA&og=OG2')).toBe('og=OG2&stato=AMMESSA');
    expect(conCriteri('/procedurale/riepilogo', { stato: ['AMMESSA'] })).toBe('/procedurale/riepilogo?stato=AMMESSA');
    expect(conCriteri('/procedurale', {})).toBe('/procedurale');
    expect([conFiltri({}), conFiltri({ stato: ['AMMESSA'] }), conFiltri({ intervento: [] })]).toEqual([false, true, false]);
  });

  it('chiavi di stato: voci, codici osservati e SIAN fuori catalogo; niente spazi ai bordi, markup o testo lungo', () => {
    for (const ok of ['AMMESSA', 'SENZA_STATO', 'REVOCATA', 'NUL', 'SOSPESA', 'PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE', 'RETTIFICATA - SOSTITUITA']) expect(chiaveStatoValida(ok)).toBe(true);
    for (const no of ['', ' AMMESSA', 'AMMESSA ', '<x>', 'a'.repeat(101), null, undefined]) expect(chiaveStatoValida(no)).toBe(false);
  });

  it('criteri delle letture: i cinque filtri dei report, i quattro delle Unit Amount, quelli del dettaglio; Azzera', () => {
    const c = { intervento: ['SRD01'], os: ['OS4'], azione: ['3'], stato: ['AMMESSA'] };
    expect(criteriDelReport(c)).toEqual({ intervento: ['SRD01'], os: ['OS4'], stato: ['AMMESSA'] });
    expect(criteriUnitAmount(c)).toEqual({ intervento: ['SRD01'], os: ['OS4'] });
    expect(criteriDellIntervento('SRD01', ['REVOCATA'])).toEqual({ intervento: ['SRD01'], stato: ['REVOCATA'] });
    expect(criteriDellIntervento('SRD01', [])).toEqual({ intervento: ['SRD01'] });
    expect([nessunFiltro(c, false), nessunFiltro(c, true), nessunFiltro({ os: ['OS4'] }, true)]).toEqual([{}, { stato: ['AMMESSA'] }, {}]);
  });

  it('chip della barra: il programma col codice, lo stato con la descrizione di TX-0025; ogni chip coi criteri senza di lui', () => {
    const chip = criteriNellaBarra({ intervento: ['SRD01'], stato: ['AMMESSA', 'REVOCATA'] }, STATI_AREA.valori);
    expect(chip.map((c) => [c.chiave, c.etichetta, c.valore])).toEqual([
      ['intervento:SRD01', 'Intervento', 'SRD01'],
      ['stato:AMMESSA', ETICHETTA_STATO, 'Ammessa'],
      ['stato:REVOCATA', ETICHETTA_STATO, 'Revocata'],
    ]);
    expect(chip.map((c) => c.senza)).toEqual([{ stato: ['AMMESSA', 'REVOCATA'] }, { intervento: ['SRD01'], stato: ['REVOCATA'] }, { intervento: ['SRD01'], stato: ['AMMESSA'] }]);
    expect(criteriNellaBarra({ stato: ['AMMESSA'] }, undefined)[0].valore).toBe('AMMESSA');
    expect(criteriNellaBarra({ stato: ['AMMESSA'] }, undefined)[0].senza).toEqual({});
    expect(criteriNellaBarra({ os: ['OS4'], stato: ['AMMESSA'] }, undefined, false).map((c) => c.chiave)).toEqual(['os:OS4']);
    expect(testiCriteri({ op: ['OP1'], stato: ['SENZA_STATO'] }, STATI_AREA.valori)).toEqual(['OP: OP1', 'Stato area programmazione: Senza stato area programmazione']);
    expect(testiCriteri({ op: ['OP1'], stato: ['SENZA_STATO'] }, STATI_AREA.valori, false)).toEqual(['OP: OP1']);
  });

  it('voci di TX-0025 nel pannello e nei chip; il filtro per stato ammette una voce (vuoto = tutte, maiuscole indifferenti)', () => {
    const [catalogo, , , , , , , , , , osservato, senza] = STATI_AREA.valori ?? [];
    expect([etichettaStatoArea(catalogo), etichettaStatoArea(osservato), etichettaStatoArea(senza)]).toEqual([
      'Presentata',
      'Revocata (stato osservato fuori catalogo)',
      'Senza stato area programmazione (nessuna determina aperta)',
    ]);
    expect([testoStato('AMMESSA', STATI_AREA.valori), testoStato('BOH', STATI_AREA.valori)]).toEqual(['Ammessa', 'BOH']);
    expect([statoAmmette({}, 'AMMESSA'), statoAmmette({ stato: ['ammessa'] }, 'AMMESSA'), statoAmmette({ stato: ['REVOCATA'] }, 'AMMESSA')]).toEqual([true, true, false]);
  });
});

describe('procedurale: link dello uiplan (fail-closed, solo i parametri della query del link)', () => {
  it('dettaglio dell intervento col codice codificato e lo stato; panoramica e stati coi criteri', () => {
    expect(percorsoIntervento('SRD01', ['AMMESSA'])).toBe('/procedurale/interventi/SRD01?stato=AMMESSA');
    expect(percorsoIntervento('SR/D01')).toBe('/procedurale/interventi/SR%2FD01');
    expect(panoramicaDellIntervento('SRD01', ['REVOCATA'])).toBe('/procedurale?intervento=SRD01&stato=REVOCATA');
    expect(paginaDegliStati('statiPagamento', { os: ['OS4'], stato: ['AMMESSA'] })).toBe('/procedurale/stati-pagamento?os=OS4&stato=AMMESSA');
  });

  it('elenco operativo: la query di ogni link verbatim dallo uiplan, coi criteri della pagina e il punto del report', () => {
    expect(LINK_ELENCO['elenco-con-atto-riepilogo']).toEqual(['concessione', 'tipo', 'voceProgrammazione', 'intervento']);
    expect(LINK_STATO.PAGAMENTO).toEqual({ pagina: 'elenco-stato-pagamento', riga: 'elenco-stato-pagamento-riga', intervento: 'elenco-stato-pagamento-intervento' });
    expect([puntoDelloStato('SOSTEGNO', 'RILASCIATO'), puntoDelloStato('PAGAMENTO', 'FINANZIATO', 'SRD01')]).toEqual([{ statoSostegno: 'RILASCIATO' }, { statoPagamento: 'FINANZIATO', intervento: 'SRD01' }]);
    const c = { intervento: ['SRD01', 'SRA01'], os: ['OS4'], stato: ['AMMESSA', 'SENZA_STATO'] };
    expect(indirizzoElenco('elenco-ammesse-panoramica', c, { voceProgrammazione: 'AMMESSA' })).toBe('/elenco-operativo/domande?voceProgrammazione=AMMESSA&intervento=SRD01&intervento=SRA01&os=OS4');
    expect(indirizzoElenco('elenco-con-atto', c, { concessione: true })).toBe(
      '/elenco-operativo/domande?concessione=true&tipo=SOSTEGNO&voceProgrammazione=AMMESSA&voceProgrammazione=SENZA_STATO&intervento=SRD01&intervento=SRA01&os=OS4',
    );
    expect(indirizzoElenco('elenco-stato-sostegno-riga', c, { statoSostegno: 'RILASCIATO', intervento: 'SRD01' })).toBe('/elenco-operativo/domande?statoSostegno=RILASCIATO&voceProgrammazione=AMMESSA&voceProgrammazione=SENZA_STATO&intervento=SRD01');
    expect(indirizzoElenco('elenco-stato-pagamento', {}, { statoPagamento: 'PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE' })).toBe(
      '/elenco-operativo/domande?statoPagamento=PROPOSTO+AL+PAGAMENTO-ESTRAZ.+CAMPIONE-DA+ESEGUIRE',
    );
    expect(indirizzoElenco('elenco-area-programmazione-intervento', c, { voceProgrammazione: SENZA_STATO, intervento: 'SRD01' })).toBe('/elenco-operativo/domande?voceProgrammazione=SENZA_STATO&intervento=SRD01');
    // fail-closed: un codice o una chiave che non si possono esprimere non danno un link piu' largo
    expect(indirizzoElenco('elenco-ammesse-riga', c, { voceProgrammazione: 'AMMESSA', intervento: 'SR/D01' })).toBeNull();
    expect(indirizzoElenco('elenco-stato-sostegno', c, { statoSostegno: ' <x>' })).toBeNull();
  });

  it('quando i link ci sono: ammesse con un numero e lo stato che ammette AMMESSA, atto con la fonte, voce con le rilasciate', () => {
    expect([apreLeAmmesse({}, 2), apreLeAmmesse({}, 0), apreLeAmmesse({ stato: ['REVOCATA'] }, 2), apreLeAmmesse({}, undefined)]).toEqual([true, false, false, false]);
    expect([apreConAtto({ valore: 1 }), apreConAtto({ valore: 0 }), apreConAtto({ valore: null, motivo: 'FONTE_NON_ATTIVA' }), apreConAtto(undefined)]).toEqual([true, false, false, false]);
    const [inCompilazione, stampato, , rilasciato] = vociDegliStati(SOSTEGNO_NR.righe?.[1]?.stati);
    expect([apreLaVoce(inCompilazione), apreLaVoce(stampato), apreLaVoce(rilasciato)]).toEqual([false, true, true]);
    expect(apreLaVoce(vociDegliStati(SOSTEGNO.totale)[0])).toBe(false);
  });

  it('il motivo della voce senza link: fonte, domande, rilasciate (solo gli stati), codice di stato non esprimibile', () => {
    const voci = vociDegliStati(SOSTEGNO.totale);
    const nr = vociDegliStati(SOSTEGNO_NR.righe?.[1]?.stati);
    expect([motivoSenzaLink(voci[0], true), motivoSenzaLink(voci[2], true), motivoSenzaLink(nr[0], true)]).toEqual(['nessun link (fonte non attiva)', 'nessuna domanda', 'nessuna domanda rilasciata']);
    // un codice osservato accentato: il backend lo accetta com'e' nel database, l'indirizzo dell'elenco no
    const accentata: VoceDistribuzione = { chiave: 'REVOCATÀ', etichetta: 'Revocatà (stato osservato fuori catalogo)', domande: 2, nonRilasciate: 0, altro: true };
    expect(indirizzoElenco('elenco-area-programmazione-panoramica', {}, { voceProgrammazione: accentata.chiave })).toBeNull();
    expect([motivoSenzaLink(accentata, false), motivoSenzaLink(accentata, true)]).toEqual(["non apribile nell'elenco (codice di stato non esprimibile)", "non apribile nell'elenco (codice di stato non esprimibile)"]);
    // l'area programmazione non ha domande non rilasciate: mai "nessuna domanda rilasciata"
    const area = vociDellArea(RIEPILOGO.totale?.statiAreaProgrammazione);
    expect(area.map((v) => motivoSenzaLink(v, false))).not.toContain('nessuna domanda rilasciata');
    expect([apreLaVoceDellArea(area[2]), apreLaVoceDellArea(area[0]), apreLaVoceDellArea(accentata)]).toEqual([true, false, true]);
  });

  it('testi dei link: quante domande apre, la parte rilasciata nel testo visibile, la voce o il codice', () => {
    expect([quanteDomande(1, 'ammessa', 'ammesse'), quanteDomande(12000, 'ammessa', 'ammesse'), quanteDomande(2)]).toEqual(['la domanda ammessa', 'le 12.000 domande ammesse', 'le 2 domande']);
    const voci = vociDegliStati(SOSTEGNO_NR.righe?.[1]?.stati);
    expect(testiLinkStato(voci[1], 'SOSTEGNO', 'SRD01')).toEqual({ testo: "Apri nell'elenco (1 rilasciata)", descrizione: 'la domanda di sostegno rilasciata di SRD01 nello stato Stampato' });
    expect(testiLinkStato(voci[3], 'SOSTEGNO')).toEqual({ descrizione: 'le 2 domande di sostegno nello stato Rilasciato' });
    const altro = vociDegliStati(PAGAMENTO.totale).at(-1);
    expect(altro && testiLinkStato(altro, 'PAGAMENTO')).toEqual({ descrizione: 'la domanda di pagamento nello stato PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE' });
    const area = vociDellArea(RIEPILOGO.righe?.[1]?.statiAreaProgrammazione);
    expect(testiLinkArea(area[2], 'SRD01')).toEqual({ descrizione: 'le 2 domande di SRD01 con stato area programmazione Ammessa' });
    expect(testiLinkArea(area.at(-1) ?? area[0])).toEqual({ descrizione: 'le 3 domande senza stato area programmazione' });
    expect(testiLinkAmmesse(2, 'SRD01')).toEqual({ descrizione: 'le 2 domande ammesse di SRD01' });
    expect(testiLinkConAtto(1, 'SRD01')).toEqual({ descrizione: 'la domanda di sostegno con atto di concessione di SRD01' });
  });
});

describe('procedurale: distribuzioni per stato (SC-PC_STATI_SOSTEGNO, SC-PC_STATI_PAGAMENTO, SC-PC_IN_COMPILAZIONE)', () => {
  it('le undici voci nell ordine del backend, poi gli altri stati; In compilazione senza fonte: null, mai 0 (scelta 5)', () => {
    const voci = vociDegliStati(SOSTEGNO.totale);
    expect(voci.map((v) => v.chiave)).toEqual([
      'IN_COMPILAZIONE',
      'STAMPATO',
      'FIRMATA',
      'RILASCIATO',
      'IN_ISTRUTTORIA_ENTE_COMPETENTE',
      'PRESO_IN_CARICO',
      'NON_RICEVIBILE',
      'ISTRUTTORIA_AMMISSIBILE',
      'ISTRUTTORIA_NON_AMMISSIBILE',
      'RICEVIBILE',
      'ESITO_POSITIVO_TUTTE_LE_MISURE',
      'SOSPESA',
    ]);
    expect(voci[0]).toEqual({ chiave: 'IN_COMPILAZIONE', etichetta: 'In compilazione', domande: null, nonRilasciate: null, assenza: { motivo: 'FONTE_NON_ATTIVA', fonte: 'DOMANDE_IN_COMPILAZIONE' }, altro: false });
    expect(voci[3]).toMatchObject({ etichetta: 'Rilasciato', domande: 2, nonRilasciate: 0 });
    expect(voci.at(-1)).toEqual({ chiave: 'SOSPESA', etichetta: 'Altro stato: SOSPESA (codice SIAN fuori catalogo)', domande: 1, nonRilasciate: 0, altro: true });
    expect([rilasciate(voci[0]), rilasciate(voci[3])]).toEqual([null, 2]);
    expect(vociDegliStati(undefined)).toEqual([]);
    expect(SOSTEGNO.totale?.totale).toBe(4);
  });

  it('con le non rilasciate In compilazione conta, il di cui e la parte rilasciata per voce', () => {
    const srd01 = vociDegliStati(SOSTEGNO_NR.righe?.[1]?.stati);
    expect(srd01.slice(0, 2).map((v) => [v.etichetta, v.domande, v.nonRilasciate, rilasciate(v)])).toEqual([
      ['In compilazione', 2, 2, 0],
      ['Stampato', 4, 3, 1],
    ]);
    expect([SOSTEGNO_NR.totale?.totale, SOSTEGNO_NR.totale?.domandeNonRilasciate]).toEqual([10, 5]);
  });

  it('stato area programmazione: le dieci voci, gli stati osservati, le domande senza stato', () => {
    const voci = vociDellArea(RIEPILOGO.righe?.[1]?.statiAreaProgrammazione);
    expect(voci.map((v) => [v.etichetta, v.domande])).toEqual([
      ['Presentata', 0],
      ['Istruttoria', 0],
      ['Ammessa', 2],
      ['Ammissibile ma non finanziabile', 0],
      ['Non ammissibile', 0],
      ['Decadenza totale', 0],
      ['Decadenza parziale', 0],
      ['Rinunciata', 0],
      ['Annullata su SIAN', 0],
      ['Rettificata/sostituita', 0],
      ['Revocata (stato osservato fuori catalogo)', 1],
      ['Senza stato area programmazione (nessuna determina aperta)', 3],
    ]);
    expect(voci.at(-1)?.chiave).toBe(SENZA_STATO);
    expect(vociDellArea(undefined)).toEqual([]);
  });

  it('intestazioni brevi solo se parte della descrizione; tipo, altri stati, voce e righe della tabella per intervento', () => {
    expect(titoloBreve({ stato: 'PROPOSTA_AUTORIZZAZIONE_ENTE', descrizione: 'proposta al pagamento - autorizzazione ente territoriale' })).toBe('Autorizzazione ente');
    expect(titoloBreve({ stato: 'PROPOSTA_AUTORIZZAZIONE_ENTE', descrizione: 'altro testo' })).toBe('Altro testo');
    expect(titoloBreve({ stato: 'RILASCIATO', descrizione: 'rilasciato' })).toBe('Rilasciato');
    expect([diTipo('SOSTEGNO'), diTipo('PAGAMENTO')]).toEqual(['di sostegno', 'di pagamento']);
    expect([testoAltriStati(SOSTEGNO.totale), testoAltriStati(PAGAMENTO.righe?.[0]?.stati), testoAltriStati(undefined)]).toEqual(['SOSPESA 1', 'nessuno', 'nessuno']);
    expect(codiciAltriStati(PAGAMENTO.totale)).toEqual(['PROPOSTO AL PAGAMENTO-ESTRAZ. CAMPIONE-DA ESEGUIRE']);
    expect([domandeAltroStato(SOSTEGNO.righe?.[0]?.stati, 'SOSPESA'), domandeAltroStato(SOSTEGNO.righe?.[1]?.stati, 'SOSPESA')]).toEqual([1, 0]);
    expect(voceDi(PAGAMENTO.totale, 'PROPOSTA_DA_REVISIONARE')?.domande).toBe(1);
    expect(righeStati(SOSTEGNO).map((r) => r.codiceIntervento)).toEqual(['SRA01', 'SRD01', 'SRD02']);
    expect(righeStati({ righe: [{ stati: SOSTEGNO.totale }] })).toEqual([]);
    expect([senzaDomande(SOSTEGNO), senzaDomande(statiPer('SOSTEGNO', q('os=OS5'))), senzaDomande({ righe: [] })]).toEqual([false, true, true]);
    expect(righeConLaVoce(righeStati(SOSTEGNO), 'SOSPESA').map((r) => r.codiceIntervento)).toEqual(['SRA01']);
    expect(righeConLaVoce(righeStati(SOSTEGNO), 'RILASCIATO').map((r) => r.codiceIntervento)).toEqual(['SRD01']);
  });

  it('il filtro per stato restringe l universo: le non rilasciate contano solo con SENZA_STATO (SC-PC_FILTRO_STATO)', () => {
    const ammessa = statiPer('SOSTEGNO', q('stato=AMMESSA'), { nonRilasciate: true });
    expect(ammessa.totale?.totale).toBe(3);
    expect(ammessa.totale?.domandeNonRilasciate).toBe(0);
    const senza = statiPer('SOSTEGNO', q('stato=SENZA_STATO'), { nonRilasciate: true });
    expect([senza.totale?.totale, senza.totale?.domandeNonRilasciate]).toEqual([7, 5]);
  });
});

describe('procedurale: testi, KPI e assenze', () => {
  it('pill del perimetro per le domande, le sottofasi e i dati di programma; il filtro per stato non applicato', () => {
    expect([pillPerimetro('REGIONALE', 'domande'), pillPerimetro('ADA', 'domande'), pillPerimetro('ADA', 'sottofasi'), pillPerimetro(undefined, 'domande'), pillPerimetro(undefined, 'programma')]).toEqual([
      'Perimetro: regionale',
      'Perimetro: ADA del tuo profilo (solo le domande della tua ADA)',
      'Perimetro: ADA del tuo profilo per le domande; anagrafica delle sottofasi regionale',
      null,
      'Perimetro: regionale (dati di programma, uguali per ogni profilo)',
    ]);
    expect([perimetroDelle([undefined, 'ADA', 'REGIONALE']), perimetroDelle([undefined])]).toEqual(['ADA', undefined]);
    expect(STATO_NON_APPLICATO).toBe('Il filtro per stato area programmazione non si applica alle Unit Amount');
  });

  it('stati vuoti: coi filtri dicono di cambiarli, senza no; col perimetro ADA le domande dicono la propria area', () => {
    expect(testoVuoto('Nessuna domanda di sostegno', true)).toBe('Nessuna domanda di sostegno per i filtri scelti.');
    expect(testoVuoto('Nessuna domanda', false)).toBe('Nessuna domanda.');
    expect(testoVuoto('Nessuna domanda di pagamento CSR-DP', true, 'ADA')).toBe('Nessuna domanda di pagamento CSR-DP nella tua area (perimetro ADA) per i filtri scelti.');
    expect([nellaTuaArea('ADA'), nellaTuaArea('REGIONALE'), nellaTuaArea(undefined)]).toEqual([' nella tua area (perimetro ADA)', '', '']);
  });

  it('nessun intervento: il testo dei wireframe, mai il perimetro ADA (gli interventi sono dati di programma, SC-PC_SCOPE_P4)', () => {
    expect([testoNessunIntervento(true), testoNessunIntervento(false)]).toEqual(['Nessun intervento per i filtri scelti.', 'Nessun intervento.']);
  });

  it('si e no, e le assenze: brevi con la fonte non attiva dove il motivo e detto altrove, altrimenti complete', () => {
    expect([siNo(true), siNo(false)]).toEqual(['sì', 'no']);
    expect(resaAssenza({ motivo: 'FONTE_NON_ATTIVA', fonte: 'PAGATO_PER_UNIT_AMOUNT' }, true)).toBe(NON_DISPONIBILE_BREVE);
    expect(resaAssenza({ motivo: 'FONTE_NON_ATTIVA', fonte: 'PAGATO_PER_UNIT_AMOUNT' }, false)).toEqual({ disponibile: false, testo: 'non disponibile', nota: 'fonte pagato per Unit Amount non attiva' });
    expect(resaAssenza({ motivo: 'NON_VALORIZZATO' }, true)).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'il dato non è presente nella fonte' });
  });

  it('KPI delle ammesse (SC-PC_AMMESSE): senza atto la fonte non attiva in una frase, la quota del contributo solo con i due importi', () => {
    const t = AMMESSE.totale ?? {};
    const kpi = kpiDelleAmmesse(t, { criteri: {}, link: { ammesse: 'elenco-ammesse-panoramica', conAtto: 'elenco-con-atto-panoramica' } });
    expect(kpi.map((k) => [k.etichetta, n(k.valore ?? k.assente ?? '')])).toEqual([
      ['Domande ammesse', '3'],
      ['Domande con atto di concessione', 'Non disponibile: fonte atto di concessione non attiva'],
      ['Contributo ammesso', '800,00 €'],
    ]);
    expect(kpi[0].elenco).toEqual({ id: 'elenco-ammesse-panoramica', punto: { voceProgrammazione: 'AMMESSA', intervento: undefined }, descrizione: 'le domande ammesse' });
    expect(kpi[1].elenco).toBeUndefined();
    expect(n(kpi[2].nota ?? '')).toBe('su importo richiesto 1500,00 €: 53,3 %');
    const conAtto = kpiDelleAmmesse(RIGA('SRD01'), { criteri: { stato: ['REVOCATA'] }, link: { ammesse: 'elenco-ammesse-intervento', conAtto: 'elenco-con-atto-intervento' }, intervento: 'SRD01' });
    expect(conAtto[0].elenco).toBeUndefined();
    const atto = kpiDelleAmmesse(ammessePer(q('intervento=SRD01'), { atto: true }).righe?.[0] as RigaAmmesse, { criteri: {}, link: { ammesse: 'elenco-ammesse-intervento', conAtto: 'elenco-con-atto-intervento' }, intervento: 'SRD01' });
    expect(atto[1]).toMatchObject({ valore: '1', elenco: { id: 'elenco-con-atto-intervento', punto: { concessione: true, intervento: 'SRD01' }, descrizione: 'le domande di sostegno con atto di concessione di SRD01' } });
    expect(n(notaContributo({ valore: null, motivo: 'NON_VALORIZZATO' }, { valore: 3 }))).toBe('importo richiesto: non valorizzato (il dato non è presente nella fonte)');
    expect(n(notaContributo({ valore: 0 }, { valore: 0 }))).toBe('importo richiesto: 0,00 €');
    expect(kpiInterventi(t)).toMatchObject({ etichetta: 'Interventi attivati', valore: '2 su 3' });
  });

  it('KPI degli stati e del dettaglio: domande e di cui non rilasciate, la regola del filtro per stato', () => {
    expect(kpiDegliStati(SOSTEGNO_NR.totale, 'SOSTEGNO', false).map((k) => [k.etichetta, k.valore])).toEqual([
      ['Domande di sostegno', '10'],
      ['Di cui non rilasciate', '5'],
    ]);
    expect(kpiDegliStati(PAGAMENTO.totale, 'PAGAMENTO', true)[1].nota).toMatch(/^non ancora nell'elenco operativo\. Con il filtro per stato area programmazione/);
    expect(kpiDegliStati(PAGAMENTO.totale, 'PAGAMENTO', false)[0].nota).toBe('CSR-DP: voci, altri stati e domande non rilasciate comprese');
    const sostegno = SOSTEGNO_NR.righe?.[1]?.stati;
    const pagamento = PAGAMENTO.righe?.[1]?.stati;
    expect(kpiDomandeDellIntervento(sostegno, pagamento)).toMatchObject({ etichetta: 'Domande di sostegno', valore: '9', nota: 'di cui non rilasciate 5; domande di pagamento 3' });
    expect(kpiDomandeDellIntervento(undefined, pagamento)).toMatchObject({ etichetta: 'Domande di pagamento', valore: '3', nota: 'di cui non rilasciate 0' });
    expect(kpiDomandeDellIntervento(sostegno, undefined)?.nota).toBe('di cui non rilasciate 5');
    expect(kpiDomandeDellIntervento(undefined, undefined)).toBeNull();
  });
});

describe('procedurale: sottofasi (SC-PC_SOTTOFASI, SC-PC_SOTTOFASI_FILTRI) e Unit Amount (SC-PC_UNIT_AMOUNT)', () => {
  it('righe delle voci e altre sottofasi nell ordine della risposta; la voce conta le domande distinte, la censita le sue', () => {
    const pag = sottofasiPagamentoPer(q());
    const righe = righeVoci(pag);
    expect(righe.map((r) => r.voce)).toEqual(["Congruenza e conformita' documenti allegati", "Criteri di ammissibilita'", 'Criteri di selezione', 'Indicatori di risultato', 'Valutazioni personalizzazioni regionali', 'Garanzie e pagamenti', 'Antimafia']);
    expect(righe.at(-1)).toEqual({ chiave: 'DP_ANTIMAFIA', voce: 'Antimafia', censita: 'ANTIMAFIA - Verifica antimafia', esito: 'OK', domandeVoce: { valore: 3, motivo: null, fonte: null }, domandeCensita: { valore: 2, motivo: null, fonte: null } });
    expect(righe[5]).toMatchObject({ censita: null, esito: null, domandeCensita: null });
    expect(altreSottofasi(pag).map((a) => a.codice)).toEqual(['DURC', 'GAR', 'GAR2']);
    expect(altreSottofasi({})).toEqual([]);
    expect([testoCensita({ codice: 'GAR', descrizione: 'Garanzie', domande: { valore: 1 } }), etichettaVoce({ descrizione: 'antimafia' })]).toEqual(['GAR - Garanzie', 'Antimafia']);
  });

  it('anagrafica vuota senza errore; con la fonte attiva un insieme filtrato senza domande e a 0, non senza fonte', () => {
    expect(anagraficaVuota({ voci: [{ fase: 'X', descrizione: 'x', domande: { valore: null, motivo: 'NON_VALORIZZATO' }, censita: null }], altre: [] })).toBe(true);
    expect(anagraficaVuota(sottofasiPagamentoPer(q()))).toBe(false);
    expect(senzaDomandeNeiFiltri(sottofasiPagamentoPer(q('intervento=SRA01')))).toBe(true);
    expect(senzaDomandeNeiFiltri(sottofasiPagamentoPer(q('intervento=SRD01')))).toBe(false);
    expect(senzaDomandeNeiFiltri(sottofasiSostegnoPer())).toBe(false);
    expect([sottofasiSenzaFonte(sottofasiSostegnoPer()), sottofasiSenzaFonte(sottofasiPagamentoPer(q('os=OS5')))]).toEqual([true, false]);
  });

  it('Unit Amount: chiave ed etichetta della riga; la nota unica e le celle brevi con la fonte del pagato non attiva (scelta 8)', () => {
    const [r] = unitAmountPer(q()).righe ?? [];
    expect([chiaveUnitAmount(r), etichettaUnitAmount(r)]).toEqual(['SRD01|UA1|2024', 'UA1 (SRD01, esercizio 2024)']);
    expect(chiaveUnitAmount({})).toBe('||');
    expect(CAMPI_PAGATO).toEqual(['importoPagato', 'percentualePagata', 'baseStorica']);
    expect(notaPagato(unitAmountPer(q()).righe ?? [])).toBe(
      'Importo pagato, percentuale pagata sul richiesto e base storica: non disponibili per tutte le Unit Amount (fonte pagato per Unit Amount non attiva). Nelle celle: "non disponibile".',
    );
    expect(notaPagato(unitAmountPer(q(), { pagato: true }).righe ?? [])).toBeNull();
    expect(assenzaPagato(r, 'baseStorica', true)).toBe(NON_DISPONIBILE_BREVE);
    // il drawer non arriva alla nota della tabella: col motivo
    expect(assenzaPagato(r, 'baseStorica', false)).toEqual({ disponibile: false, testo: 'non disponibile', nota: 'fonte pagato per Unit Amount non attiva' });
    const [, ua2] = unitAmountPer(q(), { pagato: true }).righe ?? [];
    expect(assenzaPagato(ua2, 'importoPagato', true)).toEqual({ disponibile: false, testo: 'non valorizzato', nota: 'il dato non è presente nella fonte' });
    expect([valoreDi({ valore: 3 }), valoreDi({ valore: null }), valoreDi(undefined)]).toEqual([3, null, null]);
  });
});

describe('procedurale: riepilogo per intervento (SC-PC_RIEPILOGO) e dettaglio dell intervento', () => {
  it('sezioni, colonne delle voci dal totale, valori della riga, righe col codice', () => {
    expect(Object.values(TITOLI_SEZIONI)).toEqual(['Domande ammesse', 'Area programmazione', 'Sostegno', 'Pagamento']);
    const riga = RIEPILOGO.righe?.[1];
    expect(distribuzioneDi(riga, 'pagamento')?.totale).toBe(3);
    expect(distribuzioneDi(RIEPILOGO.totale, 'area')?.senzaStato).toBe(3);
    expect(distribuzioneDi(undefined, 'sostegno')).toBeUndefined();
    expect(colonneVoci(RIEPILOGO.totale, 'pagamento').map((c) => [c.chiave, c.titolo, c.nomeEsteso])).toEqual([
      ['pagamento:IN_COMPILAZIONE', 'In compilazione', 'In compilazione (Pagamento)'],
      ['pagamento:RILASCIATO', 'Rilasciato', 'Rilasciato (Pagamento)'],
      ['pagamento:PROPOSTA_DA_REVISIONARE', 'Da revisionare', 'Da revisionare (Pagamento)'],
      ['pagamento:PROPOSTA_AUTORIZZAZIONE_ENTE', 'Autorizzazione ente', 'Autorizzazione ente (Pagamento)'],
      ['pagamento:FINANZIATO', 'Finanziato', 'Finanziato (Pagamento)'],
    ]);
    expect([domandeDellaVoce(riga?.statiSostegno, 'RILASCIATO'), domandeDellaVoce(riga?.statiSostegno, 'IN_COMPILAZIONE'), domandeDellaVoce(undefined, 'X')]).toEqual([2, null, null]);
    expect(righeRiepilogo(RIEPILOGO).map(codiceDellaRiga)).toEqual(['SRA01', 'SRD01', 'SRD02']);
    expect(righeRiepilogo({ righe: [{}] })).toEqual([]);
    expect([testoConNonRilasciate(riga?.statiSostegno), testoConNonRilasciate(undefined)]).toEqual(['3, di cui non rilasciate 0', '-']);
    expect([senzaStatoDi(riga), senzaStatoDi(RIEPILOGO.totale), senzaStatoDi(undefined)]).toEqual([3, 3, null]);
  });

  it('testata, badge, titolo del documento, schede per grant nell ordine del wireframe, scheda attiva, senza domande', () => {
    expect([titoloIntervento('SRD01', 'Investimenti'), titoloIntervento('SRD01', undefined), sopratitoloIntervento('SRD01'), titoloDocumentoIntervento('SRD01')]).toEqual([
      'SRD01 - Investimenti',
      'Intervento SRD01',
      'Intervento SRD01 - procedurale',
      'Intervento SRD01 - Procedurale',
    ]);
    expect(badgeIntervento(RIGA('SRD01'))).toEqual(['Perimetro: SIGC no', 'Attivato: sì']);
    expect(badgeIntervento(RIGA('SRD02'))).toEqual(['Perimetro: non valorizzato', 'Attivato: no']);
    expect(badgeIntervento(undefined)).toEqual([]);
    expect(Object.values(TITOLI_SCHEDE)).toEqual(['Stati delle domande', 'Area programmazione', 'Sottofasi', 'Unit Amount']);
    expect(schedeVisibili(() => true)).toEqual(['stati', 'area', 'sottofasi', 'unitAmount']);
    expect(schedeVisibili((l) => l === 'statiPagamento' || l === 'unitAmount')).toEqual(['stati', 'unitAmount']);
    expect([schedaAttiva(['stati', 'area'], 'area'), schedaAttiva(['stati'], 'area'), schedaAttiva(['stati', 'area'], null), schedaAttiva([], null)]).toEqual(['area', 'stati', 'stati', undefined]);
    const zero = ammessePer(q('intervento=SRD02')).righe?.[0];
    expect(senzaDomandeDellIntervento(zero, statiPer('SOSTEGNO', q('intervento=SRD02')).righe?.[0]?.stati, undefined)).toBe(true);
    expect(senzaDomandeDellIntervento(RIGA('SRD01'), undefined, undefined)).toBe(false);
    expect(senzaDomandeDellIntervento(undefined, undefined, undefined)).toBe(false);
    expect(SENZA_DATI).toMatch(/^Nessun dato per questo intervento nei report procedurali/);
  });

  it('nessuna domanda e barra senza stato: col perimetro ADA dicono la propria area (la regola di testoVuoto)', () => {
    expect([testoNessunaDomanda('SRD01', false, 'REGIONALE'), testoNessunaDomanda('SRD01', true, undefined)]).toEqual([
      'Nessuna domanda di SRD01 nei report procedurali.',
      'Nessuna domanda di SRD01 per lo stato area programmazione scelto.',
    ]);
    expect([testoNessunaDomanda('SRD01', false, 'ADA'), testoNessunaDomanda('SRD01', true, 'ADA')]).toEqual([
      'Nessuna domanda di SRD01 nella tua area (perimetro ADA).',
      'Nessuna domanda di SRD01 nella tua area (perimetro ADA) per lo stato area programmazione scelto.',
    ]);
    expect([testoSenzaStato('REGIONALE'), testoSenzaStato('ADA')]).toEqual(["Nessun filtro per stato: tutte le domande dell'intervento", "Nessun filtro per stato: tutte le domande dell'intervento nella tua ADA"]);
  });
});

describe('procedurale: builder dei grafici (tabella equivalente, valori assenti omessi e dichiarati)', () => {
  const serie = (o: unknown) => (o as { series: BarSeriesOption[] }).series;
  const descrizione = (o: unknown) => n((o as { aria: { label: { description: string } } }).aria.label.description);

  it('stati: barre orizzontali impilate rilasciate e non rilasciate (col tratteggio); In compilazione omessa e dichiarata', () => {
    const voci = vociDegliStati(SOSTEGNO_NR.righe?.[1]?.stati).filter((v) => (v.domande ?? 0) > 0);
    const g = graficoStati(voci, { titolo: 'Domande di sostegno per stato', caption: 'Domande di sostegno per stato', voce: 'Stato' }, { domande: 9, nonRilasciate: 5 });
    const [ril, nonRil] = serie(g.opzioni);
    expect(ril.data?.[1]).toEqual({ value: 1, name: 'Stampato', codice: 'STAMPATO', dettaglio: 'Stampato: 1 rilasciate' });
    expect((nonRil.itemStyle as { decal?: unknown }).decal).toBeTruthy();
    expect(descrizione(g.opzioni)).toBe('Domande di sostegno per stato: barre orizzontali impilate delle domande rilasciate e non ancora rilasciate per 4 stati: In compilazione 2 (di cui 2 non rilasciate), Stampato 4 (di cui 3 non rilasciate), Rilasciato 2, Istruttoria con esito positivo su tutte le misure 1.');
    expect(g.tabella.righe.at(-1)).toEqual(['Totale', '9', '5']);
    const senza = graficoStati(vociDegliStati(SOSTEGNO.totale), { titolo: 'T', caption: 'C', voce: 'Stato' });
    expect(senza.omessi).toEqual(['In compilazione: non disponibile (fonte domande in compilazione non attiva)']);
    expect(senza.tabella.righe[0]).toEqual(['In compilazione', 'non disponibile (fonte domande in compilazione non attiva)', 'non disponibile']);
    expect(graficoStati([vociDegliStati(SOSTEGNO.totale)[0]], { titolo: 'T', caption: 'C', voce: 'Stato' }).motivoAssenza).toBe('nessuno stato con le domande');
    expect(tabellaStati([], { titolo: 'T', caption: 'C', voce: 'Voce' })).toEqual({ caption: 'C', colonne: ['Voce', 'Domande', 'Di cui non rilasciate'], righe: [] });
    expect([testoDomande(vociDegliStati(SOSTEGNO.totale)[3]), testoNonRilasciate(vociDegliStati(SOSTEGNO.totale)[0])]).toEqual(['2', 'non disponibile']);
  });

  it('stato area programmazione: barre orizzontali con la chiave della voce, il totale nella tabella', () => {
    const g = graficoArea(vociDellArea(RIEPILOGO.totale?.statiAreaProgrammazione), 'Domande per stato area programmazione', 7);
    expect(serie(g.opzioni)[0].data?.[2]).toEqual({ value: 3, name: 'Ammessa', codice: 'AMMESSA', dettaglio: 'Ammessa: 3' });
    expect(g.tabella.righe.at(-1)).toEqual(['Totale', '7']);
    expect(graficoArea([], 'T').motivoAssenza).toBe('nessuna domanda per stato area programmazione');
  });

  it('importi e ammesse con atto per intervento: assenze dichiarate; senza la fonte dell atto la seconda serie omessa una volta', () => {
    const righe = AMMESSE.righe ?? [];
    const importi = graficoImporti(righe, 'Importo richiesto e contributo ammesso per intervento');
    expect(importi.omessi).toEqual(['SRA01, importo richiesto: non valorizzato (il dato non è presente nella fonte)', 'SRA01, contributo ammesso: non valorizzato (il dato non è presente nella fonte)']);
    expect(n(importi.tabella.righe[1].join('|'))).toBe('SRD01|1500,00 €|800,00 €');
    expect(n(testoImporto({ valore: 300 }))).toBe('300,00 €');
    const atto = graficoAmmesseConAtto(righe, 'Domande ammesse e con atto di concessione per intervento');
    expect(serie(atto.opzioni).map((s) => s.name)).toEqual(['Domande ammesse']);
    expect(atto.omessi).toEqual(['Domande con atto di concessione: non disponibile (fonte atto di concessione non attiva) per tutti gli interventi']);
    expect(atto.tabella.righe[1]).toEqual(['SRD01', '2', 'non disponibile (fonte atto di concessione non attiva)']);
    expect(attoSenzaFonte(righe)).toBe(true);
    expect(attoSenzaFonte([])).toBe(false);
    const conAtto = graficoAmmesseConAtto(ammessePer(q(), { atto: true }).righe ?? [], 'T');
    expect(serie(conAtto.opzioni).map((s) => s.name)).toEqual(['Domande ammesse', 'Con atto di concessione']);
    expect(MISURA_DOMANDE.descrizione).toBe('numeri di domande');
  });

  it('riepilogo: barre raggruppate di sostegno, pagamento CSR-DP e ammesse per intervento', () => {
    const g = graficoRiepilogo(RIEPILOGO.righe ?? [], 'Domande per intervento');
    expect(serie(g.opzioni).map((s) => s.name)).toEqual(['Domande di sostegno', 'Domande di pagamento CSR-DP', 'Domande ammesse']);
    expect(g.tabella.righe).toEqual([
      ['SRA01', '1', '0', '1'],
      ['SRD01', '3', '3', '2'],
      ['SRD02', '0', '0', '0'],
    ]);
    expect(graficoRiepilogo([{}], 'T').motivoAssenza).toBe('nessun intervento');
  });

  it('sottofasi: senza la fonte grafico non disponibile; con la fonte le voci censite, le non censite omesse e dichiarate', () => {
    const sostegno = graficoSottofasi(sottofasiSostegnoPer(), 'SOSTEGNO', 'Domande di sostegno per sottofase di ammissibilità');
    expect(sostegno.motivoAssenza).toBe('nessuna domanda di sostegno è legata a una sottofase (fonte sottofasi della domanda non attiva)');
    const pagamento = graficoSottofasi(sottofasiPagamentoPer(q()), 'PAGAMENTO', 'Domande di pagamento per sottofase di ammissibilità');
    expect(serie(pagamento.opzioni)[0].data).toEqual([{ value: 3, name: 'Antimafia', codice: 'DP_ANTIMAFIA', dettaglio: 'Antimafia: 3' }]);
    expect(pagamento.omessi).toHaveLength(6);
    expect(pagamento.omessi[0]).toBe("Congruenza e conformita' documenti allegati: non valorizzato (il dato non è presente nella fonte)");
    expect(graficoSottofasi({ voci: [] }, 'PAGAMENTO', 'T').motivoAssenza).toBe('nessuna voce censita');
  });

  it('Unit Amount: senza la fonte del pagato grafico non disponibile; con la fonte barre orizzontali raggruppate', () => {
    const righe = unitAmountPer(q()).righe ?? [];
    const senza = graficoUnitAmount(righe, 'Percentuale pagata per Unit Amount');
    expect(senza.motivoAssenza).toBe("nessuna Unit Amount ha ancora l'importo pagato (fonte pagato per Unit Amount non attiva)");
    expect(senza.tabella.righe[0]).toEqual(['UA1 (SRD01, esercizio 2024)', 'non disponibile (fonte pagato per Unit Amount non attiva)', 'non disponibile (fonte pagato per Unit Amount non attiva)']);
    expect(pagatoSenzaFonte(righe)).toBe(true);
    const con = graficoUnitAmount(unitAmountPer(q(), { pagato: true }).righe ?? [], 'Percentuale pagata per Unit Amount');
    const o = con.opzioni as { yAxis: { type: string; data: string[] } };
    expect(o.yAxis.type).toBe('category');
    expect(o.yAxis.data).toEqual(['UA1 (SRD01, esercizio 2024)', 'UA1 (SRD01, esercizio 2025)']);
    expect(serie(con.opzioni)[0].data?.[0]).toMatchObject({ value: 40, codice: 'SRD01|UA1|2024' });
  });
});
