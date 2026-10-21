# Dossier del gate wireframe - feature istituzionale (green-fe step1-uiplan)

Preparato il 21/10/2026 (13:15 UTC) per il gate umano per flusso. **Nessuna approvazione registrata** (ne' nello stato ne'
nello uiplan): si approva flusso per flusso, sull'hash qui sotto; ogni modifica a un file della dir del flusso cambia
l'hash e richiede di ripresentarlo.

## Stato

- **step0 completato**: handover della slice `istituzionale` raccolto dal backend (spec, manifest, scenari),
  `fe-handover-check.sh` rc 0 (spec sha256:061d52ef... = manifest.openapi.hash, gate del backend superati, pack 1.3.0),
  authz-catalog identico a quello del backend (sha256:fa3d4c0b...), style-guide invariata (sha256:56d70fc3...).
  Stato `.claude/state/green-fe-istituzionale.state.json` creato, gate meccanico `handover_verified` =
  sha256:92ed9e901874b602ab18195eeb65403f1aa8502f2de5131e4355e7dea2a7b2ef su `plan/istituzionale/handover.json`, step corrente 1.
- **step1 al gate umano**: `plan/istituzionale/uiplan.json` (3 route, 78 campi tutti con provenance `spec`, 3 flussi,
  9 open point). Controlli meccanici: `uiplan-validate.sh` rc 0, `fe-project-check.sh --feature istituzionale` rc 0
  (nessuna collisione di path o di dir con finanziario, elenco-operativo, fisico, procedurale; link verso l'elenco
  raggiungibili), `wireframe-lint.sh` rc 0 sui tre flussi. **axe: deferred-to-step8** (il lint di step1 non ha un DOM;
  axe vero e' bloccante nel gate 11/11).

## Transazioni coperte

| transazione | requisito | route | flusso |
|---|---|---|---|
| TX-0016 - dati di verifica SMP per APR (non SIGC) | RF016 (RU-00000016) | /istituzionale/verifica-smp-non-sigc, /istituzionale/interventi/:codice | verifica-smp-non-sigc, intervento |
| TX-0017 - output regionale realizzato e programmato | RF017 (RU-00000017) | /istituzionale/output-regionale, /istituzionale/interventi/:codice | output-regionale, intervento |

Copertura 2 su 2. Visibilita' dal catalogo: p1-dirigente, p2-referente-adg e p3-funzionario-area-ist hanno
csr.tx-0016.read e csr.tx-0017.read; p3 delle altre aree, p4, p5, p6 e p7 no (SC-IS_DENY: 403). Perimetro sempre
regionale (nessuno scope ADA).

## Card dell'ambito in src/app/aree.ts e transazioni della slice (da far decidere, non risolto qui: OP-IS-05)

| voce della card | dove si rende | nota |
|---|---|---|
| Istituzionale: "Dati ASR SIGC e non SIGC da confrontare con SMP" | non SIGC qui (TX-0016); **SIGC nel finanziario** (TX-0015, /finanziario/sigc/verifica-smp) | RF015 e' dell'area "I - Istituzionale" nel pack, ma la slice e la feature sono finanziario; la card del Finanziario dice gia' "SIGC, riserva di efficacia e verifica SMP" |
| Istituzionale: "Avvisi attivati e chiusi, concessioni previste" | qui (TX-0016) | coperto (D-01 Rev. 2 del backend: valori dal file, motivi NON_VALORIZZATO e ANNO_NON_CONSERVATO) |
| Istituzionale: "Output regionale per intervento" | qui (TX-0017) | **la card del Fisico** dichiara "Output programmato e realizzato dal 2023 al 2029" (e "Pagamenti per Unit Amount"): e' RF017, area "F2 - Fisico" nel pack, ma TX-0017 e' nella slice istituzionale; la slice fisico ha TX-0018 e TX-0020 |

## Collegamento fra la verifica SMP SIGC (finanziario) e la non SIGC (qui): conviene? (OP-IS-04)

Si', per l'utente che fa la verifica APR conviene: RF015 e RF016 sono lo stesso adempimento su due ambiti e la card li
elenca insieme. Vincoli: il link servirebbe solo a **p1 e p2** (csr.tx-0015.read e csr.tx-0016.read insieme; p3-ist non
ha TX-0015, p3-fin, p4 e p5 non hanno TX-0016) e va nascosto agli altri; i parametri non si traducono (esercizio
finanziario obbligatorio per TX-0015, anno di riferimento del file facoltativo per TX-0016); la route del finanziario non
dichiara url_params, quindi il link porterebbe query vuota. Opzioni:

- **A** - link solo da qui verso il finanziario, visibile con csr.tx-0015.read, senza filtri: costa una riga nello uiplan
  e una frase nel wireframe (riapprovazione del solo flusso verifica-smp-non-sigc).
- **B** - link nei due sensi: in piu' serve un refresh della feature finanziario (link sulla route verifica-smp e, se si
  vogliono portare i filtri, i suoi url_params) e la **riapprovazione del flusso sigc**.
- **C** - nessun link: una frase che dice dove sono i dati SIGC (il menu ha gia' le due voci).

Nel wireframe c'e' solo una nota (`wf-note`) dove andrebbe la frase: nessun link dichiarato finche' non scegli.

## Punti aperti nuovi (in uiplan.json)

| id | tipo | verso | in breve |
|---|---|---|---|
| OP-IS-01 | campo-assente-dalla-spec | green-be | voci dei filtri (interventi, OS, OG, OP, azioni) e descrizione dell'intervento assenti dalla spec istituzionale; p3-ist non ha TX-0001. Ripiego proposto: chip dall'indirizzo, voci di Intervento dalle righe della risposta, ricerca nella tabella |
| OP-IS-02 | campo-assente-dalla-spec | green-be | ultimo dato sincronizzato (NFR-25 b) assente: la barra mostra l'anno di riferimento del file e il periodo |
| OP-IS-03 | altro | green-be / utente | nessuna esportazione CSV/XLSX (il finanziario le ha per ogni report, TX-0015 compresa): proposto il solo PNG nel frattempo (limite di OP-FE-08) |
| OP-IS-04 | altro | utente | collegamento con la verifica SMP SIGC del finanziario (sopra) |
| OP-IS-05 | altro | utente (step6) | testi delle card Istituzionale e Fisico in aree.ts (sopra) |
| OP-IS-06 | altro | utente / green-be | nessun grafico fra interventi per l'output (unita' diverse); per averlo servirebbe una quota del target calcolata dal backend |
| OP-IS-07 | altro | green-spec / green-be | marcatore "da consolidare" di NFR-25 (d) assente; definizioni da confermare (D-02 saldate, D-03 programmato, D-04 cumulativo) rese come note fisse |
| OP-IS-08 | altro | utente (step4-lib) | testi dei motivi nuovi ANNO_NON_CONSERVATO e FONTE_AMBIGUA nel kit |
| OP-IS-09 | altro | utente / green-be | link verso l'elenco giusti per definizione ma senza scenario di coincidenza del backend |

## Decisioni da prendere al gate (al piu' 8)

1. **OP-IS-04**: collegamento con la verifica SMP SIGC del finanziario: A, B o C.
2. **OP-IS-09**: tenere i quattro link verso l'elenco (domande ricevute -> `tipo=SOSTEGNO`, spesa erogata ->
   `esito=PAGATA&sigc=false`) o bloccarli finche' green-be non estende SC-EO_DRILLDOWN.
3. **OP-IS-01**: va bene il ripiego del pannello (solo Intervento, dalle righe) in attesa del campo additivo di green-be?
4. **OP-IS-03**: PNG del grafico nel frattempo (non registrato in audit) oppure nessuno scaricamento fino agli endpoint CSV/XLSX.
5. **OP-IS-08**: testi "non disponibile per l'anno scelto - l'avviso porta i dati del file piu' recente" e
   "non attribuibile - riga presente sia nel monitoraggio SIGC sia nel non SIGC".
6. **Output regionale** (OP-IS-06): tabella con interruttore della misura e mini grafico nel drawer, senza grafico in
   pagina; oppure tutte le misure in colonne raggruppate per anno.
7. **Dettaglio dell'intervento** come terzo flusso (`/istituzionale/interventi/:codice`, schede output, verifica, importi
   unitari): approvarlo o toglierlo (allora il clic su barre e righe non porterebbe a nessuna pagina).
8. **OP-IS-05**: testi delle card Istituzionale e Fisico (si decidono qui, si applicano allo step6).

## Flusso 1 - verifica-smp-non-sigc

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\verifica-smp-non-sigc\verifica-smp-non-sigc.html`
  (doc del flusso: `...\verifica-smp-non-sigc\verifica-smp-non-sigc.md`)
- **Hash del wireframe**: `sha256:d6b1435e002c15c65100756254339a8bb65147dc0a5cc8667c4404605af25397`
- **Route e pattern**: `/istituzionale/verifica-smp-non-sigc`, kind `report`, pattern report v2 come
  `/finanziario/sigc/verifica-smp` (selettore d'anno con Mostra, una card a barre con Grafico | Tabella | Scarica e vista
  iniziale a grafico, tabella dei dati con cerca, colonne e ordinamento; nessun KPI, come nel finanziario).
- **Grant (verbatim)**: `csr.tx-0016.read`.
- **Campi (provenance spec, `openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc`)**: annoRiferimento,
  perimetro, outputCumulativo; righe[]: codiceIntervento, avvisiAttivati, avvisiChiusi, azioniAttivate, dotazioneAvvisi,
  chiusuraUltimoAvvisoAperto, domandeRicevute, domandeRicevuteSenzaRichiesto, valoreDomandeRicevute, domandeFinanziate,
  valoreDomandeFinanziate, domandeSaldate, anticipiErogati, spesaErogata, concessioniPreviste, includeTopUp, importoTopUp,
  outputAttesoFinanziate, outputErogato, indicatoreOutput, indicatoreRisultato (21 colonne: tabella nel .md del flusso).
- **Resa delle assenze come nel finanziario**: avvisi attivati e chiusi, azioni attivate (conteggi col motivo), concessioni
  previste e top-up incluso (si'/no col motivo, colonne di testo), importo top-up e dotazione (importi col motivo): il
  valore oppure badge col motivo, mai uno 0 o un "no" inventati. Nel wireframe: SRA01 (dati di programma non valorizzati,
  0 domande non SIGC vere), SRD04 (anno non conservato), SRA16 (output non attribuibile).
- **url_params**: anno (TX-0016.anno), intervento, os, og, op, azione (TX-0016.*, multipli).
- **Link**: `dettaglio-intervento-smp` (barra o riga -> /istituzionale/interventi/:codice, query anno);
  `elenco-ricevute-riga` (elenco-operativo /elenco-operativo/domande, tipo, intervento); `elenco-spesa-riga`
  (elenco-operativo /elenco-operativo/pagamenti, esito, sigc, intervento).
- **Note WCAG** (residuo dichiarato): tabella equivalente del grafico a un clic; assenze sempre testuali; righe apribili con
  Invio; selettore con aiuto collegato. Residuo umano: ordine di lettura, note sulle definizioni, bersagli dei link nelle
  celle (24 px), testi lunghi delle assenze nelle celle, contrasto della resa finale. axe rinviato allo step8.
- **Open point**: OP-IS-01, 02, 03, 04, 07, 08, 09.

## Flusso 2 - output-regionale

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\output-regionale\output-regionale.html`
  (doc del flusso: `...\output-regionale\output-regionale.md`)
- **Hash del wireframe**: `sha256:66836187fc276635554ea275b3d87ddceeaa0ce1bfe34de9a2cd0339f4b2090a`
- **Route e pattern**: `/istituzionale/output-regionale`, kind `report`, pattern report tabellare v2 (`lista-filtri`:
  barra a chip, pannello, tabella interattiva con interruttore Programmato | Realizzato SIGC | Realizzato non SIGC
  (cumulativo), drawer di anteprima col mini grafico per anno). Nessuna card grafico in pagina (OP-IS-06).
- **Grant (verbatim)**: `csr.tx-0017.read`.
- **Campi (provenance spec, `openapi-istituzionale.json#/components/schemas/MonitoraggioOutput`)**: annoInizio, annoFine,
  perimetro, realizzatoNonSigcCumulativo; righe[]: codiceIntervento, indicatoreOutput, unitaMisura, targetFinePeriodo,
  annoTarget; righe[].anni[]: anno, programmato, realizzatoSigc, realizzatoNonSigc. Colonne degli anni dalla risposta
  (2023-2029 di default, fino al 2030 se configurato).
- **url_params**: intervento, os, og, op, azione (TX-0017.*, multipli). La misura dell'interruttore non e' nella spec:
  stato della pagina.
- **Link**: `dettaglio-intervento-output` ("Apri il dettaglio" nel drawer -> /istituzionale/interventi/:codice).
- **Note WCAG** (residuo dichiarato): interruttore con aria-pressed e didascalia che dice la misura; drawer con focus-trap;
  unita' sempre accanto ai valori. Residuo umano: tabella larga a 320 px (WCAG 1.4.10), ordine di lettura, contrasto.
  axe rinviato allo step8.
- **Open point**: OP-IS-01, 02, 03, 05, 06, 07, 08.

## Flusso 3 - intervento

- **Da aprire nel browser**:
  `C:\Users\lorin\Desktop\Lorenzo\sian-ng\progetti\arsial\arsial-cruscotto\cruscotto-lazio-fe\wireframes\istituzionale\intervento\intervento.html`
  (doc del flusso: `...\intervento\intervento.md`)
- **Hash del wireframe**: `sha256:550a15bcadc0384ef29f73f0e27adca2c39e348182b6b7f038e23d85a144f7c4`
- **Route e pattern**: `/istituzionale/interventi/:codice`, kind `dettaglio`, pattern dettaglio v2 (testata, KPI x4,
  schede "Output per anno" con barre raggruppate e target come riferimento, "Verifica SMP non SIGC" con selettore
  d'anno e le 21 voci, "Importi unitari"). Compone TX-0016 e TX-0017 filtrate sull'intervento, nessuna transazione nuova.
- **Grant (verbatim)**: `csr.tx-0016.read`, `csr.tx-0017.read` (ogni scheda col grant della sua transazione).
- **Campi (provenance spec)**: tutti quelli dei due flussi precedenti, piu' righe[].importiUnitari[]: codiceUnitAmount,
  gruppoColturale, esercizio, importoUnitario (MonitoraggioOutput). KPI: targetFinePeriodo (con annoTarget e unitaMisura),
  domandeRicevute, domandeFinanziate, spesaErogata; nessuna quota calcolata.
- **url_params**: anno (TX-0016.anno).
- **Link**: `verifica-smp-intervento` (-> /istituzionale/verifica-smp-non-sigc, intervento, anno);
  `output-regionale-intervento` (-> /istituzionale/output-regionale, intervento); `elenco-ricevute-intervento` e
  `elenco-spesa-intervento` (elenco-operativo, come nel flusso 1).
- **Note WCAG** (residuo dichiarato): tablist con frecce; grafico con tabella equivalente e target anche come riga di testo;
  voci come tabella con intestazione di riga. Residuo umano: ordine di lettura di testata, KPI e schede; etichette lunghe;
  contrasto. axe rinviato allo step8.
- **Open point**: OP-IS-01, 03, 06, 07, 08, 09.

## Dopo il gate

Per ogni flusso approvato lo stato riceve `steps["step1-uiplan"].gates["wireframe_<flusso>"]` con l'hash qui sopra e lo
uiplan la `flows[].approval` corrispondente (lo fa la sessione che raccoglie la tua decisione, via `state-set.sh`); il
primo flusso approvato chiude lo step1 e sblocca lo step2. Un rework rigenera, rilinta e ripresenta col nuovo hash
(budget di rework: 2).
