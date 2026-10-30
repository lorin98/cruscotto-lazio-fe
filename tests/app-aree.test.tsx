// app-aree.test.tsx — catalogo unico delle aree (review step9 H-22): la Home e il menu laterale lo iterano, le pagine
// di un'area vengono dal barrel della feature e sono route della route-table, le aree future stanno in una sola lista.
// Gli ambiti sono quattro, ognuno col suo colore; il primo pilastro non ha un ambito nel frontend (12/10/2026).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, matchPath, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { rispondi } from '../src/shared/testing/msw';
import { formatNumber } from '../src/shared/lib';
import * as F from '../src/features/finanziario/testing/fixture';
import { SUPERFICI } from '../src/features/fisico/testing/fixture';
import { VERIFICA } from '../src/features/istituzionale/testing/fixture';
import { lettureProcedurale } from '../src/features/procedurale/testing/letture';
import * as catalogo from '../src/app/aree';
import { AMBITI, AREE, areeVisibili } from '../src/app/aree';
import type { ChiaveAmbito } from '../src/app/aree';
import { appRoutes } from '../src/app/routes';
import routeTable from '../src/app/route-table.json';
import { pagineVisibili } from '../src/features/finanziario';
import { pagineVisibili as pagineFisico } from '../src/features/fisico';
import { pagineVisibili as pagineIstituzionale, ricercaConservata as ricercaIstituzionale } from '../src/features/istituzionale';
import { pagineVisibili as pagineProcedurale, ricercaConservata as ricercaProcedurale } from '../src/features/procedurale';
import { PAGINE_FINANZIARIO } from '../src/features/finanziario/lib/report';
import { PAGINE_FISICO } from '../src/features/fisico/lib/pagine';
import { PAGINE_ISTITUZIONALE } from '../src/features/istituzionale/lib/pagine';
import { PAGINE_PROCEDURALE } from '../src/features/procedurale/lib/pagine';
import { VERIFICA_SMP_SIGC } from '../src/features/istituzionale/lib/collegamenti';
import { GRANT as GRANT_ISTITUZIONALE } from '../src/features/istituzionale/lib/grant';
import { clientApp } from './app-client';

/** Conta le letture di ogni percorso: "nessuna lettura" e' un conteggio, non un'assenza di errori (review A-01). */
function registra(percorsi: readonly string[], corpi: Record<string, object> = {}): Record<string, number> {
  const conteggi: Record<string, number> = Object.fromEntries(percorsi.map((p) => [p, 0]));
  server.use(
    ...percorsi.map((p) =>
      http.get(`*${p}`, () => {
        conteggi[p] += 1;
        return HttpResponse.json(corpi[p] ?? {});
      }),
    ),
  );
  return conteggi;
}

function apriHomeCon(ruoli: string[], indirizzo = '/') {
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ruoli } })));
  const router = createMemoryRouter(appRoutes(), { initialEntries: [indirizzo] });
  return render(
    <QueryClientProvider client={clientApp()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('catalogo delle aree', () => {
  it('le pagine di ogni area, per un profilo con tutti i grant, sono route della route-table (anche col segmento facoltativo)', () => {
    for (const area of AREE) {
      const pagine = area.pagineVisibili(() => true);
      expect(pagine.length).toBeGreaterThan(0);
      for (const p of pagine) expect(routeTable.routes.some((r) => matchPath(r.path, p.percorso)), p.percorso).toBe(true);
    }
  });

  it('finanziario, fisico, procedurale e istituzionale prendono le pagine visibili dal barrel della feature', () => {
    expect(AREE.find((a) => a.chiave === 'finanziario')?.pagineVisibili).toBe(pagineVisibili);
    expect(AREE.find((a) => a.chiave === 'fisico')?.pagineVisibili).toBe(pagineFisico);
    expect(AREE.find((a) => a.chiave === 'procedurale')?.pagineVisibili).toBe(pagineProcedurale);
    expect(AREE.find((a) => a.chiave === 'istituzionale')?.pagineVisibili).toBe(pagineIstituzionale);
    expect(areeVisibili(() => true).map((a) => a.pagine)).toEqual([PAGINE_FINANZIARIO, PAGINE_FISICO, PAGINE_PROCEDURALE, PAGINE_ISTITUZIONALE]);
    expect(areeVisibili(() => false)).toEqual([]);
  });

  it('le pagine del fisico e dell istituzionale aprono col grant della loro route (visibility della route-table)', () => {
    for (const p of [...PAGINE_FISICO, ...PAGINE_ISTITUZIONALE]) {
      const route = routeTable.routes.find((r) => matchPath(r.path, p.percorso));
      expect(route?.visibility, p.percorso).toEqual([p.grant]);
    }
    // il dettaglio dell'intervento non e' una voce di menu: si apre col grant della verifica SMP non SIGC (TX-0017 al fisico)
    expect(routeTable.routes.find((r) => r.path === '/istituzionale/interventi/:codice')?.visibility).toEqual(['csr.tx-0016.read']);
  });

  it('le pagine del procedurale compaiono col grant di uno dei loro report, sempre fra i grant della route', () => {
    for (const p of PAGINE_PROCEDURALE) {
      // le determine: la voce di menu e' l'ingresso della route col codice facoltativo (/procedurale/determine/:codice?)
      const route = routeTable.routes.find((r) => matchPath(r.path, p.percorso));
      expect(route, p.percorso).toBeDefined();
      for (const g of p.grant) expect(route?.visibility, `${p.percorso} ${g}`).toContain(g);
    }
    // il dettaglio dell'intervento non e' una voce di menu: si apre con le letture dei suoi KPI e delle sue schede
    expect(PAGINE_PROCEDURALE.some((p) => p.percorso.startsWith('/procedurale/interventi'))).toBe(false);
    expect(routeTable.routes.find((r) => r.path === '/procedurale/interventi/:codice')?.visibility).toEqual([
      'csr.tx-0024.read',
      'csr.tx-0026.read',
      'csr.tx-0027.read',
      'csr.tx-0028.read',
      'csr.tx-0029.read',
      'csr.tx-0031.read',
      'csr.tx-0032.read',
    ]);
  });

  it('link G4 dell istituzionale: la verifica SMP SIGC (nell istituzionale dal 29/10/2026) e una route col grant che mostra la frase (review H8)', () => {
    // un cambio della route o del grant porterebbe la frase a un 404 o al profilo sbagliato; la route del finanziario non c'e' piu' (nessun alias)
    const route = routeTable.routes.find((r) => r.path === VERIFICA_SMP_SIGC);
    expect(route?.component, VERIFICA_SMP_SIGC).toBe('src/pages/istituzionale/verifica-smp-sigc/page.tsx');
    expect(route?.visibility).toEqual([GRANT_ISTITUZIONALE.verificaSigc]);
    expect(routeTable.routes.find((r) => r.path === '/finanziario/sigc/verifica-smp')).toBeUndefined();
  });

  it('card della Home dal contenuto reale delle feature (decisione G1 del 21/10/2026)', () => {
    const fisico = AREE.find((a) => a.chiave === 'fisico');
    expect(fisico?.contenuti.join(' ')).toMatch(/Superfici ammissibili/);
    expect(fisico?.contenuti.join(' ')).toMatch(/Determine/);
    expect(fisico?.contenuti.join(' ')).not.toMatch(/Output programmato|Unit Amount/);
    // G1 e dossier dei wireframe (home.html approvata il 30/10/2026): stati e sottofasi, ammesse con atto e contributo,
    // riepilogo, determine di una domanda (TX-0020; le Unit Amount sono del fisico)
    const procedurale = AREE.find((a) => a.chiave === 'procedurale');
    expect(procedurale?.contenuti).toEqual(['Stati e sottofasi delle domande', 'Domande ammesse con atto di concessione e contributo', 'Riepilogo per intervento', 'Determine di una domanda']);
    expect(procedurale?.descrizione).toBe('Stati e sottofasi delle domande di sostegno e di pagamento, domande ammesse con atto di concessione e contributo, riepilogo per intervento e determine di una domanda.');
    expect(procedurale?.contenuti.join(' ')).not.toMatch(/Determine, responsabili/);
    // G1: istituzionale = verifica SMP non SIGC e output regionale programmato e realizzato (TX-0016, TX-0017)
    const istituzionale = AREE.find((a) => a.chiave === 'istituzionale');
    expect(istituzionale?.contenuti).toEqual(['Verifica SMP dei dati ASR non SIGC', 'Output regionale programmato e realizzato per intervento e anno']);
    expect(istituzionale?.descrizione).toBe('Dati ASR non SIGC a confronto con SMP - Data Platform e output regionale programmato e realizzato.');
  });

  it('una ricerca conservata porta solo i criteri dell area: del finanziario, dell istituzionale senza l anno, del procedurale con lo stato', () => {
    const finanziario = AREE.find((a) => a.chiave === 'finanziario');
    expect(finanziario?.ricercaConservata?.('?intervento=SRA01&pagina=3')).toBe('intervento=SRA01');
    const istituzionale = AREE.find((a) => a.chiave === 'istituzionale');
    expect(istituzionale?.ricercaConservata).toBe(ricercaIstituzionale);
    expect(istituzionale?.ricercaConservata?.('?intervento=SRD01&anno=2024')).toBe('intervento=SRD01');
    // il procedurale porta anche lo stato area programmazione, lo stesso in tutte le sue pagine
    const procedurale = AREE.find((a) => a.chiave === 'procedurale');
    expect(procedurale?.ricercaConservata).toBe(ricercaProcedurale);
    expect(procedurale?.ricercaConservata?.('?intervento=SRD01&stato=AMMESSA&vista=tabella')).toBe('intervento=SRD01&stato=AMMESSA');
  });

  it('le chiavi degli ambiti sono quelle dell ordine fisso: una chiave fuori dall ordine non compila (review H9)', () => {
    const chiavi: readonly ChiaveAmbito[] = AMBITI.map((a) => a.chiave);
    expect(chiavi).toEqual(['finanziario', 'fisico', 'procedurale', 'istituzionale']);
    // @ts-expect-error: il primo pilastro (o un refuso) non e' la chiave di un ambito
    const fuori: ChiaveAmbito = 'pilastro';
    expect(chiavi).not.toContain(fuori);
  });

  it('nessun meccanismo delle aree "presto": i quattro ambiti sono realizzati (review H8 del procedurale)', () => {
    expect(Object.keys(catalogo)).not.toContain('AREE_FUTURE');
    expect(Object.keys(catalogo)).not.toContain('eRealizzata');
    // ne' gli stili della card e della voce di menu "presto"
    const tema = readFileSync(resolve(process.cwd(), 'src/shared/ui/tema.css'), 'utf8');
    expect(tema).not.toMatch(/presto/);
  });

  it('quattro ambiti nell ordine fisso del catalogo, ognuno col suo colore, senza il primo pilastro', () => {
    expect(AMBITI.map((a) => a.titolo)).toEqual(['Finanziario', 'Fisico', 'Procedurale', 'Istituzionale']);
    expect(AMBITI.every((a) => AREE.includes(a))).toBe(true);
    expect(AMBITI).toHaveLength(AREE.length);
    expect(new Set(AMBITI.map((a) => a.tono)).size).toBe(4);
    expect(new Set(AMBITI.map((a) => a.chiave)).size).toBe(4);
  });
});

describe('Home e menu dallo stesso catalogo', () => {
  it("profilo col solo riepilogo: la card dell'area porta alla prima pagina visibile, il menu ha la sola voce", async () => {
    apriHomeCon(['csr.tx-0011.read']);
    const card = await screen.findByRole('region', { name: 'Finanziario' });
    expect(within(card).getByRole('link', { name: 'Entra in Finanziario' }).getAttribute('href')).toBe('/finanziario/riepilogo');
    // senza i grant dei numeri chiave (TX-0002, TX-0009) la card dice cosa c'e' nell'area
    expect(within(card).getByText('Domande e importi per anno di raccolta')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getAllByRole('link').map((l) => l.textContent)).toEqual(['Riepilogo per intervento']);
    // i quattro ambiti stanno nella stessa griglia, nell'ordine fisso del catalogo
    const griglia = within(screen.getByRole('navigation', { name: 'Aree del cruscotto' })).getAllByRole('list')[0];
    const ambiti = Array.from(griglia.children) as HTMLElement[];
    expect(ambiti.map((li) => within(li).getByRole('heading').textContent)).toEqual(['Finanziario', 'Fisico', 'Procedurale', 'Istituzionale']);
    expect(document.body.textContent).not.toContain('Primo pilastro');
  });

  it('con i grant della spesa e delle domande la card del finanziario mostra i numeri chiave', async () => {
    server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE));
    apriHomeCon(['csr.tx-0002.read', 'csr.tx-0009.read']);
    const card = await screen.findByRole('region', { name: 'Finanziario' });
    const cifre = await within(card).findByRole('group', { name: 'Il finanziario in cifre' });
    expect(await within(cifre).findByText('1,0 M€')).toBeTruthy();
    expect(within(cifre).getByText('200.000,00 €')).toBeTruthy();
    expect(await within(cifre).findByText(formatNumber(1200))).toBeTruthy();
    expect(within(cifre).getByText('20 %')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Entra in Finanziario' }).getAttribute('href')).toBe('/finanziario');
    // pagamenti lordi, come nella panoramica (a3e9579: lordo e netto distinti)
    expect(within(cifre).getByText('Pagamenti totali (lordi)')).toBeTruthy();
    expect(within(cifre).getByText('Pagato lordo sulla dotazione')).toBeTruthy();
  });

  it("con il perimetro ADA pagamenti e domande sono dell'area e al posto della quota c'e' il suo motivo", async () => {
    server.use(rispondi('/api/finanziario/spesa-per-intervento', { ...F.SPESA, perimetro: 'ADA' }), rispondi('/api/finanziario/totale-domande', { ...F.TOTALE_DOMANDE, perimetro: 'ADA' }));
    apriHomeCon(['csr.tx-0002.read', 'csr.tx-0009.read']);
    const card = await screen.findByRole('region', { name: 'Finanziario' });
    const cifre = await within(card).findByRole('group', { name: 'Il finanziario in cifre' });
    expect(await within(cifre).findByText('Pagamenti totali (lordi) della tua area')).toBeTruthy();
    expect(await within(cifre).findByText('Domande presentate della tua area')).toBeTruthy();
    expect(within(cifre).getByText('Dotazione (regionale)')).toBeTruthy();
    expect(within(cifre).getByText("Pagato lordo sulla dotazione: Non confrontabile: dotazione regionale e pagamenti dell'area (perimetro ADA)")).toBeTruthy();
    expect(within(cifre).queryByText('20 %')).toBeNull();
  });

  it('profilo del fisico: la card porta alle superfici coi numeri chiave e il menu ha le tre pagine (superfici, output regionale, Unit Amount)', async () => {
    server.use(rispondi('/api/fisico/superficie-ammissibile', SUPERFICI));
    apriHomeCon(['csr.tx-0017.read', 'csr.tx-0018.read', 'csr.tx-0030.read']);
    const card = await screen.findByRole('region', { name: 'Fisico' });
    expect(within(card).getByText('Disponibile')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Entra in Fisico' }).getAttribute('href')).toBe('/fisico/superfici');
    // col grant di TX-0018 la card mostra i KPI della campagna piu' recente (OP-FIS-10), non piu' i contenuti
    const cifre = await within(card).findByRole('group', { name: 'Il fisico in cifre' });
    expect(await within(cifre).findByText('Campagna 2025')).toBeTruthy();
    expect(within(card).queryByText('Determine da cui una domanda prende le informazioni')).toBeNull();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const gruppo = within(menu).getByRole('button', { name: 'Fisico' });
    const sottomenu = document.getElementById(gruppo.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(within(sottomenu).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Superfici ammissibili', '/fisico/superfici'],
      ['Output regionale', '/fisico/output-regionale'],
      ['Unit Amount', '/fisico/unit-amount'],
    ]);
    expect(menu.textContent).not.toContain('Fisicopresto');
    expect(menu.textContent).not.toContain('presto');
  });

  it('profilo del procedurale: la card porta alla panoramica e il menu ha le sette pagine, le determine per ultime', async () => {
    const { handlers } = lettureProcedurale();
    server.use(...handlers);
    apriHomeCon(['csr.tx-0020.read', 'csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0026.read', 'csr.tx-0027.read', 'csr.tx-0028.read', 'csr.tx-0029.read', 'csr.tx-0031.read', 'csr.tx-0032.read'], '/');
    const card = await screen.findByRole('region', { name: 'Procedurale' });
    expect(within(card).getByText('Disponibile')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Entra in Procedurale' }).getAttribute('href')).toBe('/procedurale');
    // coi grant di TX-0026 e TX-0027 la card mostra i numeri della panoramica (OP-PR-10)
    const cifre = await within(card).findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('2 su 3 (66,7 %)')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const gruppo = within(menu).getByRole('button', { name: 'Procedurale' });
    const sottomenu = document.getElementById(gruppo.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(within(sottomenu).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Panoramica', '/procedurale'],
      ['Stati delle domande di sostegno', '/procedurale/stati-sostegno'],
      ['Stati delle domande di pagamento', '/procedurale/stati-pagamento'],
      ['Domande ammesse', '/procedurale/ammesse'],
      ['Sottofasi di ammissibilità', '/procedurale/sottofasi'],
      ['Riepilogo per intervento', '/procedurale/riepilogo'],
      ['Determine di una domanda', '/procedurale/determine'],
    ]);
    expect(menu.textContent).not.toContain('presto');
  });

  it('dal menu i criteri del procedurale restano passando da una pagina all altra, anche dal dettaglio dell intervento', async () => {
    const { handlers } = lettureProcedurale();
    server.use(...handlers);
    const ruoli = ['csr.tx-0024.read', 'csr.tx-0025.read', 'csr.tx-0027.read', 'csr.tx-0029.read'];
    const stati = apriHomeCon(ruoli, '/procedurale/stati-sostegno?intervento=SRD01&stato=AMMESSA');
    expect(await screen.findByRole('heading', { level: 1, name: 'Procedurale: stati delle domande di sostegno' })).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    // la panoramica compare con uno dei suoi quattro report (qui gli stati di sostegno e il riepilogo)
    expect(within(menu).getAllByRole('link').map((l) => l.textContent)).toEqual(['Panoramica', 'Stati delle domande di sostegno', 'Riepilogo per intervento']);
    expect(within(menu).getByRole('link', { name: 'Riepilogo per intervento' }).getAttribute('href')).toBe('/procedurale/riepilogo?intervento=SRD01&stato=AMMESSA');
    expect(within(menu).getByRole('link', { name: 'Stati delle domande di sostegno' }).getAttribute('aria-current')).toBe('page');
    stati.unmount();
    // dal dettaglio dell'intervento resta lo stato dell'indirizzo (l'intervento e' il segmento del percorso)
    apriHomeCon(ruoli, '/procedurale/interventi/SRD01?stato=AMMESSA');
    expect(await screen.findByRole('heading', { level: 1, name: 'SRD01 - Investimenti produttivi agricoli per la competitività' })).toBeTruthy();
    const delDettaglio = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(delDettaglio).getByRole('link', { name: 'Panoramica' }).getAttribute('href')).toBe('/procedurale?stato=AMMESSA');
    expect(within(delDettaglio).getByRole('link', { name: 'Panoramica' }).getAttribute('aria-current')).toBeNull();
  });

  it('profilo dell istituzionale: la card porta alla verifica SMP non SIGC e il menu ha le due verifiche, prima la non SIGC', async () => {
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json({ annoRiferimento: 2025, perimetro: 'REGIONALE', outputCumulativo: true, righe: [], ultimiDatiSincronizzati: [] })),
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json({ perimetro: 'REGIONALE', interventi: [] })),
    );
    apriHomeCon(['csr.tx-0015.read', 'csr.tx-0016.read', 'csr.tx-0060.read']);
    const card = await screen.findByRole('region', { name: 'Istituzionale' });
    expect(within(card).getByText('Disponibile')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Entra in Istituzionale' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-non-sigc');
    // col grant di TX-0016 la card mostra i totali della verifica (OP-IS-11): qui nessun intervento, zeri veri
    const cifre = await within(card).findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const gruppo = within(menu).getByRole('button', { name: 'Istituzionale' });
    const sottomenu = document.getElementById(gruppo.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(within(sottomenu).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Verifica SMP non SIGC', '/istituzionale/verifica-smp-non-sigc'],
      ['Verifica SMP SIGC', '/istituzionale/verifica-smp-sigc'],
    ]);
    expect(menu.textContent).not.toContain('Istituzionalepresto');
    // senza le letture del procedurale il suo gruppo non c'e' (nessuna area e' piu' "presto")
    expect(within(menu).queryByRole('button', { name: 'Procedurale' })).toBeNull();
  });

  it('profilo con la sola verifica SMP SIGC: la card porta alla verifica SIGC senza letture, il menu ha la sola voce', async () => {
    const letture = registra(['/api/istituzionale/verifica-smp-non-sigc', '/api/istituzionale/verifica-smp-sigc']);
    apriHomeCon(['csr.tx-0015.read']);
    const card = await screen.findByRole('region', { name: 'Istituzionale' });
    expect(within(card).getByRole('link', { name: 'Entra in Istituzionale' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-sigc');
    // senza il grant di TX-0016 la card non legge e dice cosa c'e' nell'area
    expect(within(card).getByText('Verifica SMP dei dati ASR non SIGC')).toBeTruthy();
    expect(within(card).queryByRole('group')).toBeNull();
    expect(letture).toEqual({ '/api/istituzionale/verifica-smp-non-sigc': 0, '/api/istituzionale/verifica-smp-sigc': 0 });
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getAllByRole('link').map((l) => l.textContent)).toEqual(['Verifica SMP SIGC']);
  });

  it('dal menu i filtri dell istituzionale restano passando dalla verifica non SIGC alla SIGC, senza l anno', async () => {
    server.use(
      http.get('*/api/istituzionale/verifica-smp-non-sigc', () => HttpResponse.json({ annoRiferimento: 2024, perimetro: 'REGIONALE', outputCumulativo: true, righe: [], ultimiDatiSincronizzati: [] })),
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json({ perimetro: 'REGIONALE', interventi: [] })),
    );
    apriHomeCon(['csr.tx-0015.read', 'csr.tx-0016.read', 'csr.tx-0060.read'], '/istituzionale/verifica-smp-non-sigc?intervento=SRD01&anno=2024');
    expect(await screen.findByRole('heading', { level: 1, name: 'Istituzionale: verifica SMP non SIGC' })).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getByRole('link', { name: 'Verifica SMP SIGC' }).getAttribute('href')).toBe('/istituzionale/verifica-smp-sigc?intervento=SRD01');
    expect(within(menu).getByRole('link', { name: 'Verifica SMP non SIGC' }).getAttribute('aria-current')).toBe('page');
  });

  it('la voce "Determine di una domanda" (nel procedurale dal 29/10/2026) resta corrente con il codice nel percorso (sottopercorso)', async () => {
    server.use(
      http.get('*/api/procedurale/domande/:codice/determina', () =>
        HttpResponse.json({ codiceABarre: '54810769585', tipoDomanda: 'PAGAMENTO', domandaChiusa: false, perimetro: 'REGIONALE', corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] }),
      ),
    );
    apriHomeCon(['csr.tx-0020.read', 'csr.tx-0029.read'], '/procedurale/determine/54810769585');
    expect(await screen.findByRole('heading', { level: 1, name: 'Determine della domanda 54810769585' })).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getByRole('link', { name: 'Determine di una domanda' }).getAttribute('aria-current')).toBe('page');
    expect(within(menu).getByRole('link', { name: 'Riepilogo per intervento' }).getAttribute('aria-current')).toBeNull();
  });

  it('profilo senza pagine in nessuna area: la Home lo dice, il menu non ha voci', async () => {
    apriHomeCon(['altro']);
    expect(await screen.findByText('Il tuo profilo non ha ancora aree del cruscotto da consultare.')).toBeTruthy();
    // la griglia resta di quattro ambiti: il finanziario dice che non e' nel profilo, senza link
    const card = screen.getByRole('region', { name: 'Finanziario' });
    expect(within(card).queryAllByRole('link')).toHaveLength(0);
    expect(within(card).getByText('Non disponibile per il tuo profilo')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).queryAllByRole('button')).toHaveLength(0);
    expect(within(menu).queryAllByRole('link')).toHaveLength(0);
    expect(menu.textContent).not.toContain('presto');
  });
});

describe('RF016, RF018, RF026 e RF027: le card della Home coi profili del catalogo e la cache condivisa con le pagine (review A-01, H3)', () => {
  const catalogo = JSON.parse(readFileSync(resolve(__dirname, '../handover/authz-catalog.json'), 'utf8')) as { profiles: { id: string; grants: string[] }[] };
  const grantDi = (profilo: string) => catalogo.profiles.find((p) => p.id === profilo)?.grants ?? [];
  const FINANZIARIO = { '/api/finanziario/spesa-per-intervento': F.SPESA, '/api/finanziario/totale-domande': F.TOTALE_DOMANDE };

  it('p4-responsabile-procedimento-ada: legge solo le card del finanziario e del procedurale, mai superfici e verifica', async () => {
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    const letture = registra([...Object.keys(FINANZIARIO), '/api/fisico/superficie-ammissibile', '/api/istituzionale/verifica-smp-non-sigc', '/api/istituzionale/verifica-smp-sigc'], FINANZIARIO);
    apriHomeCon(grantDi('p4-responsabile-procedimento-ada'));
    const procedurale = await screen.findByRole('region', { name: 'Procedurale' });
    expect(await within(procedurale).findByText('2 su 3 (66,7 %)')).toBeTruthy();
    await waitFor(() => expect(lette.sostegno).toEqual(['']));
    await waitFor(() => expect(letture['/api/finanziario/totale-domande']).toBe(1));
    expect(lette.ammesse).toEqual(['']);
    expect(letture['/api/fisico/superficie-ammissibile']).toBe(0);
    expect(letture['/api/istituzionale/verifica-smp-non-sigc']).toBe(0);
    expect(letture['/api/istituzionale/verifica-smp-sigc']).toBe(0);
    expect(within(screen.getByRole('region', { name: 'Fisico' })).getByText('Non disponibile per il tuo profilo')).toBeTruthy();
  });

  it('p5-amministratore-funzionale: legge solo le card del finanziario e del fisico, mai procedurale e verifica', async () => {
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    const letture = registra([...Object.keys(FINANZIARIO), '/api/fisico/superficie-ammissibile', '/api/istituzionale/verifica-smp-non-sigc'], { ...FINANZIARIO, '/api/fisico/superficie-ammissibile': SUPERFICI });
    apriHomeCon(grantDi('p5-amministratore-funzionale'));
    const fisico = await screen.findByRole('region', { name: 'Fisico' });
    expect(await within(fisico).findByText('Campagna 2025')).toBeTruthy();
    await waitFor(() => expect(letture['/api/finanziario/totale-domande']).toBe(1));
    expect(letture['/api/fisico/superficie-ammissibile']).toBe(1);
    expect(letture['/api/istituzionale/verifica-smp-non-sigc']).toBe(0);
    expect([lette.ammesse, lette.sostegno]).toEqual([[], []]);
  });

  it('fisico: dalla Home alla pagina delle superfici senza filtri, a lettura finita, una sola lettura di TX-0018 (stessa cache)', async () => {
    const letture = registra(['/api/fisico/superficie-ammissibile'], { '/api/fisico/superficie-ammissibile': SUPERFICI });
    apriHomeCon(['csr.tx-0018.read']);
    const card = await screen.findByRole('region', { name: 'Fisico' });
    expect(await within(card).findByText('Campagna 2025')).toBeTruthy();
    await userEvent.click(within(card).getByRole('link', { name: 'Entra in Fisico' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Fisico: superfici ammissibili per intervento' })).toBeTruthy();
    expect(await screen.findAllByText('Superficie ammissibile DS')).not.toHaveLength(0);
    expect(letture['/api/fisico/superficie-ammissibile']).toBe(1);
  });

  it('procedurale: dalla Home alla panoramica senza filtri, a lettura finita, una sola lettura di TX-0026 e di TX-0027', async () => {
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    apriHomeCon(['csr.tx-0026.read', 'csr.tx-0027.read']);
    const card = await screen.findByRole('region', { name: 'Procedurale' });
    expect(await within(card).findByText('2 su 3 (66,7 %)')).toBeTruthy();
    await waitFor(() => expect(lette.sostegno).toEqual(['']));
    await userEvent.click(within(card).getByRole('link', { name: 'Entra in Procedurale' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Procedurale: panoramica' })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Domande ammesse' })).toBeTruthy();
    expect(lette.ammesse).toEqual(['']);
    expect(lette.sostegno).toEqual(['']);
  });

  it('istituzionale: dalla Home alla verifica senza filtri ne anno, a lettura finita, una sola lettura di TX-0016', async () => {
    const letture = registra(['/api/istituzionale/verifica-smp-non-sigc'], { '/api/istituzionale/verifica-smp-non-sigc': VERIFICA });
    apriHomeCon(['csr.tx-0016.read']);
    const card = await screen.findByRole('region', { name: 'Istituzionale' });
    expect(await within(card).findByText('Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)')).toBeTruthy();
    await userEvent.click(within(card).getByRole('link', { name: 'Entra in Istituzionale' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Istituzionale: verifica SMP non SIGC' })).toBeTruthy();
    expect(await screen.findByRole('rowheader', { name: 'SRD01' })).toBeTruthy();
    expect(letture['/api/istituzionale/verifica-smp-non-sigc']).toBe(1);
  });
});
