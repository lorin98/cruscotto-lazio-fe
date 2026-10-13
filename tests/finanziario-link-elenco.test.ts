import { describe, expect, it } from 'vitest';
import uiplan from '../uiplan.json';
import routeTable from '../src/app/route-table.json';
import { MAX_VALORI_FILTRO } from '../src/features/finanziario/lib/filtri';
import {
  GRANT_DESTINAZIONE,
  LINK_ELENCO,
  criteriAnnoAnnualita,
  criteriDomandePerAnno,
  criteriVoceSigc,
  indirizzoDelLink,
  indirizzoLink,
  parametriLink,
} from '../src/features/finanziario/lib/link-elenco';
import { ANNUALITA_DOMANDE, VOCI_DOMANDE_SIGC, graficoDomandePerAnno, graficoDomandeSigc } from '../src/features/finanziario/lib/grafici';

const FILTRI_LINK = ['presentata', 'intervento', 'os', 'og', 'op', 'azione'] as const;

describe('parametri dei link verso l elenco operativo', () => {
  it('porta i filtri correnti e i criteri del punto cliccato', () => {
    const p = parametriLink({ os: ['OS4'], og: ['OG1'] }, { presentata: true, anno: [2024, null], annualita: ['PRIMA'] });
    expect(p).toEqual({ os: ['OS4'], og: ['OG1'], presentata: ['true'], anno: ['2024', 'SENZA'], annualita: ['PRIMA'] });
  });

  it('senza criteri restano i soli filtri, senza chiavi vuote', () => {
    expect(parametriLink({ intervento: ['SRA01'], op: [] })).toEqual({ intervento: ['SRA01'] });
    expect(parametriLink({})).toEqual({});
  });

  it('l intervento della riga sostituisce il filtro corrente', () => {
    expect(parametriLink({ intervento: ['SRA01', 'SRD01'] }, { intervento: 'SRG03' }).intervento).toEqual(['SRG03']);
  });

  it('un intervento fuori formato non entra nell indirizzo e il filtro corrente decade', () => {
    const p = parametriLink({ intervento: ['SRA01'], os: ['OS4'] }, { intervento: 'x&y=1' });
    expect(p.intervento).toBeUndefined();
    expect(p.os).toEqual(['OS4']);
  });

  it('presentata e sigc falsi non diventano un parametro (non esiste il filtro delle non presentate)', () => {
    expect(parametriLink({}, { presentata: false, sigc: false })).toEqual({});
  });

  it('esiti del pagamento della domanda e delle righe di elenco', () => {
    expect(parametriLink({}, { sigc: true, pagamento: ['DA_PAGARE'] })).toEqual({ sigc: ['true'], pagamento: ['DA_PAGARE'] });
    expect(parametriLink({}, { esito: ['PAGATA'] })).toEqual({ esito: ['PAGATA'] });
  });

  it('non condivide gli array dei filtri del chiamante', () => {
    const filtri = { os: ['OS4'] };
    parametriLink(filtri).os?.push('OS5');
    expect(filtri.os).toEqual(['OS4']);
  });
});

describe('indirizzo dei link verso l elenco operativo', () => {
  it('solo i parametri dichiarati dal link, nell ordine della query, chiave ripetuta per valore', () => {
    const url = indirizzoLink('/elenco-operativo/domande', FILTRI_LINK, {
      os: ['OS4'],
      presentata: ['true'],
      intervento: ['SRA01', 'SRD01'],
      anno: ['2024'],
    });
    expect(url).toBe('/elenco-operativo/domande?presentata=true&intervento=SRA01&intervento=SRD01&os=OS4');
  });

  it('senza parametri resta la sola destinazione', () => {
    expect(indirizzoLink('/elenco-operativo/pagamenti', ['esito', 'intervento'], {})).toBe('/elenco-operativo/pagamenti');
  });

  it('valori senza doppioni e al piu il tetto per chiave', () => {
    const molti = Array.from({ length: MAX_VALORI_FILTRO + 5 }, (_, i) => String(i + 1));
    const url = indirizzoLink('/elenco-operativo/domande', ['azione'], { azione: ['3', '3', ...molti] });
    expect(new URLSearchParams(url.split('?')[1]).getAll('azione')).toHaveLength(MAX_VALORI_FILTRO);
  });

  it('codifica i valori (nessun parametro iniettato nella query)', () => {
    const url = indirizzoLink('/elenco-operativo/domande', ['os'], { os: ['A&presentata=false'] });
    expect(new URLSearchParams(url.split('?')[1]).getAll('presentata')).toEqual([]);
  });

  it('ogni link del finanziario verso l elenco dichiara parametri che parametriLink sa produrre', () => {
    const producibili = new Set(['presentata', 'sigc', 'anno', 'annualita', 'pagamento', 'esito', 'intervento', 'os', 'og', 'op', 'azione']);
    const link = uiplan.routes.flatMap((r) => ('links' in r && Array.isArray(r.links) ? r.links : []));
    expect(link.length).toBeGreaterThan(0);
    for (const l of link) {
      expect(['/elenco-operativo/domande', '/elenco-operativo/pagamenti']).toContain(l.target);
      for (const q of l.query) expect(producibili.has(q), `${l.id}: ${q}`).toBe(true);
    }
  });
});

describe('i link del codice sono quelli dello uiplan (copie verbatim verificate)', () => {
  const link = uiplan.routes.flatMap((r) => ('links' in r && Array.isArray(r.links) ? r.links : [])).filter((l) => l.target_feature === 'elenco-operativo');
  it('stessi id, destinazioni e query di links[] con target_feature elenco-operativo', () => {
    expect(new Set(Object.keys(LINK_ELENCO))).toEqual(new Set(link.map((l) => l.id)));
    for (const l of link) expect(LINK_ELENCO[l.id as keyof typeof LINK_ELENCO], l.id).toEqual({ destinazione: l.target, query: l.query });
  });
  it("il grant di ogni destinazione e' fra quelli della sua route nella route-table", () => {
    for (const [destinazione, grant] of Object.entries(GRANT_DESTINAZIONE)) {
      const route = routeTable.routes.find((r) => r.path === destinazione);
      expect(route?.visibility, destinazione).toContain(grant);
    }
    expect(GRANT_DESTINAZIONE['/elenco-operativo/domande']).not.toBe(GRANT_DESTINAZIONE['/elenco-operativo/pagamenti']);
  });
});

describe("fail-closed: nessun link verso un insieme piu' largo di quello dichiarato", () => {
  it('un intervento fuori formato annulla il link', () => {
    expect(indirizzoDelLink('elenco-presentate-riga', {}, { presentata: true, intervento: 'x&y=1' })).toBeNull();
    expect(indirizzoDelLink('elenco-presentate-riga', {}, { presentata: true, intervento: 'SRA01' })).toBe('/elenco-operativo/domande?presentata=true&intervento=SRA01');
  });
  it('voce SIGC sconosciuta (anche una chiave ereditata) = nessun criterio', () => {
    expect(criteriVoceSigc(undefined)).toBeNull();
    expect(criteriVoceSigc('Pagate')).toBeNull();
    expect(criteriVoceSigc('toString')).toBeNull();
    expect(criteriVoceSigc('PAGATA')).toEqual({ sigc: true, pagamento: ['PAGATA'] });
    expect(criteriVoceSigc('PRESENTATE')).toEqual({ sigc: true });
  });
  it('segmento di Domande per anno senza codici riconosciuti = nessun criterio', () => {
    expect(criteriDomandePerAnno({})).toBeNull();
    expect(criteriDomandePerAnno({ data: 3 })).toBeNull();
    expect(criteriDomandePerAnno({ data: { value: 3, codice: 'Prima annualità', anno: 2024 } })).toBeNull();
    expect(criteriDomandePerAnno({ data: { value: 3, codice: 'constructor', anno: 2024 } })).toBeNull();
    expect(criteriDomandePerAnno({ data: { value: 3, codice: 'PRIMA', anno: '2024' } })).toBeNull();
  });
});

describe('criteri dal dato cliccato: il codice nel dato, mai l etichetta della serie', () => {
  it("ogni segmento di Domande per anno porta annualita' e anno, e i criteri sono quelli della cella della tabella", () => {
    const g = graficoDomandePerAnno([
      { annoRaccolta: null, primaAnnualita: 1, altreAnnualita: 2, nonClassificate: 3, totali: 6 },
      { annoRaccolta: 2024, primaAnnualita: 4, altreAnnualita: 5, nonClassificate: 6, totali: 15 },
    ]);
    const serie = (g.opzioni as { series: Array<{ data: unknown[] }> }).series;
    expect(serie).toHaveLength(ANNUALITA_DOMANDE.length);
    ANNUALITA_DOMANDE.forEach((a, k) => {
      // righe ordinate: 2024 prima, senza anno in coda
      expect(criteriDomandePerAnno({ data: serie[k].data[0] })).toEqual(criteriAnnoAnnualita(2024, a.codice));
      expect(criteriDomandePerAnno({ data: serie[k].data[1] })).toEqual(criteriAnnoAnnualita(null, a.codice));
    });
  });
  it('ogni barra delle domande SIGC porta il codice della voce', () => {
    const g = graficoDomandeSigc({ presentate: 10, pagate: 4, daPagare: 5, senzaImporti: 1 });
    const dati = (g.opzioni as { series: Array<{ data: Array<{ codice?: string }> }> }).series[0].data;
    expect(dati.map((d) => d.codice)).toEqual(VOCI_DOMANDE_SIGC.map((v) => v.codice));
    expect(dati.map((d) => criteriVoceSigc(d.codice))).toEqual([{ sigc: true }, { sigc: true, pagamento: ['PAGATA'] }, { sigc: true, pagamento: ['DA_PAGARE'] }, { sigc: true, pagamento: ['SENZA_IMPORTI'] }]);
  });
});
