# Dossier del gate wireframe - feature finanziario (layout alla radice)

Preparato il 30/10/2026 (step1 rifatto per il riallineamento degli ambiti; brief
`ambiente-prova/strumenti-sessione-317ae849/brief-fe-step1-ambiti.md`). Nessuna approvazione registrata: ne' nello stato
(`.claude/state/green-fe-finanziario.state.json`, non toccato) ne' nello uiplan. Il carry-over dei flussi invariati lo fa la
sessione principale con `refresh-fe-carryover.sh`.

## Scelte dell'utente (30/10/2026) e carry-over

Scelte dell'utente del 30/10/2026: S-1 (a), nessun collegamento dalla pagina SIGC alla verifica SMP SIGC dell'istituzionale; S-2
(a), i quattro flussi invariati restano identici (la voce "Verifica SMP" nel menu della shell dei wireframe resta: la shell non e'
normativa, il menu vero e' nel codice). Carry-over di panoramica, riepilogo, dotazione-avanzamento e domande
(`refresh/finanziario-flows.json`); da approvare sigc (CAMBIATO, `sha256:8189d3aa39192515b10f93dd9c087b24a95b335ade329052113204612766b0cf`).

## In testa: cosa cambia per il riallineamento (29/10/2026)

- **Decisioni**: verbale `cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1 (TX-0015 verifica SMP
  SIGC passa all'istituzionale), A-4 (indirizzi per ambito, nessun alias), A-5 (pagine del FE per ambito). G4 del 21/10
  (link dalla verifica non SIGC a quella SIGC del finanziario) e' superata.
- **Contratto**: `handover/openapi-finanziario.json` passa da `sha256:e65fc85f...dbbb` a
  `sha256:f540db815eaa900ae43004c4488617a4a3c0c907d12b8f5da779d20b82c8439b`. Rispetto al contratto precedente mancano solo
  `/api/finanziario/sigc/verifica-smp` e `/{formato}`, gli schemi `VerificaSmp`, `VerificaSmpRiga`, `ConteggioFinanziario`,
  `SiNoFinanziario`, e la descrizione del tag dice "TX-0001..TX-0014". Il resto della spec e' identico (confronto jq
  normalizzato). Il manifest della slice ha TX-0001..TX-0014.
- **Catalogo rev. 4**: i titolari di csr.tx-0001.read..csr.tx-0014.read non cambiano. csr.tx-0015.read e' ora di
  p1-dirigente, p2-referente-adg, p3-funzionario-area-ist (prima: P1, P2, P3 finanziario, P4, P5).
- **Uiplan** (`uiplan.json`): `pack_hash` 1.4.0 (`sha256:141380bd...5b7`), `spec_pins` copiati da `handover.json`. Tolti la
  route `/finanziario/sigc/verifica-smp`, i suoi 25 campi (schema VerificaSmp) e la route dal flusso sigc. Nelle note WCAG
  del flusso sigc tolte le due note della verifica. Tolta l'`approval` del flusso sigc (il suo hash non vale piu'), restano
  quelle dei quattro flussi invariati. OP-FE-06 non cita piu' l'esercizio della verifica. Nuovo OP-FE-10: la verifica esce
  dal finanziario, cosa allinea lo step6. Ora ci sono 8 route e 138 campi.
- **Controlli meccanici**: `uiplan-validate.sh uiplan.json handover/slices handover/authz-catalog.json` rc 0 (14
  transazioni attese, 8 route, 5 flussi). `fe-project-check.sh . --feature finanziario --catalog` rc 0, e rc 0 anche per
  istituzionale, procedurale, fisico ed elenco-operativo con i loro uiplan di stamattina: il link G4 verso la vecchia route
  non c'e' piu'. `wireframe-lint.sh` coi template v2 rc 0 sul flusso sigc. Il lint e' statico: **axe e' rimandato allo
  step8** ed e' bloccante nel gate 11/11.

## Flussi

| flusso | esito | hash (`wireframe-hash.sh`) |
|---|---|---|
| panoramica | INVARIATO (atteso carry-over) | `sha256:62847ef999d2117747d48ade82cec4c30d0962fd65ef67fc7172f2931fa3ba82` |
| riepilogo | INVARIATO (atteso carry-over) | `sha256:8d3e3739ae6f988cf64e6a6cd38a05299388742a85ffe1a6d8b0596d7bdfe2d1` |
| dotazione-avanzamento | INVARIATO (atteso carry-over) | `sha256:ead559227a1e9ae2ffc680cd48943ee02bf23af206b3918efc799feb6092636c` |
| domande | INVARIATO (atteso carry-over) | `sha256:67bb6e94750c9514d15c72bb2480ad9b68596156bef3a4d4968ff4c71ee97313` |
| sigc | CAMBIATO (tolta una pagina): da riapprovare | `sha256:8189d3aa39192515b10f93dd9c087b24a95b335ade329052113204612766b0cf` (prima `bff0fa0c...b5`) |

Per i quattro flussi invariati gli hash coincidono con gli `approved_hash` dello uiplan. Le dir sono byte per byte quelle
di HEAD (e0f6cb7).

### Verifica dei flussi invariati: citano la verifica SMP?

Ho cercato "verifica", "SMP", "TX-0015" e "RF015" in tutti i file dei quattro flussi. Le pagine non citano la verifica:
nessun KPI, card, grafico, link o testo, e nemmeno la scheda dell'intervento (`panoramica/intervento.html`). Anche la card
Finanziario della Home (`AnteprimaFinanziario`) non legge TX-0015.

Resta una sola citazione, la voce "Verifica SMP" (`../sigc/verifica-smp.html`) nel menu laterale delle sette pagine. Quel
menu e' la shell del 13/10/2026, che e' del layer `app/` e non della feature (uiplan-patterns 7). Era gia' superato: mostra
"Fisico (presto)", "Procedurale (presto)", ecc. Per questo i quattro flussi restano identici. La voce sparisce dal menu
vero allo step6, e nel low-fi resta un link a una pagina tolta. E' la scelta S-2 qui sotto.

### Flusso panoramica (INVARIATO)

- HTML: `wireframes/panoramica/panoramica.html`, `wireframes/panoramica/intervento.html` (doc `panoramica.md`)
- Route: `/finanziario` (cruscotto, csr.tx-0001/0002/0009/0012/0013.read) e `/finanziario/interventi/:codice` (dettaglio,
  csr.tx-0011/0002/0008/0010/0012/0013.read), scope territoriale-ada. Campi: 24 e 30, dagli schemi di TX-0001..TX-0013. Note
  WCAG: 5 (invariate).

### Flusso riepilogo (INVARIATO)

- HTML: `wireframes/riepilogo/riepilogo.html`. Route: `/finanziario/riepilogo` (report, csr.tx-0011.read). Campi: 12
  (RiepilogoFinanziario). Note WCAG: 5 (invariate).

### Flusso dotazione-avanzamento (INVARIATO)

- HTML: `wireframes/dotazione-avanzamento/dotazione.html`, `avanzamento.html`. Route: `/finanziario/dotazione` (report,
  csr.tx-0002/0003.read) e `/finanziario/avanzamento` (report, csr.tx-0004..0007.read). Campi: 14 e 17. Note WCAG: 4
  (invariate).

### Flusso domande (INVARIATO)

- HTML: `wireframes/domande/domande.html`. Route: `/finanziario/domande` (report, csr.tx-0008/0009/0010.read). Campi: 15.
  Note WCAG: 4 (invariate).

### Flusso sigc (CAMBIATO: da riapprovare)

- **HTML da aprire**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\sigc\sigc.html` e
  `...\wireframes\sigc\riserva.html`. Il doc del flusso e' `wireframes/sigc/sigc.md`.
- **Cosa cambia**:
  - tolto `verifica-smp.html`;
  - in `sigc.html` e `riserva.html` tolta solo la riga di menu "Verifica SMP", il resto e' identico;
  - in `sigc.md`: nota "Rivisto il 30/10/2026", tolte le righe della verifica (route, albero, grafico), "Non collegati"
    riscritto (nessun link verso altri ambiti), aggiunto OP-FE-10.
- **Route e pattern**: `/finanziario/sigc` (report v2, csr.tx-0012.read e csr.tx-0013.read, territoriale-ada; link
  elenco-sigc ed elenco-sigc-importi verso `/elenco-operativo/domande`, invariati); `/finanziario/sigc/riserva` (report
  v2, csr.tx-0014.read, dato regionale senza filtri). Grant verbatim dal catalogo rev. 4, invariati.
- **Campi**: 12 su `/finanziario/sigc` (DomandeSigc, ImportiSigc) e 14 su `/riserva` (MonitoraggioRiserva), invariati.
  Tolti i 25 della verifica.
- **Note WCAG**: tabella equivalente di ogni grafico; assenze in testo; perimetro in testo; selettore dell'anno della
  riserva con label e 404 della riserva come stato vuoto spiegato; download per formato (V-07). Restano da verificare a mano
  l'ordine di lettura, le didascalie, il contrasto della resa finale e i bersagli da 24 px dei link "Apri nell'elenco".
  **axe rimandato allo step8.**
- **Open point**: OP-FE-03, OP-FE-05, OP-FE-09, OP-FE-10 (nuovo).

### Pagina tolta (va all'istituzionale)

`wireframes/sigc/verifica-smp.html`, route `/finanziario/sigc/verifica-smp` (TX-0015, RF015, csr.tx-0015.read). La porta
l'agente dell'istituzionale da `git show HEAD:wireframes/sigc/verifica-smp.html` nel flusso `verifica-smp-sigc`, route
`/istituzionale/verifica-smp-sigc`. Nessun alias della vecchia route (A-4).

## Open point

| id | stato | tema |
|---|---|---|
| OP-FE-01, 02, 04, 05, 07, 08 | invariati | grafici, BFF, ultimo dato, fonti del pagato, gerarchia OS/OG/OP, PNG non in audit |
| OP-FE-03 | invariato | filtri non applicabili alla riserva |
| OP-FE-06 | aggiornato | il ritorno dopo il login non cita piu' l'esercizio della verifica SMP |
| OP-FE-09 | invariato | profili misti P4 + profilo regionale (vale ancora: con la rev. 4 i P3 sono per area) |
| OP-FE-10 | nuovo | la verifica SMP SIGC esce dal finanziario: cosa allinea lo step6 (sotto) |

## Cosa dovra' cambiare allo step6 (fuori dai wireframe, non toccato ora)

- `src/features/finanziario/lib/report.ts`: tolti `GRANT.verificaSmp`, `PERCORSI.verificaSmp` e la voce
  `REPORT_FINANZIARIO` "Verifica SMP". Il menu Finanziario resta di sette voci: Panoramica, Riepilogo per intervento,
  Dotazione e spesa, Avanzamento, Domande e importi, SIGC: domande e importi, Riserva di efficacia.
- `src/app/route-table.json`, `src/app/routes.tsx` e `route-manifest.json` (radice) senza `/finanziario/sigc/verifica-smp`.
  Nessun redirect (A-4).
- `src/app/aree.ts`, card Finanziario della Home: `contenuti` 'SIGC, riserva di efficacia e verifica SMP' diventa 'SIGC e
  riserva di efficacia'. La descrizione e `AnteprimaFinanziario` non cambiano (la card non legge TX-0015).
- Codice della pagina da togliere:
  - `src/pages/finanziario/sigc/verifica-smp/`;
  - `VerificaSmpReport`, l'export nel barrel, le parti di `lib/dto.ts`, `api/index.ts`, `ui/contratto.ts`,
    `ui/SelettoreAnno.tsx` (esercizio), `lib/grafici/sigc.ts`, mock, fixture e `entities/filtri/lib/programma.ts`;
  - il client orval rigenerato dalla spec nuova;
  - i test che la citano (`tests/finanziario-*.test.tsx`, `tests/app-aree.test.tsx`, `tests/anteprime-home.test.tsx`,
    `tests/msw-armed.test.ts`).

## Scelte di disegno da far decidere all'utente (con la mia raccomandazione)

**S-1. Collegamento dalla pagina SIGC del finanziario alla verifica SMP SIGC dell'istituzionale.**

- (a) Nessun collegamento fra ambiti. E' quello che ho fatto: sigc.html non ha link verso l'istituzionale e alla verifica
  si arriva dal menu Istituzionale.
- (b) Una riga sotto le due card di `/finanziario/sigc`: "La verifica SMP dei dati SIGC e' nell'area Istituzionale: Apri
  la verifica SMP SIGC", visibile solo con csr.tx-0015.read. Sarebbe un link `verifica-smp-sigc` con target_feature
  istituzionale, target `/istituzionale/verifica-smp-sigc` e query con i filtri correnti (intervento, os, og, op, azione;
  l'esercizio si sceglie all'arrivo). Il link resta bloccato da un open point finche' il flusso dell'istituzionale non e'
  approvato.
- (c) Un avviso di trasloco senza link per chi apre SIGC.

**Raccomando (a).** Con il catalogo rev. 4 la pagina SIGC la vedono P1, P2, il P3 finanziario, P4 e P5. Di questi solo
P1 e P2 hanno csr.tx-0015.read, e hanno gia' l'area Istituzionale nel menu: il link servirebbe solo a loro. Il verbale
sposta la pagina perche' e' un requisito istituzionale, e per lo stesso motivo supera G4. Un link fra feature lega
l'approvazione del sigc a quella dell'istituzionale. L'avviso (c) lo vedrebbero anche P3 finanziario, P4 e P5, che la
verifica non possono piu' aprire. L'app e' solo in prova interna, quindi non ci sono abitudini da accompagnare.

**S-2. Voce "Verifica SMP" nel menu dei wireframe dei quattro flussi invariati** (panoramica, riepilogo,
dotazione-avanzamento, domande).

- (a) Lasciarli byte per byte identici (carry-over). Il menu del low-fi e' la shell del 13/10, fa fede quello costruito
  allo step6, e OP-FE-10 lo dichiara.
- (b) Togliere la voce anche li': quattro flussi in piu' da riapprovare, senza cambi nelle pagine.

**Raccomando (a).** Il menu e' del layer `app/`, non della feature, ed e' gia' superato in quei wireframe (le altre aree
risultano "presto"). Riapprovare quattro flussi solo per la shell costa una revisione umana e non cambia nulla di quello
che lo step6 costruisce.
