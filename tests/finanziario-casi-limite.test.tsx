import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { server } from '../src/shared/api/mock/server';
import { trovaCard } from '../src/shared/testing/card-grafico';
import { graficiVivi } from '../src/shared/testing/grafico-finto';
import { rispondi } from '../src/shared/testing/msw';
import { renderConQuery } from '../src/shared/testing/render';
import {
  AvanzamentoReport,
  DettaglioIntervento,
  DomandeReport,
  DotazioneReport,
  PannelloFiltri,
  Panoramica,
  RiepilogoReport,
  RiservaReport,
  SigcReport,
  UltimoAggiornamento,
  VerificaSmpReport,
} from '../src/features/finanziario';
import type { Filtri } from '../src/features/finanziario';
import * as F from '../src/shared/testing/fixture-finanziario';

// Casi limite dei DTO (tutti i campi sono opzionali nella spec): liste vuote, campi assenti o null, voci incomplete,
// legame delle azioni attivo. Regola trasversale: un dato assente non diventa mai uno zero ne' una cella vuota.
const nessunaAzione = () => {};
const testo = (s: string | null | undefined) => (s ?? '').replace(/\s/g, ' ');
const ruolo = (el: HTMLElement) => el.closest('[role]')?.getAttribute('role');
const euro = (valore: number) => ({ valore, motivo: null, fonte: null });
const ZERO = euro(0);
const VUOTO_SIGC = 'Nessuna domanda SIGC per i filtri scelti. Modifica i filtri.';
const NON_DISPONIBILE_GRAFICO = /^Grafico non disponibile: /;

// Router in memoria (come shared/testing/render-pagina.tsx) per i componenti che navigano o hanno link.
function conRouter(ui: ReactElement) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/prova'] });
  return { ...renderConQuery(<RouterProvider router={router} />), router };
}
const titoloGrafico = (g: { el: HTMLElement }) => g.el.closest('section')?.querySelector('h2, h3')?.textContent;
const valoreKpi = (nome: string) => testo(screen.getByRole('region', { name: nome }).querySelector('.ui-kpi__valore')?.textContent);
const valoreDi = (tabella: HTMLElement, voce: string) => testo(within(tabella).getByRole('rowheader', { name: voce }).nextElementSibling?.textContent);

describe('PannelloFiltri: casi limite', () => {
  function Aperto({ valori, onApplica }: { valori: Filtri; onApplica: (f: Filtri) => void }) {
    const [aperto, setAperto] = useState(true);
    return <PannelloFiltri aperto={aperto} valori={valori} onApplica={onApplica} onChiudi={() => setAperto(false)} />;
  }

  it("con il legame delle azioni portanti il filtro e attivo, la scelta dall'indirizzo resta e si applica", async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, legameAzioniDisponibile: true }));
    const applicati: Filtri[] = [];
    renderConQuery(<Aperto valori={{ azione: ['1'] }} onApplica={(f) => applicati.push(f)} />);
    const azione = (await screen.findByRole('checkbox', { name: '1 Azione portante di prova' })) as HTMLInputElement;
    expect((screen.getByRole('group', { name: 'Azione portante' }) as HTMLFieldSetElement).disabled).toBe(false);
    expect(azione.checked).toBe(true);
    expect(screen.queryByText(/Non disponibile finché nessun intervento/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Applica i filtri' }));
    expect(applicati).toEqual([{ azione: ['1'] }]);
  });

  it('senza interventi in programmazione: stato vuoto informativo (status), niente caselle', async () => {
    server.use(rispondi('/api/finanziario/filtri', { legameAzioniDisponibile: false }));
    renderConQuery(<Aperto valori={{}} onApplica={nessunaAzione} />);
    expect(ruolo(await screen.findByText('Nessun intervento in programmazione: i filtri non sono disponibili.'))).toBe('status');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('voci senza chiave scartate, voci senza descrizione mostrano il codice; liste assenti senza scelte', async () => {
    server.use(rispondi('/api/finanziario/filtri', { interventi: [{ chiave: 'SRA01' }, { descrizione: 'senza chiave' }], obiettiviSpecifici: [{ chiave: 'SO4', descrizione: null }] }));
    renderConQuery(<Aperto valori={{}} onApplica={nessunaAzione} />);
    await screen.findByRole('checkbox', { name: 'SRA01' });
    expect(within(screen.getByRole('group', { name: 'Intervento' })).getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.queryByText('senza chiave')).toBeNull();
    expect(within(screen.getByRole('group', { name: 'Obiettivo specifico (OS)' })).getByRole('button').textContent).toBe('SO4');
    expect(within(screen.getByRole('group', { name: 'Obiettivo di policy (OP)' })).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('UltimoAggiornamento: casi limite', () => {
  const pill = () => screen.findByRole('button', { name: /^Ultimo dato sincronizzato: dati al/ });

  it('voci incomplete escluse dalla data e dal popover', async () => {
    server.use(
      rispondi('/api/finanziario/filtri', {
        ...F.FILTRI,
        ultimiDatiSincronizzati: [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }, { flusso: 'PROSA_DS04' }, { conclusoIl: '2026-03-05T10:00:00Z' }],
      }),
    );
    renderConQuery(<UltimoAggiornamento />);
    const p = await pill();
    expect(p.textContent).toBe('Dati al 02/03/2026');
    await userEvent.click(p);
    const voci = within(await screen.findByRole('dialog')).getAllByRole('listitem');
    expect(voci.map((li) => Array.from(li.children, (c) => c.textContent))).toEqual([['DS-12', '02/03/2026 10:15']]);
  });

  it('nessuna voce completa: "nessuna acquisizione conclusa", senza popover', async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, ultimiDatiSincronizzati: [{ flusso: 'DS-12' }] }));
    renderConQuery(<UltimoAggiornamento />);
    expect(await screen.findByText('Ultimo dato sincronizzato: nessuna acquisizione conclusa')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it("microsecondi del backend e ora italiana: un istante UTC dopo le 23 e gia' il giorno dopo", async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, ultimiDatiSincronizzati: [{ flusso: 'DS-12', conclusoIl: '2026-03-02T23:30:00.123456Z' }] }));
    renderConQuery(<UltimoAggiornamento />);
    const p = await pill();
    expect(p.textContent).toBe('Dati al 03/03/2026');
    await userEvent.click(p);
    expect(within(await screen.findByRole('dialog')).getByRole('listitem').lastElementChild?.textContent).toBe('03/03/2026 00:30');
  });
});

describe('Panoramica: casi limite', () => {
  it('righe senza importi: KPI "non disponibile" o "non calcolabile" con il motivo, grafici non disegnati con il motivo, mai zeri', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [{ codiceIntervento: 'SRA01' }] }),
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE),
      rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI),
    );
    conRouter(<Panoramica filtri={{}} />);
    const avanzamento = await trovaCard('Avanzamento per intervento');
    expect(within(avanzamento).getByText('Grafico non disponibile: nessun intervento con dotazione e pagato valorizzati.')).toBeTruthy();
    expect(within(avanzamento).getByText('1 voce non nel grafico')).toBeTruthy();
    expect(within(await trovaCard('Dotazione per famiglia di intervento')).getByText('Grafico non disponibile: nessun intervento con dotazione valorizzata e positiva.')).toBeTruthy();
    expect(valoreKpi('Dotazione spesa pubblica')).toBe('Non disponibile: nessun intervento con dotazione valorizzata');
    expect(valoreKpi('Pagamenti totali')).toBe('Non disponibile: nessun pagamento valorizzato');
    expect(valoreKpi('Pagato sulla dotazione')).toBe('Non calcolabile: dati insufficienti');
    expect(within(screen.getByRole('region', { name: 'Pagato sulla dotazione' })).queryByRole('img')).toBeNull();
    expect(screen.queryAllByText(/0,0 M€/)).toHaveLength(0);
    await waitFor(() => expect(graficiVivi().map(titoloGrafico)).toEqual(['Domande SIGC: dalla presentazione al pagamento', 'Importi SIGC']));
  });

  // regressione: le card SIGC seguono il segnale di TX-0012 come SigcReport (prima la cascata disegnava gli zeri)
  it('selezione senza domande SIGC: le due card dichiarano il vuoto (come la pagina SIGC) invece di disegnare zeri', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/sigc/domande', { perimetro: 'REGIONALE', presentate: 0, pagate: 0, daPagare: 0 }),
      rispondi('/api/finanziario/sigc/importi', { perimetro: 'REGIONALE', richiesto: ZERO, ammesso: ZERO, pagato: ZERO, ancoraDaPagare: ZERO }),
    );
    conRouter(<Panoramica filtri={{ intervento: ['SRA01'] }} />);
    await waitFor(() => expect(screen.getAllByText(VUOTO_SIGC)).toHaveLength(2));
    for (const v of screen.getAllByText(VUOTO_SIGC)) expect(ruolo(v)).toBe('status');
    await waitFor(() => expect(graficiVivi().length).toBeGreaterThanOrEqual(2));
    expect(graficiVivi().map(titoloGrafico)).not.toContain('Importi SIGC');
    expect(graficiVivi().map(titoloGrafico)).not.toContain('Domande SIGC: dalla presentazione al pagamento');
  });
});

describe('DettaglioIntervento: casi limite', () => {
  it('codice non fra i valori di TX-0001 e riga senza importi: titolo col codice, KPI e grafici dichiarano le assenze', async () => {
    server.use(
      rispondi('/api/finanziario/filtri', F.FILTRI),
      rispondi('/api/finanziario/riepilogo', { perimetro: 'REGIONALE', righe: [{ codiceIntervento: 'SRD99', domandePresentate: 0 }] }),
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'REGIONALE', righe: [] }),
    );
    conRouter(<DettaglioIntervento codice="SRD99" />);
    expect(await screen.findByRole('heading', { level: 1, name: 'SRD99' })).toBeTruthy();
    for (const kpi of ['Dotazione spesa pubblica', 'Risorse quota FEASR', 'Pagamenti al netto delle rettifiche']) expect(valoreKpi(kpi)).toBe('Non disponibile nel riepilogo');
    // un conteggio a zero e' un dato
    expect(valoreKpi('Domande presentate')).toBe('0');
    const cascata = await trovaCard('Dalla dotazione al residuo');
    expect(within(cascata).getByText(NON_DISPONIBILE_GRAFICO).textContent).toBe(
      'Grafico non disponibile: la cascata di SRD99 richiede dotazione e pagamenti netti: dotazione non disponibile, pagamenti netti non disponibile.',
    );
    expect(within(await trovaCard('Pagato sulla dotazione')).getByText(/valore non disponibile, la percentuale non si può calcolare/)).toBeTruthy();
    expect(screen.queryByText(/^Contributo ambientale/)).toBeNull();
    expect(graficiVivi()).toHaveLength(0);
  });
});

describe('RiepilogoReport: casi limite', () => {
  const tabella = () => screen.findByRole('table', { name: /^Riepilogo per intervento \(RF011\)/ });

  it('tutte le colonne valorizzate: nessuna colonna nascosta e nessuna nota', async () => {
    const piena = {
      codiceIntervento: 'SRA01',
      domandePresentate: 10,
      dotazioneSpesaPubblica: euro(100000),
      risorseQuotaFeasr: euro(40000),
      importoStanziato: euro(90000),
      impegnatoCofinanziatoFeasr: euro(30000),
      impegnatoCofinanziatoFeasrENon: euro(70000),
      pagamentiNettoRettifiche: euro(50000),
      dotazioneResiduaSuImpegni: euro(30000),
      dotazioneResiduaSuPagamenti: euro(50000),
    };
    server.use(rispondi('/api/finanziario/riepilogo', { perimetro: 'REGIONALE', righe: [piena] }));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    expect(within(await tabella()).getAllByRole('columnheader')).toHaveLength(10);
    expect(screen.queryByText(/^Colonne nascoste/)).toBeNull();
  });

  it("anteprima: una voce per campo (dt e dd raggruppati), assenze con il motivo, dati di programma regionali nell'ADA", async () => {
    server.use(rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, perimetro: 'ADA' }));
    conRouter(<RiepilogoReport filtri={{}} />);
    await userEvent.click(within(await tabella()).getByRole('row', { name: "Apri l'anteprima dell'intervento SRA01" }));
    const anteprima = await screen.findByRole('dialog', { name: 'SRA01' });
    const dl = anteprima.querySelector('dl') as HTMLDListElement;
    expect(Array.from(dl.children).every((c) => c.tagName === 'DIV')).toBe(true);
    const voci = Array.from(dl.children, (c) => [c.querySelector('dt')?.textContent, testo(c.querySelector('dd')?.textContent)]);
    expect(voci).toHaveLength(9);
    expect(voci[0]).toEqual(['Domande presentate', '12']);
    expect(voci).toContainEqual(['Dotazione spesa pubblica (regionale)', '1.000.000,00 €']);
    expect(voci).toContainEqual(['Importo stanziato (regionale)', 'non disponibilefonte quadro sinottico non attiva']);
  });

  // regressione: il totale delle domande con un conteggio assente e' non calcolabile, come quelli degli importi
  it('un conteggio di domande assente non entra nel totale come zero', async () => {
    const [prima, seconda] = F.RIEPILOGO.righe;
    const senzaConteggio: Partial<typeof seconda> = { ...seconda };
    delete senzaConteggio.domandePresentate;
    server.use(rispondi('/api/finanziario/riepilogo', { ...F.RIEPILOGO, righe: [prima, senzaConteggio] }));
    renderConQuery(<RiepilogoReport filtri={{}} />);
    const t = (await tabella()) as HTMLTableElement;
    expect(t.tFoot?.rows[0].cells[1].textContent).toBe('non calcolabile');
  });
});

describe('DotazioneReport: casi limite', () => {
  it('righe senza importi e distribuzione senza valori: nessun grafico inventato, colonne nascoste dichiarate, perimetro ADA dichiarato', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'ADA', righe: [{ codiceIntervento: 'SRA01' }] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'ADA' }),
    );
    conRouter(<DotazioneReport filtri={{}} />);
    expect(within(await trovaCard('Dotazione e pagamenti per intervento')).getByText('Grafico non disponibile: nessun intervento con il pagato valorizzato.')).toBeTruthy();
    expect(within(await trovaCard('Contributo ambientale per intervento')).getByText('Grafico non disponibile: nessun intervento con il contributo ambientale valorizzato.')).toBeTruthy();
    const quote = await trovaCard('Dotazione tra quota FEASR e non FEASR (RF003)');
    expect(within(quote).getByText(NON_DISPONIBILE_GRAFICO).textContent).toBe(
      'Grafico non disponibile: la ciambella richiede la quota FEASR e la quota non FEASR: quota FEASR non disponibile, quota non FEASR non disponibile.',
    );
    expect(within(quote).getByText('Fonte: TX-0003 · Perimetro ADA')).toBeTruthy();
    expect(screen.getByText('Area decentrata (ADA): solo le domande della propria area')).toBeTruthy();
    expect(screen.getByText(/^Colonne nascoste perché nessun intervento ha un valore \(fonte non attiva\): Dotazione spesa pubblica \(regionale\), .*Vincolo dotazione LEADER \(regionale\)\./)).toBeTruthy();
    const t = screen.getByRole('table', { name: /^Dotazione, impegni e pagamenti per intervento/ });
    expect(within(t).getAllByRole('columnheader').map((c) => c.textContent?.replace(/[▲▼↕]/g, ''))).toEqual(['Intervento', 'Contributo ambientale (regionale)']);
    expect(testo(within(t).getByRole('row', { name: /SRA01/ }).textContent)).toContain('non disponibile');
    expect(graficiVivi()).toHaveLength(0);
  });

  it('selezione senza interventi nel perimetro ADA: il vuoto nomina la propria area', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'ADA', righe: [] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'ADA' }),
    );
    conRouter(<DotazioneReport filtri={{ intervento: ['SRA01'] }} />);
    await waitFor(() => expect(screen.getAllByText(/Nessun dato nella tua area \(perimetro ADA\)/)).toHaveLength(2));
  });
});

describe('AvanzamentoReport: casi limite', () => {
  it('DTO senza importi: KPI "Non disponibile", nessuna ciambella, tabelle con le voci dichiarate', async () => {
    server.use(
      rispondi('/api/finanziario/stanziato', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/pagamenti-su-impegnato', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/residuo-impegni', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/residuo-pagamenti', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/spesa-per-intervento', F.SPESA),
    );
    renderConQuery(<AvanzamentoReport filtri={{}} />);
    const rf007 = await trovaCard('Dotazione residua sui pagamenti (RF007)');
    expect(within(rf007).getByText(/^Grafico non disponibile: manca una delle due parti/)).toBeTruthy();
    expect(valoreDi(within(rf007).getByRole('table'), 'Importo recuperato')).toBe('non disponibile');
    await waitFor(() => expect(valoreKpi('Importo pagato')).toBe('Non disponibile'));
    for (const kpi of ['Importo stanziato', 'Totale impegnato', 'Dotazione residua sui pagamenti']) expect(valoreKpi(kpi)).toBe('Non disponibile');
    expect(within(await trovaCard('Pagato sulla dotazione')).getByText(/^Grafico non disponibile: della dotazione pagato: valore non disponibile/)).toBeTruthy();
    expect(graficiVivi()).toHaveLength(0);
  });
});

describe('DomandeReport: casi limite', () => {
  it('liste vuote o assenti: stati vuoti (status) per anno e per importi, totale senza conteggi', async () => {
    server.use(
      rispondi('/api/finanziario/totale-domande', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/domande-per-anno', { perimetro: 'REGIONALE' }),
      rispondi('/api/finanziario/importi-per-anno', { perimetro: 'REGIONALE', righe: [] }),
    );
    renderConQuery(<DomandeReport filtri={{}} />);
    await waitFor(() => expect(screen.getAllByText('Nessuna domanda per i filtri scelti. Modifica i filtri.')).toHaveLength(2));
    screen.getAllByText('Nessuna domanda per i filtri scelti. Modifica i filtri.').forEach((v) => expect(ruolo(v)).toBe('status'));
    expect(screen.queryByRole('alert')).toBeNull();
    await waitFor(() => expect(valoreKpi('Domande presentate')).toBe('-'));
    expect(valoreKpi('di cui prima annualità')).toBe('-');
    expect(graficiVivi()).toHaveLength(0);
  });

  it('righe con campi assenti: nessun crash, grafici non disegnati con il motivo, valori dichiarati', async () => {
    server.use(
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/domande-per-anno', { righe: [{ annoRaccolta: 2025 }] }),
      rispondi('/api/finanziario/importi-per-anno', { righe: [{ annoRaccolta: null }] }),
    );
    renderConQuery(<DomandeReport filtri={{}} />);
    const t = await screen.findByRole('table', { name: 'Importi per anno di raccolta' });
    expect(within(t).getByRole('rowheader').textContent).toBe('senza campagna');
    expect(t.textContent).toContain('non disponibile');
    expect(within(await trovaCard('Importi per anno di raccolta (RF010)')).getByText('Grafico non disponibile: nessun importo valorizzato per anno di raccolta.')).toBeTruthy();
    expect(within(await trovaCard('Domande per anno di raccolta (RF008)')).getByText('Grafico non disponibile: nessun numero di domande valorizzato.')).toBeTruthy();
    const perAnno = screen.getAllByRole('table', { name: 'Domande per anno di raccolta' });
    expect(perAnno.every((x) => within(x).getByRole('rowheader').textContent === '2025')).toBe(true);
  });
});

describe('SigcReport: casi limite', () => {
  it('domande senza conteggi: non e uno stato vuoto, imbuto non disegnato con il motivo, importi mostrati', async () => {
    server.use(rispondi('/api/finanziario/sigc/domande', { perimetro: 'REGIONALE' }), rispondi('/api/finanziario/sigc/importi', F.SIGC_IMPORTI));
    renderConQuery(<SigcReport filtri={{}} />);
    const imbuto = await trovaCard('Domande SIGC (RF012)');
    expect(within(imbuto).getByText("Grafico non disponibile: domande presentate non disponibili: l'imbuto non si può disegnare.")).toBeTruthy();
    expect(valoreDi(screen.getByRole('table', { name: 'Domande SIGC' }), 'Presentate')).toBe('-');
    expect(valoreDi(await screen.findByRole('table', { name: 'Importi SIGC' }), 'Importo richiesto')).toBe('5.000.000,00 €');
    expect(screen.queryByText(VUOTO_SIGC)).toBeNull();
  });

  it('importi senza valori: "non disponibile" (mai zero) e cascata non disegnata', async () => {
    server.use(rispondi('/api/finanziario/sigc/domande', F.SIGC_DOMANDE), rispondi('/api/finanziario/sigc/importi', { perimetro: 'REGIONALE', pagato: { valore: null, motivo: 'NON_VALORIZZATO', fonte: null } }));
    renderConQuery(<SigcReport filtri={{}} />);
    const voci = await screen.findByRole('table', { name: 'Importi SIGC' });
    expect(valoreDi(voci, 'Importo richiesto')).toBe('non disponibile');
    expect(valoreDi(voci, 'Importo pagato (flusso ASR2-20)')).toBe('non calcolabilemanca per almeno un intervento della selezione: vedi il riepilogo per intervento');
    expect(valoreDi(voci, 'Domande senza importo richiesto')).toBe('-');
    expect(within(await trovaCard('Importi SIGC (RF013)')).getByText(/^Grafico non disponibile: la cascata richiede richiesto, ammesso e pagato/)).toBeTruthy();
  });
});

describe('RiservaReport: casi limite', () => {
  it('fase non iniziata, date assenti e nessun utilizzo: lo dice invece di mostrare tabelle vuote', async () => {
    server.use(rispondi('/api/finanziario/riserva/2027', { anno: 2027, fase: 'NON_INIZIATA', dataEstrazione: null, utilizzoProgressivo: [] }));
    renderConQuery(<RiservaReport anno={2027} onCambiaAnno={nessunaAzione} />);
    expect(await screen.findByText('Nessun utilizzo registrato.')).toBeTruthy();
    const voci = screen.getByRole('table', { name: "Riserva dell'anno 2027" }).textContent ?? '';
    expect(voci).toContain("non iniziata (l'accumulo parte il 1/10/2027)");
    expect(voci).toContain('non disponibile');
    expect(voci).toContain("non ancora congelato nell'istantanea: si congela al 30/6/2028");
    expect(screen.queryByText(/precedente all'inizio della fase attuale/)).toBeNull();
    expect(graficiVivi()).toHaveLength(0);
  });

  it('fase assente: "non disponibile", nessuna data inventata', async () => {
    server.use(rispondi('/api/finanziario/riserva/2026', { anno: 2026 }));
    renderConQuery(<RiservaReport anno={2026} onCambiaAnno={nessunaAzione} />);
    const t = await screen.findByRole('table', { name: "Riserva dell'anno 2026" });
    expect(valoreDi(t, 'Fase (calcolata al giorno della consultazione)')).toBe('non disponibile');
    expect(valoreDi(t, 'Data di estrazione')).toBe('non disponibile');
  });

  it('movimento senza data: il grafico lo dichiara fra le voci omesse', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', { ...F.RISERVA, utilizzoProgressivo: [...F.RISERVA.utilizzoProgressivo, { importo: 50, cumulato: 350 }] }));
    renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    const c = await trovaCard('Utilizzo progressivo cumulato della riserva');
    expect(within(c).getByText('1 movimento senza data')).toBeTruthy();
  });

  // regressione: un movimento senza data ha l'intestazione "senza data", come nella tabella del grafico
  it('movimento senza data: la tabella dell utilizzo non lascia la data vuota', async () => {
    server.use(rispondi('/api/finanziario/riserva/2025', { ...F.RISERVA, utilizzoProgressivo: [{ importo: 50, cumulato: 50 }] }));
    renderConQuery(<RiservaReport anno={2025} onCambiaAnno={nessunaAzione} />);
    const t = await screen.findByRole('table', { name: 'Utilizzo progressivo' });
    expect(within(t).getByRole('rowheader').textContent).not.toBe('');
  });
});

describe('VerificaSmpReport: casi limite', () => {
  it("nessuna riga per l'esercizio: stato vuoto informativo (status), nessun grafico", async () => {
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', { esercizio: 2023, righe: [] }));
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2023} onCambiaEsercizio={nessunaAzione} />);
    expect(ruolo(await screen.findByText(/Nessun dato SIGC per l'esercizio scelto/))).toBe('status');
    expect(graficiVivi()).toHaveLength(0);
  });

  it('valori facoltativi valorizzati e assenti nella stessa tabella; intervento senza importi omesso dal grafico', async () => {
    const riga = { ...F.VERIFICA_SMP.righe[0], azioniAttivate: 2, includeTopUp: true, indicatoreRisultato: 'R.1', outputErogatoEsercizio: 10 };
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', { righe: [riga, { codiceIntervento: 'SRA03' }] }));
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    const t = await screen.findByRole('table', { name: 'I dati ASR per intervento da confrontare con SMP' });
    expect(within(t).getAllByRole('rowheader').map((c) => c.textContent)).toEqual(['SRA01', 'SRA03']);
    expect(t.textContent).toContain('sì');
    expect(t.textContent).toContain('R.1');
    expect(t.textContent).toContain('non disponibile');
    const esercizio = screen.getByRole('table', { name: 'Esercizio' });
    expect(valoreDi(esercizio, 'Esercizio')).toBe('2025');
    expect(valoreDi(esercizio, 'Anno delle domande')).toBe('non disponibile');
    const c = await trovaCard('Previsione di pagamento e spesa erogata per intervento');
    expect(within(c).getByText('3 voci non nel grafico')).toBeTruthy();
    expect(within(c).getByText('SRA03: spesa erogata nella campagna precedente non disponibile')).toBeTruthy();
  });
});
