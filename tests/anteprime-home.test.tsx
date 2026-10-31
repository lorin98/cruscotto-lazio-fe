// anteprime-home.test.tsx — le card dinamiche della Home di fisico, procedurale e istituzionale (decisione dell'utente del
// 26/10/2026; flussi superfici, panoramica e verifica-smp-non-sigc approvati: OP-FIS-10, OP-PR-10, OP-IS-11) e gli stati
// d'errore della card del finanziario, rese da sole su MSW: i numeri dalle letture senza filtri e solo coi grant (ogni
// lettura registrata: "nessuna lettura" e' un conteggio, review A-01), l'attesa annunciata (D4), l'errore che non ferma la
// card, le assenze col motivo, nessun dato, il perimetro ADA, axe. Il cablaggio nella Home (aree.ts), i profili del catalogo
// e la cache condivisa con le pagine sono in app-aree.test.tsx.
import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { formatEuro, formatPercentuale } from '../src/shared/lib';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { problema, rispondi, trattenuta } from '../src/shared/testing/msw';
import { clientDiTest, renderConQuery } from '../src/shared/testing/render';
import { AnteprimaFinanziario } from '../src/features/finanziario';
import { AnteprimaFisico } from '../src/features/fisico';
import { AnteprimaIstituzionale } from '../src/features/istituzionale';
import { AnteprimaProcedurale } from '../src/features/procedurale';
import * as F from '../src/features/finanziario/testing/fixture';
import { SUPERFICI, SUPERFICI_SENZA, campagna } from '../src/features/fisico/testing/fixture';
import { ammessePer, statiPer } from '../src/features/procedurale/testing/fixture';
import { lettureProcedurale } from '../src/features/procedurale/testing/letture';
import { VERIFICA, VERIFICA_SMP, verificaSigcPer } from '../src/features/istituzionale/testing/fixture';
import { esercizioUltimoChiuso } from '../src/features/istituzionale/lib/criteri';
import type { VerificaSmp } from '../src/features/istituzionale/api';

function conRuoli(roles: string[]) {
  server.use(http.get('*/auth/status', () => HttpResponse.json({ authenticated: true, user: { username: 'U', roles } })));
}

const ALTRIMENTI = <p>Contenuti dell&apos;area</p>;

/** Registra la query di ogni lettura del percorso e risponde col corpo dato. */
function lettura(percorso: string, corpo: object) {
  const query: string[] = [];
  server.use(
    http.get(`*${percorso}`, ({ request }) => {
      query.push(new URL(request.url).search);
      return HttpResponse.json(corpo);
    }),
  );
  return query;
}

const indisponibile = (percorso: string) => rispondi(percorso, problema(503, 'CAPACITA_ESAURITA'), 503);

/** Il valore di un numero della card dal suo termine (dt): il dd che lo segue. */
function valoreDi(gruppo: HTMLElement, termine: string): string {
  const dt = within(gruppo).getByText(termine, { selector: 'dt', exact: false });
  return dt.nextElementSibling?.textContent ?? '';
}

/** La nota sotto il valore di un numero della card (il secondo dd), se c'e'. */
function notaDi(gruppo: HTMLElement, termine: string): string | undefined {
  const dt = within(gruppo).getByText(termine, { selector: 'dt', exact: false });
  return dt.nextElementSibling?.nextElementSibling?.textContent ?? undefined;
}

const SUPERFICI_PATH = '/api/fisico/superficie-ammissibile';
const VERIFICA_PATH = '/api/istituzionale/verifica-smp-non-sigc';
const VERIFICA_SIGC_PATH = '/api/istituzionale/verifica-smp-sigc';

describe('RF018: card Fisico della Home (OP-FIS-10)', () => {
  it('col grant di TX-0018: i KPI della campagna piu recente, da una lettura senza filtri, e nessuna violazione axe', async () => {
    conRuoli(['csr.tx-0018.read']);
    const query = lettura(SUPERFICI_PATH, SUPERFICI);
    const { container } = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il fisico in cifre' });
    expect(await within(cifre).findByText('Campagna 2025')).toBeTruthy();
    expect(valoreDi(cifre, 'Superficie ammissibile DS')).toBe('15,50 ha');
    expect(valoreDi(cifre, 'Superficie ammissibile DP')).toBe('16,20 ha');
    expect(valoreDi(cifre, 'Domande di pagamento')).toBe('3');
    expect(within(cifre).getByText(formatPercentuale(33.3))).toBeTruthy();
    // le sigle sciolte per i lettori di schermo, come i nomi accessibili dei KPI della pagina
    expect(within(cifre).getByText('Superficie ammissibile DS', { selector: 'dt', exact: false }).textContent).toBe('Superficie ammissibile DS: superficie delle domande di sostegno');
    expect(query).toEqual(['']);
    expect(screen.queryByText("Contenuti dell'area")).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('senza il grant: nessuna lettura registrata, la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0020.read']);
    const query = lettura(SUPERFICI_PATH, SUPERFICI);
    renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
    expect(screen.queryByRole('group')).toBeNull();
    expect(query).toEqual([]);
  });

  it('lettura in corso: lo scheletro al posto dei numeri, annunciato ai lettori di schermo (D4)', async () => {
    conRuoli(['csr.tx-0018.read']);
    const t = trattenuta();
    server.use(
      http.get(`*${SUPERFICI_PATH}`, async () => {
        await t.attesa;
        return HttpResponse.json(SUPERFICI);
      }),
    );
    const { container } = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il fisico in cifre' });
    const attesa = await within(cifre).findByRole('status');
    expect(attesa.textContent).toBe('Caricamento in corso…');
    expect(attesa.classList.contains('ui-skeleton')).toBe(true);
    await act(async () => t.libera());
    expect(await screen.findByText('Campagna 2025')).toBeTruthy();
    expect(container.querySelector('.ui-skeleton')).toBeNull();
  });

  it('errore: una frase, nessun avviso; nessuna superficie: annunciata; nessuna domanda di pagamento nella campagna', async () => {
    conRuoli(['csr.tx-0018.read']);
    server.use(indisponibile(SUPERFICI_PATH));
    const errore = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Superfici non disponibili in questo momento.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    errore.unmount();

    lettura(SUPERFICI_PATH, SUPERFICI_SENZA);
    const senza = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect((await screen.findByText('Nessuna superficie ammissibile nelle domande.')).getAttribute('role')).toBe('status');
    senza.unmount();

    lettura(SUPERFICI_PATH, { ...SUPERFICI, righe: [{ codiceIntervento: 'SRB01', motivo: null, campagne: [campagna(2026, { domandePagamento: 0 })] }] });
    renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Domande con DP oltre la DS: nessuna domanda di pagamento')).toBeTruthy();
    expect(document.querySelector('.ui-barra')).toBeNull();
  });
});

describe('RF026 e RF027: card Procedurale della Home (OP-PR-10)', () => {
  const senzaFiltri = new URLSearchParams();

  it('coi grant di TX-0026 e TX-0027: ammesse, contributo con gli interventi che non comprende (D1), interventi attivati e domande di sostegno', async () => {
    conRuoli(['csr.tx-0026.read', 'csr.tx-0027.read']);
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    const { container } = renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('2 su 3 (66,7 %)')).toBeTruthy();
    expect(within(cifre).getByText('Interventi attivati')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande ammesse')).toBe('3');
    // il totale del backend somma i soli contributi valorizzati: SRA01 ha domande ammesse senza contributo (SC-PC_AMMESSE)
    expect(valoreDi(cifre, 'Contributo ammesso')).toBe(formatEuro(800));
    expect(notaDi(cifre, 'Contributo ammesso')).toBe('Manca il contributo di 1 intervento (SRA01).');
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno')).toBe('4'));
    expect(lette.ammesse).toEqual(['']);
    expect(lette.sostegno).toEqual(['']);
    expect([lette.filtri, lette.statiArea]).toEqual([0, 0]);
    expect([lette.pagamento, lette.riepilogo]).toEqual([[], []]);
    await expectNoA11yViolations(container);
  });

  it('ogni intervento con domande ammesse ha il contributo: nessuna nota sotto il valore', async () => {
    conRuoli(['csr.tx-0026.read']);
    const ammesse = ammessePer(senzaFiltri);
    const righe = (ammesse.righe ?? []).map((r) => (r.contributoAmmesso.valore === null ? { ...r, contributoAmmesso: { valore: 100, motivo: null, fonte: null } } : r));
    lettura('/api/procedurale/domande-ammesse', { ...ammesse, righe, totale: { ...ammesse.totale, contributoAmmesso: { valore: 900, motivo: null, fonte: null } } });
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    await waitFor(() => expect(valoreDi(cifre, 'Contributo ammesso')).toBe(formatEuro(900)));
    expect(notaDi(cifre, 'Contributo ammesso')).toBeUndefined();
  });

  it('col solo grant degli stati di sostegno: il solo conteggio, nessuna lettura delle ammesse ne degli altri report', async () => {
    conRuoli(['csr.tx-0027.read']);
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno')).toBe('4'));
    expect(within(cifre).queryByText('Domande ammesse')).toBeNull();
    expect(lette.ammesse).toEqual([]);
    expect([lette.filtri, lette.statiArea]).toEqual([0, 0]);
    expect([lette.pagamento, lette.riepilogo]).toEqual([[], []]);
  });

  it('senza i due grant: nessuna lettura registrata, la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0028.read']);
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
    expect([lette.ammesse, lette.sostegno, lette.pagamento]).toEqual([[], [], []]);
  });

  it('perimetro ADA: le etichette dell area del profilo; contributo senza fonte: il motivo, mai uno 0', async () => {
    conRuoli(['csr.tx-0026.read', 'csr.tx-0027.read']);
    const ammesse = ammessePer(senzaFiltri);
    lettura('/api/procedurale/domande-ammesse', { ...ammesse, perimetro: 'ADA', totale: { ...ammesse.totale, contributoAmmesso: { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'ATTO_CONCESSIONE' } } });
    lettura('/api/procedurale/stati-sostegno', { ...statiPer('SOSTEGNO', senzaFiltri), perimetro: 'ADA' });
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('Interventi attivati con domande della tua area')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande ammesse della tua area')).toBe('3');
    expect(valoreDi(cifre, 'Contributo ammesso della tua area')).toBe('non disponibile');
    expect(notaDi(cifre, 'Contributo ammesso della tua area')).toBe('Non disponibile: fonte atto di concessione non attiva');
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno della tua area')).toBe('4'));
  });

  it('errore di una lettura: la sua frase, l altra resta; nessun avviso', async () => {
    conRuoli(['csr.tx-0026.read', 'csr.tx-0027.read']);
    server.use(indisponibile('/api/procedurale/domande-ammesse'));
    lettura('/api/procedurale/stati-sostegno', statiPer('SOSTEGNO', senzaFiltri));
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('Domande ammesse e contributo non disponibili in questo momento.')).toBeTruthy();
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno')).toBe('4'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('errore degli stati di sostegno: non disponibile col motivo; perimetro ufficiale vuoto: testo senza barra', async () => {
    conRuoli(['csr.tx-0026.read', 'csr.tx-0027.read']);
    const ammesse = ammessePer(senzaFiltri);
    lettura('/api/procedurale/domande-ammesse', { ...ammesse, totale: { ...ammesse.totale, interventiAttivati: 0, interventiPerimetroUfficiale: 0 } });
    server.use(indisponibile('/api/procedurale/stati-sostegno'));
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('Interventi attivati: 0 su 0')).toBeTruthy();
    expect(cifre.querySelector('.ui-barra')).toBeNull();
    expect(await within(cifre).findByText('Conteggio delle domande di sostegno non disponibile in questo momento.')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande di sostegno')).toBe('non disponibile');
  });
});

describe('RF016 e RF015: card Istituzionale della Home (OP-IS-11; tabella a confronto, rework 2 della card del 31/10/2026)', () => {
  // l'output regionale (TX-0017) e' del fisico dal 29/10/2026; la colonna SIGC legge TX-0015 con l'ultimo esercizio chiuso
  const ESERCIZIO = esercizioUltimoChiuso(new Date());
  const TABELLA = "L'istituzionale in cifre: verifica SMP non SIGC e SIGC";
  const NOTA_SIGC = `SIGC: dal 16/10/${ESERCIZIO - 1} al 15/10/${ESERCIZIO}, domande dell'anno ${ESERCIZIO - 1}.`;

  /** TX-0015 come il backend (l'esercizio chiesto, le righe dei filtri), con la query di ogni lettura registrata. */
  function letturaSigc(base: VerificaSmp = VERIFICA_SMP) {
    const query: string[] = [];
    server.use(
      http.get(`*${VERIFICA_SIGC_PATH}`, ({ request }) => {
        const u = new URL(request.url);
        query.push(u.search);
        return HttpResponse.json(verificaSigcPer(base, u.searchParams));
      }),
    );
    return query;
  }

  const tabella = () => screen.findByRole('table', { name: TABELLA });
  const colonne = (t: HTMLElement) => within(t).getAllByRole('columnheader').map((h) => h.textContent);

  /** Il testo della cella per riga (intestazione di riga) e colonna (l'intestazione di colonna comincia con `colonna`). */
  function cella(t: HTMLElement, riga: string, colonna: string): string {
    const indice = within(t)
      .getAllByRole('columnheader')
      .findIndex((h) => h.textContent?.startsWith(colonna));
    if (indice < 0) throw new Error(`colonna ${colonna} assente`);
    return within(t).getByRole('rowheader', { name: riga }).closest('tr')?.querySelectorAll('td')[indice]?.textContent ?? '';
  }

  it('col solo grant di TX-0016: la sola colonna non SIGC (cumulativi), senza domande pagate, la quota e la nota col file (D3); una lettura senza filtri ne anno', async () => {
    conRuoli(['csr.tx-0016.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const sigc = lettura(VERIFICA_SIGC_PATH, VERIFICA_SMP);
    const { container } = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC: ultimo file SMP 2025.')).toBeTruthy();
    const t = await tabella();
    expect(colonne(t)).toEqual(['Non SIGC (cumulativi)']);
    expect(within(t).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['Domande ricevute', 'Domande finanziate', 'Spesa pubblica erogata']);
    expect([cella(t, 'Domande ricevute', 'Non SIGC'), cella(t, 'Domande finanziate', 'Non SIGC'), cella(t, 'Spesa pubblica erogata', 'Non SIGC')]).toEqual(['4', '2', formatEuro(91200.5)]);
    expect(within(cifre).getByText('Spesa non SIGC sul valore finanziato')).toBeTruthy();
    expect(within(cifre).getByText(formatPercentuale(57))).toBeTruthy();
    expect(query).toEqual(['']);
    expect(sigc).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('coi grant di TX-0016 e TX-0015: le due colonne affiancate, la SIGC letta senza filtri con l ultimo esercizio chiuso; trattino delle domande pagate non SIGC; una sola barra; nessuna violazione axe', async () => {
    conRuoli(['csr.tx-0015.read', 'csr.tx-0016.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const sigc = letturaSigc();
    const { container } = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText(`Non SIGC: ultimo file SMP 2025. ${NOTA_SIGC}`)).toBeTruthy();
    const t = await tabella();
    expect(cifre.contains(t)).toBe(true);
    expect(colonne(t)).toEqual(['Non SIGC (cumulativi)', `SIGC (esercizio ${ESERCIZIO})`]);
    expect(within(t).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['Domande ricevute', 'Domande finanziate', 'Domande pagate', 'Spesa pubblica erogata']);
    // spesa dell'esercizio = campagna precedente (400.000) + campagne anteriori (0)
    expect(['Domande ricevute', 'Domande finanziate', 'Domande pagate', 'Spesa pubblica erogata'].map((r) => cella(t, r, 'SIGC'))).toEqual(['120', '100', '80', formatEuro(400000)]);
    expect(cella(t, 'Domande ricevute', 'Non SIGC')).toBe('4');
    // la riga che la verifica non SIGC non ha: un trattino per gli occhi, il perche' per i lettori di schermo
    expect(cella(t, 'Domande pagate', 'Non SIGC')).toBe('—dato non previsto nella verifica non SIGC');
    expect(within(t).getByText('—').getAttribute('aria-hidden')).toBe('true');
    expect(cifre.querySelectorAll('.ui-barra')).toHaveLength(1);
    expect(query).toEqual(['']);
    expect(sigc).toEqual([`?esercizio=${ESERCIZIO}`]);
    await expectNoA11yViolations(container);
  });

  it('col solo grant della verifica SIGC: la sola colonna SIGC con le domande pagate, nessuna lettura di TX-0016, nessuna quota', async () => {
    conRuoli(['csr.tx-0015.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const sigc = letturaSigc();
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const t = await tabella();
    await waitFor(() => expect(cella(t, 'Domande ricevute', 'SIGC')).toBe('120'));
    expect(colonne(t)).toEqual([`SIGC (esercizio ${ESERCIZIO})`]);
    expect(cella(t, 'Domande pagate', 'SIGC')).toBe('80');
    expect(await screen.findByText(NOTA_SIGC)).toBeTruthy();
    expect(document.querySelector('.ui-barra')).toBeNull();
    expect(screen.queryByText("Contenuti dell'area")).toBeNull();
    expect([query, sigc]).toEqual([[], [`?esercizio=${ESERCIZIO}`]]);
  });

  it('senza nessuno dei due grant: nessuna lettura, la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0060.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const sigc = lettura(VERIFICA_SIGC_PATH, VERIFICA_SMP);
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
    expect([query, sigc]).toEqual([[], []]);
  });

  it('le due colonne leggono e falliscono da sole: lo scheletro e poi "non disponibile" con la frase d errore di una, i numeri dell altra; nessun avviso', async () => {
    conRuoli(['csr.tx-0015.read', 'csr.tx-0016.read']);
    const t0 = trattenuta();
    server.use(
      http.get(`*${VERIFICA_SIGC_PATH}`, async () => {
        await t0.attesa;
        return HttpResponse.json(problema(503, 'CAPACITA_ESAURITA'), { status: 503 });
      }),
    );
    lettura(VERIFICA_PATH, VERIFICA);
    const vista = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    const t = await tabella();
    await waitFor(() => expect(cella(t, 'Domande ricevute', 'Non SIGC')).toBe('4'));
    // la colonna SIGC in attesa: scheletro nelle celle, annunciato una volta
    expect(within(cifre).getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(within(cifre).getByRole('status').textContent).toBe('Caricamento in corso…');
    expect(cella(t, 'Domande ricevute', 'SIGC')).toBe('');
    expect(t.querySelectorAll('td .ui-skeleton')).toHaveLength(4);
    await act(async () => t0.libera());
    expect(await within(cifre).findByText('Dati della verifica SMP SIGC non disponibili in questo momento.')).toBeTruthy();
    expect(cella(t, 'Spesa pubblica erogata', 'SIGC')).toBe('non disponibile');
    expect(within(cifre).queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(cella(t, 'Spesa pubblica erogata', 'Non SIGC')).toBe(formatEuro(91200.5));
    vista.unmount();

    server.use(indisponibile(VERIFICA_PATH));
    letturaSigc();
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Dati della verifica SMP non SIGC non disponibili in questo momento.')).toBeTruthy();
    const altra = await tabella();
    await waitFor(() => expect(cella(altra, 'Domande ricevute', 'SIGC')).toBe('120'));
    expect(cella(altra, 'Domande ricevute', 'Non SIGC')).toBe('non disponibile');
    // il trattino resta: la riga non e' della verifica non SIGC, anche quando la lettura fallisce
    expect(cella(altra, 'Domande pagate', 'Non SIGC')).toBe('—dato non previsto nella verifica non SIGC');
    expect(screen.getByText(NOTA_SIGC)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('D3 (review IST-03): l ultimo esercizio chiuso nel calendario italiano anche con l orologio in UTC, a cavallo della mezzanotte del 16/10', async () => {
    conRuoli(['csr.tx-0015.read']);
    const fuso = process.env.TZ;
    process.env.TZ = 'UTC';
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      // 15/10/2026 23:30 in Italia (21:30 UTC): l'esercizio 2026 non e' ancora chiuso
      vi.setSystemTime(new Date('2026-10-15T21:30:00Z'));
      const prima = letturaSigc();
      const vista = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
      expect(await screen.findByRole('columnheader', { name: 'SIGC (esercizio 2025)' })).toBeTruthy();
      expect(await screen.findByText("SIGC: dal 16/10/2024 al 15/10/2025, domande dell'anno 2024.")).toBeTruthy();
      expect(prima).toEqual(['?esercizio=2025']);
      vista.unmount();

      // 16/10/2026 00:30 in Italia (22:30 UTC, in UTC ancora il 15): l'ultimo chiuso e' il 2026
      vi.setSystemTime(new Date('2026-10-15T22:30:00Z'));
      const dopo = letturaSigc();
      renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
      expect(await screen.findByRole('columnheader', { name: 'SIGC (esercizio 2026)' })).toBeTruthy();
      expect(dopo).toEqual(['?esercizio=2026']);
    } finally {
      vi.useRealTimers();
      if (fuso === undefined) delete process.env.TZ;
      else process.env.TZ = fuso;
    }
  });

  it('colonna SIGC: una parte della spesa assente in una riga, non disponibile col motivo sotto la tabella (mai una somma parziale); i conteggi restano', async () => {
    conRuoli(['csr.tx-0015.read']);
    const righe = [...(VERIFICA_SMP.righe ?? []), { ...VERIFICA_SMP.righe[0], codiceIntervento: 'SRA03', spesaErogataCampagneAnteriori: { valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'IMPEGNI' } }];
    letturaSigc({ ...VERIFICA_SMP, righe });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const t = await tabella();
    await waitFor(() => expect(cella(t, 'Spesa pubblica erogata', 'SIGC')).toBe('non disponibile'));
    expect(screen.getByText('Spesa pubblica erogata, SIGC: Non calcolabile: manca per 1 intervento (SRA03); non disponibile (fonte impegni non attiva)')).toBeTruthy();
    expect(cella(t, 'Domande ricevute', 'SIGC')).toBe('240');
  });

  it('errore: una frase, nessun avviso; nessun file SMP non SIGC: la nota lo dice e i numeri restano', async () => {
    conRuoli(['csr.tx-0016.read']);
    server.use(indisponibile(VERIFICA_PATH));
    const errore = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Dati della verifica SMP non SIGC non disponibili in questo momento.')).toBeTruthy();
    expect(cella(await tabella(), 'Domande ricevute', 'Non SIGC')).toBe('non disponibile');
    expect(document.querySelector('.ui-barra')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    errore.unmount();

    lettura(VERIFICA_PATH, { ...VERIFICA, annoRiferimento: null });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC: nessun file SMP.')).toBeTruthy();
    expect(cella(await tabella(), 'Domande ricevute', 'Non SIGC')).toBe('4');
  });

  it('spesa assente in una riga: non disponibile col motivo sotto la tabella, niente quota, mai una somma parziale', async () => {
    conRuoli(['csr.tx-0016.read']);
    const righe = VERIFICA.righe.map((r) => (r.codiceIntervento === 'SRA16' ? { ...r, spesaErogata: { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null } } : r));
    lettura(VERIFICA_PATH, { ...VERIFICA, righe });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    const t = await tabella();
    await waitFor(() => expect(cella(t, 'Spesa pubblica erogata', 'Non SIGC')).toBe('non disponibile'));
    expect(within(cifre).getByText('Spesa pubblica erogata, Non SIGC: Non calcolabile: manca per 1 intervento (SRA16); non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)')).toBeTruthy();
    expect(within(cifre).getByText('Spesa non SIGC sul valore finanziato: non calcolabile: manca il totale della spesa')).toBeTruthy();
    expect(cifre.querySelector('.ui-barra')).toBeNull();
  });

  it('perimetro ADA: l intestazione della colonna dice "della tua area"', async () => {
    conRuoli(['csr.tx-0016.read']);
    lettura(VERIFICA_PATH, { ...VERIFICA, perimetro: 'ADA' });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByRole('columnheader', { name: 'Non SIGC (cumulativi della tua area)' })).toBeTruthy();
  });
});

describe('RF002 e RF009: card Finanziario della Home, stati d errore (review V-03)', () => {
  const GRANT_CARD = ['csr.tx-0002.read', 'csr.tx-0009.read'];

  it('dotazione e pagamenti in errore: la frase, le domande restano; domande in errore: non disponibile col motivo', async () => {
    conRuoli(GRANT_CARD);
    server.use(indisponibile('/api/finanziario/spesa-per-intervento'), rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE));
    const spesa = renderConQuery(<AnteprimaFinanziario altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il finanziario in cifre' });
    expect(await within(cifre).findByText('Dotazione e pagamenti non disponibili in questo momento.')).toBeTruthy();
    await waitFor(() => expect(valoreDi(cifre, 'Domande presentate')).toBe('1200'));
    expect(screen.queryByRole('alert')).toBeNull();
    spesa.unmount();

    server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), indisponibile('/api/finanziario/totale-domande'));
    renderConQuery(<AnteprimaFinanziario altrimenti={ALTRIMENTI} />);
    const altre = await screen.findByRole('group', { name: 'Il finanziario in cifre' });
    await waitFor(() => expect(valoreDi(altre, 'Domande presentate')).toBe('non disponibile'));
    expect(notaDi(altre, 'Domande presentate')).toBe('Conteggio non disponibile in questo momento.');
    expect(await within(altre).findByText('Pagamenti totali (lordi)')).toBeTruthy();
  });

  it('domande in errore dopo un primo dato in cache: non disponibile, mai il numero vecchio (cambio dichiarato)', async () => {
    conRuoli(GRANT_CARD);
    server.use(rispondi('/api/finanziario/spesa-per-intervento', F.SPESA), rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE));
    const client = clientDiTest();
    renderConQuery(<AnteprimaFinanziario altrimenti={ALTRIMENTI} />, client);
    const cifre = await screen.findByRole('group', { name: 'Il finanziario in cifre' });
    await waitFor(() => expect(valoreDi(cifre, 'Domande presentate')).toBe('1200'));
    server.use(indisponibile('/api/finanziario/totale-domande'));
    await act(async () => {
      await client.refetchQueries();
    });
    await waitFor(() => expect(valoreDi(cifre, 'Domande presentate')).toBe('non disponibile'));
    expect(notaDi(cifre, 'Domande presentate')).toBe('Conteggio non disponibile in questo momento.');
  });
});
