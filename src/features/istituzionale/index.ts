// features/istituzionale — public API (barrel): le pagine, la Home e il menu compongono solo da qui. Verifica SMP non
// SIGC (TX-0016), output regionale programmato e realizzato (TX-0017), dettaglio dell'intervento che li compone, coi
// valori dei filtri di TX-0060 dell'elenco operativo (decisione G2).
export { VerificaSmpNonSigc } from './ui/VerificaSmpNonSigc';
export { OutputRegionale } from './ui/OutputRegionale';
export { DettaglioIntervento } from './ui/DettaglioIntervento';
export { pagineVisibili, ricercaConservata } from './lib/pagine';
