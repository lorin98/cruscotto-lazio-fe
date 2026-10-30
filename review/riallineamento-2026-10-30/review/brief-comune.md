# Review step9 FULL sul delta del riallineamento degli ambiti — cinque feature (30/10/2026, passata 1, budget 3)

Una sola review sul delta comune, con un verdetto PER FEATURE (come il 21/10 e il 26/10, scelta dell'utente del 19/10/2026:
review sulle modifiche invece che una review completa per feature; deviazione dichiarata dalla procedura green-fe). Ogni
finding dice a quale feature appartiene (`finanziario`, `elenco-operativo`, `fisico`, `istituzionale`, `procedurale`, oppure
`comune` se tocca `src/app`, `src/entities`, `src/shared` o i test comuni); il Judge assegna i finding comuni alle feature su
cui ricadono e scrive un file di finding per feature.

## Riferimenti
- **Repo frontend:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/progetti/arsial/arsial-cruscotto/cruscotto-lazio-fe` (main).
  - Stack: React 19, Vite, React Query, orval, MSW, vitest, kit UI v2 in `src/shared/ui`, ECharts; Feature-Sliced Design.
  - Finanziario nel layout legacy alla radice (`uiplan.json`, `route-manifest.json`, `wireframes/<flusso>/`); le altre feature
    in `plan/<feature>/` (uiplan, handover, route-manifest, dossier) con wireframe in `wireframes/<feature>/<flusso>/`.
  - Home `src/app/home.tsx`, catalogo delle aree e card `src/app/aree.ts`, menu `src/app/menu.tsx`, route
    `src/app/route-table.json` e `src/app/routes.tsx`.
- **Plugin green-fe:** `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/plugins/green-fe`. Da leggere:
  `skills/step9-review/SKILL.md` §2-§3, `_shared/references/review-checklist.md`, `antagonist-brief.md`, `judge-brief.md`,
  `references/uiplan-patterns.md`.
- **Requirements pack 1.4.0:** `../cruscotto-lazio-spec/reqpack/`. **Decisione dell'utente del 29/10/2026:**
  `../cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md` (ogni pagina nell'ambito del suo requisito).
- **Contratti:** `handover/openapi-<feature>.json`, catalogo `handover/authz-catalog.json` (rev. 4), scenari
  `handover/acceptance/<slice>-scenarios.json`. Backend gia' rivisto e chiuso: `../cruscotto-lazio-be/review/
  delta-ambiti-2026-10-29-review.md` e approvazioni `../cruscotto-lazio-be/review/approvazioni-ambiti-2026-10-29.md`.
- **Resoconti degli step3-7:** `review/riallineamento-2026-10-30/<feature>-step3-7.md` (scelte prese in autonomia e
  scostamenti dichiarati: VALUTALI).

Intensita' FULL: tutte le feature hanno authz e scoping (hide-by-role; P4 con perimetro ADA nel procedurale).

## Cosa e' cambiato
API spostate dal backend (operationId e schemi invariati): TX-0015 verifica SMP SIGC -> istituzionale
(`/api/istituzionale/verifica-smp-sigc`); TX-0017 output regionale -> fisico (`/api/fisico/output-regionale`); TX-0030 Unit
Amount -> fisico (`/api/fisico/unit-amount`, filtri dei report fisici con azione, `ultimiDatiSincronizzati`); TX-0020
determine -> procedurale (`/api/procedurale/domande/{codice}/determina`, P4 scoped, campo `perimetro`, 404 anche fuori
perimetro).

Perimetro: `git diff e0f6cb7 HEAD -- src tests wireframes uiplan.json route-manifest.json plan specs README.md`
(e0f6cb7 = handover nuovo; il codice di prima e' identico a quello di 3b98fe1, ultimo FE con step9 done su tutte le feature).
- Step1 (1501bec, 1103ca7): wireframe nuovi/cambiati e approvati dall'utente il 30/10, uiplan, dossier, refresh con carry-over.
- Step2 (0e12c3a..5baf660): spec in `specs/`, client orval rigenerato, spostamento strutturale delle quattro pagine con lo
  stesso comportamento di prima (e43aeb9 finanziario, 94e45a7 istituzionale, d7902f0 fisico, cf13a11 procedurale). Minimi
  anticipati: "Dati al" della verifica SIGC e delle Unit Amount dalle risposte di TX-0015 e TX-0030; voci dei filtri delle Unit
  Amount da TX-0060; tolto il link "Apri il dettaglio" nei drawer di output e Unit Amount (poi rimesso dal fisico verso il suo
  dettaglio); `PaginaReport` comune del fisico; `senzaLettura` e `testoDelVuoto` nell'impaginazione dei report istituzionali.
- Step3-7 per feature: fisico 8d0fa45..46c9d69 (main); procedurale 166f1ab..ced0065 e istituzionale 40b928f..fbbfe36 (fatti in
  worktree in parallelo, fusi in 4e515ff e 13a7f07); elenco-operativo a7a4c62..1ac2134 e finanziario 079237a..3ff7cc8 (main);
  a56db1b testo di OP-IS-11.

Novita' approvate nei wireframe (da verificare contro il codice):
- **Fisico:** dettaglio `/fisico/interventi/:codice` (TX-0017 + TX-0018 + TX-0030, schede indipendenti) con link dai drawer e
  pulsanti della testata; filtro per azione nelle Unit Amount; filtri conservati fra le pagine dell'area
  (`ricercaConservata`); card con testi nuovi; menu Superfici, Output regionale, Unit Amount.
- **Istituzionale:** verifica SMP SIGC nell'area; card della Home col blocco SIGC sull'ULTIMO ESERCIZIO CHIUSO (dal 16/10
  dell'anno Y e' Y, prima Y-1; domande finanziate, spesa erogata nell'esercizio = spesaErogataCampagnaPrecedente +
  spesaErogataCampagneAnteriori, domande pagate, domande ricevute; nessuna quota; stati indipendenti; solo con
  csr.tx-0015.read); dettaglio con scheda SIGC (`?esercizio`) e route visibile con csr.tx-0016.read o csr.tx-0015.read; link
  reciproci fra le due verifiche coi filtri comuni; niente piu' output regionale.
- **Procedurale:** determine `/procedurale/determine/:codice?` (ultima voce di menu) con badge del perimetro e messaggio unico
  del 404 "Domanda non trovata: nessuna domanda con il codice a barre N fra quelle che puoi consultare" (anche fuori
  perimetro, stesso testo, stato e focus); niente piu' Unit Amount; menu senza criteri dei report verso le determine; card.
- **Elenco operativo:** nella scheda Determine della domanda il link "Apri le determine della domanda nell'area Procedurale"
  solo con csr.tx-0020.read (percorso in `entities/domanda`).
- **Finanziario:** niente piu' verifica SMP (nessun alias); card 'SIGC e riserva di efficacia'.

## Punti da valutare
Sono finding solo se tradiscono un wireframe approvato, il pack, il contratto, la decisione del 29/10 o le regole del progetto.
- **Spostamenti a comportamento invariato:** le pagine spostate fanno quello che facevano prima (confronto con
  `git show 1103ca7:<path>`), salvo le novita' approvate? Nessun residuo delle vecchie route, letture, grant, mock o testi
  (es. "Verifica SMP" nel finanziario, determine nel fisico, Unit Amount nel procedurale, TX-0017 nell'istituzionale)?
- **Grant e scoping:** visibility delle route e voci di menu verbatim dal catalogo; ogni lettura parte solo col suo grant;
  link verso un'altra area nascosti senza il grant della pagina d'arrivo; il 404 delle determine non distingue "inesistente" da
  "fuori perimetro" (testo, stato, focus, tempi di risposta della UI); badge del perimetro dal campo della risposta.
- **Conti:** esercizio dell'ultimo chiuso (confine del 16/10, fuso orario, data del browser); somma della spesa SIGC; "mai una
  somma parziale" e assenze col motivo anche nel blocco SIGC; "Dati al" dalla risposta giusta in ogni pagina e scheda.
- **Codice comune toccato:** `aree.ts` (campo `senzaRicercaConservata` di `PaginaArea`, card), `menu.tsx` (`NavLink` di
  `GruppoArea`), `entities/domanda/lib/determine.ts`, `entities/filtri/lib/programma.ts`, kit dei report istituzionali,
  `PaginaReport` del fisico: regressioni sulle altre aree?
- **Scostamenti dichiarati dagli agenti** (nei resoconti), in particolare: errore 403/429/503 delle determine reso con
  l'avviso della pagina e "Riprova" invece di "Cerca un altro codice" del wireframe; scheda d'arrivo delle Unit Amount passata
  nello state della navigazione (lo uiplan non ha parametri); nomi accessibili dei KPI = etichetta visibile; vuoto del
  dettaglio istituzionale deciso solo dalla non SIGC; codice dell'indicatore solo nelle voci del dettaglio (OP-IS-12);
  `tipo: 'riserva'` rimasto a un solo valore in `SelettoreAnno`.
- **Test:** provano davvero cio' che dichiarano (letture senza grant = zero letture contate, link nascosti, 404 uguali)?

## Scelte gia' approvate (NON sono finding; segnala solo se il codice le tradisce)
- La decisione del 29/10 e i wireframe/uiplan approvati il 30/10, comprese le scelte di disegno nei dossier ("Scelte
  dell'utente (30/10/2026) e carry-over"), il rework 1 della card istituzionale (blocco SIGC) e la scelta "ultimo chiuso".
- La shell (menu) dei wireframe NON e' normativa (scelta dell'utente del 30/10): menu vecchi nei wireframe portati avanti non
  sono finding.
- Nessun alias o redirect delle vecchie route (A-4).
- Il separatore delle migliaia it-IT solo da 10.000 (`formatNumber`).
- Debiti e deviazioni gia' accettati nelle review precedenti (`review/*-review.md`, `review/delta-2026-10-21-review.md`,
  `review/card-home-2026-10-26/`): non riproporli.
- Lo step7 registrato con il self-check adattato (stripper file per file: difetto del plugin, gestito nella sessione
  principale) e il controllo cross-feature dello step5 che non scatta con output_dir "." (difetto del plugin): non sono
  finding sul codice.

## Regole
- SOLA LETTURA: non modificare file del repo e non lanciare npm, build o test.
  - Ammessi i comandi read-only (grep, git show/diff/log).
  - Sono read-only anche gli script del gate non declassabile (`check-ui-authz.sh`, `fe-project-check.sh --built --catalog`),
    con `CLAUDE_PLUGIN_ROOT` del plugin green-fe e `C:/Users/lorin/Desktop/Lorenzo/sian-ng/marangi-lab/sian-green/tools/vendor`
    in testa al PATH.
- Ogni finding va verificato sul codice (file e riga reali) e deve essere azionabile. Niente stile.
- Severita' della checklist con anti-inflation: MAGGIORE solo con un comportamento sbagliato concreto rispetto a pack,
  wireframe approvati o decisioni, un rischio reale, o un test che non prova cio' che dichiara.
- Output: array JSON in `review/riallineamento-2026-10-30/review/<file della consegna>`, con oggetti
  `{"id","feature","severity","file":"<path>:<riga>","titolo","evidenza","fix"}`. E' l'unico file che puoi scrivere. Alla
  fine rispondi con un riassunto di poche righe.
