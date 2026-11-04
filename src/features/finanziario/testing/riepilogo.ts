// riepilogo.ts — supporto dei test del riepilogo per intervento (solo test). Dal 04/11/2026 la tabella di RF011 sta in testa
// alla pagina, senza interruttore Grafico | Tabella (secondo feedback di Leonardo/Deloitte): i test la cercano e basta.
import { screen } from '@testing-library/react';

export const NOME_TABELLA_RIEPILOGO = /^Tabella di riepilogo per intervento \(RF011\)/;

/** La tabella del riepilogo col nome dato. */
export async function tabellaDelRiepilogo(nome: RegExp | string = NOME_TABELLA_RIEPILOGO): Promise<HTMLElement> {
  return screen.findByRole('table', { name: nome });
}
