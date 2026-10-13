import { describe, expect, it } from 'vitest';
import {
  CAMPI_ORDINABILI,
  conDimensione,
  conFiltro,
  conPagina,
  conValore,
  criteriDaRicerca,
  criteriEsportazione,
  criteriSinottico,
  dimensioneDi,
  filtriDellaDomanda,
  importoDaTesto,
  numeroFiltri,
  ordinaPer,
  ordinamentoDi,
  paginaDi,
  ricercaDaCriteri,
  senzaFiltri,
  senzaValore,
  testoInviabile,
  valoreAccettabile,
} from '../src/features/elenco-operativo/lib/criteri';
import {
  cellaImporto,
  conteggio,
  etichettaEsito,
  etichettaTipo,
  importoConNota,
  siNo,
  testoAnnualita,
  testoAnno,
  testoAtto,
  testoQuotaPagata,
  testoResponsabile,
  testoSomma,
  testoSuperficie,
  quotaSu,
} from '../src/features/elenco-operativo/lib/formato';
import { chipDeiCriteri, valoreLeggibile } from '../src/features/elenco-operativo/lib/chip';
import { ORDINAMENTO_COLONNA, ORDINAMENTO_COLONNA_PAGAMENTI, VISTE, vistaDi } from '../src/features/elenco-operativo/lib/viste';
import { filtroDalClic, filtroDellaVoce, graficoAmmessoPagato, graficoRipartizione, nomeVoce } from '../src/features/elenco-operativo/lib/grafici';
import {
  percorsoDettaglio,
  percorsoDomandeDeiPagamenti,
  percorsoDomandeDelBeneficiario,
  percorsoPagamentiDelleDomande,
} from '../src/features/elenco-operativo/lib/collegamenti';
import { menoRecente, testoUltimiDati } from '../src/shared/lib/aggiornamento';
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
    expect(testoSuperficie({ valore: 12.5, motivo: null })).toBe('12,5 ha');
    expect(testoSuperficie({ valore: null, motivo: 'NON_VALORIZZATO' })).toBe('non valorizzata');
    expect(testoResponsabile({ valore: 'Funzionario A', motivo: null })).toBe('Funzionario A');
    expect(testoResponsabile({ valore: null, motivo: 'NON_ESPOSTO' })).toBe("riservato ai profili dell'area procedurale");
    expect(testoResponsabile({ valore: null, motivo: 'NON_VALORIZZATO' })).toBe('non indicato nella determina');
    expect(testoAtto('AC-1', '2025-03-01')).toBe('AC-1 del 01/03/2025');
    expect(testoAtto('AC-1', null)).toBe('AC-1');
    expect(testoAtto(null, '2025-03-01')).toBe('del 01/03/2025');
    expect(testoAtto(null, null)).toBe('nessun atto');
    expect(conteggio(1, 'riga', 'righe')).toBe('1 riga');
    expect(conteggio(21730, 'riga', 'righe')).toBe('21.730 righe');
    expect(conteggio(null, 'riga', 'righe')).toBe('-');
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
  it('ripartizione per stato: voci filtrabili col codice, ALTRI e SENZA_STATO a parte', () => {
    const voci = [
      { chiave: 'RILASCIATO', descrizione: 'Rilasciata', domande: 10 },
      { chiave: 'SENZA_STATO', descrizione: null, domande: 2 },
      { chiave: 'ALTRI', descrizione: 'Altre voci (8)', domande: 5 },
    ];
    const g = graficoRipartizione('perStato', voci);
    expect(g.opzioni).not.toBeNull();
    expect(g.tabella.righe).toEqual([['Rilasciata', '10'], ['senza stato SIAN', '2'], ['Altre voci (8)', '5']]);
    expect(filtroDellaVoce('perStato', voci[0])).toBe('RILASCIATO');
    expect(filtroDellaVoce('perStato', voci[1])).toBeUndefined();
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
