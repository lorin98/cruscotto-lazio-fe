# Flusso intervento - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/intervento/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/interventi/:codice | dettaglio | dettaglio v2 (testata, KPI, schede con grafico e tabelle) | csr.tx-0016.read, csr.tx-0017.read |

Perche' una route di dettaglio (uiplan-patterns 6): i due report dell'area hanno righe dello stesso oggetto, l'intervento;
il dettaglio compone gli stessi report filtrati su `intervento = :codice`, senza transazioni nuove. E' anche l'unico posto
dove l'output per anno di TX-0017 si puo' disegnare (una sola unita' di misura, OP-IS-06). Il percorso
`/istituzionale/interventi/:codice` e' distinto da `/finanziario/interventi/:codice` (dettaglio finanziario, altri grant):
p3-funzionario-area-ist non ha i grant del dettaglio finanziario.

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/interventi/:codice: Shell > Breadcrumb > Testata (codice, perimetro regionale, indicatori; pulsanti
  verso i due report filtrati) > KPI x4 (target di fine periodo; domande ricevute, finanziate e spesa erogata non SIGC) >
  Schede: "Output per anno" (card barre raggruppate + tabella equivalente), "Verifica SMP non SIGC" (selettore dell'anno
  di riferimento + voci dei 21 dati), "Importi unitari" (tabella delle Unit Amount) > Stati

Nessuna barra filtri: il dettaglio e' gia' filtrato sull'intervento; l'anno di riferimento sta nella scheda della
verifica (url_param anno). La scheda attiva non e' un parametro della spec: resta nello stato della pagina.

## Campi (provenance spec)

- TX-0017 (openapi-istituzionale.json#/components/schemas/MonitoraggioOutput): annoInizio, annoFine, perimetro,
  realizzatoNonSigcCumulativo, righe[].codiceIntervento, indicatoreOutput, unitaMisura, targetFinePeriodo, annoTarget,
  anni[].anno, anni[].programmato, anni[].realizzatoSigc, anni[].realizzatoNonSigc, importiUnitari[].codiceUnitAmount,
  importiUnitari[].gruppoColturale, importiUnitari[].esercizio, importiUnitari[].importoUnitario.
- TX-0016 (openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc): annoRiferimento, perimetro,
  outputCumulativo e i 21 campi della riga (gli stessi della tabella del flusso verifica-smp-non-sigc).
- KPI: targetFinePeriodo con annoTarget e unitaMisura (TX-0017); domandeRicevute, domandeFinanziate, spesaErogata
  (TX-0016). Nessuna quota calcolata.

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/interventi/:codice | Output programmato e realizzato per anno | barre raggruppate per anno (programmato, realizzato SIGC, realizzato non SIGC cumulativo) con il target di fine periodo come linea di riferimento | TX-0017 (righe[].anni[], targetFinePeriodo) | nessuno | anni senza valore omessi e dichiarati sotto il grafico col motivo (non valorizzato, non attribuibile), mai a zero |

Il realizzato non SIGC e' cumulativo per anno di riferimento, quello SIGC annuale (D-04): le barre non si sommano e la
didascalia lo dice.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/interventi/:codice | verifica-smp-intervento | pulsante della testata | istituzionale: /istituzionale/verifica-smp-non-sigc | - | intervento = :codice, anno (se scelto) |
| /istituzionale/interventi/:codice | output-regionale-intervento | pulsante della testata | istituzionale: /istituzionale/output-regionale | - | intervento = :codice |
| /istituzionale/interventi/:codice | elenco-ricevute-intervento | "Apri nell'elenco" sulla voce Domande ricevute | elenco-operativo: /elenco-operativo/domande | - | tipo=SOSTEGNO, intervento = :codice |
| /istituzionale/interventi/:codice | elenco-spesa-intervento | "Apri nei pagamenti" sulla voce Spesa erogata | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, sigc=false, intervento = :codice |

Arrivi nel dettaglio: link:dettaglio-intervento-smp (flusso verifica-smp-non-sigc) e link:dettaglio-intervento-output
(flusso output-regionale). I link verso l'elenco: OP-IS-09. Nessun link al dettaglio finanziario dell'intervento
(/finanziario/interventi/:codice): servirebbe solo a p1 e p2; se l'utente lo vuole e' da aggiungere come OP-IS-04.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/interventi/:codice | anno | TX-0016.anno | no | no |

## Stati resi (obbligatori)

- vuoto: intervento senza righe nei due report (per esempio AT001, che i report escludono) con "Torna all'output
  regionale"; scheda Importi unitari vuota per un intervento senza Unit Amount, dichiarata
- caricamento: scheletro della testata e delle card, `role="status"` + `aria-live="polite"`; le schede leggono solo
  quando si aprono
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO per un codice
  non valido; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA o TEMPO_SCADUTO con Riprova; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, tablist con frecce, tabella
  equivalente del grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- RESIDUO umano da verificare qui: ordine di lettura di testata, KPI e schede; didascalia del grafico (cumulato e
  annuale distinti); etichette lunghe delle voci della verifica; contrasto della resa finale (il low-fi non fa fede sul colore).
- RESIDUO umano: la linea del target deve avere anche una forma testuale (riga "Target di fine periodo" della tabella
  equivalente), non solo il colore; bersagli dei link nelle voci (minimo 24 px).

## Punti aperti che toccano questo flusso

- OP-IS-01: descrizione dell'intervento assente dalla spec istituzionale (la testata mostra il codice).
- OP-IS-03: nessuna esportazione CSV/XLSX; solo PNG del grafico.
- OP-IS-06: il grafico per anno sta qui perche' fra interventi le unita' sono diverse.
- OP-IS-07: definizioni da confermare (D-02, D-03, D-04).
- OP-IS-08: testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA.
- OP-IS-09: link verso l'elenco senza scenario di coincidenza.
