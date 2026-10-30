# Feature elenco-operativo: step3-7 di green-fe del 30/10/2026 (riallineamento degli ambiti)

Partenza: `.claude/state/green-fe-elenco-operativo.state.json` a `current_step` 3, HEAD `46c9d69` (step2 fatto per le
cinque feature; step3-7 del fisico gia' fatti). Fonti, in quest'ordine: il wireframe approvato il 30/10/2026
`wireframes/elenco-operativo/dettaglio-domanda` (scheda Determine col link verso il procedurale) e
`plan/elenco-operativo/uiplan.json` (link `determine-della-domanda`, OP-EO-07); il dossier
`plan/elenco-operativo/dossier-wireframe.md` (scelta S-3 (b) dell'utente e "Cosa dovra' cambiare allo step6"); il
resoconto dello step2. Eseguiti gli step 3-7 seguendo le skill del plugin (`step3-api` ... `step7-test`); gate e
transizioni scritti solo con `state-set.sh` e `state-transition.sh`, ogni gate nello stesso blocco bash del suo
`state-set`. La feature e' a `current_step` 8: **step8-gate e review step9 restano alla sessione principale**. Commit su
`main`, nessun push; app spenta, nessun BE o FE avviato. Lavoro in parallelo ai worktree dell'istituzionale e del
procedurale: nessun file loro toccato, nessun `git stash`.

## Step e gate

| step | gate registrati | note |
|---|---|---|
| step3-api | api_wrappers_compile, querykey_from_factory | nessun wrapper nuovo: la slice non cambia e il link passa solo dall'indirizzo (nessuna lettura di TX-0020 dalla feature; la scheda Determine resta da TX-0058). Gate registrato senza codice nuovo da generare |
| step4-lib | lib_pure_compile, lib_zero_react | `entities/domanda/lib/determine.ts` (percorso e grant condivisi), `percorsoDetermine` in `lib/collegamenti`, `puoAprireLeDetermine` in `lib/grant`; test L1 |
| step5-ui | ui_components_compile, ui_a11y_axe | hash dei tre flussi ricalcolati dal disco con `wireframe-hash.sh`: uguali agli `approved_hash` dello stato (domande `c8a11747...`, pagamenti `e9639ac8...`, dettaglio-domanda `dc32487d...`). Cross-feature verificato a parte (punto aperto 2) |
| step6-page | pages_compile, route_manifest_valid | nessuna pagina ne' voce di route-table nuova; `plan/elenco-operativo/route-manifest.json` riproiettato (3 route, pack 1.4.0) e validato con jv; `fe-project-check.sh . --feature elenco-operativo --catalog handover/authz-catalog.json` rc 0 (verdict pass). Gate registrato senza codice nuovo da generare |
| step7-test | tests_generated, msw_fail_closed | REQ-must della feature: RA002, RA003, RA004, RA005, RA006, tutti con describe taggato. Il blocco della SKILL com'e' da' `msw_setup_assente` (falso negativo del plugin, punto aperto 1): registrato col blocco adattato del fisico |

Verifica finale: `npx tsc --noEmit`, `npm run lint` e `npx eslint . --max-warnings 0` verdi; `npx vitest run` verde due volte
di seguito (78 file, 1588 test; erano 1575 dopo il fisico). Wireframe, uiplan, dossier, `handover/`, `specs/`, backend,
plugin e stati delle altre feature non toccati (`git diff 46c9d69 -- .claude/state` tocca solo l'elenco operativo).

## Commit (in ordine)

`a7a4c62` step3; `d468237` codice comune (entities/domanda); `2a9eee8` step4; `45ae3d4` step5; `fa3e88f` step6;
`3037bd7` step7; questo resoconto.

## Novita' implementate, per flusso

**dettaglio-domanda** (scelta S-3 (b) dell'utente del 30/10/2026, OP-EO-07):
- Sotto la tabella della scheda Determine (`TabellaDetermine` in `ui/TabelleScheda.tsx`) il link "Apri le determine della
  domanda nell'area Procedurale" seguito dalla frase del wireframe (": la determina corrente e quella da cui vengono stato
  area programmazione e comparto."), verso `/procedurale/determine/<codice a barre della scheda>`.
- Visibile solo con csr.tx-0020.read (`puoAprireLeDetermine`, gate di UX): P1, P2, P3 dell'area procedurale e P4 (per il P4
  la scheda e' gia' nel suo perimetro, l'arrivo non risponde 404); senza il grant (es. P5) la scheda resta com'era.
- Il link resta anche con la scheda vuota, sotto "Nessuna determina per questa domanda." (nota del wireframe: la pagina
  del procedurale dice il motivo).
- Percorso condiviso in `entities/domanda` (`percorsoDetermineDellaDomanda`, `PERCORSO_DETERMINE_DELLA_DOMANDA`,
  `GRANT_DETERMINE_DELLA_DOMANDA`), come `percorsoSchedaDomanda` per il passaggio inverso: nessun import dalla feature
  procedurale (uiplan-patterns 7). Il codice a barre entra nell'indirizzo solo se e' di sole cifre (al piu' 30).
- Test: L1 (percorso, codici non validi, predicato con e senza grant, target uguale allo uiplan, route del procedurale nel
  suo uiplan e nella route-table col grant di TX-0020), L2 e axe del componente (`tests/elenco-operativo-ui.test.tsx`),
  test della pagina taggati RA004 (visibile col grant, nascosto senza, scheda vuota, tastiera, axe).

**domande, pagamenti**: invariati (carry-over).

**Menu e Home**: invariati, come dice il dossier (sezione Strumenti, OP-EO-04).

## Scelte prese in autonomia

1. **Dove sta il percorso condiviso**: un file nuovo `entities/domanda/lib/determine.ts` (e una riga nel barrel), non dentro
   `lib/elenco.ts`, che e' il contratto dell'indirizzo dell'elenco operativo; cosi' anche la parte comune toccata resta
   minima mentre gli altri worktree lavorano. Il grant di TX-0020 sta li' accanto al percorso, come `GRANT_ELENCO`.
2. **Codice a barre del link**: quello della domanda della risposta di TX-0058 (`domanda.codiceABarre`), lo stesso del
   percorso gia' convalidato; senza un codice valido nessun link.
3. **Forma del link**: un link di testo in un paragrafo sotto la tabella, come nel wireframe (non un pulsante), col testo
   che dice l'area d'arrivo (WCAG 2.4.4).
4. **Grant nella scheda**: passato da `SchedaDomanda` fra le parti che non vengono da TX-0058 (`DaFuori`), come la
   ricerca di partenza e l'atto di concessione; la sintesi non lo riceve.
5. **Route-table e manifest**: il link non e' un'azione della route (TX-0020 non e' fra le transazioni della scheda nello
   uiplan), quindi la voce della scheda resta con visibility e azioni di prima; il manifest cambia solo nel pack_hash.
6. **Test**: i test L1 della parte comune stanno in `tests/elenco-operativo-lib.test.ts` e non nel test comune delle entity,
   per non toccare file condivisi; il test da tastiera conta largo i Tab perche' jsdom lascia nel giro le caselle del
   `details` chiuso "Colonne" (il browser no).

## Contraddizioni fra le fonti

Nessuna di contenuto fra wireframe approvato, uiplan e dossier. Il corpo del dossier e' rimasto quello di prima della
scelta: la tabella dei flussi da' dettaglio-domanda "INVARIATO" con l'hash `563cfad1...` e parla di una variante "pronta ma
non applicata", mentre la testata del dossier, lo uiplan e lo stato dicono S-3 (b) applicata e approvata
(`dc32487d...`, uguale all'hash ricalcolato dal disco). Vale il wireframe approvato. OP-EO-07 nello uiplan e' chiuso
(nessun `blocks`): il link si rende.

## Punti aperti

1. **Difetto del plugin nel self-check di step7** (lo stesso del fisico, plugin non toccato): `msw_setup_assente` e' un
   falso negativo perche' lo stripper `_sc`/`_scstr` gira sul flusso concatenato di tutti i file di `src/` e lo stato
   "dentro una stringa" passa da un file all'altro. Registrato con
   `ambiente-prova/strumenti-sessione-317ae849/gate-fe-step5-7/gate-step7-perfile.sh` (rispetto a `gate-step7.sh` cambiano
   solo le righe MSWSTRIP/MSWHARD, stripper file per file; stessi corpora e regex; pipefail non attivo), con argomento
   `elenco-operativo`, senza altre modifiche.
2. **Controllo cross-feature di step5 con `output_dir` = "."**: non scatta (difetto del plugin, gia' visto col fisico).
   Verificato a parte: gli import della feature vanno solo a `shared/`, `entities/` e ai suoi file.
3. **Step8 e step9** dell'elenco operativo alla sessione principale. File condivisi toccati: `src/entities/domanda/index.ts`
   (una riga di export con un commento, dopo gli export di `lib/elenco`) e il nuovo `src/entities/domanda/lib/determine.ts`.
   Non toccati `src/app/aree.ts`, `src/app/route-table.json`, `src/app/routes.tsx` ne' test comuni.
4. **Procedurale** (non toccato): la sua `lib/pagine.ts` ha la propria costante `/procedurale/determine`; potrebbe usare
   quella di `entities/domanda`. Un cambio della sua route lo segnala il test L1 di questa feature (target dello uiplan,
   uiplan del procedurale e route-table col grant di TX-0020).
5. Il link non e' stato provato nel browser (app spenta).
