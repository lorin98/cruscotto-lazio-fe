import { describe, expect, it } from 'vitest';
import uiplan from '../uiplan.json';
import { MAX_VALORI_FILTRO } from '../src/features/finanziario/lib/filtri';
import { indirizzoLink, parametriLink } from '../src/features/finanziario/lib/link-elenco';

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
