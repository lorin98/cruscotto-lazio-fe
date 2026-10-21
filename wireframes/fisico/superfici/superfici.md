# Flusso superfici - wireframe v2 (feature fisico)

> Doc del gate umano PER FLUSSO. L'approvazione e' content-addressed sull'INTERA dir
> del flusso (`wireframes/fisico/superfici/`, hash da `wireframe-hash.sh`): modificare un file qui invalida
> l'approvazione del flusso (e solo di questo flusso).

## Route del flusso

| route | kind | pattern | grant (verbatim dal catalogo) |
|---|---|---|---|
| /fisico/superfici | report | report v2 (KPI, card grafico con Grafico, Tabella e Scarica, interruttore di pagina Grafico, Tabella, tabella interattiva, drawer, pannello dei filtri) | csr.tx-0018.read |

Profili con il grant (catalogo): p1-dirigente, p2-referente-adg, p3-funzionario-area-fis, p5-amministratore-funzionale.
P4, P6, P7 e i P3 delle altre aree non lo hanno (la SR elenca anche P6 e P7 in RF018: fa fede il catalogo approvato).

## Component tree (per pagina)

Vocabolario del kit UI v2 (ADR 0027 di green-fe), lo stesso del finanziario (riepilogo e dotazione).

- /fisico/superfici: Shell > Barra filtri (Filtri, chip Intervento e Campagna, pill del perimetro regionale) > Breadcrumb >
  Titolo > KPI x4 della campagna di riferimento > Card "Superfici per intervento e campagna" (interruttore di pagina
  Grafico | Tabella, vista iniziale Grafico: card barre per intervento + card linea per campagna + card barre della verifica
  incrociata, ognuna col suo interruttore Grafico | Tabella equivalente e Scarica PNG; vista Tabella: cerca, colonne,
  ordinamento, totali per campagna, paginazione) > Drawer di anteprima dell'intervento > Pannello dei filtri > Stati

## Grafici del flusso

| pagina | grafico | tipo | dati (transazione) | clic | valori assenti |
|---|---|---|---|---|---|
| /fisico/superfici | Superficie DS e DP per intervento (campagna di riferimento) | barre raggruppate, zoom oltre 12 interventi | TX-0018 (superficieDs, superficieDp) | anteprima dell'intervento (drawer, stessa pagina) | intervento con motivo NON_VALORIZZATO: fuori dal grafico, elencato sotto ("senza superfici"), mai a zero |
| /fisico/superfici | Superficie DS e DP per campagna | linea | TX-0018 (somme degli interventi per campagna) | filtro Campagna su quell'anno (stessa pagina, chip) | con una campagna scelta la serie non si disegna e la card lo dice |
| /fisico/superfici | Verifica incrociata: differenza DP - DS per intervento | barre orizzontali con lo zero al centro (valori negativi a sinistra) | TX-0018 (differenzaDpDs, domandeDpOltreDs) | anteprima dell'intervento (drawer) | quantita' richiesta a premio: non disponibile, fonte non attiva (OP-FIS-04) |

Campagne: le superfici di campagne diverse non si sommano (D-01 del backend: un impegno pluriennale ripete la stessa
superficie DS in piu' campagne). La campagna di riferimento di KPI, barre e verifica incrociata e' quella del filtro
Campagna o, senza filtro, la piu' recente presente nella risposta; il titolo dei KPI e delle card la nomina. La linea per
campagna usa la risposta letta senza filtro Campagna. Nella tabella un totale per campagna, nessun totale generale.

KPI (somme delle righe della campagna di riferimento: il report e' completo, nessuna paginazione lato server; le domande
appartengono a un solo intervento, quindi la somma fra interventi della stessa campagna non conta due volte):
superficie DS (con le domande di sostegno), superficie DP (con le domande di pagamento), differenza DP - DS, domande con DP
oltre la DS (con la quota sulle domande di pagamento). Superfici in ettari con due decimali; una superficie negativa del
file ASR2-20 entra col suo segno (D-01 Rev. 2) e si legge col segno meno.

Download: solo il PNG del grafico, generato nel browser (la spec fisico non ha export CSV o XLSX: OP-FIS-03).

## Link del flusso (drill-down dichiarati)

Nessun link che cambia pagina. Il clic su una barra o su una riga apre il drawer; dal drawer "Mostra solo <intervento>" mette
il filtro Intervento (stessa route, chip nella barra). Nessun drill-down verso l'elenco operativo: l'insieme di domande di
TX-0018 non si riproduce con i parametri di TX-0056 (OP-FIS-05).

| pagina | link (id) | innesco | arrivo (feature: route) | parametri di path | query |
|---|---|---|---|---|---|
| /fisico/superfici | nessuno | - | - | - | - |

## Filtri nell'URL (url_params)

| pagina | parametro | fonte (operationId.parametro) | multiplo | obbligatorio |
|---|---|---|---|---|
| /fisico/superfici | intervento | TX-0018.intervento | si | no |
| /fisico/superfici | os | TX-0018.os | si | no |
| /fisico/superfici | og | TX-0018.og | si | no |
| /fisico/superfici | op | TX-0018.op | si | no |
| /fisico/superfici | azione | TX-0018.azione | si | no |
| /fisico/superfici | campagna | TX-0018.campagna | no (un solo anno: ripetuto = 400) | no (assente = tutte le campagne) |

Il pannello applica i filtri con "Applica i filtri" (come il finanziario: e' un report, non un'interrogazione). I valori
delle voci (interventi con descrizione, obiettivi, azioni portanti) non sono nella slice fisico: fonte da decidere (OP-FIS-01).

## Stati resi (obbligatori)

- vuoto: "Nessun intervento per i filtri scelti" con "Modifica i filtri"; e "Nessuna superficie per gli interventi scelti"
  quando tutte le righe hanno motivo NON_VALORIZZATO (mai una pagina di zeri)
- caricamento: scheletro dei KPI e delle card, `role="status"` + `aria-live="polite"`
- errore: `role="alert"`, discriminato sul problem-type `urn:cruscottocsr:problem:*` (400 DATO_NON_VALIDO filtri non validi;
  403 ACCESSO_NEGATO o RICHIESTA_NON_AMMESSA; 429 TROPPE_RICHIESTE e 503 CAPACITA_ESAURITA o TEMPO_SCADUTO ritentati
  rispettando Retry-After; 401/419 sessione)

## Note WCAG 2.2 (residuo manuale DICHIARATO)

- Meccanizzato a valle (step7/step8): tab-order, focus sul titolo dopo il cambio di route, focus-trap di pannello e
  drawer, tabella equivalente di ogni grafico, axe (nel lint di step1: axe deferito a step8, bloccante nel gate 11/11).
- RESIDUO umano da verificare qui: ordine di lettura di KPI, card e tabella; didascalie dei grafici; comprensibilita' di
  "DS", "DP" e "differenza DP - DS" (sciolte per esteso nel sottotitolo e nei nomi accessibili dei KPI); contrasto della
  resa finale (il low-fi non fa fede sul colore).
- Valori negativi riconoscibili senza colore (segno meno nel testo e nella tabella equivalente); assenze dette in testo
  ("non valorizzato", "non disponibile (fonte non attiva)"), mai uno zero.

## Punti aperti che toccano questo flusso

- OP-FIS-01: valori del pannello dei filtri (TX-0060 dell'elenco, campo additivo su TX-0018, o solo Intervento).
- OP-FIS-02: ultimo dato sincronizzato assente dai DTO della slice fisico.
- OP-FIS-03: nessun export CSV o XLSX nella spec fisico; il PNG non e' registrato in AUDIT_ESPORTAZIONE.
- OP-FIS-04: quantita' richiesta a premio sempre FONTE_NON_ATTIVA (D-02 del backend).
- OP-FIS-05: nessun drill-down verso l'elenco operativo (insieme di domande non riproducibile).
- OP-FIS-06 e OP-FIS-07: card dell'ambito e voci di menu (step6, layer app/).
