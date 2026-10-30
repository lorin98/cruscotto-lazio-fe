// Pagina /elenco-operativo/domande/:tipo/:codiceABarre (green-fe step7): describe taggati col REQ della route (RA004).
// Dal riallineamento degli ambiti (flusso dettaglio-domanda approvato il 30/10/2026, scelta S-3 b, OP-EO-07): sotto la
// tabella della scheda Determine il link "Apri le determine della domanda nell'area Procedurale" verso
// /procedurale/determine/<codice a barre della scheda>, solo con csr.tx-0020.read; anche con la scheda vuota; il tipo della
// scheda nello state della navigazione (decisione D1 del 30/10/2026). Le altre route finiscono sul segnaposto di
// renderPagina: l'arrivo si guarda nel router.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { renderPagina } from '../../../shared/testing/render-pagina';
import { DETTAGLIO, VALORI } from '../../../features/elenco-operativo/testing/fixture';
import Pagina from './page';

const ROUTE = '/elenco-operativo/domande/:tipo/:codiceABarre';
const SCHEDA = '/elenco-operativo/domande/PAGAMENTO/54230000001';
const LINK = "Apri le determine della domanda nell'area Procedurale";
const ELENCO = ['csr.tx-0056.read', 'csr.tx-0057.read', 'csr.tx-0058.read', 'csr.tx-0059.read', 'csr.tx-0060.read'];
/** p1-dirigente, p2-referente-adg, p3-funzionario-area-pro e p4 hanno anche le determine (TX-0020); p5 no (catalogo rev. 4). */
const CON_DETERMINE = [...ELENCO, 'csr.tx-0020.read'];

function servi(roles: string[], dettaglio: typeof DETTAGLIO = DETTAGLIO) {
  server.use(
    http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p1-dirigente', roles } })),
    // la pagina legge anche attoConcessioneDisponibile dai valori dei filtri (TX-0060, review delta 21/10 X2 e passata 2 V1)
    http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
    http.get('*/api/elenco-operativo/domande/:tipo/:codice', () => HttpResponse.json(dettaglio)),
  );
}

async function apriDetermine(etichetta = 'Determine (1)') {
  await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
  await userEvent.click(screen.getByRole('tab', { name: etichetta }));
  return screen.getByRole('tabpanel');
}

describe('RA004: pagina /elenco-operativo/domande/:tipo/:codiceABarre (TX-0058)', () => {
  it('legge la domanda dei parametri del percorso', async () => {
    let letto = '';
    server.use(
      // la pagina legge anche attoConcessioneDisponibile dai valori dei filtri (TX-0060, review delta 21/10 X2 e passata 2 V1)
      http.get('*/api/elenco-operativo/filtri', () => HttpResponse.json(VALORI)),
      http.get('*/api/elenco-operativo/domande/:tipo/:codice', ({ params }) => {
        letto = `${String(params.tipo)}/${String(params.codice)}`;
        return HttpResponse.json(DETTAGLIO);
      }),
    );
    renderPagina(Pagina, ROUTE, '/elenco-operativo/domande/PAGAMENTO/54230000001');
    expect(await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' })).toBeTruthy();
    expect(letto).toBe('PAGAMENTO/54230000001');
  });
});

describe("RA004: link alle determine della domanda nell'area Procedurale (OP-EO-07, scelta S-3 b del 30/10/2026)", () => {
  it('con csr.tx-0020.read il link sta sotto la tabella Determine e porta alle determine della domanda della scheda', async () => {
    servi(CON_DETERMINE);
    const { router } = renderPagina(Pagina, ROUTE, SCHEDA);
    const pannello = await apriDetermine();
    const tabella = within(pannello).getByRole('table', { name: /^Determine della domanda/ });
    const link = within(pannello).getByRole('link', { name: LINK });
    expect(link.getAttribute('href')).toBe('/procedurale/determine/54230000001');
    expect(tabella.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(link.parentElement?.textContent).toBe(`${LINK}: la determina corrente e quella da cui vengono stato area programmazione e comparto.`);
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/procedurale/determine/54230000001'));
    expect(screen.getByText('altra pagina')).toBeTruthy();
    expect(router.state.location.state).toEqual({ tipoDellaScheda: 'PAGAMENTO' });
  });

  // decisione D1 dell'utente del 30/10/2026 (review step9 EO-01): TX-0020 ha solo il codice a barre e, per un codice di due
  // domande, sceglie con la regola dell'aggancio (SC-PC_DETERMINA_TIPO: 34810022870 e' SOSTEGNO e PAGAMENTO, risponde la
  // PAGAMENTO); il link porta il tipo della scheda nello state, e la pagina delle determine avvisa se mostra l'altra
  it('scheda SOSTEGNO 34810022870 (SC-PC_DETERMINA_TIPO): il link porta il tipo della scheda nello state, mai nell indirizzo', async () => {
    const sostegno = { ...DETTAGLIO, domanda: { ...DETTAGLIO.domanda, tipo: 'SOSTEGNO' as const, codiceABarre: '34810022870' } };
    servi(CON_DETERMINE, sostegno);
    const { router } = renderPagina(Pagina, ROUTE, '/elenco-operativo/domande/SOSTEGNO/34810022870');
    const link = within(await apriDetermine()).getByRole('link', { name: LINK });
    expect(link.getAttribute('href')).toBe('/procedurale/determine/34810022870');
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe('/procedurale/determine/34810022870'));
    expect(router.state.location.search).toBe('');
    expect(router.state.location.state).toEqual({ tipoDellaScheda: 'SOSTEGNO' });
  });

  it('senza csr.tx-0020.read (es. p5) la scheda Determine resta com era: nessun link verso il procedurale', async () => {
    servi(ELENCO);
    renderPagina(Pagina, ROUTE, SCHEDA);
    const pannello = await apriDetermine();
    expect(within(pannello).getByRole('table', { name: /^Determine della domanda/ })).toBeTruthy();
    expect(within(pannello).queryByRole('link', { name: LINK })).toBeNull();
    expect(screen.queryByText(/area Procedurale/)).toBeNull();
  });

  it('con la scheda Determine vuota il link resta sotto lo stato vuoto (la pagina del procedurale dice il motivo)', async () => {
    servi(CON_DETERMINE, { ...DETTAGLIO, determine: [] });
    renderPagina(Pagina, ROUTE, SCHEDA);
    const pannello = await apriDetermine('Determine (0)');
    expect(within(pannello).getByRole('status').textContent).toBe('Nessuna determina per questa domanda.');
    expect(within(pannello).queryByRole('table')).toBeNull();
    expect(within(pannello).getByRole('link', { name: LINK }).getAttribute('href')).toBe('/procedurale/determine/54230000001');
  });

  it('da tastiera: frecce fino alla scheda Determine, Tab fino al link, Invio apre le determine', async () => {
    servi(CON_DETERMINE);
    const { router } = renderPagina(Pagina, ROUTE, SCHEDA);
    await screen.findByRole('heading', { level: 1, name: 'COOPERATIVA VERDI' });
    screen.getByRole('tab', { name: 'Sintesi' }).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    const scheda = screen.getByRole('tab', { name: 'Determine (1)' });
    expect(document.activeElement).toBe(scheda);
    expect(scheda.getAttribute('aria-selected')).toBe('true');
    const link = within(screen.getByRole('tabpanel')).getByRole('link', { name: LINK });
    // prima del link il bottone Colonne della tabella: jsdom lascia nel giro del Tab anche le caselle del suo details
    // chiuso (il browser no), quindi qui si conta largo
    for (let i = 0; i < 20 && document.activeElement !== link; i += 1) await userEvent.tab();
    expect(document.activeElement).toBe(link);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/procedurale/determine/54230000001'));
  });

  it('nessuna violazione axe con il link nella scheda Determine', async () => {
    servi(CON_DETERMINE);
    const { container } = renderPagina(Pagina, ROUTE, SCHEDA);
    const pannello = await apriDetermine();
    expect(within(pannello).getByRole('link', { name: LINK })).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
