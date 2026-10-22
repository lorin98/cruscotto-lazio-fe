// entities/importo — public API (barrel): resa degli importi dei report e degli altri dati col motivo dell'assenza.
export { descriviAssenza, descriviImporto, etichettaFonte, testoConNota } from './lib/importo';
export type { DatoMotivatoLike, ImportoLike, ImportoResa } from './lib/importo';
export { ValoreImporto } from './ui/ValoreImporto';
export { AssenzaMotivata, BadgeAssenza, ValoreMotivato } from './ui/ValoreMotivato';
