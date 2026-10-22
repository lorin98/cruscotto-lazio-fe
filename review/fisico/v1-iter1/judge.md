# Judge, review step9 FULL della feature fisico, v1 iterazione 1

Perimetro: `git diff 96cb36a 06794b5`, cioe' la feature fisico (step2-7) e gli spostamenti nel codice comune fatti per lei,
che toccano anche finanziario ed elenco operativo. Intensita' FULL: e' la prima review della feature e la feature ha
authz e scoping. Ho verificato ogni finding in sola lettura sul codice HEAD (9aeeccd, 22/10/2026), con Read, grep e
git show. Non ho lanciato npm, build o test.

Finding in ingresso: 17 (lente V 3, lente H 8, lente A 2, antagonista 4).

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** `check-ui-authz.sh` e `fe-project-check.sh --built --catalog` sono verdi: li ha rieseguiti la lente
  A. Lo step8 a 9aeeccd e' 11/11. FAIL_AUTHZ non scatta.
  - Route-manifest: `/fisico/superfici` e' visibile con `csr.tx-0018.read`, `/fisico/determine/:codice?` con
    `csr.tx-0020.read`. Le azioni hide-by-role usano i grant verbatim del catalogo.
  - TX-0060 parte solo con `puoLeggere(auth.data, 'filtri')` (`useCriteriNellIndirizzo.ts:21-22`). Senza il grant non c'e'
    nessuna richiesta, come prova `superfici/page.test.tsx:250-262`.
  - Il link alla scheda della domanda passa da `puoLeggere(auth.data, 'schedaDomanda')` (`DetermineDellaDomanda.tsx:17`).
  - I predicati si riducono a `hasGrant`, cioe' `roles.includes(grant)`: non c'e' widening (vedi H7, che e' solo
    cosmetico).
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso nel fisico ne' nel codice comune toccato. Nessun
  CRITICO imposto.
- **CSRF.** Il perimetro non tocca il mutator BFF: in `shared/api` cambia solo `mock/server.ts`. `X-Requested-With` resta
  fisso nel mutator (`bff-mutator.ts:42`) e gli export lo portano (`superfici/page.test.tsx:134-138`). Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO in ingresso.** La sezione dei CRITICO rigettati e' vuota per costruzione.

## Valutazione Finding

### Dati letti con il filtro Campagna: V1, V2, X1 deduplicati

#### V1: Con il filtro Campagna un intervento che ha superfici in altre campagne viene detto "senza superfici in nessuna campagna, non a superficie o non SIGC"
- **Verdetto**: ACCETTATO (assorbe V2 e X1)
- **Motivo**: verificato.
  - Cosa dice il contratto: con `?campagna=N`, TX-0018 restituisce con campagne vuote e `NON_VALORIZZATO` ogni intervento
    che non ha superfici in quella campagna (SC-FS_SUPERFICIE_CAMPAGNA, con 2023: "SRB01 e SRA29 con campagne vuote e
    motivo NON_VALORIZZATO"; SRB01 ha superfici nel 2024 e nel 2025).
  - Cosa fa il codice: `senzaSuperfici` distingue "nessuna campagna" da "non in questa" solo con `r.campagne.length === 0`
    (`superfici.ts:86`). Con il filtro quindi ogni intervento escluso diventa `SENZA_SUPERFICI` (`formato.ts:38`), cioe'
    "nessuna superficie in nessuna campagna (non valorizzato: intervento non a superficie o non SIGC)".
  - Dove si vede: nella nota degli omessi dei due grafici (`grafici.ts:34`), nella colonna Campagna della tabella
    (`TabellaSuperfici.tsx:42`) e nell'anteprima (`AnteprimaIntervento.tsx:30-33`).
  - Il percorso e' quello principale: dalla pagina senza filtro, il clic su un punto della serie per campagna mette
    `?campagna=2024`. Lo riproduce anche il mock del dev server, che filtra come il backend (`api/mock/esempio.ts:36-40`):
    con `?campagna=2023` SRA01 risulta "non a superficie".
  - L'affermazione e' falsa e contraddice il pack, quindi MAGGIORE regge l'anti-inflation.
  - V2 ne e' la causa: `servi()` dei test di pagina risponde sempre lo stesso corpo, qualunque sia la query
    (`superfici/page.test.tsx:23-37`, test alle righe 47, 210 e 288). La forma filtrata non e' mai esercitata.
  - X1 e' la stessa causa vista nell'anteprima: la mini linea per campagna si disegna da `riga.campagne`
    (`AnteprimaIntervento.tsx:87`), che con il filtro contiene solo N. Contrasta con la regola approvata: con una campagna
    scelta la serie non si disegna, e la linea usa la risposta letta senza filtro (`superfici.md:41, 46-47`). Il fix passa
    dallo stesso punto: `AnteprimaIntervento` deve sapere che la risposta e' filtrata.
- **Correzione accettata**: discriminare sulla risposta filtrata (`SuperficieAmmissibile.campagna` non null).
  - Gli interventi con campagne vuote diventano "nessuna superficie nella campagna N (non valorizzato)", con il testo
    `testoNonInCampagna` che esiste gia'.
  - Nell'anteprima filtrata la mini linea e' `nonDisegnabile(MOTIVO_CON_CAMPAGNA)`. Non serve una seconda lettura senza
    filtro, che contrasterebbe con la scelta approvata "una lettura di TX-0018 per pagina".
  - I test di pagina rispondono nella forma del contratto.
  - Lo stato vuoto con la campagna e' un testo del wireframe approvato: e' fuori dal fix ed e' la decisione D1.
- **Severita' finale**: MAGGIORE

#### V2: MSW dei test di pagina ignora i criteri
- **Verdetto**: DUPLICATO di V1 (assorbito). E' il motivo per cui V1 non e' stato visto. Il suo fix (servi() che filtra
  come `api/mock/esempio.ts` e i test 47, 210, 288 allineati) e' dentro il fix di V1.
- **Severita' finale**: vedi V1

#### X1: Con il filtro Campagna la mini linea "per campagna" del drawer si disegna dalla risposta filtrata
- **Verdetto**: DUPLICATO di V1 (assorbito, stessa causa). Da solo sarebbe MINORE.
- **Nota sulle citazioni**: la citazione principale (`AnteprimaIntervento.tsx:87`) e' esatta. Quelle in `grafici.ts`
  (179-182, 185-190, 151) sono spostate di 68 righe: le righe vere sono 111-114, 117-122 e 83. Il contenuto citato e'
  comunque quello.
- **Severita' finale**: vedi V1

### Focus perso dopo un comando che sparisce: A1, X2 deduplicati

#### A1: "Mostra solo <intervento>" dell'anteprima lascia il focus su BODY (WCAG 2.4.3)
- **Verdetto**: ACCETTATO (assorbe X2)
- **Motivo**: verificato. `onMostraSolo` chiude il drawer e chiama `applica` (`SuperficiAmmissibili.tsx:227-230`). Questo
  cambia la query-key di `useSuperfici` (riga 257), e il fisico non usa `placeholderData` (la usa solo l'elenco,
  `elenco-operativo/api/index.ts:70`). Quindi `VistaQuery` torna al caricamento (`StatiVista.tsx:103`). Il `Report` e'
  comunque rimontato dalla `key` (riga 280). La riga o la barra che ha aperto il dialogo esce dal DOM, e il `Modal` di
  react-aria non ha piu' dove riportare il focus.
  - X2 e' lo stesso difetto su un'altra strada: "Modifica i filtri" dello stato vuoto (righe 54-63, 205, 278) seguito da
    "Applica i filtri" (righe 293-296). Si aggiunge il clic sulla serie per campagna (`onCampagna`, riga 219).
  - I test verificano l'indirizzo e la chiusura, non il focus (`tests/fisico-ui.test.tsx:117-119`,
    `superfici/page.test.tsx:216-218`).
  - La soluzione esiste gia' nel progetto: X-03 dell'elenco, `interrogazione.tsx:88-91`.
- **Nota sul fix**: non basta un `focus()` nel gestore. Finche' il dialogo e' montato, il focus trap di react-aria riporta
  il focus dentro il dialogo. Il fix segna l'intento e sposta il focus dopo il render che ha chiuso il dialogo, con un
  effetto.
- **Severita' finale**: MINORE, come l'analogo V2 della passata 2 del delta del 21/10.

#### X2: Il focus si perde anche con "Modifica i filtri" dello stato vuoto e poi "Applica i filtri"
- **Verdetto**: DUPLICATO di A1 (assorbito). Il suo fix (un solo punto, usato da onMostraSolo, onApplica dal vuoto e
  onCampagna) e' quello adottato.
- **Severita' finale**: vedi A1

### Altri finding

#### V3: Pagina delle determine senza il test dello stato di caricamento
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Il describe RF020 (`determine/page.test.tsx:36-139`) copre gli stati senza codice, vuoto,
  domanda chiusa, 404, 400 e 503, ma non il caricamento. Lo stato e' tra quelli obbligatori del wireframe approvato
  (`determine.md:73`) e la skill step7 lo chiede per ogni route ("stato empty/loading/error"). Anche
  `tests/fisico-ui.test.tsx` non lo copre. Il ramo usa `VistaQuery` del kit, quindi il rischio di comportamento e' basso:
  resta MINORE.
- **Severita' finale**: MINORE

#### A2: Il test dichiara il codice "nel percorso codificato" ma usa solo cifre
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Per una stringa di sole cifre `encodeURIComponent` non cambia nulla, quindi il test (`tests/fisico-api.test.tsx:39-53`)
    passerebbe anche senza la codifica (`api/index.ts:49`). Il client orval non codifica (`fisico.ts:63`).
  - La convalida a monte (`codiceABarreValido`) oggi protegge, quindi non c'e' un rischio reale: MINORE, non MAGGIORE.
  - Delle due correzioni proposte resta quella del test con un valore costruito ad arte. Togliere "codificato" dal titolo
    e' scartato: la codifica e' un requisito gia' stabilito (A-01 della review dell'elenco).
- **Severita' finale**: MINORE

#### X3: Vista Tabella: l'ordine iniziale parte dagli interventi senza superfici e dalla campagna piu' vecchia
- **Verdetto**: ACCETTATO, con la citazione corretta
- **Motivo**: verificato sul codice.
  - `TabellaSuperfici.tsx` ha 105 righe: la riga 184 citata non esiste. `<TabellaInterattiva` e' alla riga 85, il piede
    `'decrescente'` alla riga 76 (non 174-176). Le altre citazioni sono esatte, e il difetto si ritrova senza
    ambiguita', quindi lo accetto alla riga corretta invece di rigettarlo.
  - Senza `ordineIniziale` la tabella ordina per Intervento crescente (`TabellaInterattiva.tsx:206-209`), con
    ordinamento stabile sulle campagne in ordine crescente (`superfici.ts:99-104`). Il risultato e' SRA29, poi SRB01
    2024, poi SRB01 2025.
  - Il wireframe approvato ha SRB01 2025, SRB01 2024, SRA29 (`superfici.html:155-157`), e il piede della tabella stessa
    parte dal 2025.
  - Il test fissa l'ordine sbagliato (`tests/fisico-ui.test.tsx:68`).
- **Severita' finale**: MINORE

#### X4: Valori dei filtri non disponibili e risposta senza righe: il gruppo Intervento dice "Nessuna voce corrisponde alla ricerca."
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `senzaVoci` vale per OG, OS, OP e azione (`GruppiProgramma.tsx:116-117, 135-136`), non per Intervento (riga 122).
  - Con TX-0060 in errore le voci vengono dai codici della risposta (`PannelloFiltriSuperfici.tsx:40-42`). Se la risposta
    e' vuota, `Caselle` scrive il messaggio della ricerca (riga 78) anche senza un campo di ricerca (riga 59).
  - E' proprio lo stato da cui "Modifica i filtri" apre il pannello. La nota `role=status` in cima dice gia' che i valori
    mancano, quindi il danno e' limitato: resta MINORE.
- **Severita' finale**: MINORE

#### H1: I controlli del pannello dei filtri sono in entities/filtri, restano copiati nell'elenco e il fisico ne scrive una terza variante
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `Gruppo`, `Caselle` e `Chip` (`GruppiProgramma.tsx:40-97`) ricalcano `controlli.tsx:19-75` dell'elenco, e le copie
    divergono gia' (segnaposto, lista vuota, `disabled`).
  - `GruppoCampagna` (`PannelloFiltriSuperfici.tsx:24-37`) riscrive `Scelte` con `esclusive`.
  - Per la checklist una duplicazione oltre 30 righe varrebbe MAGGIORE. Tengo MINORE perche' la copia c'era gia' prima
    del perimetro: il pannello del finanziario a 96cb36a aveva `Gruppo`, `Caselle` e `Chip` (righe 23, 35, 67). Lo
    spostamento non ha introdotto il duplicato e non c'e' un comportamento sbagliato.
- **Severita' finale**: MINORE

#### H2: La regola interventi - azioni e la bozza del pannello sono ricopiate dal finanziario
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `useCriteriNellIndirizzo.ts:17-40` ripete `useFiltriNellIndirizzo.ts:16-39` del finanziario:
  gate, `legameIgnoto`, `inAttesa`, chip con `AZIONE_NON_APPLICATA`. Anche la bozza del pannello ripete quella del
  finanziario (`PannelloFiltriSuperfici.tsx:58-67` contro `PannelloFiltri.tsx:16-23`). Sono circa 20 righe, oltre la
  soglia di 15. Il duplicato e' nuovo, introdotto dalla feature.
- **Severita' finale**: MINORE

#### H3: Calcoli sui dati di TX-0018 scritti nei componenti invece che in lib/
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. I punti sono:
  - `notaPremio` (`SuperficiAmmissibili.tsx:113-121`): il ramo "nella tabella equivalente" non ha test;
  - la scelta delle campagne dell'anteprima (`AnteprimaIntervento.tsx:27-29`);
  - il plurale delle domande (`SuperficiAmmissibili.tsx:70`);
  - `descrizioneDi` (riga 265);
  - `valoriDei` e `campagneProposte` (`PannelloFiltriSuperfici.tsx:40, 70`).

  C'e' un precedente: H-14 della review v1 dell'elenco.
- **Severita' finale**: MINORE

#### H4: Componenti oltre la soglia di 30 righe
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `Grafici` 132-185 (54 righe), `CercaDomanda` 13-62 (50), `SuperficiAmmissibili` 255-300 (46),
  `KpiCampagna` 66-110 (45), `PannelloFiltriSuperfici` 74-115 (42). Nessuno supera 60 righe, quindi MINORE per la
  checklist. Si sovrappone a H3 sui KPI: le due correzioni vanno fatte insieme.
- **Severita' finale**: MINORE

#### H5: Gli ettari si scrivono in due modi
- **Verdetto**: ACCETTATO. La parte che riguarda l'elenco e' la decisione D2.
- **Motivo**: verificato.
  - Nel fisico `testoSuperficie` (`fisico/lib/formato.ts:9`) e' identica a `ettari` del kit (`primitive.ts:81`), e il
    fisico le usa entrambe.
  - L'elenco scrive `${formatNumber(v)} ha` (`elenco-operativo/lib/formato.ts:95`), cioe' "12,5 ha". Il wireframe
    approvato della scheda dice "12,40 ha / 12,10 ha" (`dettaglio-domanda.html:92`), e il test fissa "12,5 ha"
    (`elenco-operativo-lib.test.ts:218`).
- **Severita' finale**: MINORE

#### H6: La testata di dettaglio delle determine e' ricopiata dalla scheda della domanda
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `DetermineDellaDomanda.tsx:41-66` ripete il markup di `SchedaDomanda.tsx:52-76`: hero, eyebrow,
  h1 con ref, lista dei badge, azioni. Sono 14 righe, quindi duplicazione sotto soglia, che la checklist classifica
  MINORE. C'e' un precedente: H2 della passata 2 del delta del 21/10.
- **Severita' finale**: MINORE

#### H7: I predicati del fisico usano lo scaffolding makeRolePredicate
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `predicates.ts:2` dice "nessun uso in produzione", ma `grant.ts:6, 21-26` lo importa.
  - Il commento di `grant.ts:3` parla di "fine || coarse", mentre `hasGrant` e' `roles.includes(grant)` (`stato.ts:20`).
  - Il comportamento e' identico a quello dell'elenco.
- **Severita' finale**: COSMETICO

#### H8: Il riconoscimento del problem-type e' riscritto cinque volte
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. La stessa espressione compare in `fisico/api/index.ts:53, 58`,
  `elenco-operativo/api/index.ts:91, 102` e `finanziario/api/index.ts:145`. Sono una riga ciascuna, senza difetto.
- **Severita' finale**: COSMETICO

## Riepilogo

- Accettati: 14
  - MAGGIORE 1: V1.
  - MINORE 11: V3, A1, A2, X3, X4, H1, H2, H3, H4, H5, H6.
  - COSMETICO 2: H7, H8.
- Assorbiti come duplicati: 3 (V2 e X1 in V1, X2 in A1).
- Rigettati: 0
- Declassati: 0. H1 resta MINORE anche se supera la soglia delle 30 righe, perche' il duplicato c'era gia' prima del
  perimetro.
- Punteggio atteso (`review-score.sh FULL`): 100 - 15 - 33 - 2 = **50**. Il verdetto e' **FAIL**, per il MAGGIORE e per
  lo score sotto 80.
  - Anche senza V1, gli 11 MINORE da soli lascerebbero lo score a 65.
  - Per convergere serve chiudere V1 e lasciare al piu' 6 penalita' da 3 punti, con i 2 COSMETICO.

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Parti di finding accettati che non accolgo, o che toccano scelte approvate:
- **V1**, la correzione del testo dello stato vuoto con la campagna. Il testo e' quello del wireframe approvato
  (`superfici.html:215`) e il codice non lo tradisce. Non e' un finding: e' la decisione D1.
- **X1**, una seconda lettura senza filtro per mostrare le altre campagne nel drawer. Contrasterebbe con la scelta
  approvata "una lettura di TX-0018 per pagina" e con le campagne del pannello "quella o tutte". Il fix accettato si
  limita a non disegnare la serie e a dirlo.
- **A2**, l'alternativa di togliere "codificato" dal titolo del test. E' scartata, perche' la codifica e' un requisito
  (A-01 dell'elenco).
- **H5**, la parte sull'elenco operativo. Cambia una resa di una feature gia' chiusa in review, quindi e' la decisione D2.
- **X3**, la citazione `TabellaSuperfici.tsx:184`. Non esiste: l'ho corretta alla riga 85, e il finding e' accettato.

## Decisioni da chiedere all'utente

- **D1, testo dello stato vuoto con il filtro Campagna** (flusso superfici approvato; codice
  `SuperficiAmmissibili.tsx:202-205`; test `superfici/page.test.tsx:165-170`).
  - Il problema: il wireframe approvato dice "Nessuna superficie per gli interventi scelti nella campagna 2025: gli
    interventi non sono a superficie o non sono SIGC (non valorizzato)" (`superfici.html:215`). Con il filtro, pero',
    il backend restituisce campagne vuote anche per interventi a superficie che hanno dati in altre campagne
    (SC-FS_SUPERFICIE_CAMPAGNA, con 2023: SRB01). In quel caso la seconda meta' della frase e' falsa.
  - **Raccomandazione**: con il filtro Campagna scrivere "Nessuna superficie per gli interventi scelti nella campagna N
    (non valorizzato). Togli il filtro Campagna per vedere le altre campagne.", con "Modifica i filtri". Senza filtro
    resta il testo attuale.
  - Serve un rework del flusso superfici, con nuova approvazione dell'hash: conviene farlo nello stesso giro del fix di
    V1, cosi' la riapprovazione e' una sola.
  - Lasciare il testo com'e' vorrebbe dire accettare un'affermazione falsa in un caso del pack: lo sconsiglio.
- **D2, resa degli ettari nell'elenco operativo** (H5; `elenco-operativo/lib/formato.ts:95`, test
  `elenco-operativo-lib.test.ts:218`).
  - **Raccomandazione**: si'. `testoSuperficie` dell'elenco usa `formatEttari`, con due decimali, e tiene "non
    valorizzata"; il test passa a "12,50 ha".
  - Non tocca nessun wireframe: allinea il codice al wireframe approvato della scheda (`dettaglio-domanda.html:92`) e al
    kit.
  - Tocca pero' una feature chiusa in review, quindi nel giro di correzione servono i test della scheda e dell'elenco
    verdi.
  - Se l'utente preferisce non toccare ora l'elenco, si fa solo la parte del fisico (`ettari` del kit al posto di
    `testoSuperficie`) e la parte dell'elenco va dichiarata tra i debiti.

## Note per il giro di correzione

- Ordine consigliato:
  1. V1, con D1 se approvata;
  2. A1;
  3. i MINORE del fisico (V3, A2, X3, X4, H2, H3 con H4, H6);
  4. per ultimi H1 e H5, che toccano anche elenco e finanziario.
- Ogni modifica invalida le approvazioni sha256 del gate. Bisogna rieseguire lo step8 (11/11) prima della iterazione 2
  della review. Se D1 e' approvata, il flusso superfici va riapprovato prima dello step8.
- Finanziario ed elenco compaiono tra i finding solo in H1, H2, H5, H6, H8 e X4, e nessuno di questi e' una regressione
  di comportamento delle due feature. Nessuna lente ha segnalato regressioni, e le verifiche che ho fatto non ne
  mostrano. I fix di H1, X4 e D2 toccano il loro codice: i loro test devono restare verdi.
