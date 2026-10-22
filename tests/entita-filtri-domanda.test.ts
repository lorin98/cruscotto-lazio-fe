// Test L1 delle parti comuni spostate nelle entity (codice comune del fisico): i filtri del programma (entities/filtri,
// prima nel lib del finanziario, che li riesporta) e il contratto della scheda della domanda (entities/domanda, prima nel
// lib dell'elenco operativo). Chiamate dirette, niente render.
import { describe, expect, it } from 'vitest';
import {
  AZIONE_NON_APPLICATA,
  CHIAVI_FILTRO,
  ETICHETTE_FILTRO,
  filtriAttivi,
  filtriDaRicerca,
  ricercaDaFiltri,
  senzaAzioneSeNonDisponibile,
  senzaValore,
  valoreFiltroValido,
} from '../src/entities/filtri';
import { codiceABarreValido, etichettaTipoDomanda, percorsoSchedaDomanda, riferimentoDomandaValido } from '../src/entities/domanda';
import * as Finanziario from '../src/features/finanziario/lib/filtri';
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

  it('scrittura nell ordine delle chiavi, chiave ripetuta per valore', () => {
    expect(ricercaDaFiltri({ os: ['OS4'], intervento: ['SRB01', 'SRA29'] })).toBe('intervento=SRB01&intervento=SRA29&os=OS4');
    expect(ricercaDaFiltri({})).toBe('');
  });

  it('chip, valore tolto e azione senza legame: le chiavi in piu (es. la campagna del fisico) restano', () => {
    expect(filtriAttivi({ intervento: ['SRB01'], azione: ['3'] }).map((f) => `${f.etichetta}: ${f.valore}`)).toEqual(['Intervento: SRB01', 'Azione portante: 3']);
    expect(senzaValore({ intervento: ['SRB01'], campagna: 2025 }, 'intervento', 'SRB01')).toEqual({ campagna: 2025 });
    expect(senzaAzioneSeNonDisponibile({ azione: ['3'], campagna: 2025 }, false)).toEqual({ campagna: 2025 });
    expect(senzaAzioneSeNonDisponibile({ azione: ['3'] }, true)).toEqual({ azione: ['3'] });
    expect(AZIONE_NON_APPLICATA).toMatch(/^non applicato: /);
    expect(CHIAVI_FILTRO.map((k) => ETICHETTE_FILTRO[k].breve)).toEqual(['Intervento', 'OS', 'OG', 'OP', 'Azione portante']);
  });

  it('il finanziario riesporta le stesse funzioni dalla entity (nessuna copia)', () => {
    expect(Finanziario.filtriDaRicerca).toBe(filtriDaRicerca);
    expect(Finanziario.ricercaDaFiltri).toBe(ricercaDaFiltri);
    expect(Finanziario.ETICHETTE_FILTRO).toBe(ETICHETTE_FILTRO);
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
