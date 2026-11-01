// kit-sigc.test.tsx — il filtro SIGC e lo stato "non pertinente" del kit (revisioni del 31/10/2026, R01, F1-F5), le regole
// comuni nuove (assi R02, sinottici R09) e il tipo dell'intervento dei dettagli: lib pura, controllo della barra, card del
// kit dentro <NonPertinente>, pill del tipo.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { filtriDaRicerca, ricercaDaFiltri, tipoIntervento } from '../src/entities/filtri';
import { etichettaSigc, gradinoRighe, nonPertinenza, ricercaConSigc, ricercaDelSoloSigc, righeOrizzontali, senzaSigc, sigcDaRicerca } from '../src/shared/lib';
import type { DatiGrafico } from '../src/shared/lib';
import { BarraFiltri, BarraRiferimenti, CardGrafico, InerteSeNonPertinente, Kpi, NonPertinente, Sezione } from '../src/shared/ui';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

describe('R01 SIGC: lib pura del filtro', () => {
  it('il valore dall indirizzo: solo true e false, altrimenti tutti', () => {
    expect(sigcDaRicerca('sigc=true')).toBe('true');
    expect(sigcDaRicerca(new URLSearchParams('sigc=false'))).toBe('false');
    expect(sigcDaRicerca('sigc=si')).toBeUndefined();
    expect(sigcDaRicerca('')).toBeUndefined();
    expect(etichettaSigc('true')).toBe('SIGC');
    expect(etichettaSigc('false')).toBe('NO SIGC');
    expect(etichettaSigc(undefined)).toBeUndefined();
  });

  it('cambiare il filtro lascia gli altri parametri e riporta la tabella alla prima pagina', () => {
    expect(ricercaConSigc('intervento=SRA01&pagina=3', 'false')).toBe('intervento=SRA01&sigc=false');
    expect(ricercaConSigc('intervento=SRA01&sigc=false', undefined)).toBe('intervento=SRA01');
    expect(ricercaDelSoloSigc('os=OS1&sigc=true&anno=2025')).toBe('sigc=true');
    expect(ricercaDelSoloSigc('os=OS1')).toBe('');
  });

  it('non pertinenza: solo col valore opposto al tipo della card; la lettura senza filtro', () => {
    expect(nonPertinenza('false', 'sigc', 'Riguarda solo le domande SIGC')).toEqual({ filtro: 'NO SIGC', motivo: 'Riguarda solo le domande SIGC' });
    expect(nonPertinenza('true', 'nosigc', 'Riguarda solo le domande NO SIGC')).toEqual({ filtro: 'SIGC', motivo: 'Riguarda solo le domande NO SIGC' });
    expect(nonPertinenza('true', 'sigc', 'x')).toBeNull();
    expect(nonPertinenza(undefined, 'nosigc', 'x')).toBeNull();
    expect(senzaSigc({ intervento: ['SRA01'], sigc: 'false' as const })).toEqual({ intervento: ['SRA01'] });
    const senza: { intervento: string[]; sigc?: 'true' | 'false' } = { intervento: ['SRA01'] };
    expect(senzaSigc(senza)).toBe(senza);
  });

  it('i filtri del programma portano sigc: lettura, scrittura (dopo i ripetibili) e tipo dell intervento', () => {
    expect(filtriDaRicerca('intervento=SRA01&sigc=true&sigc=false')).toEqual({ intervento: ['SRA01'], sigc: 'true' });
    expect(ricercaDaFiltri({ sigc: 'false', os: ['OS1'] })).toBe('os=OS1&sigc=false');
    const voci = [
      { chiave: 'SRA01', perimetro: 'SIGC' },
      { chiave: 'SRD01', perimetro: 'NO_SIGC' },
      { chiave: 'SRH03', perimetro: null },
    ];
    expect(['SRA01', 'SRD01', 'SRH03', 'SRZ99'].map((c) => tipoIntervento(voci, c))).toEqual(['SIGC', 'NO SIGC', null, null]);
  });
});

describe('R02: barre orizzontali alte quanto serve', () => {
  it('le categorie dell asse y e il gradino d altezza oltre quelle che la base contiene', () => {
    expect(righeOrizzontali({ yAxis: { type: 'category', data: ['a', 'b', 'c'] } })).toBe(3);
    expect(righeOrizzontali({ yAxis: { type: 'value' } })).toBe(0);
    expect(righeOrizzontali({ yAxis: { type: 'category', data: Array.from({ length: 50 }, String) } })).toBe(40);
    expect(gradinoRighe(8, 8)).toBeNull();
    expect(gradinoRighe(9, 8)).toBe(12);
    expect(gradinoRighe(36, 8)).toBe(36);
    expect(gradinoRighe(40, 10)).toBe(40);
  });
});

/** La barra in un router: il controllo SIGC legge e scrive l'indirizzo. */
function barraNelRouter(indirizzo: string) {
  const router = createMemoryRouter([{ path: '*', element: <BarraFiltri chip={[]} filtroSigc /> }], { initialEntries: [indirizzo] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('R01: il controllo "Tutti | SIGC | NO SIGC" della barra', () => {
  it('stato premuto dall indirizzo, scelta nell indirizzo (pagina azzerata), "Tutti" toglie il parametro', async () => {
    const router = barraNelRouter('/prova?intervento=SRA01&pagina=2');
    const gruppo = screen.getByRole('group', { name: 'Interventi SIGC o NO SIGC' });
    expect(within(gruppo).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Tutti', 'true'],
      ['SIGC', 'false'],
      ['NO SIGC', 'false'],
    ]);
    await userEvent.click(within(gruppo).getByRole('button', { name: 'NO SIGC' }));
    expect(router.state.location.search).toBe('?intervento=SRA01&sigc=false');
    expect(within(gruppo).getByRole('button', { name: 'NO SIGC' }).getAttribute('aria-pressed')).toBe('true');
    // il bottone premuto resta col focus: il cambio non lo sposta
    expect(document.activeElement).toBe(within(gruppo).getByRole('button', { name: 'NO SIGC' }));
    await userEvent.click(within(gruppo).getByRole('button', { name: 'Tutti' }));
    expect(router.state.location.search).toBe('?intervento=SRA01');
  });

  it('senza filtroSigc il controllo non c e (dettagli, F5)', () => {
    const router = createMemoryRouter([{ path: '*', element: <BarraFiltri chip={[]} /> }], { initialEntries: ['/prova'] });
    render(<RouterProvider router={router} />);
    expect(screen.queryByRole('group', { name: 'Interventi SIGC o NO SIGC' })).toBeNull();
  });
});

const DATI: DatiGrafico = {
  opzioni: { yAxis: { type: 'category', data: ['Presentate'] }, xAxis: { type: 'value' }, series: [{ type: 'bar', data: [3] }] },
  tabella: { caption: 'Domande SIGC per voce', colonne: ['Voce', 'Domande'], righe: [['Presentate', '3']] },
  omessi: [],
};
const NP = { filtro: 'NO SIGC' as const, motivo: 'Riguarda solo le domande SIGC' };

describe('F3: le card del kit dentro <NonPertinente>', () => {
  it('CardGrafico: badge e motivo, niente interruttore ne Scarica ne clic, corpo leggibile ma non attivabile, tabella dei dati per gli strumenti assistivi', async () => {
    const { container } = render(
      <NonPertinente np={NP}>
        <CardGrafico titolo="Domande SIGC" dati={DATI} fonte="Fonte: TX-0012" scaricamenti={[{ formato: 'CSV', file: 'domande.csv', scarica: async () => undefined }]} />
      </NonPertinente>,
    );
    const card = screen.getByRole('region', { name: 'Domande SIGC' });
    expect(card.getAttribute('data-card-grafico')).toBe('non-pertinente');
    expect(within(card).getByText('Non pertinente al filtro NO SIGC')).toBeTruthy();
    expect(within(card).getByText(/^Riguarda solo le domande SIGC: con il filtro NO SIGC non si applica\./)).toBeTruthy();
    expect(within(card).queryByRole('group', { name: 'Vista di Domande SIGC' })).toBeNull();
    expect(within(card).queryByRole('button')).toBeNull();
    // niente inert (review J-01): il corpo resta leggibile dagli strumenti assistivi
    const corpo = card.querySelector('.ui-non-pertinente__corpo') as HTMLElement;
    expect(corpo).not.toBeNull();
    expect(card.querySelector('[inert]')).toBeNull();
    // la tabella equivalente nel corpo, nascosta alla vista, fuori dalla tabulazione (review J-02)
    const tabella = within(card).getByRole('table', { name: 'Domande SIGC per voce' });
    expect(tabella.closest('.visually-hidden')).not.toBeNull();
    expect(tabella.closest('.ui-non-pertinente__corpo')).toBe(corpo);
    const focalizzabili = Array.from(corpo.querySelectorAll('[tabindex], a[href], button, input, select, textarea'));
    expect(focalizzabili.length).toBeGreaterThan(0);
    expect(focalizzabili.every((el) => el.getAttribute('tabindex') === '-1')).toBe(true);
    // il badge una volta sola: la card lo dice, il corpo no (review J-01)
    expect(within(card).getAllByText('Non pertinente al filtro NO SIGC')).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it('con np null le card restano normali (stesso albero)', () => {
    render(
      <NonPertinente np={null}>
        <CardGrafico titolo="Domande SIGC" dati={DATI} fonte="Fonte: TX-0012" />
      </NonPertinente>,
    );
    const card = screen.getByRole('region', { name: 'Domande SIGC' });
    expect(card.getAttribute('data-card-grafico')).toBe('grafico');
    expect(within(card).getByRole('group', { name: 'Vista di Domande SIGC' })).toBeTruthy();
  });

  it('Sezione, Kpi e contenuti fuori dalle card: motivo, grigio, leggibili ma non attivabili; il KPI perde l azione e lo dice nel nome', () => {
    const riga = vi.fn();
    const link = vi.fn();
    render(
      <NonPertinente np={NP}>
        <Sezione titolo="Tabella delle superfici" strumenti={<button type="button">Scarica</button>}>
          <button type="button" onClick={riga}>
            Riga
          </button>
        </Sezione>
        <Kpi etichetta="Presentate" valore="3" icona="it-files" azione={<a href="#x">Apri nell elenco</a>} />
        <InerteSeNonPertinente>
          <a href="#y" onClick={link}>
            Le domande nell elenco
          </a>
        </InerteSeNonPertinente>
      </NonPertinente>,
    );
    const sezione = screen.getByRole('region', { name: 'Tabella delle superfici' });
    expect(within(sezione).queryByRole('button', { name: 'Scarica' })).toBeNull();
    // niente inert (review J-01): il controllo resta nell'albero accessibile, disattivato e fuori dalla tabulazione
    expect(document.querySelector('[inert]')).toBeNull();
    const bottone = within(sezione).getByRole('button', { name: 'Riga' });
    expect(bottone.getAttribute('aria-disabled')).toBe('true');
    expect(bottone.getAttribute('tabindex')).toBe('-1');
    fireEvent.click(bottone);
    fireEvent.keyDown(bottone, { key: 'Enter' });
    expect(riga).not.toHaveBeenCalled();
    // il motivo una volta sola nella sezione
    expect(within(sezione).getAllByText('Non pertinente al filtro NO SIGC')).toHaveLength(1);
    const kpi = screen.getByRole('region', { name: 'Presentate, non pertinente al filtro NO SIGC' });
    expect(within(kpi).queryByRole('link')).toBeNull();
    expect(within(kpi).getByText('Non pertinente al filtro NO SIGC')).toBeTruthy();
    const elenco = screen.getByRole('link', { name: 'Le domande nell elenco' });
    expect(elenco.getAttribute('aria-disabled')).toBe('true');
    expect(elenco.getAttribute('tabindex')).toBe('-1');
    fireEvent.click(elenco);
    expect(link).not.toHaveBeenCalled();
  });
});

describe('R09 e F5: valore pieno dei sinottici e tipo dell intervento nei dettagli', () => {
  it('Kpi con valorePieno: il compatto a vista, il pieno per i lettori di schermo e nel suggerimento', () => {
    render(<Kpi etichetta="Richiesto" valore="12,3 M€" valorePieno="12.345.678,00 €" icona="it-chart-line" />);
    const valore = screen.getByRole('region', { name: 'Richiesto' }).querySelector('.ui-kpi__valore') as HTMLElement;
    expect(valore.getAttribute('title')).toBe('12.345.678,00 €');
    expect(within(valore).getByText('12,3 M€').getAttribute('aria-hidden')).toBe('true');
    expect(within(valore).getByText('12.345.678,00 €').className).toBe('visually-hidden');
  });

  it('BarraRiferimenti: la pill del tipo solo se il tipo si conosce', () => {
    const { rerender } = render(<BarraRiferimenti perimetro="Perimetro: regionale" ultimi={undefined} inErrore={false} tipo="NO SIGC" />);
    expect(screen.getByText('Tipo di intervento: NO SIGC (dalla programmazione; il filtro SIGC non si applica al dettaglio)')).toBeTruthy();
    rerender(<BarraRiferimenti perimetro="Perimetro: regionale" ultimi={undefined} inErrore={false} tipo={null} />);
    expect(screen.queryByText(/^Tipo di intervento/)).toBeNull();
  });
});
