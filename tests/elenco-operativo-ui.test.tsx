// Test dei componenti dell'elenco operativo (green-fe step5) per il riallineamento degli ambiti del 30/10/2026: la scheda
// Determine della scheda della domanda col link determine-della-domanda verso l'area Procedurale (scelta S-3 b, OP-EO-07).
// Un test L2 (render nel router in memoria, ruoli e stati accessibili) e un test a11y con axe-core diretto. Il componente
// non legge nulla: tabella e link vengono dalla scheda (TX-0058) e dall'indirizzo costruito da lib.
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { DETTAGLIO } from '../src/features/elenco-operativo/testing/fixture';
import { TabellaDetermine } from '../src/features/elenco-operativo/ui/TabelleScheda';
import type { DeterminaDellaDomandaElenco } from '../src/features/elenco-operativo/api';
import type { ArrivoDallaScheda } from '../src/entities/domanda';

const LINK = "Apri le determine della domanda nell'area Procedurale";

function Arrivo() {
  const { codice } = useParams();
  return <h1>{`Determine della domanda ${codice ?? ''}`}</h1>;
}

function apri(determine: DeterminaDellaDomandaElenco[], determineDellaDomanda: string | null, statoDetermine?: ArrivoDallaScheda) {
  const router = createMemoryRouter(
    [
      { path: '/scheda', element: <TabellaDetermine determine={determine} determineDellaDomanda={determineDellaDomanda} statoDetermine={statoDetermine} /> },
      { path: '/procedurale/determine/:codice?', Component: Arrivo },
    ],
    { initialEntries: ['/scheda'] },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

describe('elenco operativo, scheda Determine col link alle determine del procedurale (OP-EO-07)', () => {
  it('sotto la tabella il link col testo del wireframe porta alle determine della domanda, col tipo della scheda nello state', async () => {
    const { router } = apri(DETTAGLIO.determine ?? [], '/procedurale/determine/54230000001', { tipoDellaScheda: 'PAGAMENTO' });
    const tabella = screen.getByRole('table', { name: /^Determine della domanda/ });
    const link = screen.getByRole('link', { name: LINK });
    expect(link.getAttribute('href')).toBe('/procedurale/determine/54230000001');
    // il link sta dopo la tabella, con la frase del wireframe
    expect(tabella.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(link.parentElement?.textContent).toBe(`${LINK}: la determina corrente e quella da cui vengono stato area programmazione e comparto.`);
    await userEvent.click(link);
    expect(await screen.findByRole('heading', { level: 1, name: 'Determine della domanda 54230000001' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/procedurale/determine/54230000001');
    // decisione D1 del 30/10/2026: il tipo della scheda nello state della navigazione, mai nell'indirizzo
    expect(router.state.location.state).toEqual({ tipoDellaScheda: 'PAGAMENTO' });
    expect(router.state.location.search).toBe('');
  });

  it('il link si raggiunge e si attiva da tastiera', async () => {
    const { router } = apri(DETTAGLIO.determine ?? [], '/procedurale/determine/54230000001');
    const link = screen.getByRole('link', { name: LINK });
    link.focus();
    expect(document.activeElement).toBe(link);
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Determine della domanda 54230000001' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/procedurale/determine/54230000001');
  });

  it('con la scheda vuota resta lo stato vuoto e, sotto, il link (la pagina del procedurale dice il motivo)', () => {
    apri([], '/procedurale/determine/54230000001');
    const vuoto = screen.getByRole('status');
    expect(within(vuoto).getByText('Nessuna determina per questa domanda.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('link', { name: LINK }).getAttribute('href')).toBe('/procedurale/determine/54230000001');
  });

  it('senza indirizzo (senza il grant di TX-0020) la scheda resta com era, senza link', () => {
    apri(DETTAGLIO.determine ?? [], null);
    expect(screen.getByRole('table', { name: /^Determine della domanda/ })).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/area Procedurale/)).toBeNull();
  });

  it('nessuna violazione axe, con le righe e con la scheda vuota', async () => {
    const { container, unmount } = apri(DETTAGLIO.determine ?? [], '/procedurale/determine/54230000001');
    await expectNoA11yViolations(container);
    unmount();
    const vuota = apri([], '/procedurale/determine/54230000001');
    await expectNoA11yViolations(vuota.container);
  });
});
