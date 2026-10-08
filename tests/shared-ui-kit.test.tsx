// Kit dell'interfaccia UI v2 (ADR 0027, shared/ui e shared/lib/tabella): componenti generici, dati di prova inventati.
// Il grafico e' quello finto di src/shared/test/setup.ts (jsdom non disegna).
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarraFiltri, CardGrafico, Grafico, Kpi, PannelloLaterale, TabellaInterattiva } from '../src/shared/ui';
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

  it('con prefers-reduced-motion niente animazioni', () => {
    // jsdom non ha matchMedia: lo si fornisce solo per questo test
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }));
    render(<Grafico opzioni={{ series: [] }} />);
    expect(graficiVivi()[0].opzioni[0]).toMatchObject({ animation: false });
  });
});

describe('CardGrafico', () => {
  it('regione col titolo, interruttore Grafico/Tabella con aria-pressed, tabella equivalente con numeri e testi distinti', async () => {
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
    expect(celle[0].className).toBe('ui-num');
    expect(celle[1].className).toBe('ui-testo');
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

  it('il motivo continua la frase: iniziale minuscola, salvo sigle e codici', () => {
    const { rerender } = render(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null, motivoAssenza: "L'ammesso supera il richiesto" }} fonte="Fonte: prova" />);
    expect(screen.getByText("Grafico non disponibile: l'ammesso supera il richiesto.")).toBeTruthy();
    rerender(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null, motivoAssenza: 'SRA01 senza dotazione' }} fonte="Fonte: prova" />);
    expect(screen.getByText('Grafico non disponibile: SRA01 senza dotazione.')).toBeTruthy();
    rerender(<CardGrafico titolo="Prova" dati={{ ...DATI, opzioni: null }} fonte="Fonte: prova" />);
    expect(screen.getByText('Grafico non disponibile: dati insufficienti.')).toBeTruthy();
  });

  it('voci omesse dichiarate; clic sul grafico al chiamante; download come immagine', async () => {
    const clic = vi.fn();
    const scaricato = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<CardGrafico titolo="Dotazione per intervento" dati={{ ...DATI, omessi: ['X: assente', 'Y: negativo'] }} fonte="Fonte: prova" onClic={clic} />);
    expect(screen.getByText('2 voci non nel grafico')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map((v) => v.textContent)).toEqual(['X: assente', 'Y: negativo']);
    clicSu(graficiVivi()[0], { name: 'A' });
    expect(clic).toHaveBeenCalledWith({ name: 'A' });
    await userEvent.click(screen.getByRole('button', { name: 'Scarica il grafico Dotazione per intervento come immagine' }));
    expect(scaricato).toHaveBeenCalledTimes(1);
    expect((scaricato.mock.contexts[0] as HTMLAnchorElement).download).toBe('dotazione-per-intervento.svg');
    scaricato.mockRestore();
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
