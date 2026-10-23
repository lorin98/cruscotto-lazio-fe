// Kit comune portato fuori dalle feature (o esteso) per il procedurale: l'impaginazione della pagina di report con la
// barra dei filtri (shared/ui/pagina, prima PaginaReport dell'istituzionale), lo stato del dettaglio con piu' letture
// (prima nel dettaglio dell'istituzionale) e le estensioni della tabella interattiva (intestazioni di gruppo, nome esteso
// delle intestazioni, intestazione di riga in un'altra colonna) e della scelta delle colonne per gruppo. Dati inventati.
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { PaginaConFiltri, useStatoDelDettaglio } from '../src/shared/ui';
import { renderConQuery } from '../src/shared/testing/render';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

function Pagina() {
  const h1 = useRef<HTMLHeadingElement>(null);
  return (
    <PaginaConFiltri
      barra={{ chip: [{ chiave: 'intervento:SRD01', etichetta: 'Intervento', valore: 'SRD01', onTogli: () => undefined }], onApri: () => undefined, destra: <span className="ui-pill">Perimetro: regionale</span> }}
      briciole={[{ etichetta: 'Area', a: '/area' }, { etichetta: 'Pagina' }]}
      testa={{ titolo: 'Area: pagina', titoloDocumento: 'Pagina - Area', sottotitolo: 'Sottotitolo', refTitolo: h1 }}
      sopra={<p>Sopra il corpo</p>}
      pannello={<aside aria-label="Pannello di prova">Pannello</aside>}
    >
      <p>Corpo della pagina</p>
    </PaginaConFiltri>
  );
}

describe('PaginaConFiltri del kit (prima PaginaReport dell istituzionale): barra, percorso, titolo, sopra, corpo nell avviso, pannello', () => {
  it('nell ordine dei wireframe; un solo h1 col focus e il titolo del documento; nessuna violazione axe', async () => {
    const router = createMemoryRouter([{ path: '/', Component: Pagina }], { initialEntries: ['/'] });
    const { container } = renderConQuery(<RouterProvider router={router} />);
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRD01' })).toBeTruthy();
    expect(within(barra).getByText('Perimetro: regionale')).toBeTruthy();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('navigation', { name: 'Percorso' }).textContent).toBe('HomeAreaPagina');
    const h1 = within(main).getByRole('heading', { level: 1, name: 'Area: pagina' });
    expect(document.activeElement).toBe(h1);
    expect(document.title).toBe('Pagina - Area - Cruscotto CSR 2023-2027');
    const testi = Array.from(main.querySelectorAll('p')).map((p) => p.textContent);
    expect(testi.indexOf('Sopra il corpo')).toBeLessThan(testi.indexOf('Corpo della pagina'));
    expect(screen.getByText('Corpo della pagina').closest('.ui-avviso-pagina')).toBeTruthy();
    expect(main.contains(screen.getByRole('complementary', { name: 'Pannello di prova' }))).toBe(false);
    await expectNoA11yViolations(container);
  });
});

describe('useStatoDelDettaglio del kit (prima nel dettaglio dell istituzionale)', () => {
  it('scheletro alla prima apertura finche non rispondono tutte; poi una lettura che riparte non riporta allo scheletro', () => {
    const ok = { data: { righe: [{}] }, isError: false };
    const inCorso = { data: undefined, isError: false };
    const { result, rerender } = renderHook((p: { letture: { data?: { righe?: unknown[] }; isError: boolean }[] }) => useStatoDelDettaglio(p.letture), { initialProps: { letture: [ok, inCorso] } });
    expect(result.current).toBe('caricamento');
    rerender({ letture: [ok, ok] });
    expect(result.current).toBe('dati');
    rerender({ letture: [ok, inCorso] });
    expect(result.current).toBe('dati');
  });
});
