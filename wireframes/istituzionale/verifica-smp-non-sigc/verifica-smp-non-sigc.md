# Flusso verifica-smp-non-sigc - wireframe v2 (feature istituzionale)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/istituzionale/verifica-smp-non-sigc/`; hash da `wireframe-hash.sh`): modificare un file qui
> invalida l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | report | report v2 (selettore, grafico a barre, tabella interattiva), come /finanziario/sigc/verifica-smp | csr.tx-0016.read |

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027): Shell (fascia ente, barra, menu a gruppi, piede) > Barra filtri
(chip, perimetro, dati al) > Breadcrumb > Titolo | Testata di dettaglio > [KPI | Sinottico] > [Card grafico (tipo)] >
[Tabella interattiva (+ Totali dal server)] > [Drawer di anteprima] > [Schede] > Stati.

- /istituzionale/verifica-smp-non-sigc: Shell > Barra filtri (chip, perimetro regionale, anno di riferimento del file) >
  Breadcrumb > Titolo > Pannello filtri > Selettore dell'anno di riferimento (facoltativo, pulsante Mostra) > Riferimenti
  della risposta (anno, output cumulativo, perimetro) > Card spesa pubblica erogata per intervento (barre) > Card tabella
  dei 21 dati (cerca, colonne, ordinamento) con le note sulle definizioni > Stati

Stessa resa della verifica SMP SIGC del finanziario (TX-0015, flusso sigc): nessun KPI (i dati sono per intervento),
selettore d'anno con Mostra, una card a barre, la tabella dei dati con l'intervento come intestazione di riga, i si'/no
come colonne di testo, il clic su barra o riga che apre il dettaglio dell'intervento. Differenze dovute al contratto:
l'anno di TX-0016 e' facoltativo (assente = l'ultimo anno con un file), e' l'anno di riferimento del file SMP non SIGC e
non l'esercizio finanziario; domande e spesa sono cumulative.

## Colonne della tabella (21, provenance spec: openapi-istituzionale.json#/components/schemas/VerificaSmpNonSigc)

| colonna | campo | resa |
|---|---|---|
| Intervento | righe[].codiceIntervento | intestazione di riga, fissa |
| Avvisi attivati | righe[].avvisiAttivati | conteggio col motivo |
| Avvisi chiusi | righe[].avvisiChiusi | conteggio col motivo |
| Azioni attivate | righe[].azioniAttivate | conteggio col motivo |
| Dotazione avvisi | righe[].dotazioneAvvisi | importo col motivo |
| Chiusura ultimo avviso aperto | righe[].chiusuraUltimoAvvisoAperto | data col motivo |
| Domande ricevute | righe[].domandeRicevute | conteggio (sempre valorizzato); link:elenco-ricevute-riga se maggiore di 0 |
| Domande ricevute senza richiesto | righe[].domandeRicevuteSenzaRichiesto | conteggio (escluse dal valore) |
| Valore domande ricevute | righe[].valoreDomandeRicevute | importo col motivo |
| Domande finanziate | righe[].domandeFinanziate | conteggio |
| Valore domande finanziate | righe[].valoreDomandeFinanziate | importo col motivo |
| Domande pagate (solo saldate) | righe[].domandeSaldate | conteggio; nota "definizione da confermare con ARSIAL" (D-02) |
| Anticipi erogati | righe[].anticipiErogati | importo col motivo |
| Spesa erogata (anticipi inclusi) | righe[].spesaErogata | importo col motivo; link:elenco-spesa-riga se maggiore di 0 |
| Concessioni previste senza impegni | righe[].concessioniPreviste | si'/no col motivo, colonna di testo |
| Include top-up | righe[].includeTopUp | si'/no col motivo, colonna di testo |
| Importo top-up | righe[].importoTopUp | importo col motivo |
| Output atteso delle finanziate | righe[].outputAttesoFinanziate | quantita' col motivo |
| Output erogato (cumulativo) | righe[].outputErogato | quantita' col motivo |
| Indicatore di output | righe[].indicatoreOutput | testo col motivo |
| Indicatore di risultato | righe[].indicatoreRisultato | testo col motivo |

Testa della risposta: annoRiferimento (barra filtri e riferimenti; null = nessun file), perimetro (sempre REGIONALE),
outputCumulativo (dichiarato nei riferimenti).

Resa delle assenze (kit `descriviAssenza`/`testoConNota`, una sola forma per tutte le feature; i due motivi nuovi
sono la proposta di OP-IS-08):

| motivo | testo |
|---|---|
| NON_VALORIZZATO | non valorizzato (il dato non e' presente nella fonte) |
| ANNO_NON_CONSERVATO | non disponibile per l'anno scelto (l'avviso porta i dati del file piu' recente) |
| FONTE_AMBIGUA | non attribuibile (riga presente sia nel monitoraggio SIGC sia nel non SIGC) |
| FONTE_NON_ATTIVA | non disponibile (fonte ... non attiva): oggi nessun campo di TX-0016 (D-01 Rev. 2) |

Nelle celle della tabella il kit mostra il testo come badge e la nota piccola accanto (`AssenzaMotivata`); la forma fra
parentesi e' quella delle voci e dei motivi dei grafici (`testoConNota`).

Uno 0 nelle colonne Domande ricevute, finanziate, pagate o in Spesa erogata e' un conteggio vero del backend (per esempio
un intervento SIGC come SRA01 non ha domande non SIGC), non un'assenza.

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | Spesa pubblica erogata per intervento (anticipi inclusi) | barre con zoom (oltre 12 interventi) | TX-0016 (righe[].spesaErogata) | link:dettaglio-intervento-smp (/istituzionale/interventi/:codice) | omessi ed elencati sotto il grafico col motivo, mai a zero |

## Link del flusso (drill-down dichiarati)

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | dettaglio-intervento-smp | barra del grafico, clic o Invio su una riga | istituzionale: /istituzionale/interventi/:codice | codice | anno (se scelto) |
| /istituzionale/verifica-smp-non-sigc | elenco-ricevute-riga | "Apri nell'elenco" nella cella Domande ricevute | elenco-operativo: /elenco-operativo/domande | - | tipo=SOSTEGNO, intervento della riga |
| /istituzionale/verifica-smp-non-sigc | elenco-spesa-riga | "Apri nei pagamenti" nella cella Spesa erogata | elenco-operativo: /elenco-operativo/pagamenti | - | esito=PAGATA, sigc=false, intervento della riga |

I due link verso l'elenco valgono per definizione (D-05 del backend), senza uno scenario che lo verifichi: OP-IS-09.
Non collegati: finanziate, pagate (saldate) e anticipi, che l'elenco non riproduce. Collegamento con la verifica SMP
SIGC del finanziario: proposta non dichiarata, OP-IS-04 (nota nel wireframe).

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /istituzionale/verifica-smp-non-sigc | anno | TX-0016.anno | no | no |
| /istituzionale/verifica-smp-non-sigc | intervento | TX-0016.intervento | si' | no |
| /istituzionale/verifica-smp-non-sigc | os | TX-0016.os | si' | no |
| /istituzionale/verifica-smp-non-sigc | og | TX-0016.og | si' | no |
| /istituzionale/verifica-smp-non-sigc | op | TX-0016.op | si' | no |
| /istituzionale/verifica-smp-non-sigc | azione | TX-0016.azione | si' | no |

Le voci del pannello: OP-IS-01 (solo i codici di intervento delle righe finche' green-be non espone i valori).

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri" (mai schermo bianco); nessun file SMP non SIGC
  (annoRiferimento null): stato dichiarato, i dati di programma sono non valorizzati e domande e spesa restano
- caricamento: scheletro delle card, `role="status"` + `aria-live="polite"`; letture al piu' due alla volta
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO col nome del
  filtro; 403 ACCESSO_NEGATO; 503 CAPACITA_ESAURITA ritentata rispettando Retry-After; 503 TEMPO_SCADUTO; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus dopo route-change, focus-trap del pannello, tabella equivalente
  del grafico, axe (deferred-to-step8: il lint di step1 non ha un DOM).
- RESIDUO umano da verificare qui: ordine di lettura (filtri, anno, riferimenti, grafico, tabella), didascalia del grafico,
  comprensibilita' delle etichette delle colonne e delle note sulle definizioni, contrasto della resa finale (il low-fi non
  fa fede sul colore).
- RESIDUO umano: bersagli dei link "Apri nell'elenco" e "Apri nei pagamenti" nelle celle (minimo 24 px, WCAG 2.5.8) e
  loro allineamento nelle celle numeriche; testi lunghi delle assenze nelle celle (a capo, larghezza delle colonne).

## Punti aperti che toccano questo flusso

- OP-IS-01: voci dei filtri assenti dalla spec istituzionale.
- OP-IS-02: ultimo dato sincronizzato assente (la barra mostra l'anno di riferimento del file).
- OP-IS-03: nessuna esportazione CSV/XLSX nella spec; solo PNG del grafico.
- OP-IS-04: collegamento con la verifica SMP SIGC del finanziario (da decidere).
- OP-IS-07: definizioni da confermare (D-02 pagate solo saldate, D-04 output cumulativo) e marcatore "da consolidare".
- OP-IS-08: testi dei motivi ANNO_NON_CONSERVATO e FONTE_AMBIGUA.
- OP-IS-09: link verso l'elenco senza scenario di coincidenza.
