// anni.ts — anno di un parametro del contratto (PURO): anno della riserva e esercizio della verifica SMP del finanziario,
// campagna delle superfici del fisico. Le spec li descrivono allo stesso modo: intero fra 2000 e 2100.

/** Anno ammesso da un parametro del contratto: intero 2000-2100 (descrizione dei parametri nelle spec). */
export function isAnnoValido(anno: number | null | undefined): anno is number {
  return typeof anno === 'number' && Number.isInteger(anno) && anno >= 2000 && anno <= 2100;
}
