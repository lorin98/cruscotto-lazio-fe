# Judge: review step9 FULL sul delta delle note di Leonardo del 10/11/2026 (passata 1)

Perimetro: `git diff 0d928a6 HEAD` della sola feature finanziario.
- Wireframe: 93168fe.
- Codice: a6ebec1 (kit), b2a746d (Avanzamento), e43f7f9 (dettaglio), e33b69e (Domande), 74e119a (avviso).
- Test: 872c35d.
- Stati e report: b5b0f44, 2a099c3, 7f9d7dd, 3250e2d.

Ho verificato il codice a HEAD 3250e2d, in sola lettura. Nel working tree c'e' solo la cartella di questa review, non
tracciata. Per V-05 e X-04 ho letto anche `../cruscotto-lazio-be`, sempre in sola lettura (`AlgoritmoRichiestoAmmesso`,
`PostgresImpegnatoAdapter.rilevatiNoSigc`, `ResiduoSuPagamenti`). I contrasti li ho ricalcolati con la formula WCAG.

Ingresso: 22 finding, nessuno CRITICO.
- Lente V: 6.
- Lente H: 8.
- Lente A: 2.
- Antagonista: 6.

Il file dell'antagonista contiene solo X-01 ... X-06, senza obiezioni sulle severita' delle lenti. I quattro gruppi di doppioni
indicati nel mandato li ho verificati e uniti; le severita' le ho rivalutate io finding per finding.

- **Intensita'**: FULL (`review-intensity-fe.sh`: feature con authz e scoping).
- **Cross-model**: `cross_model_review` non e' nella config, quindi e' disabled. Salto tracciato.

## 1. Gate non declassabili (prima del giudizio)

- **Data-access type-safe (jOOQ/Oracle)**: non si applica. E' una regola del backend e questo e' un delta di frontend.
- **Fedelta' dell'autorizzazione**: `check-ui-authz.sh` e `fe-project-check.sh --built --catalog` sono PASS oggi. Il report
  dello step8 del finanziario (7f9d7dd) da' authz pass su 8 route, nessun FAIL_AUTHZ.
  - Il delta non tocca `src/app` (route-table) ne' `src/shared/api`.
  - Nei `ConGrant` cambiano solo i titoli (flusso, RF005); i grant restano gli stessi.
  - `AvvisoImpegnatiDellaSelezione` legge TX-0011 ancora solo con `hasGrant(GRANT.riepilogo)`.
- **`contextProjection` usata come sicurezza, CSRF disattivato**: il delta non tocca il mutator, il CSRF ne'
  `contextProjection`. Non ci sono `dangerouslySetInnerHTML` nuovi.
- **Step8**: 11/11 su 7f9d7dd: 1766 test, axe 0 su 140 run, wireframe_approved pass.
  - Gli e2e (`e2e/csp.spec.ts`) non citano testi cambiati dal delta.
  - Il caso del dettaglio aspetta due grafici nella scheda Sintesi. Il fixture ha rettifiche 0, quindi le barre si
    disegnano. Non c'e' una rottura come J-03 del 04/11.

Esito: nessun CRITICO imposto dai gate.

## 2. Valutazione dei finding

Ho verificato sul codice tutti i 22 finding: sono tutti veri. Unendo i doppioni restano **15 finding finali**, da J-01 a
J-15, in `finanziario-findings-passata1.json`. Ho riscritto in forma concreta due fix: J-05 (V-03) e J-10 (X-03).

### Colori ed etichette delle barre dell'intervento

#### J-01: contrasto dell'etichetta della barra intera dei lordi (V-01, H-01, A-01)
- **V-01**: ACCETTATO, e' la base di J-01.
- **H-01**: ACCETTATO, unito in J-01.
- **A-01**: ACCETTATO, unito in J-01.
- **Motivo**: verificato.
  - `segmento(LORDI, LORDI, lordi, lordi, COLORI.attenzione, COLORI.superficie, true)` e' a intervento.ts:86.
  - `serieSegmento` usa il colore del segmento come sfondo dell'etichetta anche fuori dalla barra (sigc.ts:247).
  - Bianco su #b26b00 da' 4,20:1; il testo scuro darebbe 3,88:1. Il tema non fissa `fontSize`, quindi le etichette sono a
    12 px e serve 4,5:1.
  - Lo stato si raggiunge: c'e' il test di riga 947, e il backend rende netto e residuo FONTE_NON_ATTIVA quando il database
    rettifiche e' vuoto (`ResiduoSuPagamenti`).
  - Il test di contrasto di J-02 copre solo `graficoImportiSigc`.
- **Severita' finale**: MAGGIORE. E' lo stesso metro di J-02 del 04/11: violazione misurata di NFR-70 (WCAG 1.4.3) su un
  testo visibile, introdotta dal delta, e il brief chiede proprio il contrasto delle barre.
- **Nel fix**: un colore distinto dalle rettifiche, ricalcolato: #f0b866 con testo scuro (9,12:1) oppure #a46300 col bianco
  (4,81:1). Riusare #9a5c00, come proponevano V-01 e A-01, darebbe ai lordi interi il colore delle rettifiche.

#### J-02: netti e rettifiche attigui con la stessa luminanza (V-06, A-02)
- **V-06**: ACCETTATO, e' la base di J-02.
- **A-02**: ACCETTATO, unito in J-02.
- **Motivo**: verificato.
  - Il rapporto fra #0066cc e #9a5c00 e' 1,04:1 (V-06 scrive 1,03 per troncamento).
  - `serieSegmento` imposta solo `itemStyle.color`, senza bordo.
- **Severita' finale**: MINORE. Etichette, tabella e descrizione aria attenuano; le due lenti concordano.

#### J-14: "(100 %)" e "Dotazione, dotazione" nelle barre intere (X-06)
- **X-06**: ACCETTATO.
- **Motivo**: verificato in intervento.ts:82 e :86 e in sigc.ts:240. Il caso nasce col riuso di `serieSegmento`.
- **Severita' finale**: COSMETICO.

#### J-12: barre impilate generiche dentro sigc.ts (H-02)
- **H-02**: ACCETTATO.
- **Motivo**: verificato.
  - Gli import sono a intervento.ts:16-17.
  - Le righe 113-122 copiano sigc.ts:284-296.
  - `Segmento.barra` passa da `'Richiesto' | 'Ammesso'` a `string` (diff di sigc.ts).
  - E' la causa per cui il test di contrasto di J-02 non ha preso J-01.
- **Severita' finale**: MINORE. E' duplicazione e accoppiamento fra moduli dello stesso segmento, non una violazione FSD.

### Testi e accessibilita' di gauge, barre e flusso

#### J-03: sottotitolo fisso delle barre (V-02, H-04)
- **V-02**: ACCETTATO, e' la base di J-03.
- **H-04**: ACCETTATO, unito in J-03. E' lo stesso difetto visto dal lato dei layer.
- **Motivo**: verificato in DettaglioIntervento.tsx:46 e :174.
  - Senza rettifiche il sottotitolo annuncia la scomposizione, mentre la nota sotto il grafico dice che netto e residuo non si
    disegnano.
  - Il wireframe (intervento.html) non fissa un sottotitolo per questa card. Il fix non cambia testi approvati.
- **Severita' finale**: MINORE.

#### J-04: il PNG del gauge del dettaglio non dice "netto" (X-01)
- **X-01**: ACCETTATO.
- **Motivo**: verificato.
  - A 0d928a6 `graficoPagatoNetto` delegava a `graficoGauge`, che scriveva "della dotazione pagato (netto)" nel disegno. Ora
    quel testo e' solo il `name` della serie.
  - `righeIntestazione` non porta il sottotitolo.
  - La fonte del dettaglio (riga 169) non qualifica l'importo.
  - La scelta approvata del netto si perde proprio nel file che esce dal cruscotto (NFR-50).
- **Severita' finale**: MINORE. Il testo della fonte nel wireframe intervento.html va allineato al prossimo giro.

#### J-05: etichetta del gauge fuori dal grafico a 390 px (V-03)
- **V-03**: ACCETTATO.
- **Motivo**: ho rifatto la geometria con `puntoFineArco` (riga 202) e il raggio 58 % (riga 213), su 316 x 340 px.
  - Con un'etichetta in euro (circa 95 px) il bordo sinistro esce fra 0 e circa 25 %, e a destra fra 75 e 100 %.
  - Con un'etichetta in M€ esce di qualche pixel sotto il 17 % circa.
  - E' una stima, non osservata nel browser, come J-04 del 04/11.
- **Fix**: quello della lente proponeva tre strade e "verificare". L'ho riscritto: raggio ridotto sotto i 400 px (o raggio e
  fattore orizzontale ridotti per tutte le larghezze), un test di geometria e la verifica a vista su schermo e PNG.
- **Severita' finale**: MINORE. Riguarda solo il telefono, ed e' un punto che il brief chiede di valutare.

#### J-06: nodo "Pagato" del Sankey senza "lordo" (X-05)
- **X-05**: ACCETTATO.
- **Motivo**: verificato in avanzamento.ts:60, :82 e :254.
  - Non contraddice una scelta approvata: ordine dei nodi e sottotitolo restano, il gauge resta netto.
  - Rende visibile accanto al gauge la distinzione che ha motivato la scelta del netto.
- **Severita' finale**: MINORE. Cambia un'etichetta di un grafico approvato, quindi serve la conferma dell'utente (vedi §5).

#### J-07: nomi delle regioni di RF007 e del gauge (X-04)
- **X-04**: ACCETTATO.
- **Motivo**: verificato.
  - La riga 200 passa il sottotitolo approvato come caption, e alla riga 236 il sottotitolo di RF007 e' identico ad
    `AVANZAMENTO_PAGAMENTI`.
  - Il nome della regione viene da TabelleSemplici.tsx:19 e da CardGrafico.tsx:193.
  - Per il P4 netto e residuo sono FUORI_PERIMETRO (`ResiduoSuPagamenti` del BE).
  - Il runner axe gira solo coi tag WCAG.
  - Il fix lascia invariato il sottotitolo visibile approvato.
- **Severita' finale**: MINORE.

#### J-15: titolo e sottotitolo del gauge duplicati (H-08)
- **H-08**: ACCETTATO.
- **Motivo**: verificato in AvanzamentoReport.tsx:36-37 e DettaglioIntervento.tsx:43-44 e :167.
- **Severita' finale**: COSMETICO.

#### J-13: graficoGauge quasi morto, rami del netto non testati (H-03)
- **H-03**: ACCETTATO.
- **Motivo**: verificato.
  - L'unica chiamata di `graficoGauge` in produzione e' quella ADA (riga 243).
  - Nessun test chiama `graficoPagatoNetto` con netti negativi o con la dotazione a zero.
  - `puntoFineArco` non ha usi fuori dal modulo.
- **Severita' finale**: MINORE. E' lo stesso metro di J-13 del 04/11 (rami morti).

### Avviso degli impegnati

#### J-08: testo dell'avviso inesatto rispetto al backend (V-05)
- **V-05**: ACCETTATO.
- **Motivo**: verificato sul backend.
  - Con procedimento CHIUSO l'importo e' il pagato (`chiuso`, righe 105-116).
  - Il richiesto vale per tutti gli stati della tabella RICHIESTO, compresi i NON AMMISSIBILI non chiusi. Vale anche per i
    LIQUIDATI con IADP e per gli stati non censiti (righe 52-54, 119-131).
  - Per i NO SIGC c'e' il fallback all'importo ammesso SIAN (`coalesce` in `rilevatiNoSigc`).
  - La scelta approvata ("ammesso o richiesto secondo lo stato") e' esatta. E' inesatta la precisazione del wireframe
    approvato: come da mandato, il finding si accetta e **serve la riapprovazione** di dotazione-avanzamento e riepilogo.
- **Severita' finale**: MINORE. Il codice e' fedele al wireframe approvato; il difetto e' nel testo.

### Domande e importi

#### J-09: due definizioni delle tabelle di Importi per anno (X-02, H-05)
- **X-02**: ACCETTATO, e' la base di J-09.
- **H-05**: ACCETTATO, unito in J-09.
- **Motivo**: verificato.
  - Le intestazioni sono copiate in DomandeReport.tsx:37, :219-224 e :281.
  - La resa delle assenze cambia fra le due tabelle: `cellaImporto(..., true)` in domande.ts:111 e :113, contro
    `ValoreImporto` non aggregato in comuni.tsx:101-102.
  - I due finding hanno la stessa causa (due definizioni delle stesse colonne) e lo stesso fix (una definizione in lib).
  - La differenza delle assenze era gia' presente prima del delta. Pesa ora, perche' il delta allinea le intestazioni proprio
    per confrontare le due tabelle.
- **Severita' finale**: MINORE.

#### J-10: scheda Domande del dettaglio senza tabelle compatte (X-03)
- **X-03**: ACCETTATO.
- **Motivo**: verificato.
  - La tabella del dettaglio e' quella generata dalla lib (riga 225), quindi riceve le intestazioni nuove.
  - Le classi compatte sono solo in DomandeReport.tsx:301-302 (grep su src).
  - Le larghezze sono una stima, ma l'allungamento delle intestazioni e' certo.
  - Non contraddice una scelta approvata: quella riguarda la pagina Domande, e il dettaglio non e' nominato.
- **Fix**: "valutare colonne={1}" non era azionabile. Tengo la classe compatta, che non cambia il layout del wireframe. La card
  a tutta larghezza resta una decisione dell'utente.
- **Severita' finale**: MINORE.

### Test delle scelte approvate

#### J-11: scelte approvate non fissate dai test (V-04, H-06, H-07)
- **V-04**: ACCETTATO, unito in J-11.
- **H-06**: ACCETTATO, e' la base di J-11.
- **H-07**: ACCETTATO, unito in J-11.
- **Motivo**: verificato.
  - `layoutIterations` non compare in nessun test di src/ e tests/.
  - Nessun test cerca `.ui-tabelle-compatte` o `.ui-griglia--1`.
  - Il test di riga 995-998 controlla solo l'ultimo segmento.
  - Ho unito H-07 a V-04 e H-06 di mia iniziativa: e' lo stesso difetto (una scelta approvata l'11/11 senza un test che la
    fissi), con lo stesso fix nei file di test.
  - H-06 scrive "RF009/RF010": nella griglia a una colonna ci sono RF008 e RF010. Ho corretto il fix.
- **Severita' finale**: MINORE. E' lo stesso metro di J-05 del 04/11 (test che non provano cio' che promettono).

### Difetti evidenti mancati

Nessuno. Ho controllato i punti del brief.
- **Gauge**:
  - oltre il 100 % l'etichetta resta alla fine dell'arco (testato);
  - un pagamento piccolo non da' mai "0 %";
  - aria e tabella a tre righe dicono le assenze;
  - il perimetro ADA non e' confrontabile, come prima.
- **Barre**:
  - con le rettifiche a zero (fixture e2e) il segmento "Rettifiche" vale 0 e la sua etichetta "0,00 € (0 %)" va a destra
    della barra con lo spazio riservato: e' un valore vero del contratto, non un difetto;
  - le due serie "Pagamenti netti" hanno lo stesso nome e lo stesso colore, quindi una sola voce di legenda;
  - gli importi negativi (SRD11) non si disegnano e dicono il motivo (testato).
- **Sankey**: con `layoutIterations: 0` il flusso ridotto e i rami omessi restano nell'ordine dei dati.
- **Domande**:
  - con e senza il grant dell'elenco la vista Tabella usa la stessa `COLONNE_IMPORTI_PER_ANNO`;
  - le esportazioni (`datiDelReport`) non cambiano.

## 3. Riepilogo

- **Accettati**: 22 su 22 in ingresso, uniti in 15 finding finali.
  - MAGGIORE: 1.
  - MINORE: 12.
  - COSMETICO: 2.
- **Rigettati**: nessuno.
- **Declassati**: nessuno.
- **Severita' dei doppioni**: concordi in tutti e quattro i gruppi, e anche in J-11 (tutti MINORE).

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | punteggio FULL | verdetto atteso |
|---|---|---|---|---|---|---|
| finanziario | 0 | 1 (J-01) | 12 (J-02 ... J-13) | 2 (J-14, J-15) | 100 - 15 - 36 - 2 = 47 | FAIL |

`review-score.sh FULL finanziario-findings-passata1.json` (lanciato dal Judge) da' verdict fail, score 47/80, exit 2.
- Il gate chiede 0 CRITICO e 0 MAGGIORE e, in FULL, un punteggio di almeno 80.
- Correggere solo J-01 non basta: resterebbe 100 - 36 - 2 = 62. Con i due COSMETICO aperti servono al piu' 6 MINORE.

## 4. Finding contestati (CRITICO rigettati)

Nessuno: in ingresso non c'erano CRITICO e non ho rigettato nessun finding.

## 5. Scelte dell'utente e wireframe

Nessun finding contraddice le scelte approvate l'11/11:
- titoli e sottotitoli dei sei grafici restano visibili come sono (J-07 cambia solo caption e aria);
- il pagato resta sopra il da pagare;
- il gauge resta netto, con la dotazione al centro;
- la composizione delle due barre resta;
- Domande resta a una colonna con le tabelle compatte;
- l'impegnato oltre la dotazione non cambia.

Alcuni finding toccano pero' testi del wireframe o etichette approvate, e chiedono una decisione o una riapprovazione.
- **J-08**: il testo dell'avviso va corretto nei wireframe dotazione-avanzamento e riepilogo (.html e .md), poi riapprovato.
- **J-06**: "Pagato (lordo)" nel Sankey va confermato dall'utente e annotato nel wireframe dotazione-avanzamento.
- **J-04**: la fonte del gauge del dettaglio cambia una riga di intervento.html.
- **J-10**: la classe compatta non cambia il layout. La card a tutta larghezza lo cambierebbe, e la decide l'utente.
- **J-09**: si tiene la resa "aggregata" della lib ("non calcolabile") per stanziato e decretato, salvo che l'utente preferisca
  "non valorizzato" come in domande.md:84. In entrambi i casi si sceglie una volta sola per le due tabelle.

## 6. Ordine di correzione consigliato

1. **Barre dell'intervento**:
   - J-12 (modulo `barre-impilate.ts` coi test parametrizzati);
   - poi, sul modulo comune, J-01 (colore e test del contrasto), J-02 (separatore) e J-14 (barra intera);
   - poi J-03 (sottotitolo dalla lib).
2. **Gauge**: J-05 (geometria a 390 px), J-04 (fonte del dettaglio), J-13 (graficoGauge e test), J-15 (costanti), J-07
   (caption e nomi delle regioni).
3. **Domande e test**: J-09 (una definizione delle colonne), J-10 (classe compatta nel dettaglio), J-11 (test delle scelte
   approvate).
4. **Dopo la decisione dell'utente**: J-06 (nodo del Sankey) e J-08 (testo dell'avviso), con la riapprovazione dei wireframe
   toccati (dotazione-avanzamento, riepilogo, intervento).

Dopo le correzioni servono:
- lo step8 11/11 sul commit finale;
- la verifica nel browser a 390 px e a 1366 px, sullo schermo e nel PNG, di J-01, J-02, J-05 e J-10;
- la passata 2 della review.
