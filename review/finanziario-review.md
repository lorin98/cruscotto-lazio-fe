# Review step9 della feature finanziario (green-fe), UI v2

Intensita' **FULL**. Verdetto meccanico (`review-score.sh FULL review/finanziario-findings.json`): **PASS**, score
**88** (soglia 80), 0 CRITICO, 0 MAGGIORE, 3 MINORE, 3 COSMETICO. Commit verificato: `d9c427f`. Budget: 3 iterazioni,
usate tutte.

La UI v2 (richiesta dell'utente dell'08/10/2026, ADR 0027 del plugin) ha rifatto la catena da step1: ECharts, kit
dell'interfaccia riusabile in `src/shared/ui` e `src/shared/lib/grafici`, panoramica, dettaglio dell'intervento,
pannello dei filtri. La review della UI v1 (score 82, commit `57cd812`) resta nella storia di git.

## Percorso

| Iterazione | Commit | Chi | Esito |
|---|---|---|---|
| 1 | `dadc66c` | lenti V (fedelta'), H (FSD e SRP), A (red-team), antagonista, Judge | 65 finding, 62 accettati: 1 CRITICO, 10 MAGGIORE, 47 MINORE, 4 COSMETICO |
| 2 | `11d0711` | revisore di convergenza | 49 risolti, 12 parziali, 1 non risolto; 25 nuovi (15 MINORE, 10 COSMETICO); residui 20 MINORE, 18 COSMETICO (score 22: FAIL) |
| 3 | `d9c427f` | revisore di convergenza | 35 risolti, 2 parziali, 1 non risolto; 3 nuovi (MINORE); residui 3 MINORE, 3 COSMETICO (score 88: PASS) |

Dettaglio di ogni iterazione in `review/v2-iter1/`, `review/v2-iter2/`, `review/v2-iter3/`: finding delle lenti,
verdetti del Judge, esiti della convergenza, nuovi finding, residui.

Gate non declassabili (FE): `contextProjection` mai usata come controllo di sicurezza (l'impronta dell'identita' serve
solo a svuotare la cache), CSRF invariato, nessun allargamento dei grant (`check-ui-authz`: deny-by-default e
anti-widening, 9 route). Gate meccanico di step8 11/11 dopo ogni giro di correzioni; 642 test, 4 e2e sulla build di
produzione con la CSP del README.

Temi principali corretti nelle iterazioni 1 e 2:
- aggregati dei KPI in lib, mai somme parziali (il CRITICO H-01), e regole uniche su importi, avanzamento e perimetro ADA;
- grafici: opzioni memoizzate, primitive nel kit, perimetro ADA in cascata e sankey, tooltip `richText` per la CSP
  (verificata da un e2e);
- shell: pagina d'errore e pagina non trovata dentro la shell, titolo e focus del dettaglio in ogni stato;
- dettaglio dell'intervento: dati del solo intervento, con la selezione dell'utente conservata nell'indirizzo;
- un solo avviso d'errore per pagina; attesa del legame interventi - azioni prima di applicare il filtro azione;
- coda delle letture coordinata fra le schede (tetti dell'app, primo lock libero, guardia dall'invio), lettura pura
  della sessione con l'impronta dell'identita';
- confini: fixture ed esempi MSW nella feature, vietati nel codice di produzione; canary del lint per soglie e barrel.

## Finding accettati (residui)

### MINORE

- **M-01** `src/shared/api/mutator/bff-mutator.ts:130`: il timeout della guardia (ETIMEDOUT senza risposta) e'
  trattato da `soloTransitori` come rete assente e riprovato 3 volte; una lettura appesa da' l'errore dopo circa 8
  minuti invece che alla guardia.
  - Fix proposto: in `soloTransitori`, `if (errore.code === AxiosError.ETIMEDOUT) return false;`, con un test.
- **M-02** `src/shared/ui/stati/AvvisoPagina.tsx:40`: dopo un "Riprova" riuscito l'avviso si smonta insieme al
  pulsante che ha il focus, che finisce su BODY (WCAG 2.4.3).
  - Fix proposto: un contenitore sempre montato con `tabIndex=-1` che riceve il focus quando gli errori tornano a zero.
- **M-03** `eslint.config.js:259`: il divieto dei moduli di prova (Z-02) non copre `src/features/*/api/**`, che il
  blocco dei consumatori ignora: `api/index.ts` potrebbe importare `./mock/esempio` o `../testing/fixture`.
  - Fix proposto: un blocco per `src/features/*/api/**` (escluso `api/mock/**`) con il gruppo dei moduli di prova, piu'
    una canary da `api/`.

### COSMETICO

- **V-22** `src/features/finanziario/ui/PannelloFiltri.tsx:134`: il pulsante del pannello e' "Applica i filtri", il
  wireframe dice "Mostra n interventi". Il conteggio n richiede il legame intervento - OG/OS/OP, che TX-0001 non
  espone: la scelta e' dell'utente.
- **N-08** `src/features/finanziario/lib/grafici/domande.ts:99`: la nota sulle domande senza importo ammesso e'
  scritta due volte con testi diversi ("nella somma" in `aggregati.ts`, "nelle somme" nel builder).
- **N-24** `src/pages/finanziario/panoramica/page.tsx:7`: la pagina passa un sottotitolo identico a quello del
  catalogo.

## Finding contestati (CRITICO rigettati)

Nessuno. Il Judge dell'iterazione 1 ha rigettato 3 finding, tutti duplicati (V-02 e V-13 di H-01, A-06 di H-04).

## Limiti accettati e punti aperti

- Ritorno alla pagina dopo un 401: limite noto accettato dall'utente (OP-FE-06).
- Gerarchia intervento - OS - OG - OP dal backend (OP-FE-07), fonte del pagato SIGC (OP-FE-05), filtri della riserva
  (OP-FE-03).
- Il profilo WebKit mobile degli e2e (`E2E_WEBKIT=1`) non e' mai stato eseguito: WebKit non e' installato sulle
  postazioni di sviluppo.
- Una lettura gia' in attesa resta legata al lock del proprio posto anche se se ne libera un altro; l'attesa e'
  limitata dalla guardia (120 s).
