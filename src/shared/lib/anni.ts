// anni.ts — anno di un parametro del contratto (PURO): anno della riserva del finanziario, esercizio della verifica SMP SIGC,
// campagna delle superfici del fisico, anno di riferimento della verifica SMP non SIGC. Le spec li descrivono allo stesso
// modo: intero fra 2000 e 2100. Poi gli anni proposti da un selettore d'anno (finanziario e istituzionale, review H7).

/** Anno ammesso da un parametro del contratto: intero 2000-2100 (descrizione dei parametri nelle spec). */
export function isAnnoValido(anno: number | null | undefined): anno is number {
  return typeof anno === 'number' && Number.isInteger(anno) && anno >= 2000 && anno <= 2100;
}

/**
 * Gli anni proposti da un selettore: quelli da `primo` a `ultimo` piu' ogni anno valido di `altri` (l'anno scelto
 * dall'indirizzo, quello della risposta) che non c'e' gia', in ordine crescente.
 */
export function anniProposti(primo: number, ultimo: number, ...altri: (number | null | undefined)[]): number[] {
  const anni = new Set<number>();
  for (let a = primo; a <= ultimo; a++) anni.add(a);
  for (const a of altri) if (isAnnoValido(a)) anni.add(a);
  return [...anni].sort((x, y) => x - y);
}
