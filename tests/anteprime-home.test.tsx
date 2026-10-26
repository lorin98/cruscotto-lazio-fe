// anteprime-home.test.tsx — le card dinamiche della Home di fisico, procedurale e istituzionale (decisione dell'utente del
// 26/10/2026; flussi superfici, panoramica e verifica-smp-non-sigc approvati: OP-FIS-10, OP-PR-10, OP-IS-11) e gli stati
// d'errore della card del finanziario, rese da sole su MSW: i numeri dalle letture senza filtri e solo coi grant (ogni
// lettura registrata: "nessuna lettura" e' un conteggio, review A-01), l'attesa annunciata (D4), l'errore che non ferma la
// card, le assenze col motivo, nessun dato, il perimetro ADA, axe. Il cablaggio nella Home (aree.ts), i profili del catalogo
// e la cache condivisa con le pagine sono in app-aree.test.tsx.
import { describe, expect, it } from 'vitest';
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
import { OUTPUT, VERIFICA } from '../src/features/istituzionale/testing/fixture';

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
const OUTPUT_PATH = '/api/istituzionale/output-regionale';

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

describe('RF016: card Istituzionale della Home (OP-IS-11)', () => {
  it('col grant di TX-0016: i totali della verifica, cumulativi con l anno dell ultimo file (D3), da una lettura senza filtri ne anno; nessuna lettura dell output', async () => {
    conRuoli(['csr.tx-0016.read', 'csr.tx-0017.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const output = lettura(OUTPUT_PATH, OUTPUT);
    const { container } = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC, valori cumulativi (ultimo file SMP non SIGC: 2025)')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande finanziate')).toBe('2');
    expect(valoreDi(cifre, 'Spesa pubblica erogata')).toBe(formatEuro(91200.5));
    expect(valoreDi(cifre, 'Domande ricevute')).toBe('4');
    expect(within(cifre).getByText('Spesa erogata sul valore delle domande finanziate')).toBeTruthy();
    expect(within(cifre).getByText(formatPercentuale(57))).toBeTruthy();
    expect(query).toEqual(['']);
    expect(output).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('col solo grant dell output: nessuna lettura registrata (l output non si somma), la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0017.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const output = lettura(OUTPUT_PATH, OUTPUT);
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
    expect([query, output]).toEqual([[], []]);
  });

  it('errore: una frase, nessun avviso; nessun file SMP non SIGC: i numeri restano', async () => {
    conRuoli(['csr.tx-0016.read']);
    server.use(indisponibile(VERIFICA_PATH));
    const errore = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Dati della verifica SMP non SIGC non disponibili in questo momento.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    errore.unmount();

    lettura(VERIFICA_PATH, { ...VERIFICA, annoRiferimento: null });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC, valori cumulativi (nessun file SMP non SIGC)')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande ricevute')).toBe('4');
  });

  it('spesa assente in una riga: non disponibile col motivo, niente quota, mai una somma parziale', async () => {
    conRuoli(['csr.tx-0016.read']);
    const righe = VERIFICA.righe.map((r) => (r.codiceIntervento === 'SRA16' ? { ...r, spesaErogata: { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null } } : r));
    lettura(VERIFICA_PATH, { ...VERIFICA, righe });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    await waitFor(() => expect(valoreDi(cifre, 'Spesa pubblica erogata')).toBe('non disponibile'));
    expect(notaDi(cifre, 'Spesa pubblica erogata')).toBe('Non calcolabile: manca per 1 intervento (SRA16); non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)');
    expect(within(cifre).getByText('Spesa erogata sul valore delle domande finanziate: non calcolabile: manca il totale della spesa')).toBeTruthy();
    expect(cifre.querySelector('.ui-barra')).toBeNull();
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
