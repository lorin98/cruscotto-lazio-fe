# Residui della review step9 FULL della card Istituzionale a tabella (31/10/2026)

Verdetto del Judge (`judge.md`): istituzionale PASS, score 81, 0 CRITICO / 0 MAGGIORE, 4 MINORE e 7 COSMETICO accettati
(`../istituzionale-findings-card-tabella.json`). Il PASS dipende da due scelte del Judge, dette all'utente: V-02 declassato
a COSMETICO (con MINORE lo score sarebbe 79) e X-01 fuori punteggio come decisione (contato MINORE: 78).

## Decisioni dell'utente (31/10/2026)
- **D1 (V-01)**: testo vero per il trattino delle domande pagate non SIGC, "dato non confrontabile: la verifica non SIGC
  conta solo le domande saldate al 100%".
- **D2 (X-01)**: nota SIGC per righe, "SIGC: pagate e spesa dal 16/10/aaaa-1 al 15/10/aaaa; ricevute e finanziate,
  domande dell'anno aaaa-1."
- **Niente rework 3** del flusso verifica-smp-non-sigc (budget di 2 gia' usato): i testi nuovi stanno solo nel codice, il
  wireframe approvato (sha256:36cdd0df...) resta invariato e la differenza e' registrata in `deviations_reviewed` del gate
  `wireframe_verifica-smp-non-sigc` nello stato (V-01, X-01 e il residuo del doc sulla fascia delle quattro card per riga).

## Correzioni
| finding | sev. | correzione |
|---|---|---|
| A-01 (+V-03, H-01, X-02, X-C1) | MINORE | valori della tabella senza `nowrap`; lo spazio fisso prima dell'unita' diventa normale (`valoreDellaCella` del kit): l'unita' va a capo, il numero resta intero; gradino sotto 13,5rem (valori 0,9rem, etichette 0,74rem). Misurato nel browser con le spese divise per 200: tabella = contenitore a 1000, 1380, 1440, 1570 e 1680 px (prima 243 px in 219 a 1440 e 204 a 1380). Le quattro card per riga partono da circa 1376 px, non dai 1300 del doc del wireframe (deviazione registrata). |
| A-02 (+A-03) | MINORE | barra, nota e frasi d'errore derivano dallo stato della lettura solo col grant della colonna (`statoDi`); test col solo grant SIGC, una risposta di TX-0016 in cache, `refetchQueries` e `invalidateQueries`: nessuna barra, nessun "Non SIGC", nessuna lettura di TX-0016. |
| H-02 | MINORE | `ColonnaConfronto` ha lo stato esplicito (`attesa`, `errore`, `pronta` con le celle; tipo `StatoColonnaConfronto`); test di una colonna pronta senza la cella di una riga. |
| V-01 | MINORE | testo D1 in `SENZA_DATO_NON_SIGC`; test della lib e della card. |
| V-02 | COSMETICO | `nomeNelTesto` della colonna ("non SIGC") nei motivi sotto la tabella. |
| H-03 | COSMETICO | ogni lettura si ricava una volta per render (`statoDi` con i dati gia' calcolati: totali, periodo, perimetro); una sola regola "l'errore vince sul dato in cache". |
| X-03 | COSMETICO | valori della tabella fermi (niente numero animato): le colonne non cambiano larghezza durante l'ingresso. |
| X-04 | COSMETICO | didascalia con le sole verifiche delle colonne presenti (`titoloTabella`). |
| X-05 | COSMETICO | test: frase del trattino in `visually-hidden`; esercizio dell'intestazione e della nota preso dalla risposta (mock con esercizio 2020). |
| H-04 | COSMETICO | commenti di `aree.ts` e `lib/anteprima.ts` aggiornati al rework 2. |
| V-05 | COSMETICO | provenance dei quattro campi della card nello uiplan ("colonna non SIGC", "colonna SIGC", perimetro di TX-0015); uiplan-validate e fe-project-check rc 0. |
| X-01 | decisione | testo D2 in `notaRiferimenti`. |

Respinti dal Judge: V-04, H-05. Suite 78 file / 1690 test, typecheck e lint verdi. Restano: step8 11/11 sulle cinque feature
sul commit finale (il kit e `tema.css` sono comuni), poi la registrazione dello step9.
