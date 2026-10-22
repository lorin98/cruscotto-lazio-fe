# Judge, review step9 FULL della feature fisico, v1 iterazione 2

Perimetro: `git diff dcedafe ed992a5`, cioe' le correzioni dei 14 finding dell'iterazione 1 (da 691ad34 a 88ed136), il
wireframe superfici riapprovato (ed992a5) e il codice comune nuovo o spostato, con i suoi usi in finanziario ed elenco
operativo. Intensita' FULL (budget 3, questa e' la seconda iterazione). Ho verificato ogni finding in sola lettura sul codice
HEAD (f6140ad, 22/10/2026), con Read, grep e git show/diff. Fra ed992a5 e f6140ad cambiano solo lo stato, i report del gate e
il brief: il codice di HEAD e' quello del perimetro. Non ho lanciato npm, build o test.

Finding in ingresso: 6 (lente V 0, lente H 4, lente A 1, antagonista 1). Gli id sono quelli delle lenti di questa iterazione:
A1 e H1-H4 qui non sono gli A1 e H1-H4 dell'iterazione 1.

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** Li ho rieseguiti in sola lettura, con il plugin green-fe e `tools/vendor` in testa al PATH:
  - `check-ui-authz.sh plan/fisico/route-manifest.json plan/fisico/uiplan.json handover`: pass, 2 route e 3 azioni, nessun
    failure;
  - `fe-project-check.sh . --built --feature fisico --catalog handover/authz-catalog.json`: pass, 5 feature, nessun failure.

  FAIL_AUTHZ non scatta. Lo step8 registrato in f6140ad e' 11/11 per fisico, finanziario ed elenco
  (`plan/fisico/fe-gate-report.json`: verdict pass, authz pass).
  - Nel perimetro l'unica modifica ai predicati e' H7 dell'iterazione 1: `puoLeggere` e' `hasGrant(status, GRANT[lettura])`
    (`grant.ts:22-24`), cioe' `roles.includes(grant)` (`stato.ts:19-21`). Prima era `makeRolePredicate` sugli stessi grant.
    Non c'e' widening.
  - TX-0060 parte ancora solo con `puoLeggere(auth.data, 'filtri')` (`useCriteriNellIndirizzo.ts:18-19`). Senza il grant non
    c'e' nessuna lettura, come prova `superfici/page.test.tsx:324-334`.
  - Il link alla scheda della domanda passa ancora da `puoLeggere(auth.data, 'schedaDomanda')` (`DetermineDellaDomanda.tsx:158`).
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso in `src/features`, `src/entities` e `src/pages`. Resta
  solo l'helper security-inert di `shared/api/auth/stato.ts`, che il perimetro non tocca. Nessun CRITICO imposto.
- **CSRF.** In `shared/api` il perimetro aggiunge solo `problem/e-problema.ts`, una funzione pura. Il mutator non cambia:
  `X-Requested-With` resta fisso (`bff-mutator.ts:42`) e gli export lo portano (`superfici/page.test.tsx:127, 143-147`).
  Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO in ingresso.** La sezione dei CRITICO rigettati e' vuota per costruzione.

## Verifica dei finding dell'iterazione 1

Sono risolti tutti e 14. La lente V non ne ripresenta nessuno e le mie verifiche a campione lo confermano:

| id | verifica sul codice HEAD |
|---|---|
| V1 (assorbe V2, X1) | Il motivo dipende dalla campagna della risposta: `motivoSenzaSuperfici(riga, campagnaRisposta)` (`superfici.ts:90-93`), `righeTabella(righe, campagnaRisposta)` (riga 112), `campagnaRisposta` passata a tabella e anteprima (`ReportSuperfici.tsx:129, 134`). `servi()` risponde come il backend (`page.test.tsx:28-36`). Il test `?campagna=2024` con SRB02 e' alle righe 191-215, e lo stato vuoto di D1 alle righe 174-183. |
| V3 | Test di caricamento delle determine con `trattenuta()` (`determine/page.test.tsx:75-93`). |
| A1 (assorbe X2) | `useFocusDopoIlCambio` (`focus.ts:27-33`) e `useApplicaConFocus` (`SuperficiAmmissibili.tsx:81-89`). Test: serie per campagna (`page.test.tsx:93-106`), "Mostra solo" (251-267), stato vuoto (269-281), barra (283-294). |
| A2 | `useDetermine('1/../x')` deve chiamare `/api/fisico/domande/1%2F..%2Fx/determina` (`tests/fisico-api.test.tsx:56-66`). |
| X3 | `ordineIniziale` decrescente sulla campagna (`TabellaSuperfici.tsx:99`), test con `aria-sort` (`tests/fisico-ui.test.tsx:72-76`). |
| X4 | `SenzaVoci` per Intervento (`GruppiProgramma.tsx:53-63`). "Nessuna voce corrisponde alla ricerca." compare solo dopo una ricerca (`ControlliPannello.tsx:79-81`). Test in `tests/fisico-ui.test.tsx:110-117`. |
| H1 | `Gruppo`, `Caselle` e `Scelte` stanno solo in `shared/ui/filtri/ControlliPannello.tsx`. L'elenco tiene una `Caselle` che passa il testo al kit (`controlli.tsx:16`). `GruppoCampagna` e' `Scelte` esclusive (`PannelloFiltriSuperfici.tsx:24-31`). `Gruppo` non e' piu' nel barrel di entities/filtri. |
| H2 | `useFiltriProgrammaNellIndirizzo` e `useBozzaFiltri` (`entities/filtri/ui/useFiltriProgrammaNellIndirizzo.ts`), composti dal finanziario (`useFiltriNellIndirizzo.ts:19`, `PannelloFiltri.tsx:16`) e dal fisico (`useCriteriNellIndirizzo.ts:20`, `PannelloFiltriSuperfici.tsx:85`). Test in `tests/entita-filtri-ui.test.tsx:43-84`. |
| H3 | `testoDomande`, `notaQuantitaPremio` e `descrizioneIntervento` (`formato.ts:82, 91, 102`), `campagneDellAnteprima` e `campagneProposte` (`superfici.ts:131, 138`), `vociDelPannello` (`criteri.ts:80`). Nessun import di React o di ui nel lib. |
| H4 | `kpiDellaCampagna` e `cardDelleSuperfici` in `lib/report.ts`. Nel fisico, in entities/filtri e nei controlli del kit nessuna funzione supera 28 righe (misurate). |
| H5 (D2) | Il fisico usa `ettari` del kit. Nell'elenco `testoSuperficie` usa `ettari` (`elenco-operativo/lib/formato.ts:98-101`), con il test a "12,50 ha" (`tests/elenco-operativo-lib.test.ts:219-220`). |
| H6 | `TestataDettaglio` (`Testata.tsx:67`), usata dalla scheda (`SchedaDomanda.tsx:64`) e dalle determine (`DetermineDellaDomanda.tsx:47`). Test in `tests/kit-comune.test.tsx:41`. |
| H7 | `puoLeggere` con `hasGrant`, senza scaffolding, e il commento e' corretto (`grant.ts:1-3, 22-24`). |
| H8 | `eProblema` (`e-problema.ts:9-11`), chiamata dai cinque wrapper delle tre feature. Test in `tests/problem-types.test.ts:50`. |

Non ho trovato regressioni di comportamento in finanziario ed elenco. Le lenti non ne segnalano. Gli effetti dichiarati nel
brief (lista vuota senza ricerca, "12,50 ha", secondo clic sulla campagna) sono coerenti col codice e non sono finding.

## Valutazione Finding

### Focus dopo "Applica i filtri" dallo stato vuoto: A1, X1

#### A1: Il focus va sull'h1 anche quando il comando non cambia i criteri: "Applica i filtri" senza modifiche dal pannello aperto dallo stato vuoto toglie il focus a "Modifica i filtri", che resta sulla pagina
- **Verdetto**: ACCETTATO, con il fix ritoccato. Il commento corretto che viene da X1 entra in questo fix.
- **Motivo**: verificato.
  - Cosa fa il codice: `onApplica` sceglie `applicaConFocus` per la sola origine `'vuoto'` (`SuperficiAmmissibili.tsx:102`),
    e `useApplicaConFocus` chiama `sposta()` sempre (righe 84-87).
  - Cosa succede con criteri invariati: la query string resta uguale, quindi `richiesti` e `filtri` restano gli stessi (memo
    su `search`, `useFiltriProgrammaNellIndirizzo.ts:42, 47`). Restano uguali anche la chiave del `Report`
    (`SuperficiAmmissibili.tsx:69`) e la query di TX-0018. Lo stato vuoto e il suo bottone (`ReportSuperfici.tsx:26-35`, sia
    il vuoto di `VistaQuery` sia `NessunaSuperficie`) restano nel DOM. Il focus va comunque sull'h1, e il ripristino di
    react-aria non agisce piu', perche' il focus non e' sul body (`focus.ts:24-25`).
  - Perche' tradisce il wireframe riapprovato: la regola vale per un "comando che sparisce col report" (`superfici.md:166`),
    con il motivo "lo stato vuoto, e il suo bottone, spariscono col nuovo risultato" (`superfici.html:240`). Per il bottone
    che resta, il wireframe vuole gia' il ritorno del focus al bottone (`superfici.md:168-169`, il caso della barra). Il
    codice distingue per l'origine del pannello invece che per il cambio dei criteri.
  - Non e' una violazione di 2.4.3, perche' l'h1 e' un punto sensato. E' un caso limite con un effetto piccolo (un Tab), quindi
    resta MINORE.
- **Ritocco del fix.** Con criteri invariati non chiudo e basta, come propone la lente: chiamo `applica` senza spostare il
  focus.
  - Cosi' resta identico al percorso della barra. Si copre anche il caso dell'azione portante non applicata, che oggi
    "Applica" toglie dall'indirizzo anche se i criteri effettivi non cambiano.
  - Non serve toccare il wireframe: il caso e' fuori dalla regola del comando che sparisce, e il ritorno al bottone che resta
    e' gia' scritto.
  - "Mostra solo" resta com'e', come propone la lente.
- **Severita' finale**: MINORE

#### X1: "Applica i filtri" dallo stato "Nessun intervento" con criteri nuovi ma gia' in cache e vuoti: il bottone resta e il focus va comunque sull'h1
- **Verdetto**: RIGETTATO, cioe' non assorbito in A1. Di X1 entra in A1 solo la parte vera sul commento.
- **Motivo**: lo scenario e' esatto, ma il fix non cambia nulla di cio' che l'utente percepisce.
  - Lo scenario: con dati in cache `VistaQuery` rende di nuovo `<Vuoto>` nella stessa posizione (`StatiVista.tsx:103, 107`,
    `staleTime` di 5 minuti in `query-client.ts:32`). React conserva il nodo del bottone.
  - Oggi, con criteri nuovi, il focus va sull'h1 sia con la cache sia senza (senza cache passa dal caricamento, come nel test
    X2, `page.test.tsx:269-281`). E' il comportamento che il wireframe prescrive per l'"Applica" dallo stato vuoto.
  - Il fix proposto (una `key` su `VuotoConFiltri`) lascia il focus sull'h1. Cambia solo l'identita' del nodo, e il test
    proposto (`isConnected` false) verifica un dettaglio di implementazione, non un comportamento.
  - Con la guardia di A1 il criterio diventa "criteri nuovi = contenuto nuovo": il caso di X1 e' coerente con quel criterio,
    e la cache non cambia l'esito.
  - Resta vero che i commenti di `SuperficiAmmissibili.tsx:10-11, 99` ("dallo stato vuoto il bottone sparisce") non
    descrivono sempre il DOM. Il fix di A1 li riscrive col criterio dei criteri nuovi.
- **Severita' finale**: nessuna (rigettato)

### Codice comune dopo le correzioni: H1-H4

#### H1: Il focus dopo un comando che sparisce ha due implementazioni: useFocusDopoIlCambio del kit e useFocusDopoIlTogli locale al pannello dell'elenco
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `useFocusDopoIlTogli` (`PannelloFiltriElenco.tsx:97-111`) segna l'intento in un ref e sposta il focus sulla nota in un
    effetto dopo il render che ha smontato il bottone. E' la responsabilita' di `useFocusDopoIlCambio` (`focus.ts:27-33`).
  - Il hook del kit e' nato nel giro di correzione (e8fe95a) e non ha assorbito questa copia, che esisteva gia' (dcedafe,
    riga 98). Il file e' stato toccato nel perimetro (a557bf6).
  - La sostituzione non cambia il comportamento. La nota e' sempre montata quando `attoConcessioneDisponibile === false`
    (righe 134-138), e la bozza del pannello cambia nello stesso render (`imposta` -> `applicaRitardato`, `useCriteri.ts:87-95`).
    Il test del focus sulla nota
    (`interrogazione-stati.test.tsx:304-308`) la copre.
  - E' una duplicazione sotto soglia, circa 13 righe: per la checklist e' MINORE, come H6 dell'iterazione 1.
- **Severita' finale**: MINORE

#### H2: Il lib puro del fisico dipende da un tipo dichiarato in un modulo ui: ValoriProgramma sta in GruppiProgramma.tsx e vociDelPannello lo importa
- **Verdetto**: ACCETTATO, con il motivo ridotto
- **Motivo**: verificato.
  - `VoceLike` e `ValoriProgramma` sono tipi di dati, ma sono dichiarati nel file del componente (`GruppiProgramma.tsx:15-28`)
    ed esportati dal barrel da `./ui/GruppiProgramma` (`entities/filtri/index.ts:22`).
  - `vociDelPannello`, portata nel lib da H3 (`criteri.ts:80`), li importa per tipo (`criteri.ts:6`).
  - La purezza del lib non e' violata. L'import e' di solo tipo e passa dal barrel, e `criteri.ts:5` importa gia' valori dallo
    stesso barrel. Resta un problema di coesione: il tipo dei dati sta nel modulo della UI.
- **Severita' finale**: COSMETICO

#### H3: Riesportazioni morte dopo H2: filtriAttivi e senzaValore del lib del finanziario non hanno piu' consumatori di produzione
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - A dcedafe le usava `useFiltriNellIndirizzo.ts:12, 32, 36`. Dopo cee5e26 in `src/` le nomina solo la riesportazione di
    `finanziario/lib/filtri.ts:14, 18`, e `FiltroAttivo` (riga 21) non ha consumatori.
  - Restano vive solo per `tests/finanziario-lib.test.ts:200-217`, che provano funzioni dell'entity attraverso la feature. Per
    loro il commento delle righe 4-5 non vale piu'.
  - E' codice morto, senza difetto.
- **Severita' finale**: COSMETICO

#### H4: ettari, ora la resa unica delle superfici in tutti i testi (D2), sta fra le primitive dei grafici e non accanto a formatEttari
- **Verdetto**: ACCETTATO, con il motivo ridotto
- **Motivo**: verificato.
  - `ettari` sta in `shared/lib/grafici/primitive.ts:81`, documentata come resa "di etichette, tooltip e descrizioni"
    (riga 80). Con D2 e' anche la resa delle celle e della sintesi dell'elenco (`elenco-operativo/lib/formato.ts:98-101`),
    dei KPI (`fisico/lib/report.ts:37, 44`) e dell'anteprima.
  - Non accolgo l'argomento che una modifica alle etichette dei grafici cambierebbe la tabella dell'elenco: e' proprio
    l'effetto voluto da D2, una resa unica. Resta il commento, che non dice piu' il vero, e la coesione con `formatEttari`
    (`shared/lib/format.ts:18`).
  - Lo spostamento e' sicuro. `grafici/index.ts` riesporta `./primitive` con `export *`, quindi se `ettari` e' solo importata
    da primitive non c'e' un doppio export nel barrel di `shared/lib`.
- **Severita' finale**: COSMETICO

## Riepilogo

- Accettati: 5
  - MINORE 2: A1, H1.
  - COSMETICO 3: H2, H3, H4.
- Rigettati: 1 (X1). La sua parte vera, il commento, entra nel fix di A1.
- Declassati: 0. Due finding sono accettati con il motivo ridotto (H2, H4) e uno con il fix ritoccato (A1). Le severita'
  dichiarate restano.
- Assorbiti come duplicati: 0. L'antagonista proponeva di assorbire X1 in A1, ma non lo accolgo: le cause sono diverse e il
  fix di X1 non cambia il comportamento.
- Punteggio atteso (`review-score.sh FULL`): 100 - 2x3 - 3x1 = **91**, con 0 CRITICO e 0 MAGGIORE. Il verdetto e' **PASS**
  (soglia FULL 80).

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Parti di finding che non accolgo, o che toccano scelte approvate:
- **A1**, il fix "chiudere soltanto, nessuna navigazione" con criteri invariati. Lo sostituisco con `applica` senza focus,
  come dalla barra: cosi' il caso dell'azione portante non applicata resta uguale nei due percorsi.
- **X1**, la `key` sullo stato vuoto di `VistaQuery` e il test su `isConnected`. Non c'e' nessun effetto percepibile e il test
  proverebbe un dettaglio di implementazione.
- **H2**, la parte "il lib puro importa da un modulo ui". L'import e' di solo tipo e passa dal barrel, quindi la purezza non
  e' violata: resta la coesione.
- **H4**, la parte "una modifica alle etichette dei grafici cambierebbe la tabella". E' l'effetto voluto da D2: restano il
  commento e la coesione.
- **Wireframe superfici riapprovato**: nessun finding lo contesta. Il fix di A1 resta dentro la regola scritta (il comando
  che sparisce, e il ritorno al bottone che resta), quindi non serve un rework ne' una nuova approvazione.

## Decisioni da chiedere all'utente

- **D3, chiudere ora la feature o correggere prima i 5 finding non bloccanti.** La review passa gia' (score 91, 0 CRITICO,
  0 MAGGIORE).
  - **Opzione a, raccomandata**: registrare il PASS dello step9 e mettere A1, H1, H2, H3 e H4 tra i debiti della review del
    fisico, da chiudere al primo giro che tocca questi file.
  - **Opzione b**: correggerli ora, in commit separati. Poi bisogna rieseguire lo step8 (11/11) di fisico, finanziario ed
    elenco, perche' le approvazioni sha256 sono invalidate dalle modifiche, e fare l'iterazione 3, l'ultima del budget.
  - Se si sceglie b, conviene limitarsi ad A1 e H1. A1 e' l'unico finding con un effetto visibile: una riga e un test. H1
    tocca l'elenco, una feature chiusa. I tre COSMETICO non valgono da soli un giro di gate.

## Note per il giro di correzione (se D3 = b)

- Ordine consigliato:
  1. A1, che ha un effetto visibile;
  2. H1, che tocca l'elenco: deve restare verde `interrogazione-stati.test.tsx:304-308`;
  3. H2, H3 e H4, che sono spostamenti senza effetto: deve restare verde il barrel di `shared/lib` e di `entities/filtri`.
- Nessun wireframe da riapprovare, nessuna modifica a stato, backend o plugin.
- Prima di registrare lo step9 bisogna rieseguire lo step8 11/11 delle tre feature.
