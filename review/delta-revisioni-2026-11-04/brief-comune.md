# Review step9 FULL sul delta delle revisioni del 04/11/2026 (secondo feedback di Leonardo/Deloitte), passata 1

Stessa forma della review FULL sul delta del 01/11 (`review/revisioni-2026-10-31/review/brief-comune.md`): leggine le sezioni
"Riferimenti" e "Regole", che valgono anche qui salvo perimetro, cartella di output e scelte sotto. Intensita' FULL obbligatoria
(`review-intensity-fe.sh`: feature con authz e scoping). Assorbe la review della tessera del 02/11 (passata, residui corretti),
il cui step9 non era ancora stato registrato.

## Cosa e' cambiato (perimetro: `git diff 304dc1e HEAD`, a meno dei soli stati e report dei gate)
- Handover dal backend del giro XLSX (D-08 Rev. 4 di nfr-conformance): contratti delle cinque slice cambiati nelle sole
  `description`, manifest risigillati, refresh solo-spec (step2) delle cinque feature, client rigenerato.
- Wireframe (bozze approvate dall'utente il 04/11/2026, 14:36:02Z, 15:28:14Z e 18:56:08Z; indice `../../analisi-2026-11-04/
  wireframe-bozze/LEGGIMI.md` fuori dal repo): finanziario riepilogo, dotazione-avanzamento, panoramica, sigc; istituzionale
  verifica-smp-non-sigc, intervento; elenco-operativo domande, pagamenti, dettaglio-domanda. Commit 9f97329 (wireframe, step1,
  uiplan: route /finanziario/dotazione con TX-0011 e RF011 come azione hide-by-role per l'avviso, visibility invariata come
  per TX-0060; pin delle spec). Lint del plugin (`templates/wireframe-v2`) pass, salvo domande (br e small, deviazione gia'
  annotata il 02/11). L'avviso degli impegnati nel wireframe e' un `alert` con `role="note"` (vocabolario dei template,
  riapprovato alle 18:56:08Z); nel codice e' l'avviso di attenzione del kit (`alert alert-warning`, prima frase in grassetto).
- Commit del codice: f0e36d5 (kit), a8c42f8 (finanziario + route-table), 88eb799 (istituzionale), 68bfc12 (elenco operativo),
  f8bd564 (test); stati e report: 7d2f809 (handover), 5f4c8e4 (step2), 7daf654 (step3-7 e route-manifest), step8 dopo.
- Codice:
  - kit: `shared/lib/format.ts` (MIGLIAIA: separatore sempre, anche sotto 10.000), `shared/lib/grafici/primitive.ts`,
    `shared/lib/grafici/forme.ts` (asse dal minimo vero con un negativo, colore facoltativo delle serie raggruppate),
    `shared/ui/grafici/echarts.ts` (LabelLayout registrato), `shared/ui/tabella/Paginazione.tsx` ("<oggetto> per pagina");
  - finanziario: `lib/grafici/sigc.ts` (Importi SIGC: etichetta col fondo del segmento, `posizioneEtichettaSegmento`,
    `massimoConSpazio`), `lib/grafici/avanzamento.ts` (Sankey a un nodo Impegnato, stimato nel tooltip), `lib/grafici/spesa.ts`
    (serie dell'impegnato), `lib/impegnati.ts` + `ui/AvvisoImpegnati.tsx` (avviso degli impegnati diversi, TX-0011 col suo
    grant in Dotazione), `ui/RiepilogoReport.tsx` (tabella RF011 in testa con le colonne nell'ordine del requisito, quattro
    colonne nascoste all'apertura, grafico sotto, niente interruttore di pagina), `ui/ritornoAlRiepilogo.ts`,
    `ui/DotazioneReport.tsx`, `ui/AvanzamentoReport.tsx` (box Dotazione spesa pubblica), `lib/riserva.ts` (date gg/mm/aaaa),
    `lib/rettifiche.ts` ("Si': n rettifiche"), `lib/report.ts` (sottotitoli);
  - istituzionale: `ui/VerificaSmpNonSigc.tsx`, `ui/SchedeIntervento.tsx`, `ui/DettaglioIntervento.tsx` (anno obbligatorio,
    nessuna lettura senza anno), `lib/formato.ts`, `lib/verifica.ts`;
  - elenco operativo: `ui/ElencoPagamenti.tsx`, `ui/ElencoDomande.tsx`, `ui/TabelleScheda.tsx`, `ui/esportazioni.ts`,
    `ui/interrogazione.tsx`, `lib/criteri.ts`, `lib/formato.ts` (nessun "riga/righe" per i pagamenti, "Ordinati per");
  - test aggiornati e nuovi (`tests/revisioni-20261104.test.tsx`, fondo di `tests/finanziario-grafici.test.ts`).

## Scelte approvate dall'utente (04/11/2026), NON sono finding (segnala solo se il codice le tradisce)
- Impegnato: resta la regola del backend (tetto del cofinanziato FEASR alla dotazione per TUTTI gli interventi, D-27); il FE
  aggiunge la barra dell'impegnato di spesa pubblica e un avviso visibile con le quantita' dove i due impegnati differiscono
  (nei dati SRA03, SRA15, SRA30, SRB01; SRG06 no). Nessun cambio del backend.
- Limite dei download invariato (NFR-06: 5.000 righe e 50.000 celle).
- Riepilogo: tabella RF011 in testa, grafico sotto, senza interruttore; stimato, lordi, rettifiche e "Con rettifiche" nel
  selettore Colonne. Il link all'elenco dei pagamenti resta sulla cella dei lordi (scelta del 01/11) e nell'anteprima.
- Verifica SMP non SIGC (pagina e scheda dell'intervento): anno obbligatorio senza predefinito, come l'esercizio della SIGC; la
  card della Home resta sull'ultimo anno con un file (non ha selettore) e "Entra in Istituzionale" porta alla pagina, che chiede
  l'anno.
- Separatore delle migliaia sempre (supera la scelta "solo da 10.000" del brief del 01/11); asse del riepilogo dal minimo vero; "righe" tolto dai testi dei pagamenti dell'elenco
  operativo e dai link che ci portano; le didascalie generiche del kit ("N righe" di TabellaInterattiva) fuori perimetro.

## Punti da valutare
- Importi SIGC: la posizione dell'etichetta e' corretta anche ridimensionando, nel PNG (canvas) e con valori estremi (un
  segmento quasi nullo, il primo segmento stretto); contrasto delle etichette sul loro fondo; l'etichetta del massimo nascosta
  non nasconde una tacca utile.
- Avviso degli impegnati: in Dotazione legge TX-0011 solo col grant, nessun errore visibile se la lettura fallisce, nessuna
  lettura doppia col Riepilogo; testo esatto e accessibile (role=note), quantita' giuste.
- Riepilogo: totali, piede dell'Assistenza tecnica e colonne nascoste coerenti (indici delle celle), ritorno dal dettaglio
  senza la vista; anteprima con tutte le voci.
- Anno obbligatorio: nessuna lettura di TX-0016 senza anno (pagina e scheda), stato "Scegli l'anno", link e indirizzi coerenti,
  nessun effetto sulle altre schede e sulla card della Home.
- Separatore delle migliaia: nessuna regressione nei formati (ettari, percentuali, euro, campi di input dei filtri, CSV del FE).
- Elenco operativo: nessun "riga/righe" rimasto per i pagamenti nei testi visibili e nei nomi accessibili; concordanze.

Output: array JSON in `review/delta-revisioni-2026-11-04/<file della consegna>` con oggetti
`{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere.
