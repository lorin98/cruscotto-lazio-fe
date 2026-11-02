# Judge: review step9 FULL sul delta della tessera "Pagate / da pagare / senza importi" (02/11/2026, passata 1)

Perimetro: `git diff 503d8b5 5dfbdaa` (3938afe wireframe, a5a03ec kit e elenco operativo, 106850e/a33ade5/5dfbdaa stati e
gate). Ho verificato il codice a HEAD 5435f01, che aggiunge solo il brief della review: `src/` e `tests/` sono quelli di
5dfbdaa. Nel working tree ci sono solo i file delle lenti, non tracciati.

Ingresso: lente V (2 finding), lente H (5), lente A (4), antagonista (0, con le note del resoconto: la voce e' a 18 px per
Bootstrap Italia; il fix sicuro e' nowrap solo sullo strong). In ingresso non ci sono CRITICO ne' MAGGIORE.

- **Cross-model**: `cross_model_review` manca nella config dello stato dell'elenco operativo, quindi e' disabled. Salto
  tracciato.
- **Intensita'**: FULL (feature con authz e scoping, come da brief).

## 1. Gate non declassabili (prima del giudizio)

- **Data-access type-safe**: non si applica. E' un delta di frontend, senza adapter Oracle.
- **Fedelta' dell'autorizzazione**: il delta non tocca route, grant, `src/app`, `src/shared/api` ne' il catalogo. I file
  di codice sono `Kpi.tsx`, `tema.css`, `SinotticoDomande.tsx` e un test di pagina. Lo step8 registrato
  (`plan/elenco-operativo/fe-gate-report.json`) ha 11/11 pass, `authz` compreso, con 1744 test e axe 0 su 140 run. Non ho
  rieseguito gli script: il mandato di questa passata ammette solo grep, git e lettura.

Esito: nessun FAIL_AUTHZ, nessun CRITICO imposto.

## 2. Valutazione dei finding

Ho verificato sul codice tutti gli undici finding: sono tutti veri. Dopo l'unione dei duplicati restano sette finding
finali (J-01 ... J-07, in `review/delta-tessera-2026-11-02-findings-passata1.json`).

### J-01: righe in nowrap dentro una tessera con overflow hidden (assorbe V1, H3, A2)

#### V1: la riga piu' lunga non va mai a capo
- **Verdetto**: ACCETTATO, unito in J-01
- **Motivo**: verificato `.ui-kpi__righe li { white-space: nowrap }` (tema.css:208) dentro `.ui-kpi { overflow: hidden }`
  (:200), con tracce del sinottico da `minmax(170px, 1fr)` (:468) e wireframe senza nowrap (wireframe.css:58). Una misura
  e' sbagliata: la voce non e' a 16 px ma a 18 px (vedi J-02). La conclusione regge.
- **Severita' finale**: MINORE

#### H3: le righe non hanno via d'uscita in larghezza
- **Verdetto**: ACCETTATO, unito in J-01
- **Motivo**: stesso meccanismo, verificato. Anche qui la voce e' contata a 16 px invece che a 18. La parte sulla misura
  della voce (.95rem) va in J-02.
- **Severita' finale**: MINORE

#### A2: nowrap con overflow hidden, anche con la spaziatura del testo (WCAG 1.4.12)
- **Verdetto**: ACCETTATO, e' la base di J-01
- **Motivo**: e' l'unica delle tre lenti che misura con la voce a 18 px.
  - Ho rifatto il conto: '3191 senza importi' misura circa 147 px.
  - Con le sostituzioni di 1.4.12 (lettere 0,12em, parole 0,16em) arriva a circa 192 px, contro 150-168 px visibili alle
    tracce di 1280, 1366 e 1920 px.
  - Il requisito c'e' nel pack: NFR-70, e la fonte SF-02 elenca 1.4.12 ("senza perdita di contenuto").
- **Severita' finale**: MINORE. Il caso e' al confine con MAGGIORE, e lo tengo MINORE per tre ragioni:
  - con la spaziatura predefinita e i dati di oggi la resa e' corretta a tutte le larghezze;
  - il taglio con 1.4.12 e' una stima coi metrici del carattere, non osservata in un browser, e il numero resta visibile:
    si taglia la coda della voce;
  - lo stesso meccanismo e' stato giudicato MINORE nella card istituzionale del 31/10 (A-01, chiuso togliendo il nowrap).

  Se il controllo nel browser (bookmarklet della spaziatura del testo, a 1366 e 1920 px) mostra "senza impo...", il finding
  diventa MAGGIORE rispetto a NFR-70. Per questo va corretto in questo giro: il fix e' una riga di CSS. Ho tolto dal fix la
  correzione del commento di SinotticoDomande.tsx:48: col fix il commento torna vero.

### J-02: voce piu' grande del numero (A1)

#### A1: l'elenco eredita 1,125rem da Bootstrap Italia
- **Verdetto**: ACCETTATO
- **Motivo**: verificato in `node_modules/bootstrap-italia/dist/css/bootstrap-italia.min.css`
  (`@media(min-width: 576px){p,ul,ol,dl{font-size:1.125rem;line-height:1.75rem}}`). `tema.css` non ha nessuna regola che
  rifissi la misura di `ul` o `li`. `line-height`, `margin` e `padding` di Bootstrap invece sono coperti da
  `.ui-kpi__righe`, che e' piu' specifico.
  - Il numero resta a 1.05rem (16,8 px): 8cqi supera quella misura solo con piu' di 210 px di contenuto, cioe' con tracce
    oltre circa 252 px, che il sinottico con tre o piu' colonne non raggiunge.
  - Il wireframe approvato (wireframe.css:58, domande.html:156) ha il numero a 1.7rem e la voce in `<small>`: la gerarchia
    del codice e' rovesciata.

  Ho tolto dal fix la frase "va valutato di alzare il minimo del clamp", perche' non e' azionabile. Resta il font-size
  esplicito della voce, coerente col wireframe.
- **Severita' finale**: MINORE. Il numero resta riconoscibile per peso (700) e colore (--ui-testo); e' un difetto di resa,
  non di dato.

### J-03: test del kit mancanti (assorbe V2, H5 e la parte di test di A4)

#### V2: il ramo "righe con assente" non e' provato
- **Verdetto**: ACCETTATO, unito in J-03
- **Motivo**: verificato. `src/shared/ui/kpi/` ha il solo `Kpi.tsx` e nessun test della Kpi usa `righe`. Il file che V
  propone (un `Kpi.test.tsx` nuovo) l'ho sostituito con il describe('Kpi') esistente, come propone H5: i test del kit
  stanno li'.
- **Severita' finale**: MINORE

#### H5: il ramo nuovo non ha un test del kit
- **Verdetto**: ACCETTATO, e' la base di J-03
- **Motivo**: verificato. Il describe('Kpi') e' a tests/shared-ui-kit.test.tsx:466-487 e copre valore, assente e quota.
  L'unico test di `righe` e' quello di pagina (page.test.tsx:23-37), senza assenza.
- **Severita' finale**: MINORE. Il ramo scoperto non e' raggiungibile in produzione: nessun chiamante passa `righe` con
  `assente`. Il test di pagina prova davvero le tre righe e l'assenza della riga unica.

#### A4 (parte di test): manca la prova che l'assenza prevale
- **Verdetto**: ACCETTATO, unito in J-03. La parte di codice va in J-04.
- **Severita' finale**: MINORE

### J-04: contratto di `righe` aperto (H2 e la parte di codice di A4)

#### H2: un elenco vuoto rende una tessera senza valore; valore, unita' e valore pieno ignorati
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `righe && !valore.assente` (Kpi.tsx:115) con `[]` rende un `<ul>` vuoto. Ne ho ridimensionato la
  portata: anche col fix, `righe={[]}` finisce in ValoreKpi senza valore, cioe' come una tessera che oggi riceve
  `valore` assente. Il fix rende uniforme il comportamento, non inventa un motivo. La parte utile e' dire nella JSDoc che
  con le righe `valore`, `unita` e `valorePieno` non si rendono.
  - L'alternativa dei tipi esclusivi (`righe?: never` quando c'e' `valore`) resta possibile, ma non la metto nel fix: e'
    piu' pesante e non serve all'unico chiamante.
- **Severita' finale**: MINORE (contratto del kit comune; latente)

#### A4 (parte di codice): `righe?.length` invece di `righe`
- **Verdetto**: ACCETTATO, unito in J-04. La parte di test va in J-03. Verificato anche che la key `r.voce`
  (Kpi.tsx:123) e' unica nell'unico chiamante.
- **Severita' finale**: MINORE

### J-05: tipo della riga ripetuto e non esportato (H1)

#### H1
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. La forma in linea compare a Kpi.tsx:39, :114 e :119. In src/shared/ui/index.ts sono esportati
  `TonoKpi` (:32), `RigaPiede` (:47) e `RigaConfronto` (:55), mentre per le righe della Kpi non c'e' un tipo esportato.
  Nessun chiamante ne ha bisogno oggi.
- **Severita' finale**: MINORE (duplicazione sotto soglia, coerenza dell'API del kit, secondo la tabella delle severita')

### J-06: elenco senza role="list" su WebKit (A3)

#### A3
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `<ul className="ui-kpi__righe">` (Kpi.tsx:121) ha `list-style: none` (tema.css:207). WebKit iOS
  e' un profilo dichiarato (README 233-244, playwright.config.ts:13). Il contenuto resta leggibile e si perde solo
  l'annuncio "elenco, 3 elementi".
  - Lo stesso schema c'e' in tutto il kit: nessun `role="list"` in `src`, con liste senza marcatori anche a
    tema.css:379, :413 e :476. Il fix resta limitato a RigheKpi, perche' le altre liste sono fuori dal delta.
- **Severita' finale**: MINORE

### J-07: stato non pertinente senza le righe (H4)

#### H4
- **Verdetto**: ACCETTATO
- **Motivo**: verificato tema.css:502. `NonPertinente` e' solo un provider di contesto, e la Kpi mette da se' la classe
  `ui-kpi--non-pertinente`: le righe quindi non passano in grigio. Effetto nullo oggi.
- **Severita' finale**: COSMETICO

### Antagonista
- **Esito**: nessun finding. Le sue note confermano J-02 (voce a 18 px per Bootstrap Italia) e il fix di J-01 (nowrap solo
  sullo `strong`).

### Difetti evidenti mancati
Nessuno. Ho controllato questi punti:
- **Altre tessere invariate**: `CorpoKpi` passa a `ValoreKpi` le stesse prop di prima. L'unico chiamante di `Kpi` con
  `righe` e' `SinotticoDomande.tsx:52`; `KpiCampagna` del fisico ha una prop omonima ma e' un altro componente.
- **Barra e nota**: invariate.
- **Contrasto della voce**: #546474 su #fff, circa 6:1.
- **Nome della regione nel test**: corretto.
- **Assenza della riga unica**: l'asserzione `not.toContain(' / 31.595')` la prova.
- **Separatore 3191**: e' la scelta approvata, non e' un finding.

## 3. Riepilogo
- Accettati: 11 su 11 in ingresso, uniti in 7 finding finali: 6 MINORE (J-01 ... J-06) e 1 COSMETICO (J-07).
- Rigettati: 0. Ho tolto da A1 solo la frase "va valutato", non azionabile.
- Declassati: 0. Ho confermato le severita' dichiarate.

## 4. Finding contestati (CRITICO rigettati)
Nessuno.

## 5. Scelte approvate dall'utente
Nessun finding chiede di cambiare cio' che l'utente ha approvato il 02/11 alle 14:12:46Z (tre numeri su tre righe con la
loro voce, etichetta invariata; separatore delle migliaia sotto 10.000 fuori da questo delta).
- **J-01**: con il fix, nel caso peggiore la voce va a capo sotto il suo numero, che resta uno per riga. E' coerente con il
  wireframe approvato, che non ha nowrap.
- **J-02**: riporta la voce alla misura del `<small>` del wireframe.

Non c'e' nulla da portare all'utente.

## 6. Verdetto atteso
- **Conteggio**: 0 CRITICO, 0 MAGGIORE, 6 MINORE, 1 COSMETICO.
- **Punteggio**: 100 - (6 x 3 + 1) = 81, sopra la soglia FULL di 80: pass. Il verdetto lo calcola `review-score.sh FULL`
  sul file dei finding.
- **Margine**: un punto. Un solo MINORE in piu' in una passata successiva porterebbe sotto 80.
- **Ordine di correzione consigliato**:
  1. J-01 e J-02 insieme: sono la stessa regola di tema.css:207-209, e J-01 e' prioritario per 1.4.12;
  2. J-04 con i test di J-03;
  3. J-05, J-06 e J-07, che costano una riga ciascuno.

  Dopo le correzioni servono lo step8 11/11 sul commit finale e la verifica di J-01 nel browser.
