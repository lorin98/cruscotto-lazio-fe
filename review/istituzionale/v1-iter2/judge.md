# Judge, review step9 FULL della feature istituzionale, v1 iterazione 2

Perimetro: `git diff 5c1824a 7ca8a0c`, cioe' le correzioni dei 24 finding dell'iterazione 1 (da e072e58 a 8ab034d, resoconto
in 7ca8a0c) e il codice comune nuovo o spostato, con i suoi usi in finanziario, fisico ed elenco operativo. Intensita' FULL
(budget 3, questa e' la seconda iterazione). Ho verificato ogni finding in sola lettura sul codice HEAD (876f447, 23/10/2026),
con Read, grep e git show/diff. Fra 7ca8a0c e 876f447 cambiano solo gli stati, i report del gate e il brief: `src/` e `tests/`
sono quelli del perimetro. Non ho lanciato npm, build o test.

Finding in ingresso: 4 (lente V 1, lente H 2, lente A 0, antagonista 1). Gli id sono quelli delle lenti di questa iterazione:
V1, H1, H2 e X1 qui non sono i finding con lo stesso id dell'iterazione 1.

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** Li ho rieseguiti in sola lettura, con il plugin green-fe e `tools/vendor` in testa al PATH:
  - `check-ui-authz.sh plan/istituzionale/route-manifest.json plan/istituzionale/uiplan.json handover`: pass, 3 route e 7
    azioni, nessun failure;
  - `fe-project-check.sh . --built --feature istituzionale --catalog handover/authz-catalog.json`: pass, 5 feature, nessun
    failure;
  - nessuna regressione authz nelle altre feature: `check-ui-authz.sh` e' pass per finanziario (9 route, 25 azioni), fisico
    (2, 3) ed elenco operativo (3, 6).

  FAIL_AUTHZ non scatta. Lo step8 che il brief dava in corso e' chiuso: in 876f447 e' 11/11 per le quattro feature (verdict
  pass in `fe-gate-report.json` e in `plan/*/fe-gate-report.json`, `step8-gate` done alle 08:53Z del 23/10).
  - Il perimetro non tocca `lib/grant.ts`, `ui/navigazione.ts`, `lib/collegamenti.ts` ne' il route-manifest.
  - Le letture del dettaglio partono ancora ognuna col grant della sua transazione, e TX-0060 col solo
    `puoLeggere(auth, 'filtri')` (`DettaglioIntervento.tsx:39-44`).
  - In `src/app/aree.ts` cambiano solo il tipo delle chiavi (H9) e la ricerca conservata del finanziario (H7): nessuna
    visibility toccata.
  - A4 aggiunge le prove che mancavano: i due grant dei link verso l'elenco (`verifica-smp-non-sigc/page.test.tsx:176, 185`) e
    il ritorno alla verifica senza TX-0017 (`interventi/page.test.tsx:257-266`).
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso in `src/features`, `src/entities` e `src/pages`. Resta solo
  l'helper security-inert di `shared/api/auth/stato.ts`, che il perimetro non tocca. Nessun CRITICO imposto.
- **CSRF.** Il perimetro non tocca `src/shared/api` (diff vuoto). `X-Requested-With` resta fisso nel mutator
  (`bff-mutator.ts:42`) e gli export istituzionali lo portano (`interventi/page.test.tsx:127-128`,
  `verifica-smp-non-sigc/page.test.tsx:206-207`, `output-regionale/page.test.tsx:135`). Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO in ingresso.** La sezione dei CRITICO rigettati e' vuota per costruzione.

## Verifica dei finding dell'iterazione 1

Sono risolti tutti e 22 quelli da correggere; V5 e X2 sono le decisioni D1 e D2. Nessuna lente ne ripresenta uno, e le mie
verifiche lo confermano:

| id | verifica sul codice HEAD |
|---|---|
| H1 (assorbe X1) | `ErroriDelleLetture` e' il solo a registrare l'errore di ogni lettura (`DettaglioIntervento.tsx:135-139`). Le schede passano `errorePersonalizzato` col solo testo statico (`SchedeIntervento.tsx:34, 54, 99, 173`). Lo stato e' `statoDelDettaglio(letture, giaRisposte)` (`intervento.ts:112-117`, `DettaglioIntervento.tsx:161-166`) e la scheda attiva sta in `Dettaglio` (righe 170, 190). Test: `interventi/page.test.tsx:304, 321, 334, 360`, con "Una sezione..." e un solo testo statico. |
| A1 (assorbe V2) | Contesto del PNG coi soli criteri di TX-0017 (`DettaglioIntervento.tsx:180`). Il test con `?anno=2024` verifica che non c'e' "Anno di riferimento" (`interventi/page.test.tsx:98-112`). |
| V1 | `useState<Misura>` nella pagina (`OutputRegionale.tsx:53`), test col chip tolto (`output-regionale/page.test.tsx:87-97`). |
| A3 | `ui-risultati` con `aria-busy` e `AvvisoAggiornamento` del kit (`SchedeIntervento.tsx:97-98`, `StatiVista.tsx:46`). Test con la lettura trattenuta (`interventi/page.test.tsx:211-235`). Il testo dello stato e' X1 di questa iterazione. |
| A2 | `indirizzoDelDato` da' null se `codiceDelPercorso` e' null (`verifica.ts:95-96`); L1 con quattro codici anomali (`tests/istituzionale-lib.test.ts:203`). |
| A4 | Profili col solo TX-0056 o col solo TX-0059 (`verifica-smp-non-sigc/page.test.tsx:176, 185`); AT001 col solo TX-0016 (`interventi/page.test.tsx:257-266`). |
| V4 | `testoMotivato(TESTO_ASSENTE, ...)` (`lib/output.ts:59`). |
| X3 | `Scaricamento.oggetto` (`PulsantiScarica.tsx:24, 69`) e `CardGrafico.oggettoDati` (`CardGrafico.tsx:66-68, 158`). Verifica (`ReportVerifica.tsx:33`) e dettaglio (`SchedeIntervento.tsx:47`) hanno i nomi del low-fi; test `verifica-smp-non-sigc/page.test.tsx:66-70`, `interventi/page.test.tsx:88-92`. Il nome del gruppo e' V1 di questa iterazione. |
| V3 con H11 | `conAnno` (`testing/fixture.ts:130`) e il mock (`api/mock/esempio.ts:23, 47, 70-82`) rispondono come SC-IS_SMP_ANNO, con le righe in ordine di codice. Un L2 ha righe fuori ordine e parte ordinato (`tests/istituzionale-ui.test.tsx:145-153`). |
| H4 | `usePannelloConFocus` (`entities/filtri/ui/usePannelloConFocus.ts:16-29`), con la stessa regola che il fisico aveva a 5c1824a, compreso A1 del fisico (criteri nuovi). La usano `SuperficiAmmissibili.tsx:74` e `useFiltriNellIndirizzo.ts:30`. |
| H5 | `useFocusSeSparisce` (`shared/ui/focus.ts:41-48`). `AvvisoPagina.tsx:51` lo usa con lo stesso valore iniziale e la stessa condizione di prima; lo usa anche `comuni.tsx:24`. |
| H6 | `PaginaReport` (`ui/PaginaReport.tsx:75-94`), composta da `VerificaSmpNonSigc.tsx:45` e `OutputRegionale.tsx:55`. |
| H7 | `testoPerimetro` (`shared/lib/intestazione.ts:39`). `anniProposti` (`shared/lib/anni.ts:14`) da' gli stessi anni di prima ad `anniSelezionabili`. `useRigheContesto` del kit (`shared/ui/grafici/useRigheContesto.ts:14`), `ricercaDeiSoliFiltri` (`entities/filtri/lib/programma.ts:66`). La quarta copia, nell'elenco, e' H1 di questa iterazione; il residuo nel barrel del finanziario e' H2. |
| H8 | Route e grant della frase G4 verificati sulla route-table (`tests/app-aree.test.tsx:65-66`). |
| H10 | `CriteriDellaVerifica`, `CONTRATTO_CRITERI_VERIFICA` e `CONTRATTO_CRITERI_OUTPUT` (`ui/contratto.ts:25-26`). |
| V7 | `waitFor` sul focus dopo Esc (`src/pages/fisico/superfici/page.test.tsx:417`). |
| V6 | SRD04 con la spesa NON_VALORIZZATO nel test della card (`verifica-smp-non-sigc/page.test.tsx:56-58`). |
| V8 | `Intervento ${codice} - Istituzionale` (`DettaglioIntervento.tsx:176`), test `interventi/page.test.tsx:74`. |
| H2 | I sei componenti importano `ApriNellElenco` da `entities/domanda`; `LinkElenco` espone solo i due hook (`tests/kit-comune-istituzionale.test.tsx:113-114`). |
| H3 | `rispostaDatoNonValido` non c'e' piu' in `istituzionale/api/index.ts`; quella del fisico resta, usata. |
| H9 | `ORDINE_AMBITI` `as const` e `ChiaveAmbito` (`src/app/aree.ts:20-23`), `@ts-expect-error` in `tests/app-aree.test.tsx:96`. |
| V5 (D1), X2 (D2) | Registrate in 5c1824a, i wireframe non cambiano. Il codice dei chip e' invariato. Il test "una sola lettura per transazione anche aprendo le schede" e' `interventi/page.test.tsx:40-66`. |

Non ho trovato regressioni di comportamento in finanziario, fisico ed elenco, e le lenti non ne segnalano.
- `CardGrafico` senza `oggettoDati` ha i nomi di prima.
- `AvvisoAggiornamento` ha lo stesso markup e lo stesso testo predefinito.
- `anniSelezionabili` propone gli stessi anni e `useRigheIntestazione` le stesse righe.
- `usePannelloConFocus` e' il codice del fisico a 5c1824a.

Gli effetti dichiarati nel brief sono coerenti col codice e non sono finding.

## Valutazione Finding

### Dettaglio dell'intervento: X1

#### X1: Correzione A3: mentre si legge un altro anno, lo stato in role=status dice sempre 'restano i dati dell'anno precedente', anche quando i dati in pagina sono di un anno successivo; non dice mai quale anno resta
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Il testo: `testoAggiornamentoAnno` riceve solo l'anno chiesto e chiude sempre con "restano i dati dell'anno precedente"
    (`intervento.ts:135-137`). `SchedaVerifica` lo rende durante `isPlaceholderData` (`SchedeIntervento.tsx:97`).
  - Il caso comune: l'anno predefinito e' l'ultimo con un file (2025 nella fixture, `testing/fixture.ts:95`), quindi il primo
    cambio va di solito indietro. Il test di pagina aspetta "Lettura dell'anno 2024 in corso: restano i dati dell'anno
    precedente." (`interventi/page.test.tsx:226`), e due righe sotto la didascalia dice 2025 (riga 230). L'anno precedente al
    2024 e' il 2023, non il 2025.
  - Chi usa un lettore di schermo sente solo questo annuncio (WCAG 4.1.3). L'anno vero lo dice la didascalia della tabella, che
    si legge solo entrando nella tabella.
  - Il dato giusto c'e' gia': con `isPlaceholderData`, `stato.data.annoRiferimento` e' l'anno dei dati mostrati, lo stesso
    della didascalia (`captionVociVerifica`, `SchedeIntervento.tsx:75`).
  - Il testo viene alla lettera dal fix di A3 accettato nell'iterazione 1: e' un difetto di quel testo, non dell'esecuzione.
  - Severita'. Non e' formattazione: e' un'informazione sbagliata in un messaggio di stato, sul percorso piu' comune. Pero'
    dura solo per la lettura, e i dati e la didascalia sono giusti: MINORE.
- **Ritocco del fix.** Il testo dice l'anno della didascalia, "restano i dati dell'anno di riferimento 2025". Con il null
    (nessun file) dice "i dati di prima (nessun file)". Cosi' annuncio e didascalia non possono divergere.
- **Severita' finale**: MINORE

### Codice comune dopo le correzioni: H1, V1, H2

#### H1: Il nuovo useRigheContesto del kit (H7) ha un omonimo nell'elenco operativo con un altro contratto e lo stesso corpo
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Le due funzioni:
    - `useRigheContesto(criteri, ultimi, perimetro?)` del kit e' nata in 107b987 (`shared/ui/grafici/useRigheContesto.ts:14`),
      col commento "Prima in tre copie" (riga 3);
    - l'omonima dell'elenco, `useRigheContesto(filtri, profilo, ultimi, perimetro?)`, esiste da 6100bcf e resta
      (`useInterrogazione.ts:57-62`).
  - Le usano `ElencoDomande.tsx:165` ed `ElencoPagamenti.tsx:112`. Passano `i.auth?.user?.profile`, lo stesso profilo di
    `useAuthStatus` che il kit legge da se'.
  - Il corpo e' lo stesso: un memo sui testi dei criteri, poi `righeContesto`. Restano solo due differenze, e nessuna impedisce
    la sostituzione:
    - `testoPerimetro` dell'elenco ("ADA del tuo profilo") si puo' passare al kit gia' in parole;
    - la chiave del memo e' equivalente, perche' i valori dell'indirizzo non hanno caratteri di controllo.
  - Le conseguenze:
    - lo stesso nome ha due contratti posizionali: il secondo argomento e' il profilo in un caso e gli ultimi dati nell'altro;
    - una correzione dell'intestazione dei PNG (NFR-50) va fatta in due posti;
    - le pagine dell'interrogazione non hanno un test dell'intestazione del PNG, che ha solo la scheda della domanda
      (`scheda-domanda.test.tsx:417-429`).
  - Il precedente e' H1 dell'iterazione 2 del fisico, MINORE: un hook del kit nato nel giro di correzione che non assorbe la
    copia gia' presente nell'elenco. La duplicazione e' sotto soglia, circa cinque righe.
  - Il brief dichiara solo che l'elenco tiene il suo `testoPerimetro`, e il fix lo conserva.
- **Severita' finale**: MINORE

#### V1: Correzione X3: il gruppo dei pulsanti di scaricamento della card resta 'Scarica il grafico <titolo>' anche quando CSV e XLSX sono i dati del report
- **Verdetto**: ACCETTATO, con il fix ritoccato sui test
- **Motivo**: verificato.
  - Il gruppo prende sempre `oggetto={`il grafico ${titolo}`}` (`CardGrafico.tsx:158`, `PulsantiScarica.tsx:59`). Solo i
    pulsanti dei dati prendono `oggettoDati` (`fileDeiDati`, righe 66-68).
  - Nella verifica il gruppo "Scarica il grafico Spesa pubblica erogata per intervento (anticipi inclusi)" contiene l'export
    completo di TX-0016.
  - Nel dettaglio, a 5c1824a, il gruppo si chiamava "Scarica il grafico e i dati dell'output dell'intervento SRA01"
    (`SchedeIntervento.tsx:43` con `oggetto`). Ora perde "e i dati".
  - I nomi dei pulsanti, che il low-fi approvato fissa, sono giusti; il low-fi non da' un nome al gruppo. Resta un nome di
    gruppo che contraddice due pulsanti su tre: COSMETICO, come dichiara la lente.
- **Ritocco del fix.** Il test di `PulsantiScarica` (`tests/kit-comune-istituzionale.test.tsx:144-148`) passa `oggetto` esplicito
  e resta valido. Il nome del gruppo va asserito nel test di `CardGrafico` (riga 132), con e senza `oggettoDati`, e nei test di
  pagina.
- **Severita' finale**: COSMETICO

#### H2: Residuo di H7: il barrel del finanziario esporta ancora filtriDaRicerca e ricercaDaFiltri senza consumatori
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - A 5c1824a `src/app/aree.ts:10` li importava dal barrel per la ricerca conservata. Ora `aree.ts:9, 71` usa
    `ricercaDeiSoliFiltri` dell'entity.
  - Nessun import da `features/finanziario` li usa piu', in `src`, `tests` ed `e2e`.
  - I test e i moduli della feature li prendono da `lib/filtri` (`tests/entita-filtri-domanda.test.ts:20, 83-84`,
    `tests/finanziario-lib.test.ts:18`).
  - E' API pubblica morta, senza difetto: lo stesso metro di H2 dell'iterazione 1 e di H3 dell'iterazione 2 del fisico.
- **Severita' finale**: COSMETICO

## Riepilogo

- Accettati: 4.
  - MINORE 2: H1, X1.
  - COSMETICO 2: V1, H2.
- Rigettati: 0.
- Declassati: 0. Due fix sono ritoccati (X1, V1), le severita' dichiarate restano.
- Assorbiti come duplicati: 0. I quattro finding toccano file e cause diverse.
- Punteggio (`review-score.sh FULL review/istituzionale-findings-iter2.json`, eseguito): 100 - 2x3 - 2x1 = **92**, con 0 CRITICO
  e 0 MAGGIORE. Il verdetto e' **PASS** (soglia FULL 80).

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Parti di finding che non accolgo, o che toccano scelte approvate:
- **V1**, "aggiornare l'asserzione di `tests/kit-comune-istituzionale.test.tsx:146`". Quel test di `PulsantiScarica` passa
  `oggetto` esplicito e resta valido: il nome del gruppo si asserisce nel test di `CardGrafico` (riga 132).
- **X1**, il testo "restano i dati dell'anno 2025". Lo porto a "dell'anno di riferimento 2025", con lo stesso valore della
  didascalia, cosi' i due testi non possono divergere.
- **X1**, la provenienza. Il testo sbagliato e' quello proposto dal fix di A3 nel Judge dell'iterazione 1, applicato alla
  lettera: il difetto e' del fix, non della correzione.
- **D1, D2 e gli effetti dichiarati nel brief**: nessun finding li contesta, e il codice resta coerente con le registrazioni.

## Decisioni da chiedere all'utente

Nessuna. Il verdetto e' meccanico (PASS, score 92), e i quattro finding accettati sono residui da correggere dopo il verdetto,
come per il fisico. Non c'e' una scelta fra artefatti approvati in conflitto, e nessun fix tocca wireframe, uiplan o
deviazioni registrate.

## Residui da correggere dopo il verdetto

In commit separati, uno per finding, su `main`:
1. **X1** (MINORE), l'unico con un effetto per l'utente: il testo dello stato con l'anno della didascalia —
   `src/features/istituzionale/lib/intervento.ts:136`, `SchedeIntervento.tsx:97`, i test di `tests/istituzionale-lib.test.ts:317-318`
   e `interventi/page.test.tsx:226`.
2. **H1** (MINORE): l'elenco passa all'hook del kit e perde la sua copia —
   `src/features/elenco-operativo/ui/useInterrogazione.ts:57-62`, `ElencoDomande.tsx:165`, `ElencoPagamenti.tsx:112`, piu' un
   test di pagina dell'intestazione del PNG in `src/pages/elenco-operativo/interrogazione.test.tsx`.
3. **V1** (COSMETICO): il nome del gruppo con `oggettoDati` — `src/shared/ui/grafici/CardGrafico.tsx:158`, i test L2 del kit e i
   due test di pagina.
4. **H2** (COSMETICO): via la riga 21 di `src/features/finanziario/index.ts`.

Dettagli dei fix in `review/istituzionale-findings-iter2.json`. Ogni test nuovo o cambiato va provato rosso senza la
correzione.

## Note per il giro di correzione

- Nessun wireframe da riapprovare, nessuna modifica a stato, backend o plugin.
- Dopo i fix va rieseguito lo step8 (11/11) delle quattro feature, perche' le approvazioni sha256 sono invalidate:
  - istituzionale per X1 e V1;
  - elenco operativo per H1;
  - finanziario per H2;
  - tutte e quattro per V1, che tocca `CardGrafico` del kit.
- Devono restare verdi:
  - per H1, i test dell'interrogazione (`interrogazione*.test.tsx`) e della scheda della domanda (`scheda-domanda.test.tsx:417`);
  - per V1, i test dei nomi dei pulsanti di finanziario e fisico, che non passano `oggettoDati`;
  - per H2, `tests/entita-filtri-domanda.test.ts:82-86`.
