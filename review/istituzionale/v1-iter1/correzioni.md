# Correzioni della review step9 FULL dell'istituzionale, v1 iterazione 1 (22-23/10/2026)

Giro di correzione dei finding accettati dal Judge (`judge.md`, `../../istituzionale-findings.json`): iniziato il 22/10 e
interrotto su richiesta dell'utente dopo H4, ripreso e chiuso il 23/10 (da H5 a X2). Base: `81ea1d8` (review). Commit su
`main`, uno per sottoargomento, **non pushati**. Nessuna modifica a `.claude/state/`, wireframe, uiplan, dossier, backend
o plugin; lo step8 non e' stato lanciato (lo fa la sessione principale). V5 non toccato (decisione D1 dell'utente); di X2
solo il test (la deviazione D2 l'ha registrata la sessione principale nel commit `5c1824a`, insieme a D1).

Per ogni correzione il test nuovo o adattato e' stato provato rosso togliendo temporaneamente la correzione (`git stash`
dei file sorgente, oppure una mutazione del codice per i finding solo di test), poi verde con la correzione. Per i finding
di soli tipi (H9, H10) la prova e' `tsc`: vitest non controlla i tipi.

## Finding fatti

| finding | commit | cosa e' cambiato | test che lo prova | effetti sul codice comune e sulle altre feature |
|---|---|---|---|---|
| **H1** (assorbe X1) | `e072e58` | `ErroriDelleLetture` (DettaglioIntervento) e' il solo a registrare nell'avviso della pagina l'errore di ogni lettura senza risposta, con `useErroreNellaPagina` (ora esportato dal kit con `ErroreNellaPagina`); le tre VistaQuery delle schede passano `errorePersonalizzato` col solo testo statico. `statoDelDettaglio(letture, giaRisposte)`: scheletro di tutta la pagina alla prima apertura finche' non hanno risposto tutte le letture (`tutteRisposte`), poi solo se nessuna lettura ha dati; una lettura che riparte accanto a una coi dati (Riprova, un altro anno dopo un errore) mostra lo scheletro nella sua scheda. La scheda attiva sale in `Dettaglio` (`scheda`, `onScheda`) | `interventi/page.test.tsx`: TX-0016 in errore ("Una sezione...", prima e dopo l'apertura della scheda, un solo "Dati non caricati"); TX-0017 in errore (scheda Output); Riprova dopo il 503 di TX-0016 con la risposta trattenuta (KPI "Target di fine periodo" e scheda Verifica restano); "Mostra" 2024 dopo l'errore (scheda Verifica scelta, focus su Mostra). L1 di `statoDelDettaglio` e `tutteRisposte` | kit: nuovi export `ErroreNellaPagina` e `useErroreNellaPagina` (stesso componente e stesso hook di prima, ora pubblici); nessun cambiamento per le altre feature |
| **A1** (assorbe V2) | `53452ca` | Contesto del PNG del dettaglio coi soli criteri di TX-0017: `useContesto(testiCriteri(soloIntervento(codice)), ultimi)` | `interventi/page.test.tsx`: su `/istituzionale/interventi/SRA01?anno=2024` il PNG della card "Output programmato e realizzato per anno (ettari)" ha "Filtri applicati: Intervento: SRA01" e nessun "Anno di riferimento" (mock di `pngDelGrafico`) | nessuno |
| **A3** | `7254cc7` | `AvvisoAggiornamento` passa da `elenco-operativo/ui/comuni.tsx` al kit (`shared/ui/stati/StatiVista.tsx`, dal barrel), stesso markup e testo predefinito. Scheda Verifica: contenitore `ui-risultati` con `aria-busy` e, durante `isPlaceholderData`, "Lettura dell'anno 2024 in corso: restano i dati dell'anno precedente." (`testoAggiornamentoAnno`, lib) | `interventi/page.test.tsx` con la lettura del 2024 trattenuta (status col testo, `aria-busy="true"`, didascalia 2025; poi status vuoto e didascalia 2024); L1 del testo; L2 del kit in `tests/kit-comune-istituzionale.test.tsx` | elenco operativo: `ElencoPagamenti`, `interrogazione` e `SinotticoDomande` importano `AvvisoAggiornamento` dal kit, stesso markup e testo; i suoi test verdi senza modifiche |
| **V1** | `69d0981` | `useState<Misura>` da `ReportOutput` a `OutputRegionale`, passato a `CorpoOutput` e `ReportOutput` | `output-regionale/page.test.tsx`: con "Realizzato SIGC" scelto, il chip SRA16 tolto rilegge il report e il bottone resta `aria-pressed=true` con la didascalia della misura | nessuno |
| **A2** | `c1ca1d7` | `indirizzoDelDato` restituisce null se `codiceDelPercorso(r.codiceIntervento)` e' null (come `indirizzoDelLink` del finanziario). La parte facoltativa su `apri` di `useApriIntervento` non e' fatta | L1 in `tests/istituzionale-lib.test.ts` con ' ', 'SRD01' seguito da U+200B, '' e 'SRD01&tipo=PAGAMENTO': nessun link | nessuno |
| **A4** | `77971af` | Solo test. Il test dei valori a zero rinominato su cio' che prova | `verifica-smp-non-sigc/page.test.tsx`: col solo `csr.tx-0056.read` solo "Apri nell'elenco", col solo `csr.tx-0059.read` solo "Apri nei pagamenti"; `interventi/page.test.tsx`: AT001 col solo `csr.tx-0016.read`, "Torna alla verifica SMP non SIGC" e nessuna lettura di TX-0017. Provati rossi con lo scambio dei rami di `usePuoAprireElenco` e il link di `SenzaDati` fisso sull'output | nessuno |
| **V4** | `b68c3dd` | `vociAnteprima`: con `indicatoreOutput` null "non valorizzato (il dato non è presente nella fonte)" (`testoMotivato` con `TESTO_ASSENTE`), senza l'unita' | L1 sulla riga SRG01 della fixture, anche con un'unita' | nessuno |
| **X3** | `1e0094b` | Kit: `Scaricamento.oggetto` facoltativo (nome del singolo pulsante) e `CardGrafico.oggettoDati` al posto di `oggetto` (che usava solo l'istituzionale): i file dei dati hanno il loro oggetto, il PNG resta "il grafico <titolo>". Verifica: CSV e XLSX della card "i dati della verifica SMP non SIGC" (`OGGETTO_FILE_VERIFICA`, lo stesso della tabella); dettaglio: CSV e XLSX "l'output e gli importi unitari dell'intervento SRA01" | Pagine di verifica (nomi dei tre pulsanti della card; i CSV e XLSX della tabella si cercano dentro la sua sezione, perche' hanno lo stesso nome di quelli della card) e del dettaglio; `tests/istituzionale-ui.test.tsx`; L2 del kit (CardGrafico con `oggettoDati`, PulsantiScarica con un file col suo oggetto) | kit: `Scaricamento.oggetto` e `CardGrafico.oggettoDati`; senza `oggettoDati` i nomi dei pulsanti sono quelli di prima, quindi finanziario e fisico non cambiano |
| **V3** con **H11** | `604efb8` | Fixture (`conAnno`) e mock (`rigaDellAnno`): con un anno diverso dal 2025 tutti gli otto dati dell'avviso ANNO_NON_CONSERVATO, anche avvisi attivati e chiusi e concessioni previste; un anno senza file (2023) ha indicatori e output (atteso ed erogato) NON_VALORIZZATO; un intervento senza avviso resta NON_VALORIZZATO. Righe della fixture e del mock in ordine di codice (SRA01, SRA16, SRD01). H11: il mock compone `CON_FILE` e `SENZA_FILE` (la parte facoltativa del filtro condiviso fra mock e fixture non e' fatta: nessun mock importa oggi dai moduli `testing/`) | L1 della fixture (SC-IS_SMP_ANNO 2024 e 2023, ordine) e del mock (`tests/istituzionale-api.test.tsx`); L2 nuovo di `TabellaVerifica` con righe fuori ordine (prima SRA01, `aria-sort` ascending), provato rosso con un `ordineIniziale` su un'altra colonna; indici del clic sulla barra di SRD01 da 1 a 2 | nessuno |
| (pulizia) | `9fc0eaf` | Solo spaziatura: una riga vuota spuria dopo l'ultima riga sostituita in quindici file dei commit V1, A2, V4, X3 e V3 (lo script di sostituzione la aggiungeva) | nessuno | nessuno |
| **H4** | `e19ac59` | `usePannelloConFocus<C extends Filtri>(criteri, applica, ricerca)` e il tipo `PannelloAperto` in `entities/filtri/ui`, dal barrel (pannello, `onApplica` col focus sull'h1 solo dallo stato vuoto con criteri nuovi, `applicaConFocus`). Il fisico (`SuperficiAmmissibili`, `ricercaDaCriteri`) e l'istituzionale (verifica e output, `ricercaDaFiltri`) lo usano al posto delle due copie | L2 dell'hook in `tests/entita-filtri-ui.test.tsx`; restano verdi i test di focus delle pagine di fisico e istituzionale | entities/filtri: hook nuovo; fisico: `SuperficiAmmissibili` usa l'hook comune, stesso comportamento, i suoi test di focus verdi senza modifiche |
| **H5** | `ff7cf80` | `useFocusSeSparisce(visibile, destinazione)` esportato dal kit (`shared/ui/focus.ts`): se il contenuto sparisce col comando che aveva il focus (finito su BODY) il focus va sull'elemento del ref, se l'utente l'ha portato altrove resta li'. `AvvisoPagina` lo usa al posto di `useFocusDopoAvviso` (il contenitore dopo un Riprova riuscito), `ValoriNonDisponibili` al posto della copia in `comuni.tsx` | L2 dell'hook in `tests/kit-comune-istituzionale.test.tsx` (sparito col bottone: focus sul titolo; focus altrove: resta; mai al montaggio), rosso senza la correzione e con la mutazione che toglie la condizione del focus perso; verdi senza modifiche il test del focus di `AvvisoPagina` (`tests/shared-ui.test.tsx`) e quello di `ValoriNonDisponibili` | kit: export nuovo; `AvvisoPagina` (usata da tutte le feature) ha lo stesso comportamento: stesso valore iniziale (nessun errore al montaggio) e stessa condizione |
| **H6** | `60b5cfa` | `PaginaReport<D>` (`ui/PaginaReport.tsx`): barra dei filtri a chip con le pill del perimetro, della risposta e "Dati al", percorso, testata col solo h1 e il focus, stato dei valori dei filtri non disponibili, corpo (un solo avviso, attesa del legame con le azioni, VistaQuery col vuoto e "Modifica i filtri") e pannello. `useFiltriDellaPagina(conAnno)` (in `useFiltriNellIndirizzo.ts`) mette insieme filtri nell'indirizzo e `usePannelloConFocus`. `VerificaSmpNonSigc` e `OutputRegionale` passano solo testi, la pill della risposta, cosa sta sopra (il selettore dell'anno) e il report; il contesto del PNG della verifica passa in `ReportVerifica`, stesse righe | L2 nuovo in `tests/istituzionale-ui.test.tsx` con un report di prova (barra, chip, pill, percorso, h1 col focus, titolo del documento, nota, `sopra` prima del report, pannello coi codici della risposta senza TX-0060; vuoto con "Modifica i filtri"; errore con un solo avviso e la pill "non disponibile"): rosso senza il componente e con la mutazione che toglie `sopra`; i test delle due pagine verdi senza modifiche (stesso DOM) | nessuno: solo istituzionale |
| **H7** | `107b987` | Una copia per ciascuna: `testoPerimetro` in `shared/lib/intestazione.ts` (fisico e istituzionale; nell'istituzionale `PERIMETRO_IN_PAROLE`); `anniProposti(primo, ultimo, ...altri)` in `shared/lib/anni.ts` (`anniSelezionabili` del finanziario, `anniDiRiferimento` dell'istituzionale); `useRigheContesto(criteri, ultimi, perimetro?)` nel kit (`shared/ui/grafici`), al posto di `useContesto` dell'istituzionale (verifica e dettaglio), della copia del fisico (`SuperficiAmmissibili`) e del corpo di `useRigheIntestazione` del finanziario (stessa forma); `ricercaDeiSoliFiltri(search)` in `entities/filtri` (finanziario in `app/aree.ts`, `ricercaConservata` dell'istituzionale) | L1 di `anniProposti` e `testoPerimetro` (`tests/lib.test.ts`) e di `ricercaDeiSoliFiltri` (`tests/entita-filtri-domanda.test.ts`), L2 di `useRigheContesto` (righe, perimetro facoltativo, profilo, stesso oggetto coi dati uguali) in `tests/kit-comune-istituzionale.test.tsx`: rossi senza la correzione. In piu', a protezione dei consumatori, l'intestazione del PNG nei test di pagina della verifica (filtri e anno, perimetro, profilo, ultimo dato) e delle superfici del fisico | shared/lib, kit ed entities/filtri: funzioni e hook nuovi. Finanziario (`anniSelezionabili`, `useRigheIntestazione`, `ricercaConservata` in `aree.ts`) e fisico (`SuperficiAmmissibili`, `lib/formato` senza `testoPerimetro`): stessi valori e stesse righe; i loro test verdi senza modifiche, nel fisico un test di pagina nuovo (PNG). L'elenco operativo ha un suo `testoPerimetro` con un'altra resa (ADA "del tuo profilo", null) e righe di contesto proprie: non e' nel finding, non toccato |
| **H8** | `9ff9e4d` | Solo test. In `tests/app-aree.test.tsx` la route-table ha `VERIFICA_SMP_SIGC` (componente della pagina della verifica SMP del finanziario) con visibility `[GRANT.verificaSigc]`; tolta l'asserzione tautologica di `tests/istituzionale-lib.test.ts` | Provato rosso con tre mutazioni: route spostata nella route-table, grant della route cambiato, grant della frase cambiato | nessuno (test della shell) |
| **H10** | `ac9fe64` | `CriteriVerifica` di `lib/criteri.ts` rinominato `CriteriDellaVerifica` (un nome per tipo; `CriteriVerifica` resta quello di api/, `Tx0016Params`). In `ui/contratto.ts` `CONTRATTO_CRITERI_VERIFICA` (chiavi di `CriteriDellaVerifica` = chiavi di `Tx0016Params`) e `CONTRATTO_CRITERI_OUTPUT` (chiavi di `Filtri` = chiavi di `Tx0017Params`) | `tsc`: con `anno` di `Tx0016Params` o `os` di `Tx0017Params` rinominati nel generato (temporaneamente) fallisce su `contratto.ts`; senza i controlli in `src` compilava tutto (fallivano solo i letterali di `tests/istituzionale-api.test.tsx`) | nessuno |
| **V7** (assorbe A5) | `f002647` | Solo test. `await waitFor(() => expect(document.activeElement).toBe(bottone))` dopo Esc in `src/pages/fisico/superfici/page.test.tsx`, come il gemello dell'istituzionale. Il grep non trova altre asserzioni sincrone del focus dopo la chiusura di un dialogo | L'instabilita' si e' vista anche in questo giro: il test e' fallito una volta (focus su BODY) in un giro di sei file in parallelo durante H7, verde da solo. Provato rosso con la mutazione che alla chiusura del pannello porta il focus sull'h1 (`usePannelloConFocus`): il `waitFor` non rende vuoto il test | fisico: un test di pagina reso stabile, nessun cambio al codice |
| **V6** | `31a3d79` | Solo test. Il test del titolo e della card della verifica legge anche SRD04 con la spesa erogata NON_VALORIZZATO: la serie ha SRA01 a 0 (barra vera), SRA16 e SRD01, la card dichiara "1 voce non nel grafico" col motivo di SRD04. Il commento ora e' vero | Provato rosso con l'assenza disegnata come zero in `graficoSpesa` | nessuno |
| **V8** | `f9f04e2` | Titolo del documento del dettaglio `Intervento ${codice} - Istituzionale`, come nel wireframe approvato | `interventi/page.test.tsx`: "Intervento SRD01 - Istituzionale - Cruscotto CSR 2023-2027", rosso senza la correzione | nessuno |
| **H2** | `82cc193` | I sei componenti del finanziario (`colonneAnno`, `DettaglioIntervento`, `DomandeReport`, `Panoramica`, `RiepilogoReport`, `SigcReport`) importano `ApriNellElenco` da `entities/domanda`; `LinkElenco` non lo riesporta (commento aggiornato) | In `tests/kit-comune-istituzionale.test.tsx` l'asserzione che fissava la riesportazione e' sostituita da un test che `LinkElenco` espone solo `useLinkElenco` e `useApriNellElenco`, rosso senza la correzione; test del finanziario verdi (18 file, 510 test) | finanziario: solo import, stesso componente e stesso comportamento |
| **H3** | `a423c6e` | Tolti `rispostaDatoNonValido` e l'import di `eProblema` da `api/index.ts` (commento sugli errori aggiornato) | `tests/istituzionale-api.test.tsx`: il 400 DATO_NON_VALIDO con `eProblema(errore, 'invalid-data')`, il 400 dell'export oltre il limite anche con `messaggioOltreIlLimite` (testo del kit) e il barrel api senza il predicato, rosso senza la correzione | nessuno: il fisico ha il suo `rispostaDatoNonValido`, usato da `DetermineDellaDomanda`, invariato |
| **H9** | `56404ee` | `ORDINE_AMBITI` (`as const`) e' la sola fonte dell'ordine e delle chiavi dei quattro ambiti: `ChiaveAmbito = (typeof ORDINE_AMBITI)[number]`; `AREE`, `AREE_FUTURE` e `AMBITI` hanno la chiave di tipo `ChiaveAmbito` (gli strumenti trasversali restano con una chiave libera). E' la variante "unione dall'ordine" del fix, che copre anche la completezza dei tipi | `tests/app-aree.test.tsx`: chiavi tipizzate e un `@ts-expect-error` su una chiave fuori ordine; `tsc` rosso senza la correzione. Mutazione: il refuso 'istituzonale' nella chiave dell'area fa fallire `tsc` su `aree.ts`, mentre prima compilava | app: solo tipi, Home e menu invariati (test della shell verdi) |
| **X2** | `8ab034d` | Solo test, nessuna registrazione. Il primo test di RF017 del dettaglio apre le schede Verifica SMP non SIGC e Importi unitari e torna a Output per anno: `lette.verifica` e `lette.output` restano di una voce | Provato rosso con due mutazioni: la scheda Verifica e la scheda Importi che rileggono all'apertura | nessuno |

V5 non e' nella tabella: e' la decisione D1 (chip col codice), la deviazione e' registrata e il codice non cambia.

## Effetti sul codice comune e sulle altre feature

Nessun fix ha cambiato il comportamento visibile di finanziario, fisico o elenco operativo: nessun finding e' stato
fermato per questo vincolo.

- **Kit (`shared/ui`)**: nuovi export `ErroreNellaPagina`, `useErroreNellaPagina` (H1), `AvvisoAggiornamento` (A3),
  `useFocusSeSparisce` (H5, usato da `AvvisoPagina` con lo stesso comportamento) e `useRigheContesto` (H7);
  `Scaricamento.oggetto` e `CardGrafico.oggettoDati` (X3, senza `oggettoDati` i nomi di prima).
- **`shared/lib`**: `testoPerimetro` (intestazione) e `anniProposti` (anni), H7.
- **`entities/filtri`**: `usePannelloConFocus` e `PannelloAperto` (H4), `ricercaDeiSoliFiltri` (H7).
- **App (`src/app/aree.ts`)**: la ricerca conservata del finanziario con `ricercaDeiSoliFiltri` (H7), le chiavi degli
  ambiti tipizzate (H9).
- **Finanziario**: `anniSelezionabili` su `anniProposti` e `useRigheIntestazione` su `useRigheContesto` (H7), gli import
  di `ApriNellElenco` dall'entity e `LinkElenco` senza riesportazione (H2). Stessi anni, stesse righe, stesso link.
- **Fisico**: `SuperficiAmmissibili` con l'hook comune del pannello (H4), `testoPerimetro` di `shared/lib` e
  `useRigheContesto` (H7); `lib/formato` senza la sua copia di `testoPerimetro`.
- **Elenco operativo**: `AvvisoAggiornamento` dal kit (A3), stesso markup e testo. Non toccato il 23/10.
- **Test delle altre feature e della shell cambiati**: `src/pages/fisico/superfici/page.test.tsx` (V7 `waitFor`; H7 un
  test nuovo dell'intestazione del PNG), `tests/kit-comune-istituzionale.test.tsx` (H2: l'asserzione sulla riesportazione
  del finanziario sostituita), `tests/app-aree.test.tsx` (H8, H9 test nuovi), `tests/lib.test.ts` e
  `tests/entita-filtri-domanda.test.ts` (H7, L1 nuovi), `tests/entita-filtri-ui.test.tsx` (H4, L2 nuovo). Nessun test
  di finanziario ed elenco operativo e' stato cambiato.

## Verifica finale (23/10/2026)

Prima suite completa dopo tutte le correzioni del giro, comprese quelle del 22/10:

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0.
- `npx vitest run`, due volte di seguito: verde entrambe, **63 file, 1281 test** (31 s circa ciascuna). Alla partenza del
  giro erano 63 file e 1254 test.

Il working tree e' pulito dopo il commit di questo resoconto.

## Feature e strati toccati (per lo step8)

Le approvazioni sha256 del gate sono invalidate: lo step8 (11/11) va rifatto per **istituzionale, finanziario, fisico ed
elenco operativo**.

- **Istituzionale**: `api` (`index.ts`, `mock/esempio.ts`), `lib` (`criteri`, `formato`, `intervento`, `output`, `pagine`,
  `verifica`), `testing` (`fixture`), `ui` (`DettaglioIntervento`, `SchedeIntervento`, `VerificaSmpNonSigc`,
  `OutputRegionale`, `ReportVerifica`, `PaginaReport` nuovo, `useFiltriNellIndirizzo`, `comuni`, `contratto`,
  `esportazioni`, `TabellaVerifica`), le tre pagine (test) e i test `tests/istituzionale-*`,
  `tests/kit-comune-istituzionale.test.tsx`.
- **Kit e `shared/lib`**: `shared/ui/focus.ts`, `stati/AvvisoPagina.tsx`, `stati/StatiVista.tsx`,
  `grafici/CardGrafico.tsx`, `grafici/useRigheContesto.ts` (nuovo), `scarica/PulsantiScarica.tsx`, `index.ts`;
  `shared/lib/anni.ts`, `shared/lib/intestazione.ts`.
- **Entities**: `entities/filtri` (`lib/programma.ts`, `ui/usePannelloConFocus.ts` nuovo, `index.ts`).
- **App**: `src/app/aree.ts`.
- **Finanziario**: `lib/filtri.ts`; `ui/LinkElenco.tsx`, `colonneAnno.tsx`, `DettaglioIntervento.tsx`,
  `DomandeReport.tsx`, `Panoramica.tsx`, `RiepilogoReport.tsx`, `SigcReport.tsx`, `useRigheIntestazione.ts`.
- **Fisico**: `lib/formato.ts`, `ui/SuperficiAmmissibili.tsx`, `src/pages/fisico/superfici/page.test.tsx`.
- **Elenco operativo**: `ui/ElencoPagamenti.tsx`, `ui/SinotticoDomande.tsx`, `ui/comuni.tsx`, `ui/interrogazione.tsx`
  (A3).
- Non toccati: wireframe, uiplan, dossier, `.claude/state/`, backend, plugin. Nessun push.

## Appunti

- Il tool Edit toglie gli spazi finali di `new_string` (due import erano finiti attaccati, corretti in `1e0094b`) e
  trasforma la sequenza di escape del carattere U+200B scritta nel testo nel carattere vero, anche in questo file
  (corretto a mano in `c1ca1d7`): niente spazi finali nelle sostituzioni e sequenze `\u` scritte con python.
- Lo script di sostituzioni a blocchi in scratchpad (`rep.py`) aggiungeva un a capo dopo l'ultimo blocco: corretto, le
  righe vuote rimaste sono state tolte in `9fc0eaf`. Con Python su Windows scrivere sempre con `newline='\n'` (un file
  era passato a CRLF, sistemato prima del commit di H1). Il 23/10 gli script sono stati scritti col tool Write e lanciati
  da bash: un heredoc con backtick e `${}` nel testo non veniva letto da bash.
- Le mutazioni si annullano dalla copia salvata in scratchpad, non con `git checkout` del file, che toglie anche la
  correzione non ancora committata (successo una volta con `focus.ts` di H5, ripristinato dalla copia).
- I nomi "Scarica i dati della verifica SMP non SIGC in CSV/XLSX" compaiono due volte nella pagina della verifica
  (card del grafico e tabella, come nel low-fi): nei test cercarli dentro la card o la sezione della tabella.
