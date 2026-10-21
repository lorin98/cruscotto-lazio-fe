# Correzioni della passata 1 (review step9 FULL sul delta FE, 21/10/2026)

Correzioni dei 16 finding accettati dal Judge della passata 1 (`judge-passata1.md`, accettati in
`../delta-2026-10-21-findings-passata1.json`: 3 MAGGIORE, 10 MINORE, 3 COSMETICO), con le decisioni dell'utente F1-F3
(`../delta-2026-10-21-review.md`). Base: 2f73d85. Commit su `main`, uno per sottoargomento, nessun push. Lo stato
`.claude/state/*.state.json` non e' stato toccato (lo gestisce la sessione principale), ne' il backend o il plugin.

Parti contestate dal Judge e NON applicate: per X3 dotazione dell'Assistenza tecnica, totali e link all'elenco restano
nella tabella (piede e celle) e non entrano nella vista Grafico; per X1 nessun cambio al perimetro di processo; X4
trattato come cosmetico.

## Finding

| id | sev. | cosa | file | commit |
|---|---|---|---|---|
| V1 | MAGGIORE | Previsione di pagamento provata coi suoi valori: righe tipizzate sul DTO (`rigaSmp`) con si', no, NON_VALORIZZATO e FONTE_NON_ATTIVA, asserite sulla cella "Si prevede di pagare nell'esercizio" (anche un top-up "no"); nei casi limite l'asserzione vacua sostituita dalle celle di SRA01 (fonte non attiva) e SRA03 (campo assente: "non disponibile"); titolo di `finanziario-ui` senza la promessa del si'/no | `src/pages/finanziario/sigc/verifica-smp/page.test.tsx`, `tests/finanziario-casi-limite.test.tsx`, `tests/finanziario-ui.test.tsx` | 082a075 |
| X1 | MAGGIORE | L'e2e della CSP sceglie Tabella nel gruppo "Vista del riepilogo" prima del clic sulla riga; `npm run test:e2e` eseguito (esito sotto) | `e2e/csp.spec.ts` | 674caae |
| X2 | MAGGIORE | F1: con `attoConcessioneDisponibile` di TX-0060 falso l'atto mancante e' l'assenza con la fonte ATTO_CONCESSIONE, mai "nessun atto". Vista procedurale: `colonneDomande` riceve il flag dalla lettura di TX-0060 dell'interrogazione e la cella rende `AssenzaMotivata` (badge "non disponibile" e "fonte atto di concessione non attiva", come gli importi assenti dei report). Scheda: la sintesi legge TX-0060 con `useValoriFiltri` (stesso wrapper e query-key del pannello, col grant) e dice "non disponibile (fonte atto di concessione non attiva)", come `importoConNota`. Con la fonte attiva, o senza la lettura di TX-0060 (nessun grant, in attesa), resta "nessun atto" | `src/features/elenco-operativo/lib/formato.ts`, `lib/voci.ts`, `ui/colonne.tsx`, `ui/ElencoDomande.tsx`, `ui/SchedaDomanda.tsx`; test in `src/pages/elenco-operativo/{interrogazione-stati,scheda-domanda}.test.tsx`, `dettaglio-domanda/page.test.tsx`, `tests/elenco-operativo-{lib,voci}.test.ts` | 09c66af |
| V2 | MINORE | Colonne si'/no (previsione, top-up incluso) di testo: opzione `numerica` in `colonna()`/`colonnaMotivata()`, i si'/no passano `TESTO`; test su th e td senza `ui-num` | `src/features/finanziario/ui/VerificaSmpReport.tsx`, `src/pages/finanziario/sigc/verifica-smp/page.test.tsx` | d319ff2 |
| V3 | MINORE | Nel ramo della nota dell'atto, con la concessione fra i criteri, pulsante "Togli il filtro Atto di concessione" (`imposta('concessione')([])`); commento corretto; test RA006 con `?concessione=true`, flag falso, pannello aperto (axe) | `src/features/elenco-operativo/ui/PannelloFiltriElenco.tsx`, `src/pages/elenco-operativo/interrogazione-stati.test.tsx` | 1827918 |
| V4 | MINORE | Mock di esempio: `/pagamenti` passa da `rifiutaConcessione`; `CONCESSIONE_NON_DISPONIBILE` con `PROBLEM_TYPES.DATO_NON_VALIDO`; test delle tre letture del mock | `src/features/elenco-operativo/api/mock/esempio.ts`, `tests/elenco-operativo-api.test.tsx` | 9b995c5 |
| V5 | MINORE | axe sulla pagina del riepilogo appena aperta (vista Grafico, grafico montato); resta quello sulla vista Tabella | `src/pages/finanziario/riepilogo/page.test.tsx` | 72e50e2 |
| V6 | MINORE | Sottotitolo: "Grafico per intervento: clic su una barra per il dettaglio; nella vista Tabella cerca, ordina, scegli le colonne e apri l'anteprima."; stesso testo nel wireframe (F2) | `src/features/finanziario/lib/report.ts`, `src/pages/finanziario/riepilogo/page.test.tsx`, `wireframes/riepilogo/riepilogo.html` | a26296d, c4498ad |
| V7 | MINORE | F3: deviazione registrata nello uiplan dell'elenco (sezione sotto) | `plan/elenco-operativo/uiplan.json` | 6328839 |
| H1 | MINORE | `entities/importo`: `DatoMotivatoLike<T>` (`ImportoLike = DatoMotivatoLike<number>`), `descriviAssenza` pura riusata da `descriviImporto`, componenti `ValoreMotivato({ dato, resa })` e `AssenzaMotivata` dal barrel; `ValoreImporto` e' il `ValoreMotivato` di un importo; in `VerificaSmpReport` una sola factory `colonnaMotivata` per avvisi, azioni, previsione e top-up | `src/entities/importo/*`, `src/features/finanziario/ui/VerificaSmpReport.tsx`, `tests/shared-ui.test.tsx`, `tests/finanziario-lib.test.ts` | 78ea08e |
| H2 | MINORE | `DatoMotivatoDi<Campo, T>` in `ui/contratto.ts`: stessi campi di `DatoMotivatoLike` e valore del tipo atteso per avvisi e azioni (number), top-up e previsione (boolean); provato a parte con un campo rinominato e un valore di altro tipo (compilazione rossa, file di prova rimosso) | `src/features/finanziario/ui/contratto.ts` | 35d5a7b |
| X3 | MINORE | F2: wireframe riepilogo aggiornato (sezione sotto), approvazione da dare | `wireframes/riepilogo/riepilogo.{html,md}` | c4498ad |
| X3-b | MINORE | Interruttore di pagina Grafico prima di Tabella, come quello di ogni card (componente `SceltaVista`); test sull'ordine dei due gruppi all'apertura; disegnato nel wireframe | `src/features/finanziario/ui/RiepilogoReport.tsx`, `src/pages/finanziario/riepilogo/page.test.tsx` | 461cb75, c4498ad |
| V8 | COSMETICO | `sigc.md`: albero dei componenti "Card spesa erogata nella campagna precedente (barre)" e link non collegati "Spesa erogata nella campagna precedente (TX-0015, ...)"; approvazione da dare | `wireframes/sigc/sigc.md` | b814e47 |
| H4 | COSMETICO | `testing/fixture.ts` esporta `dato`, `nd`, `nv` (euro ne deriva), `VERIFICA_SMP` e' `satisfies VerificaSmp` e `rigaSmp()` costruisce righe tipizzate su `VerificaSmpRiga`; i test li usano; nel mock di esempio un solo `dato<T>` con `euro`, `fna`, `nv` sopra | `src/features/finanziario/testing/fixture.ts`, `src/features/finanziario/api/mock/esempio.ts`, test della verifica SMP | 15b2edd |
| X4 | COSMETICO | Titolo e commento del test X-01 riscritti (la scelta Grafico sostituisce la Tabella salvata); in piu' lo state della history porta la vista 'grafico' dopo "Torna al riepilogo" | `src/pages/finanziario/riepilogo/page.test.tsx` | b972eac |

X3-b: restano due interruttori nella vista Grafico (di pagina e della card), ora nello stesso ordine. Quello della card e'
l'interruttore del kit verso la tabella equivalente del grafico (canale accessibile, ADR 0027); il wireframe lo dice
esplicitamente, cosi' l'utente lo valuta nella riapprovazione.

## Wireframe da riapprovare (approvazione NON registrata)

`wireframe-lint.sh` col template `wireframe-v2`: pass, rc 0 per entrambi. `wireframe.css` invariato. Gli altri flussi
(panoramica, domande, dotazione-avanzamento; domande, dettaglio-domanda e pagamenti dell'elenco) hanno ancora l'hash
approvato.

### Flusso riepilogo (finanziario), commit c4498ad

Hash: approvato `sha256:f81df70706715d6fd6de378a4b7044e09c0572c0be85e590676fa92141ca3102` (13/10), ora
`sha256:8d3e3739ae6f988cf64e6a6cd38a05299388742a85ffe1a6d8b0596d7bdfe2d1`.

`riepilogo.html`:
- sottotitolo della vista iniziale (V6), al posto di "Cerca, ordina, scegli le colonne; clic su una riga per
  l'anteprima, poi il dettaglio.";
- nota nuova: vista iniziale Grafico (richiesta del 19/10), interruttore di pagina "Vista del riepilogo" Grafico |
  Tabella nello stesso ordine di quello delle card, la scelta che resta tornando dal dettaglio o dall'elenco, e la
  differenza con l'interruttore della card (tabella equivalente del grafico);
- la card "Riepilogo per intervento" si apre sul grafico: dentro l'interruttore di pagina (Grafico premuto) e la card
  "Dotazione e pagamenti per intervento" (non piu' "(vista grafico)"), col suo interruttore Grafico | Tabella e
  Scarica, barre e fonte;
- sotto, "Vista: Tabella": la stessa card con l'interruttore su Tabella e la tabella del flusso approvato (cerca,
  colonne, esporta, totali, riga della dotazione dell'Assistenza tecnica nel piede, paginazione), invariata; la card
  del grafico in fondo alla pagina e' tolta. Drawer e stati invariati.

`riepilogo.md`:
- nota di aggiornamento del 21/10 in testa (F2, X3, X3-b, V6);
- albero dei componenti: card del riepilogo con l'interruttore di pagina, vista iniziale Grafico (card del grafico col
  suo interruttore e Scarica), vista Tabella (cerca, colonne, esporta CSV, ordinamento, totali, riga AT, paginazione);
- paragrafo nuovo sulla vista iniziale, l'interruttore di pagina, la tabella equivalente della card e dove stanno
  totali, dotazione AT e link (vista Tabella); "nella vista Tabella" davanti al drawer; drill-down "dalle celle della
  tabella (vista Tabella)".

### Flusso sigc (finanziario), commit b814e47

Hash: approvato `sha256:d2dae230d84d984f27b5e0413adfe8d08343adf1de3c12334b36759b071eb5d9` (19/10), ora
`sha256:bff0fa0c53ba29b2431992ad0b611e270261a750e6bd9f253b6b754dc1744db5`. Solo due testi di `sigc.md` (V8):
- albero dei componenti di `/finanziario/sigc/verifica-smp`: "Card previsione e spesa (barre)" diventa "Card spesa
  erogata nella campagna precedente (barre)";
- link non collegati: "Previsione di pagamento e spesa erogata (TX-0015, ...)" diventa "Spesa erogata nella campagna
  precedente (TX-0015, per intervento ed esercizio)".

## Deviazione F3 (V7)

Lo schema `uiplan.schema.json` non ha un campo per le deviazioni: ammette testo libero solo in `flows[].wcag_notes`
(note WCAG del flusso) e in `open_points[]` (`id`, `kind`, `detail`). La deviazione e' l'open point **OP-EO-06**
(`kind: "altro"`, senza `blocks`, quindi non blocca link ne' transazioni) di `plan/elenco-operativo/uiplan.json`, come
la deviazione rivista V-22 nello uiplan del finanziario. Dice:
- la nota "Atto di concessione non disponibile finche' nessuna domanda ha un atto di concessione." del pannello dei
  filtri di domande e pagamenti (con il pulsante di V3) non e' disegnata nei wireframe approvati, come la nota delle
  azioni portanti; i due flussi restano approvati senza modifiche;
- collegato a F1: la resa dell'assenza con la fonte nella vista procedurale e nella scheda, e la lettura di TX-0060
  della scheda col suo grant, senza cambiare transazioni e grant dichiarati della route.

Approvazioni dei flussi invariate. `uiplan-validate.sh plan/elenco-operativo/uiplan.json handover/slices
handover/authz-catalog.json`: rc 0, pass. `check-ui-authz.sh` dell'elenco: rc 0, pass. Nello stato (non toccato) i
gate `wireframe_domande` e `wireframe_pagamenti` hanno `deviations_reviewed: []`: se la sessione principale vuole la
deviazione anche li', va scritta con gli script del plugin.

## Esiti

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0; `npm run lint` (`--max-warnings 0`): rc 0.
- `npx vitest run`: 48 file, 1004 test verdi (erano 991), nessuna richiesta non dichiarata a MSW.
- `npm run test:e2e` (build di produzione, `vite preview`, Chrome installato): 8 test verdi in 18 s, compreso "pannello
  dei filtri e anteprima" (X1). Il profilo WebKit mobile (`E2E_WEBKIT=1`) non e' stato eseguito: WebKit non e'
  installato.
- `wireframe-lint.sh`: pass su riepilogo e sigc.

## Note per la sessione principale

- Il gate step8 (check `wireframe_approved`) resta rosso su riepilogo e sigc finche' l'utente non riapprova i due
  flussi; poi gate step8 e passata 2 della review.
- La scheda della domanda (route `/elenco-operativo/domande/:tipo/:codiceABarre`, transazioni dichiarate TX-0058) ora
  legge anche TX-0060, solo col suo grant e con la cache del pannello. Non e' dichiarato nella route dello uiplan ne' nel
  route-manifest (aggiungerlo a `roles` cambierebbe il predicato di visibilita'); e' scritto in OP-EO-06.
- Il prototipo approvato (`prototipo/finanziario/prototipo.js`) ha ancora il sottotitolo vecchio del riepilogo: non
  toccato.
