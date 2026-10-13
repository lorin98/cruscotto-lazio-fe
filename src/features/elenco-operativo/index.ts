// features/elenco-operativo — public API (barrel): le pagine, la Home e il menu compongono solo da qui.
export { ElencoDomande } from './ui/ElencoDomande';
export { ElencoPagamenti } from './ui/ElencoPagamenti';
export { SchedaDomanda } from './ui/SchedaDomanda';
export { PERCORSO_DOMANDE, PERCORSO_PAGAMENTI } from './lib/collegamenti';
export { GRANT as GRANT_ELENCO_OPERATIVO, puoLeggere as puoLeggereElencoOperativo } from './lib/grant';
export { pagineVisibili } from './lib/pagine';
export type { PaginaElenco } from './lib/pagine';
