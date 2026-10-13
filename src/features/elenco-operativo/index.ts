// features/elenco-operativo — public API (barrel): le pagine, la Home e il menu compongono solo da qui. Percorsi e grant
// delle pagine sono del contratto dell'indirizzo in entities/domanda (review v1 H-09): qui non si riesportano.
export { ElencoDomande } from './ui/ElencoDomande';
export { ElencoPagamenti } from './ui/ElencoPagamenti';
export { SchedaDomanda } from './ui/SchedaDomanda';
export { pagineVisibili } from './lib/pagine';
