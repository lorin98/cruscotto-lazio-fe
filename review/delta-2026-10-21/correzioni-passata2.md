# Correzioni della passata 2 (review step9 FULL sul delta FE, 22/10/2026)

Correzioni degli 8 residui accettati dal Judge della passata 2 (`judge-passata2.md`, accettati in
`../delta-2026-10-21-findings-passata2.json`: 4 MINORE, 4 COSMETICO), con le decisioni dell'utente del 22/10/2026
(V1, V5; gli altri come da fix del Judge). Base: 4b94555. Commit su `main`, uno per sottoargomento, nessun push. Lo stato
`.claude/state/*.state.json` non e' stato toccato, ne' il backend o il plugin. Nessun file dentro `wireframes/` e'
cambiato: le approvazioni dei flussi restano valide.

Parti contestate dal Judge e NON applicate: per H4 solo il commento della fixture, i costruttori dei test anteriori al
delta (`euro`, `NON_VALORIZZATO`, `nv`) restano; per V5 `wireframes/riepilogo/riepilogo.md` e `prototipo.js` non sono
toccati.

## Residui

| id | sev. | cosa | file | commit |
|---|---|---|---|---|
| V1 | MINORE | Atto di concessione in tre stati (`senzaAtto` in `formato.ts`, usata da `testoAtto`): "nessun atto" solo con `attoConcessioneDisponibile` vero; con falso l'assenza con la fonte (F1); con TX-0060 in attesa, in errore o senza il grant "non disponibile" senza nota (`descriviAssenza(undefined)`). `attoSenzaFonte` e `ATTO_FONTE_NON_ATTIVA` non piu' esportati. Scheda: la lettura di TX-0060 sta in `SchedaDomanda` accanto a TX-0058 (solo con riferimento valido e col grant) e il valore scende fino a `Sintesi`, cosi' le due letture partono insieme. Commenti di `formato.ts`, `colonne.tsx`, `voci.ts`, `ElencoDomande.tsx`, `SchedaDomanda.tsx` corretti. Decisione registrata in OP-EO-06. Test (vista procedurale e scheda): TX-0060 trattenuto, poi fonte attiva o non attiva (prima "non disponibile", il valore finale solo dopo la risposta); 500; senza il grant; nella scheda TX-0060 parte mentre TX-0058 e' trattenuto. `trattenuta()` passa in `shared/testing/msw.ts` (era copiata in due test dell'elenco) | `src/features/elenco-operativo/lib/{formato,voci}.ts`, `ui/{colonne.tsx,ElencoDomande.tsx,SchedaDomanda.tsx}`, `src/shared/testing/msw.ts`, `plan/elenco-operativo/uiplan.json`; test in `src/pages/elenco-operativo/{interrogazione-stati,interrogazione,scheda-domanda}.test.tsx`, `dettaglio-domanda/page.test.tsx`, `tests/elenco-operativo-{lib,voci}.test.ts` | 004d469 |
| V2 | MINORE | Dopo "Togli il filtro Atto di concessione" il fuoco passa alla nota "Atto di concessione non disponibile..." (ref e `tabIndex={-1}`, `useFocusDopoIlTogli`: il clic segna la rimozione, l'effect sposta il fuoco quando la concessione esce dai criteri), come la regola X-02 dei chip; asserzione su `document.activeElement` nel test della concessione arrivata dall'indirizzo | `src/features/elenco-operativo/ui/PannelloFiltriElenco.tsx`, `src/pages/elenco-operativo/interrogazione-stati.test.tsx` | 927e766 |
| V3 | MINORE | Field `filtri.attoConcessioneDisponibile` (provenance `spec`, `ValoriFiltriElenco`) nella route `/elenco-operativo/domande/:tipo/:codiceABarre`, senza toccare roles, visibility e `approval`; nota della sintesi "Fonte: TX-0058; disponibilità dell'atto di concessione: TX-0060. Valori assenti: indicato il motivo, mai zero.", con l'asserzione nel test della fonte non attiva | `plan/elenco-operativo/uiplan.json`, `src/features/elenco-operativo/ui/SchedaDomanda.tsx`, `src/pages/elenco-operativo/scheda-domanda.test.tsx` | 6f09c82 |
| H2 | MINORE | `shared/ui` esporta `InterruttoreVista({ etichetta, vista, onVista, className })`; `CardGrafico` lo usa con "Vista di <titolo>", `RiepilogoReport` con "Vista del riepilogo" e `mb-3`; `SceltaVista` tolta. I test sull'ordine dei due gruppi restano | `src/shared/ui/grafici/CardGrafico.tsx`, `src/shared/ui/index.ts`, `src/features/finanziario/ui/RiepilogoReport.tsx` | 77a2831 |
| V4 | COSMETICO | Cella dell'atto della vista procedurale in testo con `testoAtto` (come la sintesi), senza `AssenzaMotivata`; test: testo con la nota fra parentesi e nessun badge | `src/features/elenco-operativo/ui/colonne.tsx`, `src/pages/elenco-operativo/interrogazione-stati.test.tsx` | bfdda59 |
| V5 | COSMETICO | Nel README del prototipo, riga "Riepilogo" della tabella "Cosa mostra": dal 21/10/2026 la resa approvata del riepilogo e' il wireframe riapprovato (vista iniziale Grafico, interruttore Grafico \| Tabella, sottotitolo); per il riepilogo il prototipo fa fede solo per il linguaggio visivo | `prototipo/finanziario/README.md` | f91098f |
| H3 | COSMETICO | `entities/importo` esporta `testoConNota(r)`, usata da `importoConNota` e dall'atto dell'elenco (al posto di `conNota`) e da `assenzaImporto` del finanziario; il tipo `ValoreMotivato<T>` di `elenco-operativo/lib/dto.ts` diventa `DatoSenzaFonte<T>`, derivato da `DatoMotivatoLike` (stesse chiavi: i due controlli di `contratto.ts` invariati); test di `testoConNota` | `src/entities/importo/{index.ts,lib/importo.ts}`, `src/features/finanziario/lib/importi.ts`, `src/features/elenco-operativo/lib/{dto,formato}.ts`, `ui/contratto.ts`, `tests/finanziario-lib.test.ts` | 04a725a |
| H4 | COSMETICO | Commento di `testing/fixture.ts` ristretto: i costruttori li usano le fixture e i test della verifica SMP e dei casi limite della previsione; i test anteriori tengono i propri | `src/features/finanziario/testing/fixture.ts` | 25cb5e9 |

Ordine dei commit: V4 prima di V1, cosi' la cella usa gia' `testoAtto` e V1 cambia la regola in un punto solo.

Prove che i test nuovi non sono vacui (mutazioni temporanee, poi ripristinate):
- V1, stato ignoto trattato come fonte attiva (`fonteAttiva !== false` -> "nessun atto"): falliscono gli 8 test nuovi
  della vista procedurale e della scheda (trattenuto con fonte attiva e non attiva, 500, senza il grant).
- V1, TX-0060 che parte solo dopo TX-0058 (`valido && stato.isSuccess`): falliscono i 2 test della scheda con TX-0060
  trattenuto.
- V2, senza `nota.current?.focus()`: fallisce il test della concessione arrivata dall'indirizzo.

## Uiplan (V1, V3)

- `fields`: aggiunto `filtri.attoConcessioneDisponibile` per la route della scheda. `routes`, `roles`, `flows[].approval`
  invariati.
- OP-EO-06: aggiunta in coda la decisione V1 del 22/10/2026 ("nessun atto" solo con il flag vero, "non disponibile" senza
  nota finche' TX-0060 non e' letto, nella scheda TX-0060 parte con TX-0058).
- `uiplan-validate.sh plan/elenco-operativo/uiplan.json handover/slices handover/authz-catalog.json` col plugin in
  sviluppo (`marangi-lab/sian-green`, branch `feat/green-fe-ui-v2`): rc 0, pass. La copia del plugin in cache
  (`~/.claude/plugins/cache/sian-green/green-fe/1.0.0`) da' rc 3 anche sullo uiplan di prima delle correzioni (schema
  vecchio: `kind` 'interrogazione', `url_params`, `links` non ammessi): non dipende da queste modifiche.
- `check-ui-authz.sh plan/elenco-operativo/route-manifest.json plan/elenco-operativo/uiplan.json handover`: rc 0, pass.

## Esiti

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0; `npm run lint` (`--max-warnings 0`): rc 0.
- `npx vitest run`: 48 file, 1011 test verdi (erano 1004; 7 nuovi).
- `npm run test:e2e` (build di produzione, `vite preview`, Chrome): 8 test verdi in 19 s, compreso "pannello dei filtri e
  anteprima", che sceglie Tabella nel gruppo "Vista del riepilogo" (H2). Il profilo WebKit mobile non e' stato eseguito.

## Note per la sessione principale

- Il gate step8 non e' stato rieseguito (scrive lo stato): lo uiplan dell'elenco e' cambiato (field della scheda,
  OP-EO-06), quindi va rilanciato prima del push.
- `prototipo/finanziario/prototipo.js` apre ancora il riepilogo sulla tabella col sottotitolo vecchio: riallinearlo solo
  con l'ok dell'utente.
- Resta per il backend la nota dell'antagonista su D4 (`attoConcessioneDisponibile` calcolato sull'intero database).
