# Review step9 della feature finanziario (green-fe)

Intensita' **FULL** (prima feature del progetto, obbligatoria). Verdetto meccanico (`review-score.sh`): **PASS**, score
**82** (soglia 80), 0 CRITICO, 0 MAGGIORE, 5 MINORE, 3 COSMETICO. Budget di review portato da 2 a 3 iterazioni con
l'ok dell'utente (08/10/2026).

## Percorso

| Iterazione | Chi | Esito |
|---|---|---|
| 1 | lenti V (fedelta'), H (FSD), A (red-team), antagonista | 68 finding: 0 CRITICO, 16 MAGGIORE, 41 MINORE, 11 COSMETICO |
| 2 | revisore di convergenza | 55 risolti, 12 parziali, 1 non risolto; residui 9 MINORE, 7 COSMETICO (score 66: FAIL) |
| 3 | revisore di convergenza | residui 5 MINORE, 3 COSMETICO (score 82: PASS) |

Gate non declassabili prima del Judge: `check-ui-authz.sh` integro (8 route, 15 azioni, 0 violazioni); gate meccanico
di step8 11/11 dopo ogni giro di correzioni.

Correzioni rilevanti emerse dalla review, anche nel backend ARSCSR: filtri OG/OP sui singoli obiettivi; sessione OIDC con
inattivita' tollerata di almeno 30 minuti (NFR-41); operationId sulla spec di finanziario.

## Finding accettati (residui)

### MINORE

- **Z-01** (R-01) `src/shared/api/mutator/bff-mutator.ts:63` — Dopo un 401 si perdono pagina, filtri, anno ed esercizio (limite accettato, OP-FE-06)
  - Fix proposto: Come da OP-FE-06: parametro di ritorno sul BFF (/auth/login?da=<percorso>) validato lato server contro la route-table. Fino ad allora correggere il testo dello stato 401 nei wireframe al prossimo giro di approvazione, oppure citare OP-FE-06 fra le deviazioni riviste di ogni flusso.
- **Z-02** (R-04) `eslint.config.js:163` — boundaries ancora per layer: nessun controllo fra slice ne' verso i moduli di prova (latente)
  - Fix proposto: Element 'src/features/*/**' con capture ['slice'] e una policy che ammetta lo stesso slice o il solo barrel di un altro. Group no-restricted-imports per shared/testing e api/mock nel blocco dei consumatori, escludendo i test, src/shared/test/** e src/app/main.tsx. Una canary per ciascuna regola in tests/eslint-regole.test.ts.
- **Z-03** (R-13) `src/app/inattivita.tsx:71` — La scadenza per inattivita' resta solo una finestra del frontend: al minuto 30 la sessione del BFF e' viva e 'Accedi' non riautentica
  - Fix proposto: Allo scadere del limite chiudere davvero la sessione: navigazione top-level a resolveLogoutPath() (la GuardiaLogout ammette le navigazioni same-origin), poi la Home dice 'Accedi'. Oppure la finestra offre 'Esci' e non 'Accedi'. Allineare le schede con BroadcastChannel (non e' Web Storage), facendo ripartire il timer anche a ogni risposta /api riuscita. Ricavare il testo da preavviso. Test: scaduto il limite si naviga a /auth/logout.
- **Z-04** (nuovo) `../cruscotto-lazio-be/ARSCSR/bootstrap/bootstrap-postgres/src/main/resources/application.properties:67` — Il passaggio di session-age-extension a 30M (R-13) non e' arrivato alla cache del back-channel logout ne' alla decisione D-11
  - Fix proposto: Portare token-cache-time-to-live a 45M o piu' e far verificare al test la relazione TTL >= token + estensione. Aggiungere a D-11 una revisione (estensione 30M, tolleranza 30-45 minuti, avviso del frontend a 28/30 con R-13) e aggiornare la nota di NFR-41 e la matrice di conformita'.
- **Z-05** (R-07, R-09, R-15) `tests/shell.test.tsx:134` — Le ultime correzioni non hanno test che le proteggano: il test del focus dopo 'Chiudi' passa comunque, R-09 e R-15 non hanno test
  - Fix proposto: (1) userEvent.click su 'Chiudi', oppure spostare prima il focus sul bottone, e verificare che l'h1 riceva il focus. (2) Tre test con l'auth-status ridotto e un flag sull'handler MSW (come 'senza il grant di una transazione', finanziario-ui.test.tsx:302). (3) TX-0002 e TX-0012 con delay(): prima della risposta nessun valore della sezione, solo 'Caricamento in corso'.

### COSMETICO

- **Z-06** (R-09) `src/app/routes.tsx:42` — Home, breadcrumb e 'Modifica filtri' presumono csr.tx-0001.read (latente)
  - Fix proposto: Nella Home mostrare l'area se l'utente ha almeno un grant di una sua route e puntarla al primo report visibile quando manca tx-0001. Senza tx-0001 rendere il breadcrumb come testo e nascondere 'Modifica filtri'.
- **Z-07** (R-12) `tests/finanziario-ui.test.tsx:63` — Restano un nome di test e un commento della fixture sui valori OP composti, gestione rimossa
  - Fix proposto: Rinominare il test (es. 'OP atomici dal backend, selezione multipla in alternativa; il testo spiega E/O') e togliere il commento della fixture.
- **Z-08** (R-16, R-05) `src/app/routes.tsx:24` — Blocco 'sessione non verificabile' duplicato fra Home e RequireGrant; etichetta dei test e QueryClient locali
  - Fix proposto: Estrarre un componente SessioneNonVerificabile in app/ e usarlo nei due punti. Spostare i test R-08 e R-16 in un describe proprio, o farli girare su createQueryClient. Un helper tests/app-client.ts che costruisca createQueryClient senza retry per i test sotto tests/.

## Finding contestati (CRITICO rigettati)

Nessuno.

## Limiti accettati e punti aperti

- R-01 / Z-01: ritorno alla pagina dopo un 401, limite noto accettato dall'utente (OP-FE-06 nello uiplan).
- Domande per ARSIAL: fonte del "pagato" SIGC (OP-FE-05), data dell'ultima sincronizzazione (OP-FE-04).

## Correzioni dopo la review (08/10/2026)

Applicate dopo il PASS, senza cambiare il verdetto. Gate di step8 rieseguito in sola verifica: 11/11, 223 test verdi.

| Residuo | Esito | Dove |
|---|---|---|
| Z-03 | Risolto. Al limite di inattivita' la SPA naviga a `/auth/logout` (la GuardiaLogout ammette la navigazione same-origin). L'attivita' e la scadenza passano fra le schede con un `BroadcastChannel`. Il testo del preavviso viene da `preavviso`. | `src/app/inattivita.tsx` |
| Z-04 | Nel backend: `token-cache-time-to-live=45M` e test aggiornato. La revisione di D-11 e la nota di NFR-41 attendono la riapprovazione dei gate umani di nfr-conformance. | `cruscotto-lazio-be` |
| Z-05 | Risolto. Il test del focus parte dal bottone "Chiudi". Nuovi test per R-09 (senza tx-0012 nessuna lettura di TX-0012; senza tx-0001 nessuna lettura di TX-0001; ritorno al primo report visibile) e per R-15 (TX-0002 e TX-0012 trattenute: sezioni in caricamento, nessun valore). Prova di mutazione: 9 correzioni disattivate una alla volta, 9 test falliti. | `tests/shell.test.tsx`, `tests/finanziario-ui.test.tsx`, `src/pages/finanziario/filtri/page.test.tsx` |
| Z-07 | Risolto. Test rinominato, commento della fixture tolto. | `tests/finanziario-ui.test.tsx`, `src/shared/testing/fixture-finanziario.ts` |
| Z-08 | Risolto. `SessioneNonVerificabile` condiviso da Home e RequireGrant. I test della shell girano sul QueryClient di produzione (`tests/app-client.ts`). | `src/app/sessione-non-verificabile.tsx` |
| Z-02 | Risolto. Elemento `features` per slice (cartella, nome catturato): dentro lo slice import liberi, da un altro slice solo dal barrel. `shared/testing` e `api/mock` vietati nel codice di produzione (esclusi i test sotto `src/` e `src/app/main.tsx`). 8 canary nuove. | `eslint.config.js`, `tests/eslint-regole.test.ts` |
| Z-01, Z-06 | Aperti. Z-01 e' il limite accettato (OP-FE-06). Z-06 resta latente finche' i profili hanno tutti o nessuno dei grant della slice. | |

## OP-FE-04: ultimo dato sincronizzato (08/10/2026)

Punto aperto dello uiplan risolto dopo la review, con una modifica del contratto. Scelta dell'utente: la data viaggia con
i filtri.

- **Backend.** TX-0001 porta `ultimiDatiSincronizzati`: una voce per flusso d'import, con la conclusione dell'ultima
  esecuzione SUCCESS o PARTIAL. E' la stessa fonte dell'intestazione degli export. Le aggiunte alla spec sono solo
  additive. Test: servizio (2 nuovi), confine di `/filtri` con un'esecuzione nota, contratto OpenAPI.
- **Frontend.** Riga sotto il titolo di ogni pagina (`UltimoAggiornamento`), in ora italiana, visibile con
  `csr.tx-0001.read`. I wireframe dei 4 flussi sono stati riapprovati. Prova di mutazione: 7 scelte disattivate, 7 test
  falliti. Gate step8 11/11.
- **Verifica sul sistema vero.** 7 flussi, sia dal backend diretto sia via proxy del frontend con sessione BFF.
- **Fuori perimetro:**
  - la data per singola fonte di ogni report;
  - il marcatore "dato non aggiornato da N giorni" di NFR-25 (c), che richiede i cicli attesi per fonte (da ARSIAL).
