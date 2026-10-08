import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '../src/shared/api/mock/server';
import { rispondi } from '../src/shared/testing/msw';
import { renderConQuery } from '../src/shared/testing/render';
import { DomandeReport, DotazioneReport, FiltriForm, RiservaReport, VerificaSmpReport } from '../src/features/finanziario';
import * as F from '../src/shared/testing/fixture-finanziario';

// Casi limite dei DTO: liste vuote, campi assenti o null (tutti opzionali nella spec), legame azioni attivo.
const nessunaAzione = () => {};
const ruolo = (el: HTMLElement) => el.closest('[role]')?.getAttribute('role');

describe('FiltriForm: casi limite', () => {
  it('con il legame delle azioni portanti il filtro e attivo e si puo scegliere', async () => {
    server.use(rispondi('/api/finanziario/filtri', { ...F.FILTRI, legameAzioniDisponibile: true }));
    renderConQuery(<FiltriForm valori={{ azione: ['1'] }} onApplica={nessunaAzione} onAzzera={nessunaAzione} />);
    const azione = (await screen.findByLabelText('Azione portante')) as HTMLSelectElement;
    expect(azione.disabled).toBe(false);
    expect(Array.from(azione.selectedOptions, (o) => o.value)).toEqual(['1']);
    expect(screen.queryByText(/non viene applicato/)).toBeNull();
  });
  it('senza interventi in programmazione: stato vuoto informativo (status)', async () => {
    server.use(rispondi('/api/finanziario/filtri', { legameAzioniDisponibile: false }));
    renderConQuery(<FiltriForm valori={{}} onApplica={nessunaAzione} onAzzera={nessunaAzione} />);
    expect(ruolo(await screen.findByText('Nessun intervento in programmazione: i filtri non sono disponibili.'))).toBe('status');
  });
  it('voci senza chiave scartate, voci senza descrizione mostrano il codice', async () => {
    server.use(rispondi('/api/finanziario/filtri', { interventi: [{ chiave: 'SRA01' }, { descrizione: 'senza chiave' }], obiettiviSpecifici: [{ chiave: 'SO4', descrizione: null }] }));
    renderConQuery(<FiltriForm valori={{}} onApplica={nessunaAzione} onAzzera={nessunaAzione} />);
    expect(within(await screen.findByLabelText('Intervento')).getAllByRole('option').map((o) => o.textContent)).toEqual(['SRA01']);
    expect(within(screen.getByLabelText('Obiettivo specifico (OS)')).getByRole('option').textContent).toBe('SO4');
  });
});

describe('DotazioneReport: casi limite', () => {
  it('righe senza importi e distribuzione senza valori: nessun grafico inventato, perimetro ADA dichiarato', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'ADA', righe: [{ codiceIntervento: 'SRA01' }] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'ADA' }),
    );
    renderConQuery(<DotazioneReport filtri={{}} />);
    expect(await screen.findByText(/Impegnato e pagamenti della tua area per intervento: grafico non disponibile/)).toBeTruthy();
    expect(await screen.findByText(/Ripartizione della dotazione di spesa pubblica: grafico non disponibile/)).toBeTruthy();
    expect(screen.getAllByText(/solo le domande della propria area/).length).toBeGreaterThan(0);
  });
  it('selezione senza interventi nel perimetro ADA: il vuoto nomina la propria area', async () => {
    server.use(
      rispondi('/api/finanziario/spesa-per-intervento', { perimetro: 'ADA', righe: [] }),
      rispondi('/api/finanziario/distribuzione-dotazione', { perimetro: 'ADA' }),
    );
    renderConQuery(<DotazioneReport filtri={{ intervento: ['SRA01'] }} />);
    await waitFor(() => expect(screen.getAllByText(/Nessun dato nella tua area \(perimetro ADA\)/)).toHaveLength(2));
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
    expect(screen.getByRole('table', { name: 'Domande presentate (di sostegno o SIGC)' }).textContent).toContain('-');
  });
  it('riga con campi assenti: nessun crash, valori dichiarati', async () => {
    server.use(
      rispondi('/api/finanziario/totale-domande', F.TOTALE_DOMANDE),
      rispondi('/api/finanziario/domande-per-anno', { righe: [{ annoRaccolta: 2025 }] }),
      rispondi('/api/finanziario/importi-per-anno', { righe: [{ annoRaccolta: null }] }),
    );
    renderConQuery(<DomandeReport filtri={{}} />);
    const t = await screen.findByRole('table', { name: 'Importi per anno di raccolta' });
    expect(within(t).getByRole('rowheader').textContent).toBe('senza campagna');
    expect(t.textContent).toContain('non disponibile');
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
  });
  it('fase assente: "non disponibile", nessuna data inventata', async () => {
    server.use(rispondi('/api/finanziario/riserva/2026', { anno: 2026 }));
    renderConQuery(<RiservaReport anno={2026} onCambiaAnno={nessunaAzione} />);
    const t = await screen.findByRole('table', { name: "Riserva dell'anno 2026" });
    expect(within(t).getByRole('rowheader', { name: 'Fase (calcolata al giorno della consultazione)' }).nextElementSibling?.textContent).toBe('non disponibile');
  });
});

describe('VerificaSmpReport: casi limite', () => {
  it('nessuna riga per l esercizio: stato vuoto informativo (status)', async () => {
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', { esercizio: 2023, righe: [] }));
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2023} onCambiaEsercizio={nessunaAzione} />);
    expect(ruolo(await screen.findByText(/Nessun dato SIGC per l'esercizio scelto/))).toBe('status');
  });
  it('valori facoltativi valorizzati e assenti nella stessa tabella', async () => {
    const riga = { ...F.VERIFICA_SMP.righe[0], azioniAttivate: 2, includeTopUp: true, indicatoreRisultato: 'R.1', outputErogatoEsercizio: 10 };
    server.use(rispondi('/api/finanziario/sigc/verifica-smp', { righe: [riga, { codiceIntervento: 'SRA03' }] }));
    renderConQuery(<VerificaSmpReport filtri={{}} esercizio={2025} onCambiaEsercizio={nessunaAzione} />);
    const t = await screen.findByRole('table', { name: /dati ASR per intervento/ });
    expect(t.textContent).toContain('sì');
    expect(t.textContent).toContain('R.1');
    expect(t.textContent).toContain('non disponibile');
    const esercizio = screen.getByRole('table', { name: 'Esercizio' });
    expect(within(esercizio).getByRole('rowheader', { name: 'Anno delle domande' }).nextElementSibling?.textContent).toBe('non disponibile');
  });
});
