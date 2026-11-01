# Judge, passata 2 — review step9 FULL sul delta delle revisioni del finanziario (01/11/2026)

Pool: 46 finding (V1 8, V2 5, H 13, A 6, antagonista 14). Gate non declassabili (check-ui-authz, fe-project-check --built):
PASS per le cinque feature (lente A). Chiusi davvero dalla passata 1: J-01, J-02, J-03, J-04, J-06, J-10, J-11, J-12 e la
maggior parte dei MINORE. Dopo la deduplica: 2 MAGGIORE, 22 MINORE e 6 COSMETICO accettati, nessuno contestato. Verdetto:
**FAIL** per tutte le feature (MAGGIORE presenti). Correzioni nella sessione principale, poi passata 3 (ultima del budget).

## MAGGIORE accettati

| id | feature | finding (origine) | decisione |
|---|---|---|---|
| K-01 | comune (finanziario, procedurale, istituzionale, fisico, elenco) | la soglia 40 delle barre verticali (scelta d) va contro i wireframe approvati ("zoom oltre 12") e a 390 px le etichette inclinate si sovrappongono (V1-01, X-09) | la correzione giusta di J-09 e' il solo grafico "Dotazione e pagamenti per intervento" in barre orizzontali (altezza a gradini, zoom oltre 40 come gli altri grafici orizzontali); MAX_BARRE_VISIBILI torna 12 |
| K-02 | istituzionale | J-05 chiuso a meta': il link della spesa apre tutte le righe PAGATA ma il nome dice "non SIGC"; l'URL diverge dal wireframe approvato (sigc=false) (A-01, X-01, V2-04, H-05) | si torna all'URL approvato (esito=PAGATA&sigc=false&intervento), reso solo per gli interventi classificati NO SIGC: per gli altri l'elenco con sigc=false e' vuoto e la regola approvata vieta i link verso un elenco vuoto; senza la classificazione (niente valori dei filtri) nessun link (fail-closed). Per un intervento NO SIGC le righe con sigc=false sono tutte le sue righe PAGATA: il nome "righe pagate non SIGC" torna vero. Nessuno scostamento dal wireframe: non serve una decisione dell'utente |

## MINORE e COSMETICO accettati

Comuni:
- X-10 non chiuso: vuoto ed errore delle letture non pertinenti senza motivo dove `<NonPertinente>` non avvolge VistaQuery (V2-01, H-01, A-04, X-03).
- Scelta a, residui: link ancora con href (clic centrale, menu contestuale), campi nativi usabili coi lettori di schermo, mousedown fermato che impedisce la selezione, MutationObserver senza attributi, regioni scorrevoli e paginazione disattivate, regione della tabella dei dati con aria-disabled (V2-02, H-02, H-03, A-02, X-05: un solo finding).
- Voci omesse in un `<details>` che non si apre (X-04).
- Strumenti della tabella (ricerca, colonne, Scarica) e interruttore delle superfici visibili ma disattivati nel corpo non pertinente, contro il wireframe che li vuole assenti (V2-03).
- Sottotitoli "Clic su una barra" nelle card non pertinenti (H-08, A-06).
- Card della Home di procedurale e istituzionale senza il valore pieno (V2-05, H-09).
- Prima colonna ferma senza scroll-padding orizzontale (A-05).
- Test del kit che prova Invio dove jsdom non attiva il bottone; controlli montati dopo non provati (A-03; X-13 COSMETICO).
- Mock MSW di fisico, procedurale e istituzionale che ignorano sigc; TX-0015 con interventi NO SIGC (X-11).
- COSMETICO: codice morto e motivi in ui/ (H-10); ricercaConSigc che cancella `pagina` e tipo riscritto a mano nell'elenco (H-11); voce dell'area col SIGC scritta in tre forme (H-12); soglia "oltre 6 colonne" ricopiata (H-13).

Finanziario:
- V1-09 chiuso a meta': la soglia che ripiega sull'accumulato si chiama "Riserva del 5%" (V1-02, H-04, X-06).
- Nota del residuo sbagliata: per il backend (CalcoloRiserva) il residuo disponibile e' il 2% del montante oppure zero, non "quanto resta dopo l'utilizzo" (X-07).
- uiplan e LINK_ELENCO dichiarano ancora sigc nei due link del dettaglio; manca il test dal dettaglio con ?sigc=false (V1-03).
- J-07 senza test (MarkArea registrato, asse che contiene le fasi) (V1-04, X-08).
- V1-05, V1-06, V1-10 senza test di regressione (V1-05).
- /finanziario/avanzamento dichiara ResiduoSuImpegni.stimaImpegni.* senza renderlo (V1-06).
- RettificheIntervento del dettaglio con una sua regola; PROGRAMMAZIONI in ui/ (H-07).
- Link SIGC: TX-0012/TX-0013 contano per presenza SIGC della domanda, l'elenco per classificazione dell'intervento; nel dettaglio di un intervento non SIGC il link apre un elenco vuoto (X-02): link SIGC del dettaglio solo per gli interventi SIGC, limite dichiarato in un open point.
- COSMETICO: commenti superati (V1-07); "(R02)" nei sottotitoli visibili (V1-08, X-14).

Procedurale:
- La natura delle card scritta in tre punti (H-06; X-12 COSMETICO).
- Test della panoramica con un `every` su un array vuoto (X-10).

## Contestati

Nessuno.
