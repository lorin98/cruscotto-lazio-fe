# Dossier del gate wireframe - feature fisico (riallineamento degli ambiti)

Preparato il 30/10/2026 (step1 rifatto: la feature e' STALE col pack 1.4.0, `refresh/fisico-detect.json`). Nessuna
approvazione registrata: ne' nello stato (`.claude/state/green-fe-fisico.state.json`, che non ho toccato) ne' nello uiplan
(`plan/fisico/uiplan.json`, dove ho tolto l'`approval` del 26/10 del flusso superfici perche' la sua dir e' cambiata).
Il dossier del 22/10/2026 resta nella storia di git.

## Scelte dell'utente (30/10/2026) e carry-over

Scelte dell'utente del 30/10/2026, tutte le raccomandazioni A: dettaglio dell'intervento `/fisico/interventi/:codice` con TX-0017,
TX-0018 e TX-0030; menu Superfici, Output regionale, Unit Amount; card della Home col testo nuovo e i numeri delle superfici;
filtri conservati fra le pagine dell'area (`ricercaConservata`); importi unitari mostrati solo da TX-0030. Nessun carry-over
(`refresh/fisico-flows.json`): da approvare superfici (CAMBIATO, `sha256:27c926339771b223dbc33c7042587e18a6841a2a6b2d701504095feb25e69d24`),
output-regionale (`sha256:6451a941f95765d6ca3d4f95485edacc3cfc993282770660bb6df81512adf9fc`), unit-amount
(`sha256:8e0da11f9b870e27094e2a77b3e015d2b0eacfbea66d702a608149be9c5789fa`) e intervento
(`sha256:7d55310571a299802ce8a11df23dd8b1b400001340d491fdcbdac71ee33b74db`); determine tolto (revocato senza dir).

## In testa: cosa cambia per il riallineamento (verbale del 29/10/2026)

Fonte: `cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md` (A-1..A-7). Ogni pagina sta nell'ambito
del requisito della sua transazione (A-5), con route per ambito e nessun alias delle vecchie (A-4).

- **Entra TX-0017 output regionale** (RF017, da istituzionale): flusso nuovo `output-regionale`, route
  `/fisico/output-regionale`, portato dal flusso approvato dell'istituzionale (letto da git HEAD e0f6cb7).
- **Entra TX-0030 Unit Amount** (RF030, da procedurale): flusso nuovo `unit-amount`, route `/fisico/unit-amount`,
  portato dal flusso approvato del procedurale (HEAD e0f6cb7). Ora ha i filtri dei report fisici CON l'azione portante e
  "Dati al" dalla sua risposta.
- **Esce TX-0020 determine di una domanda** (RF020, al procedurale): tolti il flusso `determine`, la sua dir
  `wireframes/fisico/determine/` e la route `/fisico/determine/:codice?` dallo uiplan.
- **Nuovo dettaglio dell'intervento del fisico** (proposta, scelta di disegno 1): flusso `intervento`, route
  `/fisico/interventi/:codice`, compone TX-0017, TX-0018 e TX-0030 filtrate sull'intervento. Ospita il grafico
  dell'output per anno, che nell'istituzionale stava nel dettaglio di quell'area.
- **Superfici**: report invariato (TX-0018 ha lo stesso contratto: schemi e percorsi identici nella spec nuova), ma la dir
  cambia per tre motivi ammessi dalla regola 2 del brief: menu dell'area (le determine escono, entrano output regionale e
  Unit Amount; il link `../determine/determine.html` sarebbe rotto), link nuovo verso il dettaglio dell'intervento
  nell'anteprima, card della Home in `home.html` (testo e contenuti dell'area; G1).
- **Contratto**: handover gia' verificato (`plan/fisico/handover.json`): spec fisico
  `sha256:189c634c3b86c825c924c454737f79daf2406d5ccc24a4f1f50866bb83b4ea3f` (manifest con TX-0017, TX-0018, TX-0030),
  elenco-operativo `sha256:7532fe3b...a4ca` (invariata, pinnata per TX-0060), pack 1.4.0
  `sha256:141380bd508ce9c4c26b119c70bf9d9efc293ccdb8b31d9b27232209d99035b7`, catalogo rev. 4. Rispetto alle spec di
  origine: MonitoraggioOutput (TX-0017) cambia solo nella descrizione del perimetro; PagamentiUnitAmount (TX-0030) prende
  `ultimiDatiSincronizzati` e il parametro `azione`; QuantitaProcedurale cambia solo nella descrizione della fonte.
- **Grant (catalogo rev. 4, verbatim)**: csr.tx-0017.read, csr.tx-0018.read e csr.tx-0030.read hanno gli stessi
  profili: p1-dirigente, p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale. Tutti hanno
  csr.tx-0060.read. Nessuno scope (perimetro sempre REGIONALE). P4, P6, P7 e i P3 delle altre aree: 403 (SC-FS_DENY).
- **Validazioni**: `uiplan-validate.sh` rc 0 (8 transazioni attese, 4 route, 4 flussi); `fe-project-check.sh --feature
  fisico` rc 0 (nessuna collisione di path o di dir, delega all'elenco risolta); `wireframe-lint.sh` verde (rc 0) su tutti
  e quattro i flussi. axe e' deferito a step8 (bloccante nel gate 11/11).

### Transazioni coperte (pack 1.4.0)

| transazione | requisito | cosa | route | flusso |
|---|---|---|---|---|
| TX-0017 (EO, report) | RU-00000017 (RF017) | output regionale programmato e realizzato per intervento e anno, export CSV/XLSX | /fisico/output-regionale, /fisico/interventi/:codice | output-regionale, intervento |
| TX-0018 (EO, report) | RU-00000018 (RF018) | superficie ammissibile DS e DP per intervento e campagna, verifica incrociata, export | /fisico/superfici, /fisico/interventi/:codice | superfici, intervento |
| TX-0030 (EO, report) | RU-00000030 (RF030) | anagrafica Unit Amount, pagato, percentuale e base storica, export | /fisico/unit-amount, /fisico/interventi/:codice | unit-amount, intervento |
| TX-0060 (EQ, slice elenco-operativo) | RU-00000061 (RA006) | valori dei pannelli dei filtri e descrizione dell'intervento (G2) | tutte e quattro | tutti |
| TX-0056, TX-0057, TX-0058, TX-0059 | - | rese dalla feature elenco-operativo | - | OP-FIS-09, delega |

TX-0020 non e' piu' della feature (nessuna route, nessun open point la blocca: `uiplan-validate` la rifiuterebbe come
transazione assente dai manifest pinnati).

### Riepilogo dei flussi

| flusso | stato | hash della dir (`wireframe-hash.sh`) |
|---|---|---|
| superfici | CAMBIATO (menu, link al dettaglio, card della Home) | `sha256:27c926339771b223dbc33c7042587e18a6841a2a6b2d701504095feb25e69d24` (approvato il 26/10: `sha256:199cd655...6596`, non piu' valido) |
| output-regionale | NUOVO (portato dall'istituzionale) | `sha256:6451a941f95765d6ca3d4f95485edacc3cfc993282770660bb6df81512adf9fc` |
| unit-amount | NUOVO (portato dal procedurale) | `sha256:8e0da11f9b870e27094e2a77b3e015d2b0eacfbea66d702a608149be9c5789fa` |
| intervento | NUOVO (proposta della scelta 1) | `sha256:7d55310571a299802ce8a11df23dd8b1b400001340d491fdcbdac71ee33b74db` |
| determine | TOLTO (TX-0020 al procedurale) | dir rimossa; era `sha256:c797793a...5d32` |

Nessun flusso INVARIATO: nessun carry-over atteso per questa feature.

## Scelte di disegno da far decidere all'utente

1. **Dettaglio dell'intervento nel fisico.** Nell'istituzionale il grafico dell'output per anno di TX-0017 stava nel
   dettaglio dell'intervento (una sola unita' di misura per intervento, OP-FIS-11).
   - A. **Si', `/fisico/interventi/:codice` con TX-0017, TX-0018 e TX-0030** filtrate sull'intervento (fatto cosi'):
     testata con descrizione e indicatore, KPI (target; DS, DP e domande con DP oltre la DS della campagna piu' recente),
     schede "Output per anno" (grafico grande con PNG, CSV, XLSX), "Superfici per campagna" (linea con PNG, CSV, XLSX) e
     "Unit Amount" (tabella con CSV, XLSX). Ci si arriva da "Apri il dettaglio" nei drawer delle tre pagine.
   - B. No: il grafico per anno resta solo come mini grafico nel drawer dell'output regionale, senza PNG. Si tolgono il
     flusso `intervento` e i tre link (piccolo rework di superfici, output-regionale e unit-amount).
   - C. Dettaglio ridotto con TX-0017 e TX-0030 (dati di programma): le superfici restano nella loro pagina col filtro
     Intervento, e si toglie il link dalle superfici.
   - **Raccomando A.** E' la regola di uiplan-patterns 6: tre report con righe dello stesso oggetto hanno un dettaglio
     comune. E' l'unico posto dove l'output per anno si disegna in grande e si scarica. Non serve nessuna transazione
     nuova e i tre grant hanno gli stessi profili. Ha la stessa forma dei dettagli del finanziario, dell'istituzionale e
     del procedurale.

2. **Collocazione delle due pagine nuove nel menu Fisico.**
   - A. **Superfici ammissibili, Output regionale, Unit Amount** (fatto cosi'). Le superfici restano la prima voce e
     l'ingresso dalla Home.
   - B. Output regionale, Superfici ammissibili, Unit Amount: e' l'ordine dei requisiti (RF017, RF018, RF030). Pero'
     "Entra in Fisico" porterebbe all'output regionale, mentre la card mostra i numeri delle superfici.
   - **Raccomando A.** La pagina d'ingresso coincide coi numeri della card, e l'output e le Unit Amount stanno vicini (sono
     dati di programma per intervento). Il dettaglio dell'intervento non e' una voce di menu, come nelle altre aree.

3. **Card della Home del fisico** (G1: card = contenuto reale della feature).
   - A. **Testo nuovo, numeri delle superfici invariati** (fatto cosi'). Il testo diventa: "Output regionale programmato e
     realizzato, superfici ammissibili delle domande di sostegno e di pagamento e pagamenti per Unit Amount, per
     intervento." I contenuti dell'area perdono le determine e prendono l'output regionale e le Unit Amount.
   - B. Aggiungere un numero dell'output o delle Unit Amount. Oggi non si puo': l'output ha un'unita' per intervento e non
     si somma, e le Unit Amount non hanno totali e hanno il pagato con fonte non attiva. Servirebbe un campo additivo dal
     backend (es. quota del target raggiunta, OP-FIS-11).
   - C. Card statica, senza numeri: tornerebbe indietro rispetto alla decisione del 26/10.
   - **Raccomando A.**

4. **Filtri conservati fra le pagine dell'area** (step6, `ricercaConservata` in `src/app/aree.ts`). Le tre pagine hanno
   ora gli stessi filtri dei report fisici (intervento, os, og, op, azione).
   - A. **Si'**, come il finanziario e l'istituzionale (`ricercaDeiSoliFiltri`): i cinque filtri restano passando da una
     pagina all'altra, mentre la campagna resta solo nelle superfici.
   - B. No, come oggi: ogni pagina parte senza filtri.
   - **Raccomando A.** Chi filtra un intervento nelle superfici lo ritrova nell'output e nelle Unit Amount.

5. **Importi unitari di TX-0017** (OP-FIS-15). Nell'istituzionale avevano una scheda nel dettaglio.
   - A. **Mostrarli da TX-0030** (fatto cosi'): pagina Unit Amount e scheda Unit Amount del dettaglio, che hanno anche
     output previsto e pagato. Quelli di TX-0017 restano nei suoi file CSV e XLSX.
   - B. Mostrarli anche nella pagina dell'output regionale (drawer o colonna) da TX-0017.
   - **Raccomando A.** Lo stesso dato non compare due volte in due forme.

Restano valide le scelte del 22/10 sulle superfici (file della card con la campagna, campagna di riferimento, campagne del
pannello) e la scelta approvata nell'istituzionale per l'output regionale (interruttore della misura invece di tutte le
misure in colonne).

## Flusso superfici (CAMBIATO)

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/superfici/superfici.html`
  e la card della Home `.../wireframes/fisico/superfici/home.html` (doc di flusso: `wireframes/fisico/superfici/superfici.md`)
- **Hash**: `sha256:27c926339771b223dbc33c7042587e18a6841a2a6b2d701504095feb25e69d24`
- **Cosa cambia** (il resto e' byte per byte quello approvato il 26/10):
  - `superfici.html`: menu Fisico con Superfici ammissibili, Output regionale e Unit Amount; Procedurale e Istituzionale
    sono voci attive e non piu' "presto"; nell'anteprima c'e' "Apri il dettaglio dell'intervento" (link
    `dettaglio-intervento-superfici`, target `/fisico/interventi/:codice`) con la sua nota;
  - `home.html`: testo della card e contenuti dell'area (scelta 3); una nota sul perche' i numeri restano delle superfici
    e una sul catalogo rev. 4 (chi non ha csr.tx-0018.read non ha pagine del fisico);
  - `superfici.md`: note del 30/10, sezione link, card della Home, open point.
- **Route e pattern**: `/fisico/superfici`, kind `report`, report v2 (invariato).
- **Grant**: `csr.tx-0018.read` (p1, p2, p3-funzionario-area-fis, p5); TX-0060 con `csr.tx-0060.read` (invariato).
- **Campi**: invariati (nessun campo nuovo).
- **Note WCAG**: quelle approvate, piu' una per il link nuovo (focus sul titolo del dettaglio dopo il cambio di route). axe
  e' deferito a step8.
- **Open point**: OP-FIS-04, 05, 07, 09, 10 (aperti o informativi); OP-FIS-06 superato.

## Flusso output-regionale (NUOVO, portato dall'istituzionale)

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/output-regionale/output-regionale.html`
  (doc: `wireframes/fisico/output-regionale/output-regionale.md`)
- **Hash**: `sha256:6451a941f95765d6ca3d4f95485edacc3cfc993282770660bb6df81512adf9fc`
- **Origine**: `git show HEAD:wireframes/istituzionale/output-regionale/*` (approvato il 22/10). Cambiano route, API, grant,
  menu, breadcrumb, titolo, pill del perimetro e la destinazione di "Apri il dettaglio"; gli importi unitari passano a
  TX-0030 (OP-FIS-15). Le esemplificazioni vengono da SC-FS_OUTPUT_ANNI.
- **Route e pattern**: `/fisico/output-regionale`, kind `report`, report tabellare v2 (lista-filtri). Contiene la barra a
  chip (perimetro, periodo, "Dati al"), il pannello con le voci di TX-0060, la card della tabella con l'interruttore
  della misura e CSV/XLSX, e il drawer col mini grafico per anno e "Apri il dettaglio". Stati: vuoto, caricamento, valori
  dei filtri non disponibili, errore, file non scaricato.
- **Grant**: `csr.tx-0017.read` (p1, p2, p3-funzionario-area-fis, p5); TX-0060 con `csr.tx-0060.read`. L'export
  `GET /api/fisico/output-regionale/{formato}` usa lo stesso grant e X-Requested-With.
- **Filtri nell'URL**: intervento, os, og, op, azione (TX-0017.*, multipli).
- **Link**: `dettaglio-intervento-output` verso `/fisico/interventi/:codice` (path `codice`).
- **Campi con provenance** (spec, `openapi-fisico.json`):

| campo | schema |
|---|---|
| annoInizio, annoFine, perimetro, realizzatoNonSigcCumulativo | MonitoraggioOutput |
| righe[].codiceIntervento, indicatoreOutput, unitaMisura, annoTarget | MonitoraggioOutputRiga |
| righe[].targetFinePeriodo (valore, motivo, fonte) | Quantita |
| righe[].anni[].anno, programmato, realizzatoSigc, realizzatoNonSigc | MonitoraggioOutputAnno |
| ultimiDatiSincronizzati[].flusso, .conclusoIl | UltimoDatoSincronizzato |
| filtri.interventi[] (chiave, descrizione), obiettiviSpecifici[].chiave, obiettiviGenerali[], obiettiviPolicy[], azioniPortanti[] (chiave, descrizione), legameAzioniDisponibile | `openapi-elenco-operativo.json` ValoriFiltriElenco (TX-0060) |

- **Note WCAG**: un solo h1 e focus sul titolo; interruttore della misura con aria-pressed e didascalia che cambia; mini
  grafico con la tabella equivalente; assenze dette in testo; CSV e XLSX con la sigla nel nome accessibile (2.5.3) e il
  focus sul pulsante (2.4.3); pill "Dati al" come pulsante. Residuo umano: tabella larga a 320 px (1.4.10), unita' di
  misura vicino ai valori, contrasto. axe deferito a step8.
- **Open point**: OP-FIS-11, 12, 13, 15 (portati dall'istituzionale o nuovi), OP-FIS-01..03 estesi, OP-FIS-07.

## Flusso unit-amount (NUOVO, portato dal procedurale)

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/unit-amount/unit-amount.html`
  (doc: `wireframes/fisico/unit-amount/unit-amount.md`)
- **Hash**: `sha256:8e0da11f9b870e27094e2a77b3e015d2b0eacfbea66d702a608149be9c5789fa`
- **Origine**: `git show HEAD:wireframes/procedurale/unit-amount/*` (approvato il 22/10). Cambiano route, API, grant,
  menu, breadcrumb e titolo. Si aggiunge il filtro azione portante e il pannello entra nella pagina, con le voci di
  TX-0060 invece di TX-0024. Esce la pill "lo stato non si applica". "Dati al" viene da TX-0030 stessa. Si aggiungono
  gli stati "valori dei filtri non disponibili" e "file non scaricato", e "Apri il dettaglio dell'intervento" porta al
  dettaglio del fisico.
- **Route e pattern**: `/fisico/unit-amount`, kind `report`, report v2. Contiene la barra a chip con "Dati al", la card
  "Percentuale pagata per Unit Amount" (grafico non disponibile finche' la fonte non e' attiva; CSV, XLSX, e PNG solo col
  grafico), la tabella interattiva di nove colonne con CSV e XLSX, il drawer e il pannello dei filtri. Stati: caricamento,
  vuoto, valori dei filtri non disponibili, errore, file non scaricato.
- **Grant**: `csr.tx-0030.read` (p1, p2, p3-funzionario-area-fis, p5); TX-0060 con `csr.tx-0060.read`. L'export
  `GET /api/fisico/unit-amount/{formato}` usa lo stesso grant e X-Requested-With.
- **Filtri nell'URL**: intervento, os, og, op, azione (TX-0030.*, multipli; SC-FS_UNIT_AMOUNT_AZIONE).
- **Link**: `dettaglio-intervento-unit-amount` verso `/fisico/interventi/:codice` (path `codice`).
- **Campi con provenance** (spec, `openapi-fisico.json`):

| campo | schema |
|---|---|
| perimetro | PagamentiUnitAmount |
| righe[].codiceIntervento, codiceUnitAmount, gruppoColturale, esercizio | PagamentiUnitAmountRiga |
| righe[].importoUnitario, importoPagato (valore, motivo, fonte) | Importo |
| righe[].outputPrevisto, percentualePagata, baseStorica (valore, motivo, fonte) | QuantitaProcedurale |
| ultimiDatiSincronizzati[].flusso, .conclusoIl (nuovo in TX-0030) | UltimoDatoSincronizzato |
| filtri.* (come l'output regionale) | `openapi-elenco-operativo.json` ValoriFiltriElenco (TX-0060) |

- **Note WCAG**: card col grafico non disponibile detto in testo e tabella subito; assenze in testo, mai zero; download
  per formato (2.5.3, 2.4.3); pill "Dati al"; pannello con focus-trap. Residuo umano: tabella di nove colonne a 320 px,
  ripetizione di "non disponibile (fonte non attiva)", contrasto. axe deferito a step8.
- **Open point**: OP-FIS-14, 15 (informativi), OP-FIS-01..03 estesi, OP-FIS-07. Gli OP-PR-01, 03, 04 e 05 del procedurale
  sono superati qui (detto nel doc di flusso).

## Flusso intervento (NUOVO, proposta della scelta 1)

- **HTML da aprire**: `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe/wireframes/fisico/intervento/intervento.html`
  (doc: `wireframes/fisico/intervento/intervento.md`)
- **Hash**: `sha256:7d55310571a299802ce8a11df23dd8b1b400001340d491fdcbdac71ee33b74db`
- **Origine**: la scheda "Output per anno" viene da `git show HEAD:wireframes/istituzionale/intervento/*`, dove era
  "l'unico posto dove l'output per anno si puo' disegnare". Le schede "Superfici per campagna" e "Unit Amount" sono nuove,
  con gli stessi componenti delle pagine del fisico.
- **Route e pattern**: `/fisico/interventi/:codice`, kind `dettaglio`, dettaglio v2. Contiene la barra dei riferimenti
  (perimetro, "Dati al"), la testata (descrizione da TX-0060, indicatore, pulsanti verso i tre report filtrati), i KPI x4
  e tre schede. Stati: caricamento, intervento senza dati, schede vuote dichiarate, errore, file non scaricato.
- **Grant**: `csr.tx-0017.read`, `csr.tx-0018.read`, `csr.tx-0030.read` (visibilita' "almeno uno"; nel catalogo rev. 4
  sono gli stessi profili). Ogni scheda e ogni KPI e' legato al grant della sua transazione; la descrizione e' letta con
  `csr.tx-0060.read`.
- **Filtri nell'URL**: nessuno (codice nel percorso, scheda nello stato della pagina).
- **Link**: `output-regionale-intervento` verso `/fisico/output-regionale?intervento=`, `superfici-intervento` verso
  `/fisico/superfici?intervento=`, `unit-amount-intervento` verso `/fisico/unit-amount?intervento=`. Arrivi: i tre link
  `dettaglio-intervento-*` dei drawer.
- **Campi con provenance** (spec): TX-0017 (MonitoraggioOutput, MonitoraggioOutputRiga, MonitoraggioOutputAnno), TX-0018
  (SuperficieIntervento.motivo, SuperficieCampagna, QuantitaRichiestaPremio), TX-0030 (PagamentiUnitAmountRiga, Importo,
  QuantitaProcedurale), UltimoDatoSincronizzato, TX-0060 interventi[] (titolo). Tutti in `fields` dello uiplan, col
  prefisso della transazione.
- **Export**: PNG, CSV e XLSX per l'output (`output-regionale/{formato}?intervento=`) e per le superfici
  (`superficie-ammissibile/{formato}?intervento=`); CSV e XLSX per le Unit Amount (`unit-amount/{formato}?intervento=`).
- **Note WCAG**: un solo h1; tablist con frecce; tabella equivalente per ogni grafico; il target anche in forma testuale;
  assenze per scheda dette in testo; segno meno sulle differenze; download (2.5.3, 2.4.3). Residuo umano: ordine di
  lettura, DS, DP e "campagna di riferimento" nei KPI, tabella delle Unit Amount a 320 px, contrasto. axe deferito a step8.
- **Open point**: OP-FIS-04, 05, 11, 12, 13, 14, 15.

## Flusso determine (TOLTO)

- Dir `wireframes/fisico/determine/` rimossa (era approvata il 22/10 con `sha256:c797793a...5d32`); route
  `/fisico/determine/:codice?` e campi di DetermineDomanda tolti dallo uiplan. TX-0020 e' ora del procedurale
  (`GET /api/procedurale/domande/{codice}/determina`, P4 scoped sul perimetro ADA). La porta il procedurale.

## Open point

| id | stato | tema |
|---|---|---|
| OP-FIS-01 | chiuso (G2), esteso | voci dei pannelli e descrizione dell'intervento da TX-0060, per tutte e quattro le route |
| OP-FIS-02 | chiuso (G3), esteso | "Dati al" da TX-0018, TX-0017, TX-0030; la pagina senza pill (determine) e' uscita |
| OP-FIS-03 | chiuso (G3), esteso | export CSV/XLSX di TX-0018, TX-0017 e TX-0030 (D-07); PNG del browser |
| OP-FIS-04 | informativo | quantita' richiesta a premio sempre FONTE_NON_ATTIVA |
| OP-FIS-05 | aperto, invariato | nessun drill-down verso l'elenco operativo (anche per output e Unit Amount) |
| OP-FIS-06 | superato (verbale 29/10) | card Fisico: output regionale, superfici, Unit Amount; determine fuori |
| OP-FIS-07 | informativo, aggiornato | voci di menu per step6 (tre voci; determine fuori; ricercaConservata) |
| OP-FIS-08 | superato (verbale 29/10) | link dall'elenco verso le determine: ora e' del procedurale |
| OP-FIS-09 | delega, aggiornato | TX-0056..TX-0059 rese dall'elenco operativo; nessun link del fisico verso l'elenco |
| OP-FIS-10 | aperto, aggiornato | card della Home dinamica: testo nuovo, numeri delle superfici |
| OP-FIS-11 | nuovo (era OP-IS-06) | nessun grafico fra interventi per l'output (unita' diverse) |
| OP-FIS-12 | nuovo (era OP-IS-07) | definizioni D-03/D-04 da confermare, NFR-25 (d) "da consolidare" |
| OP-FIS-13 | nuovo, informativo (era OP-IS-08) | testi di FONTE_AMBIGUA e ANNO_NON_CONSERVATO gia' nel kit |
| OP-FIS-14 | nuovo, informativo | pagato per Unit Amount con fonte non attiva |
| OP-FIS-15 | nuovo, informativo | importi unitari da TX-0030, non da TX-0017 |

## Cosa dovra' cambiare a step6 (non toccato qui: `src/`, route-table, `aree.ts`)

- `src/app/aree.ts`, voce `fisico`:
  - `descrizione` = "Output regionale programmato e realizzato, superfici ammissibili delle domande di sostegno e di
    pagamento e pagamenti per Unit Amount, per intervento.";
  - `contenuti` = output regionale programmato e realizzato per intervento e anno; superfici ammissibili di sostegno e di
    pagamento per intervento e campagna; verifica incrociata fra superficie di pagamento e di sostegno; pagamenti per Unit
    Amount;
  - commento G1 aggiornato al verbale del 29/10;
  - `ricercaConservata: ricercaDeiSoliFiltri` (scelta 4);
  - `Anteprima: AnteprimaFisico` invariata.
  - Nella voce `procedurale`, "Pagamenti per Unit Amount" esce: lo fa il procedurale.
- `pagineVisibili` del fisico (`src/features/fisico/lib/pagine`): Superfici ammissibili (csr.tx-0018.read), Output
  regionale (csr.tx-0017.read), Unit Amount (csr.tx-0030.read), nell'ordine della scelta 2. Esce "Determine di una
  domanda" con `conSottopercorsi`.
- Route-table: entrano `/fisico/output-regionale`, `/fisico/unit-amount` e `/fisico/interventi/:codice`; esce
  `/fisico/determine/:codice?`. Nessun alias delle vecchie `/istituzionale/output-regionale` e `/procedurale/unit-amount`
  (A-4).
- Link: tre `dettaglio-intervento-*` nei drawer e tre pulsanti della testata del dettaglio. Il link `scheda-domanda`
  esce con le determine.
- Card della Home: solo testo e contenuti; numeri e letture invariati.

## Note per le altre feature (fuori da questa, da coordinare nella sessione principale)

- Istituzionale: il suo dettaglio `/istituzionale/interventi/:codice` perde le schede "Output per anno" e "Importi
  unitari" (TX-0017 esce). Se vuole un passaggio verso l'output dell'intervento, puo' dichiarare un link
  cross-feature verso `/fisico/interventi/:codice`. P1 e P2 hanno i grant di entrambi; il P3 dell'area istituzionale no,
  quindi il link andrebbe nascosto senza csr.tx-0017.read.
- Procedurale: se il suo dettaglio dell'intervento citava le Unit Amount, il passaggio verso
  `/fisico/unit-amount?intervento=` o `/fisico/interventi/:codice` e' un link cross-feature da dichiarare la'. P4 e il P3
  dell'area procedurale non hanno csr.tx-0030.read.
- Nessun'altra feature, in HEAD, aveva link verso `/fisico/determine` o verso le route nuove del fisico.

## Dopo il gate

Per ogni flusso: Approva / Rework (con note, budget 2 giri) / Sospendi. All'approvazione si registra il gate
`wireframe_<flusso>` nello stato (approved_hash = l'hash sopra, baseline_ref `./wireframes/fisico/<flusso>`) e l'`approval`
nello uiplan, poi `uiplan-validate.sh`. Se la scelta 1 non e' A, prima del gate si correggono i flussi interessati, e
cambiano gli hash di intervento, superfici, output-regionale e unit-amount.
