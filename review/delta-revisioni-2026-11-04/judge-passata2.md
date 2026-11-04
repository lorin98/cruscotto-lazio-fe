# Judge: review step9 FULL sul delta delle revisioni del 04/11/2026 (passata 2 mirata)

Scritto il 05/11/2026, 00:01 ora locale (04/11 23:01Z).

Perimetro: `git diff 5222fae 60338be`. I commit sono b4a82df (wireframe riapprovati e step1), 38a499a (finanziario), f976a28 (kit ed
elenco operativo), 417ea3e (istituzionale), b04e2eb (e2e), poi 60338be (stati, report dei gate e brief). Ho verificato il codice
a HEAD 60338be. Nel working tree c'e' solo `verifica-passata2.json`, non tracciato.

Ingresso:
- i 20 finding della passata 1 (J-01 ... J-20);
- gli esiti del verificatore (`verifica-passata2.json`): 19 chiusi e 1 parziale;
- 5 finding nuovi del verificatore (N-01 ... N-05).

Valgono le scelte dell'utente del 04/11/2026 alle 22:06:16Z (`brief-passata2.md`). Non le ho riproposte come finding.

- **Intensita'**: FULL su tutte e cinque le feature (authz e scoping, come nella passata 1).
- **Cross-model**: disabled. Salto tracciato.

## 1. Gate non declassabili (prima del giudizio)

- **Data-access type-safe (jOOQ/Oracle)**: non si applica, perche' e' una regola del backend.
- **Fedelta' dell'autorizzazione**: le correzioni non toccano `src/app/route-table.json`, `route-manifest.json`, i grant,
  `src/shared/api`, il mutator, il CSRF ne' `contextProjection`. Il diff non contiene nessuno di questi file.
  - `check-ui-authz.sh` e `fe-project-check.sh` erano gia' pass nella passata 1, e quell'esito resta valido. Nessun FAIL_AUTHZ.
- **XSS**: nessun `dangerouslySetInnerHTML` nuovo.
- **Esiti gia' misurati** (non li ho rieseguiti): a 60338be step8 11/11 sulle cinque feature (tsc, eslint, vitest 1765/1765,
  axe 0, build, authz) ed e2e Playwright 8/8.

Esito: nessun CRITICO imposto dai gate.

## 2. Esiti della passata 1 (J-01 ... J-20)

Ho ricontrollato sul codice ogni esito del verificatore, con la riga della correzione e il test che la prova.

### Finanziario

- **J-01: CHIUSO** (era MAGGIORE).
  - **Codice**: un solo array `CAMPI` nell'ordine del wireframe (RiepilogoReport.tsx:47-58). "di cui stimato" segue l'impegnato
    FEASR e non; lordi, rettifiche e "Con rettifiche" stanno prima del netto, nella tabella (:112-130) e nell'anteprima
    (:199-209).
  - **Totali**: sono calcolati per chiave (:141-148), quindi il nuovo ordine non li sposta.
  - **Test della tabella**: l'ordine completo delle 14 intestazioni (riepilogo/page.test.tsx:83-100).
  - **Residuo**: l'ordine dell'anteprima non e' fissato da nessun test. Passa a P2-01 (da N-01).
- **J-02: CHIUSO** (era MAGGIORE).
  - **Codice**: `VERDE_PAGATO = '#437a1b'` (sigc.ts:221), usato dal solo grafico SIGC (:275). Ho ricalcolato il contrasto col
    bianco: luminanza 0,152, quindi 5,20:1.
  - **Test**: il contrasto WCAG fra etichetta e fondo e' almeno 4,5:1 per le quattro serie (finanziario-grafici.test.ts:1362-1372).
- **J-03: CHIUSO** (era MAGGIORE).
  - **e2e**: csp.spec.ts:205 aspetta la tabella RF011 invece dell'interruttore, e :161 aspetta '1.200'.
  - **Correzioni in piu'**: :186 aspetta '6.000' sull'asse, e il fixture ha lordi e rettifiche (:26-30).
  - **Esito misurato**: 8/8.
- **J-04: CHIUSO**, come la scelta dell'utente.
  - **Codice**: `larghezzaEtichetta` (:224-226) e `grid.right` sempre riservato per l'etichetta piu' lunga degli ultimi
    segmenti (:289). C'e' sempre almeno un ultimo segmento ("Ancora da pagare"), quindi `Math.max` non resta mai senza
    argomenti.
  - **Asse**: torna al massimo di ECharts (:290).
  - **Test**: finanziario-grafici.test.ts:1374-1381 e :1350-1351.
  - **Resta da fare a mano**: la verifica nel browser a 360 px e nel PNG. E' un controllo umano, non un difetto del codice.
- **J-05: CHIUSO**.
  - **Riepilogo**: la riga con gli impegnati uguali e il test dedicato (page.test.tsx:103-128).
  - **Dotazione**: il test aspetta che TX-0011 sia letto prima di controllare l'assenza (revisioni-20261104.test.tsx:38-49).
  - **Errori**: TX-0011 risponde 500 e 403 problem+json (:58-82).
- **J-06: CHIUSO**.
  - **Codice**: nel ramo ADA il grafico disegna impegnato e pagato, e la dotazione resta l'unica voce omessa dichiarata
    (spesa.ts:272-281).
  - **Test**: finanziario-grafici.test.ts:1159-1167 e :1178-1185, e finanziario-ui.test.tsx:1230.
  - **Residuo**: il conteggio delle voci omesse ADA e' stato allentato a una regex. Passa a P2-01.
- **J-07: CHIUSO**.
  - **Codice**: `ALLA_DOTAZIONE` segue la stessa regola dell'avviso, sia nella cella (:114-116) sia nella voce dell'anteprima
    (:179).
  - **Test della cella**: page.test.tsx:113-116 e :127.
  - **Residuo**: la voce dell'anteprima non e' provata. Passa a P2-01.
- **J-08: CHIUSO**.
  - **Codice**: `StatoTabella.nascoste` convalidato contro le chiavi (TabellaInterattiva.tsx:227-246). Le colonne nascoste
    partono dallo stato salvato (:281), e ogni cambio di colonna passa da `cambia` e lo notifica (:296-297, :316).
    L'unico uso e' nel Riepilogo.
  - **Test**: page.test.tsx:365-382 e shared-ui-kit.test.tsx:198-202.
  - **Regressioni**: nessuna. Gli altri 14 usi di TabellaInterattiva non passano `onStato` ne' `statoIniziale`.
- **J-09: CHIUSO**. AvvisoImpegnati.tsx:19 e' uguale a riepilogo.html:70 e a dotazione.html:67. I test sono aggiornati.

### Istituzionale

- **J-10: CHIUSO**, come la scelta (b) dell'utente (era MAGGIORE).
  - **Codice**: la pill legge l'anno dall'indirizzo (VerificaSmpNonSigc.tsx:67, `pillAnnoScelto`). `NESSUN_FILE` e lo stato
    `annoRiferimento === null` sono tolti da pagina e scheda.
  - **Wireframe**: riapprovato, hash 3ee85d18.
  - **Rami che restano**: la card della Home dice ancora "nessun file SMP" (scelta dell'utente). Il ramo 'nessun file' di
    `captionVociVerifica` (intervento.ts:124) si raggiunge solo se il backend chiude il punto aperto. Nessuno dei due e' un
    finding.
  - **Residui**: il test non risponde come un anno senza file (P2-03, da N-02). Testi e .md non aggiornati (P2-05, da N-04).
- **J-11: CHIUSO**.
  - **Test**: interventi/page.test.tsx:431-436 (nessuna lettura senza anno, poi una sola lettura con anno=2025) e
    istituzionale-ui.test.tsx:365-367.
  - Ora la regola sta nel wrapper: se si toglie, questi test falliscono.
- **J-12: CHIUSO**.
  - **Codice**: `useVerificaSmpNonSigc(filtri, anno, opzioni)` con `enabled: abilitato && anno !== undefined`
    (api/index.ts:66-73), e `useUltimaVerificaSmpNonSigc` per la card (:76-77). Le guardie sono tolte dai componenti.
  - **Test**: istituzionale-api.test.tsx:53-62.
  - **Rispetto a TX-0015**: la chiave della lettura disabilitata non ha l'equivalente di `esercizio ?? 0`. E' la causa di
    P2-02 (da N-03), che tratto come finding a se'.
- **J-13: CHIUSO**. `anno: number` in `vociRiferimenti`, `testoAnnoDiRiferimento`, `testoAggiornamentoAnno`, `ReportVerifica` e
  `VociVerifica`. I rami morti sono tolti e i test aggiornati.
- **J-14: CHIUSO**. `verificaDellAnno` (collegamenti.ts:47-50) e `SenzaDati({ anno })` (DettaglioIntervento.tsx:111-125). Test:
  interventi/page.test.tsx:170-171, che vuole `?anno=2025`.
- **J-15: PARZIALE**.
  - **Corretto**: il doc di criteri.ts:106-110.
  - **Non toccato**: il commento di AnteprimaIstituzionale.tsx:7-8, che parla ancora di "criteri della pagina aperta senza
    filtri ne' anno (stessa cache ...)".
  - **Rinviato**: il detail dell'uiplan, per scelta dell'utente. Non conta.
  - Il residuo diventa **P2-04, COSMETICO**.

### Elenco operativo e kit

- **J-16: CHIUSO**. aree.ts:150: "Pagamenti degli elenchi di liquidazione". Test: app-aree.test.tsx:166-170.
- **J-17: CHIUSO**. `unita: [singolare, plurale]` e `plurale(totale, ...)` (Paginazione.tsx:23, :30). Test:
  revisioni-20261104.test.tsx:91-98.
- **J-18: CHIUSO**.
  - **Codice**: `NOMI_ELENCO` e `unitaElenco` (criteri.ts:54-66); `testoOrdinamento(titolo, o, elenco)` non ha piu' il booleano.
  - **Usi**: ripetizioni sostituite in ElencoPagamenti, ElencoDomande, SinotticoDomande, esportazioni e interrogazione. La prop
    `oggetto` e' tolta.
  - **Regressioni**: le controllo nel diff, e non ce ne sono.
- **J-19: CHIUSO**. `maiuscolaIniziale` arriva dal barrel di `shared/lib` (Paginazione.tsx:7, :48).
- **J-20: CHIUSO**.
  - **Wireframe**: "Pagamenti per pagina" e "Domande per pagina" nell'.html e nelle righe del .md, riapprovati (hash b746e290 e
    8d289fad).
  - **Residuo**: sulla stessa riga riapprovata resta un difetto, P2-06 (da N-05).

**Esiti**: 19 chiusi e 1 parziale (J-15). I tre residui di prova di J-01, J-06 e J-07 sono gia' dentro P2-01.

## 3. Finding nuovi (N-01 ... N-05)

#### N-01: test delle correzioni del Riepilogo e del grafico ADA meno precisi del chiesto
- **Verdetto**: ACCETTATO, diventa P2-01.
- **Motivo**: verificato.
  - **Anteprima**: finanziario-casi-limite.test.tsx:301 controlla 13 voci e `voci[3]`. Non fissa l'ordine, che pero' ha logica
    propria: il `Fragment` che inserisce "Con rettifiche" dopo "Rettifiche".
  - **"(alla dotazione)"**: nessun test apre l'anteprima di una riga con impegnati diversi.
  - **ADA**: finanziario-ui.test.tsx:1226 ora accetta qualunque numero di voci omesse. Con F.SPESA sono due, perche' SRA01 ha
    l'impegnato `nd('IMPEGNI')` (fixture.ts:80).
  - **Severita'**: il codice e' corretto, e l'ordine della tabella e' provato per intero. MINORE, come J-05 della passata 1
    ("test di pagina che non prova").
- **Riformulazione**: ho accorciato evidenza e fix, che erano oltre le tre frasi.
- **Severita' finale**: MINORE

#### N-02: il test di J-10 non risponde come un anno senza file
- **Verdetto**: ACCETTATO, diventa P2-03.
- **Motivo**: verificato.
  - La riga 270 rietichetta come 2029 la risposta di VERIFICA, cioe' il file del 2025.
  - Il handler di `servi()` (fixture.ts:125-136) darebbe gia' la risposta realistica dell'anno senza file: SENZA_FILE_DELL_ANNO
    e avviso ANNO_NON_CONSERVATO.
  - Il titolo promette "i dati delle pratiche restano", ma il test conta solo le righe.
  - **Severita'**: MINORE, perche' il FE non ha logica propria per quel caso e la resa dei motivi e' provata altrove.
- **Severita' finale**: MINORE

#### N-03: senza anno la pagina legge la cache della card della Home
- **Verdetto**: ACCETTATO, diventa P2-02.
- **Motivo**: verificato passo per passo.
  - **Chiave**: senza anno `useTx0016(filtri)` ha la chiave `['/api/istituzionale/verifica-smp-non-sigc', {}]`. Con i filtri
    vuoti `letturaDelTipo({}, 'nosigc')` restituisce `{}`, e `criteriVerificaSenzaFiltri()` vale `{}`: e' la stessa chiave
    della card.
  - **Cache**: una query disabilitata restituisce i dati gia' in cache.
  - **Barra**: `PaginaReportProgramma` rende `pillDellaBarra(stato.data)` e `PillDatiAl` anche con `senzaLettura`
    (PaginaReportProgramma.tsx:84-85, PaginaReport.tsx:66). Senza dati `PillDatiAl` non rende nulla, quindi il fix e' verificabile.
  - **Dove nasce**: il meccanismo c'era gia' a 5222fae, con la pill "Anno di riferimento del file SMP non SIGC: 2025", ed e' nel
    perimetro del delta (88eb799). La passata 1 non l'aveva visto, e le correzioni J-10, J-12 e J-15 ci hanno costruito sopra.
    Il commento di criteri.ts:109, "nessuna cache in comune", oggi e' falso; diventa vero col fix.
  - **Severita'**: il contenuto non inganna: la pill dice "non scelto" e la data e' vera. Ma la barra dello stato "Scegli
    l'anno" cambia secondo il percorso di arrivo. MINORE.
- **Fix semplificato**: tengo la chiave `anno ?? 0`, come TX-0015, e il test sul percorso Home -> Istituzionale.
  - Restringere `pillAnnoScelto` a `number`, come proponeva il verificatore, romperebbe il tipo della chiamata in
    VerificaSmpNonSigc.tsx:67, dove `anno` e' `number | undefined`. Quindi dico solo che il ramo "non scelto" diventa
    irraggiungibile.
- **Severita' finale**: MINORE

#### N-04: testi non aggiornati dopo J-10
- **Verdetto**: ACCETTATO, diventa P2-05.
- **Motivo**: verificato in tre punti.
  - **formato.ts:16**: il doc parla del file della risposta, mentre la funzione riceve l'anno dell'indirizzo.
  - **Intestazioni**: anche formato.ts:1 e VerificaSmpNonSigc.tsx:2-3 parlano ancora dell'"anno di riferimento del file".
  - **.md riapprovato**: le righe :49, :70 e :113 contraddicono la pill di html:54 e la nota finale :347-351.
  - **Righe che restano valide**: :202, :234 e :263 riguardano la card della Home, che legge ancora senza anno.
- **Wireframe**: la parte del codice si corregge subito. Le tre righe del .md solo con una nuova approvazione dell'utente.
  - **Debito dichiarato accettabile**: l'.html approvato e la nota finale del .md sono gia' giusti, e il codice li segue.
- **Severita' finale**: COSMETICO

#### N-05: "1284 domande" nella paginazione del wireframe riapprovato
- **Verdetto**: ACCETTATO, diventa P2-06.
- **Motivo**: verificato. domande.html:249 non ha il separatore, mentre :246 della stessa pagina e il codice scrivono "1.284
  domande". La riga e' stata toccata e riapprovata in b4a82df.
- **Wireframe**: si corregge solo con una nuova approvazione dell'utente.
  - **Debito dichiarato accettabile**: il codice e' giusto, e la scelta del 04/11 (separatore sempre) e' gia' scritta.
- **Severita' finale**: COSMETICO

**Riepilogo dei nuovi**: 5 accettati su 5, 0 rigettati, 0 declassati. Ho riformulato N-01 (piu' succinto) e N-03 (fix piu'
semplice). Nessuno era CRITICO.

### Difetti evidenti mancati

Nessun altro. Ho controllato questi punti:
- **Totali del Riepilogo**: restano per chiave, e "Con rettifiche" non entra nei totali.
- **Cella "(alla dotazione)"**: con un impegnato assente non compare, perche' `impegnatiDiversi` vuole i due valori.
- **Scheda non SIGC del dettaglio**: la chiave senza anno include l'intervento, quindi non incontra quella della card.
  `verifica` e' null senza anno.
- **Paginazione e `TabellaInterattiva`**: la paginazione ha un solo uso. `TabellaInterattiva` ha un solo uso con lo stato.
- **Testi dell'elenco operativo**: nel diff non ricompare "riga/righe" per i pagamenti.

Il .md dei pagamenti dice ancora "sezione delle righe" (:26, :92). Non e' un testo dell'applicazione e non e' nel diff, quindi
non e' un finding.

## 4. Finding restanti (passata 2)

In `review/delta-revisioni-2026-11-04-findings-passata2.json`. I file per feature sono in questa cartella.

| id | feature | severita' | file:riga | titolo breve | da |
|---|---|---|---|---|---|
| P2-01 | finanziario | MINORE | tests/finanziario-casi-limite.test.tsx:301 | ordine e "(alla dotazione)" dell'anteprima non provati, conteggio ADA allentato | N-01 (J-01, J-06, J-07) |
| P2-02 | istituzionale | MINORE | src/features/istituzionale/api/index.ts:71 | senza anno la chiave e' quella della card: barra di "Scegli l'anno" coi dati della card | N-03 (J-12) |
| P2-03 | istituzionale | MINORE | src/pages/istituzionale/verifica-smp-non-sigc/page.test.tsx:270 | il test dell'anno senza file risponde col file 2025 | N-02 (J-10) |
| P2-04 | istituzionale | COSMETICO | src/features/istituzionale/ui/AnteprimaIstituzionale.tsx:7 | commento "stessa cache della pagina" | J-15 (residuo) |
| P2-05 | istituzionale | COSMETICO | src/features/istituzionale/lib/formato.ts:16 | testi dell'anno "del file" (codice subito, .md con nuova approvazione) | N-04 (J-10) |
| P2-06 | elenco-operativo | COSMETICO | wireframes/elenco-operativo/domande/domande.html:249 | "1284 domande" nel wireframe (nuova approvazione) | N-05 (J-20) |

**Debito dichiarato sui wireframe approvati**: due finding si chiudono solo al prossimo giro di approvazione dell'utente.
- Le righe 49, 70 e 113 di verifica-smp-non-sigc.md (parte di P2-05).
- La riga 249 di domande.html (P2-06).

Sono COSMETICO. Pesano 1 punto ciascuno e non bloccano il gate.

## 5. Finding contestati (CRITICO rigettati)

Nessuno. In ingresso non c'erano CRITICO, e non ho rigettato nessun finding.

## 6. Riepilogo per feature e verdetto

Il verdetto viene da `review-score.sh FULL review/delta-revisioni-2026-11-04/<feature>-findings-passata2.json`, con
`tools/vendor` in testa al PATH. Tutti gli exit code sono 0.

| feature | CRITICO | MAGGIORE | MINORE | COSMETICO | score | soglia | verdetto |
|---|---|---|---|---|---|---|---|
| finanziario | 0 | 0 | 1 (P2-01) | 0 | 97 | 80 | **PASS** |
| istituzionale | 0 | 0 | 2 (P2-02, P2-03) | 2 (P2-04, P2-05) | 92 | 80 | **PASS** |
| elenco-operativo | 0 | 0 | 0 | 1 (P2-06) | 99 | 80 | **PASS** |
| fisico | 0 | 0 | 0 | 0 | 100 | 80 | **PASS** |
| procedurale | 0 | 0 | 0 | 0 | 100 | 80 | **PASS** |

**Confronto con la passata 1**:
- finanziario: da 39 FAIL a 97 PASS;
- istituzionale: da 72 FAIL a 92 PASS;
- elenco-operativo: da 89 a 99;
- fisico e procedurale: invariati a 100.

Le cinque feature convergono: 0 CRITICO, 0 MAGGIORE e score almeno 80. Lo step9 del delta del 04/11/2026 si puo' registrare
come done, con `state-set.sh` e `gates={review:"pass"}`. I finding restanti sono debito tracciato, non bloccante.

## 7. Note per il prossimo giro

1. **Correzioni consigliate, senza nuova approvazione**:
   - P2-02, la chiave `anno ?? 0`, insieme a P2-04 (i due commenti sulla cache diventano coerenti);
   - P2-03;
   - P2-01;
   - la parte del codice di P2-05.
   Dopo queste correzioni le approvazioni sha256 dei gate cambiano: servono di nuovo step8 e la verifica di conformita' prima
   del push.
2. **Al prossimo giro di approvazione dei wireframe**:
   - le righe 49, 70 e 113 di verifica-smp-non-sigc.md (P2-05);
   - la riga 249 di domande.html (P2-06);
   - il detail di plan/istituzionale/uiplan.json:1184, rinviato (J-15).
3. **Punto aperto verso il backend** (J-10, scelta dell'utente): `annoRiferimento: null` per un anno senza file. Quando arriva,
   lo stato "nessun file per l'anno scelto" puo' tornare nel wireframe, e anche il ramo di `captionVociVerifica`.
4. **Controlli umani**: J-02 e J-04 vanno verificati nel browser a 360 px e nel PNG esportato (posizione e contrasto delle
   etichette degli Importi SIGC).
