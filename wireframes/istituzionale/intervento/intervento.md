# Flusso intervento - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/intervento/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Rework del 22/10/2026 sui contratti del giro G3 (spec sha256:b0c069cf...): ultimo dato sincronizzato, export CSV e XLSX,
descrizione dell'intervento da TX-0060 (decisione G2).

Ricomposto il 30/10/2026 per il riallineamento degli ambiti (decisione dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`; pack 1.4.0, spec sha256:e29f8ac4..., catalogo
rev. 4): TX-0017 (output regionale) e' passato al fisico e TX-0015 (verifica SMP SIGC) e' arrivato nell'istituzionale.
Il dettaglio compone ora le due verifiche SMP filtrate sull'intervento (scelta di disegno 2 del dossier, opzione
raccomandata): schede "Verifica SMP non SIGC" (TX-0016, invariata) e "Verifica SMP SIGC" (TX-0015, nuova). Tolti: la
scheda "Output per anno" (grafico per anno e target, TX-0017), la scheda "Importi unitari" (TX-0017), il KPI del target
di fine periodo, il pulsante "Output regionale filtrato su questo intervento", l'unita' di misura accanto alle quantita'
(OP-IS-12). I tre KPI di TX-0016 passano dentro la loro scheda e la scheda SIGC ha i suoi tre.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/interventi/:codice | dettaglio | dettaglio v2 (testata, schede con KPI e voci) | csr.tx-0016.read, csr.tx-0015.read |

Perche' una route di dettaglio (uiplan-patterns 6): i due report dell'area hanno righe dello stesso oggetto, l'intervento;
il dettaglio compone gli stessi report filtrati su `intervento = :codice`, senza transazioni nuove. Le due verifiche sono
le due meta' dello stesso confronto con SMP - Data Platform (RF015 per i dati SIGC, RF016 per i non SIGC): il dettaglio
le mette una accanto all'altra per lo stesso intervento, ognuna col suo periodo, senza sommarle. Il percorso
`/istituzionale/interventi/:codice` e' distinto da `/finanziario/interventi/:codice` (dettaglio finanziario, altri grant).

Letture della pagina: TX-0016 e TX-0015 con `intervento = :codice` (TX-0015 solo con un esercizio scelto), i loro export
`{formato}` con lo stesso filtro e TX-0060 dell'elenco operativo per la descrizione dell'intervento (csr.tx-0060.read,
che hanno tutti i profili con csr.tx-0016.read o csr.tx-0015.read; decisione G2). TX-0060 (RA006) e' fra le transazioni
della route, con la slice elenco-operativo pinnata nell'handover; la visibilita' resta csr.tx-0016.read e
csr.tx-0015.read (almeno uno: nel catalogo rev. 4 li hanno insieme p1-dirigente, p2-referente-adg e
p3-funzionario-area-ist) e la lettura della descrizione e' un'azione col controllo di csr.tx-0060.read (step6).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/interventi/:codice: Shell > Barra dei riferimenti (perimetro regionale, "Dati al") > Breadcrumb >
  Testata (codice, descrizione da TX-0060, perimetro regionale; pulsanti verso le due verifiche filtrate sull'intervento) >
  Schede: "Verifica SMP non SIGC" (selettore dell'anno di riferimento, KPI x3, le 20 voci di TX-0016; CSV, XLSX) e
  "Verifica SMP SIGC" (selettore dell'esercizio, KPI x3, riferimenti e le 20 voci di TX-0015; CSV, XLSX) > Stati

Nessun filtro nella barra (nessun pannello): il dettaglio e' gia' filtrato sull'intervento; la barra porta solo perimetro
e "Dati al" (`ultimiDatiSincronizzati` della prima risposta arrivata fra TX-0016 e TX-0015: lo stesso elenco,
SC-IS_ULTIMO_DATO). L'anno di riferimento e l'esercizio stanno nelle loro schede (url_params anno ed esercizio).

Nessun KPI in testa, a differenza di prima: i numeri dipendono dalla scheda (periodi diversi) e un KPI "dell'intervento"
mescolerebbe dati non SIGC cumulativi e dati SIGC dell'esercizio. Nessun grafico: ogni scheda e' una riga di un report
(un valore per dato), e il grafico per anno dell'output e' andato con TX-0017 nel fisico.

Scheda iniziale: quella della pagina di partenza. Con l'esercizio nell'indirizzo e senza l'anno (arrivo dalla verifica
SIGC, link:dettaglio-intervento-smp-sigc) si apre "Verifica SMP SIGC"; altrimenti "Verifica SMP non SIGC". Poi la scheda
attiva e' stato della pagina (non e' un parametro della spec). Ogni scheda c'e' solo col grant della sua transazione
(gate di UX) e legge solo quando si apre; senza esercizio la scheda SIGC chiede di sceglierlo e non legge.

Testata: occhiello "Istituzionale - intervento <codice>", titolo = `interventi[].descrizione` di TX-0060 per la voce con
`chiave` = codice (provenance spec: openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco); se TX-0060
non risponde o la voce manca, il titolo e' "Intervento <codice>". Gli indicatori (prima nella testata, con l'unita' di
TX-0017) stanno nelle voci di ogni scheda, perche' dipendono dall'anno o dall'esercizio.

## Campi (provenance spec)

- TX-0016 (openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc): annoRiferimento, perimetro,
  outputCumulativo e i 20 dati della riga (gli stessi della tabella del flusso verifica-smp-non-sigc), invariati.
- TX-0015 (openapi-istituzionale.json#/components/schemas/VerificaSmp): esercizio, annoDomande, pagamentiSenzaData (con il
  filtro sull'intervento: i pagamenti dell'intervento senza data), perimetro e i 20 dati della riga (gli stessi della
  tabella del flusso verifica-smp-sigc).
- Ultimo dato sincronizzato: ultimiDatiSincronizzati[].flusso e .conclusoIl (VerificaSmpNonSigc e VerificaSmp).
- Descrizione dell'intervento: interventi[].chiave e .descrizione di TX-0060
  (openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco).
- KPI della scheda non SIGC: domandeRicevute, domandeFinanziate, spesaErogata (TX-0016, cumulative). KPI della scheda
  SIGC: domandeRicevute, domandeFinanziate (campagna n-1), spesaErogataCampagnaPrecedente (pagata nell'esercizio)
  (TX-0015). Valori della riga, nessuna somma ne' quota calcolata.
- Tolti con TX-0017: annoInizio, annoFine, realizzatoNonSigcCumulativo, unitaMisura, targetFinePeriodo, annoTarget,
  anni[], importiUnitari[] (MonitoraggioOutput, ora della feature fisico).

## Scaricamenti (un pulsante per formato, come nel dettaglio finanziario)

| scheda | formati | contenuto |
|---|---|---|
| Verifica SMP non SIGC | CSV, XLSX | `GET /api/istituzionale/verifica-smp-non-sigc/{formato}?intervento=<codice>&anno=<anno scelto>`: la riga dell'intervento con i 20 dati |
| Verifica SMP SIGC | CSV, XLSX | `GET /api/istituzionale/verifica-smp-sigc/{formato}?intervento=<codice>&esercizio=<esercizio scelto>`: la riga dell'intervento con i 20 dati; pulsanti nascosti senza esercizio |

Nessun PNG: il dettaglio non ha piu' grafici. Ogni file e' registrato in AUDIT_ESPORTAZIONE; errori col motivo in
role=alert (503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA, TEMPO_SCADUTO, con Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/interventi/:codice | nessuno (tolto il grafico dell'output per anno con TX-0017) | - | - | - | voci con il motivo, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/interventi/:codice | verifica-smp-intervento | pulsante della testata "Verifica SMP non SIGC filtrata su questo intervento" (con csr.tx-0016.read) | istituzionale: /istituzionale/verifica-smp-non-sigc | - | intervento = :codice, anno (se scelto) |
| /istituzionale/interventi/:codice | verifica-smp-sigc-intervento | pulsante della testata "Verifica SMP SIGC filtrata su questo intervento" (con csr.tx-0015.read) | istituzionale: /istituzionale/verifica-smp-sigc | - | intervento = :codice, esercizio (se scelto) |
| /istituzionale/interventi/:codice | elenco-ricevute-intervento | "Apri nell'elenco" sulla voce Domande ricevute della scheda non SIGC | elenco-operativo: /elenco-operativo/domande | - | tipo=SOSTEGNO, intervento = :codice |
| /istituzionale/interventi/:codice | elenco-spesa-intervento | "Apri nei pagamenti" sulla voce Spesa erogata della scheda non SIGC | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, sigc=false, intervento = :codice |

Arrivi nel dettaglio: link:dettaglio-intervento-smp (flusso verifica-smp-non-sigc, con l'anno) e
link:dettaglio-intervento-smp-sigc (flusso verifica-smp-sigc, con l'esercizio). Tolto il link
output-regionale-intervento (la route non e' piu' di questa feature) e l'arrivo dettaglio-intervento-output (il flusso
output-regionale e' passato al fisico, che decide dove porta il suo clic). I link verso l'elenco: OP-IS-09; nessun link
verso l'elenco dalla scheda SIGC, come nella sua pagina. Nessun link verso il finanziario ne' verso il fisico da qui (un
link verso l'output dell'intervento nel fisico, solo con csr.tx-0017.read, si potra' aggiungere quando quella route sara'
approvata: scelta di disegno 2 del dossier).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/interventi/:codice | anno | TX-0016.anno | no | no |
| /istituzionale/interventi/:codice | esercizio | TX-0015.esercizio | no | no per la route (obbligatorio per la lettura della scheda SIGC) |

## Stati resi (obbligatori)

- vuoto: intervento senza righe nella verifica SMP (per esempio AT001, che i report escludono) con "Torna alla verifica
  SMP non SIGC"; scheda SIGC senza esercizio ("Scegli l'esercizio finanziario da consultare.", nessuna lettura); scheda
  SIGC senza riga per l'esercizio scelto ("Nessun dato SIGC per questo intervento nell'esercizio scelto")
- caricamento: scheletro della testata e della scheda aperta, `role="status"` + `aria-live="polite"`; le schede leggono
  solo quando si aprono
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO per un codice o
  un esercizio non valido; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA o TEMPO_SCADUTO con Riprova; 401/419 sessione)
- file non scaricato: `role="alert"` col motivo; riuscito: "File CSV scaricato." in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, tablist con frecce, axe
  (deferred-to-step8: il lint di step1 non ha un DOM).
- Voci delle due verifiche come tabelle a due colonne con intestazione di riga; caption che dice periodo e intervento.
- Selettori dell'anno e dell'esercizio con etichetta e testo d'aiuto collegati (aria-describedby); la scelta si applica col
  pulsante Mostra.
- KPI di ogni scheda con il periodo nel testo (cumulative; campagna n-1 ed esercizio), non solo nel titolo della scheda.
- Pulsanti di scaricamento: sigla visibile contenuta nel nome accessibile completo, che dice anche l'intervento e, per la
  scheda SIGC, l'esercizio (WCAG 2.5.3); aria-disabled col focus sul pulsante attivato durante la preparazione (WCAG
  2.4.3); esito in role=status, errore in role=alert. Pill "Dati al" come bottone col nome accessibile completo e popover
  per flusso.
- RESIDUO umano da verificare qui: ordine di lettura di testata e schede; comprensibilita' della differenza di periodo fra
  le due schede; etichette lunghe delle voci; bersagli dei link nelle voci (minimo 24 px); contrasto della resa finale
  (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-IS-07: definizioni da confermare (D-02, D-04 e quelle di TX-0015).
- OP-IS-08: testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA.
- OP-IS-09: link verso l'elenco senza scenario di coincidenza.
- OP-IS-10 (informativo): TX-0056..TX-0059 della slice elenco-operativo, pinnata per TX-0060, restano dell'elenco.
- OP-IS-12 (nuovo): unita' di misura dell'output assente dalle due verifiche (prima da TX-0017).
- Chiusi: OP-IS-01 (G2, descrizione dell'intervento da TX-0060), OP-IS-02 (G3, ultimiDatiSincronizzati), OP-IS-03 (G3,
  export CSV e XLSX); OP-IS-06 (grafico dell'output fra interventi) passato al fisico con TX-0017.
