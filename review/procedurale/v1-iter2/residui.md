# Residui della review step9 FULL del procedurale, v1 iterazione 2 (23/10/2026)

Correzione degli otto residui "dopo il verdetto" del Judge (`judge.md`, PASS con score 84; finding in
`../../procedurale-findings-iter2.json`), come per fisico e istituzionale, nell'ordine X1, V1, A2, A3, H1, H2, H3, H4.
Base: `a4bddd9`. Un commit su `main` per residuo, **non pushati**. Nessuna modifica a wireframe, uiplan, dossier,
route-table, route-manifest, `.claude/state/`, backend o plugin. Lo step8 non e' stato lanciato.

Ogni test nuovo o cambiato e' stato provato rosso:
- rimettendo la versione di HEAD dei soli file sorgente (`git show HEAD:<file>`), con la copia corretta salvata in
  scratchpad e poi rimessa;
- per V1 anche con una mutazione (la regione che non si svuota col chip tolto);
- per A3 separatamente con la sola UI e con la sola lib di prima;
- per A2 col tema di HEAD.

Poi ogni test e' stato provato verde con la correzione.

## Residui fatti

| residuo | commit | cosa e' cambiato | test che lo prova | effetti sulle altre feature |
|---|---|---|---|---|
| **X1** (MINORE) | `80b7c3b` | `NessunaDomanda` del dettaglio tace se una delle letture fatte (TX-0026..TX-0028 col grant) non ha dati: `fatte.some((l) => l.data === undefined)`, al posto di `some(senzaRisposta)`. Copre la lettura in errore e quella in corso senza dati (Riprova, o un altro stato dopo l'errore: status pending, error null, nessun segnaposto). Il segnaposto di `keepPreviousData` conta come dato, come prima. Commento corretto, via l'import di `senzaRisposta` | `interventi/page.test.tsx`, due test nuovi con `?stato=DECADENZA_TOTALE`. (1) TX-0027 a 503, Riprova con la risposta trattenuta (`trattenuta()`): niente avviso e niente "Nessuna domanda di SRD01"; liberata a 503, di nuovo un solo avviso. (2) TX-0027 a 503, poi Revocata dal pannello con le tre letture trattenute: TX-0026 e TX-0028 tengono lo zero dello stato di prima, TX-0027 non ha dati, e il vuoto non si dice. Rossi tutti e due con la guardia di prima, proprio sull'assenza del vuoto | nessuno: solo il dettaglio del procedurale |
| **V1** (MINORE, assorbe A1) | `f7f06e7` | `useVoceDellaTabella` in `PaginaStati`: la voce scelta e una regione `role=status` `visually-hidden`, sempre montata fuori da `VistaQuery`, come `useFiltroDalGrafico` dell'elenco. Clic sulla barra e "Filtra la tabella" chiamano `scegli(chiave)`: la regione dice `testoFiltroDellaVoce(etichetta, n)` ("Tabella per intervento filtrata sulla voce ...: 1 intervento."), con `n` le righe che restano, e si rimonta a ogni scelta. Col chip tolto (`scegli(null)`, focus sull'h1) si svuota. Il reset della voce che non e' piu' nella risposta (X2 dell'iterazione 1) dice `VOCE_TOLTA`. I testi stanno in `lib/stati`. Nessun `aria-pressed`, come dice il Judge | L1 in `tests/procedurale-lib.test.ts` (singolare, plurale, `VOCE_TOLTA`). In `stati-sostegno/page.test.tsx`: il clic sulla barra dice la voce e si svuota col chip tolto; Invio su "Filtra la tabella su Altro stato: SOSPESA ..." dice "... : 1 intervento." col focus fermo sul pulsante; con `?intervento=SRD01` la regione dice `VOCE_TOLTA`. Rossi con la UI di prima (tre test) e con la mutazione che non svuota la regione. Verdi anche i test di `stati-pagamento` e axe | nessuno: solo le pagine degli stati del procedurale |
| **A2** (MINORE) | `0169d1c` | Tecnica C43 nel tema: `.ui-tabella-contenitore { ... scroll-padding-top: 3rem }` e `.ui-tabella-contenitore:has(th[scope='colgroup']) { scroll-padding-top: 5.5rem }`. I valori sono piu' alti di quelli del fix (2.5rem e 5rem). La misura con bootstrap-italia da' 41px per riga d'intestazione, non 37: con 2,5 e 5rem 1px dell'elemento e tutto l'anello del focus (3px piu' 2 di distanza) resterebbero sotto. Il ripiego su `scroll-margin-top` non serve: Chromium applica lo `scroll-padding` allo scorrimento del focus | Misura in Chromium headless prima e dopo (sotto). Test di regressione sulla regola del tema in `tests/kit-comune-procedurale.test.tsx`, accanto a quello di H5, che ora usa lo stesso helper `regolaDelTema`. Rosso col tema di HEAD | kit: tutte le tabelle `.ui-tabella-contenitore`, comprese le tabelle equivalenti delle card. Cambia solo dove si ferma lo scorrimento del focus. A vista restano uguali: stesse immagini col tema di prima e con quello corretto, per le tabelle di finanziario, fisico, istituzionale, elenco e procedurale (sotto). Suite verde senza modifiche ai test delle altre feature |
| **A3** (MINORE) | `41b4f92` | `vociDelloStatoNelPannello(valori)` in `lib/criteri`: le sole voci di TX-0025 con `chiaveStatoValida`, e quante sono escluse. `VociDelloStato` fa le caselle con quelle voci e, con escluse > 0, aggiunge la nota `notaStatiEsclusi(n)`: "Stati osservati con un codice che l'indirizzo non esprime, non selezionabili come filtro: n.". Vale per il pannello dei report e per quello del dettaglio (stesso `GruppoStato`). Commento di `CHIAVE_STATO` col pannello e testata del pannello. Non fatta l'alternativa facoltativa (`CHIAVE_STATO` col dominio del backend): cambierebbe la validazione dell'indirizzo | L1 in `tests/procedurale-lib.test.ts` con `REVOCATÀ` e `SOSPESA: A&B` (escluse 2, le voci della fixture tutte presenti) e la nota. L2 in `tests/procedurale-ui.test.tsx` con TX-0025 che porta `REVOCATÀ`: nella panoramica e nel dettaglio il pannello non la propone e dice la nota, mentre Revocata, la voce senza stato e le voci di catalogo restano. Rossi con la sola UI di prima e con la sola lib di prima | nessuno: solo il pannello del procedurale |
| **H1** (COSMETICO) | `67e4391` | `SottofasiDellIntervento` legge TX-0031 e TX-0032 con `puo` e `conGrant` di `useLettureColGrant` e mostra una card solo per la lettura col grant, come la pagina Sottofasi. `SchedeIntervento` sceglie le schede con `schedeVisibili(useLettureColGrant().puo)`. Via `useAuthStatus`, `puoLeggere` e `Lettura` dal file | Test della forma unica in `tests/procedurale-ui.test.tsx`, nel describe di `useLettureColGrant`: il file usa `useLettureColGrant()` e non legge i grant a mano. Rosso con la versione di prima. Verdi senza modifiche i test delle schede e quello delle 30 righe di `tests/eslint-regole.test.ts` | nessuno |
| **H2** (COSMETICO) | `460302e` | `IntestazioneNonValida` lascia il kit. Diventa `InterventoNonValido` in `entities/filtri/ui/InterventoNonValido.tsx`, accanto a `codiceDelPercorso`, con le stesse props e `ID_TITOLO_INTERVENTO = 't-intervento'`, entrambi dal barrel. I due `DettaglioIntervento` usano quel componente e quella costante al posto delle loro `ID_TITOLO`. Il loro wrapper locale si chiama `CodiceNonValido`, perche' `InterventoNonValido` e' ora il nome dell'entity. Nel kit `pagina/Dettaglio.tsx` tiene `ErroriDelleLetture` e `CorpoDelDettaglio`; `shared/ui/index.ts` non esporta piu' `IntestazioneNonValida` | Il test L2 passa da `tests/kit-comune-procedurale.test.tsx` a `tests/entita-filtri-ui.test.tsx`, con in piu' l'id dell'h1 uguale a `ID_TITOLO_INTERVENTO`. Test nuovo: il kit non esporta piu' `IntestazioneNonValida`. Rossi tutti e due col codice di prima. I test dei due dettagli sono verdi senza modifiche: stesso DOM e stesso id del titolo | istituzionale: `DettaglioIntervento` usa l'entity, con lo stesso DOM; i suoi test sono verdi senza modifiche. Kit: un export in meno, senza altri consumatori |
| **H3** (COSMETICO) | `d17244f` | `legameIgnoto(profiloIgnoto, p: ConAzione)` senza il ramo `if (p.senzaAzione)`, che non girava mai: l'unica chiamata, in `inAttesa`, esclude gia' `senzaAzione`. Doc corretto | Test della forma del sorgente in `tests/entita-filtri-ui.test.tsx`: firma con `ConAzione`, nessun ramo `senzaAzione`. Rosso con la versione di prima. Verdi il test L2 di H3 dell'iterazione 1 e i test X-03 del finanziario | entities/filtri: il hook comune ha lo stesso comportamento. Finanziario, fisico e istituzionale non cambiano: i loro test di pagina sono verdi senza modifiche |
| **H4** (COSMETICO) | `7dc615f` | `PropsCardDistribuzione.link?: LinkDellaVoce` (import type da `./comuni`), via gli import di `TestiLink` e `VoceDistribuzione`. Il doc della prop dice che senza link manca la colonna Elenco operativo, e che la tabella equivalente generata c'e' solo senza link ne' `onFiltra`. La testata del file dice che "Filtra la tabella" delle pagine degli stati c'e' anche senza il grant dell'elenco | Test della forma del sorgente in `tests/procedurale-ui.test.tsx`: tipo e doc, con i commenti ridotti a una riga, quindi indipendente dagli a capo. Rosso con la versione di prima | nessuno |

## A2: la misura in Chromium headless

- **Strumento.** Playwright 1.56.0 del repo con `executablePath` di `chromium_headless_shell-1208`, `reducedMotion: 'reduce'`,
  viewport 1280x900. Come in `main.tsx`, `bootstrap-italia.min.css` e poi il tema, iniettati con `addStyleTag`.
  - L'HTML e' quello reale delle tabelle: un test vitest temporaneo, non committato e poi cancellato, ha reso le pagine
    con le fixture MSW e salvato l'`outerHTML` del `.ui-tabella-contenitore`.
  - Le righe del corpo sono clonate nel browser fino a 10 (riepilogo, col piede) e a 30 (tabella equivalente degli stati,
    per avere scorrimento).
  - Script e risultati in scratchpad (`misura.mjs`, `head.json`, `fix.json`).
- **Scenari.**
  - (1) Una riga con la cima a 20px dal bordo, sotto l'intestazione, e il focus con Maiusc+Tab dal focusabile che la segue.
    Quel focusabile ha gia' il focus, senza scorrimento.
  - (2) Lo stesso per un link o un pulsante di una cella, con la cima a 10px.
  - (3) In fondo al contenitore, Maiusc+Tab risalendo dall'ultimo focusabile del corpo fino all'intestazione.
  - "Coperto per intero" vuol dire che il rettangolo dell'elemento col focus sta tutto dentro quello del `thead`.
- **Col tema di HEAD il finding e' confermato.**
  - Riepilogo: intestazione su due righe da 41px (banda di 81px), righe del corpo da 44 e 71px, link da 24px.
    - Scenario 1: la riga di SRD02 (44px) col focus sta a 20-64px. E' coperta per intero e il contenitore non scorre
      (`scrollTop` 227 prima e dopo).
    - Scenario 2: il link "Apri nell'elenco" sta a 10-34px, coperto, in 2 prove su 4. Nelle altre due il contenitore non
      scorre abbastanza da portarlo sotto l'intestazione.
    - Scenario 3: 1 elemento coperto su 16 passi (la riga di SRD02 a 0-44px).
  - Tabella equivalente degli stati (una riga d'intestazione da 41px): "Filtra la tabella" e "Apri nell'elenco" (24px) a
    10-34px, coperti in 3 prove su 4; nella quarta il contenitore non scorre abbastanza. Risalendo, 2 coperti su 13 passi
    (a 13-37 e 11-35px). E' il caso a una riga che il Judge indicava come gia' presente prima.
  - Elenco (righe da 65px), istituzionale (43 e 87px) e tabella per intervento degli stati (87px e oltre): le righe sono
    piu' alte della banda. Restano coperte in parte, mai per intero.
  - Finanziario (dotazione, 10 righe) e fisico (determine, nessun focusabile nel corpo): il contenitore non scorre.
- **Col tema corretto non resta nessun elemento coperto.**
  - `scroll-padding-top` calcolato: 48px, e 88px per il riepilogo.
  - Riepilogo: risalendo, la cima piu' alta e' a 88px, sotto la banda di 81. Nello scenario 1 la riga va a 247-291px:
    Chromium centra l'elemento che e' tutto fuori dalla regione ridotta. I link vanno a 88-112, 140-164 e 211-235px.
  - Tabella equivalente degli stati: nessun elemento coperto, la cima piu' alta a 48px.
  - Elenco, istituzionale e tabella per intervento degli stati: le righe si fermano con la cima a 48px.
- **A vista restano uguali.** L'immagine del contenitore (sha256), ferma e scorsa di 120px con `scrollTop`, e' la stessa coi
  due temi per tutte e sette le tabelle:
  - finanziario: dotazione;
  - fisico: determine;
  - istituzionale: output regionale;
  - elenco: domande;
  - procedurale: riepilogo, tabella equivalente degli stati e tabella per intervento degli stati.

## Cambiamenti visibili del procedurale

Sono quelli dichiarati dai fix accettati:
- **X1:** durante Riprova, o col cambio di stato dopo un errore, il dettaglio non dice piu' "Nessuna domanda ...". Lo dice
  quando le letture hanno risposto coi dati.
- **V1:** una regione di stato per i lettori di schermo nelle pagine degli stati. Non si vede, e' `visually-hidden`.
- **A3:** nel pannello dello stato, un codice osservato non esprimibile nell'indirizzo non e' una casella e la nota dice
  quanti sono. La nota c'e' solo se esistono codici cosi'.
- **A2:** in tutte le tabelle lo scorrimento del focus si ferma sotto l'intestazione.

## Verifica finale (23/10/2026)

Dopo gli otto commit, sul working tree pulito:

- `npx tsc --noEmit`: rc 0.
- `npx eslint .`: rc 0.
- `npx vitest run`, due volte di seguito: verde entrambe le volte, **75 file e 1502 test** (24 s circa ciascuna). Alla
  partenza erano 75 file e 1492 test.
- I test nuovi sono dieci: X1 2, V1 1, A2 1, A3 2, H1 1, H2 1, H3 1 e H4 1. Il test L2 di H2 e' spostato, non nuovo; V1
  estende anche tre test di pagina esistenti.
- Nessun test di pagina di finanziario, fisico, istituzionale ed elenco operativo e' stato cambiato.

## Feature e strati toccati (per lo step8)

Le approvazioni sha256 del gate sono invalidate. Come dice il Judge, lo step8 (11/11) va rifatto per **tutte e cinque le
feature**: A2 tocca il tema del kit, H2 il dettaglio dell'istituzionale, H3 il hook comune dei filtri.

- **Procedurale** (X1, V1, A3, H1, H2, H4):
  - `lib/criteri.ts` (A3), `lib/stati.ts` (V1);
  - `ui/CardDistribuzioni.tsx` (H4), `ui/DettaglioIntervento.tsx` (X1, H2), `ui/PannelloFiltriProcedurale.tsx` (A3),
    `ui/SchedeIntervento.tsx` (H1), `ui/StatiDomande.tsx` (V1);
  - test `src/pages/procedurale/interventi/page.test.tsx`, `src/pages/procedurale/stati-sostegno/page.test.tsx`,
    `tests/procedurale-lib.test.ts`, `tests/procedurale-ui.test.tsx`.
- **Kit (`shared/ui`)** (A2, H2):
  - `tema.css` (A2);
  - `pagina/Dettaglio.tsx` e `index.ts` (H2);
  - test `tests/kit-comune-procedurale.test.tsx`.
- **Entities** (H2, H3):
  - `entities/filtri/index.ts`, `ui/InterventoNonValido.tsx` (nuovo), `ui/useFiltriProgrammaNellIndirizzo.ts`;
  - test `tests/entita-filtri-ui.test.tsx`.
- **Istituzionale** (H2): `ui/DettaglioIntervento.tsx`.
- **Finanziario, fisico, elenco operativo**: nessun file. Sono consumatori del tema (A2); finanziario, fisico e
  istituzionale anche del hook dei filtri (H3).
- Non toccati: wireframe, uiplan, dossier, route-table, route-manifest, grant, `.claude/state/`, backend e plugin. Nessun
  push.
