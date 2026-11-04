// Revisioni del 04/11/2026 (secondo feedback di Leonardo/Deloitte): l'avviso degli impegnati diversi in Dotazione e spesa (da
// TX-0011, col suo grant) e la paginazione che dice cosa conta ("Pagamenti per pagina", non "Righe per pagina").
import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { renderPagina } from '../src/shared/testing/render-pagina';
import { DISTRIBUZIONE, RIEPILOGO, SPESA } from '../src/features/finanziario/testing/fixture';
import { Paginazione } from '../src/shared/ui/tabella/Paginazione';
import PaginaDotazione from '../src/pages/finanziario/dotazione/page';

const DIVERSO = { ...RIEPILOGO.righe[0], codiceIntervento: 'SRA03', impegnatoCofinanziatoFeasr: { valore: 24323222.99 }, impegnatoCofinanziatoFeasrENon: { valore: 45273920.69 } };
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');

function servi(riepilogo: Record<string, unknown>) {
  let letture = 0;
  server.use(
    http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
    http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
    http.get('*/api/finanziario/riepilogo', () => {
      letture += 1;
      return HttpResponse.json(riepilogo as never);
    }),
  );
  return () => letture;
}

describe('Dotazione e spesa: avviso degli impegnati diversi (TX-0011)', () => {
  it("con il grant di TX-0011 l'avviso elenca gli interventi coi due impegnati diversi, sopra il grafico", async () => {
    servi({ ...RIEPILOGO, righe: [DIVERSO, RIEPILOGO.righe[1]] });
    renderPagina(PaginaDotazione, '/finanziario/dotazione');
    const avviso = await screen.findByRole('note');
    expect(testo(avviso.textContent)).toBe(
      "Impegnato cofinanziato FEASR diverso dall'impegnato FEASR e non in 1 intervento. Il cofinanziato FEASR è riportato alla dotazione quando l'impegnato la supera: SRA03 24.323.222,99 € su 45.273.920,69 €. Negli altri interventi i due impegnati coincidono con l'impegnato di spesa pubblica.",
    );
  });

  it("impegnati valorizzati e uguali: TX-0011 letto e nessun avviso; senza il grant di TX-0011 nessuna lettura e nessun avviso", async () => {
    const uguali = RIEPILOGO.righe.map((r) => ({ ...r, impegnatoCofinanziatoFeasr: { valore: 13879326.08 }, impegnatoCofinanziatoFeasrENon: { valore: 13879326.08 } }));
    const letture = servi({ ...RIEPILOGO, righe: uguali });
    const { unmount } = renderPagina(PaginaDotazione, '/finanziario/dotazione');
    await screen.findByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    // l'assenza conta solo a lettura arrivata (J-05): prima l'avviso mancherebbe comunque
    await waitFor(() => expect(letture()).toBe(1));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(screen.queryByRole('note')).toBeNull();
    unmount();
    const senza = servi({ ...RIEPILOGO, righe: [DIVERSO] });
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles: ['csr.tx-0001.read', 'csr.tx-0002.read', 'csr.tx-0003.read'] } })));
    renderPagina(PaginaDotazione, '/finanziario/dotazione');
    await screen.findByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    expect(screen.queryByRole('note')).toBeNull();
    expect(senza()).toBe(0);
    expect(letture()).toBeGreaterThan(0);
  });

  it.each([
    [500, 'urn:cruscottocsr:problem:internal'],
    [403, 'urn:cruscottocsr:problem:forbidden'],
  ])('TX-0011 in errore %i: nessun avviso e nessun errore suo, la pagina resta quella di TX-0002 e TX-0003 (J-05)', async (status, type) => {
    let letture = 0;
    server.use(
      http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
      http.get('*/api/finanziario/distribuzione-dotazione', () => HttpResponse.json(DISTRIBUZIONE)),
      http.get('*/api/finanziario/riepilogo', () => {
        letture += 1;
        return HttpResponse.json({ type, title: 'Errore', status }, { status, headers: { 'Content-Type': 'application/problem+json' } });
      }),
    );
    renderPagina(PaginaDotazione, '/finanziario/dotazione');
    await screen.findByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    await waitFor(() => expect(letture).toBeGreaterThan(0));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('region', { name: 'Dotazione, impegnato e pagamenti per intervento' })).toBeTruthy();
  });
});

describe('Paginazione: la scelta per pagina dice cosa conta', () => {
  it('"Pagamenti per pagina" e il totale coi separatori delle migliaia', () => {
    render(<Paginazione pagina={0} dimensione={25} totale={62370} unita={['pagamento', 'pagamenti']} onPagina={() => {}} onDimensione={() => {}} />);
    expect(screen.getByRole('combobox', { name: 'Pagamenti per pagina' })).toBeTruthy();
    expect(screen.getByText('Pagina 1 di 2.495 - 62.370 pagamenti')).toBeTruthy();
  });

  it('un solo risultato al singolare: "1 pagamento", "1 domanda" (J-17)', () => {
    const { unmount } = render(<Paginazione pagina={0} dimensione={25} totale={1} unita={['pagamento', 'pagamenti']} onPagina={() => {}} onDimensione={() => {}} />);
    expect(screen.getByText('Pagina 1 di 1 - 1 pagamento')).toBeTruthy();
    unmount();
    render(<Paginazione pagina={0} dimensione={25} totale={1} unita={['domanda', 'domande']} onPagina={() => {}} onDimensione={() => {}} />);
    expect(screen.getByText('Pagina 1 di 1 - 1 domanda')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Domande per pagina' })).toBeTruthy();
  });
});
