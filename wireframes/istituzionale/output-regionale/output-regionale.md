# Flusso output-regionale - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/output-regionale/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/output-regionale | report | report tabellare v2 (lista-filtri: barra a chip, pannello, tabella interattiva, drawer) | csr.tx-0017.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/output-regionale: Shell > Barra filtri (chip, perimetro regionale, periodo annoInizio-annoFine) >
  Breadcrumb > Titolo > Pannello filtri > Card tabella "Output per intervento e anno" (interruttore della misura:
  Programmato | Realizzato SIGC | Realizzato non SIGC cumulativo; cerca, colonne, ordinamento) con la nota sulle
  definizioni > Drawer di anteprima della riga (indicatore, unita', target, mini grafico per anno, Apri il dettaglio) > Stati

Perche' tabellare e senza card grafico in pagina (OP-IS-06): ogni intervento ha il suo indicatore e la sua unita' di
misura, quindi le quantita' di interventi diversi non stanno in un grafico comune. Il grafico per anno (una sola unita')
e' nel drawer e nel dettaglio dell'intervento (flusso intervento). Nessun totale e nessun KPI: sommare output di
interventi diversi non ha senso.

Perche' l'interruttore della misura: con sette anni (fino a otto se il periodo e' configurato al 2030) e tre misure la
tabella avrebbe 21-24 colonne di anni; l'interruttore mostra una misura alla volta (12 colonne) e la didascalia dice quale.
Il confronto programmato-realizzato dello stesso intervento e' nel mini grafico del drawer e nel dettaglio.
Alternativa da valutare al gate: tutte le misure in colonne raggruppate per anno, con la scelta delle colonne.

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
realizzatoNonSigcCumulativo (dichiarato nell'etichetta "Realizzato non SIGC (cumulativo)" e nella nota). Gli importi
unitari per Unit Amount (righe[].importiUnitari[]) sono nel dettaglio dell'intervento.

Resa delle assenze nelle celle: badge col testo e nota piccola accanto (kit `AssenzaMotivata`): NON_VALORIZZATO "non
valorizzato - il dato non e' presente nella fonte" (per esempio il programmato degli interventi senza Unit Amount, D-03);
FONTE_AMBIGUA "non attribuibile - riga presente sia nel monitoraggio SIGC sia nel non SIGC" (testo proposto in
OP-IS-08; esempio SRA16 nel 2027 nelle viste del realizzato).

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

La misura dell'interruttore non e' un parametro della spec: resta nello stato della pagina, non negli url_params.
Le voci del pannello: OP-IS-01.

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro della tabella, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO col nome del
  filtro; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA ritentata rispettando Retry-After; 503 TEMPO_SCADUTO; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap di pannello e drawer, tabella
  equivalente del mini grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- RESIDUO umano da verificare qui: ordine di lettura, didascalia della tabella che cambia con la misura, etichette
  comprensibili, contrasto della resa finale (il low-fi non fa fede sul colore).
- RESIDUO umano: tabella larga con scorrimento orizzontale a 320 px (WCAG 1.4.10, reflow), unita' di misura sempre
  leggibile accanto ai valori, testi delle assenze nelle celle degli anni.

## Punti aperti che toccano questo flusso

- OP-IS-01: voci dei filtri assenti dalla spec istituzionale.
- OP-IS-02: ultimo dato sincronizzato assente (la barra mostra il periodo).
- OP-IS-03: nessuna esportazione CSV/XLSX nella spec.
- OP-IS-05: la card del Fisico in aree.ts dichiara l'output programmato e realizzato, reso qui (RF017 e' dell'area F2 nel pack).
- OP-IS-06: nessun grafico fra interventi (unita' diverse).
- OP-IS-07: definizioni da confermare (D-03 programmato, D-04 realizzato non SIGC cumulativo).
- OP-IS-08: testo del motivo FONTE_AMBIGUA.
