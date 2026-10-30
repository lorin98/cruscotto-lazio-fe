# Feature fisico: step3-7 di green-fe del 30/10/2026 (riallineamento degli ambiti)

Partenza: `.claude/state/green-fe-fisico.state.json` a `current_step` 3, HEAD `5baf660` (step2 fatto per le cinque feature;
le pagine dell'output regionale e delle Unit Amount gia' spostate nel fisico con lo stesso comportamento di prima, le
determine uscite). Fonti, in quest'ordine: i quattro wireframe approvati il 30/10/2026 (`wireframes/fisico/{superfici,
output-regionale,unit-amount,intervento}`) e `plan/fisico/uiplan.json`; il dossier `plan/fisico/dossier-wireframe.md`
(scelte 1-5 dell'utente, tutte A, e "Cosa dovra' cambiare a step6"); il resoconto dello step2. Eseguiti gli step 3-7
seguendo le skill del plugin (`step3-api` ... `step7-test`); gate e transizioni scritti solo con `state-set.sh` e
`state-transition.sh`, ogni gate nello stesso blocco bash del suo `state-set`. La feature e' a `current_step` 8: **step8-gate
e review step9 restano alla sessione principale**. Commit su `main`, nessun push; app spenta, nessun BE o FE avviato.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step3-api | api_wrappers_compile, querykey_from_factory | nessun wrapper nuovo: il dettaglio usa `useOutputRegionale`, `useSuperfici`, `useUnitAmount` col solo intervento della route e gli export esistenti; commenti di TX-0030 allineati all'azione portante. Gate registrato senza codice nuovo da generare |
| step4-lib | lib_pure_compile, lib_zero_react | `lib/intervento`, `lib/collegamenti`, `graficoSuperficiDellIntervento`, `criteriDellIntervento`, `GRANT_DETTAGLIO`, `puoAprireIntervento`; tolto `importiOrdinati` (codice morto del porto) |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei quattro flussi ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash` dello stato (superfici `27c92633...`, output-regionale `6451a941...`, unit-amount `8e0da11f...`, intervento `7d553105...`) |
| step6-page | pages_compile, route_manifest_valid | `fe-project-check.sh . --feature fisico --catalog handover/authz-catalog.json` rc 0 (verdict pass); `plan/fisico/route-manifest.json` proiettato (4 route, 10 azioni, pack 1.4.0) e validato con jv |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RA006, RF017, RF018, tutti con describe taggato (anche RF030). Il blocco della SKILL com'e' da' `msw_setup_assente`, un falso negativo del plugin: registrato col blocco adattato (punto 1 sotto) |

Verifica finale: `npx tsc --noEmit`, `npm run lint` e `npx eslint . --max-warnings 0` verdi; `npx vitest run` verde due volte
di seguito (77 file, 1575 test; erano 1533). Wireframe, uiplan, dossier, `handover/`, `specs/`, backend, plugin e stati
delle altre feature non toccati (`git diff 5baf660 -- .claude/state` tocca solo il fisico). Copertura v8 di
`src/features/fisico/**` (misura locale sui test del fisico): 93,9 % istruzioni, 84,7 % rami, 95,2 % funzioni, 95,2 % righe.

## Commit (in ordine)

`8d0fa45` step3; `588b22e` step4; `b099769` step5; `e540245` card Fisico della Home (aree.ts, commento del menu, test del
catalogo); `2d2b5c7` step6; `72fb443` step7; questo resoconto.

## Novita' implementate, per flusso

**intervento** (flusso nuovo, scelta 1 A): `/fisico/interventi/:codice`, `src/pages/fisico/interventi/page.tsx`,
`ui/DettaglioIntervento.tsx`, `ui/SchedeIntervento.tsx`.
- Route-table: flusso `intervento`, visibility `csr.tx-0017.read`, `csr.tx-0018.read`, `csr.tx-0030.read` (almeno uno, come
  `RequireGrant`), azioni TX-0017, TX-0018, TX-0030 e TX-0060 hide-by-role coi grant verbatim. Non e' una voce di menu.
- Il codice del percorso si convalida prima di leggere (`codiceDelPercorso`); fuori formato, anche con '/', la pagina
  "Intervento non valido" (entities/filtri) e nessuna richiesta.
- Barra "Riferimenti dei dati" senza filtri: perimetro e "Dati al" della prima risposta arrivata fra TX-0017, TX-0018 e
  TX-0030 (SC-FS_ULTIMO_DATO); "non disponibile" se le letture della pagina sono tutte in errore.
- Percorso Home > Fisico > codice; testata con sopratitolo "Fisico - intervento <codice>", un solo h1 (descrizione di
  TX-0060, se no "Intervento <codice>") col focus e il titolo del documento "Intervento <codice> - Fisico"; badge
  "Perimetro regionale" e "Indicatore di output O.14 (ettari)" (TX-0017; "non valorizzato" senza indicatore); i tre
  pulsanti `output-regionale-intervento`, `superfici-intervento`, `unit-amount-intervento` verso i report con
  `?intervento=<codice>`, ognuno solo col grant della destinazione.
- KPI x4: target di fine periodo (TX-0017, o l'assenza in una frase); superficie DS, superficie DP e domande con DP oltre
  la DS della campagna piu' recente della riga di TX-0018, con le domande nel testo di supporto (la quota oltre/pagamento
  solo nel testo, nessuna barra); un intervento senza superfici ha i tre KPI "Non valorizzato: intervento non a superficie
  o non SIGC", mai zero; sotto, la nota sulla campagna di riferimento.
- Schede (react-aria, frecce da tastiera), ognuna col grant della sua transazione: "Output per anno" (barre raggruppate col
  target come linea e come riga della tabella equivalente, anni senza valore dichiarati; PNG "il grafico Output
  programmato e realizzato per anno", CSV e XLSX "l'output e gli importi unitari dell'intervento <codice>"),
  "Superfici per campagna" (linea DS e DP, tabella equivalente coi sette dati del wireframe dalla campagna piu' recente,
  quantita' a premio detta nella fonte; PNG, CSV, XLSX "le superfici dell'intervento <codice>"; senza superfici lo stato
  dichiarato), "Unit Amount" (otto colonne, la Unit Amount intestazione di riga; CSV e XLSX "le Unit Amount
  dell'intervento <codice>"; senza Unit Amount lo stato dichiarato del wireframe).
- Letture: TX-0017 e TX-0018 all'apertura (KPI e badge), TX-0030 alla prima apertura della sua scheda (o subito, se e' la
  sola lettura del profilo); le schede leggono dalla stessa cache. TX-0060 solo col suo grant.
- Stati: caricamento (scheletro `role=status` `aria-live=polite`), errore (un solo avviso della pagina col problem-type e
  Riprova; ogni lettura vi registra il suo errore una volta, la scheda il testo statico, le altre schede restano),
  intervento senza dati (AT001) con "Torna all'output regionale" (o al primo report che il profilo apre).

**unit-amount**: i cinque filtri dei report fisici, azione portante compresa (SC-FS_UNIT_AMOUNT_AZIONE; la regola comune
del legame interventi - azioni di entities/filtri, come nelle superfici); pannello "Filtri dei report fisici"; vuoto
"Nessuna Unit Amount per i filtri scelti (per esempio un'azione portante senza interventi collegati)."; fonte della card
"con intervento, obiettivi e azione portante della pagina"; nel drawer la descrizione dell'intervento (TX-0060) e "Apri il
dettaglio dell'intervento" (`dettaglio-intervento-unit-amount`). "Dati al" (dalla risposta di TX-0030, gia' fatto allo
step2): verificato, invariato.

**output-regionale**: nel drawer la descrizione dell'intervento (TX-0060) e "Apri il dettaglio"
(`dettaglio-intervento-output`); pannello "Filtri dei report fisici"; definizioni sotto la tabella col testo del wireframe
(D-03 valida anche nel fisico, gli strutturali, D-04, e il rimando degli importi unitari alla pagina Unit Amount,
OP-FIS-15).

**superfici**: nell'anteprima, accanto a "Mostra solo", "Apri il dettaglio dell'intervento" (`dettaglio-intervento-superfici`).
Il resto e' invariato (flusso approvato byte per byte salvo menu, link e card).

**Home e menu** (`src/app/aree.ts`, voce fisico): descrizione e contenuti della `home.html` approvata e del dossier,
commento G1 aggiornato al verbale del 29/10/2026, `ricercaConservata: ricercaDeiSoliFiltri` (scelta 4: i cinque filtri
restano passando dal menu, la campagna solo nelle superfici); `AnteprimaFisico` invariata; voce procedurale non toccata.
Menu invariato (Superfici ammissibili, Output regionale, Unit Amount, scelta 2).

**Codice morto tolto**: `filtriSenzaAzione`, la variante "senza azione" di `useFiltriDellaPagina` e di `PaginaReport`,
`importiOrdinati`. Delle determine nella feature restano solo commenti che dicono che sono del procedurale e un test che
verifica che non ci siano handler d'esempio di TX-0020.

## Scelte prese in autonomia

1. **Scheda d'arrivo dalle Unit Amount**: wireframe e doc di flusso dicono che il link porta al dettaglio "scheda Unit
   Amount", lo uiplan non ha `query` (la scheda non e' nell'indirizzo). Il link passa `{ scheda: 'unitAmount' }` nello
   state della navigazione (mai nell'URL); il dettaglio lo convalida e apre quella scheda. Dall'output e dalle superfici
   nessuno state: si apre la prima scheda.
2. **Nome accessibile dei KPI delle superfici**: il wireframe ha `aria-label="Superficie ammissibile delle domande di
   sostegno, campagna 2025"`, che non contiene l'etichetta visibile ("Superficie ammissibile DS, campagna 2025"). Seguita
   la regola del kit (WCAG 2.5.3, come nella pagina Superfici): "<etichetta visibile>: <sigle sciolte>".
3. **Celle del pagato nella scheda Unit Amount**: il low-fi ha "non disponibile (fonte non attiva)" in ogni cella; resa
   come nella pagina Unit Amount (scelta 8 approvata: nota unica sopra la tabella e "non disponibile" breve).
4. **Errore di una scheda**: il wireframe dice che "resta nella scheda e non ferma le altre"; fatto col meccanismo del kit
   gia' rivisto (un solo avviso della pagina con Riprova, testo statico nella scheda, le altre schede funzionano).
5. **Intervento senza dati**: deciso sulle letture della pagina (TX-0017 e TX-0018), perche' TX-0030 legge solo
   all'apertura della sua scheda; AT001 non e' in nessun report (SC-FS_FILTRI). Il ritorno e' all'output regionale, o
   alle superfici o alle Unit Amount secondo i grant del profilo.
6. **Link dei drawer col grant**: mostrati solo con almeno uno dei tre grant del dettaglio (`puoAprireIntervento`, la
   visibility della route). Nelle superfici e nell'output la pagina si legge anche senza quei grant nei test diretti dei
   componenti, quindi il "nascosto senza" e' provato; nelle Unit Amount il grant della pagina implica quello del
   dettaglio (il caso nascosto non si puo' produrre: provato nel predicato e negli altri due drawer).
7. **Titoli dei pannelli**: "Filtri dei report fisici" per output e Unit Amount (testo dei wireframe; lo step2 aveva
   "Filtri dell'output regionale" e "Filtri delle Unit Amount"); le superfici restano "Filtri delle superfici ammissibili".
8. Percorso "Fisico" verso la prima pagina dell'area visibile al profilo (le superfici per i profili del catalogo rev. 4),
   come il dettaglio dell'istituzionale; stato vuoto della scheda Superfici come avviso `role=status` (non dentro la card).
9. Fixture: `SUPERFICI_INTERVENTI` (SRA01 coi valori del wireframe, SRD01 NON_VALORIZZATO) e `lettureFisico` con TX-0018
   e il suo export; nei test, nessuna espressione regolare con apostrofi (vedi punto aperto 1).

## Contraddizioni fra le fonti

Nessuna contraddizione di contenuto fra wireframe, uiplan e dossier. Solo due differenze di forma risolte come sopra: il
nome accessibile dei KPI (scelta 2) e la "scheda Unit Amount" del link dichiarata dal wireframe ma senza parametri nello
uiplan (scelta 1).

## Punti aperti

1. **Difetto del plugin nel self-check di step7** (da segnalare al plugin, non toccato): `msw_setup_assente` e' un falso
   negativo. Lo stripper char-aware non riconosce le espressioni regolari ne' i template annidati e, sul flusso
   concatenato di tutti i file di `src/`, lo stato "dentro una stringa" passa da un file all'altro: lo aprono
   `src/features/finanziario/lib/grafici/domande.ts:130` (template annidato con "dell'"),
   `src/pages/finanziario/avanzamento/page.test.tsx` (commento a blocco) e cinque test di altre feature (espressioni
   regolari con apostrofi o virgolette), e `setupServer(` di `src/shared/api/mock/server.ts` sparisce. Lo stesso esito a
   `5baf660` e a `3b98fe1`: non dipende dal fisico e lo avranno anche le altre feature. Registrato col blocco della SKILL
   identico salvo lo stripper applicato file per file ai due corpora MSW (stessi corpora, stesse regex); pipefail non
   attivo. Gli script usati (step5, step6, step7 com'e' e adattato) sono in
   `ambiente-prova/strumenti-sessione-317ae849/gate-fe-step5-7/`.
2. **Controllo cross-feature di step5 con `output_dir` = "."**: il percorso risolto dall'awk perde il "./" iniziale e non
   combacia mai con `./src/features/*`, quindi il controllo non scatta (difetto del plugin, non toccato). Verificato a
   parte: nessun import della feature fisico verso un'altra feature.
3. **Step8 e step9** del fisico alla sessione principale. Il codice comune toccato e' solo `src/app/aree.ts` (voce fisico),
   un commento di `src/app/menu.tsx` e la route-table (una voce nuova).
4. **Altre feature** (dossier, "Note per le altre feature"): un eventuale link dal dettaglio dell'istituzionale verso
   `/fisico/interventi/:codice` va dichiarato nello uiplan dell'istituzionale; non fatto qui.
5. **Dev server**: i dati d'esempio di `api/mock/esempio.ts` coprono gia' le tre letture filtrate sull'intervento; il
   dettaglio non e' stato provato nel browser (app spenta).
6. Restano nello uiplan OP-FIS-04, 05, 11, 12, 13, 14, 15 (informativi o aperti, invariati).
