# Feature istituzionale: step3-7 di green-fe del riallineamento degli ambiti (30/10/2026)

Partenza: worktree `cruscotto-lazio-fe-wt-istituzionale`, branch `riallineamento/istituzionale-step3-7` da `5baf660` (fine
dello step2), `.claude/state/green-fe-istituzionale.state.json` a `current_step` 3. Tre flussi approvati dall'utente il
30/10/2026: `verifica-smp-non-sigc` (con `home.html`, rework 1 della card col blocco SIGC), `verifica-smp-sigc` (nuovo) e
`intervento` (ricomposto). Eseguiti gli step 3-7 seguendo le skill del plugin (`step3-api` ... `step7-test`); gate e
transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate nello stesso blocco bash del suo
`state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla sessione principale**. Commit sul
branch del worktree (la fusione su main la fa la sessione principale), nessun push.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step3-api | api_wrappers_compile, querykey_from_factory | nuova solo l'opzione `mantieniDati` di `useVerificaSmpSigc` (scheda SIGC del dettaglio); nessuna operazione nuova |
| step4-lib | lib_pure_compile, lib_zero_react | primo giro del gate rosso sui test per un test instabile sotto carico (non riprodotto: suite verde subito dopo e al secondo giro) |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei tre wireframe ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash`; in piu' il controllo cross-feature a parte (sotto) |
| step6-page | pages_compile, route_manifest_valid | `fe-project-check.sh . --feature istituzionale --catalog handover/authz-catalog.json` rc 0 (verdict pass); `plan/istituzionale/route-manifest.json` proiettato e validato (3 route) |
| step7-test | tests_generated, msw_fail_closed | REQ-must: RA006, RF015, RF016, tutti con describe taggato; self-check con lo stripper file per file (sotto) |

Verifica finale: `npx tsc --noEmit`, `npx eslint . --max-warnings 0` e `npm run lint` verdi, `npx vitest run` verde due
volte di seguito (76 file, 1568 test; erano 1533). Wireframe, uiplan, dossier, `handover/`, `specs/`, plugin e stati delle
altre feature non toccati.

Adattamenti dei controlli (difetti noti del plugin, plugin non toccato):
- step5: il controllo `component_cross_feature` della SKILL non scatta con `output_dir` "."; eseguito comunque, piu' un
  controllo a parte che risolve ogni import relativo di `src/features/istituzionale` (nessun import da altre feature;
  provato anche in negativo su un albero finto).
- step7: il blocco originale da' il falso `msw_setup_assente` (stripper sul flusso concatenato di tutti i file di `src/`);
  registrato col blocco identico salvo le due righe `MSWSTRIP`/`MSWHARD`, con lo stripper applicato file per file, come il
  fisico. `pipefail` non usato nel blocco.

## Commit (in ordine)

`40b928f` step3; `e66fdc7` step4; `ec0eaec` step5; `fe270ea` step6; `f1204d3` step7; questo resoconto.

## Novita' implementate, per flusso

**verifica-smp-non-sigc (con la card della Home)**
- Frase sotto il titolo "La stessa verifica per i dati SIGC, per esercizio finanziario e con gli stessi filtri: Verifica
  SMP SIGC." col link `verifica-smp-sigc` verso `/istituzionale/verifica-smp-sigc` coi filtri comuni (intervento, os, og,
  op, azione), mai l'anno; resa solo con csr.tx-0015.read.
- Card Istituzionale: testi del dossier in `src/app/aree.ts`; nell'`Anteprima`, sotto il blocco non SIGC invariato, col
  grant csr.tx-0015.read il blocco SIGC in un gruppo "SIGC, esercizio aaaa": TX-0015 senza filtri con l'ultimo esercizio
  chiuso (`esercizioUltimoChiuso`: dal 16/10 dell'anno Y e' Y, prima Y-1; stessa lettura e cache della pagina aperta con
  quell'esercizio), riferimento "SIGC, esercizio aaaa (16/10/aaaa-1 - 15/10/aaaa; domande dell'anno aaaa-1)", Domande
  finanziate, Spesa pubblica erogata nell'esercizio (campagna precedente + campagne anteriori, mai una somma parziale),
  Domande pagate nell'esercizio, Domande ricevute; nessuna quota. Scheletro, errore ("Dati della verifica SMP SIGC non
  disponibili in questo momento.") e dato mancante per blocco, indipendenti; senza nessuno dei due grant i contenuti.

**verifica-smp-sigc**
- Resa come la verifica non SIGC: sottotitolo del wireframe, frase speculare "La stessa verifica per i dati ASR non SIGC,
  con gli stessi filtri: Verifica SMP non SIGC." (link `verifica-smp-non-sigc` coi filtri comuni, mai l'esercizio, solo
  con csr.tx-0016.read), pill dell'esercizio con gli estremi, aiuto del selettore del wireframe, tabella "Riferimenti della
  risposta" (esercizio con estremi, anno delle domande, pagamenti senza data, perimetro), card a barre con PNG, CSV e XLSX
  e la fonte, card "Dati per intervento" (colonne del low-fi visibili, le altre da Colonne; nota sui file; CSV e XLSX;
  definizioni del backend), vuoto "Nessun dato SIGC per l'esercizio e i filtri scelti. Scegli un altro esercizio oppure"
  + "Modifica i filtri".
- Clic su barra o riga (Invio): `/istituzionale/interventi/:codice?esercizio=` (link `dettaglio-intervento-smp-sigc`).

**intervento**
- Due schede, "Verifica SMP non SIGC" (TX-0016) e "Verifica SMP SIGC" (TX-0015), ognuna col grant della sua transazione;
  scheda iniziale dalla pagina di partenza (con l'esercizio e senza l'anno la SIGC); letture solo all'apertura della
  scheda (la SIGC solo con l'esercizio), poi restano; KPI dentro ogni scheda col periodo (non SIGC: cumulative; SIGC:
  "(campagna n-1)" nell'etichetta, "TX-0015, esercizio n" / "pagata nell'esercizio n" nella nota), nessun KPI in testa.
- Scheda SIGC: selettore dell'esercizio con Mostra, "Scegli l'esercizio finanziario da consultare." senza lettura,
  riferimenti e venti voci con la didascalia del periodo, CSV e XLSX dell'intervento con l'esercizio, dati di prima durante
  la lettura di un altro esercizio (role=status, aria-busy), "Nessun dato SIGC per questo intervento nell'esercizio
  scelto. Scegli un altro esercizio." dentro la scheda.
- Testata: solo il badge del perimetro; pulsanti "Verifica SMP non SIGC filtrata su questo intervento" (con l'anno) e
  "Verifica SMP SIGC filtrata su questo intervento" (con l'esercizio; link `verifica-smp-sigc-intervento`), ognuno col
  grant della destinazione. "Dati al" della prima risposta arrivata fra TX-0016 e TX-0015. Stato vuoto della pagina col
  testo del wireframe ("nella verifica SMP").
- Quantita' di output col codice dell'indicatore accanto ("40 (indicatore O.20)", OP-IS-12) nelle voci delle due schede.
- `GRANT_DETTAGLIO` e visibility della route = csr.tx-0016.read, csr.tx-0015.read; azione TX-0015 nella route-table.

Nessun link verso `/fisico/interventi/:codice`: lo uiplan approvato non lo dichiara.

## File comuni toccati (solo le parti dell'istituzionale)

- `src/app/aree.ts`: la sola voce `istituzionale` (commento G1, `descrizione`, `contenuti`); `Anteprima` e
  `ricercaConservata` invariate.
- `src/app/route-table.json`: la sola voce `/istituzionale/interventi/:codice` (visibility e azione TX-0015).
- `src/app/routes.tsx`: non toccato.
- `tests/app-aree.test.tsx`: l'asserzione sulla visibility del dettaglio istituzionale (con l'import di `GRANT_DETTAGLIO`
  come alias), quella sui testi della card Istituzionale, il test del profilo dell'istituzionale (handler di TX-0015) e
  quello del profilo con la sola verifica SIGC (ora la card mostra il blocco SIGC).
- `tests/anteprime-home.test.tsx`: il solo describe della card Istituzionale (riscritto: 8 test) e tre import.
- `plan/istituzionale/route-manifest.json`: proiezione dello step6.
- Test della feature in `tests/` (`istituzionale-api`, `-lib`, `-ui`) e in `src/pages/istituzionale/`.

## Scelte prese in autonomia

1. Lo stato vuoto della pagina del dettaglio ("Nessun dato per questo intervento nella verifica SMP", es. AT001) lo
   decide solo la verifica non SIGC; la SIGC senza la riga lo dice nella sua scheda, che resta col selettore per scegliere
   un altro esercizio (`lettureDelloStato`). Col solo grant di TX-0015 e senza esercizio la pagina mostra la scheda e non
   lo scheletro (`statoDellaPagina`).
2. Le letture del dettaglio partono alla prima apertura della scheda e poi restano attive (anno ed esercizio si cambiano
   nella loro scheda, coi dati di prima, come nella scheda non SIGC).
3. Nomi accessibili dei KPI SIGC = l'etichetta visibile ("Domande ricevute SIGC (campagna 2024)"), non gli aria-label del
   low-fi ("... della campagna precedente"), per WCAG 2.5.3. Pulsanti di scaricamento: "Scarica i dati della verifica SMP
   SIGC, esercizio 2025 in CSV" (il kit compone "Scarica {oggetto} in {formato}"; il low-fi ha una virgola prima di "in").
4. Colonne della tabella SIGC: visibili di partenza le undici del low-fi, le altre da "Colonne" (come la non SIGC); la
   nota sui file sempre visibile sopra la tabella con il testo del wireframe (prima, dal finanziario, solo con la ricerca).
   Gli indicatori sono colonne di testo, come nella non SIGC.
5. Sottotitolo del grafico SIGC senza la "previsione di pagamento" del figcaption del low-fi: resta il test di review del
   finanziario che la vuole solo nella tabella (D-11); la frase dice che le campagne anteriori sono nella tabella.
6. Definizioni del backend anche sotto le voci della scheda SIGC del dettaglio (OP-IS-07: note fisse sotto le tabelle),
   come gia' nella scheda non SIGC; il low-fi del dettaglio non le disegna in nessuna delle due schede.
7. Nel blocco SIGC della card un conteggio assente in una riga (campi facoltativi della spec) da' "non disponibile" col
   motivo "Non calcolabile: manca per n interventi (...)", come la spesa.
8. L'ultimo esercizio chiuso si calcola dalla data locale del browser.
9. Codice morto tolto: `quantita` (unita' di misura non piu' disponibile), `badgeIntervento`, `kpiIntervento`,
   `NOTA_FILE_VERIFICA_SIGC`, il tipo `Contenuta` di `ui/contratto.ts` (sostituito dall'uguaglianza delle chiavi della riga
   di TX-0015, ora completa in `lib/dto.ts`).

## Contraddizioni fra le fonti (vale il wireframe approvato)

- Lo uiplan (OP-IS-11, ultima frase) e il dossier (scelta di disegno 3, "Cosa cambia", riga OP-IS-11 della tabella)
  dicono ancora "numeri invariati / nessun numero SIGC nella card / nessuna lettura di TX-0015"; `home.html` approvata
  (rework 1) e la testa del dossier hanno il blocco SIGC: implementato il blocco SIGC. Uiplan e dossier non toccati.
- OP-IS-12 dice la quantita' col codice dell'indicatore "come nella tabella delle due pagine", ma le tabelle dei wireframe
  delle pagine hanno il solo numero (l'indicatore e' una colonna a se'): il codice accanto alla quantita' solo nelle voci
  del dettaglio, come nel wireframe intervento.

## Punti aperti

1. step8-gate (11/11, axe vero) e review step9: alla sessione principale, dopo la fusione su main.
2. Allineare il testo di OP-IS-11 dello uiplan e del dossier al rework 1 della card (fuori dal perimetro di questo giro).
3. Residuo umano dei wireframe (ordine di lettura, contrasto, testi lunghi delle assenze, differenza di periodo fra le
   schede) e axe nel gate dello step8.
4. Nei giorni subito dopo il 16/10 l'esercizio appena chiuso puo' avere pochi dati nel backend: la card li mostra come
   sono (zeri veri), senza ripiegare sull'esercizio precedente (non previsto dal wireframe).
