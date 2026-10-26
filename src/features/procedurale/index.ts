// features/procedurale — public API (barrel): le pagine, la Home e il menu compongono solo da qui. Panoramica, stati delle
// domande di sostegno e di pagamento, domande ammesse, sottofasi di ammissibilita', Unit Amount, riepilogo per intervento
// (TX-0024..TX-0032) e il dettaglio procedurale dell'intervento che li compone, coi valori dei filtri della slice stessa.
export { Panoramica } from './ui/Panoramica';
export { StatiPagamento, StatiSostegno } from './ui/StatiDomande';
export { DomandeAmmesse } from './ui/DomandeAmmesse';
export { Sottofasi } from './ui/Sottofasi';
export { UnitAmount } from './ui/UnitAmount';
export { Riepilogo } from './ui/Riepilogo';
export { DettaglioIntervento } from './ui/DettaglioIntervento';
export { pagineVisibili, ricercaConservata } from './lib/pagine';
export { AnteprimaProcedurale } from './ui/AnteprimaProcedurale';
