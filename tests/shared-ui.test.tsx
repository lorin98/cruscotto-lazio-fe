import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { VistaQuery } from '../src/shared/ui';
import type { StatoQuery } from '../src/shared/ui';
import { ValoreImporto } from '../src/entities/importo';
import { expectNoA11yViolations } from '../src/shared/testing/axe';

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
