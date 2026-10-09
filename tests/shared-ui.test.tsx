import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { AvvisoPagina, VistaQuery } from '../src/shared/ui';
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

describe('AvvisoPagina: un solo avviso d errore per la pagina (A-07)', () => {
  const sezione = (nome: string, status: number, riprovate: string[]) => (
    <VistaQuery key={nome} stato={stato({ isError: true, error: erroreHttp(status), refetch: () => riprovate.push(nome) })}>
      {() => <p>dati</p>}
    </VistaQuery>
  );

  it('piu sezioni in errore: un solo role=alert con i messaggi distinti, testo statico nelle sezioni, Riprova rilegge tutte', async () => {
    const riprovate: string[] = [];
    const { container } = render(<AvvisoPagina>{[sezione('a', 503, riprovate), sezione('b', 503, riprovate), sezione('c', 404, riprovate)]}</AvvisoPagina>);
    const avviso = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    // due messaggi distinti (503 e 404) e il conteggio delle sezioni
    expect(avviso.querySelectorAll('p')).toHaveLength(3);
    expect(avviso.textContent).toContain('3 sezioni della pagina non si sono caricate.');
    expect(screen.getAllByText(/^Dati non caricati: l'avviso in cima alla pagina/)).toHaveLength(3);
    expect(within(avviso).getAllByRole('button')).toHaveLength(1);
    await userEvent.click(within(avviso).getByRole('button', { name: 'Riprova' }));
    expect([...riprovate].sort()).toEqual(['a', 'b', 'c']);
    await expectNoA11yViolations(container);
  });

  it('una sezione torna ai dati: l avviso si aggiorna; errore gestito dalla sezione (errorePersonalizzato) non entra', async () => {
    const riprovate: string[] = [];
    const { rerender } = render(<AvvisoPagina>{[sezione('a', 503, riprovate), sezione('b', 503, riprovate)]}</AvvisoPagina>);
    expect((await screen.findByRole('alert')).textContent).toContain('2 sezioni della pagina non si sono caricate.');
    rerender(
      <AvvisoPagina>
        {sezione('a', 503, riprovate)}
        <VistaQuery stato={stato({ data: [1] })}>{() => <p>dati b</p>}</VistaQuery>
        <VistaQuery stato={stato({ isError: true, error: erroreHttp(404) })} errorePersonalizzato={() => <p>anno senza dati</p>}>
          {() => <p>dati</p>}
        </VistaQuery>
      </AvvisoPagina>,
    );
    expect((await screen.findByRole('alert')).textContent).toContain('Una sezione della pagina non si è caricata.');
    expect(screen.getByText('dati b')).toBeTruthy();
    expect(screen.getByText('anno senza dati')).toBeTruthy();
    rerender(
      <AvvisoPagina>
        <VistaQuery stato={stato({ data: [1] })}>{() => <p>dati a</p>}</VistaQuery>
      </AvvisoPagina>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // M-02: l'avviso sparisce col pulsante che ha il focus; il focus resta nella pagina, non su BODY
  it('Riprova riuscito: l avviso sparisce e il focus va al contenuto della pagina', async () => {
    const riprovate: string[] = [];
    const { rerender } = render(<AvvisoPagina>{sezione('a', 503, riprovate)}</AvvisoPagina>);
    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Riprova' }));
    expect(document.activeElement?.textContent).toBe('Riprova');
    rerender(
      <AvvisoPagina>
        <VistaQuery stato={stato({ data: [1] })}>{() => <p>dati a</p>}</VistaQuery>
      </AvvisoPagina>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.textContent).toBe('dati a');
  });
});
