import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../../shared/testing/axe';
import { VERIFICA_SMP, dato, nd, nv, rigaSmp } from '../../../../features/finanziario/testing/fixture';
import { renderPagina } from '../../../../shared/testing/render-pagina';
import Pagina from './page';

describe('RF015: i dati ASR dell ambito SIGC per il confronto con SMP - Data Platform', () => {
  it("l'esercizio e' obbligatorio e va nell'indirizzo insieme ai filtri", async () => {
    let query = '';
    server.use(
      http.get('*/api/finanziario/sigc/verifica-smp', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(VERIFICA_SMP);
      }),
    );
    const { router } = renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?intervento=SRA01');
    expect(screen.getByRole('status').textContent).toContain("Scegli l'esercizio");
    await userEvent.selectOptions(screen.getByLabelText('Esercizio finanziario'), '2025');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA01&esercizio=2025'));
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(query).toBe('?intervento=SRA01&esercizio=2025');
  });
  it('tabella per intervento con i dati di confronto', async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    const t = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(within(t).getAllByRole('columnheader')).toHaveLength(21);
    expect(t.textContent).toContain('fonte previsione di pagamento non attiva');
  });
  it("avvisi e azioni attivate e top-up incluso: il valore, oppure il motivo dell'assenza (D3, D15 del backend), mai uno 0 o un no inventati", async () => {
    const righe = [
      rigaSmp({ avvisiAttivati: nv(), azioniAttivate: nd('AVVISI_SMP'), includeTopUp: nv() }),
      rigaSmp({ codiceIntervento: 'SRA03', avvisiAttivati: dato(3), azioniAttivate: dato(0), includeTopUp: dato(true) }),
    ];
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json({ ...VERIFICA_SMP, righe })));
    renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    const t = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    const intestazioni = within(t).getAllByRole('columnheader').map((h) => h.textContent ?? '');
    const cella = (intervento: string, colonna: string) => {
      const riga = within(t).getByRole('rowheader', { name: intervento }).closest('tr');
      return riga?.children[intestazioni.findIndex((x) => x.startsWith(colonna))]?.textContent ?? '';
    };
    expect(cella('SRA01', 'Avvisi attivati')).toBe('non valorizzatoil dato non è presente nella fonte');
    expect(cella('SRA01', 'Azioni attivate')).toBe('non disponibilefonte avvisi SMP non attiva');
    expect(cella('SRA01', 'Include top-up')).toBe('non valorizzatoil dato non è presente nella fonte');
    expect(cella('SRA03', 'Avvisi attivati')).toBe('3');
    expect(cella('SRA03', 'Azioni attivate')).toBe('0');
    expect(cella('SRA03', 'Include top-up')).toBe('sì');
  });
  // review delta 21/10 V2: nel wireframe verifica-smp riapprovato il 19/10 la previsione e' una colonna di testo, non un numero
  it("previsione di pagamento e top-up incluso sono colonne di testo; i conteggi restano allineati come numeri", async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    const t = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    const intestazioni = within(t).getAllByRole('columnheader');
    const colonna = (titolo: string) => intestazioni.findIndex((h) => (h.textContent ?? '').startsWith(titolo));
    const riga = within(t).getByRole('rowheader', { name: 'SRA01' }).closest('tr');
    const numerica = (titolo: string) => [intestazioni[colonna(titolo)], riga?.children[colonna(titolo)]].map((c) => c?.classList.contains('ui-num'));
    expect(numerica("Si prevede di pagare nell'esercizio")).toEqual([false, false]);
    expect(numerica('Include top-up')).toEqual([false, false]);
    expect(numerica('Avvisi attivati')).toEqual([true, true]);
  });
  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    const { container } = renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    await expectNoA11yViolations(container);
  });
});
