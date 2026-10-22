// Kit comune portato fuori dalle feature (o esteso) per l'istituzionale: selettore d'anno e anno della pagina
// nell'indirizzo (shared/ui, prima nel finanziario), link verso l'elenco operativo (entities/domanda, prima nel
// finanziario). Dati di prova inventati.
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SelettoreAnno, useAnnoNellIndirizzo } from '../src/shared/ui';
import { SelettoreAnno as SelettoreFinanziario } from '../src/features/finanziario/ui/SelettoreAnno';
import { ApriNellElenco as ApriFinanziario } from '../src/features/finanziario/ui/LinkElenco';
import { ApriNellElenco } from '../src/entities/domanda';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

describe('SelettoreAnno del kit: select con Mostra, gli anni e la voce senza anno di chi lo usa', () => {
  it('la scelta si applica solo con Mostra; la voce vuota vale nessun anno; l aiuto e collegato alla select', async () => {
    const onCambia = vi.fn();
    const { container } = render(<SelettoreAnno id="f-anno" etichetta="Anno di riferimento" aiuto="Facoltativo." anni={[2024, 2025]} voceVuota="Ultimo anno con un file (predefinito)" anno={undefined} onCambia={onCambia} />);
    const select = screen.getByRole('combobox', { name: 'Anno di riferimento' });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Ultimo anno con un file (predefinito)', '2024', '2025']);
    expect(select.getAttribute('aria-describedby')).toBe('f-anno-aiuto');
    expect(document.getElementById('f-anno-aiuto')?.textContent).toBe('Facoltativo.');
    await userEvent.selectOptions(select, '2024');
    expect(onCambia).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenLastCalledWith(2024);
    await userEvent.selectOptions(select, '');
    await userEvent.click(screen.getByRole('button', { name: 'Mostra' }));
    expect(onCambia).toHaveBeenLastCalledWith(undefined);
    await expectNoA11yViolations(container);
  });

  it('il finanziario lo usa con gli anni del periodo CSR e "Scegli un anno" (stesso comportamento di prima)', () => {
    render(<SelettoreFinanziario id="f-es" etichetta="Esercizio finanziario" aiuto="Obbligatorio." tipo="esercizio" anno={2031} onCambia={() => undefined} />);
    const voci = screen.getAllByRole('option').map((o) => o.textContent);
    expect(voci[0]).toBe('Scegli un anno');
    expect(voci.slice(1)).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031']);
  });
});

describe('useAnnoNellIndirizzo del kit: l anno della pagina nella query string', () => {
  function Prova() {
    const [anno, imposta] = useAnnoNellIndirizzo('anno');
    return (
      <>
        <p>{`anno ${anno ?? 'nessuno'}`}</p>
        <button type="button" onClick={() => imposta(2024)}>
          2024
        </button>
        <button type="button" onClick={() => imposta(undefined)}>
          togli
        </button>
      </>
    );
  }

  it('un valore non valido vale nessun anno; la scelta lascia i filtri e sostituisce la voce di cronologia', async () => {
    const router = createMemoryRouter([{ path: '*', Component: Prova }], { initialEntries: ['/altra', '/report?intervento=SRD01&anno=abc'], initialIndex: 1 });
    render(<RouterProvider router={router} />);
    expect(screen.getByText('anno nessuno')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01&anno=2024'));
    expect(screen.getByText('anno 2024')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'togli' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRD01'));
    // replace: tornando indietro si arriva alla pagina di prima, non alle scelte d'anno
    void router.navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).toBe('/altra'));
  });
});

describe('ApriNellElenco di entities/domanda: il link di drill-down verso l elenco operativo (prima nel finanziario)', () => {
  it('nome accessibile completo che contiene il testo visibile; senza indirizzo nulla; il finanziario riesporta lo stesso', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <>
              <ApriNellElenco variante="testo" indirizzo="/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01" descrizione="le domande di sostegno correnti dell'intervento SRD01" />
              <ApriNellElenco variante="testo" indirizzo="/elenco-operativo/pagamenti?esito=PAGATA" testo="Apri nei pagamenti" descrizione="le righe pagate non SIGC dell'intervento SRD01" />
              <ApriNellElenco indirizzo={null} descrizione="nessuna" />
            </>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    const { container } = render(<RouterProvider router={router} />);
    const link = screen.getAllByRole('link');
    expect(link.map((l) => [l.textContent, l.getAttribute('aria-label'), l.getAttribute('href')])).toEqual([
      ["Apri nell'elenco", "Apri nell'elenco operativo le domande di sostegno correnti dell'intervento SRD01", '/elenco-operativo/domande?tipo=SOSTEGNO&intervento=SRD01'],
      ['Apri nei pagamenti', "Apri nei pagamenti: apri nell'elenco operativo le righe pagate non SIGC dell'intervento SRD01", '/elenco-operativo/pagamenti?esito=PAGATA'],
    ]);
    expect(link[0].className).toBe('ui-link-elenco');
    expect(ApriFinanziario).toBe(ApriNellElenco);
    await expectNoA11yViolations(container);
  });
});
