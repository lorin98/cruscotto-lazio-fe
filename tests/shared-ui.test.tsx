import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { GraficoBarre, GraficoCiambella, GraficoLinea, VistaQuery } from '../src/shared/ui';
import type { StatoQuery } from '../src/shared/ui';
import { ValoreImporto } from '../src/entities/importo';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

const euro = (n: number) => `${n} €`;

function erroreHttp(status: number, data?: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('richiesta fallita', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

function stato<T>(parziale: Partial<StatoQuery<T>>): StatoQuery<T> {
  return { data: undefined, isPending: false, isError: false, fetchStatus: 'idle', error: null, refetch: () => {}, ...parziale };
}

describe('VistaQuery: rami distinti', () => {
  it('caricamento, errore, vuoto (status, non alert), dati', () => {
    const { rerender } = render(<VistaQuery stato={stato({ isPending: true, fetchStatus: 'fetching' })}>{() => <p>dati</p>}</VistaQuery>);
    expect(screen.getByRole('status').textContent).toContain('Caricamento');
    rerender(<VistaQuery stato={stato({ isError: true, error: erroreHttp(404) })}>{() => <p>dati</p>}</VistaQuery>);
    expect(screen.getByRole('alert').textContent).toContain('Dati non trovati');
    rerender(<VistaQuery stato={stato<number[]>({ data: [] })} eVuoto={(d) => d.length === 0} vuoto="Niente">{() => <p>dati</p>}</VistaQuery>);
    expect(screen.getByRole('status').textContent).toContain('Niente');
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<VistaQuery stato={stato<number[]>({ data: [1] })} eVuoto={(d) => d.length === 0}>{(d) => <p>dati {d.length}</p>}</VistaQuery>);
    expect(screen.getByText('dati 1')).toBeTruthy();
  });
  it('errore personalizzato (es. 404 come vuoto)', () => {
    render(
      <VistaQuery stato={stato({ isError: true, error: erroreHttp(404) })} errorePersonalizzato={() => <p>anno senza dati</p>}>
        {() => <p>dati</p>}
      </VistaQuery>,
    );
    expect(screen.getByText('anno senza dati')).toBeTruthy();
  });
  it('un aggiornamento fallito non cancella i dati gia mostrati: avviso con Riprova', async () => {
    let riprovato = false;
    render(
      <VistaQuery stato={stato<number[]>({ data: [7], isError: true, error: erroreHttp(503), refetch: () => (riprovato = true) })}>
        {(d) => <p>dati {d[0]}</p>}
      </VistaQuery>,
    );
    expect(screen.getByText('dati 7')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/Dati non aggiornati/);
    await userEvent.click(screen.getByRole('button', { name: 'Riprova' }));
    expect(riprovato).toBe(true);
  });
  it('senza connessione: attesa dichiarata; query disabilitata: niente', () => {
    const { rerender, container } = render(<VistaQuery stato={stato({ isPending: true, fetchStatus: 'paused' })}>{() => <p>dati</p>}</VistaQuery>);
    expect(screen.getByRole('status').textContent).toMatch(/In attesa della connessione/);
    rerender(<VistaQuery stato={stato({ isPending: true, fetchStatus: 'idle' })}>{() => <p>dati</p>}</VistaQuery>);
    expect(container.textContent).toBe('');
  });
});

describe('grafici SVG accessibili', () => {
  it('barre: nome, descrizione con i mancanti, legenda', async () => {
    const { container } = render(<GraficoBarre titolo="Spesa" categorie={['A', 'B']} serie={[{ nome: 'Dotazione', valori: [10, null] }]} formatta={euro} />);
    expect(screen.getByRole('img', { name: /Spesa.*1 valori non disponibili/ })).toBeTruthy();
    expect(screen.getByText('Dotazione')).toBeTruthy();
    await expectNoA11yViolations(container);
  });
  it('barre: i negativi non si disegnano e la descrizione lo dice', () => {
    const { container } = render(<GraficoBarre titolo="Residui" categorie={['A', 'B']} serie={[{ nome: 'Residuo', valori: [10, -5] }]} formatta={euro} />);
    expect(screen.getByRole('img', { name: /1 valori negativi/ })).toBeTruthy();
    expect(container.querySelectorAll('rect[fill]').length).toBe(2); // una barra + il quadrato della legenda
  });
  it('barre impilate: parti di un totale per riga, totale in coda', async () => {
    const { container } = render(
      <GraficoBarre titolo="Domande" impilato categorie={['2024']} serie={[{ nome: 'Prima', valori: [30] }, { nome: 'Altre', valori: [20] }]} formatta={euro} />,
    );
    expect(screen.getByRole('img', { name: /Barre impilate per 1 voci/ })).toBeTruthy();
    expect(container.textContent).toContain('50 €');
    await expectNoA11yViolations(container);
  });
  it('barre senza valori: testo al posto del grafico', () => {
    render(<GraficoBarre titolo="Spesa" categorie={['A']} serie={[{ nome: 'X', valori: [null] }]} formatta={euro} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/grafico non disponibile/)).toBeTruthy();
  });
  it('ciambella: percentuali in legenda e descrizione', async () => {
    const { container } = render(<GraficoCiambella titolo="Quote" voci={[{ etichetta: 'FEASR', valore: 25 }, { etichetta: 'Altro', valore: 75 }]} formatta={euro} />);
    expect(screen.getByRole('img', { name: /FEASR 25%, Altro 75%/ })).toBeTruthy();
    await expectNoA11yViolations(container);
  });
  it('ciambella con una parte assente o negativa: nessuna proporzione inventata', () => {
    const { rerender } = render(<GraficoCiambella titolo="Impegnato" voci={[{ etichetta: 'Pagato', valore: 500 }, { etichetta: 'Da pagare', valore: null }]} formatta={euro} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/Impegnato: grafico non disponibile, Da pagare: dato non disponibile/)).toBeTruthy();
    expect(screen.queryByText(/100%/)).toBeNull();
    rerender(<GraficoCiambella titolo="Residuo" voci={[{ etichetta: 'Pagato', valore: 500 }, { etichetta: 'Residuo', valore: -20 }]} formatta={euro} />);
    expect(screen.getByText(/Residuo: valore negativo/)).toBeTruthy();
  });
  it('linea: punti e ultimo valore; i punti senza valore sono omessi e dichiarati', async () => {
    const { container, rerender } = render(<GraficoLinea titolo="Utilizzo" punti={[{ etichetta: 'gen', valore: 1 }, { etichetta: 'feb', valore: 3 }]} formatta={euro} />);
    expect(screen.getByRole('img', { name: /2 punti dal gen al feb, ultimo valore 3 €/ })).toBeTruthy();
    await expectNoA11yViolations(container);
    rerender(<GraficoLinea titolo="Utilizzo" punti={[{ etichetta: 'gen', valore: 1 }, { etichetta: 'feb', valore: null }]} formatta={euro} />);
    expect(screen.getByRole('img', { name: /1 punti dal gen al gen.*1 valori non disponibili/ })).toBeTruthy();
    rerender(<GraficoLinea titolo="Utilizzo" punti={[{ etichetta: 'gen', valore: null }]} formatta={euro} />);
    expect(screen.getByText(/grafico non disponibile/)).toBeTruthy();
  });
});

describe('ValoreImporto', () => {
  it('valore, assenza con motivo, a11y', async () => {
    const { container, rerender } = render(<ValoreImporto importo={{ valore: 15000 }} />);
    expect(container.textContent?.replace(/\s/g, ' ')).toBe('15.000,00 €');
    rerender(<ValoreImporto importo={{ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte: 'IMPEGNI' }} />);
    expect(screen.getByText('non disponibile')).toBeTruthy();
    expect(screen.getByText('fonte impegni non attiva')).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
