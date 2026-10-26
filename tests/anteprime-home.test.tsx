// anteprime-home.test.tsx — le card dinamiche della Home di fisico, procedurale e istituzionale (decisione dell'utente del
// 26/10/2026; flussi superfici, panoramica e verifica-smp-non-sigc riapprovati: OP-FIS-10, OP-PR-10, OP-IS-11), rese da sole
// su MSW: i numeri dalle letture senza filtri e solo coi grant, l'attesa, l'errore che non ferma la card, le assenze col
// motivo, nessun dato, il perimetro ADA, axe. Il cablaggio nella Home (aree.ts) e' in app-aree.test.tsx.
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../src/shared/api/mock/server';
import { formatEuro, formatPercentuale } from '../src/shared/lib';
import { expectNoA11yViolations } from '../src/shared/testing/axe';
import { problema, rispondi, trattenuta } from '../src/shared/testing/msw';
import { renderConQuery } from '../src/shared/testing/render';
import { AnteprimaFisico } from '../src/features/fisico';
import { AnteprimaIstituzionale } from '../src/features/istituzionale';
import { AnteprimaProcedurale } from '../src/features/procedurale';
import { SUPERFICI, SUPERFICI_SENZA, campagna } from '../src/features/fisico/testing/fixture';
import { ammessePer, statiPer } from '../src/features/procedurale/testing/fixture';
import { lettureProcedurale } from '../src/features/procedurale/testing/letture';
import { VERIFICA } from '../src/features/istituzionale/testing/fixture';

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

describe('RF018: card Fisico della Home (OP-FIS-10)', () => {
  const SUPERFICI_PATH = '/api/fisico/superficie-ammissibile';

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

  it('senza il grant: nessuna lettura (MSW la rifiuterebbe), la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0020.read']);
    renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('lettura in corso: lo scheletro al posto dei numeri', async () => {
    conRuoli(['csr.tx-0018.read']);
    const t = trattenuta();
    server.use(
      http.get(`*${SUPERFICI_PATH}`, async () => {
        await t.attesa;
        return HttpResponse.json(SUPERFICI);
      }),
    );
    const { container } = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    await screen.findByRole('group', { name: 'Il fisico in cifre' });
    await waitFor(() => expect(container.querySelector('.ui-skeleton')).not.toBeNull());
    t.libera();
    expect(await screen.findByText('Campagna 2025')).toBeTruthy();
    expect(container.querySelector('.ui-skeleton')).toBeNull();
  });

  it('errore: una frase, nessun avviso; nessuna superficie; nessuna domanda di pagamento nella campagna', async () => {
    conRuoli(['csr.tx-0018.read']);
    server.use(indisponibile(SUPERFICI_PATH));
    const errore = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Superfici non disponibili in questo momento.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    errore.unmount();

    lettura(SUPERFICI_PATH, SUPERFICI_SENZA);
    const senza = renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Nessuna superficie ammissibile nelle domande.')).toBeTruthy();
    senza.unmount();

    lettura(SUPERFICI_PATH, { ...SUPERFICI, righe: [{ codiceIntervento: 'SRB01', motivo: null, campagne: [campagna(2026, { domandePagamento: 0 })] }] });
    renderConQuery(<AnteprimaFisico altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText('Domande con DP oltre la DS: nessuna domanda di pagamento')).toBeTruthy();
    expect(document.querySelector('.ui-barra')).toBeNull();
  });
});

describe('RF026 e RF027: card Procedurale della Home (OP-PR-10)', () => {
  const senzaFiltri = new URLSearchParams();

  it('coi grant di TX-0026 e TX-0027: ammesse, contributo, interventi attivati e domande di sostegno, letti senza filtri', async () => {
    conRuoli(['csr.tx-0026.read', 'csr.tx-0027.read']);
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    const { container } = renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    expect(await within(cifre).findByText('2 su 3 (66,7 %)')).toBeTruthy();
    expect(within(cifre).getByText('Interventi attivati')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande ammesse')).toBe('3');
    expect(valoreDi(cifre, 'Contributo ammesso')).toBe(formatEuro(800));
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno')).toBe('4'));
    expect(lette.ammesse).toEqual(['']);
    expect(lette.sostegno).toEqual(['']);
    expect(lette.pagamento).toEqual([]);
    await expectNoA11yViolations(container);
  });

  it('col solo grant degli stati di sostegno: il solo conteggio, nessuna lettura delle ammesse', async () => {
    conRuoli(['csr.tx-0027.read']);
    const { handlers, lette } = lettureProcedurale();
    server.use(...handlers);
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: 'Il procedurale in cifre' });
    await waitFor(() => expect(valoreDi(cifre, 'Domande di sostegno')).toBe('4'));
    expect(within(cifre).queryByText('Domande ammesse')).toBeNull();
    expect(lette.ammesse).toEqual([]);
  });

  it('senza i due grant: nessuna lettura, la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0028.read']);
    renderConQuery(<AnteprimaProcedurale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
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
    expect(within(cifre).getByText('Non disponibile: fonte atto di concessione non attiva')).toBeTruthy();
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
  const VERIFICA_PATH = '/api/istituzionale/verifica-smp-non-sigc';

  it('col grant di TX-0016: i totali della verifica con l anno del file, da una lettura senza filtri ne anno, e nessuna violazione axe', async () => {
    conRuoli(['csr.tx-0016.read', 'csr.tx-0017.read']);
    const query = lettura(VERIFICA_PATH, VERIFICA);
    const { container } = renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    expect(await within(cifre).findByText('Non SIGC, anno di riferimento 2025')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande finanziate')).toBe('2');
    expect(valoreDi(cifre, 'Spesa pubblica erogata')).toBe(formatEuro(91200.5));
    expect(valoreDi(cifre, 'Domande ricevute')).toBe('4');
    expect(within(cifre).getByText('Spesa erogata sul valore delle domande finanziate')).toBeTruthy();
    expect(within(cifre).getByText(formatPercentuale(57))).toBeTruthy();
    expect(query).toEqual(['']);
    await expectNoA11yViolations(container);
  });

  it('col solo grant dell output: nessuna lettura (l output non si somma), la card dice cosa c e nell area', async () => {
    conRuoli(['csr.tx-0017.read']);
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    expect(await screen.findByText("Contenuti dell'area")).toBeTruthy();
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
    expect(await within(cifre).findByText('Non SIGC, nessun file SMP non SIGC')).toBeTruthy();
    expect(valoreDi(cifre, 'Domande ricevute')).toBe('4');
  });

  it('spesa assente in una riga: non disponibile col motivo, niente quota, mai una somma parziale', async () => {
    conRuoli(['csr.tx-0016.read']);
    const righe = VERIFICA.righe.map((r) => (r.codiceIntervento === 'SRA16' ? { ...r, spesaErogata: { valore: null, motivo: 'FONTE_AMBIGUA', fonte: null } } : r));
    lettura(VERIFICA_PATH, { ...VERIFICA, righe });
    renderConQuery(<AnteprimaIstituzionale altrimenti={ALTRIMENTI} />);
    const cifre = await screen.findByRole('group', { name: "L'istituzionale in cifre" });
    await waitFor(() => expect(valoreDi(cifre, 'Spesa pubblica erogata')).toBe('non disponibile'));
    expect(within(cifre).getByText('Non calcolabile: manca per 1 intervento (SRA16); non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC)')).toBeTruthy();
    expect(within(cifre).getByText('Spesa erogata sul valore delle domande finanziate: non calcolabile: manca il totale della spesa')).toBeTruthy();
    expect(cifre.querySelector('.ui-barra')).toBeNull();
  });
});
