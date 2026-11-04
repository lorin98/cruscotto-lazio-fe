# Verifica a vista e dei file del 05/11/2026 (dopo la review step9 passata 2)

App locale: PG locale (schema alla V28), Keycloak 8180, BE dal main sigillato 8bc02e7 (pacchetto del `mvn verify` del gate
step10, `ambiente-prova/app/COMMIT-BE.txt`), FE dev su 5173 a 7a6ca39. Foto in
`ambiente-prova/strumenti-sessione-0df208dd/finale/` (1600 px) e `finale-360/` (360 px), utente P1.

- Finanziario: panoramica, riepilogo (tabella RF011 in testa, grafico sotto), dotazione (barra dell'impegnato, avviso),
  avanzamento (box Dotazione spesa pubblica), SIGC: nessun avviso d'errore.
- Importi SIGC (J-02, J-04): a 1600 px e a 360 px tutte le etichette dei segmenti leggibili (dentro, sopra o a destra della
  barra, col fondo del segmento). TROVATO: con lo spazio riservato a destra l'area si restringe ed ECharts passava a tacche da
  50 M€ attaccate ("50,0 M€100,0 M€150,0 M€"), illeggibili a 360 px. CORRETTO: `splitNumber: 3` e `hideOverlap` sull'asse
  degli importi (0, 100, 200, 300 M€ a 1600 px; una tacca sola a 360 px), con il test in `tests/finanziario-grafici.test.ts`.
- Istituzionale: verifica SMP non SIGC con anno 2025 e 2029 (pill "Anno di riferimento scelto"), senza anno "Scegli l'anno".
- Elenco operativo: pagamenti senza "righe" nei testi.
- XLSX (openpyxl, D-08 Rev. 4): riepilogo TX-0011 (37 righe, 14 colonne), verifica non SIGC 2025 (36 x 21) e pagamenti di
  SRA14 (1.250 x 18): foglio Informazioni attivo e primo (titolo blu, etichette su azzurro, Uso in rosso scuro), foglio Dati
  con intestazione bianca su blu bloccata, filtro automatico, bande, formati `#,##0` e `#,##0.00`, date vere `dd/mm/yyyy`.
  Oltre 5.000 righe (pagamenti PAGATA di SRA03) 400 DATO_NON_VALIDO col messaggio di NFR-06.
- Nota: a 360 px la pagina e' larga 464 px (scorrimento orizzontale), gia' cosi' prima di questo giro: fuori perimetro.
