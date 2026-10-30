// features/istituzionale — public API (barrel): le pagine, la Home e il menu compongono solo da qui. Verifica SMP non
// SIGC (TX-0016), verifica SMP SIGC (TX-0015, dal finanziario col riallineamento degli ambiti del 29/10/2026), dettaglio
// dell'intervento, coi valori dei filtri di TX-0060 dell'elenco operativo (decisione G2). L'output regionale (TX-0017) e'
// del fisico.
export { VerificaSmpNonSigc } from './ui/VerificaSmpNonSigc';
export { VerificaSmpSigc } from './ui/VerificaSmpSigc';
export { DettaglioIntervento } from './ui/DettaglioIntervento';
export { pagineVisibili, ricercaConservata } from './lib/pagine';
export { AnteprimaIstituzionale } from './ui/AnteprimaIstituzionale';
