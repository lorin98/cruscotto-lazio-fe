# Flusso verifica-smp-sigc - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/verifica-smp-sigc/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

Flusso NUOVO del 30/10/2026 per il riallineamento degli ambiti (decisione dell'utente del 29/10/2026,
`cruscotto-lazio-spec/decisioni/MIN-20261029-riallineamento-ambiti.md`, A-1, A-4, A-5): TX-0015 (RF015) e' dell'ambito
istituzionale. La pagina viene da `wireframes/sigc/verifica-smp.html` del finanziario (HEAD e0f6cb7, flusso sigc
approvato il 21/10/2026, sha256:bff0fa0c...) e dal codice attuale (`VerificaSmpReport`), adattata al contratto nuovo
(spec istituzionale sha256:e29f8ac4..., pack 1.4.0) e resa come la verifica SMP non SIGC della stessa area. Cosa cambia
rispetto alla pagina del finanziario:

- route `/istituzionale/verifica-smp-sigc` (la vecchia `/finanziario/sigc/verifica-smp` non resta come alias: A-4);
- API `GET /api/istituzionale/verifica-smp-sigc` e `/{formato}` (prima sotto `/api/finanziario/sigc/`);
- "Dati al" da `ultimiDatiSincronizzati` della risposta di TX-0015 (prima da TX-0001 del finanziario, che
  p3-funzionario-area-ist non legge);
- perimetro sempre REGIONALE (prima ADA per P4, che dal catalogo rev. 4 non ha piu' TX-0015): niente `scope_filters`;
- filtri (intervento, OS, OG, OP, azione) nell'indirizzo come `url_params` della spec, con le voci da TX-0060 (G2),
  ed esercizio nell'indirizzo; prima la route del finanziario non dichiarava parametri;
- clic su barra o riga verso il dettaglio dell'intervento dell'istituzionale (prima quello del finanziario);
- frase sotto il titolo verso la verifica SMP non SIGC (link reciproci, scelta di disegno 1 del dossier);
- grant `csr.tx-0015.read`: p1-dirigente, p2-referente-adg, p3-funzionario-area-ist (catalogo rev. 4; prima anche P4 e P5).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/verifica-smp-sigc | report | report v2 (selettore, grafico a barre, tabella interattiva), come /istituzionale/verifica-smp-non-sigc | csr.tx-0015.read |

Letture della pagina: TX-0015 (report), il suo export `GET /api/istituzionale/verifica-smp-sigc/{formato}` (csv, xlsx;
stesso grant, senza operationId, con X-Requested-With) e TX-0060 dell'elenco operativo per le voci del pannello
(`GET /api/elenco-operativo/filtri`, csr.tx-0060.read: lo hanno p1, p2 e p3-funzionario-area-ist, cioe' tutti i profili
con csr.tx-0015.read; decisione G2). TX-0060 (RA006) e' fra le transazioni della route con la slice elenco-operativo
pinnata nell'handover; la visibilita' della route resta il solo csr.tx-0015.read e la lettura dei valori e' un'azione
col controllo di csr.tx-0060.read (step6), come nella verifica non SIGC.

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/verifica-smp-sigc: Shell > Barra filtri (chip, perimetro regionale, esercizio, "Dati al") > Breadcrumb >
  Titolo (con la frase verso la verifica SMP non SIGC) > Pannello filtri (valori da TX-0060) > Selettore dell'esercizio
  (obbligatorio, pulsante Mostra) > Riferimenti della risposta (esercizio, anno delle domande, pagamenti senza data,
  perimetro) > Card spesa erogata nella campagna precedente per intervento (barre; PNG, CSV, XLSX) > Card tabella delle
  21 colonne (cerca, colonne, ordinamento; CSV, XLSX) con le note sulle definizioni > Stati

Stessa resa della verifica SMP non SIGC: nessun KPI (i dati sono per intervento), selettore d'anno con Mostra, una card a
barre, la tabella dei dati con l'intervento come intestazione di riga, i si'/no come colonne di testo, il clic su barra o
riga che apre il dettaglio dell'intervento, un pulsante per formato. Differenze dovute al contratto: l'esercizio di
TX-0015 e' obbligatorio (senza, la pagina chiede di sceglierlo e non legge) ed e' l'esercizio finanziario n (16/10/n-1 -
15/10/n, domande dell'anno n-1), non l'anno di riferimento del file SMP non SIGC.

Esercizi proposti dal selettore: quelli del periodo CSR dal 2023 al 2030 (regola n+2 per l'esercizio), come nel
finanziario (costante del frontend; la spec accetta 2000-2100). Un esercizio valido gia' nell'indirizzo resta
selezionabile. L'esercizio non ha un valore predefinito, come nel finanziario.

## Barra dei filtri e "Dati al"

- "Dati al gg/mm/aaaa": campo `ultimiDatiSincronizzati[]` (flusso, conclusoIl) della risposta di TX-0015, provenance spec
  (`openapi-istituzionale.json#/components/schemas/VerificaSmp`), stessa pill della verifica non SIGC (`PillDatiAl`): la
  data fino a cui tutti i flussi sono aggiornati (la conclusione meno recente) e nel popover una voce per flusso d'import.
  Elenco vuoto: "Ultimo dato sincronizzato: nessuna acquisizione conclusa". Senza esercizio (nessuna lettura) e in
  caricamento la pill non si mostra; con la lettura in errore "non disponibile". La stessa data e' nell'intestazione dei
  file CSV e XLSX.
- Chip dei filtri attivi con la voce leggibile da TX-0060; perimetro regionale fisso (campo `perimetro`, sempre
  REGIONALE); esercizio scelto con i suoi estremi.

## Pannello dei filtri (valori da TX-0060, decisione G2)

| gruppo | parametro della route | voci (provenance spec: openapi-elenco-operativo.json#/components/schemas/ValoriFiltriElenco) |
|---|---|---|
| Intervento | intervento | interventi[].chiave + interventi[].descrizione (senza AT001), ricerca per codice o descrizione |
| Obiettivo specifico | os | obiettiviSpecifici[].chiave (solo codice: descrizione null) |
| Obiettivo generale | og | obiettiviGenerali[] (testo della gerarchia) |
| Obiettivo di policy | op | obiettiviPolicy[] (testo della gerarchia) |
| Azione portante | azione | azioniPortanti[].chiave (id numerico) + descrizione; con legameAzioniDisponibile = falso il gruppo dice che non e' disponibile |

Stesse regole della verifica non SIGC e dei report del finanziario (FiltriQuery): voci dello stesso filtro in
alternativa (O), filtri diversi insieme (E), filtri nell'indirizzo. Gli stessi cinque filtri restano passando dal menu o
dalla frase sotto il titolo all'altra verifica dell'area; l'esercizio no. Se TX-0060 non risponde, i filtri
dell'indirizzo restano chip rimovibili e il report si legge lo stesso.

## Colonne della tabella (21: l'intervento e 20 dati; provenance spec: openapi-istituzionale.json#/components/schemas/VerificaSmp)

| colonna | campo | resa |
|---|---|---|
| Intervento | righe[].codiceIntervento | intestazione di riga, fissa |
| Avvisi attivati | righe[].avvisiAttivati | conteggio col motivo (ConteggioFinanziario: NON_VALORIZZATO senza il numero del report, D-09 Rev. 1) |
| Azioni attivate | righe[].azioniAttivate | conteggio col motivo (D-09 Rev. 3) |
| Domande ricevute | righe[].domandeRicevute | conteggio |
| Domande ricevute senza richiesto | righe[].domandeRicevuteSenzaRichiesto | conteggio (escluse dal valore) |
| Valore domande ricevute | righe[].valoreDomandeRicevute | importo col motivo |
| Domande finanziate | righe[].domandeFinanziate | conteggio |
| Valore domande finanziate | righe[].valoreDomandeFinanziate | importo col motivo |
| Dotazione anno precedente | righe[].dotazioneAnnoPrecedente | importo col motivo |
| Dotazione periodo di impegno | righe[].dotazionePeriodoImpegno | importo col motivo |
| Domande pagate nell'esercizio | righe[].domandePagateEsercizio | conteggio |
| Spesa erogata campagna precedente | righe[].spesaErogataCampagnaPrecedente | importo col motivo; e' la misura del grafico |
| Spesa erogata campagne anteriori | righe[].spesaErogataCampagneAnteriori | importo col motivo |
| Si prevede di pagare nell'esercizio | righe[].previsionePagamentoEsercizio | si'/no col motivo (SiNoFinanziario; FONTE_NON_ATTIVA con fonte PREVISIONE_PAGAMENTO, D-11), colonna di testo |
| Importo top-up | righe[].importoTopUp | importo col motivo |
| Include top-up | righe[].includeTopUp | si'/no col motivo (D-09 Rev. 3), colonna di testo |
| Ettari o UBA richiesti | righe[].ettariUbaRichiesti | quantita' o "non disponibile" |
| Output atteso delle finanziate | righe[].outputAttesoFinanziate | quantita' o "non disponibile" |
| Output erogato nell'esercizio | righe[].outputErogatoEsercizio | quantita' o "non disponibile" |
| Indicatore di output | righe[].indicatoreOutput | testo o "non disponibile" |
| Indicatore di risultato | righe[].indicatoreRisultato | testo o "non disponibile" |

Ordine e titoli delle colonne come nella pagina del finanziario (`VerificaSmpReport`); la ricerca cerca per codice o
indicatore. Testa della risposta (tabella "Riferimenti della risposta"): `esercizio`, `annoDomande`,
`pagamentiSenzaData` (esclusi dall'esercizio e contati), `perimetro` (sempre REGIONALE); `ultimiDatiSincronizzati` nella
pill "Dati al".

Resa delle assenze (kit `descriviAssenza`/`testoConNota`, una sola forma per tutte le feature): NON_VALORIZZATO "non
valorizzato (il dato non e' presente nella fonte)"; FONTE_NON_ATTIVA "non disponibile (fonte ... non attiva)", con la
fonte attesa dal campo `fonte`. I campi senza motivo (`ettariUbaRichiesti`, `outputAttesoFinanziate`,
`outputErogatoEsercizio`, gli indicatori) assenti sono "non disponibile", come nel finanziario. Uno 0 nei conteggi o
negli importi e' un valore vero del backend, non un'assenza.

## Scaricamenti (un pulsante per formato, come nel finanziario)

| dove | formati | contenuto |
|---|---|---|
| card del grafico | PNG, CSV, XLSX | PNG = immagine del grafico disegnata nel browser con l'intestazione di NFR-50 (fonte, filtri, esercizio, data di estrazione, ultimo dato sincronizzato, profilo, uso interno), non registrata in AUDIT_ESPORTAZIONE (stesso limite di OP-FE-08 del finanziario); CSV e XLSX = i dati del report |
| card della tabella | CSV, XLSX | `GET /api/istituzionale/verifica-smp-sigc/{formato}` con gli stessi filtri e lo stesso esercizio: una riga per intervento con i 20 dati e i motivi delle assenze, intestazione con fonte, filtri, data di estrazione, profili, ultimo dato sincronizzato per flusso e uso interno; una riga di AUDIT_ESPORTAZIONE per file |

I file contengono tutti gli interventi dei filtri e tutte le colonne (la nota lo dice sotto gli strumenti). Pulsanti
nascosti se la risposta non ha righe o l'esercizio manca. Errori col motivo in role=alert: 400 oltre 5.000 righe o
50.000 celle (restringere i filtri), 503 ESPORTAZIONE_NON_REGISTRATA, CAPACITA_ESAURITA o TEMPO_SCADUTO (riprovare dopo
Retry-After).

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-sigc | Spesa erogata nella campagna precedente per intervento (la spesa per le campagne anteriori e la previsione di pagamento stanno nella tabella) | barre con zoom (oltre 12 interventi) | TX-0015 (righe[].spesaErogataCampagnaPrecedente) | link:dettaglio-intervento-smp-sigc (/istituzionale/interventi/:codice) | omessi ed elencati sotto il grafico col motivo, mai a zero |

Stesso grafico della pagina del finanziario (`graficoSmp`): cambia solo la destinazione del clic.

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-sigc | dettaglio-intervento-smp-sigc | barra del grafico, clic o Invio su una riga | istituzionale: /istituzionale/interventi/:codice | codice | esercizio (il dettaglio si apre sulla scheda Verifica SMP SIGC) |
| /istituzionale/verifica-smp-sigc | verifica-smp-non-sigc | link "Verifica SMP non SIGC" nella frase sotto il titolo (con csr.tx-0016.read) | istituzionale: /istituzionale/verifica-smp-non-sigc | - | intervento, os, og, op, azione (i filtri correnti) |

Nessun link verso l'elenco operativo, come nel finanziario: i dati sono per esercizio e campagna n-1 e l'elenco non li
riproduce. Nessun link verso il finanziario: la pagina non e' piu' li' e il dettaglio finanziario dell'intervento resta
raggiungibile dal menu del finanziario a chi ne ha i grant.

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/verifica-smp-sigc | esercizio | TX-0015.esercizio | no | no per la route (obbligatorio per la lettura: senza, la pagina chiede di sceglierlo) |
| /istituzionale/verifica-smp-sigc | intervento | TX-0015.intervento | si' | no |
| /istituzionale/verifica-smp-sigc | os | TX-0015.os | si' | no |
| /istituzionale/verifica-smp-sigc | og | TX-0015.og | si' | no |
| /istituzionale/verifica-smp-sigc | op | TX-0015.op | si' | no |
| /istituzionale/verifica-smp-sigc | azione | TX-0015.azione | si' | no |

L'esercizio non e' `required` nello uiplan perche' la route si apre anche senza (dal menu e dalla verifica non SIGC, che
non puo' tradurre il suo anno in un esercizio): la pagina chiede l'esercizio e non chiama TX-0015 finche' manca. Gli
stessi parametri vanno all'export `{formato}` (stessi nomi nella spec).

## Stati resi (obbligatori)

- esercizio non scelto: "Scegli l'esercizio finanziario da consultare.", nessuna lettura (anche arrivando dalla verifica
  non SIGC coi soli filtri)
- vuoto: "Nessun dato SIGC per l'esercizio e i filtri scelti" con "Modifica i filtri" (mai schermo bianco)
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- valori dei filtri non disponibili (TX-0060 in errore): `role="status"`, chip dell'indirizzo invariati, Riprova
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO col nome del
  parametro, per esempio esercizio non numerico, ripetuto o fuori da 2000-2100; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA
  ritentata rispettando Retry-After; 503 TEMPO_SCADUTO; 401/419 sessione)
- file non scaricato: `role="alert"` col motivo; riuscito: "File CSV scaricato." in `role="status"`

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap del pannello, tabella equivalente
  del grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- Selettore dell'esercizio con etichetta e testo d'aiuto collegati (aria-describedby); la scelta si applica col pulsante
  Mostra, non scorrendo le voci.
- Tabella larga (21 colonne): intestazione di riga sul codice intervento, scorrimento orizzontale del solo contenitore,
  colonne scelte con Colonne (21); intestazioni ordinabili come bottoni con lo stato annunciato; righe apribili con Invio.
- Pulsanti di scaricamento: sigla visibile (PNG, CSV, XLSX) contenuta nel nome accessibile completo, che dice anche
  l'esercizio (WCAG 2.5.3); durante la preparazione aria-disabled col focus sul pulsante attivato (WCAG 2.4.3); esito in
  role=status, errore in role=alert.
- Pill "Dati al": bottone col nome accessibile completo ("Ultimo dato sincronizzato: dati al ... per tutti i flussi.
  Mostra il dettaglio per flusso") e popover con le voci per flusso.
- RESIDUO umano da verificare qui: ordine di lettura (filtri, titolo con la frase verso la verifica non SIGC, esercizio,
  riferimenti, grafico, tabella), didascalia del grafico, comprensibilita' delle etichette delle colonne e delle note
  sulle definizioni, testi lunghi delle assenze nelle celle, contrasto della resa finale (il low-fi non fa fede sul colore).

## Punti aperti che toccano questo flusso

- OP-IS-07: definizioni da confermare (ora anche quelle di TX-0015, decisioni di finanziario richiamate da istituzionale)
  e marcatore "da consolidare" di NFR-25 (d).
- OP-IS-04 (superato il 29/10/2026): il link G4 verso il finanziario lascia il posto ai link reciproci fra le due
  verifiche dell'area.
- OP-IS-10 (informativo): TX-0056..TX-0059 della slice elenco-operativo, pinnata per TX-0060, restano dell'elenco.
