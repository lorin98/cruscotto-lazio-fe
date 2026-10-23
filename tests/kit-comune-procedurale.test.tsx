// Kit comune portato fuori dalle feature (o esteso) per il procedurale: l'impaginazione della pagina di report con la
// barra dei filtri (shared/ui/pagina, prima PaginaReport dell'istituzionale), lo stato del dettaglio con piu' letture
// (prima nel dettaglio dell'istituzionale) e le estensioni della tabella interattiva (intestazioni di gruppo, nome esteso
// delle intestazioni, intestazione di riga in un'altra colonna) e della scelta delle colonne per gruppo. Dati inventati.
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { PaginaConFiltri, TabellaInterattiva, useStatoDelDettaglio } from '../src/shared/ui';
import type { ColonnaTabella } from '../src/shared/ui';
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

describe('TabellaInterattiva del kit: intestazioni di gruppo, nome esteso, intestazione di riga in un altra colonna (procedurale)', () => {
  type R = { codice: string; ua: string; a: number; b: number; c: number };
  const righe: R[] = [
    { codice: 'SRD01', ua: 'UA1', a: 1, b: 2, c: 3 },
    { codice: 'SRA01', ua: 'UA2', a: 4, b: 5, c: 6 },
  ];
  const colonne: ColonnaTabella<R>[] = [
    { chiave: 'codice', titolo: 'Intervento', valore: (r) => r.codice, fissa: true },
    { chiave: 'ua', titolo: 'Unit Amount', valore: (r) => r.ua },
    { chiave: 'a', titolo: 'Totale', valore: (r) => r.a, numerica: true, gruppo: 'Sostegno', nomeEsteso: 'Totale (Sostegno)' },
    { chiave: 'b', titolo: 'Di cui', valore: (r) => r.b, numerica: true, gruppo: 'Sostegno', nascosta: true },
    { chiave: 'c', titolo: 'Totale', valore: (r) => r.c, numerica: true, gruppo: 'Pagamento', nomeEsteso: 'Totale (Pagamento)' },
  ];

  it('la riga dei gruppi con scope colgroup sopra le colonne visibili; i bottoni col nome esteso; Colonne per gruppo', async () => {
    const { container } = render(<TabellaInterattiva caption="Prova" righe={righe} colonne={colonne} chiaveRiga={(r) => r.codice} testoRicerca={(r) => r.codice} />);
    const [gruppi] = container.querySelectorAll('thead tr');
    expect(Array.from(gruppi.children).map((c) => [c.tagName, c.textContent, c.getAttribute('scope'), c.getAttribute('colspan')])).toEqual([
      ['TD', '', null, '2'],
      ['TH', 'Sostegno', 'colgroup', '1'],
      ['TH', 'Pagamento', 'colgroup', '1'],
    ]);
    expect(screen.getByRole('button', { name: 'Totale (Sostegno)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Totale (Pagamento)' })).toBeTruthy();
    await userEvent.click(screen.getByText('Colonne'));
    const sostegno = screen.getByRole('group', { name: 'Sostegno' });
    expect(within(sostegno).getAllByRole('checkbox').map((c) => [c.closest('label')?.textContent, (c as HTMLInputElement).checked])).toEqual([
      ['Totale', true],
      ['Di cui', false],
    ]);
    await userEvent.click(within(sostegno).getByRole('checkbox', { name: 'Di cui' }));
    expect(Array.from(container.querySelectorAll('thead tr')[0].children).map((c) => c.getAttribute('colspan'))).toEqual(['2', '2', '1']);
    await expectNoA11yViolations(container);
  });

  it('senza gruppi nessuna riga in piu; l intestazione di riga nella colonna data, la prima di default', () => {
    const semplici = colonne.map((c) => ({ ...c, gruppo: undefined }));
    const { container, unmount } = render(<TabellaInterattiva caption="Prova" righe={righe} colonne={semplici} chiaveRiga={(r) => r.codice} testoRicerca={(r) => r.codice} intestazioneRiga="ua" />);
    expect(container.querySelectorAll('thead tr')).toHaveLength(1);
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['UA2', 'UA1']);
    unmount();
    render(<TabellaInterattiva caption="Prova" righe={righe} colonne={semplici} chiaveRiga={(r) => r.codice} testoRicerca={(r) => r.codice} />);
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['SRA01', 'SRD01']);
  });

  it('l intestazione di riga nel piede nella stessa colonna; nascosta da Colonne, le righe la prendono dalla prima colonna visibile', async () => {
    const semplici = colonne.map((c) => ({ ...c, gruppo: undefined }));
    const { container } = render(<TabellaInterattiva caption="Prova" righe={righe} colonne={semplici} chiaveRiga={(r) => r.codice} testoRicerca={(r) => r.codice} intestazioneRiga="ua" righePiede={[{ ua: 'Totale', a: 5 }]} />);
    const piede = () => Array.from(container.querySelectorAll('tfoot tr')[0].children).map((c) => [c.tagName, c.textContent]);
    expect(piede()).toEqual([
      ['TD', ''],
      ['TH', 'Totale'],
      ['TD', '5'],
      ['TD', ''],
    ]);
    await userEvent.click(screen.getByText('Colonne'));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Unit Amount' }));
    expect(container.querySelector('tbody tr')?.children).toHaveLength(3);
    // ogni riga del corpo ha ancora la sua intestazione di riga (WCAG 1.3.1), e il piede la sua
    expect(screen.getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['SRA01', 'SRD01', 'Totale']);
    expect(piede()[0]).toEqual(['TH', 'Totale']);
    await expectNoA11yViolations(container);
  });
});
