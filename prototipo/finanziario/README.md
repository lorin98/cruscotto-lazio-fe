# Prototipo UI v2 del finanziario

Prototipo cliccabile per approvare il nuovo linguaggio visivo prima di toccare il codice (branch
`feat/ui-v2-finanziario`). Dati e descrizioni sono **di esempio**, generati in `prototipo.js`: nessun dato reale.

**Aprirlo.** Doppio clic su `index.html`. Servono la rete, per bootstrap-italia ed ECharts da CDN.
- `?statico` toglie le animazioni (per screenshot e test).
- `?apri=filtri` o `?apri=anteprima:SRD01` aprono il pannello dei filtri o il drawer di anteprima.

## Cosa mostra

| Area | Cosa provare |
|---|---|
| Shell | Fascia istituzionale con i loghi Regione Lazio e ARSIAL, barra dell'applicazione con ricerca di un intervento, menu laterale con sottomenu (le aree future sono marcate "presto"), footer con i link. |
| Filtri | Barra fissa con chip rimovibili. Il pannello laterale ha ricerca negli interventi, chip per OG/OS/OP e il conteggio dei risultati ("Mostra 9 interventi"). I filtri restano nell'indirizzo. |
| Panoramica | Tessere KPI con mini-grafici. Sankey dagli obiettivi generali all'impegnato e al pagato. Treemap o sunburst con drill-down OG → OS → intervento. Heatmap delle domande per intervento e anno. Classifica dell'avanzamento con la media. |
| Riepilogo | Tabella con ricerca, ordinamento, scelta delle colonne, paginazione e totali. La riga apre un drawer di anteprima con il dettaglio; c'è una vista grafico con zoom; esporta CSV. |
| Dettaglio intervento | Testata, KPI e schede Sintesi (gauge, cascata dalla dotazione al pagato), Domande, Pagamenti (cumulato con zoom), SIGC (imbuto per fase). |
| Ogni grafico | Interruttore Grafico / Tabella (la tabella equivalente, per l'accessibilità), scarica come immagine, tooltip. Il clic porta al dettaglio dell'intervento. |

## Note per il prodotto

- **Loghi.** `logo-lazio.png` ha lo sfondo a scacchi inciso nei pixel, senza trasparenza vera. Qui c'e' una copia
  ripulita in `img/`, ma serve il file ufficiale. `logo-arsial.png` e' 150×71 px: troppo piccolo per schermi ad alta
  densita', serve un SVG o una versione almeno 3 volte piu' grande.
- **Footer.** Mancano gli indirizzi di Dichiarazione di accessibilita' (obbligatoria per la PA), Privacy e Note legali.
- **Librerie.** Nel prodotto ECharts 6 arriva da npm, con import modulari e renderer SVG. Le icone vengono dagli sprite
  di bootstrap-italia, non da Bootstrap Icons. I token del tema (`:root` di `prototipo.css`) diventano
  `src/shared/ui/tema.css`.
- **Backend.**
  - Treemap e sunburst richiedono la gerarchia intervento → OS → OG, che oggi non e' nelle risposte.
  - Le serie per trimestre richiedono date di pagamento aggregate per periodo.
  - Entrambe sono aggiunte additive alle risposte esistenti, come OP-FE-04.
