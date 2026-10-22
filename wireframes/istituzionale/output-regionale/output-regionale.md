# Flusso output-regionale - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/output-regionale/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Rework del 22/10/2026 sui contratti del giro G3 (spec sha256:b0c069cf...): ultimo dato sincronizzato, export CSV e XLSX,
valori dei filtri da TX-0060 (decisione G2).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/output-regionale | report | report tabellare v2 (lista-filtri: barra a chip, pannello, tabella interattiva, drawer) | csr.tx-0017.read |

Letture della pagina: TX-0017 (report), il suo export `GET /api/istituzionale/output-regionale/{formato}` (csv, xlsx;
stesso grant, senza operationId, con X-Requested-With) e TX-0060 dell'elenco operativo per le voci del pannello
(csr.tx-0060.read: lo hanno p1, p2 e p3-funzionario-area-ist, cioe' tutti i profili con csr.tx-0017.read; decisione G2).
Come nel fisico, TX-0060 (RA006) e' fra le transazioni della route e la slice elenco-operativo e' pinnata nell'handover;
la visibilita' della route resta il solo csr.tx-0017.read e la lettura dei valori e' un'azione col controllo di
csr.tx-0060.read (step6).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/output-regionale: Shell > Barra filtri (chip, perimetro regionale, periodo annoInizio-annoFine, "Dati
  al") > Breadcrumb > Titolo > Pannello filtri (valori da TX-0060) > Card tabella "Output per intervento e anno"
  (interruttore della misura: Programmato | Realizzato SIGC | Realizzato non SIGC cumulativo; cerca, colonne,
  ordinamento; CSV, XLSX) con la nota sulle definizioni > Drawer di anteprima della riga (indicatore, unita', target, mini
  grafico per anno, Apri il dettaglio) > Stati

Perche' tabellare e senza card grafico in pagina (OP-IS-06): ogni intervento ha il suo indicatore e la sua unita' di
misura, quindi le quantita' di interventi diversi non stanno in un grafico comune. Il grafico per anno (una sola unita')
e' nel drawer e nel dettaglio dell'intervento (flusso intervento). Nessun totale e nessun KPI: sommare output di
interventi diversi non ha senso.

Perche' l'interruttore della misura: con sette anni (fino a otto se il periodo e' configurato al 2030) e tre misure la
tabella avrebbe 21-24 colonne di anni; l'interruttore mostra una misura alla volta (12 colonne) e la didascalia dice quale.
Il confronto programmato-realizzato dello stesso intervento e' nel mini grafico del drawer e nel dettaglio.
Alternativa da valutare al gate: tutte le misure in colonne raggruppate per anno, con la scelta delle colonne.

## Barra dei filtri, "Dati al" e pannello

- "Dati al gg/mm/aaaa": `ultimiDatiSincronizzati[]` (flusso, conclusoIl) della risposta di TX-0017, provenance spec
  (`openapi-istituzionale.json#/components/schemas/MonitoraggioOutput`), stessa pill del finanziario (`PillDatiAl`): la
  conclusione meno recente e nel popover una voce per flusso; elenco vuoto = "nessuna acquisizione conclusa".
- Periodo: annoInizio-annoFine della risposta; perimetro regionale fisso.
- Pannello: stesse voci e stesse regole della verifica SMP non SIGC, da TX-0060 (provenance spec:
  `openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco`): interventi[].chiave e descrizione (senza AT001)
  per `intervento`, obiettiviSpecifici[].chiave per `os`, obiettiviGenerali[] per `og`, obiettiviPolicy[] per `op`,
  azioniPortanti[].chiave e descrizione per `azione` (gruppo non disponibile con legameAzioniDisponibile = falso). Se
  TX-0060 non risponde, i filtri dell'indirizzo restano chip rimovibili e il report si legge lo stesso.

## Colonne della tabella (provenance spec: openapi-istituzionale.json#/components/schemas/MonitoraggioOutput)

| colonna | campo | resa |
|---|---|---|
| Intervento | righe[].codiceIntervento | intestazione di riga, fissa |
| Indicatore di output | righe[].indicatoreOutput | testo; null = non valorizzato |
| Unita' di misura | righe[].unitaMisura | testo; null = non valorizzato |
| Target di fine periodo | righe[].targetFinePeriodo | quantita' col motivo |
| Anno del target | righe[].annoTarget | anno; null = nessun target |
| un anno per colonna (annoInizio..annoFine) | righe[].anni[].anno + righe[].anni[].programmato / realizzatoSigc / realizzatoNonSigc | quantita' col motivo, secondo l'interruttore |

Testa della risposta: annoInizio e annoFine (barra filtri e colonne), perimetro (sempre REGIONALE),
realizzatoNonSigcCumulativo (dichiarato nell'etichetta "Realizzato non SIGC (cumulativo)" e nella nota),
ultimiDatiSincronizzati (pill "Dati al"). Gli importi unitari per Unit Amount (righe[].importiUnitari[]) sono nel
dettaglio dell'intervento (e nei file CSV e XLSX).

Resa delle assenze nelle celle: badge col testo e nota piccola accanto (kit `AssenzaMotivata`): NON_VALORIZZATO "non
valorizzato - il dato non e' presente nella fonte" (per esempio il programmato degli interventi senza Unit Amount, D-03);
FONTE_AMBIGUA "non attribuibile - riga presente sia nel monitoraggio SIGC sia nel non SIGC" (testo proposto in
OP-IS-08; esempio SRA16 nel 2027 nelle viste del realizzato).

## Scaricamenti (un pulsante per formato, come nel finanziario)

| dove | formati | contenuto |
|---|---|---|
| card della tabella | CSV, XLSX | `GET /api/istituzionale/output-regionale/{formato}` con gli stessi filtri: per ogni intervento una riga "Output dell'anno" per anno del periodo (programmato, realizzato SIGC, realizzato non SIGC, target e unita') e una riga "Importo unitario" per Unit Amount; intestazione con periodo, filtri, perimetro, ultimo dato sincronizzato per flusso, uso interno; una riga di AUDIT_ESPORTAZIONE per file (SC-IS_ESPORTA) |

Nessun PNG in pagina: la pagina non ha grafici (OP-IS-06); il mini grafico del drawer e' un'anteprima senza
scaricamento (il grafico per anno con il PNG e' nel dettaglio dell'intervento). I file contengono tutti gli interventi dei
filtri e tutte e tre le misure, qualunque sia la misura mostrata o la ricerca (la nota lo dice sotto gli strumenti).
Pulsanti nascosti se la risposta non ha righe. Errori col motivo in role=alert: 400 oltre 5.000 righe o 50.000 celle,
503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA o TEMPO_SCADUTO (riprovare dopo Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/output-regionale (drawer) | Output per anno dell'intervento | mini barre raggruppate per anno (programmato, realizzato SIGC, realizzato non SIGC) con il target come riferimento | TX-0017 (righe[].anni[], righe[].targetFinePeriodo) | nessuno (il drawer ha "Apri il dettaglio": link:dettaglio-intervento-output) | omessi e dichiarati, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/output-regionale | dettaglio-intervento-output | "Apri il dettaglio" nel drawer della riga | istituzionale: /istituzionale/interventi/:codice | codice | - |

Nessun link verso l'elenco operativo: l'output non e' un insieme di domande.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/output-regionale | intervento | TX-0017.intervento | si' | no |
| /istituzionale/output-regionale | os | TX-0017.os | si' | no |
| /istituzionale/output-regionale | og | TX-0017.og | si' | no |
| /istituzionale/output-regionale | op | TX-0017.op | si' | no |
| /istituzionale/output-regionale | azione | TX-0017.azione | si' | no |

La misura dell'interruttore non e' un parametro della spec: resta nello stato della pagina, non negli url_params. Gli
stessi parametri vanno all'export `{formato}`. Le voci del pannello: TX-0060 (decisione G2).

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro della tabella, `role="status"` + `aria-live="polite"`
- valori dei filtri non disponibili (TX-0060 in errore): `role="status"`, chip dell'indirizzo invariati, Riprova
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO col nome del
  filtro; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA ritentata rispettando Retry-After; 503 TEMPO_SCADUTO; 401/419 sessione)
- file non scaricato: `role="alert"` col motivo; riuscito: "File XLSX scaricato." in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e drawer, tabella
  equivalente del mini grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- Pulsanti CSV e XLSX: sigla visibile contenuta nel nome accessibile completo (WCAG 2.5.3); durante la preparazione
  aria-disabled col focus sul pulsante attivato (WCAG 2.4.3); esito in role=status, errore in role=alert. Pill "Dati al"
  come bottone col nome accessibile completo e popover per flusso.
- RESIDUO umano da verificare qui: ordine di lettura, didascalia della tabella che cambia con la misura, etichette
  comprensibili, contrasto della resa finale (il low-fi non fa fede sul colore).
- RESIDUO umano: tabella larga con scorrimento orizzontale a 320 px (WCAG 1.4.10, reflow), unita' di misura sempre
  leggibile accanto ai valori, testi delle assenze nelle celle degli anni.

## Punti aperti che toccano questo flusso

- OP-IS-06: nessun grafico fra interventi (unita' diverse).
- OP-IS-07: definizioni da confermare (D-03 programmato, D-04 realizzato non SIGC cumulativo).
- OP-IS-08: testo del motivo FONTE_AMBIGUA.
- Chiusi il 22/10/2026: OP-IS-01 (G2, valori da TX-0060), OP-IS-02 (G3, ultimiDatiSincronizzati), OP-IS-03 (G3, export
  CSV e XLSX), OP-IS-05 (G1: la card Istituzionale della Home dice verifica SMP non SIGC e output regionale programmato e
  realizzato, la card del Fisico non lo elenca piu'; la applica lo step6 in src/app/aree.ts).
