# Flusso output-regionale - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/fisico/output-regionale/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Flusso NUOVO del fisico, creato il 30/10/2026 per il riallineamento degli ambiti (verbale dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1 e A-5: TX-0017, requisito RF017, e'
dell'ambito fisico). Portato dal flusso output-regionale dell'istituzionale approvato il 22/10/2026 (letto da git HEAD
e0f6cb7) e adattato al contratto nuovo (spec fisico sha256:189c634c..., pack 1.4.0, catalogo rev. 4): route, grant,
export, menu, testi. Layout, colonne, misure, stati e note WCAG restano quelli approvati.

Cosa cambia rispetto all'originale istituzionale:

- route `/fisico/output-regionale` (era `/istituzionale/output-regionale`, nessun alias: A-4); API
  `GET /api/fisico/output-regionale` e `/{formato}` (il vecchio indirizzo risponde 404, SC-FS_OUTPUT_ANNI);
- grant `csr.tx-0017.read` con i profili del catalogo rev. 4: p1-dirigente, p2-referente-adg, p3-funzionario-area-fis,
  p5-amministratore-funzionale (il P3 dell'area istituzionale non lo ha piu'; P5 lo prende: A-2);
- menu Fisico, breadcrumb Home > Fisico, titolo "Fisico: ...", pannello "Filtri dei report fisici", pill del perimetro
  come le superfici;
- "Apri il dettaglio" porta al dettaglio dell'intervento del fisico (`/fisico/interventi/:codice`, flusso intervento);
- gli importi unitari per Unit Amount non hanno piu' una scheda dedicata: li mostra la pagina Unit Amount (TX-0030, con
  output previsto e pagato) e restano nei file CSV e XLSX di TX-0017.

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/output-regionale | report | report tabellare v2 (lista-filtri: barra a chip, pannello, tabella interattiva, drawer) | csr.tx-0017.read |

Letture della pagina: TX-0017 (report), il suo export `GET /api/fisico/output-regionale/{formato}` (csv, xlsx; stesso
grant, senza operationId, con X-Requested-With) e TX-0060 dell'elenco operativo per le voci del pannello
(csr.tx-0060.read: lo hanno tutti i profili con csr.tx-0017.read; decisione G2). Come per le superfici, TX-0060 (RA006)
e' fra le transazioni della route e la slice elenco-operativo e' pinnata nell'handover; la visibilita' della route resta
il solo csr.tx-0017.read e la lettura dei valori e' un'azione col controllo di csr.tx-0060.read (step6).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /fisico/output-regionale: Shell > Barra filtri (chip, perimetro regionale, periodo annoInizio-annoFine, "Dati al") >
  Breadcrumb > Titolo > Pannello filtri (valori da TX-0060) > Card tabella "Output per intervento e anno" (interruttore
  della misura: Programmato | Realizzato SIGC | Realizzato non SIGC cumulativo; cerca, colonne, ordinamento; CSV, XLSX)
  con la nota sulle definizioni > Drawer di anteprima della riga (descrizione, indicatore, unita', target, mini grafico
  per anno, Apri il dettaglio) > Stati

Perche' tabellare e senza card grafico in pagina (OP-FIS-11): ogni intervento ha il suo indicatore e la sua unita' di
misura, quindi le quantita' di interventi diversi non stanno in un grafico comune. Il grafico per anno (una sola unita')
e' nel drawer e nel dettaglio dell'intervento (flusso intervento). Nessun totale e nessun KPI: sommare output di
interventi diversi non ha senso.

Perche' l'interruttore della misura: con sette anni (fino a otto se il periodo e' configurato al 2030,
SC-FS_OUTPUT_ANNI_CONFIGURATI) e tre misure la tabella avrebbe 21-24 colonne di anni; l'interruttore mostra una misura alla
volta (12 colonne) e la didascalia dice quale. Il confronto programmato-realizzato dello stesso intervento e' nel mini
grafico del drawer e nel dettaglio.

## Barra dei filtri, "Dati al" e pannello

- "Dati al gg/mm/aaaa": `ultimiDatiSincronizzati[]` (flusso, conclusoIl) della risposta di TX-0017, provenance spec
  (`openapi-fisico.json#/components/schemas/MonitoraggioOutput`, voci `UltimoDatoSincronizzato`), stessa pill delle
  superfici e del finanziario (`PillDatiAl`): la conclusione meno recente e nel dettaglio una voce per flusso; elenco vuoto
  = "nessuna acquisizione conclusa" (SC-FS_ULTIMO_DATO: anche al P3 dell'area fisica, che TX-0001 non lo legge).
- Periodo: annoInizio-annoFine della risposta; perimetro regionale fisso (`perimetro` sempre REGIONALE).
- Pannello: stesse voci e stesse regole delle superfici, da TX-0060 (provenance spec:
  `openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco`): interventi[].chiave e descrizione (senza AT001)
  per `intervento`, obiettiviSpecifici[].chiave per `os`, obiettiviGenerali[] per `og`, obiettiviPolicy[] per `op`,
  azioniPortanti[].chiave e descrizione per `azione` (gruppo non disponibile con legameAzioniDisponibile = falso). Se
  TX-0060 non risponde, i filtri dell'indirizzo restano chip rimovibili e il report si legge lo stesso. Filtri dei report
  fisici: dimensioni in AND, valori in OR (SC-FS_FILTRI); nessun filtro Campagna (TX-0017 non lo ha).

## Colonne della tabella (provenance spec: openapi-fisico.json#/components/schemas/MonitoraggioOutputRiga)

| colonna | campo | resa |
|---|---|---|
| Intervento | righe[].codiceIntervento | intestazione di riga, fissa |
| Indicatore di output | righe[].indicatoreOutput | testo; null = non valorizzato |
| Unita' di misura | righe[].unitaMisura | testo; null = non valorizzato |
| Target di fine periodo | righe[].targetFinePeriodo (Quantita) | quantita' col motivo |
| Anno del target | righe[].annoTarget | anno; null = nessun target |
| un anno per colonna (annoInizio..annoFine) | righe[].anni[].anno + righe[].anni[].programmato / realizzatoSigc / realizzatoNonSigc (MonitoraggioOutputAnno) | quantita' col motivo, secondo l'interruttore |

Testa della risposta (MonitoraggioOutput): annoInizio e annoFine (barra filtri e colonne), perimetro (sempre REGIONALE),
realizzatoNonSigcCumulativo (dichiarato nell'etichetta "Realizzato non SIGC (cumulativo)" e nella nota),
ultimiDatiSincronizzati (pill "Dati al"). Gli importi unitari per Unit Amount (righe[].importiUnitari[]) non si mostrano
in questa pagina: sono nei file CSV e XLSX di TX-0017 e, con output previsto e pagato, nella pagina Unit Amount e nella
scheda Unit Amount del dettaglio dell'intervento (TX-0030; OP-FIS-15).

Resa delle assenze nelle celle: badge col testo e nota piccola accanto (kit `AssenzaMotivata`, testi gia' nel kit:
OP-FIS-13): NON_VALORIZZATO "non valorizzato - il dato non e' presente nella fonte" (per esempio il programmato degli
interventi senza Unit Amount, D-03; SC-FS_OUTPUT_STRUTTURALE); FONTE_AMBIGUA "non attribuibile - riga presente sia nel
monitoraggio SIGC sia nel non SIGC" (SC-FS_OUTPUT_AMBIGUO, esempio nel 2027 nelle viste del realizzato).

## Scaricamenti (un pulsante per formato, come nel finanziario)

| dove | formati | contenuto |
|---|---|---|
| card della tabella | CSV, XLSX | `GET /api/fisico/output-regionale/{formato}` con gli stessi filtri: per ogni intervento una riga "Output dell'anno" per anno del periodo (programmato, realizzato SIGC, realizzato non SIGC, target e unita') e una riga "Importo unitario" per Unit Amount; intestazione con periodo, filtri, perimetro, ultimo dato sincronizzato per flusso, uso interno; una riga di AUDIT_ESPORTAZIONE per file, area A3 (SC-FS_ESPORTA) |

Nessun PNG in pagina: la pagina non ha grafici (OP-FIS-11); il mini grafico del drawer e' un'anteprima senza
scaricamento (il grafico per anno con il PNG e' nel dettaglio dell'intervento). I file contengono tutti gli interventi dei
filtri e tutte e tre le misure, qualunque sia la misura mostrata o la ricerca (la nota lo dice sotto gli strumenti).
Pulsanti nascosti se la risposta non ha righe. Errori col motivo in role=alert: 400 oltre 5.000 righe o 50.000 celle,
403 RICHIESTA_NON_AMMESSA senza X-Requested-With, 503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA o TEMPO_SCADUTO
(riprovare dopo Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/output-regionale (drawer) | Output per anno dell'intervento | mini barre raggruppate per anno (programmato, realizzato SIGC, realizzato non SIGC) con il target come riferimento | TX-0017 (righe[].anni[], righe[].targetFinePeriodo) | nessuno (il drawer ha "Apri il dettaglio": link:dettaglio-intervento-output) | omessi e dichiarati, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/output-regionale | dettaglio-intervento-output | "Apri il dettaglio" nel drawer della riga | fisico: /fisico/interventi/:codice | codice | - |

Nessun link verso l'elenco operativo: l'output non e' un insieme di domande (OP-FIS-05). Se l'utente non vuole il
dettaglio dell'intervento del fisico (scelta di disegno 1 del dossier, opzione B), il link si toglie e il drawer resta
l'unico posto del grafico per anno.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /fisico/output-regionale | intervento | TX-0017.intervento | si' | no |
| /fisico/output-regionale | os | TX-0017.os | si' | no |
| /fisico/output-regionale | og | TX-0017.og | si' | no |
| /fisico/output-regionale | op | TX-0017.op | si' | no |
| /fisico/output-regionale | azione | TX-0017.azione | si' | no |

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
  come bottone col nome accessibile completo e dettaglio per flusso.
- RESIDUO umano da verificare qui: ordine di lettura, didascalia della tabella che cambia con la misura, etichette
  comprensibili, contrasto della resa finale (il low-fi non fa fede sul colore).
- RESIDUO umano: tabella larga con scorrimento orizzontale a 320 px (WCAG 1.4.10, reflow), unita' di misura sempre
  leggibile accanto ai valori, testi delle assenze nelle celle degli anni.

## Punti aperti che toccano questo flusso

- OP-FIS-11: nessun grafico fra interventi (unita' diverse); era OP-IS-06 dell'istituzionale.
- OP-FIS-12: definizioni da confermare (D-03 programmato, D-04 realizzato non SIGC cumulativo); era OP-IS-07.
- OP-FIS-13: testi dei motivi FONTE_AMBIGUA e ANNO_NON_CONSERVATO, gia' nel kit (era OP-IS-08), informativo.
- OP-FIS-15: importi unitari mostrati da TX-0030 e non da TX-0017, informativo.
- OP-FIS-01, OP-FIS-02, OP-FIS-03: chiusi il 22/10/2026 per le superfici, estesi a questa pagina (voci da TX-0060,
  ultimo dato ed export di TX-0017).
- OP-FIS-07: voce di menu "Output regionale" nell'area Fisico, da montare allo step6.
