// entities/importo — public API (barrel): resa degli importi dei report e degli altri dati col motivo dell'assenza.
export { NON_DISPONIBILE_BREVE, assenzaInFrase, descriviAssenza, descriviImporto, etichettaFonte, resaAssenza, testoConNota, testoMotivato, totaleMotivato } from './lib/importo';
export type { DatoMotivatoLike, ImportoLike, ImportoResa, TotaleMotivato } from './lib/importo';
export { ValoreImporto } from './ui/ValoreImporto';
export { AssenzaMotivata, BadgeAssenza, ValoreMotivato } from './ui/ValoreMotivato';
