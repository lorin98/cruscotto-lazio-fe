# Correzioni della review step9 FULL dell'istituzionale, v1 iterazione 1 (22/10/2026): resoconto PARZIALE

Giro di correzione dei finding accettati dal Judge (`judge.md`, `../../istituzionale-findings.json`), interrotto su
richiesta dell'utente dopo H4: si riprende domani. Base: `81ea1d8` (review). Commit su `main`, uno per sottoargomento,
**non pushati**. Nessuna modifica a `.claude/state/`, wireframe, uiplan, dossier, backend o plugin. V5 non toccato
(decisione D1 dell'utente); di X2 resta da fare solo il test (la deviazione D2 la registra la sessione principale, che
ha gia' fatto il commit `5c1824a` con D1 e D2).

Per ogni correzione il test nuovo o adattato e' stato provato rosso togliendo temporaneamente la correzione (`git
stash` dei file sorgente, oppure una mutazione del codice per i finding solo di test), poi verde con la correzione.

## Finding fatti

| finding | commit | cosa e' cambiato | test che lo prova |
|---|---|---|---|
| **H1** (assorbe X1) | `e072e58` | `ErroriDelleLetture` (DettaglioIntervento) e' il solo a registrare nell'avviso della pagina l'errore di ogni lettura senza risposta, con `useErroreNellaPagina` (ora esportato dal kit con `ErroreNellaPagina`); le tre VistaQuery delle schede passano `errorePersonalizzato` col solo testo statico. `statoDelDettaglio(letture, giaRisposte)`: scheletro di tutta la pagina alla prima apertura finche' non hanno risposto tutte le letture (`tutteRisposte`), poi solo se nessuna lettura ha dati; una lettura che riparte accanto a una coi dati (Riprova, un altro anno dopo un errore) mostra lo scheletro nella sua scheda. La scheda attiva sale in `Dettaglio` (`scheda`, `onScheda`) | `interventi/page.test.tsx`: TX-0016 in errore ("Una sezione...", prima e dopo l'apertura della scheda, un solo "Dati non caricati"); TX-0017 in errore (scheda Output); Riprova dopo il 503 di TX-0016 con la risposta trattenuta (KPI "Target di fine periodo" e scheda Verifica restano); "Mostra" 2024 dopo l'errore (scheda Verifica scelta, focus su Mostra). L1 di `statoDelDettaglio` e `tutteRisposte` |
| **A1** (assorbe V2) | `53452ca` | Contesto del PNG del dettaglio coi soli criteri di TX-0017: `useContesto(testiCriteri(soloIntervento(codice)), ultimi)` | `interventi/page.test.tsx`: su `/istituzionale/interventi/SRA01?anno=2024` il PNG della card "Output programmato e realizzato per anno (ettari)" ha "Filtri applicati: Intervento: SRA01" e nessun "Anno di riferimento" (mock di `pngDelGrafico`) |
| **A3** | `7254cc7` | `AvvisoAggiornamento` passa da `elenco-operativo/ui/comuni.tsx` al kit (`shared/ui/stati/StatiVista.tsx`, dal barrel), stesso markup e testo predefinito. Scheda Verifica: contenitore `ui-risultati` con `aria-busy` e, durante `isPlaceholderData`, "Lettura dell'anno 2024 in corso: restano i dati dell'anno precedente." (`testoAggiornamentoAnno`, lib) | `interventi/page.test.tsx` con la lettura del 2024 trattenuta (status col testo, `aria-busy="true"`, didascalia 2025; poi status vuoto e didascalia 2024); L1 del testo; L2 del kit in `tests/kit-comune-istituzionale.test.tsx` |
| **V1** | `69d0981` | `useState<Misura>` da `ReportOutput` a `OutputRegionale`, passato a `CorpoOutput` e `ReportOutput` | `output-regionale/page.test.tsx`: con "Realizzato SIGC" scelto, il chip SRA16 tolto rilegge il report e il bottone resta `aria-pressed=true` con la didascalia della misura |
| **A2** | `c1ca1d7` | `indirizzoDelDato` restituisce null se `codiceDelPercorso(r.codiceIntervento)` e' null (come `indirizzoDelLink` del finanziario). La parte facoltativa su `apri` di `useApriIntervento` non e' fatta | L1 in `tests/istituzionale-lib.test.ts` con ' ', 'SRD01' seguito da U+200B, '' e 'SRD01&tipo=PAGAMENTO': nessun link |
| **A4** | `77971af` | Solo test. Il test dei valori a zero rinominato su cio' che prova | `verifica-smp-non-sigc/page.test.tsx`: col solo `csr.tx-0056.read` solo "Apri nell'elenco", col solo `csr.tx-0059.read` solo "Apri nei pagamenti"; `interventi/page.test.tsx`: AT001 col solo `csr.tx-0016.read`, "Torna alla verifica SMP non SIGC" e nessuna lettura di TX-0017. Provati rossi con lo scambio dei rami di `usePuoAprireElenco` e il link di `SenzaDati` fisso sull'output |
| **V4** | `b68c3dd` | `vociAnteprima`: con `indicatoreOutput` null "non valorizzato (il dato non è presente nella fonte)" (`testoMotivato` con `TESTO_ASSENTE`), senza l'unita' | L1 sulla riga SRG01 della fixture, anche con un'unita' |
| **X3** | `1e0094b` | Kit: `Scaricamento.oggetto` facoltativo (nome del singolo pulsante) e `CardGrafico.oggettoDati` al posto di `oggetto` (che usava solo l'istituzionale): i file dei dati hanno il loro oggetto, il PNG resta "il grafico <titolo>". Verifica: CSV e XLSX della card "i dati della verifica SMP non SIGC" (`OGGETTO_FILE_VERIFICA`, lo stesso della tabella); dettaglio: CSV e XLSX "l'output e gli importi unitari dell'intervento SRA01" | Pagine di verifica (nomi dei tre pulsanti della card; i CSV e XLSX della tabella si cercano dentro la sua sezione, perche' hanno lo stesso nome di quelli della card) e del dettaglio; `tests/istituzionale-ui.test.tsx`; L2 del kit (CardGrafico con `oggettoDati`, PulsantiScarica con un file col suo oggetto) |
| **V3** con **H11** | `604efb8` | Fixture (`conAnno`) e mock (`rigaDellAnno`): con un anno diverso dal 2025 tutti gli otto dati dell'avviso ANNO_NON_CONSERVATO, anche avvisi attivati e chiusi e concessioni previste; un anno senza file (2023) ha indicatori e output (atteso ed erogato) NON_VALORIZZATO; un intervento senza avviso resta NON_VALORIZZATO. Righe della fixture e del mock in ordine di codice (SRA01, SRA16, SRD01). H11: il mock compone `CON_FILE` e `SENZA_FILE` (la parte facoltativa del filtro condiviso fra mock e fixture non e' fatta: nessun mock importa oggi dai moduli `testing/`) | L1 della fixture (SC-IS_SMP_ANNO 2024 e 2023, ordine) e del mock (`tests/istituzionale-api.test.tsx`); L2 nuovo di `TabellaVerifica` con righe fuori ordine (prima SRA01, `aria-sort` ascending), provato rosso con un `ordineIniziale` su un'altra colonna; indici del clic sulla barra di SRD01 da 1 a 2 |
| (pulizia) | `9fc0eaf` | Solo spaziatura: una riga vuota spuria dopo l'ultima riga sostituita in quindici file dei commit V1, A2, V4, X3 e V3 (lo script di sostituzione la aggiungeva) | nessuno |
| **H4** | `e19ac59` | `usePannelloConFocus<C extends Filtri>(criteri, applica, ricerca)` e il tipo `PannelloAperto` in `entities/filtri/ui`, dal barrel (pannello, `onApplica` col focus sull'h1 solo dallo stato vuoto con criteri nuovi, `applicaConFocus`). Il fisico (`SuperficiAmmissibili`, `ricercaDaCriteri`) e l'istituzionale (verifica e output, `ricercaDaFiltri`) lo usano al posto delle due copie | L2 dell'hook in `tests/entita-filtri-ui.test.tsx`; restano verdi i test di focus delle pagine di fisico e istituzionale |

**H4 e' committato** (`e19ac59`): verificati `npx tsc --noEmit`, `npx eslint` su `src/entities`, `src/features` e il test
toccato, e i test di fisico e istituzionale (pagine, `tests/fisico-*`, `tests/istituzionale-*`, `tests/entita-filtri-ui`).
Il working tree e' pulito.

## Effetti sul codice comune e sulle altre feature

- **Kit (`shared/ui`)**: nuovi export `ErroreNellaPagina`, `useErroreNellaPagina` (H1) e `AvvisoAggiornamento` (A3);
  `Scaricamento.oggetto` e `CardGrafico.oggettoDati` (X3). Senza `oggettoDati` i nomi dei pulsanti sono quelli di prima.
- **Elenco operativo** (A3): `AvvisoAggiornamento` importato dal kit in `ElencoPagamenti`, `interrogazione` e
  `SinotticoDomande`; stesso markup e testo; i suoi test (`interrogazione-stati`) verdi senza modifiche.
- **Fisico** (H4): `SuperficiAmmissibili` usa l'hook comune; stesso comportamento, i suoi test di focus verdi senza
  modifiche.
- **Finanziario**: nessun cambiamento in questi commit (H2, H7 lo toccheranno).
- Nessun test di finanziario, fisico ed elenco e' stato cambiato. Un giro di `src/pages/{finanziario,fisico,
  elenco-operativo}`, `tests/finanziario-*`, `tests/fisico-ui` e `tests/shared-ui-kit` dopo X3 era verde (427 test).
- Ultima suite completa: quella di partenza (63 file, 1254 test, verde). Dopo i commit sono stati lanciati solo i test
  mirati; la suite completa (due volte), `tsc` ed `eslint .` vanno rifatti alla fine del giro.

## Finding ancora da fare (ordine del judge)

1. **H5**: `useFocusSeSparisce(visibile, destinazione)` in `shared/ui/focus.ts`, usato da `AvvisoPagina` (al posto di
   `useFocusDopoAvviso`) e da `ValoriNonDisponibili`; tolta la copia da `comuni.tsx`; L2 nel kit.
2. **H6**: impaginazione comune dei due report istituzionali (`PaginaReportIstituzionale` o un widget), da
   `VerificaSmpNonSigc.tsx` e `OutputRegionale.tsx`.
3. **H7**: `testoPerimetro` in `shared/lib` (fisico e istituzionale); hook `useRigheContesto` nel kit (istituzionale,
   fisico `useContesto` di `SuperficiAmmissibili`, finanziario se la forma coincide); `ricercaDeiSoliFiltri` in
   `entities/filtri` (`app/aree.ts:58`, `lib/pagine.ts`); `anniProposti` in `shared/lib` (istituzionale e finanziario);
   L1 delle funzioni spostate.
4. **H8**: test in `tests/app-aree.test.tsx` che la route-table ha `VERIFICA_SMP_SIGC` con visibility
   `[GRANT.verificaSigc]`; togliere l'asserzione tautologica di `tests/istituzionale-lib.test.ts` (`VERIFICA_SMP_SIGC`).
5. **H10**: rinominare `CriteriVerifica` di `lib/criteri.ts` (es. `CriteriDellaVerifica`); in `ui/contratto.ts`
   `CONTRATTO_CRITERI_VERIFICA` e `CONTRATTO_CRITERI_OUTPUT`; prova: un campo rinominato fa fallire `tsc`.
6. **V7**: `await waitFor(...)` sul focus dopo Esc in `src/pages/fisico/superfici/page.test.tsx:394` (stabilizzazione:
   l'instabilita' non e' riproducibile a comando).
7. COSMETICO: **V6** (commento del test della verifica: renderlo vero con SRD04 senza spesa), **V8** (`Intervento
   ${codice} - Istituzionale` e il test del titolo), **H2** (import di `ApriNellElenco` da `entities/domanda` nei sei
   file del finanziario, via la riesportazione e il test), **H3** (via `rispostaDatoNonValido`, test con `eProblema` e
   `messaggioOltreIlLimite`). **H9** non e' nell'elenco dato dal coordinatore: e' nei finding accettati (COSMETICO,
   `ChiaveAmbito` in `src/app/aree.ts`), da confermare se farlo.
8. **X2**, solo il test: in `src/pages/istituzionale/interventi/page.test.tsx` (primo test di RF017) dopo l'apertura
   delle schede Verifica e Importi `lette.verifica` e `lette.output` restano di una sola voce. Nessuna registrazione.

Poi: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` due volte, e questo resoconto da completare.

## Appunti per la ripresa

- Il tool Edit toglie gli spazi finali di `new_string` (due import erano finiti attaccati, corretti in `1e0094b`) e
  trasforma la sequenza di escape del carattere U+200B scritta nel testo nel carattere vero, anche in questo file (corretto a mano in `c1ca1d7`): niente spazi finali nelle
  sostituzioni e sequenze `\u` scritte con python.
- Lo script di sostituzioni a blocchi in scratchpad (`rep.py`) aggiungeva un a capo dopo l'ultimo blocco: corretto, le
  righe vuote rimaste sono state tolte in `9fc0eaf`. Con Python su Windows scrivere sempre con `newline='\n'` (un file
  era passato a CRLF, sistemato prima del commit di H1).
- I nomi "Scarica i dati della verifica SMP non SIGC in CSV/XLSX" ora compaiono due volte nella pagina della verifica
  (card del grafico e tabella, come nel low-fi): nei test cercarli dentro la card o la sezione della tabella.
- Per lo step8 della sessione principale: oltre all'istituzionale sono toccati kit (`shared/ui`), `entities/filtri`, il
  fisico (H4) e l'elenco operativo (A3); H2 e H7 toccheranno anche il finanziario.
