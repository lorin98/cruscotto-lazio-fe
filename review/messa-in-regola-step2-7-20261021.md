# Messa in regola step2-7 del 21/10/2026 (finanziario ed elenco operativo)

Il refresh dell'8c50643 ha riaperto da step2 le due feature per l'handover del backend in regola (f2cfa7d del backend:
spec sigillate `sha256:e65fc85f...` per finanziario e `sha256:7532fe3b...` per l'elenco operativo). Qui si ripercorrono
gli step 2-7 di green-fe seguendo le skill del plugin; i gate e le transizioni sono scritti solo con `state-set.sh` e
`state-transition.sh`. Le due feature sono a `current_step` 8: **step8-gate e review step9 restano da fare**.

## Cosa e' cambiato nei contratti (per il frontend)

Letti `git -C ../cruscotto-lazio-be log 8348648..f2cfa7d` e `git diff 370536d -- handover/`.

- finanziario, TX-0015 (`VerificaSmpRiga`): `avvisiAttivati` e `azioniAttivate` da numero a `ConteggioFinanziario`
  {valore, motivo, fonte}; `includeTopUp` da booleano a `SiNoFinanziario` (D3, D15 del backend). Nessun campo
  obbligatorio nuovo.
- finanziario, TX-0012 (`DomandeSigc.pagate`): pagata = ammesso e pagato valorizzati e pagato maggiore di zero (D-09
  Rev. 2); solo descrizione.
- elenco operativo, TX-0060 (`ValoriFiltriElenco`): nuovo `attoConcessioneDisponibile` (booleano, facoltativo come
  `legameAzioniDisponibile`); il parametro `concessione` risponde 400 DATO_NON_VALIDO se nessuna domanda ha l'atto
  (D-02 Rev. 5-6). Descrizioni di `statoSostegno`/`statoPagamento`: l'elenco ha le sole domande rilasciate (D-02 Rev. 4).
- Scenari di accettazione dell'elenco: solo testi (atto di concessione, recuperato, determine, non rilasciate).

## Finanziario (layout root)

| step | gate registrati |
|---|---|
| step2-codegen | codegen_compiles, orval_types, csrf_static (orval deterministico: due run, stesso hash) |
| step3-api | api_wrappers_compile, querykey_from_factory (15 operazioni dello uiplan tutte nella spec, wrapper invariati) |
| step4-lib | lib_pure_compile, lib_zero_react |
| step5-ui | ui_components_compile, ui_a11y_axe (hash dei 5 wireframe approvati riverificati dal disco: tutti uguali) |
| step6-page | pages_compile, route_manifest_valid (route-table invariata, manifest riproiettato: cambia solo il pin) |
| step7-test | tests_generated, msw_fail_closed (describe dei REQ must RF001-RF015 presenti) |

Cambiamenti:
- `specs/` con le spec dell'handover; `spec_pins` di `uiplan.json` copiati da `handover.json` (col pin vecchio
  `uiplan-validate.sh` dava rc 6, e il pin sarebbe finito nel route-manifest letto dal check authz di step8).
- TX-0015, `VerificaSmpReport`: avvisi e azioni attivate mostrano il conteggio oppure l'assenza col motivo e la fonte
  attesa ("non valorizzato", "non disponibile - fonte ... non attiva"), il top-up incluso il si'/no oppure l'assenza:
  la resa degli importi assenti, mai uno 0 o un "no" inventati. Mock di sviluppo e fixture nella forma nuova.
- TX-0012: l'etichetta delle pagate SIGC (tabella e grafico) diventa "Pagate (ammesso e pagato valorizzati, pagato
  maggiore di zero)".

Test: nuovo test RF015 sulle tre colonne (NON_VALORIZZATO, FONTE_NON_ATTIVA, valori compreso lo 0); aggiornati i test
che citano l'etichetta delle pagate e il caso limite della verifica SMP. `npx tsc --noEmit`, `npx eslint .`,
`npx vitest run` verdi: 986 test.

## Elenco operativo (layout plan)

| step | gate registrati |
|---|---|
| step2-codegen | codegen_compiles, orval_types, csrf_static |
| step3-api | api_wrappers_compile, querykey_from_factory (TX-0056..TX-0060 nella spec, wrapper invariati) |
| step4-lib | lib_pure_compile, lib_zero_react (nessuna funzione nuova: il flag si consuma com'e') |
| step5-ui | ui_components_compile, ui_a11y_axe (hash dei 3 wireframe approvati riverificati dal disco: tutti uguali) |
| step6-page | pages_compile, route_manifest_valid (manifest riproiettato: cambia solo il pin) |
| step7-test | tests_generated, msw_fail_closed (describe dei REQ must RA002-RA006 presenti) |

Cambiamenti:
- `plan/elenco-operativo/uiplan.json`: `spec_pins` copiati da `plan/elenco-operativo/handover.json` e campo
  `filtri.attoConcessioneDisponibile` (provenance spec) dichiarato per domande e pagamenti; `uiplan-validate`: pass.
- TX-0060, pannello dei filtri: con `attoConcessioneDisponibile` falso il controllo "Atto di concessione" non c'e' e una
  nota dice "Atto di concessione non disponibile finché nessuna domanda ha un atto di concessione." (stesso trattamento
  delle azioni portanti senza legame): il pannello non manda mai `concessione`. Un indirizzo che la porta comunque
  riceve il 400 DATO_NON_VALIDO sul campo, reso come gli altri 400 dei filtri: un solo avviso col messaggio del backend,
  il chip resta e si toglie. Flag assente: il controllo resta (come per le azioni portanti; decide il backend).
- Mock di sviluppo: le domande di esempio non hanno atti, quindi flag falso e 400 sul filtro come il backend; fixture
  dei test col flag vero (la domanda di sostegno ha l'atto AC-1).
- "Le stesse domande del report": nessun testo del frontend lo promette per `statoSostegno`/`statoPagamento` (i chip
  dicono "Stato della domanda di sostegno (report procedurale)"): nulla da adeguare.

Test: cinque test RA006 nuovi (filtro offerto e mandato col flag vero; con il flag falso, su domande e pagamenti,
controllo assente, nota, axe del pannello e nessuna richiesta con `concessione`; 400 sul campo da indirizzo, su domande
e pagamenti). `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` verdi: 991 test.

## Wireframe

Nessun wireframe modificato, nessuna approvazione registrata o revocata: gli 8 flussi restano approvati e i loro hash
combaciano col disco.

Da valutare con l'utente (non sono cambi di cio' che i wireframe mostrano, ma stati che non rappresentano):
- elenco operativo, flussi `domande` e `pagamenti`: lo stato "atto di concessione non disponibile" (nota al posto del
  controllo) non e' disegnato, come gia' non lo e' quello analogo delle azioni portanti. Se lo si vuole nel wireframe,
  va aggiunto a `domande.md`/`pagamenti.md` (o all'HTML) e i due flussi vanno riapprovati.
- finanziario, flusso `sigc` (verifica SMP): la tabella del wireframe mostra quattro colonne d'esempio e la didascalia
  "i dati mancanti sono 'non disponibile'"; la resa col motivo di avvisi, azioni e top-up e' la stessa degli importi
  assenti gia' costruita. Nessuna modifica necessaria.

## Commit (su main, non pushati)

- 5cb6380 Codegen sul contratto del 21/10: spec dell'handover in specs/ e spec_pins dello uiplan di finanziario
- df5a569 TX-0015: avvisi e azioni attivate col motivo, top-up incluso si'/no motivato (D3, D15 del backend)
- 521c025 TX-0012: pagate con ammesso e pagato valorizzati e pagato maggiore di zero (D-09 Rev. 2 del backend)
- 9ca4a51 Finanziario: step2-7 di green-fe sul contratto del 21/10, gate registrati e route-manifest riproiettato
- c8e3791 Uiplan dell'elenco operativo sul contratto del 21/10: spec_pins e attoConcessioneDisponibile dei filtri
- a9f127d TX-0060: filtro dell'atto di concessione solo con attoConcessioneDisponibile (D11 del backend)
- aee92a0 Elenco operativo: step2-7 di green-fe sul contratto del 21/10, gate registrati e route-manifest riproiettato

## Punti aperti

- step8-gate (11/11) e review step9 per entrambe le feature (sessione principale).
- `refresh-fe-state.sh` riapre da step2 ma non riallinea gli `spec_pins` dello uiplan alla spec nuova: qui copiati a mano
  da `handover.json` (come in e754863). Dopo la copia `refresh-fe-detect.sh` da' "allineata" (rc 10) per entrambe.
  Da segnalare al plugin (non toccato).
- `npm ci` (npm 11) avvisa che gli script d'installazione non approvati non girano (postinstall di msw): nessun effetto
  sui gate, il worker di sviluppo e' gia' nel repo.
