# Judge: review step9 FULL sul delta delle note di Leonardo del 10/11/2026 (passata 2 mirata)

Scritto l'11/11/2026, 17:06 ora locale (16:06Z).

Perimetro: `git diff 9b759da HEAD -- src tests wireframes uiplan.json route-manifest.json`.
- Wireframe riapprovati e step1: 886753a.
- Codice: c0b3cd9 (barre impilate), 1e3578f (gauge e Sankey), 8a3325d (Importi per anno e avviso).
- Test: 16c8e00.
- Stati e report dei gate: 564edfc, b7202c4, 1a45cb2 (step8 11/11 del finanziario), 5c26bd2.

Ho verificato il codice a HEAD 5c26bd2, in sola lettura (git diff/show, grep, lettura dei file). Per J-08 ho riletto
`AlgoritmoRichiestoAmmesso` in `../cruscotto-lazio-be`, sempre in sola lettura. I contrasti li ho ricalcolati con la formula
WCAG. Nel working tree ci sono solo i file non tracciati di questa review.

Ingresso:
- i 15 finding della passata 1 (J-01 ... J-15: 1 MAGGIORE, 12 MINORE, 2 COSMETICO; score 47, FAIL);
- gli esiti del verificatore (`verifica-passata2.json`): 15 chiusi;
- 2 finding nuovi del verificatore: N-01 (COSMETICO) e N-02 (MINORE).

Valgono le scelte dell'utente dell'11/11/2026 (`brief-passata2.md`). Non le ho riproposte come finding:
- "Pagato (lordo)" nel Sankey;
- "non valorizzato" nelle due tabelle di Importi per anno;
- i wireframe riapprovati alle 15:35:12Z;
- il gauge con "dotazione" al centro, l'importo corto all'arco e il raggio al 48 %;
- la barra intera dei lordi in grigio ardesia.

- **Intensita'**: FULL (feature con authz e scoping, come nella passata 1).
- **Cross-model**: `cross_model_review` non e' nella config, quindi e' disabled. Salto tracciato.

## 1. Gate non declassabili (prima del giudizio)

- **Data-access type-safe (jOOQ/Oracle)**: non si applica. E' una regola del backend.
- **Fedelta' dell'autorizzazione**: `check-ui-authz.sh` e `fe-project-check.sh --built --catalog` sono PASS oggi. Nessun
  FAIL_AUTHZ.
  - Le correzioni non toccano `src/app`, `src/shared/api`, `route-manifest.json` ne' `e2e` (diff vuoto su quei percorsi).
  - Nei `ConGrant` cambiano solo le costanti dei titoli (J-15); i grant restano gli stessi.
- **`contextProjection` come sicurezza, CSRF disattivato, XSS**: nel diff di `src` non c'e' nessuna occorrenza di
  `dangerouslySetInnerHTML`, `contextProjection` o CSRF.
- **Step8**: 11/11 pass su 1a45cb2 (lint, typecheck, test 1767, a11y, build, fsd_import, orval_types, security, authz,
  wireframe_approved, req_coverage_ui). Non l'ho rilanciato.

Esito: nessun CRITICO imposto dai gate.

## 2. Esiti della passata 1 (J-01 ... J-15)

Ho ricontrollato sul codice ogni esito del verificatore, con la riga della correzione e il test che la prova.

### Barre dell'intervento

- **J-01: CHIUSO** (era MAGGIORE).
  - **Codice**: `LORDI_INTERA = COLORI.attenuato` (#546474, intervento.ts:30), usato solo dalla barra intera dei lordi (:103).
    Il testo resta bianco (`intera`, :79-81).
  - **Contrasto ricalcolato**: bianco su #546474 da' 6,08:1. Le altre coppie: netti 5,57, rettifiche 5,38, dotazione intera
    14,0, residuo col testo scuro 10,75. L'ardesia resta distinta dall'arancio delle rettifiche (scelta dell'utente).
  - **Test**: finanziario-grafici.test.ts:1008-1028 misura il contrasto di ogni serie nelle tre forme (divise, senza rettifiche,
    residuo assente).
- **J-02: CHIUSO**.
  - **Codice**: `itemStyle { borderColor: COLORI.superficie, borderWidth: 1 }` in `serieSegmento` (barre-impilate.ts:88), comune
    ai due grafici.
  - **Test**: :1025 nelle tre forme.
  - **Residuo**: il bordo non e' asserito anche su Importi SIGC, come chiedeva il fix. Viene dalla stessa `serieSegmento`, quindi
    non e' un finding.
- **J-03: CHIUSO**.
  - **Codice**: `sottotitoloBarreIntervento` (intervento.ts:111-121) usa le stesse `divisioni` (:84-87) di `segmentiIntervento`,
    e restituisce null se il grafico non si disegna.
  - **Uso**: in Sintesi (DettaglioIntervento.tsx:159 e :172). `BARRE_INTERVENTO` non esiste piu'.
  - **Test**: :1030-1037 (divise, senza rettifiche, residuo assente, ADA, negativi).
- **J-12: CHIUSO**.
  - **Codice**: il modulo `barre-impilate.ts` contiene `Segmento<B>`, gli helper e `opzioniBarreImpilate` (:101-111). Lo usano
    sigc.ts (`Segmento<'Richiesto' | 'Ammesso'>`) e intervento.ts (`Segmento<Barra>`). Nessuna copia resta in sigc.ts.
  - **Test**: parametrizzato sui due grafici (:1426-1435).
  - **Residuo**: `barre: readonly string[]` non e' legato a B. Il fix non lo chiedeva, quindi non e' un finding.
- **J-14: CHIUSO**.
  - **Codice**: `Segmento.intera` (barre-impilate.ts:36). Niente quota (:63-65) e suggerimento col solo importo (:73-75).
  - **Test**: :956-957.

### Gauge, flusso e testi

- **J-04: CHIUSO**. La fonte e' "Fonte: TX-0011, pagamenti al netto delle rettifiche" (DettaglioIntervento.tsx:167).
  - Il wireframe intervento.html e' riapprovato.
  - **Test**: interventi/page.test.tsx:76.
- **J-05: CHIUSO nel comportamento**.
  - **Codice**: raggio al 48 % (avanzamento.ts:198) e `puntoFineArco` a 112 + 50|cos| + 26|sin| (:169).
  - **Importo corto**: `importoEtichettaGauge` (:178-184).
  - **Geometria ricalcolata a 390 px** (lato minore circa 318 px, raggio circa 76 px): a 0 % l'etichetta resta dentro.
  - **Verifica a vista**: fatta a 390 e 1600 px (brief). Il PNG copia le stesse dimensioni (echarts.ts:100-102).
  - **Residuo**: il test di geometria usa un raggio scritto nel test, non quello delle opzioni. Passa a **P2-01** (da N-02).
- **J-06: CHIUSO**, come la scelta dell'utente.
  - **Codice**: `[IMPEGNATO, 'Pagato (lordo)', ...]` (avanzamento.ts:82) ed etichette su due righe (:133).
  - **Testi derivati**: aria, collegamenti e voci omesse prendono il nome nuovo. Nessun altro codice cita il nodo per nome
    (grep su src ed e2e).
  - **Test**: :727-737.
- **J-07: CHIUSO**.
  - **Codice**: la caption di Parti e' `${titolo}, ${grafico}` (AvanzamentoReport.tsx:197), e il sottotitolo visibile non
    cambia. I sottotitoli passati a Parti (:210-233) non iniziano con sigle, quindi la minuscola iniziale e' innocua.
  - **Gauge**: caption "Pagamenti netti sulla dotazione spesa pubblica" e voce "Percentuale della dotazione pagata (netto)"
    (avanzamento.ts:148-149).
  - **Test**: avanzamento/page.test.tsx:82 vuole una sola regione col nome della card del gauge.
- **J-13: CHIUSO**.
  - **Codice**: `graficoGauge` e `serieGaugeConDotazione` non esistono piu' (grep su src, tests ed e2e). Il ramo ADA e' inline
    (avanzamento.ts:237).
  - **Test**: netti negativi SRD11, dotazione 0 e -5 (:896-902); motivi su `graficoPagatoNetto` (:1380-1384). `puntoFineArco`
    resta esportato ma e' testato direttamente (:865, :875).
- **J-15: CHIUSO**. `TITOLO_GAUGE_PAGAMENTI` e `SOTTOTITOLO_GAUGE_PAGAMENTI` (avanzamento.ts:144-145) arrivano dal barrel.
  - Le copie locali e il commento "R15" sono tolti (grep).

### Avviso, Domande e test

- **J-08: CHIUSO**.
  - **Codice**: AvvisoImpegnati.tsx:23. Ho riletto il backend: CHIUSO prende il pagato (o l'ammesso col pagato a zero); gli altri
    stati prendono ammesso o richiesto secondo la tabella; i NO SIGC prendono PROSA, in sua assenza l'ammesso SIAN. Il testo e'
    un riassunto esatto.
  - **Wireframe**: dotazione e riepilogo riapprovati.
  - **Test**: riepilogo/page.test.tsx:111 e revisioni-20261104.test.tsx:34.
- **J-09: CHIUSO**, come la scelta dell'utente ("non valorizzato").
  - **Codice**: `IMPORTI_PER_ANNO` (domande.ts:88-92) alimenta le linee, `COLONNE_IMPORTI_PER_ANNO` e `COLONNE_IMPORTI` di
    DomandeReport.tsx:221-224. `TITOLO_ANNO_DI_RACCOLTA` vale per le due tabelle (:281).
  - **Test**: domande/page.test.tsx:126-148, con le stesse intestazioni e lo stesso testo per uno stanziato NON_VALORIZZATO.
- **J-10: CHIUSO**.
  - **Codice**: `<div className="ui-tabelle-compatte">` attorno alla Griglia della scheda Domande (DettaglioIntervento.tsx:354-364).
  - **Test**: interventi/page.test.tsx:81-83.
  - **Resta da fare a mano**: la verifica a vista a 1366 px. Gli esiti misurati sono a 390 e 1600 px. E' un controllo umano,
    non un difetto del codice. Se la tabella scorre ancora, la card a tutta larghezza e' una decisione dell'utente.
- **J-11: CHIUSO**.
  - **Sankey**: `layoutIterations === 0` e "Pagato (lordo)" prima di "Da pagare" (:736-737).
  - **Domande**: RF010 e RF008 dentro `.ui-tabelle-compatte` e `.ui-griglia--1` (domande/page.test.tsx:144-147). Nessuna classe
    compatta in Avanzamento (avanzamento/page.test.tsx:84).
  - **Lordi oltre la dotazione**: somme 10 M e 11 M, e `xAxis.max` assente (:999-1006).
  - **Residuo minimo**: l'assenza della classe e' provata solo in Avanzamento. Il grep la trova solo in DomandeReport e nel
    dettaglio (voluta da J-10), quindi non e' un finding.

**Esiti**: 15 chiusi su 15. L'unico residuo con peso e' il test di J-05, in P2-01.

## 3. Finding nuovi (N-01, N-02)

#### N-02: il test di J-05 usa un raggio scritto nel test
- **Verdetto**: ACCETTATO, diventa **P2-01**.
- **Motivo**: verificato.
  - Le righe tests/finanziario-grafici.test.ts:871-872 fissano `raggio = 0.48 * meta`. Il ciclo chiama solo `puntoFineArco`.
  - Nessun test asserisce `radius` o `center` del gauge: il grep trova solo le ciambelle (`['52%', '78%']`), e il tipo
    `SerieGauge` (:840) non ha quei campi.
  - Il fix di J-05 chiedeva un test col "raggio risultante". Ricalcolo: col raggio al 58 % l'etichetta a 0 % andrebbe a
    1,58 x 0,58 x 159 + 32,5, circa 178 px su 159, e il test passerebbe lo stesso.
- **Severita'**: il comportamento e' giusto oggi, e l'ha verificato l'utente a vista. MINORE, con lo stesso metro di J-11 (un
  test che non prova cio' che promette).
- **Riformulazione**: fix piu' preciso. Aggiungere `radius` e `center` al tipo `SerieGauge`, e leggerli nel ciclo di :874.
- **Severita' finale**: MINORE.

#### N-01: importi del gauge ai bordi delle fasce e unita' miste centro/arco
- **Verdetto**: ACCETTATO, diventa **P2-02**.
- **Motivo**: verificato sul codice.
  - **Fasce** (avanzamento.ts:180-183): 1.200 € da' "1 mila €"; 14.999 € da' "0,01 M€"; fra 9.500 e 9.999 € viene
    "10 mila €", che ha 9 caratteri contro gli otto del commento di :174.
  - **Centro**: e' `importoBreve(t)` (:248), cioe' euro pieni sotto il milione (primitive.ts:91-92). Prima della correzione
    anche l'arco usava `importoBreve`; le due unita' miste nascono col fix di J-05 (diff di :248).
  - **Larghezza**: a 390 px il centro "950.000,00 €" a 22 px grassetto e' al limite del raggio libero (circa 60 px). E' una
    stima, non osservata, e la riporto come tale.
- **Scelta dell'utente**: le forme corte sono approvate l'11/11 con quattro esempi ("134,6 M€", "0,19 M€", "9 mila €", euro
  sotto mille). Il finding non le contesta: riguarda i bordi delle fasce, che gli esempi non mostrano, e l'unita' del centro, su
  cui la scelta non dice nulla. Il fix lascia veri i quattro esempi, ma cambia due fasce, quindi va confermato dall'utente prima
  di applicarlo.
- **Riformulazione**: l'evidenza era in quattro punti, l'ho ridotta a tre frasi. Nel fix l'euro intero sotto i 2.000 € e'
  esplicito (`formatNumber(Math.round(v))`, perche' `formatEuro` darebbe 10 caratteri).
- **Severita'**: tabella equivalente e aria hanno i valori pieni, e la percentuale e' esatta. COSMETICO.
- **Severita' finale**: COSMETICO.

**Riepilogo dei nuovi**: 2 accettati su 2, 0 rigettati, 0 declassati. Nessuno era CRITICO.

### Difetti evidenti mancati

Nessuno. Ho controllato anche questi punti:
- **Bordo bianco**: vale anche per Importi SIGC. Aggiunge solo un separatore di 1 px, senza cambiare colori, etichette o
  griglia, e i test di sfondo e contrasto di Importi SIGC restano veri (:1437-1464).
- **Sottotitolo delle barre**: con ADA e stimato resta solo la coda sull'impegnato. Senza nulla e' `undefined`, quindi non c'e'
  un sottotitolo vuoto.
- **Legenda delle barre**: le due serie "Pagamenti netti" hanno lo stesso nome e lo stesso colore, quindi una sola voce di
  legenda, come nella passata 1.
- **Caption di Parti**: la nuova caption non entra nel nome del file ne' nei suggerimenti. Il `name` della serie non si vede.
- **Avviso**: il testo dei due test coincide col componente e col wireframe riapprovato.
- **PNG del gauge**: `pngDelGrafico` copia larghezza e altezza della sorgente, quindi raggio ed etichette sono gli stessi dello
  schermo.

## 4. Finding restanti (passata 2)

Sono in `review/delta-note-leonardo-2026-11-10/finanziario-findings.json`.

| id | severita' | file:riga | titolo breve | da |
|---|---|---|---|---|
| P2-01 | MINORE | tests/finanziario-grafici.test.ts:871 | test di geometria del gauge con raggio scritto nel test | N-02 (J-05) |
| P2-02 | COSMETICO | src/features/finanziario/lib/grafici/avanzamento.ts:178 | importi del gauge ai bordi delle fasce, unita' miste centro/arco | N-01 |

## 5. Finding contestati (CRITICO rigettati)

Nessuno. In ingresso non c'erano CRITICO, e non ho rigettato nessun finding.

## 6. Verdetto

Il verdetto e' di `review-score.sh FULL review/delta-note-leonardo-2026-11-10/finanziario-findings.json`, lanciato dal Judge
con `tools/vendor` in testa al PATH:

```
{"intensity":"FULL","critico":0,"maggiore":0,"minore":1,"cosmetico":1,"score":96,"threshold":80,"verdict":"pass"}
exit=0
```

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | soglia | verdetto |
|---|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 1 (P2-01) | 1 (P2-02) | 96 | 80 | **PASS** |

**Confronto con la passata 1**: da 47 FAIL (1 MAGGIORE, 12 MINORE, 2 COSMETICO) a 96 PASS.

Il gate e' superato: 0 CRITICO, 0 MAGGIORE e score almeno 80. Lo step9 del finanziario per il delta dell'11/11/2026 si puo'
registrare come done, con `state-set.sh` e `gates={review:"pass"}`. I due finding restanti sono debito tracciato, non
bloccante.

## 7. Note per il prossimo giro

1. **P2-01**: si corregge subito, senza approvazione. Tocca solo il test.
2. **P2-02**: prima serve la conferma dell'utente sulle due fasce nuove ("1.200 €", "0,015 M€") e sul centro in forma corta
   sotto il milione. Poi la verifica a vista a 390 px di un intervento con dotazione sotto il milione.
3. **J-10**: resta da fare la verifica a vista a 1366 px della scheda Domande del dettaglio (vista Tabella delle due card).
   Se la tabella scorre ancora, la card a tutta larghezza e' una decisione dell'utente.
