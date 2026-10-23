import { describe, expect, it } from 'vitest';
import {
  CAMPI_ORDINABILI,
  FILTRI_DOMANDA,
  FILTRI_PAGAMENTO,
  conDimensione,
  conFiltro,
  conPagina,
  conValore,
  criteriDaRicerca,
  criteriEsportazione,
  criteriSinottico,
  dimensioneDi,
  fasciaRovesciata,
  filtriDellaDomanda,
  importoDaTesto,
  leggiFascia,
  numeroFiltri,
  ordinaPer,
  ordinamentoDi,
  ordinamentoPredefinito,
  paginaDi,
  ricercaDaCriteri,
  senzaFiltri,
  senzaOrdinamento,
  senzaValore,
  testoInviabile,
  testoOrdinamento,
  ultimaPagina,
  valoreAccettabile,
} from '../src/features/elenco-operativo/lib/criteri';
import {
  cellaImporto,
  etichettaEsito,
  etichettaTipo,
  importoConNota,
  perimetroDellaRisposta,
  siNo,
  testoAnnualita,
  testoAnno,
  testoAggregato,
  testoAtto,
  testoConteggio,
  testoQuotaPagata,
  testoResponsabile,
  testoSomma,
  testoSuperficie,
  quotaSu,
} from '../src/features/elenco-operativo/lib/formato';
import * as formatoElenco from '../src/features/elenco-operativo/lib/formato';
import { chipDeiCriteri, valoreLeggibile } from '../src/features/elenco-operativo/lib/chip';
import { ORDINAMENTO_COLONNA, ORDINAMENTO_COLONNA_PAGAMENTI, VISTE, vistaDi } from '../src/features/elenco-operativo/lib/viste';
import { filtroDalClic, filtroDellaVoce, graficoAmmessoPagato, graficoRipartizione, nomeVoce } from '../src/features/elenco-operativo/lib/grafici';
import {
  percorsoDettaglio,
  percorsoDomandeDeiPagamenti,
  percorsoDomandeDelBeneficiario,
  percorsoPagamentiDelleDomande,
  riferimentoValido,
  ritornoAllElenco,
  statoDiRitorno,
  statoElencoValido,
} from '../src/features/elenco-operativo/lib/collegamenti';
import { menoRecente, testoUltimiDati } from '../src/shared/lib/aggiornamento';
import { righeContesto } from '../src/shared/lib';
import uiplanElenco from '../plan/elenco-operativo/uiplan.json';
import { formatEuro } from '../src/shared/lib/format';

const euro = (valore: number | null, motivo: string | null = null) => ({ valore, motivo, fonte: null });

describe('elenco operativo, criteri nell indirizzo (D-02, D-04)', () => {
  it("legge solo i parametri dell'elenco, ripuliti, senza doppioni, singoli dove il contratto li vuole singoli", () => {
    const c = criteriDaRicerca('?intervento=SRA01&intervento=SRA01&intervento=%20SRD01%20&sigc=true&sigc=false&decreto=D84&x=1&testo=', 'domande');
    expect(c).toEqual({ intervento: ['SRA01', 'SRD01'], sigc: ['true'] });
    expect(criteriDaRicerca('?decreto=D84-1&esito=PAGATA', 'pagamenti')).toEqual({ decreto: ['D84-1'], esito: ['PAGATA'] });
  });

  it('scarta i valori con caratteri di controllo o troppo lunghi e tiene al piu 100 valori', () => {
    expect(valoreAccettabile('ROSSI\u0000')).toBe(false);
    expect(valoreAccettabile('a'.repeat(256))).toBe(false);
    expect(valoreAccettabile('  ')).toBe(false);
    const molti = Array.from({ length: 120 }, (_, k) => `intervento=S${k}`).join('&');
    expect(criteriDaRicerca(molti, 'domande').intervento).toHaveLength(100);
  });

  it("scrive l'indirizzo nell'ordine del contratto (stabile)", () => {
    expect(ricercaDaCriteri({ testo: ['rossi'], intervento: ['SRA01', 'SRD01'], pagina: ['2'] }, 'domande')).toBe('?intervento=SRA01&intervento=SRD01&testo=rossi&pagina=2');
    expect(ricercaDaCriteri({}, 'domande')).toBe('');
    expect(ricercaDaCriteri({ esito: ['PAGATA'], tipo: ['SOSTEGNO'] }, 'pagamenti')).toBe('?esito=PAGATA&tipo=SOSTEGNO');
  });

  it('cambiare un filtro riporta alla prima pagina; lista vuota toglie il filtro', () => {
    const c = { intervento: ['SRA01'], pagina: ['3'] };
    expect(conFiltro(c, 'anno', ['2025'])).toEqual({ intervento: ['SRA01'], anno: ['2025'] });
    expect(conFiltro(c, 'intervento', [])).toEqual({});
    expect(conFiltro(c, 'sigc', ['true', 'false'])).toEqual({ intervento: ['SRA01'], sigc: ['true'] });
    expect(conValore(c, 'intervento', 'SRD01')).toEqual({ intervento: ['SRA01', 'SRD01'] });
    expect(conValore(c, 'intervento', 'SRA01')).toEqual({ intervento: ['SRA01'] });
    expect(senzaValore({ intervento: ['SRA01', 'SRD01'] }, 'intervento', 'SRA01')).toEqual({ intervento: ['SRD01'] });
    expect(senzaValore({ intervento: ['SRA01'], anno: ['2025'] }, 'intervento')).toEqual({ anno: ['2025'] });
  });

  it('togliere tutti i filtri tiene dimensione e ordinamento; il conteggio esclude pagina e ordinamento', () => {
    const c = { intervento: ['SRA01', 'SRD01'], sigc: ['true'], dimensione: ['50'], ordina: ['cuaa:asc'], pagina: ['1'] };
    expect(senzaFiltri(c)).toEqual({ dimensione: ['50'], ordina: ['cuaa:asc'] });
    expect(numeroFiltri(c)).toBe(3);
    expect(numeroFiltri({})).toBe(0);
  });

  it('pagina e dimensione: predefinite, limiti, cambio di dimensione dalla prima pagina', () => {
    expect(paginaDi({})).toBe(0);
    expect(paginaDi({ pagina: ['4'] })).toBe(4);
    expect(paginaDi({ pagina: ['-1'] })).toBe(0);
    expect(dimensioneDi({})).toBe(25);
    expect(dimensioneDi({ dimensione: ['100'] })).toBe(100);
    expect(dimensioneDi({ dimensione: ['101'] })).toBe(25);
    expect(dimensioneDi({ dimensione: ['0'] })).toBe(25);
    // solo le dimensioni che la select offre (review v2 H-07)
    expect(dimensioneDi({ dimensione: ['7'] })).toBe(25);
    expect(criteriDaRicerca('?dimensione=7', 'domande')).toEqual({});
    expect(criteriDaRicerca('?dimensione=10', 'pagamenti')).toEqual({ dimensione: ['10'] });
    expect(conPagina({ pagina: ['2'] }, 0)).toEqual({});
    expect(conPagina({}, 3)).toEqual({ pagina: ['3'] });
    expect(conDimensione({ pagina: ['2'] }, 50)).toEqual({ dimensione: ['50'] });
    expect(conDimensione({ dimensione: ['50'] }, 25)).toEqual({});
  });

  it("ordinamento: elenco chiuso, predefinito sul primo campo, clic alterna il verso", () => {
    expect(ordinamentoDi({}, 'domande')).toEqual({ campo: 'codiceABarre', verso: 'asc' });
    expect(ordinamentoDi({ ordina: ['ammesso:desc'] }, 'domande')).toEqual({ campo: 'ammesso', verso: 'desc' });
    expect(ordinamentoDi({ ordina: ['inventato:asc'] }, 'domande')).toEqual({ campo: 'codiceABarre', verso: 'asc' });
    expect(ordinamentoDi({}, 'pagamenti')).toEqual({ campo: 'decreto', verso: 'asc' });
    expect(ordinaPer({ pagina: ['2'] }, 'domande', 'ammesso')).toEqual({ ordina: ['ammesso:asc'] });
    expect(ordinaPer({ ordina: ['ammesso:asc'] }, 'domande', 'ammesso')).toEqual({ ordina: ['ammesso:desc'] });
    expect(ordinaPer({ ordina: ['codiceABarre:desc'] }, 'domande', 'codiceABarre')).toEqual({});
    expect(ordinaPer({}, 'domande', 'recuperato')).toEqual({});
    expect(CAMPI_ORDINABILI.domande).toHaveLength(14);
  });

  it('sinottico, esportazione e passaggio fra elenchi prendono solo cio che serve', () => {
    const c = { intervento: ['SRA01'], decreto: ['D84'], esito: ['PAGATA'], pagina: ['2'], dimensione: ['50'], ordina: ['cuaa:asc'] };
    expect(criteriSinottico(c)).toEqual({ intervento: ['SRA01'], decreto: ['D84'], esito: ['PAGATA'] });
    expect(criteriEsportazione(c)).toEqual({ intervento: ['SRA01'], decreto: ['D84'], esito: ['PAGATA'], ordina: ['cuaa:asc'] });
    expect(filtriDellaDomanda(c)).toEqual({ intervento: ['SRA01'] });
  });

  it('drill-down dai report procedurali: le chiavi dei report restano nell indirizzo e passano al sinottico e fra elenchi', () => {
    const ricerca = '?voceProgrammazione=AMMESSA&statoSostegno=DECADENZA_TOTALE&statoPagamento=RILASCIATO&intervento=SRD01';
    const c = criteriDaRicerca(ricerca, 'domande');
    expect(c).toEqual({ intervento: ['SRD01'], statoSostegno: ['DECADENZA_TOTALE'], statoPagamento: ['RILASCIATO'], voceProgrammazione: ['AMMESSA'] });
    expect(criteriDaRicerca(ricerca, 'pagamenti')).toEqual(c);
    expect(ricercaDaCriteri(c, 'domande')).toBe(
      '?intervento=SRD01&statoSostegno=DECADENZA_TOTALE&statoPagamento=RILASCIATO&voceProgrammazione=AMMESSA',
    );
    expect(criteriSinottico(c)).toEqual(c);
    expect(filtriDellaDomanda(c)).toEqual(c);
    expect(numeroFiltri(c)).toBe(4);
  });

  it('testo libero e importi', () => {
    expect(testoInviabile('')).toBe(true);
    expect(testoInviabile('ro')).toBe(false);
    expect(testoInviabile('ros')).toBe(true);
    expect(testoInviabile('x'.repeat(101))).toBe(false);
    expect(importoDaTesto('1.234,56')).toBe('1234.56');
    expect(importoDaTesto('1234.5')).toBe('1234.5');
    expect(importoDaTesto('12.000')).toBe('12000');
    expect(importoDaTesto('100')).toBe('100');
    expect(importoDaTesto('dieci')).toBeNull();
    expect(importoDaTesto('-5')).toBeNull();
    expect(importoDaTesto('')).toBeNull();
  });

  it('fascia di importo letta coi due campi insieme (review v2 A-02)', () => {
    expect(leggiFascia('', '')).toEqual({ valida: true, da: null, a: null });
    expect(leggiFascia('1.000', '5.000')).toEqual({ valida: true, da: '1000', a: '5000' });
    expect(leggiFascia('10.000', '5.000')).toEqual({ valida: false, motivo: 'rovesciata' });
    expect(leggiFascia('dieci', '5')).toEqual({ valida: false, motivo: 'importo', campi: ['da'] });
    expect(leggiFascia('x', 'y')).toEqual({ valida: false, motivo: 'importo', campi: ['da', 'a'] });
    expect(leggiFascia('', '1.500,50')).toEqual({ valida: true, da: null, a: '1500.50' });
  });
});

describe('elenco operativo, formati (mai uno zero per un dato assente)', () => {
  it('importi e somme', () => {
    expect(cellaImporto(euro(12345.5))).toBe(formatEuro(12345.5));
    expect(cellaImporto(euro(null, 'NON_VALORIZZATO'))).toBe('non valorizzato');
    expect(cellaImporto(undefined)).toBe('non disponibile');
    expect(importoConNota(euro(null, 'NON_VALORIZZATO'))).toBe('non valorizzato (il dato non è presente nella fonte)');
    expect(testoSomma({ totale: euro(10000), senzaValore: 2 })).toEqual({ valore: formatEuro(10000), nota: '2 domande senza importo' });
    expect(testoSomma({ totale: euro(10000), senzaValore: 0 })).toEqual({ valore: formatEuro(10000) });
    expect(testoSomma({ totale: euro(null, 'NON_VALORIZZATO'), senzaValore: 1 })).toEqual({ valore: 'non valorizzato', nota: '1 domanda senza importo' });
    expect(testoSomma({ totale: euro(5), senzaValore: 1 }, ['riga', 'righe']).nota).toBe('1 riga senza importo');
    expect(quotaSu(euro(2500), euro(4000))).toBe(62.5);
    expect(quotaSu(euro(1), euro(3))).toBe(33.3);
    expect(quotaSu(euro(null, 'NON_VALORIZZATO'), euro(4000))).toBeNull();
    expect(quotaSu(euro(10), euro(0))).toBeNull();
    expect(testoQuotaPagata(null)).toBe('non calcolabile');
    expect(testoQuotaPagata(62.5)).toBe('62,5 %');
  });

  it('etichette dei codici, anno, annualita, si/no', () => {
    expect(etichettaTipo('SOSTEGNO')).toBe('Sostegno');
    expect(etichettaTipo('NUOVO')).toBe('NUOVO');
    expect(etichettaTipo(null)).toBe('');
    expect(etichettaEsito('PAGATA')).toBe('Pagata');
    expect(etichettaEsito('PAGATA', false)).toBe('Pagata (domanda chiusa)');
    expect(testoAnno(null)).toBe('senza anno');
    expect(testoAnno(2025)).toBe('2025');
    expect(testoAnnualita(true)).toBe('prima annualità');
    expect(testoAnnualita(false)).toBe('altre annualità');
    expect(testoAnnualita(null)).toBe('non classificata');
    expect(siNo(true)).toBe('sì');
    expect(siNo(false)).toBe('no');
    expect(siNo(undefined)).toBe('');
  });

  it('superficie, responsabile (OP-008), atto, conteggi', () => {
    // la resa unica degli ettari del kit, due decimali come il wireframe della scheda (D2)
    expect(testoSuperficie({ valore: 12.5, motivo: null })).toBe('12,50 ha');
    expect(testoSuperficie({ valore: 12.4, motivo: null })).toBe('12,40 ha');
    expect(testoSuperficie({ valore: null, motivo: 'NON_VALORIZZATO' })).toBe('non valorizzata');
    expect(testoResponsabile({ valore: 'Funzionario A', motivo: null })).toBe('Funzionario A');
    expect(testoResponsabile({ valore: null, motivo: 'NON_ESPOSTO' })).toBe("riservato ai profili dell'area procedurale");
    expect(testoResponsabile({ valore: null, motivo: 'NON_VALORIZZATO' })).toBe('non indicato nella determina');
    expect(testoAtto('AC-1', '2025-03-01')).toBe('AC-1 del 01/03/2025');
    expect(testoAtto('AC-1', null)).toBe('AC-1');
    expect(testoAtto(null, '2025-03-01')).toBe('del 01/03/2025');
    // review delta 21/10 X2 (F1): senza la fonte dell'atto (TX-0060 attoConcessioneDisponibile falso) non c'e' un "no";
    // passata 2 V1: con TX-0060 non letto (in attesa, in errore, senza il grant) l'assenza senza motivo, mai "nessun atto"
    expect(testoAtto(null, null, true)).toBe('nessun atto');
    expect(testoAtto(null, null, false)).toBe('non disponibile (fonte atto di concessione non attiva)');
    expect(testoAtto(null, null, undefined)).toBe('non disponibile');
    expect(testoAtto(null, null)).toBe('non disponibile');
    expect(testoAtto('AC-1', null, false)).toBe('AC-1');
    expect(testoAtto(null, '2025-03-01', undefined)).toBe('del 01/03/2025');
    // il conteggio del pannello (review v1 V-03): mai un numero vecchio mentre arriva il nuovo, mai un trattino
    const unita = ['riga', 'righe'] as const;
    expect(testoConteggio(1, unita, { inAggiornamento: false })).toBe('1 riga con questi filtri');
    expect(testoConteggio(21730, unita, { inAggiornamento: false })).toBe('21.730 righe con questi filtri');
    expect(testoConteggio(21730, unita, { inAggiornamento: true })).toBe('Conteggio in corso…');
    expect(testoConteggio(null, unita, { inAggiornamento: false })).toBe('Conteggio in corso…');
    expect(testoConteggio(null, unita, { inAggiornamento: false, inErrore: true })).toBe('Conteggio non disponibile');
  });
});

describe('elenco operativo, chip dei filtri', () => {
  const valori = {
    interventi: [{ chiave: 'SRA01', descrizione: 'Produzione integrata' }],
    stati: [{ codice: 'RILASCIATO', descrizione: 'Rilasciata', tipo: null }],
    azioniPortanti: [{ chiave: '3', descrizione: 'Filiere corte' }],
  };

  it('valori leggibili con le descrizioni di TX-0060', () => {
    expect(valoreLeggibile('intervento', 'SRA01', valori)).toBe('SRA01 Produzione integrata');
    expect(valoreLeggibile('intervento', 'SRD99', valori)).toBe('SRD99');
    expect(valoreLeggibile('stato', 'RILASCIATO', valori)).toBe('Rilasciata');
    expect(valoreLeggibile('stato', 'SENZA_STATO', valori)).toBe('Senza stato SIAN');
    expect(valoreLeggibile('azione', '3', valori)).toBe('Filiere corte');
    expect(valoreLeggibile('anno', 'SENZA')).toBe('Senza anno');
    expect(valoreLeggibile('sigc', 'false')).toBe('non SIGC');
    expect(valoreLeggibile('presentata', 'true')).toBe('solo le presentate');
    expect(valoreLeggibile('richiestoDa', '10000')).toBe(formatEuro(10000));
    expect(valoreLeggibile('testo', 'rossi')).toBe('“rossi”');
    expect(valoreLeggibile('pagamento', 'DA_PAGARE')).toBe('Da pagare');
  });

  it('le chiavi dei report procedurali hanno un chip leggibile, separato dai filtri del pannello', () => {
    const chip = chipDeiCriteri({ voceProgrammazione: ['AMMESSA'], statoSostegno: ['DECADENZA_TOTALE'] });
    expect(chip.map((c) => `${c.etichetta}: ${c.testo}`)).toEqual([
      'Stato della domanda di sostegno (report procedurale): DECADENZA TOTALE',
      'Stato area programmazione (report procedurale): AMMESSA',
    ]);
  });

  it('un chip per valore, pagina e ordinamento esclusi', () => {
    const chip = chipDeiCriteri({ intervento: ['SRA01', 'SRD01'], esito: ['PAGATA'], pagina: ['2'], ordina: ['cuaa:asc'] }, valori);
    expect(chip.map((c) => `${c.etichetta}: ${c.testo}`)).toEqual(['Esito: Pagata', 'Intervento: SRA01 Produzione integrata', 'Intervento: SRD01']);
    expect(chipDeiCriteri({})).toEqual([]);
  });
});

describe('elenco operativo, viste per ambito (D-1, OP-EO-02)', () => {
  it('cinque viste come nel wireframe approvato; un id sconosciuto da la generale', () => {
    expect(VISTE.map((v) => v.id)).toEqual(['generale', 'finanziario', 'procedurale', 'fisico', 'istituzionale']);
    expect(vistaDi('fisico').colonne).toContain('superficieSostegno');
    expect(vistaDi('inventata').id).toBe('generale');
    expect(vistaDi(undefined).id).toBe('generale');
    expect(vistaDi('generale').indicatori).toHaveLength(8);
  });

  it('le colonne ordinabili mappano sui campi chiusi del contratto', () => {
    const campi = new Set(CAMPI_ORDINABILI.domande);
    for (const campo of Object.values(ORDINAMENTO_COLONNA)) expect(campi.has(campo as string)).toBe(true);
    const campiP = new Set(CAMPI_ORDINABILI.pagamenti);
    for (const campo of Object.values(ORDINAMENTO_COLONNA_PAGAMENTI)) expect(campiP.has(campo as string)).toBe(true);
  });
});

describe('elenco operativo, grafici', () => {
  it('ripartizione per stato: voci filtrabili col codice, SENZA_STATO compresa (V-08); ALTRI a parte', () => {
    const voci = [
      { chiave: 'RILASCIATO', descrizione: 'Rilasciata', domande: 10 },
      { chiave: 'SENZA_STATO', descrizione: null, domande: 2 },
      { chiave: 'ALTRI', descrizione: 'Altre voci (8)', domande: 5 },
    ];
    const g = graficoRipartizione('perStato', voci);
    expect(g.opzioni).not.toBeNull();
    expect(g.tabella.righe).toEqual([['Rilasciata', '10'], ['senza stato SIAN', '2'], ['Altre voci (8)', '5']]);
    expect(filtroDellaVoce('perStato', voci[0])).toBe('RILASCIATO');
    expect(filtroDellaVoce('perStato', voci[1])).toBe('SENZA_STATO');
    expect(filtroDellaVoce('perStato', voci[2])).toBeUndefined();
    expect(String((g.opzioni?.aria as { label?: { description?: string } })?.label?.description)).toContain('17 domande in tutto');
  });

  it('ripartizione per anno: SENZA si filtra; per intervento: tabella col nome', () => {
    expect(nomeVoce('perAnno', { chiave: 'SENZA', domande: 1 })).toBe('senza anno');
    expect(filtroDellaVoce('perAnno', { chiave: 'SENZA', domande: 1 })).toBe('SENZA');
    const g = graficoRipartizione('perIntervento', [{ chiave: 'SRA01', descrizione: 'Produzione integrata', domande: 3 }]);
    expect(g.tabella.righe).toEqual([['SRA01 Produzione integrata', '3']]);
  });

  it('il clic filtra solo col codice del dato, mai col nome', () => {
    expect(filtroDalClic({ data: { codice: 'SRA01' } })).toBe('SRA01');
    expect(filtroDalClic({ data: { value: 3 } })).toBeUndefined();
    expect(filtroDalClic({ data: { codice: '' } })).toBeUndefined();
    expect(filtroDalClic({})).toBeUndefined();
  });

  it('senza voci il grafico non si disegna ma la tabella resta', () => {
    const g = graficoRipartizione('perIntervento', []);
    expect(g.opzioni).toBeNull();
    expect(g.motivoAssenza).toBe('nessuna domanda con questi filtri');
    expect(graficoRipartizione('perStato', undefined).opzioni).toBeNull();
  });

  it("cascata dall'ammesso al pagato, e i suoi casi di assenza", () => {
    const ok = graficoAmmessoPagato({ ammesso: euro(8000), pagato: euro(2500), ancoraDaPagare: euro(5500) });
    expect(ok.opzioni).not.toBeNull();
    expect(ok.tabella.righe.map((r) => r[0])).toEqual(['Ammesso', 'Pagato', 'Ancora da pagare']);
    const senzaPagato = graficoAmmessoPagato({ ammesso: euro(8000), pagato: euro(null, 'NON_VALORIZZATO') });
    expect(senzaPagato.opzioni).toBeNull();
    expect(senzaPagato.motivoAssenza).toContain('pagato non valorizzato');
    expect(graficoAmmessoPagato({ ammesso: euro(-1), pagato: euro(0) }).opzioni).toBeNull();
    expect(graficoAmmessoPagato({ ammesso: euro(100), pagato: euro(150) }).opzioni).not.toBeNull();
  });
});

describe('elenco operativo, link dichiarati', () => {
  it('scheda della domanda solo con tipo e codice validi', () => {
    expect(percorsoDettaglio('SOSTEGNO', '04230000001')).toBe('/elenco-operativo/domande/SOSTEGNO/04230000001');
    expect(percorsoDettaglio('ALTRO', '04230000001')).toBeNull();
    expect(percorsoDettaglio('PAGAMENTO', '0423 0001')).toBeNull();
    expect(percorsoDettaglio(undefined, '1')).toBeNull();
  });

  it('fra domande e pagamenti passano solo i filtri della domanda', () => {
    const c = { intervento: ['SRA01'], decreto: ['D84'], esito: ['PAGATA'], pagina: ['2'], ordina: ['cuaa:asc'] };
    expect(percorsoPagamentiDelleDomande(c)).toBe('/elenco-operativo/pagamenti?intervento=SRA01');
    expect(percorsoDomandeDeiPagamenti(c)).toBe('/elenco-operativo/domande?intervento=SRA01');
    expect(percorsoPagamentiDelleDomande({})).toBe('/elenco-operativo/pagamenti');
  });

  it('altre domande del beneficiario col CUAA, se c e', () => {
    expect(percorsoDomandeDelBeneficiario('RSSMRA80A01H501U')).toBe('/elenco-operativo/domande?testo=RSSMRA80A01H501U');
    expect(percorsoDomandeDelBeneficiario(null)).toBeNull();
    expect(percorsoDomandeDelBeneficiario('ab')).toBeNull();
  });
});

describe('ultimo dato sincronizzato (condiviso, NFR-25 b)', () => {
  it('testo e data meno recente', () => {
    const voci = [
      { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
      { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00.123456Z' },
    ];
    expect(testoUltimiDati(voci)).toBe('PROSA DS-04 03/03/2026 09:30; DS-12 02/03/2026 10:15');
    expect(menoRecente(voci)).toBe('2026-03-02T09:15:00.123456Z');
    expect(testoUltimiDati([])).toBe('nessuna acquisizione conclusa');
    expect(menoRecente([])).toBeUndefined();
  });
});

describe("elenco operativo, l'indirizzo dice solo cio' che il backend accetta (review v1 H-01, A-04, X-03)", () => {
  it('valori fuori contratto scartati: pagina, dimensione, ordinamento, testo corto', () => {
    expect(criteriDaRicerca('?dimensione=500&ordina=x:asc&pagina=abc&testo=ab', 'domande')).toEqual({});
    // i predefiniti non si scrivono, presentata=false non esiste (D-02 Rev. 1), booleani e importi nel formato del contratto
    expect(criteriDaRicerca('?pagina=0&dimensione=25&ordina=codiceABarre:asc&presentata=false&sigc=forse&richiestoDa=1,5', 'domande')).toEqual({});
    expect(criteriDaRicerca('?pagina=3&dimensione=50&ordina=liquidato:desc&presentata=true&sigc=false&richiestoDa=1500.5', 'domande')).toEqual({
      pagina: ['3'],
      dimensione: ['50'],
      ordina: ['liquidato:desc'],
      presentata: ['true'],
      sigc: ['false'],
      richiestoDa: ['1500.5'],
    });
    // il campo di un elenco non ordina l'altro
    expect(criteriDaRicerca('?ordina=liquidato:desc', 'pagamenti')).toEqual({});
  });

  it('fascia di importo rovesciata: i due estremi si scartano, gli altri filtri restano', () => {
    expect(fasciaRovesciata('100', '50')).toBe(true);
    expect(fasciaRovesciata('50', '100')).toBe(false);
    expect(fasciaRovesciata(undefined, '5')).toBe(false);
    expect(criteriDaRicerca('?richiestoDa=100&richiestoA=50&ammessoDa=10', 'domande')).toEqual({ ammessoDa: ['10'] });
  });

  it('caratteri di controllo e di formato come nel backend ([\\p{Cc}\\p{Cf}]): trattino morbido e spazio a larghezza zero', () => {
    expect(valoreAccettabile('ros\u00ADsi')).toBe(false);
    expect(valoreAccettabile('ros\u200Bsi')).toBe(false);
    expect(criteriDaRicerca('?testo=ros%C2%ADsi', 'domande')).toEqual({});
    expect(criteriDaRicerca('?testo=ros%E2%80%8Bsi', 'domande')).toEqual({});
    expect(valoreAccettabile('rossi è')).toBe(true);
  });

  it("ordinamento attivo in parole, ritorno al predefinito, ultima pagina (review v1 X-04)", () => {
    expect(testoOrdinamento('Liquidato', { campo: 'liquidato', verso: 'desc' })).toBe('Ordinate per Liquidato, decrescente');
    expect(ordinamentoPredefinito({ campo: 'codiceABarre', verso: 'asc' }, 'domande')).toBe(true);
    expect(ordinamentoPredefinito({ campo: 'codiceABarre', verso: 'desc' }, 'domande')).toBe(false);
    expect(senzaOrdinamento({ intervento: ['SRA01'], ordina: ['liquidato:desc'], pagina: ['2'] })).toEqual({ intervento: ['SRA01'] });
    expect(ultimaPagina(1284, 25)).toBe(51);
    expect(ultimaPagina(0, 25)).toBe(0);
  });
});

describe('elenco operativo, testi rivisti di chip, aggregati e contesto (review v1 V-07, V-10, X-07)', () => {
  it("gli stati in alternativa fra loro lo dicono nell'etichetta del chip", () => {
    const chip = chipDeiCriteri({ stato: ['RILASCIATO'], statoPagamento: ['RILASCIATO'], voceProgrammazione: ['AMMESSA'] });
    expect(chip.map((c) => `${c.etichetta}: ${c.testo}`)).toEqual([
      'Stato SIAN (in alternativa agli altri stati): RILASCIATO',
      'Stato della domanda di pagamento (report procedurale) (in alternativa agli altri stati): RILASCIATO',
      'Stato area programmazione (report procedurale): AMMESSA',
    ]);
    // uno stato solo non e' in alternativa a nulla
    expect(chipDeiCriteri({ stato: ['RILASCIATO'] })[0].etichetta).toBe('Stato SIAN');
  });

  it("liquidato e recuperato dell'insieme: l'importo, o il motivo per cui non si calcola (mai 'non valorizzato')", () => {
    expect(testoAggregato(euro(5000), 'liquidato')).toEqual({ valore: formatEuro(5000) });
    expect(testoAggregato(euro(null, 'NON_VALORIZZATO'), 'recuperato')).toEqual({ valore: 'non calcolabile', nota: "un recupero dell'insieme non ha l'importo" });
    expect(testoAggregato(undefined, 'liquidato').nota).toBe("una riga di liquidazione dell'insieme non ha l'importo");
  });

  it("righe di contesto dei PNG col perimetro della risposta", () => {
    expect(perimetroDellaRisposta('ADA')).toBe('ADA del tuo profilo');
    expect(perimetroDellaRisposta('REGIONALE')).toBe('regionale');
    expect([perimetroDellaRisposta(null), perimetroDellaRisposta(undefined), perimetroDellaRisposta('ALTRO')]).toEqual([null, null, null]);
    // un nome proprio, non l'omonimo del kit con un altro contratto (review H9 del procedurale)
    expect(Object.keys(formatoElenco)).not.toContain('testoPerimetro');
    expect(righeContesto({ filtri: ['Intervento: SRA01'], profilo: 'p1-dirigente', ultimi: undefined, perimetro: perimetroDellaRisposta('REGIONALE') })).toEqual([
      'Filtri applicati: Intervento: SRA01',
      'Perimetro: regionale',
      'Profilo: p1-dirigente',
      'Ultimo dato sincronizzato: non disponibile',
    ]);
    expect(righeContesto({ filtri: [], profilo: undefined, ultimi: undefined }).some((r) => r.startsWith('Perimetro'))).toBe(false);
  });
});

describe('elenco operativo, link della scheda e fra elenchi (review v1 A-01, V-06, V-12)', () => {
  it('riferimento della scheda: tipo del contratto e codice di sole cifre, niente separatori di percorso', () => {
    expect(riferimentoValido('SOSTEGNO', '04230000001')).toBe(true);
    for (const codice of ['../../domande/csv?x=1', '..', '0423\\0001', '0423ABC', '0423%2F1', '']) expect(riferimentoValido('SOSTEGNO', codice), codice).toBe(false);
    expect(riferimentoValido('ALTRO', '04230000001')).toBe(false);
    expect(riferimentoValido(undefined, '04230000001')).toBe(false);
  });

  it("ritorno all'elenco: solo un indirizzo dei due elenchi dallo stato della navigazione, mai la cronologia", () => {
    expect(ritornoAllElenco({ ricerca: '/elenco-operativo/domande?intervento=SRA01' })).toBe('/elenco-operativo/domande?intervento=SRA01');
    expect(ritornoAllElenco({ ricerca: '/elenco-operativo/pagamenti' })).toBe('/elenco-operativo/pagamenti');
    for (const ricerca of ['https://altrove.example/', '//altrove.example', '/finanziario/riepilogo', '/elenco-operativo/domandex', '/elenco-operativo/domande#x', 42]) {
      expect(ritornoAllElenco({ ricerca }), String(ricerca)).toBe('/elenco-operativo/domande');
    }
    expect(ritornoAllElenco(null)).toBe('/elenco-operativo/domande');
    // le scelte della pagina dell'elenco nella forma di useStatoNellaHistory (review v2 V-02, V-03, A-04)
    const elenco = { firma: 'elenco-operativo', valore: { vista: 'fisico', nascoste: ['ammesso'] } };
    expect(statoDiRitorno({ ricerca: '/elenco-operativo/domande', elenco })).toEqual({ elenco });
    expect(statoDiRitorno({ elenco: { ...elenco, firma: 'altro' } })).toBeUndefined();
    expect(statoDiRitorno({ elenco: { firma: 'elenco-operativo', valore: { vista: '<script>' } } })).toBeUndefined();
    expect(statoDiRitorno({ vista: 'fisico' })).toBeUndefined();
    expect(statoDiRitorno(undefined)).toBeUndefined();
  });

  it('scelte della pagina dello state della history: vista e colonne come identificativi brevi, mai altro', () => {
    expect(statoElencoValido({})).toBe(true);
    expect(statoElencoValido({ vista: 'economico', nascoste: ['liquidato', 'ammesso'] })).toBe(true);
    for (const v of [null, 'fisico', [], { vista: 'Fisico1' }, { nascoste: 'ammesso' }, { nascoste: ['a b'] }, { nascoste: Array.from({ length: 51 }, () => 'x') }]) {
      expect(statoElencoValido(v), JSON.stringify(v)).toBe(false);
    }
  });

  it('i link fra i due elenchi portano tutti e soli i parametri della loro query nello uiplan', () => {
    const tutti = Object.fromEntries([...FILTRI_DOMANDA, ...FILTRI_PAGAMENTO, 'pagina', 'dimensione', 'ordina'].map((n) => [n, ['1']]));
    const link = uiplanElenco.routes.flatMap((r) => r.links ?? []);
    const query = (id: string) => [...(link.find((l) => l.id === id)?.query ?? [])].sort();
    const parametri = (percorso: string) => [...new Set(new URLSearchParams(percorso.split('?')[1] ?? '').keys())].sort();
    expect(query('pagamenti-delle-domande')).toHaveLength(27);
    expect(parametri(percorsoPagamentiDelleDomande(tutti))).toEqual(query('pagamenti-delle-domande'));
    expect(parametri(percorsoDomandeDeiPagamenti(tutti))).toEqual(query('domande-dei-pagamenti'));
  });

  it("i ritorni all'elenco dalla scheda: verso domande e pagamenti, con tutta la query di partenza (review v2 V-01)", () => {
    const link = uiplanElenco.routes.flatMap((r) => r.links ?? []);
    const query = (id: string) => [...(link.find((l) => l.id === id)?.query ?? [])].sort();
    const urlParams = (percorso: string) => (uiplanElenco.routes.find((r) => r.path === percorso)?.url_params ?? []).map((p) => p.name).sort();
    const parametri = (percorso: string) => [...new Set(new URLSearchParams(percorso.split('?')[1] ?? '').keys())].sort();
    for (const [id, percorso] of [
      ['torna-all-elenco', '/elenco-operativo/domande'],
      ['torna-all-elenco-dei-pagamenti', '/elenco-operativo/pagamenti'],
    ] as const) {
      expect(link.find((l) => l.id === id)?.target).toBe(percorso);
      expect(query(id)).toEqual(urlParams(percorso));
      const partenza = `${percorso}?${query(id).map((n) => `${n}=1`).join('&')}`;
      expect(ritornoAllElenco({ ricerca: partenza })).toBe(partenza);
      expect(parametri(ritornoAllElenco({ ricerca: partenza }))).toEqual(query(id));
    }
  });
});
