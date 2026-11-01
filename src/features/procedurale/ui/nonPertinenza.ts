// nonPertinenza.ts — i motivi delle card del procedurale col filtro SIGC (revisioni del 31/10/2026, F3; natura delle card
// scelta dall'utente il 01/11/2026): l'area e' di fatto NO SIGC, quindi col filtro SIGC stati, sottofasi e domande ammesse
// sono non pertinenti (lette senza filtro); lo stato area programmazione e il riepilogo per intervento sono misti e si
// ricalcolano. Testi dei wireframe approvati.
export const MOTIVI_NO_SIGC = {
  statiSostegno: 'Riguarda solo le domande di sostegno, che sono NO SIGC',
  statiPagamento: 'Riguarda solo le domande di pagamento NO SIGC (CSR-DP)',
  ammesse: 'Riguarda solo le domande ammesse in determina, che sono NO SIGC',
  sottofasi: 'Riguarda solo le domande NO SIGC',
} as const;
