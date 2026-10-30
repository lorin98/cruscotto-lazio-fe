// Kit comune portato fuori dalle feature (o esteso) per l'istituzionale: selettore d'anno e anno della pagina
// nell'indirizzo (shared/ui, prima nel finanziario), link verso l'elenco operativo (entities/domanda, prima nel
// finanziario), riga sotto il sottotitolo della testata, card del grafico senza PNG o col nome dei file, messaggio del
// file oltre il limite dell'esportazione, interruttore a piu' scelte, stato vuoto coi filtri e badge di un'assenza (prima
// nel fisico e nel finanziario), focus quando uno stato sparisce col suo comando (prima nell'istituzionale e in
// AvvisoPagina) e righe di contesto del PNG dei grafici (prima nel finanziario, nel fisico, nell'istituzionale e
// nell'elenco operativo). Dati di prova inventati.
import { useRef } from 'react';
import type { ReactElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AxiosError, AxiosHeaders } from 'axios';
import { AvvisoAggiornamento, CardGrafico, Interruttore, InterruttoreVista, OLTRE_IL_LIMITE_DELL_ESPORTAZIONE, PulsantiScarica, SelettoreAnno, TestaPagina, Vuoto, VuotoConFiltri, messaggioOltreIlLimite, useAnnoNellIndirizzo, useFocusSeSparisce, useRigheContesto } from '../src/shared/ui';
import { server } from '../src/shared/api/mock/server';
import { clientDiTest } from '../src/shared/testing/render';
import type { UltimoDato } from '../src/shared/lib';
import { AssenzaMotivata, BadgeAssenza } from '../src/entities/importo';
import { PROBLEM_TYPES } from '../src/shared/api/problem/problem-types';
import type { DatiGrafico, Scaricamento } from '../src/shared/ui';
import { SelettoreAnno as SelettoreFinanziario } from '../src/features/finanziario/ui/SelettoreAnno';
import * as LinkElencoFinanziario from '../src/features/finanziario/ui/LinkElenco';
import * as InterrogazioneElenco from '../src/features/elenco-operativo/ui/useInterrogazione';
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
    render(<SelettoreFinanziario id="f-ri" etichetta="Anno di riferimento (anno n)" aiuto="Obbligatorio." tipo="riserva" anno={2031} onCambia={() => undefined} />);
    const voci = screen.getAllByRole('option').map((o) => o.textContent);
    expect(voci[0]).toBe('Scegli un anno');
    expect(voci.slice(1)).toEqual(['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2031']);
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
  it('nome accessibile completo che contiene il testo visibile; senza indirizzo nulla', async () => {
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
    await expectNoA11yViolations(container);
  });

  it('il finanziario lo importa da entities/domanda: LinkElenco non lo riesporta (review H2)', () => {
    expect(Object.keys(LinkElencoFinanziario).sort()).toEqual(['useApriNellElenco', 'useLinkElenco']);
  });
});

describe('Estensioni del kit per l istituzionale: riga sotto il sottotitolo e card del grafico senza PNG o col nome dei file', () => {
  const DATI: DatiGrafico = {
    opzioni: { series: [{ type: 'bar', data: [1] }] },
    tabella: { caption: 'Tabella equivalente', colonne: ['Anno', 'Valore'], righe: [['2024', '1']] },
    omessi: [],
  };
  const csv: Scaricamento = { formato: 'CSV', scarica: () => undefined, file: 'prova.csv' };

  it('TestaPagina: la nota (anche con un link) sta sotto il sottotitolo, nella stessa testata', () => {
    const router = createMemoryRouter([{ path: '*', element: <TestaPagina titolo="Titolo" titoloDocumento="Titolo" sottotitolo="Sotto" nota={<a href="/altra">Altra area</a>} /> }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    const testata = screen.getByRole('heading', { level: 1, name: 'Titolo' }).parentElement;
    expect(Array.from(testata?.querySelectorAll('p') ?? []).map((p) => p.textContent)).toEqual(['Sotto', 'Altra area']);
  });

  it('CardGrafico: senzaPng toglie il PNG e lascia gli altri file; oggettoDati da il nome ai file dei dati e al gruppo, il PNG resta il grafico', () => {
    const { rerender } = render(<CardGrafico titolo="Mini grafico" dati={DATI} fonte="Fonte" senzaPng />);
    expect(screen.queryByRole('group', { name: /^Scarica/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Grafico' }).getAttribute('aria-pressed')).toBe('true');
    // review X3: il PNG e' l'immagine del grafico, il CSV e' l'export dei dati: nomi diversi (WCAG 2.4.6)
    rerender(<CardGrafico titolo="Output per anno" dati={DATI} fonte="Fonte" scaricamenti={[csv]} oggettoDati="l'output e gli importi unitari dell'intervento SRA01" />);
    expect(screen.getAllByRole('button', { name: /^Scarica/ }).map((b) => b.getAttribute('aria-label'))).toEqual(['Scarica il grafico Output per anno in PNG', "Scarica l'output e gli importi unitari dell'intervento SRA01 in CSV"]);
    // review V1 v1 iter2: il gruppo dice i due contenuti; senza oggettoDati il nome di sempre (finanziario, fisico, elenco)
    expect(screen.getByRole('group', { name: /^Scarica/ }).getAttribute('aria-label')).toBe("Scarica il grafico Output per anno e l'output e gli importi unitari dell'intervento SRA01");
    rerender(<CardGrafico titolo="Output per anno" dati={DATI} fonte="Fonte" scaricamenti={[csv]} />);
    expect(screen.getAllByRole('button', { name: /^Scarica/ }).map((b) => b.getAttribute('aria-label'))).toEqual(['Scarica il grafico Output per anno in PNG', 'Scarica il grafico Output per anno in CSV']);
    expect(screen.getByRole('group', { name: /^Scarica/ }).getAttribute('aria-label')).toBe('Scarica il grafico Output per anno');
  });

  it('PulsantiScarica: un file col suo oggetto ha il suo nome, gli altri quello del gruppo', () => {
    render(<PulsantiScarica oggetto="il grafico Spesa" scaricamenti={[{ ...csv, formato: 'PNG' }, { ...csv, oggetto: 'i dati della verifica' }]} />);
    expect(screen.getByRole('group', { name: 'Scarica il grafico Spesa' })).toBeTruthy();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Scarica il grafico Spesa in PNG', 'Scarica i dati della verifica in CSV']);
  });
});

describe('messaggioOltreIlLimite del kit: il file oltre il limite dell esportazione (prima nel fisico)', () => {
  it('il 400 DATO_NON_VALIDO sul problem-type ha il testo per esteso; gli altri errori il messaggio del problem-type', () => {
    const errore = (status: number, type: string) => new AxiosError('x', undefined, undefined, undefined, { status, data: { type, title: 'Errore', status, errorCode: 'X' }, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } });
    expect(messaggioOltreIlLimite(errore(400, PROBLEM_TYPES.DATO_NON_VALIDO))).toBe(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE);
    expect(OLTRE_IL_LIMITE_DELL_ESPORTAZIONE).toBe("La tabella supera il limite dell'esportazione (5.000 righe o 50.000 celle): restringi i filtri e riprova.");
    expect(messaggioOltreIlLimite(errore(400, 'about:blank'))).toBeNull();
    expect(messaggioOltreIlLimite(errore(503, PROBLEM_TYPES.CAPACITA_ESAURITA))).toBeNull();
    expect(messaggioOltreIlLimite(new Error('rete'))).toBeNull();
  });
});

describe('Interruttore, VuotoConFiltri e BadgeAssenza: kit per le tre misure dell output e gli stati (prima nel fisico)', () => {
  it('Interruttore: una sola scelta premuta, il clic sceglie e il focus resta sul bottone; InterruttoreVista ci sta sopra', async () => {
    const onScelta = vi.fn();
    const opzioni = [
      { valore: 'a', etichetta: 'Prima' },
      { valore: 'b', etichetta: 'Seconda' },
      { valore: 'c', etichetta: 'Terza' },
    ] as const;
    const { container, rerender } = render(<Interruttore etichetta="Misura mostrata" opzioni={opzioni} scelta="a" onScelta={onScelta} className="mb-3" />);
    const gruppo = screen.getByRole('group', { name: 'Misura mostrata' });
    expect(gruppo.className).toBe('ui-seg mb-3');
    expect(screen.getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Prima', 'true'],
      ['Seconda', 'false'],
      ['Terza', 'false'],
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Terza' }));
    expect(onScelta).toHaveBeenLastCalledWith('c');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Terza' }));
    await expectNoA11yViolations(container);
    rerender(<InterruttoreVista etichetta="Vista" vista="tabella" onVista={() => undefined} />);
    expect(screen.getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Grafico', 'false'],
      ['Tabella', 'true'],
    ]);
  });

  it('AvvisoAggiornamento (prima nell elenco operativo): role=status sempre montato, il testo solo durante l aggiornamento', () => {
    const { rerender } = render(<AvvisoAggiornamento attivo={false} testo="Lettura in corso." />);
    const stato = screen.getByRole('status');
    expect([stato.textContent, stato.className]).toEqual(['', 'visually-hidden']);
    rerender(<AvvisoAggiornamento attivo testo="Lettura in corso." />);
    expect(screen.getByRole('status')).toBe(stato);
    expect([stato.textContent, stato.className]).toEqual(['Lettura in corso.', 'ui-aggiornamento']);
    rerender(<AvvisoAggiornamento attivo />);
    expect(stato.textContent).toBe('Aggiornamento dei risultati: restano visibili quelli precedenti finché arrivano i nuovi.');
  });

  it('VuotoConFiltri: il testo e Modifica i filtri; BadgeAssenza: la stessa forma di AssenzaMotivata con una resa data', async () => {
    const onModifica = vi.fn();
    render(
      <>
        <Vuoto>
          <VuotoConFiltri onModifica={onModifica}>Nessun intervento.</VuotoConFiltri>
        </Vuoto>
        <p data-testid="badge">
          <BadgeAssenza resa={{ disponibile: false, testo: 'non valorizzato', nota: 'nessun target' }} />
        </p>
        <p data-testid="motivata">
          <AssenzaMotivata dato={{ motivo: 'NON_VALORIZZATO' }} />
        </p>
      </>,
    );
    expect(screen.getByRole('status').textContent).toBe('Nessun intervento.Modifica i filtri');
    await userEvent.click(screen.getByRole('button', { name: 'Modifica i filtri' }));
    expect(onModifica).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('badge').innerHTML).toBe('<span><span class="badge bg-secondary me-1">non valorizzato</span><span class="small">nessun target</span></span>');
    expect(screen.getByTestId('motivata').textContent).toBe('non valorizzatoil dato non è presente nella fonte');
  });
});

describe('useFocusSeSparisce del kit: il focus quando uno stato sparisce col suo comando (review H5, prima in due copie)', () => {
  function Prova({ visibile }: { visibile: boolean }) {
    const titolo = useRef<HTMLHeadingElement>(null);
    useFocusSeSparisce(visibile, titolo);
    return (
      <>
        <h1 ref={titolo} tabIndex={-1}>
          Titolo
        </h1>
        {visibile && (
          <button type="button" className="me-2">
            Riprova
          </button>
        )}
        <button type="button">Altro</button>
      </>
    );
  }

  it('sparito col bottone che aveva il focus (finito su BODY) il focus va sul titolo; altrove resta; mai al montaggio', () => {
    const { rerender } = render(<Prova visibile={false} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<Prova visibile />);
    expect(document.activeElement).toBe(document.body);
    screen.getByRole('button', { name: 'Riprova' }).focus();
    rerender(<Prova visibile={false} />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Titolo' }));
    // l'utente ha gia' portato il focus altrove: lo stato che sparisce non lo sposta
    rerender(<Prova visibile />);
    const altro = screen.getByRole('button', { name: 'Altro' });
    altro.focus();
    rerender(<Prova visibile={false} />);
    expect(document.activeElement).toBe(altro);
    // resta nascosto: nessuno spostamento
    altro.blur();
    rerender(<Prova visibile={false} />);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('useRigheContesto del kit: le righe di contesto del PNG dei grafici (review H7 e H1 v1 iter2, prima in quattro copie)', () => {
  const viste: (readonly string[])[] = [];
  function Righe({ criteri, ultimi, perimetro }: { criteri: string[]; ultimi?: readonly UltimoDato[]; perimetro?: string | null }) {
    const righe = useRigheContesto(criteri, ultimi, perimetro);
    viste.push(righe);
    return (
      <ul>
        {righe.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    );
  }

  it('criteri applicati, perimetro solo se dato, profilo della sessione, ultimo dato; coi dati uguali le righe sono le stesse', async () => {
    server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', profile: 'p4-prova', roles: [] } })));
    const client = clientDiTest();
    const conQuery = (ui: ReactElement) => <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
    const ultimi = [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }];
    const { rerender } = render(conQuery(<Righe criteri={['Intervento: SRA01', 'Anno di riferimento: 2024']} ultimi={ultimi} perimetro="regionale" />));
    const voci = () => screen.getAllByRole('listitem').map((l) => l.textContent);
    await waitFor(() => expect(voci()).toContain('Profilo: p4-prova'));
    expect(voci()).toEqual(['Filtri applicati: Intervento: SRA01; Anno di riferimento: 2024', 'Perimetro: regionale', 'Profilo: p4-prova', 'Ultimo dato sincronizzato: DS-12 02/03/2026 10:15']);
    // criteri nuovi ma uguali: le stesse righe (lo stesso oggetto nel contesto del PNG)
    rerender(conQuery(<Righe criteri={['Intervento: SRA01', 'Anno di riferimento: 2024']} ultimi={ultimi} perimetro="regionale" />));
    expect(viste.at(-1)).toBe(viste.at(-2));
    rerender(conQuery(<Righe criteri={[]} />));
    expect(voci()).toEqual(['Filtri applicati: nessuno', 'Profilo: p4-prova', 'Ultimo dato sincronizzato: non disponibile']);
  });

  it("l'elenco operativo usa l'hook del kit: useInterrogazione non ha piu' la sua copia (review H1 v1 iter2)", () => {
    expect(Object.keys(InterrogazioneElenco)).toEqual(['useInterrogazione']);
  });
});
