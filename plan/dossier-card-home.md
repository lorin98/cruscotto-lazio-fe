# Dossier del gate per flusso: card della Home di fisico, procedurale e istituzionale (26/10/2026)

Richiesta dell'utente del 26/10/2026: rivedere le card della Home dei tre ambiti nuovi con la card dinamica del
finanziario, con dati coerenti con quelli dell'ambito. Scelte di disegno decise dall'utente prima dei wireframe (tutte le
raccomandazioni): fisico = i KPI della pagina Superfici; procedurale = barra degli interventi attivati; istituzionale =
solo la verifica SMP non SIGC; procedura = i tre ambiti insieme (step1 dei tre flussi, step2-8 insieme, step8 su tutte le
feature, review step9 per ambito).

La Home non e' una route di nessuna feature (resta in `src/app/home.tsx`, fuori dal manifest). Per la decisione G1 la card
e' contenuto della feature: il wireframe sta nel flusso d'ingresso dell'ambito (`home.html`), lo uiplan ha i campi con
provenance sulla route d'ingresso e un open point nuovo, lo step6 monta il componente in `src/app/aree.ts` come
`Anteprima`, come `AnteprimaFinanziario`. La card ha la forma di quella del finanziario: fascia colorata invariata, numeri
chiave animati nel corpo, una barra di avanzamento con la percentuale nel testo, "Entra in ..." nel piede.

Regole comuni alle tre card: ogni numero si legge solo col grant della sua transazione e senza filtri (stessa lettura e
stessa cache della pagina d'ingresso aperta senza filtri); senza grant la card elenca i contenuti dell'area, come oggi; un
errore non ferma la Home (una frase al posto dei numeri, nessun avviso della pagina); un'assenza dice il suo motivo, mai
uno 0 o una somma parziale; col perimetro ADA le etichette dicono "della tua area".

Controlli meccanici (plugin `marangi-lab/sian-green`, branch feat/green-fe-ui-v2): `wireframe-lint.sh` coi template v2
rc 0 sui tre flussi (axe: deferred-to-step8, bloccante nel gate 11/11); `uiplan-validate.sh` rc 0 sui tre uiplan;
`fe-project-check.sh --feature <f> --catalog` rc 0 sulle tre feature. Dossier presentato il 26/10/2026.

Ogni flusso si approva da solo sul suo hash: le pagine gia' approvate del flusso non cambiano, ma l'hash e' dell'intera
dir, quindi la riapprovazione copre anche loro (contenuto invariato).

## Flusso superfici (fisico)

- Da aprire nel browser:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\fisico\superfici\home.html`
  (doc del flusso: `superfici.md`, sezione "Card della Home")
- Cambiato: `home.html` nuovo; `superfici.md` (nota d'aggiornamento, sezione "Card della Home", OP-FIS-10). Invariato
  `superfici.html`.
- Lettura e grant: TX-0018 senza filtri, csr.tx-0018.read (p1-dirigente, p2-referente-adg, p3-funzionario-area-fis,
  p5-amministratore-funzionale).
- Numeri (campagna piu' recente della risposta, detta in testo): superficie ammissibile DS e DP (somme dei
  `campagne[anno]` fra gli interventi), barra delle domande con DP oltre la DS sulle domande di pagamento, domande di
  pagamento. Esempio sul DB locale: campagna 2026, DS 299.408,88 ha, DP 302.639,31 ha, 8,06 %, 14.558.
- Stati: caricamento, errore, nessuna superficie, nessuna domanda di pagamento (frase al posto della barra), senza grant.
- Open point: OP-FIS-10 (nuovo, questa card).
- Hash prima: `sha256:f803b5cf0cdee87bcce162b1d9d3d8a4a3eea8fcd7763ab25a2fb4bfa9dac6bd`
- **Hash da approvare**: `sha256:199cd655ea694dd53c53bc67bcf83fcb132e8da272304d8f195f3c67ddf66596`

## Flusso panoramica (procedurale)

- Da aprire nel browser:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\procedurale\panoramica\home.html`
  (doc del flusso: `panoramica.md`, sezione "Card della Home")
- Cambiato: `home.html` nuovo; `panoramica.md` (nota d'aggiornamento, sezione "Card della Home", OP-PR-10). Invariati
  `panoramica.html` e `intervento.html`.
- Letture e grant: TX-0026 (csr.tx-0026.read) e TX-0027 (csr.tx-0027.read) senza filtri; li hanno p1-dirigente,
  p2-referente-adg, p3-funzionario-area-pro, p4-responsabile-procedimento-ada (perimetro ADA).
- Numeri: domande ammesse e contributo ammesso (TX-0026), barra degli interventi attivati sul perimetro ufficiale ("n su
  m" e percentuale), domande di sostegno (totale di TX-0027, non rilasciate comprese). Esempio sul DB locale: 343,
  107,9 M euro, 10 su 36 (27,8 %), 3.295.
- Stati: caricamento e errore per lettura (l'altra resta), contributo senza fonte, perimetro ADA, nessun intervento nel
  perimetro ufficiale (testo senza barra), senza grant, un solo grant.
- Open point: OP-PR-10 (nuovo, questa card).
- Hash prima: `sha256:b3871a3065288a5dc88fc789794281d7f23b827cc4907c52d0030c0a2b529d3e`
- **Hash da approvare**: `sha256:de56d106e8a0855a0d570ee07ed4f22fa7e6e4281ede1f94c01bf6bafc9770b5`

## Flusso verifica-smp-non-sigc (istituzionale)

- Da aprire nel browser:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\verifica-smp-non-sigc\home.html`
  (doc del flusso: `verifica-smp-non-sigc.md`, sezione "Card della Home")
- Cambiato: `home.html` nuovo; `verifica-smp-non-sigc.md` (nota d'aggiornamento, sezione "Card della Home", OP-IS-11).
  Invariato `verifica-smp-non-sigc.html`: la pagina resta senza KPI.
- Lettura e grant: TX-0016 senza filtri e senza anno, csr.tx-0016.read (p1-dirigente, p2-referente-adg,
  p3-funzionario-area-ist). Nessuna lettura di TX-0017 (l'output non si somma, OP-IS-06).
- Numeri (anno di riferimento della risposta, detto in testo): domande finanziate, spesa pubblica erogata, barra della
  spesa sul valore delle domande finanziate, domande ricevute; somme delle colonne fra gli interventi (ogni domanda e' di
  un solo intervento, D-02 Rev. 2). Esempio sul DB locale: anno 2025, 500, 4,7 M euro, 2,57 %, 3.150.
- Stati: caricamento, errore, nessun file SMP non SIGC (numeri presenti), dato motivato assente in una riga (totale non
  disponibile col motivo, niente quota), perimetro ADA, senza grant.
- Open point: OP-IS-11 (nuovo, questa card).
- Hash prima: `sha256:4a53048a290b2708318e4d74613ba4e82eb9b7bc02484ddafb2d4e2c4af91909`
- **Hash da approvare**: `sha256:bb59cdbaaf09749c1f4e96551c6094b56af2aa652fbcfd02bbd65929189310c9`

## Dopo l'approvazione

Step2 (nessuna spec nuova: client orval invariato), step3 (letture gia' esistenti, nessun wrapper nuovo previsto), step4
(conti puri delle tre card con test L1), step5 (tre componenti `Anteprima<Area>` che riusano i pezzi della card del
finanziario, portati nel kit), step6 (`aree.ts` e barrel), step7, step8 11/11 su tutte e cinque le feature (codice comune
toccato), review step9 FULL sul delta per ambito.
