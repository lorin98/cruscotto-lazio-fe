// features/fisico — public API (barrel): le pagine, la Home e il menu compongono solo da qui. Superfici ammissibili
// (TX-0018), output regionale programmato e realizzato (TX-0017, dall'istituzionale) e pagamenti per Unit Amount (TX-0030,
// dal procedurale) col riallineamento degli ambiti del 29/10/2026, coi valori dei filtri di TX-0060; le determine di una
// domanda (TX-0020) sono del procedurale. Dal 30/10/2026 il dettaglio dell'intervento (/fisico/interventi/:codice), che
// compone le tre letture filtrate sull'intervento.
export { SuperficiAmmissibili } from './ui/SuperficiAmmissibili';
export { OutputRegionale } from './ui/OutputRegionale';
export { UnitAmount } from './ui/UnitAmount';
export { DettaglioIntervento } from './ui/DettaglioIntervento';
export { pagineVisibili } from './lib/pagine';
export { AnteprimaFisico } from './ui/AnteprimaFisico';
