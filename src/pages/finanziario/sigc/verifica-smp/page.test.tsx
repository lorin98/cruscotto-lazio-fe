import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../../shared/testing/axe';
import { VERIFICA_SMP } from '../../../../features/finanziario/testing/fixture';
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
    const dato = <T,>(valore: T) => ({ valore, motivo: null, fonte: null });
    const nv = { valore: null, motivo: 'NON_VALORIZZATO', fonte: null };
    const righe = [
      { ...VERIFICA_SMP.righe[0], avvisiAttivati: nv, azioniAttivate: { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'AVVISI_SMP' }, includeTopUp: nv },
      { ...VERIFICA_SMP.righe[0], codiceIntervento: 'SRA03', avvisiAttivati: dato(3), azioniAttivate: dato(0), includeTopUp: dato(true) },
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
  it('nessuna violazione axe', async () => {
    server.use(http.get('*/api/finanziario/sigc/verifica-smp', () => HttpResponse.json(VERIFICA_SMP)));
    const { container } = renderPagina(Pagina, '/finanziario/sigc/verifica-smp', '/finanziario/sigc/verifica-smp?esercizio=2025');
    await screen.findByRole('table', { name: /dati ASR per intervento/ });
    await expectNoA11yViolations(container);
  });
});
