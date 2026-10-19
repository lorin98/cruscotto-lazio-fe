// riepilogo.ts — supporto dei test del riepilogo per intervento (solo test). Dal 19/10/2026 il riepilogo parte dalla vista
// Grafico, come ogni card (richiesta dell'utente): i test della tabella la scelgono prima di cercarla.
import { fireEvent, screen, within } from '@testing-library/react';

export const NOME_TABELLA_RIEPILOGO = /^Riepilogo per intervento \(RF011\)/;

/** Sceglie la vista Tabella del riepilogo (se non lo e' gia') e restituisce la tabella col nome dato. */
export async function tabellaDelRiepilogo(nome: RegExp | string = NOME_TABELLA_RIEPILOGO): Promise<HTMLElement> {
  const gruppo = await screen.findByRole('group', { name: 'Vista del riepilogo' });
  const bottone = within(gruppo).getByRole('button', { name: 'Tabella' });
  if (bottone.getAttribute('aria-pressed') !== 'true') {
    fireEvent.click(bottone);
  }
  return screen.findByRole('table', { name: nome });
}
