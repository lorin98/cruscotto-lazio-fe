// aggiornamento.ts — l'ultimo dato sincronizzato sta in shared/lib (condiviso con l'elenco operativo): qui si riesporta
// per i moduli del finanziario che lo importano dal proprio lib.
export { etichettaFlusso, menoRecente, testoUltimiDati } from '../../../shared/lib/aggiornamento';
export type { UltimoDato } from '../../../shared/lib/aggiornamento';
