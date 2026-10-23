// Test L1 delle parti comuni spostate nelle entity (codice comune del fisico): i filtri del programma (entities/filtri,
// prima nel lib del finanziario, che li riesporta) e il contratto della scheda della domanda (entities/domanda, prima nel
// lib dell'elenco operativo). Chiamate dirette, niente render.
import { describe, expect, it } from 'vitest';
import {
  AZIONE_NON_APPLICATA,
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  codiceDelPercorso,
  descrizioneIntervento,
  filtriAttivi,
  filtriDaRicerca,
  ricercaDaFiltri,
  ricercaDeiSoliFiltri,
  rigaDellIntervento,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
  vociDelPannello,
} from '../src/entities/filtri';
import { codiceABarreValido, etichettaTipoDomanda, percorsoSchedaDomanda, riferimentoDomandaValido } from '../src/entities/domanda';
import * as Finanziario from '../src/features/finanziario/lib/filtri';
import * as BarrelFinanziario from '../src/features/finanziario';
import * as Collegamenti from '../src/features/elenco-operativo/lib/collegamenti';
import { etichettaTipo } from '../src/features/elenco-operativo/lib/formato';

describe('entities/filtri: i filtri del programma comuni a finanziario e fisico', () => {
  it('formato ammesso per chiave; i valori fuori formato si scartano dall indirizzo', () => {
    expect(valoreFiltroValido('intervento', 'SRB01')).toBe(true);
    expect(valoreFiltroValido('intervento', 'srb01')).toBe(false);
    expect(valoreFiltroValido('azione', '12')).toBe(true);
    expect(valoreFiltroValido('og', 'testo libero')).toBe(false);
    expect(filtriDaRicerca('?intervento=SRB01&intervento=SRB01&intervento=<x>&os=OS4&campagna=2025')).toEqual({ intervento: ['SRB01'], os: ['OS4'] });
    expect(filtriDaRicerca('')).toEqual({});
  });

  it('codiceDelPercorso (prima nell istituzionale, ora anche del procedurale): il codice nel formato del filtro, altrimenti null', () => {
    expect(codiceDelPercorso('SRD01')).toBe('SRD01');
    for (const nonValido of ['SRD01/..', 'srd01', ' SRD01', '', null, undefined, 'SRD01%2F', 'SRD01/x']) expect(codiceDelPercorso(nonValido)).toBeNull();
  });

  it('rigaDellIntervento (prima in shared/lib, review H2 del procedurale): la riga col codice della route, anche col codice facoltativo', () => {
    expect(rigaDellIntervento([{ codiceIntervento: 'SRA01' }, {}, { codiceIntervento: 'SRD01', n: 2 }], 'SRD01')).toEqual({ codiceIntervento: 'SRD01', n: 2 });
    expect(rigaDellIntervento<{ codiceIntervento?: string }>([], 'SRD01')).toBeUndefined();
    expect(rigaDellIntervento(undefined, 'SRD01')).toBeUndefined();
  });

  it('scrittura nell ordine delle chiavi, chiave ripetuta per valore', () => {
    expect(ricercaDaFiltri({ os: ['OS4'], intervento: ['SRB01', 'SRA29'] })).toBe('intervento=SRB01&intervento=SRA29&os=OS4');
    expect(ricercaDaFiltri({})).toBe('');
  });

  it('ricercaDeiSoliFiltri (review H7 dell istituzionale, prima nell app e nell istituzionale): i soli filtri validi, nell ordine', () => {
    expect(ricercaDeiSoliFiltri('?os=OS4&anno=2024&intervento=SRB01&intervento=<x>&pagina=3')).toBe('intervento=SRB01&os=OS4');
    expect(ricercaDeiSoliFiltri('anno=2024')).toBe('');
    expect(ricercaDeiSoliFiltri('')).toBe('');
  });

  it('chip, valore tolto e azione senza legame: le chiavi in piu (es. la campagna del fisico) restano', () => {
    expect(filtriAttivi({ intervento: ['SRB01'], azione: ['3'] }).map((f) => `${f.etichetta}: ${f.valore}`)).toEqual(['Intervento: SRB01', 'Azione portante: 3']);
    expect(senzaValore({ intervento: ['SRB01'], campagna: 2025 }, 'intervento', 'SRB01')).toEqual({ campagna: 2025 });
    expect(senzaAzioneSeNonDisponibile({ azione: ['3'], campagna: 2025 }, false)).toEqual({ campagna: 2025 });
    expect(senzaAzioneSeNonDisponibile({ azione: ['3'] }, true)).toEqual({ azione: ['3'] });
    expect(AZIONE_NON_APPLICATA).toMatch(/^non applicato: /);
    expect(CHIAVI_FILTRO.map((k) => ETICHETTE_FILTRO[k].breve)).toEqual(['Intervento', 'OS', 'OG', 'OP', 'Azione portante']);
  });

  it('filtriAttivi e senzaValore: nessun chip senza valori; la chiave rimasta vuota sparisce; l originale non cambia', () => {
    expect(filtriAttivi({ os: ['OS4'], intervento: ['SRA01', 'SRA03'] })).toEqual([
      { chiave: 'intervento', valore: 'SRA01', etichetta: 'Intervento' },
      { chiave: 'intervento', valore: 'SRA03', etichetta: 'Intervento' },
      { chiave: 'os', valore: 'OS4', etichetta: 'OS' },
    ]);
    expect(filtriAttivi({})).toEqual([]);
    expect(filtriAttivi({ og: [] })).toEqual([]);
    const filtri = { intervento: ['SRA01', 'SRA03'], os: ['OS4'] };
    expect(senzaValore(filtri, 'intervento', 'SRA01')).toEqual({ intervento: ['SRA03'], os: ['OS4'] });
    const senzaOs = senzaValore(filtri, 'os', 'OS4');
    expect(senzaOs).toEqual({ intervento: ['SRA01', 'SRA03'] });
    expect(senzaOs).not.toHaveProperty('os');
    expect(senzaValore(filtri, 'op', 'OP1')).toEqual(filtri);
    expect(filtri).toEqual({ intervento: ['SRA01', 'SRA03'], os: ['OS4'] });
  });

  it('voci del pannello: quelle lette, o i codici della risposta; descrizione dell intervento fra le voci (prima nel fisico)', () => {
    const valori = { interventi: [{ chiave: 'SRA29', descrizione: 'Agricoltura biologica' }], legameAzioniDisponibile: false };
    expect(vociDelPannello(valori, ['SRB01'])).toBe(valori);
    expect(vociDelPannello(undefined, ['SRA29', 'SRB01'])).toEqual({ interventi: [{ chiave: 'SRA29' }, { chiave: 'SRB01' }] });
    expect(vociDelPannello(undefined, [])).toEqual({ interventi: [] });
    expect(descrizioneIntervento(valori.interventi, 'SRA29')).toBe('Agricoltura biologica');
    expect(descrizioneIntervento(valori.interventi, 'SRZ99')).toBeUndefined();
    expect(descrizioneIntervento(undefined, 'SRA29')).toBeUndefined();
    expect(descrizioneIntervento([{ chiave: 'SRA29', descrizione: null }], 'SRA29')).toBeUndefined();
  });

  it('il finanziario riesporta le stesse funzioni dalla entity (nessuna copia)', () => {
    expect(Finanziario.filtriDaRicerca).toBe(filtriDaRicerca);
    expect(Finanziario.ricercaDaFiltri).toBe(ricercaDaFiltri);
    expect(Finanziario.ETICHETTE_FILTRO).toBe(ETICHETTE_FILTRO);
  });

  it("il barrel del finanziario non le espone: fuori dalla feature si usano dall'entity (review H2 dell'istituzionale v1 iter2)", () => {
    expect(Object.keys(BarrelFinanziario)).not.toContain('filtriDaRicerca');
    expect(Object.keys(BarrelFinanziario)).not.toContain('ricercaDaFiltri');
  });
});

describe('entities/domanda: codice a barre e scheda della domanda comuni a elenco operativo e fisico', () => {
  it('codice a barre: sole cifre, al piu 30', () => {
    expect(codiceABarreValido('54810769585')).toBe(true);
    expect(codiceABarreValido('1'.repeat(30))).toBe(true);
    for (const c of ['1'.repeat(31), '5481A', '5481-0769', ' 54810769585', '', null, undefined]) expect(codiceABarreValido(c), String(c)).toBe(false);
  });

  it('scheda della domanda solo con un riferimento valido', () => {
    expect(riferimentoDomandaValido('PAGAMENTO', '54810769585')).toBe(true);
    expect(riferimentoDomandaValido('ALTRO', '54810769585')).toBe(false);
    expect(percorsoSchedaDomanda('PAGAMENTO', '54810769585')).toBe('/elenco-operativo/domande/PAGAMENTO/54810769585');
    expect(percorsoSchedaDomanda('SOSTEGNO', '..%2F')).toBeNull();
  });

  it('etichetta del tipo; l elenco operativo usa le stesse funzioni', () => {
    expect(etichettaTipoDomanda('SOSTEGNO')).toBe('Sostegno');
    expect(etichettaTipoDomanda('NUOVO')).toBe('NUOVO');
    expect(etichettaTipoDomanda(null)).toBe('');
    expect(etichettaTipo).toBe(etichettaTipoDomanda);
    expect(Collegamenti.percorsoDettaglio).toBe(percorsoSchedaDomanda);
    expect(Collegamenti.riferimentoValido).toBe(riferimentoDomandaValido);
  });
});
