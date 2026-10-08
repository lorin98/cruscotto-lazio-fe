# cruscotto-lazio-fe

Frontend del Cruscotto di monitoraggio CSR 2023-2027 (ARSIAL / Regione Lazio), generato con il plugin
**green-fe** a partire da:

- il requirements-pack sigillato di `../cruscotto-lazio-spec/reqpack`;
- l'handover del backend di `../cruscotto-lazio-be` (OpenAPI per slice e `authz-catalog.json` sigillati
  nel manifest a `step10-gate`), raccolto in `handover/` e verificato in `handover.json`.

Stato della generazione: `.claude/state/green-fe-<feature>.state.json` (si legge con gli script del plugin);
per proseguire `/green-fe:build finanziario`. Piano UI in `uiplan.json`, wireframe approvati in `wireframes/`,
decisione sul tema in `docs/decisioni/style-guide.md`.

## Sviluppo

Node `^24.15.0` (`.nvmrc`), poi `npm ci`.

| Comando | Cosa |
|---|---|
| `npm run dev` | dev server con i mock MSW (nessun backend): tutte le chiamate sono servite dagli handler generati |
| `npm run dev:be` | dev server collegato al **backend vero** (BFF, Keycloak, PostgreSQL): niente MSW |
| `npm run api:generate` | rigenera il client orval da `specs/openapi-*.json` |
| `npm run typecheck`, `build`, `test`, `lint` | i controlli del gate di green-fe |

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
- **Letture in coda.** Il backend ammette 2 letture dei report in corso per utente (oltre: 503 CAPACITA_ESAURITA): il
  mutator mette in coda le GET verso `/api` oltre la seconda, e i wrapper riprovano solo i transitori rispettando
  `Retry-After`.
- **CSRF.** La difesa effettiva con questo backend e' `X-Requested-With` + controllo dell'Origin; le opzioni `xsrf*`
  restano per il contratto della suite ma sono inerti (il backend non emette il cookie XSRF-TOKEN).

### Shell dell'applicazione

`src/app/layout.tsx` e' la shell di tutte le route:
- skip-link, intestazione con utente ed "Esci" (`/auth/logout` del BFF) e pie' di pagina;
- l'avviso globale del 403 delle mutation;
- l'avviso di inattivita' di NFR-41: a 28 minuti una finestra modale chiede se restare collegati; a 30 minuti la SPA
  chiude davvero la sessione navigando a `/auth/logout` del BFF. Le schede aperte condividono la sessione: l'attivita'
  e la scadenza passano fra le schede con un `BroadcastChannel`, cosi' una scheda ferma non chiude la sessione su cui
  si lavora in un'altra.

Ogni pagina del finanziario mostra sotto il titolo l'ultimo dato sincronizzato per flusso d'import (NFR-25 b): arriva
con la risposta di `/api/finanziario/filtri` (TX-0001), la stessa data dell'intestazione degli export, in ora italiana.

La Home (`/`, dove il BFF riporta dopo il login) elenca le aree visibili per i grant dell'utente. `RequireGrant`
distingue tre casi:
- utente non collegato: invito ad accedere;
- sessione non verificabile: "Riprova" e "Accedi di nuovo", senza redirect automatico, per non creare un ciclo di login;
- utente senza il grant: accesso non disponibile.

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

`style-src` va verificato con i font e le icone di bootstrap-italia: se richiedono `data:` per i font, va aggiunto. I
grafici SVG usano attributi di presentazione, non stili inline.

### Convenzioni del codice e test

- **Apostrofi nel testo JSX.** Il testo JSX con un apostrofo va scritto come stringa (`{"l'anno"}`). I detector a
  lexer dei gate green-fe leggono `'` come inizio di stringa e, senza chiusura, non vedono il resto del file. Il
  limite e' del plugin green-fe (detector dei gate di step5/step6 non ancora su AST): da riportare al manutentore.

- **Confini fra slice (Z-02).** Una feature importa liberamente dentro il proprio slice; da un altro slice solo dal
  barrel (`src/features/<slice>/index.ts`). I moduli di prova (`shared/testing`, `api/mock`) sono vietati nel codice di
  produzione: li usano i test e `src/app/main.tsx` per il dev server con MSW. Le canary sono in
  `tests/eslint-regole.test.ts`.

Test e gate: `npm run test` esegue i test dei componenti (`tests/`) e delle pagine (`src/pages/**/page.test.tsx`,
con i `describe` etichettati sui requisiti RF001-RF015). L'helper axe e' `src/shared/testing/axe.ts` e i dati di
prova sono in `src/shared/testing/fixture-finanziario.ts`, inventati e senza dati reali.
