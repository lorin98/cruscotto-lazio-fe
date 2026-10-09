// Kit dell'interfaccia UI v2 (ADR 0027, shared/ui e shared/lib/tabella): componenti generici, dati di prova inventati.
// Il grafico e' quello finto di src/shared/test/setup.ts (jsdom non disegna).
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarraFiltri, CardGrafico, Grafico, Kpi, PannelloLaterale, PulsantiScarica, Sezione, TabellaDati, TabellaInterattiva, TabellaRighe, TabellaVoci, VistaQuery, blobDaDataUrl } from '../src/shared/ui';
import type { StatoQuery } from '../src/shared/ui';
import type { ColonnaTabella, DatiGrafico } from '../src/shared/ui';
import { filtraRighe, numeroPagine, ordinaRighe, paginaDi } from '../src/shared/lib';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { clicSu, graficiVivi } from '../src/shared/testing/grafico-finto';

// ---------------------------------------------------------------- shared/lib/tabella

describe('tabella: funzioni pure', () => {
  const righe = [
    { c: 'Bèta', v: 2 },
    { c: 'alfa', v: null },
    { c: 'Gamma', v: 10 },
    { c: 'delta', v: 2 },
  ];
  it('filtraRighe: senza maiuscole e accenti; testo vuoto = tutte (copia)', () => {
    expect(filtraRighe(righe, 'BETA', (r) => r.c).map((r) => r.c)).toEqual(['Bèta']);
    const tutte = filtraRighe(righe, '  ', (r) => r.c);
    expect(tutte).toEqual(righe);
    expect(tutte).not.toBe(righe);
  });
  it('ordinaRighe: numeri come numeri, stabile a parita, null sempre in fondo in entrambi i versi', () => {
    expect(ordinaRighe(righe, (r) => r.v, 'crescente').map((r) => r.c)).toEqual(['Bèta', 'delta', 'Gamma', 'alfa']);
    expect(ordinaRighe(righe, (r) => r.v, 'decrescente').map((r) => r.c)).toEqual(['Gamma', 'Bèta', 'delta', 'alfa']);
    expect(ordinaRighe(righe, (r) => r.c, 'crescente').map((r) => r.c)).toEqual(['alfa', 'Bèta', 'delta', 'Gamma']);
    expect(ordinaRighe([{ c: 'SRA10' }, { c: 'SRA2' }], (r) => r.c, 'crescente').map((r) => r.c)).toEqual(['SRA2', 'SRA10']);
  });
  it('paginazione: almeno una pagina, pagina richiesta riportata nell intervallo', () => {
    expect(numeroPagine(0, 10)).toBe(1);
    expect(numeroPagine(21, 10)).toBe(3);
    expect(numeroPagine(5, 0)).toBe(5);
    const dati = Array.from({ length: 21 }, (_, i) => i);
    expect(paginaDi(dati, 2, 10)).toEqual({ righe: [20], pagina: 2, pagine: 3 });
    expect(paginaDi(dati, 9, 10).pagina).toBe(2);
    expect(paginaDi(dati, -1, 10).righe).toEqual(dati.slice(0, 10));
  });
});

// ---------------------------------------------------------------- TabellaInterattiva

interface Riga {
  codice: string;
  importo: number | null;
  nota: string;
}
const RIGHE: Riga[] = Array.from({ length: 12 }, (_, i) => ({ codice: `X${String(i + 1).padStart(2, '0')}`, importo: i === 3 ? null : (i + 1) * 100, nota: i % 2 ? 'pari' : 'dispari' }));
const COLONNE: ColonnaTabella<Riga>[] = [
  { chiave: 'codice', titolo: 'Codice', valore: (r) => r.codice, fissa: true },
  { chiave: 'importo', titolo: 'Importo', valore: (r) => r.importo, resa: (r) => (r.importo == null ? 'non disponibile' : `${r.importo} euro`), numerica: true },
  { chiave: 'nota', titolo: 'Nota', valore: (r) => r.nota, nascosta: true },
];

function tabella(props: Partial<Parameters<typeof TabellaInterattiva<Riga>>[0]> = {}) {
  return render(
    <TabellaInterattiva<Riga>
      caption="Righe di prova"
      righe={RIGHE}
      colonne={COLONNE}
      chiaveRiga={(r) => r.codice}
      testoRicerca={(r) => r.codice}
      {...props}
    />,
  );
}
const codici = () => within(screen.getByRole('table')).getAllByRole('rowheader').map((c) => c.textContent);

describe('TabellaInterattiva', () => {
  it('caption con il conteggio, colonne nascoste di default, paginazione', async () => {
    tabella();
    expect(screen.getByRole('table', { name: 'Righe di prova: 12 righe.' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''))).toEqual(['Codice', 'Importo']);
    expect(codici()).toHaveLength(10);
    const pagine = screen.getByRole('navigation', { name: 'Pagine della tabella' });
    expect(pagine.textContent).toContain('Pagina 1 di 2');
    await userEvent.click(within(pagine).getByRole('button', { name: 'Pagina 2' }));
    expect(codici()).toEqual(['X11', 'X12']);
    expect(within(pagine).getByRole('button', { name: 'Pagina 2' }).getAttribute('aria-current')).toBe('page');
  });

  it('ordinamento per colonna con aria-sort; assenti in fondo', async () => {
    tabella({ perPagina: 20 });
    const [codice, importo] = screen.getAllByRole('columnheader');
    expect(codice.getAttribute('aria-sort')).toBe('ascending');
    expect(importo.getAttribute('aria-sort')).toBe('none');
    await userEvent.click(within(importo).getByRole('button'));
    expect(importo.getAttribute('aria-sort')).toBe('descending');
    expect(codice.getAttribute('aria-sort')).toBe('none');
    expect(codici().slice(0, 2)).toEqual(['X12', 'X11']);
    expect(codici().at(-1)).toBe('X04');
    await userEvent.click(within(importo).getByRole('button'));
    expect(importo.getAttribute('aria-sort')).toBe('ascending');
    expect(codici()[0]).toBe('X01');
    expect(codici().at(-1)).toBe('X04');
  });

  it('ricerca: filtra, aggiorna la caption e riparte dalla prima pagina', async () => {
    tabella();
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'x1');
    expect(screen.getByRole('table', { name: 'Righe di prova: 3 righe per «x1».' })).toBeTruthy();
    expect(codici()).toEqual(['X10', 'X11', 'X12']);
    expect(screen.queryByRole('navigation', { name: 'Pagine della tabella' })).toBeNull();
  });

  it('scelta delle colonne: la fissa non si nasconde, le altre si mostrano e si nascondono', async () => {
    tabella();
    await userEvent.click(screen.getByText('Colonne'));
    const scelta = screen.getByRole('group', { name: 'Colonne visibili' });
    expect(within(scelta).getAllByRole('checkbox').map((c) => c.parentElement?.textContent)).toEqual(['Importo', 'Nota']);
    await userEvent.click(within(scelta).getByRole('checkbox', { name: 'Nota' }));
    await userEvent.click(within(scelta).getByRole('checkbox', { name: 'Importo' }));
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''))).toEqual(['Codice', 'Nota']);
  });

  it('riga apribile con clic, Invio e spazio; senza onRiga le righe non sono focalizzabili', async () => {
    const aperte: string[] = [];
    const { unmount } = tabella({ onRiga: (r) => aperte.push(r.codice), etichettaRiga: (r) => `Apri ${r.codice}` });
    expect(screen.getByRole('table', { name: 'Righe di prova: 12 righe. Clic o Invio su una riga per aprirla.' })).toBeTruthy();
    await userEvent.click(screen.getByRole('row', { name: 'Apri X01' }));
    screen.getByRole('row', { name: 'Apri X02' }).focus();
    await userEvent.keyboard('{Enter}');
    screen.getByRole('row', { name: 'Apri X03' }).focus();
    await userEvent.keyboard(' ');
    expect(aperte).toEqual(['X01', 'X02', 'X03']);
    unmount();
    tabella();
    expect(within(screen.getByRole('table')).getAllByRole('row').some((r) => r.hasAttribute('tabindex'))).toBe(false);
  });

  it('totali sulle righe filtrate', async () => {
    tabella({ totali: (rr) => ({ codice: `Totale (${rr.length})`, importo: String(rr.reduce((a, r) => a + (r.importo ?? 0), 0)) }) });
    expect(within(screen.getByRole('table')).getByRole('rowheader', { name: 'Totale (12)' }).nextElementSibling?.textContent).toBe('7400');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'x1');
    expect(within(screen.getByRole('table')).getByRole('rowheader', { name: 'Totale (3)' }).nextElementSibling?.textContent).toBe('3300');
  });

  it('segnaposto della ricerca neutro o dichiarato; righe di piede indipendenti dalla ricerca', async () => {
    const { unmount } = tabella();
    expect(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }).getAttribute('placeholder')).toBe('Cerca nella tabella');
    unmount();
    tabella({ segnapostoRicerca: 'Cerca per codice', righePiede: [{ codice: 'Valore fuori tabella', importo: '42' }] });
    expect(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }).getAttribute('placeholder')).toBe('Cerca per codice');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cerca nella tabella' }), 'x01');
    expect(within(screen.getByRole('table')).getByRole('rowheader', { name: 'Valore fuori tabella' }).nextElementSibling?.textContent).toBe('42');
  });

  it('nessuna violazione axe', async () => {
    const { container } = tabella({ onRiga: () => undefined, etichettaRiga: (r) => `Apri ${r.codice}`, totali: () => ({}) });
    await expectNoA11yViolations(container);
  });
});

// ---------------------------------------------------------------- Grafico e CardGrafico

const DATI: DatiGrafico = {
  opzioni: { aria: { enabled: true, label: { description: 'Barre di prova: A 1, B 2.' } }, series: [{ type: 'bar', data: [1, 2] }] },
  tabella: { caption: 'Barre di prova', colonne: ['Voce', 'Valore'], righe: [['A', '1,00 €'], ['B', 'non disponibile (fonte non attiva)']] },
  omessi: [],
};

describe('Grafico: ciclo di vita del wrapper ECharts', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('crea il grafico, passa le opzioni, rilancia il clic, lo dismette allo smontaggio', async () => {
    const clic = vi.fn();
    const { rerender, unmount } = render(<Grafico opzioni={{ series: [] }} onClic={clic} />);
    const [g] = graficiVivi();
    expect(g.opzioni).toHaveLength(1);
    expect(g.opzioni[0]).toMatchObject({ series: [], animation: true });
    clicSu(g, { name: 'A', dataIndex: 0 });
    expect(clic).toHaveBeenCalledWith({ name: 'A', dataIndex: 0 });
    // un nuovo gestore non ricrea il grafico; nuove opzioni le sostituiscono (notMerge)
    const clic2 = vi.fn();
    rerender(<Grafico opzioni={{ series: [{ type: 'bar' }] }} onClic={clic2} />);
    expect(graficiVivi()).toHaveLength(1);
    expect(g.opzioni).toHaveLength(2);
    clicSu(g, { name: 'B' });
    expect(clic2).toHaveBeenCalledTimes(1);
    unmount();
    expect(g.dismesso).toBe(true);
    expect(graficiVivi()).toHaveLength(0);
  });

  it('stesse opzioni ricreate da un nuovo render: nessun nuovo setOption (zoom e drill-down restano)', () => {
    const opzioni = () => ({ series: [{ type: 'bar' as const, data: [1, 2] }], tooltip: { formatter: (p: unknown) => String(p) } });
    const { rerender } = render(<Grafico opzioni={opzioni()} />);
    const [g] = graficiVivi();
    rerender(<Grafico opzioni={opzioni()} />);
    rerender(<Grafico opzioni={opzioni()} />);
    expect(g.opzioni).toHaveLength(1);
    // impostazioni: le opzioni sostituiscono le precedenti, non si fondono
    expect(g.impostazioni[0]).toEqual({ notMerge: true });
    rerender(<Grafico opzioni={{ ...opzioni(), series: [{ type: 'bar' as const, data: [1, 3] }] }} />);
    expect(g.opzioni).toHaveLength(2);
  });

  it('tooltip disegnato nel grafico (richText), mai HTML: niente stili inline bloccati dalla CSP', () => {
    render(<Grafico opzioni={{ series: [], tooltip: { trigger: 'axis' } }} />);
    expect(graficiVivi()[0].opzioni[0]).toMatchObject({ tooltip: { trigger: 'axis', renderMode: 'richText' } });
  });

  it('con prefers-reduced-motion niente animazioni', () => {
    // jsdom non ha matchMedia: lo si fornisce solo per questo test
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }));
    render(<Grafico opzioni={{ series: [] }} />);
    expect(graficiVivi()[0].opzioni[0]).toMatchObject({ animation: false });
  });
});

describe('CardGrafico', () => {
  it('regione col titolo, interruttore Grafico/Tabella con aria-pressed, tabella equivalente con i valori a destra', async () => {
    render(<CardGrafico titolo="Prova" sottotitolo="Sotto" dati={DATI} fonte="Fonte: prova" />);
    const card = screen.getByRole('region', { name: 'Prova' });
    expect(card.textContent).toContain('Fonte: prova');
    const [vGrafico, vTabella] = within(within(card).getByRole('group', { name: 'Vista di Prova' })).getAllByRole('button');
    expect(vGrafico.getAttribute('aria-pressed')).toBe('true');
    expect(within(card).queryByRole('table')).toBeNull();
    await userEvent.click(vTabella);
    expect(vTabella.getAttribute('aria-pressed')).toBe('true');
    const t = within(card).getByRole('table', { name: 'Barre di prova' });
    const celle = within(t).getAllByRole('cell');
    // le colonne dopo la prima sono valori: numeri e assenze (che vanno a capo) allineati a destra
    expect(celle.map((c) => c.className)).toEqual(['ui-num', 'ui-num']);
    // il grafico resta montato (nascosto): tornando alla vista grafico non si ricrea
    expect(graficiVivi()).toHaveLength(1);
    await userEvent.click(vGrafico);
    expect(graficiVivi()).toHaveLength(1);
  });

  it('non disegnabile: dice perche, mostra subito la tabella, niente interruttore ne download', () => {
    render(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null, motivoAssenza: 'manca la dotazione' }} fonte="Fonte: prova" />);
    const card = screen.getByRole('region', { name: 'Prova' });
    expect(card.textContent).toContain('Grafico non disponibile: manca la dotazione.');
    expect(within(card).getByRole('table')).toBeTruthy();
    expect(within(card).queryByRole('button')).toBeNull();
    expect(graficiVivi()).toHaveLength(0);
  });

  it('il motivo continua la frase cosi come lo scrive il builder; senza motivo: dati insufficienti', () => {
    const { rerender } = render(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null, motivoAssenza: "l'ammesso supera il richiesto" }} fonte="Fonte: prova" />);
    expect(screen.getByText("Grafico non disponibile: l'ammesso supera il richiesto.")).toBeTruthy();
    rerender(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null, motivoAssenza: 'SRA01 senza dotazione' }} fonte="Fonte: prova" />);
    expect(screen.getByText('Grafico non disponibile: SRA01 senza dotazione.')).toBeTruthy();
    rerender(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null }} fonte="Fonte: prova" />);
    expect(screen.getByText('Grafico non disponibile: dati insufficienti.')).toBeTruthy();
  });

  it('voci omesse dichiarate; clic sul grafico al chiamante; download PNG del grafico come si vede', async () => {
    const clic = vi.fn();
    const scaricato = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const oggetto = vi.spyOn(URL, 'createObjectURL');
    render(<CardGrafico titolo="Dotazione per intervento" dati={{ ...DATI, omessi: ['X: assente', 'Y: negativo'] }} fonte="Fonte: prova" onClic={clic} />);
    expect(screen.getByText('2 voci non nel grafico')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((v) => v.textContent)).toEqual(['X: assente', 'Y: negativo']);
    clicSu(graficiVivi()[0], { name: 'A' });
    expect(clic).toHaveBeenCalledWith({ name: 'A' });
    await userEvent.click(screen.getByRole('button', { name: 'Scarica il grafico Dotazione per intervento in PNG' }));
    expect(scaricato).toHaveBeenCalledTimes(1);
    expect((scaricato.mock.contexts[0] as HTMLAnchorElement).download).toBe('dotazione-per-intervento.png');
    // lo stesso salvataggio dei file del kit (salvaFile): un Blob con il tipo dell'immagine
    expect((oggetto.mock.calls[0][0] as Blob).type).toBe('image/png');
    expect(await screen.findByText('Immagine PNG scaricata.')).toBeTruthy();
    scaricato.mockRestore();
    oggetto.mockRestore();
  });

  it('nessuna violazione axe (vista grafico e vista tabella)', async () => {
    const { container } = render(<CardGrafico titolo="Prova" dati={{ ...DATI, omessi: ['X: assente'] }} fonte="Fonte: prova" />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Tabella' }));
    await expectNoA11yViolations(container);
  });
});

// ---------------------------------------------------------------- Kpi

describe('Kpi', () => {
  it('valore, unita, nota e quota come barra con la percentuale', () => {
    render(<Kpi etichetta="Pagato" valore="1,5" unita="M€" nota="sulla dotazione" quota={0.237} icona="it-card" />);
    const kpi = screen.getByRole('region', { name: 'Pagato' });
    expect(kpi.textContent).toContain('1,5M€');
    expect(within(kpi).getByRole('img', { name: '23,7%' })).toBeTruthy();
  });
  it('assente: il testo completo al posto del valore, nessuna barra, mai zero', () => {
    render(<Kpi etichetta="Impegnato" valore="0" assente="Non disponibile: fonte impegni non attiva" quota={0.5} icona="it-card" />);
    const kpi = screen.getByRole('region', { name: 'Impegnato' });
    expect(kpi.textContent).toBe('ImpegnatoNon disponibile: fonte impegni non attiva');
    expect(within(kpi).queryByRole('img')).toBeNull();
  });
  it('quota oltre 1 limitata al 100%, negativa senza barra', () => {
    const { rerender } = render(<Kpi etichetta="Q" valore="x" quota={1.4} icona="it-card" />);
    expect(screen.getByRole('img', { name: '100%' })).toBeTruthy();
    rerender(<Kpi etichetta="Q" valore="x" quota={-0.1} icona="it-card" />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});

// ---------------------------------------------------------------- BarraFiltri e PannelloLaterale

describe('BarraFiltri', () => {
  it('chip rimovibili, Togli tutti, contatore sul bottone; senza onApri niente bottone', async () => {
    const tolti: string[] = [];
    const tutti = vi.fn();
    const apri = vi.fn();
    const chip = [
      { chiave: 'a:1', etichetta: 'A', valore: '1', onTogli: () => tolti.push('a:1') },
      { chiave: 'b:2', etichetta: 'B', valore: '2', onTogli: () => tolti.push('b:2') },
    ];
    const { rerender, container } = render(<BarraFiltri chip={chip} onApri={apri} onTogliTutti={tutti} destra={<span>Dati al</span>} />);
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    const bottone = within(barra).getByRole('button', { name: /^Filtri/ });
    expect(bottone.textContent).toContain('2');
    expect(bottone.getAttribute('aria-haspopup')).toBe('dialog');
    await userEvent.click(bottone);
    expect(apri).toHaveBeenCalledTimes(1);
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli il filtro B 2' }));
    expect(tolti).toEqual(['b:2']);
    await userEvent.click(within(barra).getByRole('button', { name: 'Togli tutti' }));
    expect(tutti).toHaveBeenCalledTimes(1);
    expect(barra.textContent).toContain('Dati al');
    await expectNoA11yViolations(container);
    rerender(<BarraFiltri chip={[]} onTogliTutti={tutti} vuoto="Nessun filtro" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Nessun filtro')).toBeTruthy();
  });
});

function ConPannello() {
  const [aperto, setAperto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAperto(true)}>
        Apri
      </button>
      <PannelloLaterale aperto={aperto} onChiudi={() => setAperto(false)} titolo="Pannello" sopratitolo="Sopra" descrizione="Descrizione" azioni={<button type="button">Conferma</button>}>
        <p>Corpo</p>
      </PannelloLaterale>
    </>
  );
}

describe('BarraFiltri: chip fissi', () => {
  it('un chip senza onTogli non si toglie e non c e "Togli tutti"', () => {
    render(<BarraFiltri chip={[{ chiave: 'i:SRA01', etichetta: 'Intervento', valore: 'SRA01' }]} onTogliTutti={() => undefined} />);
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(barra.textContent).toContain('Intervento SRA01');
    expect(within(barra).queryByRole('button')).toBeNull();
  });
});

describe('Sezione e tabelle semplici', () => {
  it('Sezione: regione col titolo, sottotitolo e strumenti; TabellaRighe e TabellaVoci con intestazioni di riga', async () => {
    const { container } = render(
      <Sezione titolo="Prova" sottotitolo="Sotto" livello={3} strumenti={<button type="button">Azione</button>}>
        <TabellaRighe caption="Righe" intestazione="Anno" chiave={(r: { a: string; v: number }) => r.a} colonne={[['Valore', (r) => r.v]]} righe={[{ a: '2024', v: 1 }, { a: '2024', v: 2 }]} />
        <TabellaVoci caption="Voci" voci={[{ etichetta: 'Totale', valore: '3' }]} />
      </Sezione>,
    );
    const sezione = screen.getByRole('region', { name: 'Prova' });
    expect(within(sezione).getByRole('heading', { level: 3, name: 'Prova' })).toBeTruthy();
    expect(within(sezione).getByRole('button', { name: 'Azione' })).toBeTruthy();
    // righe con la stessa intestazione (stessa data): entrambe rese
    expect(within(screen.getByRole('table', { name: 'Righe' })).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['2024', '2024']);
    expect(within(screen.getByRole('table', { name: 'Voci' })).getByRole('rowheader', { name: 'Totale' }).nextElementSibling?.textContent).toBe('3');
    await expectNoA11yViolations(container);
  });
});

describe('VistaQuery: attesa esplicita', () => {
  const stato = (parziale: Partial<StatoQuery<number>>): StatoQuery<number> => ({ data: undefined, isPending: false, isError: false, fetchStatus: 'idle', error: null, refetch: () => undefined, ...parziale });
  it('inAttesa mostra il caricamento anche con i dati; un errore resta un errore', () => {
    const { rerender } = render(<VistaQuery stato={stato({ data: 3 })} inAttesa>{(d) => <p>{`dati ${d}`}</p>}</VistaQuery>);
    expect(screen.queryByText('dati 3')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Caricamento');
    rerender(<VistaQuery stato={stato({ data: 3 })}>{(d) => <p>{`dati ${d}`}</p>}</VistaQuery>);
    expect(screen.getByText('dati 3')).toBeTruthy();
    rerender(<VistaQuery stato={stato({ data: 3 })} eVuoto={() => true}>{(d) => <p>{`dati ${d}`}</p>}</VistaQuery>);
    expect(screen.getByRole('status').textContent).toBe('Nessun dato da mostrare.');
  });
});

describe('PannelloLaterale', () => {
  it('dialogo col titolo; Esc e il bottone Chiudi lo chiudono e il focus torna al controllo che lo ha aperto', async () => {
    render(<ConPannello />);
    const apri = screen.getByRole('button', { name: 'Apri' });
    await userEvent.click(apri);
    const dialogo = await screen.findByRole('dialog', { name: 'Pannello' });
    expect(dialogo.textContent).toContain('Corpo');
    expect(within(dialogo).getByRole('button', { name: 'Conferma' })).toBeTruthy();
    await waitFor(() => expect(dialogo.contains(document.activeElement)).toBe(true));
    await expectNoA11yViolations(dialogo);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(apri));
    await userEvent.click(apri);
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Chiudi: Pannello' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('tabelle semplici: regione scorrevole e assenze a capo (N-12)', () => {
  it('TabellaDati: contenitore raggiungibile da tastiera con il nome della tabella, celle che vanno a capo negli spazi', async () => {
    const { container } = render(
      <TabellaDati tabella={{ caption: 'Voci di prova', colonne: ['Voce', 'Importo'], righe: [['A', '1.000,00\u00a0€'], ['B', 'non disponibile (fonte di prova non attiva)']] }} />,
    );
    const regione = screen.getByRole('region', { name: 'Voci di prova' });
    expect(regione.getAttribute('tabindex')).toBe('0');
    expect(within(regione).getByRole('table', { name: 'Voci di prova' }).classList.contains('ui-tabella--semplice')).toBe(true);
    expect(within(regione).getByRole('cell', { name: 'non disponibile (fonte di prova non attiva)' }).classList.contains('ui-num')).toBe(true);
    await expectNoA11yViolations(container);
  });
});

describe('blobDaDataUrl (H-25)', () => {
  it('testo codificato per URL e base64, con il tipo del data URL', async () => {
    const svg = blobDaDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg>à</svg>')}`);
    expect(svg.type).toBe('image/svg+xml');
    expect(await svg.text()).toBe('<svg>à</svg>');
    const png = blobDaDataUrl(`data:image/png;base64,${btoa('PNG')}`);
    expect(png.type).toBe('image/png');
    expect(await png.text()).toBe('PNG');
  });
});

// ---------------------------------------------------------------- PulsantiScarica

describe('PulsantiScarica', () => {
  it('un pulsante per formato: sigla visibile, nome accessibile completo, esito in role=status', async () => {
    const scaricati: string[] = [];
    render(
      <PulsantiScarica
        oggetto="il grafico Prova"
        scaricamenti={[
          { formato: 'PNG', scarica: () => void scaricati.push('PNG') },
          { formato: 'CSV', scarica: async () => void scaricati.push('CSV') },
          { formato: 'XLSX', scarica: async () => void scaricati.push('XLSX') },
        ]}
      />,
    );
    const gruppo = screen.getByRole('group', { name: 'Scarica il grafico Prova' });
    expect(within(gruppo).getAllByRole('button').map((b) => [b.getAttribute('aria-label'), b.textContent])).toEqual([
      ['Scarica il grafico Prova in PNG', 'PNG'],
      ['Scarica il grafico Prova in CSV', 'CSV'],
      ['Scarica il grafico Prova in XLSX', 'XLSX'],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Scarica il grafico Prova in XLSX' }));
    expect(await screen.findByText('File XLSX scaricato.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('File XLSX scaricato.');
    expect(scaricati).toEqual(['XLSX']);
  });

  it('un file alla volta: pulsanti disabilitati mentre si prepara; poi riattivi', async () => {
    let chiudi: () => void = () => undefined;
    render(<PulsantiScarica oggetto="la tabella Prova" scaricamenti={[{ formato: 'CSV', scarica: () => new Promise<void>((r) => (chiudi = r)) }, { formato: 'XLSX', scarica: () => undefined }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Scarica la tabella Prova in CSV' }));
    expect(screen.getByRole('status').textContent).toBe('File CSV in preparazione…');
    expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    chiudi();
    await waitFor(() => expect(screen.getAllByRole('button').some((b) => (b as HTMLButtonElement).disabled)).toBe(false));
  });

  it('errore: avviso col motivo, accordato al formato; nessun pulsante senza scaricamenti', async () => {
    const { container } = render(<PulsantiScarica oggetto="il grafico Prova" scaricamenti={[{ formato: 'PNG', scarica: () => { throw new Error('rotto'); } }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Scarica il grafico Prova in PNG' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Immagine PNG non scaricata. Errore inatteso nella pagina.');
    await expectNoA11yViolations(container);
    const { container: vuoto } = render(<PulsantiScarica oggetto="x" scaricamenti={[]} />);
    expect(vuoto.innerHTML).toBe('');
  });

  it('CardGrafico: PNG solo nella vista Grafico, gli scaricamenti del chiamante sempre', async () => {
    render(<CardGrafico titolo="Prova" dati={DATI} fonte="Fonte: prova" scaricamenti={[{ formato: 'CSV', scarica: () => undefined }]} />);
    const sigle = () => within(screen.getByRole('group', { name: 'Scarica il grafico Prova' })).getAllByRole('button').map((b) => b.textContent);
    expect(sigle()).toEqual(['PNG', 'CSV']);
    await userEvent.click(screen.getByRole('button', { name: 'Tabella' }));
    expect(sigle()).toEqual(['CSV']);
  });
});
