# cruscotto-lazio-fe

Frontend del Cruscotto di monitoraggio CSR 2023-2027 (ARSIAL / Regione Lazio), generato con il plugin
**green-fe** a partire da:

- il requirements-pack sigillato di `../cruscotto-lazio-spec/reqpack`;
- l'handover del backend di `../cruscotto-lazio-be` (OpenAPI per slice e `authz-catalog.json` sigillati
  nel manifest a `step10-gate`), raccolto in `handover/` e verificato in `handover.json`.

Stato della generazione: `.claude/state/green-fe-<feature>.state.json` (si legge con gli script del plugin);
per proseguire `/green-fe:build finanziario`. Piano UI in `uiplan.json`, wireframe approvati in `wireframes/`,
decisione sul tema in `docs/decisioni/style-guide.md`. Il linguaggio visivo e' la UI v2 (ADR 0027 del plugin
green-fe), dal prototipo approvato in `prototipo/finanziario/`.

## Sviluppo

Node `^24.15.0` (`.nvmrc`), poi `npm ci`.

| Comando | Cosa |
|---|---|
| `npm run dev` | dev server con i mock MSW (nessun backend): il finanziario usa i dati d'esempio inventati di `src/features/finanziario/api/mock/esempio.ts` (il worker raccoglie gli `esempio.ts` delle feature) (coerenti fra le pagine, rispettano i filtri, fonti non attive come nei dati reali); il resto gli handler generati |
| `npm run dev:be` | dev server collegato al **backend vero** (BFF, Keycloak, PostgreSQL): niente MSW |
| `npm run api:generate` | rigenera il client orval da `specs/openapi-*.json` |
| `npm run typecheck`, `build`, `test`, `lint` | i controlli del gate di green-fe |
| `npm run test:e2e` | test e2e con Playwright sulla build di produzione (`e2e/`): CSP del contenitore, grafici e tooltip, dialoghi, anteprima e dettaglio dell'intervento; `E2E_WEBKIT=1` aggiunge il profilo WebKit mobile (serve `npx playwright install webkit`) |

### Con il backend vero (`npm run dev:be`)

Il dev server (http://localhost:5173) inoltra `/api` e `/auth` al backend (`CSR_BE_URL`, default
`http://localhost:18080`; per cambiarlo `.env.local`, vedi `.env.example`). Il proxy lascia l'header Host del dev
server, quindi per il backend la SPA e' sulla stessa origine:

- **Sessione.** Il cookie di sessione BFF e il redirect OIDC tornano su http://localhost:5173 (redirect URI
  `http://localhost:5173/*` nel realm Keycloak di prova).
- **Scritture ed esportazioni.** La RegolaOrigine del backend le ammette: Origin = il servizio stesso, e il mutator
  manda `X-Requested-With`.

Prerequisiti, dall'ambiente di prova (`../../ambiente-prova`, vedi `MANUALE-PG-LOCALE.md`):

```bash
script/pg-locale.sh avvia                                          # PostgreSQL locale con i dati reali
keycloak/avvia-keycloak.sh > .cruscotto-csr/keycloak.log 2>&1 &    # Keycloak 15 su 8180
CSR_DB_ENV=locale script/avvia-be.sh > log/be-locale.log 2>&1 &    # backend su 18080
```

Poi `npm run dev:be` e http://localhost:5173/auth/login: il login di Keycloak riporta alla SPA con la sessione
aperta.
- **Utenti di prova:** `p1.dirigente`, `p2.adg`, `p3.fin`, `p4.ada.rm`, `p5.admfunz`, ...
- **Password:** `KC_UTENTI_PASSWORD` in `ambiente-prova/.cruscotto-csr/keycloak.env`.

### Differenze dal runtime standard di green-fe (OP-FE-02 dello uiplan)

- **`X-Requested-With`.** Il mutator (`src/shared/api/mutator/bff-mutator.ts`) aggiunge `X-Requested-With:
  XMLHttpRequest`: il backend ARSCSR protegge scritture ed esportazioni con header custom + Origin, non con il
  double-submit `XSRF-TOKEN`. Le opzioni `xsrf*` restano armate: il backend non emette quel cookie, quindi non
  mandano nulla.
- **Campo `profile`.** `/auth/status` del backend non espone `profile`; nel tipo `AuthUser` e' gia' facoltativo.
- **Mode `be`.** `src/app/main.tsx` salta MSW quando il mode e' `be`; `vite.config.ts` attiva il proxy solo in
  quel mode.
- **Filtri ripetibili.** Il mutator serializza gli array come parametri ripetuti (`intervento=A&intervento=B`, con
  `paramsSerializer: { indexes: null }`). Il formato di default di axios (`intervento[]=A`) e' ignorato da JAX-RS:
  il backend risponderebbe senza filtro.
- **Problem-type.** `src/shared/api/problem/problem-types.ts` usa il namespace del contratto sigillato del backend,
  `urn:cruscottocsr:problem:<errorCode>`, al posto di `urn:problema:*` del pattern green-be, e mappa tutti i codici
  della spec (ACCESSO_NEGATO, RICHIESTA_NON_AMMESSA, DATO_NON_VALIDO, NOT_FOUND, TROPPE_RICHIESTE, CAPACITA_ESAURITA,
  TEMPO_SCADUTO, ESPORTAZIONE_NON_REGISTRATA, ...). `getErrorMessage` sceglie il messaggio dal problem-type e
  mostra il `detail` solo dove la spec lo dichiara leggibile.
- **Errori delle risposte binarie.** Per l'export CSV (`responseType: 'blob'`) il mutator rilegge come JSON il corpo
  d'errore, cosi' anche il problem+json dell'export viene classificato.
- **Letture in coda.** Il backend ammette 2 letture dei report del finanziario in corso per utente (oltre: 503
  CAPACITA_ESAURITA): il mutator mette in coda le GET verso `/api/finanziario/` oltre la seconda. Il mutator condiviso
  non ha tetti predefiniti: li sceglie l'app per prefisso (`src/app/tetti-letture.ts`, configurati all'avvio da
  `main.tsx`); le altre GET non vanno in coda. Le schede aperte si coordinano con la Web Locks API, cosi' il tetto vale
  per l'utente e non per la scheda: una lettura prende il primo posto libero fra quelli del tetto. Ogni lettura in coda
  ha un tempo di guardia dall'invio: senza risposta entro la guardia libera il posto e finisce con l'errore "Il server
  non risponde"; una lettura annullata tiene il posto finche' la risposta arriva (il backend la lavora comunque), al
  piu' fino alla guardia. I nuovi tentativi (solo i transitori, con `Retry-After`) sono la politica del QueryClient
  (`src/shared/api/retry/`).
- **CSRF.** La difesa effettiva con questo backend e' `X-Requested-With` + controllo dell'Origin; le opzioni `xsrf*`
  restano per il contratto della suite ma sono inerti (il backend non emette il cookie XSRF-TOKEN).

### Shell dell'applicazione

`src/app/layout.tsx` e' la shell di tutte le route:
- skip-link; fascia degli enti con i loghi di Regione Lazio e ARSIAL (link ai siti, in una nuova finestra); barra
  dell'applicazione con la ricerca di un intervento (Invio su un codice noto apre il suo dettaglio), utente ed "Esci"
  (`/auth/logout` del BFF);
- menu laterale (`src/app/menu.tsx`) con le pagine del finanziario visibili per i grant (solo UX) e le aree future
  dichiarate "presto"; i filtri dell'indirizzo restano passando da una pagina all'altra; su schermo piccolo il menu
  si apre in un pannello;
- pie' di pagina con i collegamenti istituzionali; accessibilita', privacy e note legali sono dichiarati "indirizzo
  da definire" finche' ARSIAL non li fornisce (`src/app/collegamenti.ts`);
- l'avviso globale del 403 delle mutation;
- l'avviso di inattivita' di NFR-41: a 28 minuti una finestra modale chiede se restare collegati; a 30 minuti la SPA
  chiude davvero la sessione navigando a `/auth/logout` del BFF. Alla scadenza la cache dei dati si svuota, la shell
  smette di mostrare le pagine e il velo e' opaco: su una postazione incustodita i dati non restano leggibili. Le
  schede aperte condividono la sessione: attivita', scadenza e "Esci" passano fra le schede con un `BroadcastChannel`,
  cosi' una scheda ferma non chiude la sessione su cui si lavora in un'altra;
- il cambio d'utente senza un 401 (nuovo accesso in un'altra scheda): la lettura di `/auth/status` e' pura;
  `useUtenteDellaSessione` (`src/app/utente-della-sessione.ts`) osserva le sue risposte e, se cambia l'identita'
  (username, profilo e ruoli: e' solo una chiave per svuotare la cache, mai un controllo d'accesso), svuota la cache
  dei dati del precedente e lo annuncia alle altre schede, che rileggono la sessione;
- gli errori di pagina: un indirizzo inesistente mostra "Pagina non trovata" e un errore inatteso "Errore nella
  pagina" (mai messaggio o stack), dentro la shell (`src/app/errori.tsx`).

Ogni pagina del finanziario ha in alto la barra dei filtri: i filtri attivi come chip rimovibili, il bottone che apre il
pannello dei filtri (TX-0001) e a destra il perimetro dei dati (regionale o la propria area ADA) e la data fino a cui
tutti i flussi d'import sono aggiornati (NFR-25 b: la conclusione meno recente, con il dettaglio per flusso in un
popover); arriva con la risposta di `/api/finanziario/filtri`, in ora italiana. Il dettaglio di un intervento ha nella
barra il solo intervento, fisso: riguarda l'intervento intero. L'indirizzo del dettaglio conserva pero' la selezione da
cui ci si e' arrivati (il drill-down da grafici e tabelle la porta con se'), cosi' breadcrumb, menu e "Torna al
riepilogo" la ritrovano. Un filtro per azione portante si applica solo se il legame interventi - azioni c'e': finche'
`/api/finanziario/filtri` non lo dice, le pagine aspettano invece di leggere i report con un filtro che forse non vale.

Gli errori di lettura hanno un solo avviso per pagina (`AvvisoPagina` del kit): le sezioni in errore lo rimandano
all'avviso con un testo statico, l'avviso dice i messaggi distinti e quante sezioni non si sono caricate, e il suo
"Riprova" rilegge tutte le sezioni in errore.

La Home (`/`, dove il BFF riporta dopo il login) elenca le aree visibili per i grant dell'utente (catalogo unico delle
aree in `src/app/aree.ts`, lo stesso del menu); la card di un'area porta alla sua prima pagina visibile. `RequireGrant`
distingue tre casi:
- utente non collegato: invito ad accedere;
- sessione non verificabile: "Riprova" e "Accedi di nuovo", senza redirect automatico, per non creare un ciclo di login;
- utente senza il grant: accesso non disponibile.

### Interfaccia (UI v2)

Il kit generico sta in `src/shared/ui` e si riusa nelle prossime aree:
- `tema.css`: token (`--ui-*`) e classi `ui-*` sopra bootstrap-italia; font Titillium serviti dall'app;
- `grafici/`: `Grafico`, il solo wrapper di Apache ECharts (import modulari, renderer SVG, niente animazioni con
  `prefers-reduced-motion`), e `CardGrafico`: titolo, vista Grafico/Tabella, download, voci omesse, fonte. Il PNG del
  grafico (`pngDelGrafico`) si ridisegna fuori pagina col renderer canvas, con le opzioni correnti (legenda, zoom) e le
  stesse dimensioni: e' il grafico come si vede, coi font della pagina, a densita' almeno doppia;
- `PulsantiScarica`: un pulsante per formato (PNG, CSV, XLSX) con icona e sigla, esito in `role=status`, errore in un
  avviso. CSV e XLSX dei dati vengono dal backend (D-08: ogni export e' registrato in audit), mai generati nel browser;
- `Kpi`, `BarraFiltri`, `PannelloLaterale` (dialogo laterale di react-aria-components), `Sezione` e `Griglia`,
  `TabellaInterattiva` (ricerca, ordinamento con `aria-sort`, scelta delle colonne, paginazione, totali e righe di
  piede, riga apribile con clic o Invio; tabella HTML nativa: la `Table` di react-aria non serve senza selezione ne'
  modifica di celle; la logica e' in `src/shared/lib/tabella.ts`), tabelle semplici (`TabellaRighe`, `TabellaVoci`,
  `TabellaDati`: le assenze col motivo vanno a capo, gli importi no; su schermo stretto il contenitore scorre ed e' una
  regione raggiungibile da tastiera);
- `VistaQuery` con i rami della vista dati e `AvvisoPagina`, l'avviso d'errore unico della pagina;
- `salvaFile` e `blobDaDataUrl`: lo stesso salvataggio per gli export e per l'immagine di un grafico.
- Nella `Griglia` una card non ha `height: 100%`: la allunga la griglia, o il contenitore in colonna quando nella stessa
  cella ci sono piu' card (grafico e voci della pagina SIGC); con `height: 100%` ognuna diventava alta quanto la cella.

Il nome dell'applicazione (titolo dei documenti, testata, Home) e' configurazione del progetto:
`src/shared/config/applicazione.ts`.

I mattoni puri dei grafici stanno in `src/shared/lib/grafici/`:
- il contratto dei builder (`DatiGrafico`: le opzioni oppure il motivo per cui il grafico non si disegna, la tabella
  equivalente, le voci omesse) e i colori del tema;
- le primitive (descrizione accessibile, zoom, testi delle serie) e gli scheletri di cascata, barre raggruppate e
  ciambella;
- `opzioniSicure`: tooltip disegnato nel grafico (richText, mai HTML) e numeri degli assi in italiano.

I builder di dominio stanno nelle feature, uno per report (`src/features/finanziario/lib/grafici/`), e gli aggregati
calcolati dal frontend in `lib/aggregati.ts`: mai somme parziali; un totale con un valore assente e' "non
calcolabile", salvo un'assenza con lo stesso motivo in tutte le righe, che dice il suo motivo. Un valore assente non
diventa mai zero. Le regole sugli Importo (`lib/importi.ts`), sull'avanzamento (`lib/avanzamento.ts`) e sul perimetro
(`lib/perimetro.ts`) sono uniche e condivise da builder, aggregati e componenti. Il clic su un elemento e' il
drill-down: dal grafico al dettaglio dell'intervento (`/finanziario/interventi/:codice`, con la selezione
nell'indirizzo; anche da tastiera, con Invio sulla riga della tabella) o alla pagina collegata. Complessita' e lunghezza delle funzioni
dei layer `lib/` sono limitate da eslint (10 e 60 righe).

Nei test jsdom non disegna: `src/shared/test/setup.ts` sostituisce ECharts con un grafico finto
(`src/shared/testing/grafico-finto.ts`) che registra le opzioni e simula il clic; `src/shared/testing/card-grafico.ts`
trova una card, il suo grafico e la sua tabella.

Il service worker di MSW sta in `public-dev/` ed e' servito solo dal dev server: la build di produzione non lo
contiene.

### Deploy: header di sicurezza

La SPA non ha `<script>` inline ne' stili inline di terze parti. Il contenitore che la serve, sulla stessa origine del
BFF, deve impostare:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: same-origin
```

La verifica e' un test e2e versionato: `npm run test:e2e` (`e2e/csp.spec.ts`) serve la build di produzione con questa
CSP, apre la panoramica e la pagina delle domande, mostra i tooltip di un elemento e di un asse, apre il pannello dei
filtri e l'anteprima di un intervento dal riepilogo, e apre il dettaglio dell'intervento con le sue schede: nessuna
violazione. Il tooltip di ECharts e' disegnato nel grafico (`renderMode: 'richText'`, imposto dal kit):
il tooltip HTML scriverebbe attributi `style` con `innerHTML`, bloccati da `style-src 'self'`.

Gli `<style>` che react-aria inietta sono due, ed entrambi sono bloccati da `style-src 'self'`:
- quello di `usePress` per `touch-action`: la stessa regola sta in `src/shared/ui/tema.css`, e il segnaposto
  `<meta id="react-aria-pressable-style">` in `index.html` dice a react-aria di non iniettarla;
- su iOS e iPadOS (ogni browser WebKit), all'apertura di una finestra modale (pannello dei filtri, menu su schermo
  stretto, anteprima dell'intervento, avviso di inattivita'), `usePreventScroll` antepone in `<head>` uno `<style>`
  con `overscroll-behavior: contain`, per non far scorrere la pagina sotto la modale. Con questa CSP la regola e'
  bloccata: il browser segnala una violazione a ogni apertura e su iPhone e iPad la pagina sotto la modale puo'
  scorrere. Focus, chiusura e lettori di schermo funzionano comunque; non e' un rischio di sicurezza.

Se serve la regola su iOS, il contenitore la puo' ammettere con un nonce generato a ogni risposta, mai fisso nella
build: `style-src 'self' 'nonce-<valore>'` e, nell'`index.html` servito, `<meta property="csp-nonce" content="<valore>">`
con lo stesso valore (react-aria lo legge e lo mette sul suo `<style>`). Con un `index.html` statico servito da cache il
nonce per risposta non e' praticabile, e resta l'eccezione dichiarata qui. Il profilo WebKit mobile degli e2e
(Playwright `devices['iPhone 15']`) si attiva con `E2E_WEBKIT=1 npm run test:e2e`, dopo `npx playwright install webkit`:
su quel profilo il test delle modali tollera solo questa violazione. Non e' ancora stato eseguito: WebKit non e'
installato sulle postazioni di sviluppo.

Peso: il chunk del finanziario e' di circa 1,2 MB (380 kB gzip), in gran parte ECharts; se servisse, ECharts si puo'
caricare a parte con un import dinamico nel wrapper `Grafico`.

### Convenzioni del codice e test

- **Apostrofi nel testo JSX.** Il testo JSX con un apostrofo va scritto come stringa (`{"l'anno"}`). I detector a
  lexer dei gate green-fe leggono `'` come inizio di stringa e, senza chiusura, non vedono il resto del file. Il
  limite e' del plugin green-fe (detector dei gate di step5/step6 non ancora su AST): da riportare al manutentore.

- **Confini fra slice (Z-02).** Una feature importa liberamente dentro il proprio slice; da un altro slice solo dal
  barrel (`src/features/<slice>/index.ts`). I moduli di prova (`shared/testing`, `features/<slice>/testing`,
  `api/mock`) sono vietati nel codice di produzione: li usano i test e `src/app/main.tsx` per il dev server con MSW. I
  dati di prova e d'esempio di un'area stanno nella sua feature (`testing/` e `api/mock/esempio.ts`); i test delle
  pagine importano dalla feature solo il barrel e `testing/`. Le canary sono in
  `tests/eslint-regole.test.ts`.

Test e gate: `npm run test` esegue i test dei componenti (`tests/`) e delle pagine (`src/pages/**/page.test.tsx`,
con i `describe` etichettati sui requisiti RF001-RF015). L'helper axe e' `src/shared/testing/axe.ts` e i dati di
prova sono in `src/features/finanziario/testing/fixture.ts`, inventati e senza dati reali (nella feature: i test delle
pagine li importano da li', il codice di produzione no).
