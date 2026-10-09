// card-grafico.ts — lettura delle CardGrafico nei test (UI v2, ADR 0027): la card e' una regione col nome del titolo, il
// grafico finto montato dentro registra le opzioni, la tabella equivalente si apre col bottone "Tabella" (o e' gia'
// visibile quando il grafico non e' disegnabile).
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { graficiVivi } from './grafico-finto';
import type { GraficoFinto } from './grafico-finto';

/**
 * La CardGrafico col titolo dato (attende che compaia): la regione con l'attributo data-card-grafico. Una Sezione con
 * lo stesso nome (es. quella di ConGrant mentre si carica il profilo) non conta.
 */
export function trovaCard(titolo: string | RegExp): Promise<HTMLElement> {
  return waitFor(() => {
    const card = screen.getAllByRole('region', { name: titolo }).find((r) => r.hasAttribute('data-card-grafico'));
    if (!card) throw new Error(`nessuna card con grafico per ${String(titolo)}`);
    return card;
  });
}

/** Il grafico finto montato nella card, o undefined se la card non ha grafico (non disegnabile). */
export function graficoDi(card: HTMLElement): GraficoFinto | undefined {
  return graficiVivi().find((g) => card.contains(g.el));
}

/** Le ultime opzioni ricevute dal grafico, in una forma ridotta per le asserzioni. */
export function opzioniDi(g: GraficoFinto | undefined): { aria?: { label?: { description?: string } }; series?: unknown[] } | undefined {
  return g?.opzioni.at(-1) as { aria?: { label?: { description?: string } }; series?: unknown[] } | undefined;
}

/** Descrizione accessibile del grafico (aria.label.description delle opzioni): e' quella che ECharts mette sull'SVG. */
export function descrizioneDi(card: HTMLElement): string | undefined {
  return opzioniDi(graficoDi(card))?.aria?.label?.description;
}

/** La tabella equivalente della card: se c'e' il grafico passa alla vista Tabella. */
export async function tabellaDi(card: HTMLElement): Promise<HTMLElement> {
  const bottone = within(card).queryByRole('button', { name: 'Tabella' });
  if (bottone && bottone.getAttribute('aria-pressed') !== 'true') await userEvent.click(bottone);
  return within(card).getByRole('table');
}
