import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../shared/api/mock/server';
import { expectNoA11yViolations } from '../../../shared/testing/axe';
import { graficoDi, trovaCard } from '../../../shared/testing/card-grafico';
import { FILTRI, SIGC_DOMANDE, SIGC_IMPORTI, SPESA, TOTALE_DOMANDE } from '../../../shared/testing/fixture-finanziario';
import { clicSu } from '../../../shared/testing/grafico-finto';
import { renderPagina } from '../../../shared/testing/render-pagina';
import Pagina from './page';

const servi = () =>
  server.use(
    http.get('*/api/finanziario/filtri', () => HttpResponse.json(FILTRI)),
    http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json(SPESA)),
    http.get('*/api/finanziario/totale-domande', () => HttpResponse.json(TOTALE_DOMANDE)),
    http.get('*/api/finanziario/sigc/domande', () => HttpResponse.json(SIGC_DOMANDE)),
    http.get('*/api/finanziario/sigc/importi', () => HttpResponse.json(SIGC_IMPORTI)),
  );
const conRuoli = (roles: string[]) => server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles } })));

async function apriPannello() {
  await userEvent.click(await screen.findByRole('button', { name: /^Filtri/ }));
  return screen.findByRole('dialog', { name: 'Filtri' });
}

describe('RF001: filtri per intervento, obiettivi e azione portante, validi per tutti i report', () => {
  it('il pannello propone i valori del backend; Applica li porta nell indirizzo e nei chip', async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario');
    const pannello = await apriPannello();
    await userEvent.click(await within(pannello).findByRole('checkbox', { name: 'SRA03 Intervento di prova B' }));
    const og = within(pannello).getByRole('button', { name: 'OG2' });
    await userEvent.click(og);
    expect(og.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe('?intervento=SRA03&og=OG2'));
    expect(screen.queryByRole('dialog', { name: 'Filtri' })).toBeNull();
    const barra = screen.getByRole('region', { name: 'Filtri attivi' });
    expect(within(barra).getByRole('button', { name: 'Togli il filtro Intervento SRA03' })).toBeTruthy();
    expect(within(barra).getByRole('button', { name: /^Filtri/ }).textContent).toContain('2');
  });

  it('il pannello riparte dai filtri applicati; Azzera svuota la bozza e Applica toglie tutti i filtri', async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario', '/finanziario?intervento=SRA01');
    const pannello = await apriPannello();
    const sra01 = await within(pannello).findByRole('checkbox', { name: 'SRA01 Intervento di prova A' });
    expect((sra01 as HTMLInputElement).checked).toBe(true);
    await userEvent.click(within(pannello).getByRole('button', { name: 'Azzera' }));
    expect((sra01 as HTMLInputElement).checked).toBe(false);
    await userEvent.click(within(pannello).getByRole('button', { name: 'Applica i filtri' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(screen.getByText('Nessun filtro: tutti gli interventi del perimetro')).toBeTruthy();
  });

  it("azione portante disabilitata con la spiegazione finche' manca il legame", async () => {
    servi();
    renderPagina(Pagina, '/finanziario');
    const pannello = await apriPannello();
    expect(await within(pannello).findByText("Non disponibile finché nessun intervento è collegato a un'azione portante.")).toBeTruthy();
    // disabilitata dal fieldset del gruppo
    expect(within(pannello).getByRole('checkbox', { name: '1 Azione portante di prova' }).matches(':disabled')).toBe(true);
  });

  it('chiusura senza applicare: i filtri restano quelli di prima', async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario');
    const pannello = await apriPannello();
    await userEvent.click(await within(pannello).findByRole('checkbox', { name: 'SRA01 Intervento di prova A' }));
    await userEvent.click(within(pannello).getByRole('button', { name: 'Chiudi: Filtri' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtri' })).toBeNull());
    expect(router.state.location.search).toBe('');
  });

  it('ultimo dato sincronizzato nella barra dei filtri: la data piu recente, il dettaglio per flusso nel popover', async () => {
    servi();
    renderPagina(Pagina, '/finanziario');
    const pill = await screen.findByRole('button', { name: /^Ultimo dato sincronizzato: dati al 03\/03\/2026/ });
    expect(pill.textContent).toBe('Dati al 03/03/2026');
    await userEvent.click(pill);
    const pop = await screen.findByRole('dialog', { name: "Ultimo dato sincronizzato per flusso d'import" });
    expect(within(pop).getAllByRole('listitem').map((v) => v.textContent)).toEqual(['DS-1202/03/2026 10:15', 'PROSA DS-0403/03/2026 09:30']);
  });

  it('senza il grant di TX-0001: niente pannello, niente data, nessuna lettura dei filtri', async () => {
    servi();
    let letti = false;
    server.use(
      http.get('*/api/finanziario/filtri', () => {
        letti = true;
        return HttpResponse.json(FILTRI);
      }),
    );
    conRuoli(['csr.tx-0002.read']);
    renderPagina(Pagina, '/finanziario', '/finanziario?intervento=SRA01');
    await trovaCard('Avanzamento per intervento');
    expect(screen.queryByRole('button', { name: /^Filtri/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ultimo dato sincronizzato/ })).toBeNull();
    // i chip restano: i filtri dell'indirizzo valgono comunque e si possono togliere
    expect(screen.getByRole('button', { name: 'Togli il filtro Intervento SRA01' })).toBeTruthy();
    expect(letti).toBe(false);
  });
});

describe('panoramica: indicatori, grafici e drill-down', () => {
  it('indicatori dai dati per intervento e dal totale delle domande', async () => {
    servi();
    renderPagina(Pagina, '/finanziario');
    expect((await screen.findByRole('region', { name: 'Dotazione spesa pubblica' })).textContent).toContain('1 intervento nella selezione');
    expect(screen.getByRole('region', { name: 'Pagato sulla dotazione' }).textContent).toMatch(/20\s?%/);
    expect((await screen.findByRole('region', { name: 'Domande presentate' })).textContent).toContain('1200');
  });

  it("clic su un intervento: dettaglio dell'intervento con i filtri; clic sull'imbuto SIGC: pagina SIGC", async () => {
    servi();
    const { router } = renderPagina(Pagina, '/finanziario', '/finanziario?og=OG2');
    const avanzamento = graficoDi(await trovaCard('Avanzamento per intervento'));
    expect(avanzamento).toBeTruthy();
    if (avanzamento) clicSu(avanzamento, { name: 'SRA01' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/interventi/SRA01'));
    expect(router.state.location.search).toBe('?og=OG2');
    await router.navigate('/finanziario?og=OG2');
    const famiglie = graficoDi(await trovaCard('Dotazione per famiglia di intervento'));
    // un clic su una famiglia (non un codice di intervento) non naviga: il treemap entra nel gruppo
    if (famiglie) clicSu(famiglie, { name: 'SRA', data: {} });
    expect(router.state.location.pathname).toBe('/finanziario');
    const imbuto = graficoDi(await trovaCard('Domande SIGC: dalla presentazione al pagamento'));
    if (imbuto) clicSu(imbuto, { name: 'Pagate' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/finanziario/sigc'));
    expect(router.state.location.search).toBe('?og=OG2');
  });

  it('perimetro ADA: la quota pagata sulla dotazione non si calcola e lo si dice', async () => {
    servi();
    server.use(http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json({ ...SPESA, perimetro: 'ADA' })));
    renderPagina(Pagina, '/finanziario');
    expect((await screen.findByRole('region', { name: 'Pagato sulla dotazione' })).textContent).toContain('Non confrontabile: dotazione regionale');
  });

  it('nessun intervento: stato vuoto, nessun indicatore a zero', async () => {
    servi();
    server.use(http.get('*/api/finanziario/spesa-per-intervento', () => HttpResponse.json({ perimetro: 'REGIONALE', righe: [] })));
    renderPagina(Pagina, '/finanziario');
    expect((await screen.findByText('Nessun intervento per i filtri scelti. Modifica i filtri.')).closest('[role]')?.getAttribute('role')).toBe('status');
    expect(screen.queryByRole('region', { name: 'Dotazione spesa pubblica' })).toBeNull();
  });

  it('nessuna violazione axe, anche con il pannello dei filtri aperto', async () => {
    servi();
    const { container } = renderPagina(Pagina, '/finanziario');
    await trovaCard('Avanzamento per intervento');
    await trovaCard('Importi SIGC');
    await expectNoA11yViolations(container);
    const pannello = await apriPannello();
    await within(pannello).findByRole('checkbox', { name: 'SRA01 Intervento di prova A' });
    await expectNoA11yViolations(pannello);
  });
});
