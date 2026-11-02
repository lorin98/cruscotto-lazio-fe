# Review step9 FULL sul delta della tessera "Pagate / da pagare / senza importi" (02/11/2026, passata 1)

Stessa forma della review FULL sul delta del 01/11 (`review/revisioni-2026-10-31/review/brief-comune.md`): leggine le sezioni
"Riferimenti" e "Regole", che valgono anche qui salvo perimetro, cartella di output e scelte sotto. Intensita' FULL obbligatoria
(`review-intensity-fe.sh`: feature con authz e scoping).

## Cosa e' cambiato (perimetro: `git diff 503d8b5 5dfbdaa`)
Richiesta dell'utente del 02/11/2026: nell'elenco operativo delle domande la tessera "Pagate / da pagare / senza importi" usciva
dal box con numeri grandi ("36.846 / 31.595 / 3191" su una riga). Ora i tre numeri vanno uno per riga con la loro voce.
- 3938afe: wireframe `wireframes/elenco-operativo/domande/` (tessera su tre righe, nota nel .md), approvazione registrata
  (stato, uiplan dell'elenco operativo), step2 rifatto.
- a5a03ec: kit comune `src/shared/ui/kpi/Kpi.tsx` (prop facoltativa `righe` resa come elenco da `RigheKpi`, scelta in `CorpoKpi`;
  l'assenza col motivo prevale), stile `.ui-kpi__righe` in `src/shared/ui/tema.css`, `SinotticoDomande.tsx` dell'elenco
  operativo, test `src/pages/elenco-operativo/domande/page.test.tsx` (numeri grandi, axe).
- 106850e, a33ade5, 5dfbdaa: stati e report del gate (step3-7 dell'elenco operativo; step8 11/11 sulle cinque feature, perche'
  il kit e' comune; 1744 test, axe 0 su 140 run).

## Scelte approvate dall'utente (02/11/2026, 14:12:46Z), NON sono finding (segnala solo se il codice le tradisce)
- Wireframe del flusso domande: i tre numeri su tre righe, ciascuno con la sua voce ("36.846 pagate", "31.595 da pagare",
  "3.191 senza importi"), etichetta della tessera invariata.
- Il separatore delle migliaia sotto 10.000 (it-IT scrive 3191) NON fa parte di questa modifica: e' il comportamento di
  `formatNumber` in tutto il FE, segnalato all'utente a parte. Non e' un finding di questo delta.

## Punti da valutare
- Resa e accessibilita' della tessera: elenco leggibile dal lettore di schermo (nome della regione, voci), contrasto, nessun
  overflow anche con numeri a 6-7 cifre e nelle larghezze del sinottico (container query `cqi`), tessera non pertinente (F3).
- Kit: la prop nuova non cambia la resa delle altre tessere (valore, valore pieno, unita', assente, quota, azione) in nessuna
  feature; complessita' e coesione del componente.
- Test: provano davvero le tre righe e l'assenza della riga unica; nessuna regressione negli altri test della pagina.

Output: array JSON in `review/delta-tessera-2026-11-02/<file della consegna>` con oggetti
`{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere.
