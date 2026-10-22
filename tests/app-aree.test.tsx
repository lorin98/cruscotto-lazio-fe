// app-aree.test.tsx — catalogo unico delle aree (review step9 H-22): la Home e il menu laterale lo iterano, le pagine
// di un'area vengono dal barrel della feature e sono route della route-table, le aree future stanno in una sola lista.
// Gli ambiti sono quattro, ognuno col suo colore; il primo pilastro non ha un ambito nel frontend (12/10/2026).
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, matchPath, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { rispondi } from '../src/shared/testing/msw';
import { formatNumber } from '../src/shared/lib';
import * as F from '../src/features/finanziario/testing/fixture';
import { AREE, AREE_FUTURE, areeVisibili } from '../src/app/aree';
import { appRoutes } from '../src/app/routes';
import routeTable from '../src/app/route-table.json';
import { pagineVisibili } from '../src/features/finanziario';
import { pagineVisibili as pagineFisico } from '../src/features/fisico';
import { PAGINE_FINANZIARIO } from '../src/features/finanziario/lib/report';
import { PAGINE_FISICO } from '../src/features/fisico/lib/pagine';
import { clientApp } from './app-client';

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

  it('finanziario e fisico prendono le pagine visibili dal barrel della feature', () => {
    expect(AREE.find((a) => a.chiave === 'finanziario')?.pagineVisibili).toBe(pagineVisibili);
    expect(AREE.find((a) => a.chiave === 'fisico')?.pagineVisibili).toBe(pagineFisico);
    expect(areeVisibili(() => true).map((a) => a.pagine)).toEqual([PAGINE_FINANZIARIO, PAGINE_FISICO]);
    expect(areeVisibili(() => false)).toEqual([]);
  });

  it('le pagine del fisico aprono col grant della loro route (visibility della route-table)', () => {
    for (const p of PAGINE_FISICO) {
      const route = routeTable.routes.find((r) => matchPath(r.path, p.percorso));
      expect(route?.visibility).toEqual([p.grant]);
    }
  });

  it('card della Home dal contenuto reale delle feature (decisione G1 del 21/10/2026)', () => {
    const fisico = AREE.find((a) => a.chiave === 'fisico');
    expect(fisico?.contenuti.join(' ')).toMatch(/Superfici ammissibili/);
    expect(fisico?.contenuti.join(' ')).toMatch(/Determine/);
    expect(fisico?.contenuti.join(' ')).not.toMatch(/Output programmato|Unit Amount/);
    const procedurale = AREE_FUTURE.find((a) => a.chiave === 'procedurale');
    expect(procedurale?.contenuti.join(' ')).toMatch(/Unit Amount/);
    expect(procedurale?.contenuti.join(' ')).not.toMatch(/Determine, responsabili/);
    const istituzionale = AREE_FUTURE.find((a) => a.chiave === 'istituzionale');
    expect(istituzionale?.contenuti.join(' ')).toMatch(/Output regionale programmato e realizzato/);
    expect(AREE_FUTURE.map((a) => a.chiave)).toEqual(['procedurale', 'istituzionale']);
  });

  it('una ricerca conservata porta solo i filtri del finanziario', () => {
    const finanziario = AREE.find((a) => a.chiave === 'finanziario');
    expect(finanziario?.ricercaConservata?.('?intervento=SRA01&pagina=3')).toBe('intervento=SRA01');
  });

  it('le aree future non sono aree realizzate', () => {
    expect(AREE_FUTURE.filter((f) => AREE.some((a) => a.titolo === f.titolo))).toEqual([]);
  });

  it('quattro ambiti, ognuno col suo colore, senza il primo pilastro', () => {
    const ambiti = [...AREE, ...AREE_FUTURE];
    expect(ambiti.map((a) => a.titolo)).toEqual(['Finanziario', 'Fisico', 'Procedurale', 'Istituzionale']);
    expect(new Set(ambiti.map((a) => a.tono)).size).toBe(4);
    expect(new Set(ambiti.map((a) => a.chiave)).size).toBe(4);
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
    for (const futura of AREE_FUTURE) {
      const presto = screen.getByRole('region', { name: `${futura.titolo}: presto disponibile` });
      expect(within(presto).queryAllByRole('link')).toHaveLength(0);
      expect(menu.textContent).toContain(`${futura.titolo}presto`);
    }
    // i quattro ambiti stanno nella stessa griglia, nell'ordine del catalogo
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

  it('profilo del fisico: la card porta alle superfici e il menu ha le due pagine', async () => {
    apriHomeCon(['csr.tx-0018.read', 'csr.tx-0020.read']);
    const card = await screen.findByRole('region', { name: 'Fisico' });
    expect(within(card).getByText('Disponibile')).toBeTruthy();
    expect(within(card).getByRole('link', { name: 'Entra in Fisico' }).getAttribute('href')).toBe('/fisico/superfici');
    expect(within(card).getByText('Determine da cui una domanda prende le informazioni')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const gruppo = within(menu).getByRole('button', { name: 'Fisico' });
    const sottomenu = document.getElementById(gruppo.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(within(sottomenu).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Superfici ammissibili', '/fisico/superfici'],
      ['Determine di una domanda', '/fisico/determine'],
    ]);
    expect(menu.textContent).not.toContain('Fisicopresto');
    expect(menu.textContent).toContain('Proceduralepresto');
  });

  it('la voce "Determine di una domanda" resta corrente con il codice nel percorso (sottopercorso)', async () => {
    server.use(
      http.get('*/api/fisico/domande/:codice/determina', () =>
        HttpResponse.json({ codiceABarre: '54810769585', tipoDomanda: 'PAGAMENTO', domandaChiusa: false, corrente: { valore: null, motivo: 'NON_VALORIZZATO' }, elenco: [] }),
      ),
    );
    apriHomeCon(['csr.tx-0018.read', 'csr.tx-0020.read'], '/fisico/determine/54810769585');
    expect(await screen.findByRole('heading', { level: 1, name: 'Determine della domanda 54810769585' })).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).getByRole('link', { name: 'Determine di una domanda' }).getAttribute('aria-current')).toBe('page');
    expect(within(menu).getByRole('link', { name: 'Superfici ammissibili' }).getAttribute('aria-current')).toBeNull();
  });

  it('profilo senza pagine in nessuna area: la Home lo dice, il menu ha solo le aree future', async () => {
    apriHomeCon(['altro']);
    expect(await screen.findByText('Il tuo profilo non ha ancora aree del cruscotto da consultare.')).toBeTruthy();
    // la griglia resta di quattro ambiti: il finanziario dice che non e' nel profilo, senza link
    const card = screen.getByRole('region', { name: 'Finanziario' });
    expect(within(card).queryAllByRole('link')).toHaveLength(0);
    expect(within(card).getByText('Non disponibile per il tuo profilo')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Navigazione principale' });
    expect(within(menu).queryAllByRole('button')).toHaveLength(0);
    expect(within(menu).queryAllByRole('link')).toHaveLength(0);
    expect(menu.textContent).toContain('Istituzionalepresto');
  });
});
