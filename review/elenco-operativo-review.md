# Review step9 FULL — feature elenco-operativo (v1)

## PASS all'iterazione 3 (13/10/2026), score 89

- Iterazione 1 (b74b7a2): FAIL, 1 C (path traversal lato client nella scheda), 7 M, 29 m, 1 c, score 0 (v1-iter1). Decisioni
  dell'utente: bottone Colonne, campi della scheda a scelta, ordinamento dichiarato e vista conservata, ritorno al link dopo il
  login col parametro del BFF (backend foundation-auth, D-11 Rev. 9-10), barra Senza stato cliccabile.
- Iterazione 2 (bb877d4): FAIL, 0 C, 1 M (importi col punto delle migliaia), 14 m, 9 c, score 34 (v1-iter2). Decisioni:
  ritorno alla lista di provenienza, colonne conservate al ritorno, clic del grafico per stato disattivato con le chiavi dei
  report, wireframe allineati al costruito e riapprovati.
- Iterazione 3 (b12ce9a): PASS, 0 C, 0 M, 3 m, 2 c, score 89 (v1-iter3). Residui da correggere dopo il verdetto:
  - **V-01** (MINORE) Vista e colonne lette dalla history solo al montaggio: dopo un link alla stessa pagina (briciola 'Elenco operativo', menu 'Domande' o 'Pagamenti') o un Indietro fra due voci della stessa route, schermo e history divergono e la scheda riporta a una vista diversa da quella mostrata — `src/features/elenco-operativo/ui/interrogazione.tsx:31`.
  - **V-02** (MINORE) Un clic sulla vista gia' scelta azzera le colonne scelte — `src/features/elenco-operativo/ui/ElencoDomande.tsx:189`.
  - **V-03** (MINORE) Il ritorno all'elenco dei pagamenti con le colonne scelte (decisioni V-01 e V-03 dell'iterazione 2) non ha un test di pagina — `src/pages/elenco-operativo/scheda-domanda.test.tsx:191`.
  - **H-02** (COSMETICO) La feature ricostruisce a mano l'involucro dello state del hook del kit ({ firma, valore }), che il kit non esporta — `src/features/elenco-operativo/lib/collegamenti.ts:87`.
  - **A-02** (COSMETICO) 'Filtro aggiunto' annunciato di nuovo per un valore gia' nel filtro, sul comando che dopo il fix di X-03 conserva il focus — `src/features/elenco-operativo/ui/ElencoDomande.tsx:96`.
