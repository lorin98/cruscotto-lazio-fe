# Judge, review step9 FULL della feature istituzionale, v1 iterazione 1

Perimetro: `git diff e3eb189 b8e9ce3`, cioe' la feature istituzionale (step2-7) e gli spostamenti e le estensioni nel codice
comune fatti per lei, che toccano anche finanziario, fisico ed elenco operativo. Intensita' FULL: e' la prima review della
feature e la feature ha authz e scoping. Ho verificato ogni finding in sola lettura sul codice HEAD (c8b0e2b, 22/10/2026),
con Read, grep e git show/diff. Fra b8e9ce3 e c8b0e2b cambiano solo gli stati, i report del gate e il brief: `src/` e
`tests/` sono quelli del perimetro. Non ho lanciato npm, build o test.

Finding in ingresso: 27 (lente V 8, lente H 11, lente A 5, antagonista 3).

## Gate non declassabili (pre-Judge)

- **Fedelta' authz.** Ho rieseguito i due script in sola lettura, con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e
  `tools/vendor` in testa al PATH. FAIL_AUTHZ non scatta.
  - `check-ui-authz.sh plan/istituzionale/route-manifest.json plan/istituzionale/uiplan.json handover`: rc 0, 3 route,
    7 azioni, nessun failure.
  - `fe-project-check.sh . --built --feature istituzionale --catalog handover/authz-catalog.json`: rc 0, pass.
  - Lo stesso script senza `--feature` da' rc 2, con 9 `link_target_not_mounted` tutti del procedurale: e' una feature solo
    pianificata, con le route non ancora montate. E' fuori perimetro, e lo step9 prescrive lo scope della feature.
  - Nessuna regressione authz nelle altre feature: `check-ui-authz.sh` e' pass per finanziario (9 route, 25 azioni),
    fisico (2, 3) ed elenco operativo (3, 6).
  - Lo step8 a c8b0e2b e' 11/11 (`plan/istituzionale/fe-gate-report.json`), `step8-gate` done.
  - Route-manifest e route-table coincidono:
    - `/istituzionale/verifica-smp-non-sigc` con `csr.tx-0016.read`;
    - `/istituzionale/output-regionale` con `csr.tx-0017.read`;
    - `/istituzionale/interventi/:codice` con uno dei due grant.

    Le azioni hide-by-role usano i grant verbatim del catalogo (TX-0016, TX-0017 e TX-0060 con `csr.tx-0060.read`).
  - TX-0060 parte solo con `puoLeggere(..., 'filtri')` (`useFiltriNellIndirizzo.ts:22-23`, `DettaglioIntervento.tsx:42`).
    Senza il grant non parte nessuna richiesta, come provano `verifica-smp-non-sigc/page.test.tsx:270` e
    `interventi/page.test.tsx:249`.
  - Le due letture del dettaglio partono ognuna col grant della sua transazione (`DettaglioIntervento.tsx:37-41`, test :129).
  - I link verso l'elenco richiedono il grant della pagina di arrivo (`navigazione.ts:35`). A4 e' un buco di test, non un
    widening.
  - La frase G4 compare solo con `csr.tx-0015.read` (`VerificaSmpNonSigc.tsx:80`, test :67 e :75), senza filtri portati.
  - I predicati si riducono a `hasGrant` (`grant.ts:26-28`): non c'e' widening.
- **`contextProjection` usata come sicurezza.** Non c'e' nessun uso ne' nell'istituzionale ne' nel codice comune toccato.
  Resta solo in `shared/api/auth/stato.ts`, dichiarata security-inert e fuori perimetro. Nessun CRITICO imposto.
- **CSRF.** Il perimetro non tocca il mutator BFF: in `shared/api` cambia solo `mock/server.ts`.
  - `X-Requested-With` resta fisso nel mutator (`bff-mutator.ts:42`).
  - Gli export istituzionali lo portano: `verifica-smp-non-sigc/page.test.tsx:151-154`, `output-regionale/page.test.tsx:123`,
    `interventi/page.test.tsx:92-95`.
  - `/api/istituzionale/` entra nella coda comune delle letture (`tetti-letture.ts`). Nessun CRITICO.
- **Regola data-access del `judge-brief.md`.** Riguarda jOOQ e CallableStatement del backend, quindi qui non si applica.
- **Nessun finding CRITICO in ingresso.** I due MAGGIORE (H1, A1) sono declassati, con il motivo sotto.

## Valutazione Finding

### Contesto del PNG del dettaglio con l'anno: A1, V2 deduplicati

#### A1: Dettaglio dell'intervento: il PNG del grafico 'Output per anno' (TX-0017) dichiara fra i filtri applicati l'anno di riferimento di TX-0016, che TX-0017 non applica (NFR-50)
- **Verdetto**: DECLASSATO (assorbe V2)
- **Motivo**: verificato.
  - Il contesto: `Dettaglio` costruisce un solo contesto per tutta la pagina,
    `useContesto(testiCriteri(soloIntervento(codice), anno), ultimi)` (`DettaglioIntervento.tsx:169`), e lo fornisce a
    tutta la pagina (:172).
  - Dove finisce l'anno: `testiCriteri` aggiunge "Anno di riferimento: 2024" (`criteri.ts:51-54`). `usePngDelGrafico` legge
    il contesto da `ContestoIntestazione` (`usePngDelGrafico.ts:18, 30`) e `righeIntestazione` lo scrive in "Filtri
    applicati" (`intestazione.ts:55`).
  - I dati: l'unico PNG della pagina e' `CardOutput` (`SchedeIntervento.tsx:37-44`), con i dati di TX-0017. TX-0017 non ha il
    parametro anno: il CSV e l'XLSX della stessa card partono con il solo `soloIntervento(codice)` (:42).
  - Il percorso e' realistico: dalla verifica con un anno scelto, la riga porta `?anno=` (`collegamenti.ts:29-31`) e il
    dettaglio si apre sulla scheda Output. Nessun test guarda l'intestazione del PNG del dettaglio.
  - Severita'. Il PNG dichiara un filtro che i dati non hanno, ma i dati sono giusti e il file resta coerente col profilo.
    E' il caso simmetrico di N-02 del finanziario (il PNG della riserva senza l'anno), che e' MINORE nella review del
    12/10. NFR-50 sta nella categoria security, ma qui non c'e' esposizione di dati ne' un'esportazione non registrata.
    MAGGIORE non regge l'anti-inflation.
- **Severita' finale**: MINORE (da MAGGIORE)

#### V2: Il PNG del grafico Output per anno (TX-0017) dichiara fra i filtri l'anno di riferimento di TX-0016
- **Verdetto**: DUPLICATO di A1 (assorbito): stessa riga e stessa causa. Il fix adottato e' la seconda variante proposta da
  V2: niente anno nel contesto della pagina, perche' la scheda Verifica non ha PNG.
- **Severita' finale**: vedi A1

### Test del fisico con Esc: V7, A5 deduplicati

#### V7: Il test del fisico gemello di quello trovato instabile (Esc sul pannello) controlla il focus subito, ora che il pannello e' quello comune
- **Verdetto**: ACCETTATO (assorbe A5)
- **Motivo**: verificato.
  - `src/pages/fisico/superfici/page.test.tsx:394` controlla il focus senza attesa, dopo che il dialogo e' sparito.
  - Il pannello del fisico ora e' `PannelloFiltriProgramma`, spostato in `entities/filtri`.
  - L'omologo dell'istituzionale e' stato messo in `waitFor` (commit 409c345, `verifica-smp-non-sigc/page.test.tsx:344`)
    dopo un fallimento nella suite completa.
  - Ho cercato con grep le asserzioni sul focus dopo la chiusura di un dialogo: questa e' l'unica rimasta sincrona. La
    seconda parte del fix di V7 ("cercare altri controlli") quindi non ha altri bersagli.
  - Un test instabile sulla regressione del fisico puo' far fallire il gate senza un difetto vero.
- **Severita' finale**: MINORE

#### A5: Fisico, pannello dei filtri ora comune: il test di Esc controlla il ritorno del focus in modo sincrono
- **Verdetto**: DUPLICATO di V7 (assorbito): stessa riga, stesso fix.
- **Severita' finale**: vedi V7

### Dettaglio con una lettura in errore: H1, X1 deduplicati

#### H1: Dettaglio dell'intervento: l'errore di una stessa lettura entra due volte nell'avviso della pagina, e il test che dichiara il caso non lo prova
- **Verdetto**: DECLASSATO (assorbe X1)
- **Motivo**: verificato.
  - L'errore e' registrato due volte.
    - `ErroriDelleLetture` (`DettaglioIntervento.tsx:132-140`) rende una `VistaQuery` per ogni lettura senza risposta, e la
      scheda aperta ne rende un'altra sullo stesso stato (`SchedeIntervento.tsx:50, 91, 162`).
    - Ognuna registra l'errore col suo `useId` (`AvvisoPagina.tsx:76-88`), e `ElencoErrori` conta le registrazioni (:29).
    - React-aria monta solo il pannello attivo (`react-aria-components/dist/private/Tabs.mjs:276`).
    - Con TX-0017 in errore e TX-0016 riuscita lo stato e' 'dati' (`intervento.ts:102-106`) e la scheda iniziale e'
      Output. L'avviso dice subito "2 sezioni della pagina non si sono caricate." per una sola lettura, e il testo "Dati
      non caricati..." compare due volte.
    - Con TX-0016 in errore succede lo stesso all'apertura della scheda Verifica.
  - Il test non prova cio' che dichiara. `interventi/page.test.tsx:233` dice "l'avviso della pagina dice quella mancata",
    ma conta solo gli alert (:239, :242) e cerca il testo statico dentro la scheda (:244): passerebbe anche con "2 sezioni".
    Il caso con TX-0017 in errore manca.
  - X1 e' la stessa situazione vista da un'altra parte.
    - `statoDelDettaglio` torna 'caricamento' appena una lettura non ha dati e non e' in errore (`intervento.ts:103`).
    - Con query-core 5.101.3 una query senza dati che riparte torna `pending` con `error: null` (`query.js:411-420`).
    - Quindi "Riprova", oppure "Mostra" con un altro anno dopo l'errore di TX-0016 (il `keepPreviousData` non ha dati da
      tenere), rimette lo scheletro al posto dei KPI e delle schede della lettura riuscita.
    - `SchedeIntervento` si smonta e la scheda torna a "Output per anno" (`useSchedaAttiva`, `SchedeIntervento.tsx:126-129`).
      Con "Mostra" il bottone sparisce e il focus finisce sul contenitore dell'avviso.
    - Il wireframe approvato vuole la scheda attiva nello stato della pagina (`intervento.md:43`).
  - Severita'.
    - Resta un solo `role=alert` (l'invariante A-07), il messaggio del problem-type e' giusto e non c'e' nessun dato falso.
    - I difetti sono di stato e di focus su un percorso degradato.
    - I precedenti del fisico sono MINORE: il focus perso dopo un comando che sparisce (A1) e il test che non prova cio'
      che dichiara senza un rischio reale (A2). MAGGIORE non regge l'anti-inflation.
- **Correzione accettata**:
  - ogni lettura ha un solo proprietario del suo errore;
  - lo scheletro di tutta la pagina compare solo quando nessuna lettura ha dati;
  - la scheda attiva sale in `Dettaglio`;
  - il test di :233 viene completato, con i due casi di X1 (dettagli nel JSON).
- **Severita' finale**: MINORE (da MAGGIORE)

#### X1: Dettaglio con una lettura in errore e l'altra riuscita: Riprova (o un nuovo anno dopo l'errore di TX-0016) riporta tutta la pagina allo scheletro e la scheda attiva torna alla prima
- **Verdetto**: DUPLICATO di H1 (assorbito): stessa situazione, fix nello stesso punto. Da solo sarebbe MINORE.
- **Severita' finale**: vedi H1

### Altri finding

#### V1: La misura dell'interruttore torna a Programmato a ogni cambio dei filtri: e' stato del report, non della pagina
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Lo stato vive nel report: `useState<Misura>('programmato')` sta in `ReportOutput` (`OutputRegionale.tsx:45`).
  - Il report si smonta a ogni lettura nuova: `useOutputRegionale` non ha `placeholderData` (`api/index.ts:68`), quindi
    `VistaQuery` mostra il caricamento. In piu' c'e' `key={ricercaDaFiltri(filtri)}` (:72).
  - Cosa dice il wireframe approvato: "La misura dell'interruttore ... resta nello stato della pagina"
    (`output-regionale.md:114`). Nel fisico, infatti, la vista sta nella pagina (`SuperficiAmmissibili.tsx:99`).
  - La didascalia dice quale misura e' mostrata, quindi il danno e' limitato.
- **Severita' finale**: MINORE

#### V3: Fixture e mock di esempio non seguono SC-IS_SMP_ANNO e il wireframe approvato per un anno diverso dal file piu' recente
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `conAnno` (`testing/fixture.ts:107-110`) e il mock di esempio (`api/mock/esempio.ts:81`) non mettono ANNO_NON_CONSERVATO
    su avvisi attivati, avvisi chiusi e concessioni previste. La riga SRD04 del low-fi approvato invece li mostra cosi'
    (`verifica-smp-non-sigc.html:142`), e SC-IS_SMP_SENZA_FONTE li dice letti dall'avviso.
  - Con il 2023 gli indicatori restano O.20 e R.9, mentre SC-IS_SMP_ANNO vuole NON_VALORIZZATO.
  - `VERIFICA.righe` non e' in ordine di codice (SRA01, SRD01, SRA16: righe 97-102).
  - Nessun test si appoggia ai valori sbagliati, ma la fixture si dichiara "come il backend" (riga 5). La lezione del fisico
    (V2) e' che la fixture e' l'oracolo dei test di pagina. MINORE.
- **Nota sul fix**:
  - La tabella della verifica ordina da se' per Intervento: `TabellaInterattiva` senza `ordineIniziale`
    (`TabellaVerifica.tsx:44`).
  - Oggi la fixture fuori ordine prova anche quell'ordinamento. Se si ordina la fixture serve un test L2 con righe fuori
    ordine, altrimenti la prova si perde.
- **Severita' finale**: MINORE

#### V4: Nel drawer l'indicatore assente e' scritto a mano 'non valorizzato', senza il testo unico delle assenze del kit
- **Verdetto**: ACCETTATO, con la citazione della tabella corretta
- **Motivo**: verificato.
  - `vociAnteprima` usa `r.indicatoreOutput ?? 'non valorizzato'` (`lib/output.ts:56`). Escono "non valorizzato" senza la
    nota, oppure "non valorizzato (ettari)" quando c'e' l'unita'.
  - La tabella della stessa pagina usa `AssenzaMotivata` con `TESTO_ASSENTE`, ma a `TabellaOutput.tsx:24` (`TestoOAssente`),
    non a :120.
  - Contrasta con la resa unica delle assenze, che e' una scelta approvata. La forma giusta esiste gia' nella feature:
    `testoMotivato` (`lib/formato.ts:58-60`).
- **Severita' finale**: MINORE

#### V5: Chip dei filtri col solo codice o id, mentre il doc del flusso approvato chiede la voce leggibile di TX-0060
- **Verdetto**: ACCETTATO. La scelta della correzione e' la decisione D1.
- **Motivo**: verificato.
  - Il doc approvato dice "Chip dei filtri attivi con la voce leggibile da TX-0060" (`verifica-smp-non-sigc.md:48-49`).
  - L'hook invece passa `attivi: filtriNellaBarra` (`useFiltriNellIndirizzo.ts:24`), che mette nel chip il valore grezzo
    (`entities/filtri/lib/programma.ts:113-115`).
  - Il low-fi dello stesso flusso approvato mostra pero' "Intervento: SRD01" (`verifica-smp-non-sigc.html:49`), come le
    barre di finanziario e fisico. I due artefatti approvati non concordano, quindi decide l'utente.
  - Il precedente e' V-07 del finanziario: uno scostamento non registrato da un wireframe approvato vale MINORE.
- **Severita' finale**: MINORE

#### V6: Il test di pagina dichiara in commento che il grafico omette e dichiara gli interventi senza spesa, ma non lo verifica e i dati non lo prevedono
- **Verdetto**: DECLASSATO
- **Motivo**: verificato.
  - Il commento di `verifica-smp-non-sigc/page.test.tsx:62` e' falso: in `VERIFICA` tutte le righe hanno la spesa
    valorizzata.
  - Il requisito pero' e' provato in L1 (`istituzionale-lib.test.ts:306-317`, `graficoSpesa` con SRD04 omesso), e la lista
    degli omessi la rende il kit (`CardGrafico.tsx:44-48`).
  - La composizione e' un passaggio diretto di `dati`. Resta un commento che dice il falso: COSMETICO.
- **Severita' finale**: COSMETICO (da MINORE)

#### V8: Titolo del documento del dettaglio diverso dal wireframe approvato
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Il wireframe ha `<title>Intervento SRA01 - Istituzionale - ...` (`intervento.html:8`), mentre il
  codice usa `${codice} - Istituzionale` (`DettaglioIntervento.tsx:167`). Il test fissa la forma attuale
  (`interventi/page.test.tsx:61`).
- **Severita' finale**: COSMETICO

#### H2: Residuo dello spostamento di ApriNellElenco: il finanziario lo riesporta da LinkElenco
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - La riesportazione e' a `LinkElenco.tsx:12`, con sei import da `./LinkElenco` nel finanziario.
  - `tests/kit-comune-istituzionale.test.tsx:16, 101` la rende permanente.
  - Il precedente e' H3 COSMETICO, sulle riesportazioni residue (`review/fisico-review.md:16`).
- **Severita' finale**: COSMETICO

#### H3: rispostaDatoNonValido non ha consumatori in src
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `api/index.ts:71` e' usata solo da `tests/istituzionale-api.test.tsx` (:13, :67, :72, :111). Il
  400 dell'export passa da `messaggioOltreIlLimite` del kit. E' codice morto di una riga, senza difetto: lo stesso metro di
  H8 del fisico.
- **Severita' finale**: COSMETICO

#### H4: La regola del focus dopo 'Applica i filtri' e' copiata dal fisico invece di stare accanto al pannello comune
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `usePannelloConFocus` (`useFiltriNellIndirizzo.ts:29-47`) ripete il tipo `Pannello`, l'h1 con
    `useFocusDopoIlCambio` e `onApplica` di `SuperficiAmmissibili.tsx:80-107`.
  - Il pannello e' stato reso comune proprio per l'istituzionale, ma la regola resta in due copie. Sono circa 15 righe: una
    duplicazione nuova, sotto soglia.
- **Severita' finale**: MINORE

#### H5: Un hook di focus generico sta nei 'mattoni di DOMINIO' della feature e duplica quello privato di AvvisoPagina
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. `useFocusSeSparisce` (`comuni.tsx:21-28`) ripete `useFocusDopoAvviso` (`AvvisoPagina.tsx:38-47`). E'
  una duplicazione sotto soglia, in un layer che si dichiara di dominio (riga 1).
- **Severita' finale**: MINORE

#### H6: L'impaginazione dei due report istituzionali e' scritta due volte
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `VerificaSmpNonSigc.tsx:55-94` e `OutputRegionale.tsx:63-96` hanno la stessa sequenza di hook, lo stesso guscio
    (barra, Briciole, TestaPagina, ValoriNonDisponibili, pannello) e lo stesso corpo (AvvisoPagina, attesa, VistaQuery col
    vuoto coi filtri).
  - Sono circa 20 righe, fra le soglie di 15 e 30.
- **Severita' finale**: MINORE

#### H7: Piccole copie nuove di codice gia' presente nel fisico e nel finanziario
- **Verdetto**: ACCETTATO
- **Motivo**: verificato. Le copie sono quattro:
  - `testoPerimetro` (`formato.ts:13-15`) e' identico a `fisico/lib/formato.ts:102-104`;
  - `useContesto` (`comuni.tsx:70-74`) ripete `SuperficiAmmissibili.tsx:48-56`;
  - `ricercaConservata` (`pagine.ts:37-39`) ripete `aree.ts:58`;
  - `anniDiRiferimento` (`criteri.ts:27-32`) ripete `anniSelezionabili` (`finanziario/lib/filtri.ts:31-36`).

  Ognuna e' sotto soglia, ma due sono di piu' righe e alla terza copia. Il metro e' quello di H2 del fisico.
- **Severita' finale**: MINORE

#### H8: Link G4: il percorso e il grant della pagina del finanziario sono copiati come letterali, e il loro test e' tautologico
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `VERIFICA_SMP_SIGC` (`collegamenti.ts:12`) e `GRANT.verificaSigc` (`grant.ts:20`) copiano `PERCORSI.verificaSmp` e
    `GRANT.verificaSmp` del finanziario (`report.ts:45, 25`). Oggi coincidono.
  - `istituzionale-lib.test.ts:110` confronta il letterale con se stesso.
  - La route e la visibility nella route-table (`route-table.json:220`) non sono verificate: un cambio del finanziario
    porterebbe la frase G4 a un 404, o al profilo sbagliato, senza che nessun test fallisca.
- **Severita' finale**: MINORE

#### H9: L'ordine fisso degli ambiti e' scritto in due posti e si appoggia a chiavi stringa non tipizzate
- **Verdetto**: DECLASSATO
- **Motivo**: verificato (`aree.ts:121-124`, `chiave: string` a :30).
  - Il test `tests/app-aree.test.tsx:87-93` fissa titoli, ordine, numero e chiavi uniche: un refuso o un ambito nuovo fuori
    lista fa fallire la suite, quindi non arriva in produzione.
  - Resta una seconda fonte dell'ordine e la mancanza di un tipo: COSMETICO.
- **Severita' finale**: COSMETICO (da MINORE)

#### H10: Due tipi CriteriVerifica diversi nella stessa slice, e i parametri di TX-0016 non sono nel controllo statico del contratto
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Due tipi con lo stesso nome: `lib/criteri.ts:12` (scritto a mano) e `api/index.ts:50` (`Tx0016Params`).
  - `ui/contratto.ts:11-18` controlla solo le forme delle risposte.
  - Con un oggetto non letterale e un tipo di destinazione tutto facoltativo, un `anno` rinominato nella spec compilerebbe
    ancora.
  - La spec e' pinnata, quindi il rischio e' latente. Il nome doppio pero' confonde gia' oggi (`esportazioni.ts:10` contro
    `ReportVerifica.tsx:26`).
- **Severita' finale**: MINORE

#### H11: Il generatore dei dati d'esempio di TX-0016 supera la soglia di complessita' (ciclomatica 22)
- **Verdetto**: DECLASSATO
- **Motivo**: verificato (`api/mock/esempio.ts:19-45`).
  - La soglia di complessita' del progetto (`eslint.config.js:384`) vale per ui/, pages e widgets. I moduli di prova
    `api/mock` ne sono fuori per scelta (:390-393).
  - E' un letterale di dati con condizioni indipendenti, senza percorsi di business, del solo dev server.
  - La parte sul filtro copiato si sovrappone a V3, che tocca lo stesso file: conviene correggerli insieme.
- **Severita' finale**: COSMETICO (da MINORE)

#### A2: Link 'Apri nell'elenco' e 'Apri nei pagamenti' non fail-closed sul codice dell'intervento
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - `indirizzoDelDato` (`verifica.ts:92-96`) passa `r.codiceIntervento` senza `valoreFiltroValido`. All'arrivo l'elenco
    scarta un valore vuoto o con caratteri di controllo (`elenco-operativo/lib/criteri.ts:91-94`) e apre un insieme piu'
    largo di quello che il nome accessibile dichiara.
  - Il finanziario e' fail-closed sullo stesso caso (`link-elenco.ts:107-108`).
  - Serve un dato anomalo del backend: MINORE.
  - La parte su `apri` di `useApriIntervento` (`navigazione.ts:24`) non apre fughe, perche' il dettaglio convalida il codice
    e mostra "Intervento non valido". Resta una coerenza facoltativa.
- **Severita' finale**: MINORE

#### A3: Dettaglio, cambio dell'anno della verifica: i dati dell'anno precedente restano senza avviso visivo ne' annuncio
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Il contenitore ha solo `aria-busy` (`SchedeIntervento.tsx:90`), senza `ui-risultati`: lo stile di aggiornamento del kit
    vale solo per `.ui-risultati` e `.ui-sinottico` (`tema.css:411-412`).
  - Non c'e' nessun testo di stato. Intanto didascalia e voci dicono l'anno di prima, mentre il selettore dice il nuovo.
  - Il pattern del progetto per i dati tenuti durante l'aggiornamento e' quello dell'elenco: aria-busy, AvvisoAggiornamento
    e `ui-risultati` (`interrogazione.tsx:94, 100`).
- **Severita' finale**: MINORE

#### A4: Nessun test distingue i due grant dei link verso l'elenco ne' il ritorno alla verifica del dettaglio senza TX-0017
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Il ternario di `navigazione.ts:35` non e' provato: i test di pagina usano profili con tutti e due i grant (P3_IST, il
    predefinito) oppure con nessuno (:131-138). Lo scambio dei rami lascerebbe verdi tutti i test.
  - Il test di :119 dichiara "senza i grant dell elenco nessun link" e prova solo i valori a zero; il caso dei grant lo
    prova :131.
  - Il ramo "Torna alla verifica SMP non SIGC" di `SenzaDati` (`DettaglioIntervento.tsx:117-118`) non ha test.
  - E' un gate di UX: il backend ridecide (403 all'arrivo). MINORE.
- **Severita' finale**: MINORE

#### X2: Il dettaglio legge TX-0016 e TX-0017 all'apertura della pagina, contro il wireframe approvato, e la deviazione non e' registrata
- **Verdetto**: ACCETTATO. La correzione e' la decisione D2.
- **Motivo**: verificato.
  - Cosa fa il codice: `useLettureDelDettaglio` (`DettaglioIntervento.tsx:35-44`) abilita le due letture col solo grant, e
    il test lo fissa (`interventi/page.test.tsx:42-43`).
  - Cosa dice il wireframe approvato: "le schede leggono solo quando si aprono" (`intervento.md:107-108`,
    `intervento.html:64`).
  - La scelta e' obbligata, perche' lo stesso wireframe mette sopra le schede i KPI e i badge che usano le due letture.
  - Pero' i `deviations_reviewed` di `wireframe_intervento` non la registrano: elencano solo OP-IS-09, OP-IS-08, OP-IS-06 e
    il terzo flusso. Il precedente e' V-07 del finanziario, MINORE.
- **Severita' finale**: MINORE

#### X3: Nomi accessibili dei file difformi dal low-fi approvato
- **Verdetto**: ACCETTATO
- **Motivo**: verificato.
  - Nella verifica la card non passa `oggetto` (`ReportVerifica.tsx:31`), quindi il CSV, che e' l'export completo di
    TX-0016, si chiama "Scarica il grafico Spesa pubblica erogata per intervento (anticipi inclusi) in CSV"
    (`CardGrafico.tsx:149`; test `verifica-smp-non-sigc/page.test.tsx:61, 146`).
  - Il low-fi approvato chiama quel file "Scarica i dati della verifica SMP non SIGC in CSV" (`verifica-smp-non-sigc.html:106`).
  - Nel dettaglio il PNG si chiama "il grafico e i dati dell'output dell'intervento SRA01" (`SchedeIntervento.tsx:43`), ma
    contiene solo l'immagine.
  - Il low-fi lo vuole diverso (`intervento.html:95`). E' WCAG 2.4.6: il nome dice un contenuto diverso dal file.
- **Severita' finale**: MINORE

## Punti dichiarati dal resoconto

- **Tabella della verifica ordinata per codice.** Il backend risponde in ordine di codice (SC-IS_SMP_NONSIGC), il doc del
  flusso non dichiara un ordine e le righe del low-fi sono casi d'esempio. Non e' un finding. L'ordine della fixture rientra
  in V3.
- **Unita' in ogni cella dell'output regionale.** Segue la nota WCAG dello uiplan "Unita' di misura sempre accanto al
  valore" (`uiplan.json:897`) e il residuo del flusso (`output-regionale.md:135-136`). Non e' un finding.
- **Chip col codice.** E' V5, con la decisione D1.
- **Nomi accessibili dei pulsanti di scaricamento.** E' X3: il low-fi approvato e' esplicito, il kit con un solo `oggetto`
  per card non basta.
- **Titolo del drawer "Anteprima: <codice>".** E' quello del low-fi (`output-regionale.html:124`). Non e' un finding.
- **Anni proposti dal selettore.** Sono il periodo CSR, l'anno della risposta e quello scelto; la spec non elenca gli anni
  dei file. Non e' un finding: la sola copia della funzione rientra in H7.
- **TX-0016 e TX-0017 all'apertura della pagina.** E' X2, con la decisione D2.
- **Test instabile del pannello chiuso con Esc.** L'istituzionale e' gia' corretto. Il gemello del fisico e' V7.

## Riepilogo

- Accettati: 24 finding distinti, di cui 19 senza cambi di severita' e 5 declassati.
  - MINORE 18: V1, A1, V3, V4, V5, V7, H1, H4, H5, H6, H7, H8, H10, A2, A3, A4, X2, X3.
  - COSMETICO 6: V6, V8, H2, H3, H9, H11.
- Assorbiti come duplicati: 3 (V2 in A1, A5 in V7, X1 in H1).
- Rigettati: 0.
- Declassati: 5.
  - A1 e H1 da MAGGIORE a MINORE.
  - V6, H9 e H11 da MINORE a COSMETICO.
- Punteggio atteso (`review-score.sh FULL`): 100 - 54 - 6 = **40**. Il verdetto e' **FAIL** per lo score sotto 80. Non
  restano CRITICO ne' MAGGIORE.
- Per convergere, con i 6 COSMETICO ancora aperti si possono lasciare al piu' 4 MINORE (score 82). Chiudendo anche i
  COSMETICO se ne possono lasciare 6 (score 82).
  - V5 e X2 si chiudono con la registrazione della deviazione, se l'utente sceglie cosi'.

## Finding contestati

**CRITICO rigettati**: nessuno, perche' non c'erano finding CRITICO in ingresso.

Declassamenti e parti di finding che non accolgo:
- **A1**, la severita' MAGGIORE. E' declassato a MINORE per il precedente N-02 del finanziario: il PNG non dichiara i
  filtri giusti, ma non c'e' esposizione di dati.
- **H1**, la severita' MAGGIORE. E' declassato a MINORE:
  - resta un solo alert;
  - il messaggio e' giusto;
  - il percorso e' degradato;
  - i precedenti A1 e A2 del fisico sono MINORE.
- **V3**, l'ordine della fixture. Ordinarla toglie la prova dell'ordinamento della tabella: il fix aggiunge un test L2 con
  righe fuori ordine.
- **V4**, la citazione `TabellaOutput.tsx:120`. Il punto giusto e' :24 (`TestoOAssente`). Il finding e' accettato.
- **V6, H9, H11**, declassati a COSMETICO con i motivi sopra.
- **V7**, "cercare altri controlli del focus". Il grep non ne trova altri: il fix si limita alla riga 394.
- **A2**, la parte su `apri` di `useApriIntervento`. Non c'e' fuga, perche' il dettaglio convalida il codice: e' facoltativa.

## Decisioni da chiedere all'utente

- **D1, chip dei filtri col codice o con la voce leggibile** (V5; `useFiltriNellIndirizzo.ts:24`; flussi
  verifica-smp-non-sigc e output-regionale).
  - Il problema: il doc approvato chiede la voce leggibile di TX-0060 (`verifica-smp-non-sigc.md:48-49`, richiamato da
    `output-regionale.md`). Il low-fi approvato dello stesso flusso, il codice e le barre di finanziario e fisico mostrano il
    codice ("Intervento: SRD01").
  - **Raccomandazione**: registrare la deviazione con `state-set.sh` nei `deviations_reviewed` dei gate
    `wireframe_verifica-smp-non-sigc` e `wireframe_output-regionale`. Testo proposto: "chip dei filtri col codice, come nel
    low-fi approvato e nelle barre di finanziario e fisico; la descrizione e' nel pannello e nella testata del dettaglio".
    - Il codice non cambia e non serve riapprovare i wireframe.
    - Il chip dell'azione portante con l'id numerico oggi non si vede mai senza "non applicato" (il legame non c'e').
      Quando il legame arrivera' andra' rivisto per tutte e tre le aree, in `entities/filtri`.
  - Alternativa: la voce leggibile accanto al codice, in `entities/filtri` per tutte e tre le aree, nello stesso giro.
    Tocca finanziario e fisico, che sono chiusi in review, e i loro test dei chip.
- **D2, letture del dettaglio all'apertura della pagina** (X2; `DettaglioIntervento.tsx:35-44`; flusso intervento).
  - Il problema: il wireframe approvato dice "le schede leggono solo quando si aprono" (`intervento.md:107-108`), ma lo
    stesso wireframe vuole sopra le schede KPI e badge che usano TX-0016 e TX-0017. La lettura all'apertura e' obbligata.
  - **Raccomandazione**: registrare la deviazione nei `deviations_reviewed` del gate `wireframe_intervento`. Testo proposto:
    "TX-0016 e TX-0017 si leggono all'apertura della pagina, non della scheda: KPI e badge della testata le usano; le schede
    leggono dalla stessa cache, nessuna lettura in piu'".
    - Insieme, il test che lo prova: dopo l'apertura delle schede Verifica e Importi, ancora una sola lettura per
      transazione.
    - Non correggere `intervento.md`, perche' cambierebbe l'hash e il flusso andrebbe riapprovato.
  - Le due letture in piu' all'apertura stanno nella coda comune di 2 letture: e' lo stesso costo che serve ai KPI.

## Note per il giro di correzione

- Ordine consigliato:
  1. H1 con X1, nel dettaglio;
  2. A1 e A3, sempre nel dettaglio;
  3. V1, A2, A4, V4, X3;
  4. V3 insieme a H11, sulla fixture e sul mock;
  5. le duplicazioni H4, H5, H6, H7, H8, H10;
  6. V7, il test del fisico;
  7. le registrazioni D1 e D2 dopo la scelta dell'utente;
  8. per ultimi i COSMETICO.
- Ogni modifica invalida le approvazioni sha256 del gate. Prima della iterazione 2 bisogna rieseguire lo step8 (11/11)
  dell'istituzionale.
- Alcuni fix toccano il codice comune o le altre feature, e allora va rifatto anche lo step8 di finanziario, fisico ed
  elenco operativo:
  - X3: `CardGrafico` del kit;
  - H4: `entities/filtri`;
  - H5: `shared/ui/focus` e `AvvisoPagina`;
  - H7: `testoPerimetro` e `useContesto` del fisico, `anniSelezionabili` del finanziario;
  - H2: `LinkElenco` del finanziario;
  - V7: il test del fisico;
  - A3: `AvvisoAggiornamento` dell'elenco.
- Le registrazioni D1 e D2 cambiano solo i `deviations_reviewed`, non i file dei flussi: non serve riapprovare i wireframe.
- Regressioni di finanziario, fisico ed elenco operativo: nessuna lente ne ha segnalate, e le mie verifiche non ne mostrano.
  - `SelettoreAnno` del finanziario e' un involucro con lo stesso markup e lo stesso comportamento.
  - `CardGrafico` tiene per default il nome "il grafico <titolo>".
  - `InterruttoreVista` ha lo stesso markup.
  - L'authz delle tre feature e' pass.

  I fix di H2, H4, H5, H7, A3 e V7 toccano il loro codice o i loro test, che devono restare verdi.
